import os
import json
import requests
from datetime import datetime

# Load brain
with open("brain.md", "r") as f:
    brain = f.read()

# Scan repo
files = []
for root, dirs, fs in os.walk("."):
    if ".git" in root:
        continue
    for file in fs:
        files.append(os.path.join(root, file))

state = {
    "files": files[:200],
    "file_count": len(files),
    "time": str(datetime.utcnow())
}

prompt = f"""
You are BudE evolution engine.

BRAIN:
{brain}

REPOSITORY STATE:
{json.dumps(state, indent=2)}

Return ONLY valid JSON:

{{
  "actions": [
    {{
      "type": "create_file",
      "path": "path/to/file",
      "content": "file content"
    }}
  ],
  "reasoning": "why changes are needed"
}}
"""

api_key = os.environ.get("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "llama-3.1-70b-versatile",
    "messages": [
        {"role": "system", "content": "You output only JSON."},
        {"role": "user", "content": prompt}
    ],
    "temperature": 0.4
}

r = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers=headers,
    json=payload
)

data = r.json()

try:
    content = data["choices"][0]["message"]["content"]
    result = json.loads(content)
except Exception as e:
    print("AI output error:")
    print(data)
    raise e

for action in result.get("actions", []):
    if action["type"] == "create_file":
        os.makedirs(os.path.dirname(action["path"]), exist_ok=True)
        with open(action["path"], "w") as f:
            f.write(action["content"])

print("Evolution cycle complete")
