# SAP Upgrade Tracker

Aplicación web para el seguimiento técnico de un proceso de upgrade SAP.

## Tecnologías

- **Backend:** Python + FastAPI (sin ORM)
- **Frontend:** HTML5, Vanilla JS, Tailwind CSS
- **Base de datos:** SQLite

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución

```bash
uvicorn main:app --reload --port 8000
```

Acceder a: http://localhost:8000

## Estructura

```
├── main.py          # API FastAPI
├── database.py      # Módulo SQLite
├── requirements.txt
└── static/
    ├── index.html   # Frontend
    └── app.js       # Lógica JS
```
