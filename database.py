import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "upgrade_sap.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS phases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phase_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            responsible TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
        );
    """)

    # Insert default phases if empty
    cursor.execute("SELECT COUNT(*) FROM phases")
    if cursor.fetchone()[0] == 0:
        default_phases = [
            (1, "Pre-Upgrade", "Actividades previas al upgrade del sistema SAP"),
            (2, "Durante Upgrade", "Actividades durante la ejecución del upgrade"),
            (3, "Post-Upgrade", "Actividades posteriores al upgrade del sistema SAP"),
        ]
        cursor.executemany(
            "INSERT INTO phases (sort_order, name, description) VALUES (?, ?, ?)",
            default_phases,
        )

    conn.commit()
    conn.close()
