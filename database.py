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

        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'open',
            phase_id INTEGER,
            step_id INTEGER,
            resolution TEXT,
            responsible TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (phase_id) REFERENCES phases(id),
            FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS documentation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'general',
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    # Insert default steps if empty
    cursor.execute("SELECT COUNT(*) FROM steps")
    if cursor.fetchone()[0] == 0:
        default_steps = [
            # Pre-Upgrade (phase_id=1)
            (1, "Revisión de notas SAP y documentación del upgrade", "Revisar SAP Notes relevantes, guía de upgrade y prerequisitos documentados por SAP", 1),
            (1, "Verificar versión actual del sistema (kernel, SP, DB)", "Documentar versiones actuales: SAP Kernel, Support Packages, DBMS, OS", 2),
            (1, "Backup completo del sistema (DB + filesystem)", "Realizar backup completo de base de datos y sistema de archivos SAP", 3),
            (1, "Verificar espacio en disco (filesystem y tablespaces)", "Comprobar espacio suficiente en /usr/sap, /sapmnt, /oracle o /hana, y tablespaces", 4),
            (1, "Ejecutar SPDD/SPAU preparation (análisis de modificaciones)", "Analizar objetos modificados que requerirán ajuste manual post-upgrade", 5),
            (1, "Verificar consistencia del repositorio (SLIN, SE06)", "Ejecutar verificaciones de consistencia del repositorio de objetos", 6),
            (1, "Desactivar jobs de fondo no esenciales (SM37/SM36)", "Parar jobs batch que puedan interferir durante el upgrade", 7),
            (1, "Desactivar interfaces y conexiones RFC externas", "Desactivar IDocs, interfaces PI/PO, conexiones RFC a sistemas externos", 8),
            (1, "Comunicar ventana de mantenimiento a usuarios", "Notificar a usuarios la ventana de downtime planificada", 9),
            (1, "Verificar usuarios de upgrade (DDIC, SAP*)", "Verificar que los usuarios técnicos necesarios están desbloqueados y con password correcta", 10),
            (1, "Ejecutar Maintenance Planner / descargar stack", "Descargar el stack de upgrade desde SAP Maintenance Planner", 11),
            (1, "Preparar SUM/DMO tool (extraer y configurar)", "Instalar y configurar Software Update Manager o Database Migration Option", 12),
            (1, "Realizar upgrade en sistema sandbox/test", "Ejecutar el upgrade primero en un sistema de prueba para validar el proceso", 13),
            (1, "Documentar lecciones aprendidas del test", "Registrar issues encontrados en sandbox para anticiparlos en producción", 14),

            # Durante Upgrade (phase_id=2)
            (2, "Parar sistema SAP (stopsap / sapcontrol)", "Detener todos los servicios SAP del sistema a upgrader", 1),
            (2, "Ejecutar SUM - Fase Extraction", "Iniciar SUM y completar la fase de extracción de archivos", 2),
            (2, "Ejecutar SUM - Fase Configuration", "Configurar parámetros del upgrade en SUM (target versions, etc.)", 3),
            (2, "Ejecutar SUM - Fase Preprocessing (checks)", "Ejecutar las verificaciones previas del SUM", 4),
            (2, "Resolver errores de Preprocessing", "Corregir cualquier error detectado en la fase de checks", 5),
            (2, "Ejecutar SUM - Shadow Repository creation", "Crear el repositorio shadow con los nuevos objetos", 6),
            (2, "Ejecutar SUM - Fase Execution (import)", "Importar los nuevos objetos y ejecutar el upgrade core", 7),
            (2, "Monitorear logs durante import (SUMABAP, trans logs)", "Vigilar logs de transporte e importación por errores", 8),
            (2, "Resolver incidencias durante el import", "Atender errores que requieran intervención manual", 9),
            (2, "Ejecutar SPDD - Ajuste de objetos de diccionario", "Realizar ajuste manual de objetos de diccionario modificados", 10),
            (2, "Ejecutar SUM - Fase Postprocessing", "Completar las actividades de post-procesamiento del SUM", 11),
            (2, "Ejecutar SPAU - Ajuste de objetos de repositorio", "Realizar ajuste manual de objetos de repositorio modificados", 12),
            (2, "Upgrade de Kernel a versión target", "Instalar el nuevo kernel SAP si no fue parte del SUM", 13),
            (2, "Iniciar sistema SAP post-upgrade (startsap)", "Arrancar el sistema SAP con la nueva versión", 14),

            # Post-Upgrade (phase_id=3)
            (3, "Verificar arranque correcto de todos los servicios", "Comprobar que todos los work processes, ICM, gateway arrancan correctamente", 1),
            (3, "Verificar logs del sistema (SM21, ST22)", "Revisar system log y dumps ABAP post-arranque", 2),
            (3, "Ejecutar SICK - Installation Check", "Ejecutar la verificación de instalación SAP", 3),
            (3, "Ejecutar actividades post-upgrade (SUM checklist)", "Completar las actividades pendientes indicadas por SUM", 4),
            (3, "Actualizar estadísticas de base de datos", "Regenerar estadísticas de DB para optimizar rendimiento", 5),
            (3, "Regenerar programas ABAP (SGEN)", "Ejecutar generación masiva de programas para optimizar tiempos de respuesta", 6),
            (3, "Verificar y reactivar jobs batch (SM37)", "Reactivar los jobs de fondo desactivados previamente", 7),
            (3, "Verificar y reactivar interfaces", "Reactivar IDocs, conexiones RFC e interfaces PI/PO", 8),
            (3, "Ejecutar pruebas funcionales básicas (smoke test)", "Validar transacciones críticas del negocio", 9),
            (3, "Verificar Add-ons y desarrollos Z", "Comprobar que programas Z y add-ons funcionan correctamente", 10),
            (3, "Aplicar SAP Notes correctivas post-upgrade", "Aplicar notas SAP recomendadas para la nueva versión", 11),
            (3, "Verificar conexiones con sistemas satélite", "Comprobar comunicación con BW, SolMan, PI, GRC, etc.", 12),
            (3, "Validar impresión y spool (SP01/SPAD)", "Verificar que el sistema de impresión funciona correctamente", 13),
            (3, "Ejecutar pruebas de rendimiento", "Comparar tiempos de respuesta pre vs post upgrade", 14),
            (3, "Comunicar fin de mantenimiento a usuarios", "Notificar a usuarios que el sistema está disponible", 15),
            (3, "Documentar versión final del sistema", "Registrar versiones finales: kernel, SP, DBMS, componentes", 16),
        ]
        cursor.executemany(
            "INSERT INTO steps (phase_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
            default_steps,
        )

    # Insert default documentation categories if empty
    cursor.execute("SELECT COUNT(*) FROM documentation")
    if cursor.fetchone()[0] == 0:
        default_docs = [
            ("Plan de Upgrade", "plan", "# Plan de Upgrade SAP\n\nDocumentar aquí el plan general del upgrade:\n\n- Sistema origen:\n- Sistema destino:\n- Ventana de mantenimiento:\n- Equipo responsable:"),
            ("Arquitectura del Sistema", "arquitectura", "# Arquitectura\n\nDocumentar la arquitectura actual y target:\n\n- Servidor App:\n- Servidor DB:\n- OS:\n- DB Version:\n- SAP Version actual:\n- SAP Version target:"),
            ("Procedimiento de Rollback", "rollback", "# Plan de Rollback\n\nDocumentar el procedimiento de rollback en caso de fallo:\n\n1. Criterios para decidir rollback:\n2. Procedimiento de restore:\n3. Tiempo estimado de rollback:"),
            ("Contactos y Escalación", "contactos", "# Contactos\n\n| Rol | Nombre | Teléfono | Email |\n|-----|--------|----------|-------|\n| Basis Lead | | | |\n| DBA | | | |\n| SAP Support | | | |\n| Project Manager | | | |"),
            ("Lecciones Aprendidas", "lecciones", "# Lecciones Aprendidas\n\nDocumentar hallazgos importantes durante el proceso:\n\n"),
        ]
        cursor.executemany(
            "INSERT INTO documentation (title, category, content) VALUES (?, ?, ?)",
            default_docs,
        )

    conn.commit()
    conn.close()
