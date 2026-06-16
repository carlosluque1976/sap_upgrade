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
            planned_start DATE,
            planned_end DATE,
            actual_start DATE,
            actual_end DATE,
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
            (1, "Freeze Desarrollos", "Congelación de desarrollos durante todo el proceso de upgrade"),
            (2, "Upgrade I1D (Desarrollo)", "Upgrade del sistema de desarrollo I1D"),
            (3, "Correcciones ABAP Post-Upgrade", "Correcciones de código ABAP tras el upgrade en desarrollo"),
            (4, "Pruebas Técnicas Sin Integraciones", "Pruebas técnicas post upgrade ERP+IS-U sin integraciones"),
            (5, "Refresh y Upgrade I1Q (Calidad)", "Refresh de I1Q con datos de I1P y upgrade del sistema de calidad"),
            (6, "Pruebas Técnicas Integradas", "Pruebas técnicas integradas post upgrade ERP+IS-U"),
            (7, "UAT Post-Upgrade", "User Acceptance Testing post upgrade ERP+IS-U"),
            (8, "Upgrade I1P (Producción)", "Upgrade del sistema productivo I1P"),
        ]
        cursor.executemany(
            "INSERT INTO phases (sort_order, name, description) VALUES (?, ?, ?)",
            default_phases,
        )

    # Insert default steps if empty
    cursor.execute("SELECT COUNT(*) FROM steps")
    if cursor.fetchone()[0] == 0:
        # phase_id, title, description, sort_order, planned_start, planned_end
        default_steps = [
            # Fase 1: Freeze Desarrollos (14/5 - 6/7)
            (1, "Comunicar freeze de desarrollos a equipos", "Notificar a todos los equipos de desarrollo el inicio del freeze", 1, "2026-05-14", "2026-05-14"),
            (1, "Bloquear transportes en I1D", "Configurar bloqueo de órdenes de transporte en sistema de desarrollo", 2, "2026-05-14", "2026-05-14"),
            (1, "Documentar desarrollos pendientes/en curso", "Registrar estado de todos los desarrollos en curso que quedan congelados", 3, "2026-05-14", "2026-05-15"),
            (1, "Verificar que no hay transportes en cola", "Comprobar que no quedan transportes pendientes de liberar", 4, "2026-05-14", "2026-05-14"),

            # Fase 2: Upgrade I1D (18/5 - 22/5, 5 días)
            (2, "Backup completo I1D (DB + filesystem)", "Realizar backup completo de la base de datos y filesystem del sistema I1D", 1, "2026-05-18", "2026-05-18"),
            (2, "Verificar espacio en disco y tablespaces I1D", "Comprobar espacio disponible en filesystems y tablespaces de I1D", 2, "2026-05-18", "2026-05-18"),
            (2, "Verificar usuarios técnicos (DDIC, SAP*)", "Verificar usuarios de upgrade desbloqueados y con passwords correctas", 3, "2026-05-18", "2026-05-18"),
            (2, "Desactivar jobs batch en I1D", "Parar todos los jobs de fondo no esenciales", 4, "2026-05-18", "2026-05-18"),
            (2, "Ejecutar SUM - Fases Extraction y Configuration", "Iniciar SUM y completar extracción y configuración", 5, "2026-05-18", "2026-05-19"),
            (2, "Ejecutar SUM - Preprocessing checks", "Ejecutar verificaciones previas del SUM en I1D", 6, "2026-05-19", "2026-05-19"),
            (2, "Ejecutar SUM - Shadow Repository + Execution", "Crear shadow repository e importar objetos en I1D", 7, "2026-05-19", "2026-05-21"),
            (2, "Ejecutar SPDD - Ajuste objetos diccionario", "Ajuste manual de objetos de diccionario modificados", 8, "2026-05-21", "2026-05-21"),
            (2, "Ejecutar SPAU - Ajuste objetos repositorio", "Ajuste manual de objetos de repositorio modificados", 9, "2026-05-21", "2026-05-22"),
            (2, "Ejecutar SUM - Postprocessing", "Completar fase de post-procesamiento del SUM", 10, "2026-05-22", "2026-05-22"),
            (2, "Upgrade Kernel a versión target en I1D", "Instalar nuevo kernel SAP en I1D", 11, "2026-05-22", "2026-05-22"),
            (2, "Arrancar I1D y verificar servicios", "Iniciar sistema y comprobar work processes, ICM, gateway", 12, "2026-05-22", "2026-05-22"),
            (2, "Verificar logs (SM21, ST22) y ejecutar SICK", "Revisar system log, dumps y ejecutar installation check", 13, "2026-05-22", "2026-05-22"),

            # Fase 3: Correcciones ABAP Post-Upgrade (25/5 - 5/6, 9 días)
            (3, "Identificar errores ABAP post-upgrade (ST22, syntax check)", "Ejecutar verificaciones de sintaxis y revisar dumps para identificar programas con errores", 1, "2026-05-25", "2026-05-26"),
            (3, "Corregir programas Z con errores de sintaxis", "Adaptar desarrollos propios (Z*) a la nueva versión", 2, "2026-05-26", "2026-05-29"),
            (3, "Corregir user-exits y BADIs con incompatibilidades", "Revisar y adaptar ampliaciones que no compilan", 3, "2026-05-28", "2026-06-02"),
            (3, "Adaptar interfaces IS-U específicas", "Corregir interfaces y procesos específicos de IS-U (facturación, lectura contadores, etc.)", 4, "2026-05-29", "2026-06-03"),
            (3, "Ejecutar SGEN - Regenerar programas", "Generación masiva de programas para optimizar rendimiento", 5, "2026-06-03", "2026-06-04"),
            (3, "Verificar Add-ons y componentes IS-U", "Comprobar compatibilidad de add-ons con nueva versión", 6, "2026-06-04", "2026-06-05"),
            (3, "Smoke test básico de transacciones críticas", "Validar transacciones básicas ERP e IS-U funcionan", 7, "2026-06-05", "2026-06-05"),

            # Fase 4: Pruebas Técnicas Sin Integraciones (8/6 - 12/6, 5 días)
            (4, "Verificar procesos de facturación IS-U", "Ejecutar ciclo de facturación en entorno aislado", 1, "2026-06-08", "2026-06-09"),
            (4, "Verificar lectura de contadores y mediciones", "Probar procesos de gestión de medidores y lecturas", 2, "2026-06-08", "2026-06-09"),
            (4, "Verificar procesos de gestión de contratos", "Probar alta, baja y modificación de contratos", 3, "2026-06-09", "2026-06-10"),
            (4, "Verificar procesos FI/CO básicos", "Probar contabilizaciones, cierres, reporting", 4, "2026-06-10", "2026-06-11"),
            (4, "Verificar impresión y spool (SP01/SPAD)", "Comprobar que el sistema de impresión funciona", 5, "2026-06-11", "2026-06-11"),
            (4, "Documentar resultados pruebas técnicas", "Registrar resultados OK/KO de cada prueba", 6, "2026-06-12", "2026-06-12"),

            # Fase 5: Refresh y Upgrade I1Q (2/6 - 12/6)
            (5, "Refresh I1Q con datos de I1P (system copy)", "Copiar base de datos de producción a sistema de calidad", 1, "2026-06-02", "2026-06-04"),
            (5, "Post-actividades de system copy I1Q", "Ajustar parámetros, usuarios, conexiones RFC post-refresh", 2, "2026-06-04", "2026-06-04"),
            (5, "Ejecutar SUM en I1Q - Upgrade completo", "Ejecutar upgrade en sistema de calidad I1Q", 3, "2026-06-08", "2026-06-11"),
            (5, "Ejecutar SPDD/SPAU en I1Q", "Aplicar ajustes de diccionario y repositorio (importar desde I1D)", 4, "2026-06-11", "2026-06-11"),
            (5, "Import correcciones ABAP de I1D a I1Q", "Transportar correcciones ABAP realizadas en desarrollo", 5, "2026-06-12", "2026-06-12"),
            (5, "Verificar arranque y logs I1Q", "Comprobar que I1Q arranca correctamente post-upgrade", 6, "2026-06-12", "2026-06-12"),

            # Fase 6: Pruebas Técnicas Integradas (15/6 - 26/6, 10 días)
            (6, "Verificar interfaces PI/PO con sistemas externos", "Comprobar comunicación con sistemas satélite", 1, "2026-06-15", "2026-06-17"),
            (6, "Verificar IDocs entrada/salida", "Probar procesamiento de IDocs en ambas direcciones", 2, "2026-06-15", "2026-06-17"),
            (6, "Verificar conexiones RFC con BW, SolMan", "Comprobar conectividad con sistemas de reporting y monitorización", 3, "2026-06-17", "2026-06-18"),
            (6, "Prueba integral ciclo facturación IS-U con integraciones", "Facturación completa con envío a FI, impresión, IDocs", 4, "2026-06-18", "2026-06-20"),
            (6, "Prueba integral gestión de medidores con AMI", "Verificar integración con sistemas de telelectura", 5, "2026-06-18", "2026-06-20"),
            (6, "Prueba de procesos batch completos", "Ejecutar jobs batch críticos de negocio end-to-end", 6, "2026-06-22", "2026-06-24"),
            (6, "Prueba de rendimiento comparativa", "Comparar tiempos de respuesta pre vs post upgrade", 7, "2026-06-24", "2026-06-25"),
            (6, "Corrección de incidencias detectadas", "Resolver issues encontrados durante las pruebas integradas", 8, "2026-06-22", "2026-06-26"),
            (6, "Documentar resultados pruebas integradas", "Registrar resultados y go/no-go para UAT", 9, "2026-06-26", "2026-06-26"),

            # Fase 7: UAT Post-Upgrade (17/6 - 1/7, 11 días)
            (7, "Preparar entorno y datos para UAT", "Configurar datos de prueba y accesos para usuarios clave", 1, "2026-06-17", "2026-06-18"),
            (7, "UAT - Procesos de facturación", "Usuarios validan procesos de facturación IS-U", 2, "2026-06-19", "2026-06-23"),
            (7, "UAT - Procesos de gestión de clientes", "Usuarios validan alta/baja/modificación de clientes y contratos", 3, "2026-06-19", "2026-06-23"),
            (7, "UAT - Procesos de lectura y medición", "Usuarios validan procesos de contadores y lecturas", 4, "2026-06-23", "2026-06-25"),
            (7, "UAT - Procesos financieros (FI/CO)", "Usuarios validan contabilidad y controlling", 5, "2026-06-23", "2026-06-25"),
            (7, "UAT - Reporting y extractores BW", "Usuarios validan informes y extracción de datos", 6, "2026-06-25", "2026-06-27"),
            (7, "Corrección de incidencias UAT", "Resolver issues reportados por usuarios durante UAT", 7, "2026-06-23", "2026-06-30"),
            (7, "Sign-off UAT - Aprobación go-live", "Obtener aprobación formal de usuarios para go-live", 8, "2026-06-30", "2026-07-01"),

            # Fase 8: Upgrade I1P - Producción (2/7 - 6/7, 3 días)
            (8, "Comunicar ventana de mantenimiento a usuarios", "Notificar downtime planificado a todos los usuarios", 1, "2026-07-01", "2026-07-01"),
            (8, "Backup completo I1P (DB + filesystem)", "Backup completo previo al upgrade de producción", 2, "2026-07-02", "2026-07-02"),
            (8, "Parar sistema I1P y desactivar interfaces", "Detener SAP y desconectar interfaces externas", 3, "2026-07-02", "2026-07-02"),
            (8, "Ejecutar SUM en I1P - Upgrade producción", "Ejecutar upgrade completo en sistema productivo", 4, "2026-07-02", "2026-07-04"),
            (8, "Ejecutar SPDD/SPAU en I1P", "Aplicar ajustes (importar desde I1D/I1Q)", 5, "2026-07-04", "2026-07-04"),
            (8, "Import transportes de correcciones a I1P", "Importar todas las correcciones ABAP validadas", 6, "2026-07-04", "2026-07-05"),
            (8, "Arrancar I1P y verificar servicios", "Iniciar producción y verificar todos los servicios", 7, "2026-07-05", "2026-07-05"),
            (8, "Reactivar interfaces y jobs batch", "Reconectar interfaces y reactivar jobs programados", 8, "2026-07-05", "2026-07-05"),
            (8, "Smoke test producción + monitorización", "Verificar transacciones críticas y monitorizar rendimiento", 9, "2026-07-05", "2026-07-06"),
            (8, "Comunicar fin de mantenimiento", "Notificar disponibilidad del sistema a usuarios", 10, "2026-07-06", "2026-07-06"),
            (8, "Soporte intensivo post go-live", "Equipo en standby para resolver incidencias inmediatas", 11, "2026-07-06", "2026-07-06"),
        ]
        cursor.executemany(
            "INSERT INTO steps (phase_id, title, description, sort_order, planned_start, planned_end) VALUES (?, ?, ?, ?, ?, ?)",
            default_steps,
        )

    # Insert default documentation categories if empty
    cursor.execute("SELECT COUNT(*) FROM documentation")
    if cursor.fetchone()[0] == 0:
        default_docs = [
            ("Plan de Upgrade", "plan", "# Plan de Upgrade SAP ERP+IS-U\n\n## Proyecto: Upgrade I1D -> I1P (V2)\n\n- **Sistema origen (DEV):** I1D\n- **Sistema calidad:** I1Q\n- **Sistema producción:** I1P\n- **Componentes:** ERP + IS-U (Industry Solution Utilities)\n- **Ventana total:** 14/05/2026 - 06/07/2026 (37 días)\n- **Equipo responsable:**\n\n## Secuencia de Upgrade\n1. Freeze desarrollos\n2. Upgrade I1D (5 días)\n3. Correcciones ABAP (9 días)\n4. Pruebas técnicas sin integraciones (5 días)\n5. Refresh I1Q + Upgrade I1Q (5 días)\n6. Pruebas técnicas integradas (10 días)\n7. UAT (11 días)\n8. Upgrade I1P producción (3 días)"),
            ("Arquitectura del Sistema", "arquitectura", "# Arquitectura Landscape\n\n## Sistemas\n| SID | Tipo | Servidor App | Servidor DB | OS | DB |\n|-----|------|-------------|-------------|----|----|  \n| I1D | Desarrollo | | | | |\n| I1Q | Calidad | | | | |\n| I1P | Producción | | | | |\n\n## Versiones\n- SAP ERP Version actual:\n- SAP IS-U Version actual:\n- SAP Kernel actual:\n- Target SAP Version:\n- Target Kernel:"),
            ("Procedimiento de Rollback", "rollback", "# Plan de Rollback\n\n## Criterios de Rollback\n1. Error crítico no resoluble en SUM durante upgrade\n2. Fallo masivo en pruebas post-upgrade sin corrección viable\n3. Tiempo de downtime excede ventana aprobada\n\n## Procedimiento\n1. Parar SUM si está en ejecución\n2. Restaurar backup de base de datos\n3. Restaurar filesystem (/usr/sap, kernel)\n4. Verificar consistencia\n5. Arrancar sistema con versión anterior\n\n## Tiempos estimados de rollback\n- I1D: ~2h\n- I1Q: ~3h\n- I1P: ~4h"),
            ("Contactos y Escalación", "contactos", "# Contactos del Proyecto\n\n| Rol | Nombre | Teléfono | Email |\n|-----|--------|----------|-------|\n| Basis Lead | | | |\n| DBA | | | |\n| ABAP Lead | | | |\n| IS-U Funcional | | | |\n| SAP Support | | | |\n| Project Manager | | | |\n| Infra/OS | | | |\n\n## Escalación SAP\n- Customer Number:\n- Incidente base: \n- Prioridad: Very High durante upgrade"),
            ("Lecciones Aprendidas", "lecciones", "# Lecciones Aprendidas\n\nDocumentar hallazgos durante el proceso:\n\n## Upgrade I1D\n\n## Correcciones ABAP\n\n## Upgrade I1Q\n\n## UAT\n\n## Upgrade I1P\n"),
        ]
        cursor.executemany(
            "INSERT INTO documentation (title, category, content) VALUES (?, ?, ?)",
            default_docs,
        )

    conn.commit()
    conn.close()
