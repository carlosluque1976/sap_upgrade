from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os

from database import get_connection, init_db

app = FastAPI(title="SAP Upgrade Tracker")

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


# --- Pydantic models ---

class StepCreate(BaseModel):
    phase_id: int
    title: str
    description: Optional[str] = None
    responsible: Optional[str] = None
    sort_order: Optional[int] = 0


class StepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    responsible: Optional[str] = None
    sort_order: Optional[int] = None


class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: Optional[str] = "medium"
    phase_id: Optional[int] = None
    step_id: Optional[int] = None
    responsible: Optional[str] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    phase_id: Optional[int] = None
    step_id: Optional[int] = None
    resolution: Optional[str] = None
    responsible: Optional[str] = None


class DocCreate(BaseModel):
    title: str
    category: Optional[str] = "general"
    content: Optional[str] = ""


class DocUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None


# --- Events ---

@app.on_event("startup")
def startup():
    init_db()


# --- Routes: Frontend ---

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


# --- Routes: API ---

@app.get("/api/dashboard")
def get_dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            p.id, p.name, p.description, p.sort_order,
            COUNT(s.id) as total_steps,
            SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completed_steps,
            SUM(CASE WHEN s.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_steps,
            SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) as pending_steps,
            SUM(CASE WHEN s.status = 'blocked' THEN 1 ELSE 0 END) as blocked_steps
        FROM phases p
        LEFT JOIN steps s ON p.id = s.phase_id
        GROUP BY p.id
        ORDER BY p.sort_order
    """)

    phases = []
    total_all = 0
    completed_all = 0

    for row in cursor.fetchall():
        total = row["total_steps"] or 0
        completed = row["completed_steps"] or 0
        total_all += total
        completed_all += completed
        progress = round((completed / total * 100), 1) if total > 0 else 0

        phases.append({
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "total_steps": total,
            "completed_steps": completed,
            "in_progress_steps": row["in_progress_steps"] or 0,
            "pending_steps": row["pending_steps"] or 0,
            "blocked_steps": row["blocked_steps"] or 0,
            "progress": progress,
        })

    overall_progress = round((completed_all / total_all * 100), 1) if total_all > 0 else 0

    conn.close()
    return {
        "overall_progress": overall_progress,
        "total_steps": total_all,
        "completed_steps": completed_all,
        "phases": phases,
    }


@app.get("/api/phases")
def get_phases():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM phases ORDER BY sort_order")
    phases = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return phases


@app.get("/api/steps")
def get_steps(phase_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()

    if phase_id:
        cursor.execute(
            "SELECT * FROM steps WHERE phase_id = ? ORDER BY sort_order, id",
            (phase_id,),
        )
    else:
        cursor.execute("SELECT * FROM steps ORDER BY phase_id, sort_order, id")

    steps = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return steps


@app.get("/api/steps/{step_id}")
def get_step(step_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM steps WHERE id = ?", (step_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Step not found")
    return dict(row)


@app.post("/api/steps", status_code=201)
def create_step(step: StepCreate):
    conn = get_connection()
    cursor = conn.cursor()

    # Verify phase exists
    cursor.execute("SELECT id FROM phases WHERE id = ?", (step.phase_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Phase not found")

    cursor.execute(
        """INSERT INTO steps (phase_id, title, description, responsible, sort_order)
           VALUES (?, ?, ?, ?, ?)""",
        (step.phase_id, step.title, step.description, step.responsible, step.sort_order),
    )
    conn.commit()
    step_id = cursor.lastrowid

    cursor.execute("SELECT * FROM steps WHERE id = ?", (step_id,))
    new_step = dict(cursor.fetchone())
    conn.close()
    return new_step


@app.put("/api/steps/{step_id}")
def update_step(step_id: int, step: StepUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM steps WHERE id = ?", (step_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Step not found")

    updates = []
    values = []
    for field, value in step.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        values.append(value)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(step_id)
        query = f"UPDATE steps SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()

    cursor.execute("SELECT * FROM steps WHERE id = ?", (step_id,))
    updated_step = dict(cursor.fetchone())
    conn.close()
    return updated_step


@app.delete("/api/steps/{step_id}")
def delete_step(step_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM steps WHERE id = ?", (step_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Step not found")

    cursor.execute("DELETE FROM steps WHERE id = ?", (step_id,))
    conn.commit()
    conn.close()
    return {"message": "Step deleted"}


# --- Routes: Incidents ---

@app.get("/api/incidents")
def get_incidents(status: Optional[str] = None, severity: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM incidents WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    incidents = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return incidents


@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")
    return dict(row)


@app.post("/api/incidents", status_code=201)
def create_incident(incident: IncidentCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO incidents (title, description, severity, phase_id, step_id, responsible)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (incident.title, incident.description, incident.severity,
         incident.phase_id, incident.step_id, incident.responsible),
    )
    conn.commit()
    inc_id = cursor.lastrowid
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (inc_id,))
    new_inc = dict(cursor.fetchone())
    conn.close()
    return new_inc


@app.put("/api/incidents/{incident_id}")
def update_incident(incident_id: int, incident: IncidentUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    updates = []
    values = []
    for field, value in incident.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        values.append(value)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(incident_id)
        query = f"UPDATE incidents SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()

    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated


@app.delete("/api/incidents/{incident_id}")
def delete_incident(incident_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM incidents WHERE id = ?", (incident_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")
    cursor.execute("DELETE FROM incidents WHERE id = ?", (incident_id,))
    conn.commit()
    conn.close()
    return {"message": "Incident deleted"}


# --- Routes: Documentation ---

@app.get("/api/docs")
def get_docs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documentation ORDER BY id")
    docs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return docs


@app.get("/api/docs/{doc_id}")
def get_doc(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documentation WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)


@app.post("/api/docs", status_code=201)
def create_doc(doc: DocCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO documentation (title, category, content) VALUES (?, ?, ?)",
        (doc.title, doc.category, doc.content),
    )
    conn.commit()
    doc_id = cursor.lastrowid
    cursor.execute("SELECT * FROM documentation WHERE id = ?", (doc_id,))
    new_doc = dict(cursor.fetchone())
    conn.close()
    return new_doc


@app.put("/api/docs/{doc_id}")
def update_doc(doc_id: int, doc: DocUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM documentation WHERE id = ?", (doc_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")

    updates = []
    values = []
    for field, value in doc.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = ?")
        values.append(value)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(doc_id)
        query = f"UPDATE documentation SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()

    cursor.execute("SELECT * FROM documentation WHERE id = ?", (doc_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated


@app.delete("/api/docs/{doc_id}")
def delete_doc(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM documentation WHERE id = ?", (doc_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    cursor.execute("DELETE FROM documentation WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    return {"message": "Document deleted"}
