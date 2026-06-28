from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading
import brain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

thread = None


@app.get("/status")
def status():
    return brain.get_status()


@app.get("/logs")
def logs():
    return brain.load_memory()["logs"][-50:]


@app.get("/tasks")
def tasks():
    return brain.load_tasks()


@app.post("/task/add/{text}")
def add_task(text: str):
    brain.create_task(text)
    return {"ok": True}


@app.post("/worker/create/{name}/{role}")
def worker(name: str, role: str):
    brain.create_worker(name, role)
    return {"created": name}


@app.post("/auto/toggle")
def auto():
    global thread
    brain.auto_enabled = not brain.auto_enabled

    if brain.auto_enabled and (thread is None or not thread.is_alive()):
        thread = threading.Thread(target=brain.auto_mode)
        thread.start()

    return {"auto": brain.auto_enabled}
