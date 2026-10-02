import json
import re
from typing import List, Dict, Any
from gemini_service import call_gemini_with_fallback, clean_json_response

def compute_guest_metrics(activities: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculates deterministic mathematical KPIs on the guest's past records."""
    if not activities:
        return {
            "total_revenue": 0.0,
            "total_transactions": 0,
            "average_deal": 0.0,
            "highest_sale": 0.0,
            "clients_count": 0,
            "client_breakdown": [],
            "action_breakdown": [],
            "recent_trend": []
        }

    total_rev = 0.0
    amounts = []
    clients: Dict[str, float] = {}
    actions: Dict[str, int] = {}
    date_map: Dict[str, float] = {}

    for a in activities:
        amt = float(a.get("amount", 0.0) or 0.0)
        c_name = (a.get("client_name") or "General Client").strip()
        act = (a.get("action") or "order").strip().lower()
        c_date = str(a.get("created_at") or a.get("follow_up_date") or "Today")[:10]

        total_rev += amt
        if amt > 0:
            amounts.append(amt)
        clients[c_name] = clients.get(c_name, 0.0) + amt
        actions[act] = actions.get(act, 0) + 1
        date_map[c_date] = date_map.get(c_date, 0.0) + amt

    client_breakdown = [
        {"client": c, "amount": round(val, 2)}
        for c, val in sorted(clients.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    action_breakdown = [
        {"action": act.title(), "count": cnt}
        for act, cnt in actions.items()
    ]

    recent_trend = [
        {"date": d, "revenue": round(val, 2)}
        for d, val in sorted(date_map.items())[-7:]
    ]

    avg_deal = (total_rev / len(amounts)) if amounts else 0.0
    highest = max(amounts) if amounts else 0.0

    return {
        "total_revenue": round(total_rev, 2),
        "total_transactions": len(activities),
        "average_deal": round(avg_deal, 2),
        "highest_sale": round(highest, 2),
        "clients_count": len(clients),
        "client_breakdown": client_breakdown,
        "action_breakdown": action_breakdown,
        "recent_trend": recent_trend
    }

def analyze_and_compute_past_data(
    question: str,
    activities: List[Dict[str, Any]],
    language: str = "en"
) -> Dict[str, Any]:
    """
    Manipulates and computes the guest's past records in response to natural language,
    presenting data in numbers, charts, and first-person words.
    """
    metrics = compute_guest_metrics(activities)

    # Empty history handling
    if not activities:
        if 'te' in language:
            spoken = "మీరు మీ గెస్ట్ ఐడీ కింద ఇప్పటివరకు ఎటువంటి రికార్డులను నమోదు చేయలేదు. దయచేసి పైన ఉన్న మైక్ ఉపయోగించి మీ మొదటి ఆర్డర్ లేదా విజిట్‌ను నమోదు చేయండి."
        elif 'hi' in language:
            spoken = "आपने अपने गेस्ट आईडी के तहत अभी तक कोई डेटा दर्ज नहीं किया है। कृपया ऊपर दिए गए माइक से अपना पहला ऑर्डर या विज़िट रिकॉर्ड करें।"
        else:
            spoken = "You have not logged any CRM records under your Guest ID yet. Speak or type above to record your first order or client meeting!"

        return {
            "mode": "guest_computation",
            "success": True,
            "has_data": False,
            "spoken_answer": spoken,
            "numbers": metrics,
            "chart": {"type": "bar", "xKey": "client", "yKey": "amount", "title": "Your Client Revenue"},
            "chart_data": [],
            "words_summary": [spoken]
        }

    prompt = f"""
    You are an intelligent business analyst assistant for a field sales professional.
    The user's query: "{question}"
    Language Requested: {language}
    
    Here is the user's complete past CRM activity dataset:
    {json.dumps(activities, ensure_ascii=False, indent=2)}

    Computed Summary Numbers:
    - Total Revenue: ₹{metrics['total_revenue']}
    - Total Entries: {metrics['total_transactions']}
    - Average Deal: ₹{metrics['average_deal']}
    - Highest Order: ₹{metrics['highest_sale']}
    - Client Breakdown: {json.dumps(metrics['client_breakdown'], ensure_ascii=False)}
    - Action Breakdown: {json.dumps(metrics['action_breakdown'], ensure_ascii=False)}

    CRITICAL RULES:
    1. Base your answer SOLELY on the user's CRM activity dataset provided above.
    2. If the user asks "what was my last order", find the most recent order activity in their dataset (e.g. Dr. Reddy, ₹12,000 for 200 strips). Do NOT invent or mention any external company or city like Kolkata/Balaji Traders!
    3. If the user asks for "total amount in activities ledger", "total sales", or sum, state the EXACT total: ₹{metrics['total_revenue']:,} across {metrics['total_transactions']} entries.
    4. If the user asks about a client (e.g. Dr. Reddy, Apollo, Siddu, Ajay), quote the exact amount, action, notes, and date from their dataset.
    5. Address the user directly from THEIR PERSPECTIVE (using 'You', 'Your total is ₹...', 'Your last order was...', 'You recorded...').

    Provide a JSON response with:
    1. "spoken_answer": 1-2 conversational sentences in the EXACT language requested ({language}) answering their question with exact computed figures (₹, Lakhs).
    2. "numbers": An object with relevant computed stats:
       - "primary_metric": A key number (e.g. "₹15,000" or "3 Orders" or "₹4,200 avg")
       - "primary_label": Label for the metric (e.g. "Total Revenue Computed", "Average Deal Size")
       - "secondary_metric": Another relevant metric
       - "secondary_label": Label
    3. "chart": An object for Recharts:
       - "type": "bar" (for client comparisons) or "line" (for trends over dates) or "pie" (for action/status share)
       - "xKey": key name for X axis (e.g. "client", "date", "action")
       - "yKey": value key name (e.g. "amount", "revenue", "count")
       - "title": Clean title for the chart in English
    4. "chart_data": An array of manipulated objects (maximum 8) ready to feed directly into the chart.
    5. "words_summary": An array of 2-3 clear bullet points in language ({language}) analyzing what the past data shows.

    Output ONLY pure JSON.
    """

    try:
        raw_res = call_gemini_with_fallback(prompt)
        cleaned = clean_json_response(raw_res)
        parsed = json.loads(cleaned)
        
        # Merge deterministic numbers if not provided
        if "numbers" not in parsed:
            parsed["numbers"] = {
                "primary_metric": f"₹{metrics['total_revenue']:,.2f}",
                "primary_label": "Your Total Revenue",
                "secondary_metric": f"₹{metrics['average_deal']:,.2f}",
                "secondary_label": "Your Average Deal"
            }
        if "chart_data" not in parsed or not parsed["chart_data"]:
            parsed["chart_data"] = metrics["client_breakdown"] if metrics["client_breakdown"] else metrics["action_breakdown"]

        return {
            "mode": "guest_computation",
            "success": True,
            "has_data": True,
            "spoken_answer": parsed.get("spoken_answer", f"Here is your computed past data summary."),
            "numbers": parsed.get("numbers", {}),
            "chart": parsed.get("chart", {"type": "bar", "xKey": "client", "yKey": "amount", "title": "Your Sales by Client"}),
            "chart_data": parsed.get("chart_data", metrics["client_breakdown"]),
            "words_summary": parsed.get("words_summary", [f"Total sales recorded: ₹{metrics['total_revenue']:,}"])
        }
    except Exception as e:
        # Fallback to local deterministic computation
        chart_data = metrics["client_breakdown"] if metrics["client_breakdown"] else metrics["action_breakdown"]
        return {
            "mode": "guest_computation",
            "success": True,
            "has_data": True,
            "spoken_answer": f"You have logged ₹{metrics['total_revenue']:,.2f} in revenue across {metrics['total_transactions']} transactions, with an average ticket of ₹{metrics['average_deal']:,.2f}.",
            "numbers": {
                "primary_metric": f"₹{metrics['total_revenue']:,.2f}",
                "primary_label": "Your Total Revenue",
                "secondary_metric": f"₹{metrics['average_deal']:,.2f}",
                "secondary_label": "Your Average Deal"
            },
            "chart": {
                "type": "bar",
                "xKey": "client" if metrics["client_breakdown"] else "action",
                "yKey": "amount" if metrics["client_breakdown"] else "count",
                "title": "Your Past Activities Breakdown"
            },
            "chart_data": chart_data,
            "words_summary": [
                f"Total transactions logged: {metrics['total_transactions']}",
                f"Highest recorded sale: ₹{metrics['highest_sale']:,.2f}",
                f"Unique clients serviced: {metrics['clients_count']}"
            ]
        }
