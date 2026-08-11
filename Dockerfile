FROM python:3.12-slim

# Anotação de portas e volumes recomendados
EXPOSE 8000
VOLUME /app/data/cache
VOLUME /app/output

WORKDIR /app

# Garante logs sem buffer no deploy
ENV PYTHONUNBUFFERED=1

# Instalando dependências
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiando App
COPY . .

# Inicializando App
RUN chmod +x docker_entrypoint.sh
CMD [ "./docker_entrypoint.sh" ]
