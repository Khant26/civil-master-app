import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        'Create a Django superuser from DJANGO_SUPERUSER_USERNAME, '
        'DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD if they are set '
        'and the user does not exist yet (used by build.sh; safe to re-run).'
    )

    def handle(self, *args, **options):
        # SUPERUSER_* are the names used by the earlier version of this command.
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME') or os.environ.get('SUPERUSER_USERNAME')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD') or os.environ.get('SUPERUSER_PASSWORD')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL') or os.environ.get('SUPERUSER_EMAIL', '')

        if not username or not password:
            self.stdout.write('DJANGO_SUPERUSER_USERNAME/PASSWORD not set; skipping superuser creation.')
            return

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Superuser "{username}" already exists; nothing to do.')
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
