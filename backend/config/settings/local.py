from .base import *  # noqa: F401,F403

# Host-machine development with no external services required: no Postgres,
# no Redis, no MQTT broker. This is the default (see manage.py/asgi.py/
# wsgi.py) whenever DJANGO_SETTINGS_MODULE isn't already set by the
# environment - which is exactly the case running outside Docker. Inside
# docker-compose, .env sets DJANGO_SETTINGS_MODULE=config.settings.dev as a
# real container env var, which wins over this default and uses Postgres/
# Redis/Mosquitto as normal.

DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}

# No Celery worker/broker needed for local dev: any .delay() call just runs
# synchronously in-process instead of requiring Redis + a worker process.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
