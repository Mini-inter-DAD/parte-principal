#! /bin/bash
set -euo pipefail

echo "Aplicando migrações do banco..."
python -u -m database.run_migrations

echo "Executando pipeline..."
python -u run.py

echo "Iniciando app em foreground..."
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000

echo -e "\033[32mApp inicializado!\033[0m"
