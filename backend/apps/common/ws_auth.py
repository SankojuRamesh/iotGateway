from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        validated = AccessToken(token)
        user = User.objects.get(id=validated["user_id"])
    except (TokenError, InvalidToken, User.DoesNotExist):
        return AnonymousUser()
    return user


class JWTAuthMiddleware:
    """
    Authenticates Channels WebSocket connections using a `?token=<jwt>` query
    param, since browsers can't set Authorization headers on WS handshakes.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope.get("query_string", b"").decode())
        token = query_string.get("token", [None])[0]
        scope["user"] = (
            await get_user_from_token(token) if token else AnonymousUser()
        )
        return await self.app(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
