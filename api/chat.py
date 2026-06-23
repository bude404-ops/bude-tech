#!/usr/bin/env python3
"""
BudE Chat API v0.1
Real-time AI responses via Groq
"""

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GITHUB_REPO = "bude404-ops/Bude-Tech"

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_msg = data.get('message', '')
    history = data.get('history', [])
    
    # Build context about BudE
    system_prompt = f"""You are BudE, a self-evolving AI operating system.
Repo: {GITHUB_REPO}
You help users control and understand the BudE system.
You can answer questions about code, crypto, business, and system status.
Be concise, helpful, and technical when needed."""
    
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-5:]:  # Last 5 messages
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": user_msg})
    
    for model in MODELS:
        try:
            resp = requests.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": model, "messages": messages, "temperature": 0.7, "max_tokens": 1024},
                timeout=30
            )
            resp.raise_for_status()
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            return jsonify({"response": content, "model": model})
        except Exception as e:
            continue
    
    return jsonify({"error": "All models failed"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
