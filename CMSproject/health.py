from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    """Liveness probe for Docker / Render: always 200 while the app is up."""
    return JsonResponse({'status': 'ok'})
