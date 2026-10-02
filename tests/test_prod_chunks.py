import urllib.request
import re

url = "https://artistic-car-buddy-face.trycloudflare.com/dashboard"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile)'})
html = urllib.request.urlopen(req).read().decode('utf-8')
scripts = re.findall(r'src="([^"]+\.js)"', html)
print(f"Total scripts found: {len(scripts)}")

failed = 0
for s in scripts:
    script_url = s if s.startswith("http") else f"https://artistic-car-buddy-face.trycloudflare.com{s}"
    try:
        s_req = urllib.request.Request(script_url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile)'})
        content = urllib.request.urlopen(s_req).read()
    except Exception as e:
        print(f"FAILED: {script_url} -> {e}")
        failed += 1

print(f"Result: {len(scripts) - failed}/{len(scripts)} loaded successfully. Failed: {failed}")
