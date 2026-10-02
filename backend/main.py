from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import os
import re
from db import SafeDatabase
import gemini_service
import tts_service
from supabase_service import GuestStorageService
from guest_analytics import compute_guest_metrics, analyze_and_compute_past_data

app = FastAPI(
    title="IndicBI API",
    description="Voice-First Business Intelligence & Field CRM for Bharat in Indian Languages",
    version="1.2.0"
)

# Enable CORS for Next.js development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    text: str
    language: Optional[str] = "en-IN"
    force_mode: Optional[str] = None
    guest_id: Optional[str] = None
    auto_save: Optional[bool] = False

class GuestLogRequest(BaseModel):
    guest_id: str
    client_name: str
    action: Optional[str] = "order"
    amount: Optional[float] = 0.0
    status: Optional[str] = "completed"
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None

class DeleteActivityRequest(BaseModel):
    guest_id: str
    activity_id: int

class SupabaseConfigRequest(BaseModel):
    url: str
    key: str

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "IndicBI Backend",
        "version": "1.2.0",
        "database": "SQLite & Supabase Ready",
        "models": gemini_service.FALLBACK_MODELS,
        "supabase": GuestStorageService.get_status()
    }

@app.get("/api/dashboard")
def get_dashboard():
    return SafeDatabase.get_dashboard_summary()

@app.get("/api/visits")
def get_visits(limit: int = 15):
    return SafeDatabase.get_recent_visits(limit=limit)

# =============================================================================
# SUPABASE STORAGE CONFIG & STATUS
# =============================================================================
@app.get("/api/supabase/status")
def get_supabase_status():
    return GuestStorageService.get_status()

@app.post("/api/supabase/config")
def set_supabase_config(req: SupabaseConfigRequest):
    return GuestStorageService.set_supabase_config(req.url, req.key)

# =============================================================================
# GUEST CRM ACTIVITIES & METRICS
# =============================================================================
@app.get("/api/guest/activities")
def get_guest_activities(guest_id: str):
    if not guest_id:
        raise HTTPException(status_code=400, detail="guest_id is required.")
    activities = GuestStorageService.get_activities(guest_id)
    metrics = compute_guest_metrics(activities)
    return {
        "guest_id": guest_id,
        "count": len(activities),
        "activities": activities,
        "metrics": metrics,
        "storage": GuestStorageService.get_status()
    }

@app.post("/api/guest/log")
def log_guest_activity(req: GuestLogRequest):
    return GuestStorageService.insert_activity(
        guest_id=req.guest_id,
        client_name=req.client_name,
        action=req.action or "order",
        amount=float(req.amount or 0.0),
        status=req.status or "completed",
        notes=req.notes,
        follow_up_date=req.follow_up_date
    )

@app.post("/api/guest/delete")
def delete_guest_activity(req: DeleteActivityRequest):
    success = GuestStorageService.delete_activity(req.guest_id, req.activity_id)
    return {"success": success}

