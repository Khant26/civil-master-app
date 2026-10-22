# Civil Master Solution - Django CMS API
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000 \
    MEDIA_ROOT=/app/media

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Static files are baked into the image (served by WhiteNoise). The dummy key
# is only used for this build step; real settings come from the runtime env.
RUN SECRET_KEY=collectstatic-build-only DEBUG=False python manage.py collectstatic --noinput \
    && useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/media /app/logs \
    && chown -R appuser:appuser /app/media /app/logs

USER appuser

EXPOSE 8000
VOLUME ["/app/media"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health/', timeout=4).status == 200 else 1)"

# Run migrations separately, e.g.: docker run --env-file .env <image> python manage.py migrate
CMD ["sh", "-c", "exec gunicorn CMSproject.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${GUNICORN_WORKERS:-2} --threads ${GUNICORN_THREADS:-4} --timeout 120 --access-logfile - --log-level info"]
