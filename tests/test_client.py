import urllib.request
import re

url = "http://localhost:3000/dashboard"
html = urllib.request.urlopen(url).read().decode('utf-8')
scripts = re.findall(r'src="([^"]+\.js)"', html)
print(f"Total scripts found: {len(scripts)}")

failed = 0
for s in scripts:
    script_url = s if s.startswith("http") else f"http://localhost:3000{s}"
    try:
        content = urllib.request.urlopen(script_url).read()
        # print(f"OK: {s} ({len(content)} bytes)")
    except Exception as e:
        print(f"FAILED: {script_url} -> {e}")
        failed += 1

print(f"Finished checking scripts. Failed: {failed}")
