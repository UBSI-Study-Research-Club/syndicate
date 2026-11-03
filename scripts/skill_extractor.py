import os
import sys
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://oadhnihtdnjuviouifcu.supabase.co/rest/v1"

def load_env():
    try:
        with open(r"C:\Users\Infinix\syndicate\.env.local", encoding="utf-8") as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    return line.split("=", 1)[1].strip()
    except Exception as e:
        print(f"[ERROR] Failed to load .env.local: {e}")
    return None

def http_json(url, headers=None, timeout=20):
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[ERROR] {url}: {e}")
        return []

def main():
    print("[SKILL EXTRACTOR] Scanning completed discussions for skill extraction...")
    key = load_env()
    if not key:
        sys.exit(1)
    
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    rooms = http_json(f"{SUPABASE_URL}/rooms?status=eq.COMPLETED", headers=headers)
    
    if not rooms:
        print("[SKILL EXTRACTOR] No completed rooms found.")
        return

    os.makedirs(r"C:\Users\Infinix\syndicate\extracted_skills", exist_ok=True)

    for room in rooms:
        room_id = room["id"]
        title = room.get("title", "Untitled Discussion")
        print(f"[EXTRACTOR] Processing room: {title} ({room_id})")
        
        msgs = http_json(f"{SUPABASE_URL}/messages?room_id=eq.{room_id}&order=created_at.asc", headers=headers)
        
        content = f"# Syndicate Skill: {title}\n\n"
        content += f"Extracted from Syndicate Room ID: `{room_id}`\n\n## Discussion Log & Decisions:\n"
        for m in msgs:
            content += f"- **{m['agent_name']}** [{m['type']}] (Round {m['round_number']}): {m['content'][:200]}...\n"
            
        filename = f"skill_{room_id[:8]}.md"
        filepath = os.path.join(r"C:\Users\Infinix\syndicate\extracted_skills", filename)
        with open(filepath, "w", encoding="utf-8") as out:
            out.write(content)
        print(f"[SKILL EXTRACTOR] Saved skill artifact to {filepath}")

if __name__ == "__main__":
    main()
