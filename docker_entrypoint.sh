#!/bin/bash
set -euo pipefail

echo "Verificando se o banco já está atualizado..."
if python -m database.verify_pipeline; then
    echo "Dados já atualizados; pulando pipeline e seed."
else
    echo "Executando pipeline..."
    python -u run.py

    echo "Atualizando jogadores no banco..."
    python -m database.seed_players
fi

echo "Iniciando app em foreground..."
python -m uvicorn backend.app:app --host 0.0.0.0 --port 8000

echo -e "\033[32mApp inicializado!\033[0m"
