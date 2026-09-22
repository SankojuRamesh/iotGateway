from .base import *  # noqa: F401,F403

DEBUG = False

# Tests run against sqlite for speed/portability (no Postgres dependency in CI/dev);
# production and docker-compose always use Postgres (see base.py).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}

CELERY_TASK_ALWAYS_EAGER = True
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