# =============================================================================
# UNIFIED NATURAL LANGUAGE & VOICE PROCESSING
# =============================================================================
@app.post("/api/query")
async def process_user_query(req: QueryRequest):
    raw_text = req.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")

    guest_id = req.guest_id or "guest_default"
    is_dashboard_user = bool(req.guest_id and req.guest_id != "landing_demo")

    # Detect language from input speech/script or fallback
    effective_lang = gemini_service.detect_script_language(raw_text, req.language)

    # 1. Intent Classification
    if req.force_mode:
        mode = req.force_mode.lower()
    elif is_dashboard_user:
        # User is on their private dashboard: ONLY focus on their own data!
        dash_intent = gemini_service.classify_dashboard_intent(raw_text)
        if dash_intent == "clarification":
            mode = "clarification"
        elif dash_intent == "retrieve":
            mode = "guest_computation"
        else:
            mode = "crm"
    else:
        # General landing page query
        mode = gemini_service.classify_intent(raw_text)

    # =========================================================================
    # SELF-CORRECTION / CLARIFICATION MODE
    # =========================================================================
    if mode == "clarification":
        clarification_msg = gemini_service.get_clarification_message(effective_lang)
        audio_b64 = await tts_service.generate_neural_audio_base64(clarification_msg, effective_lang)
        return {
            "mode": "clarification",
            "success": False,
            "needs_clarification": True,
            "user_query": raw_text,
            "spoken_answer": clarification_msg,
            "audio_data": audio_b64,
            "message": clarification_msg
        }

    # =========================================================================
    # MODE A: GUEST PAST DATA COMPUTATIONS & CALCULATIONS
    # =========================================================================
    if mode == "guest_computation":
        past_activities = GuestStorageService.get_activities(guest_id)
        calc_result = analyze_and_compute_past_data(raw_text, past_activities, effective_lang)
        
        spoken_text = calc_result["spoken_answer"]
        audio_b64 = await tts_service.generate_neural_audio_base64(spoken_text, effective_lang)

        return {
            "mode": "guest_computation",
            "success": True,
            "guest_id": guest_id,
            "user_query": raw_text,
            "spoken_answer": spoken_text,
            "audio_data": audio_b64,
            "numbers": calc_result.get("numbers", {}),
            "chart": calc_result.get("chart"),
            "chart_data": calc_result.get("chart_data", []),
            "words_summary": calc_result.get("words_summary", [])
        }

    # =========================================================================
    # MODE B: BI ANALYTICS (Natural Language -> SQL -> Visual Charts)
    # =========================================================================
    if mode == "bi":
        sql_query = gemini_service.generate_sql(raw_text, effective_lang)
        query_result = SafeDatabase.execute_read_query(sql_query)

        if not query_result["success"]:
            fallback_sql = "SELECT p.name as product_name, SUM(o.quantity) as total_quantity, SUM(o.amount) as total_sales FROM orders o JOIN products p ON o.product_id = p.id GROUP BY p.name ORDER BY total_sales DESC LIMIT 5"
            query_result = SafeDatabase.execute_read_query(fallback_sql)
            sql_query = fallback_sql

        visual_data = gemini_service.generate_bi_visual_response(
            raw_text, sql_query, query_result["rows"], effective_lang
        )

        spoken_text = visual_data["spoken_answer"]
        audio_b64 = await tts_service.generate_neural_audio_base64(spoken_text, effective_lang)

        return {
            "mode": "bi",
            "success": True,
            "user_query": raw_text,
            "sql": sql_query,
            "data": query_result["rows"],
            "row_count": query_result["row_count"],
            "chart": visual_data["chart"],
            "spoken_answer": spoken_text,
            "audio_data": audio_b64,
            "insights": visual_data.get("insights", [])
        }

    # =========================================================================
    # MODE C: FIELD SALES CRM (Spoken Notes -> Entity Extraction & Verification)
    # =========================================================================
    else:
        crm_data = gemini_service.extract_crm_data(raw_text, effective_lang)
        entries = crm_data.get("entries", [])
        
        # If auto_save requested or on landing demo, commit to database immediately
        should_auto_save = req.auto_save or (guest_id == "landing_demo")
        saved_entries = []

        if should_auto_save:
            for entry in entries:
                client_name = entry.get("client_name", "Customer / Order")
                action = entry.get("action", "order")
                amount = float(entry.get("amount", 0.0) or 0.0)
                status = entry.get("status", "completed")
                notes = entry.get("notes")
                follow_up_date = entry.get("follow_up_date")

                saved_guest = GuestStorageService.insert_activity(
                    guest_id=guest_id,
                    client_name=client_name,
                    action=action,
                    amount=amount,
                    status=status,
                    notes=notes,
                    follow_up_date=follow_up_date
                )

                SafeDatabase.insert_visit(
                    client_name=client_name,
                    action=action,
                    amount=amount,
                    status=status,
                    notes=notes,
                    follow_up_date=follow_up_date,
                    rep_name=f"Guest ({guest_id[:8]})"
                )

                saved_entries.append({
                    **entry,
                    "id": saved_guest.get("id"),
                    "synced_to_supabase": saved_guest.get("synced_to_supabase", False)
                })
        else:
            saved_entries = entries

        spoken_conf = crm_data.get("spoken_confirmation", "Activity recognized. Please verify details on screen.")
        audio_b64 = await tts_service.generate_neural_audio_base64(spoken_conf, effective_lang)

        return {
            "mode": "crm",
            "success": True,
            "requires_verification": not should_auto_save,
            "guest_id": guest_id,
            "user_query": raw_text,
            "detected_language": crm_data.get("detected_language", "Regional"),
            "detected_code": crm_data.get("detected_code", effective_lang),
            "entries": saved_entries,
            "spoken_answer": spoken_conf,
            "audio_data": audio_b64
        }

@app.post("/api/voice-upload")
async def handle_voice_upload(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en-IN"),
    guest_id: Optional[str] = Form("guest_default"),
    auto_save: Optional[bool] = Form(False)
):
    """
    Direct voice upload endpoint for mobile browsers.
    Accepts raw audio recorded from mobile microphone, transcribes via Gemini multimodal AI,
    and runs the full deterministic CRM/analytics pipeline.
    """
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")
        
        mime = file.content_type or "audio/webm"
        transcript = gemini_service.transcribe_audio_with_gemini(
            audio_bytes=audio_bytes,
            mime_type=mime,
            language_hint=language or "en-IN"
        )
        
        if not transcript:
            raise HTTPException(status_code=400, detail="Could not detect speech in audio. Please speak clearly.")
            
        req = QueryRequest(
            text=transcript,
            language=language,
            guest_id=guest_id,
            auto_save=auto_save
        )
        result = await process_user_query(req)
        result["transcribed_text"] = transcript
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")

