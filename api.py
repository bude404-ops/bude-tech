#!/usr/bin/env python3
"""
BudE Dashboard API Bridge
Repo: https://github.com/bude404-ops/Bude-Tech
Run: python api.py
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
QUEUE_PATH = os.path.join(REPO_ROOT, "system", "queue.json")
GITHUB_REPO = "bude404-ops/Bude-Tech"

def ensure_system():
    os.makedirs(os.path.dirname(QUEUE_PATH), exist_ok=True)
    if not os.path.exists(QUEUE_PATH):
        with open(QUEUE_PATH, "w") as f:
            json.dump([], f)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_file(path):
    return send_from_directory('.', path)

@app.route('/queue', methods=['GET'])
def get_queue():
    ensure_system()
    with open(QUEUE_PATH, "r") as f:
        return jsonify(json.load(f))

@app.route('/queue', methods=['POST'])
def post_queue():
    ensure_system()
    data = request.get_json()
    with open(QUEUE_PATH, "w") as f:
        json.dump(data, f, indent=2)
    return jsonify({"status": "saved", "repo": GITHUB_REPO})

@app.route('/cmd', methods=['POST'])
def command():
    cmd = request.get_json()
    action = cmd.get('action')
    
    if action == 'evolve':
        return jsonify({"status": "queued", "repo": GITHUB_REPO, "msg": "Evolution cycle queued"})
    
    return jsonify({"status": "unknown", "action": action, "repo": GITHUB_REPO})

if __name__ == '__main__':
    print(f"BudE API running for {GITHUB_REPO}")
    print("Open http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
