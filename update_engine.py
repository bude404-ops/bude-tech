import os
import json
from datetime import datetime

UPGRADE_FILE = "upgrade_store.json"
BACKUP_DIR = "backups"


# ----------------------------------------------------------
# LOAD UPGRADES
# ----------------------------------------------------------

def load_upgrades():
    if not os.path.exists(UPGRADE_FILE):
        return []
    return json.load(open(UPGRADE_FILE))


def save_upgrades(data):
    json.dump(data, open(UPGRADE_FILE, "w"), indent=2)


# ----------------------------------------------------------
# BACKUP SYSTEM
# ----------------------------------------------------------

def backup_file(path):
    if not os.path.exists(path):
        return

    os.makedirs(BACKUP_DIR, exist_ok=True)

    with open(path, "r") as f:
        content = f.read()

    backup_path = f"{BACKUP_DIR}/{path.replace('/', '_')}"

    with open(backup_path, "w") as f:
        f.write(content)


# ----------------------------------------------------------
# APPLY PATCH (FULL FILE REWRITE MODEL)
# ----------------------------------------------------------

def apply_file_update(file_path, new_content):
    backup_file(file_path)

    os.makedirs(os.path.dirname(file_path) or ".", exist_ok=True)

    with open(file_path, "w") as f:
        f.write(new_content)

    return True


# ----------------------------------------------------------
# EXECUTE UPGRADES
# ----------------------------------------------------------

def run_upgrades():
    upgrades = load_upgrades()

    for u in upgrades:
        if u["status"] != "pending":
            continue

        try:
            for change in u["changes"]:

                file_path = change["file"]
                content = change["content"]

                apply_file_update(file_path, content)

            u["status"] = "applied"
            u["applied_at"] = str(datetime.utcnow())

        except Exception as e:
            u["status"] = "failed"
            u["error"] = str(e)

    save_upgrades(upgrades)


# ----------------------------------------------------------
# ADD UPGRADE
# ----------------------------------------------------------

def add_upgrade(title, description, changes):
    upgrades = load_upgrades()

    upgrades.append({
        "id": len(upgrades) + 1,
        "title": title,
        "description": description,
        "changes": changes,
        "status": "pending",
        "created": str(datetime.utcnow())
    })

    save_upgrades(upgrades)
