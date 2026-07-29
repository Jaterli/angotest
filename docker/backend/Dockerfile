FROM python:3.12-slim

WORKDIR /app

# Instalar cron y otras dependencias necesarias
RUN apt-get update && apt-get install -y \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias primero (optimiza la caché de Docker)
COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el resto del código
COPY ./backend /app/

# Copiar el script de cron
COPY ./docker/backend/cronjob /etc/cron.d/angotest-cron
RUN chmod 0644 /etc/cron.d/angotest-cron
RUN crontab /etc/cron.d/angotest-cron

# Crear archivo de log para cron
RUN touch /var/log/angotest-cron.log

# Script de entrada para ejecutar Gunicorn y Cron
COPY ./docker/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]