#!/usr/bin/env python3
"""
BudE Agent Swarm v0.1
Coordinates multiple agents working in parallel
"""

import os
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor

AGENTS = {
    "coder": "agents/coder_agent.py",
    "researcher": "agents/researcher_agent.py",
    "crypto": "agents/crypto_analyst_agent.py",
    "architect": "agents/system_architect_agent.py",
}

class Swarm:
    def __init__(self):
        self.results = {}
    
    def run_all(self, task):
        """Run all agents in parallel."""
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                name: executor.submit(self._run_agent, path, task)
                for name, path in AGENTS.items()
                if os.path.exists(path)
            }
            
            for name, future in futures.items():
                try:
                    self.results[name] = future.result(timeout=30)
                except Exception as e:
                    self.results[name] = f"Error: {e}"
        
        return self.results
    
    def _run_agent(self, path, task):
        """Execute single agent."""
        result = subprocess.run(
            ["python", path, task],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout if result.returncode == 0 else result.stderr
    
    def delegate(self, task_type, task):
        """Delegate to specific agent."""
        agent_map = {
            "code": "coder",
            "research": "researcher",
            "crypto": "crypto",
            "design": "architect",
        }
        agent = agent_map.get(task_type, "coder")
        return self._run_agent(AGENTS.get(agent, "agents/coder_agent.py"), task)

swarm = Swarm()
