import logging

from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled exception in %s", context.get("view"))
        return response

    if isinstance(response.data, dict) and "detail" not in response.data:
        response.data = {"detail": response.data}
    return response
