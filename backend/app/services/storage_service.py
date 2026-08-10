"""
Persistent photo storage via Supabase Storage.

Why this file exists: Render's free tier runs on an ephemeral filesystem.
Any file written to local disk (the old approach) is lost the moment the
service sleeps and wakes back up, or redeploys — Render boots a fresh
container from the last deploy, not a resumed copy of the previous one.

Supabase Storage is a separate, persistent object store (S3-compatible),
completely outside the app container, so uploaded photos survive every
restart, sleep cycle, and redeploy.
"""

import logging
from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Lazily creates a single shared Supabase client, reused across requests
    instead of reconnecting on every upload.
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _supabase_client


def upload_report_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads image bytes to the Supabase Storage bucket and returns a public URL.

    Raises the underlying exception on failure — the caller (reports.py)
    is responsible for deciding how to handle an upload failure, the same
    way ai_service.py's caller decides whether to use a fallback.
    """
    client = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    client.storage.from_(bucket).upload(
        path=filename,
        file=file_bytes,
        file_options={"content-type": content_type},
    )

    public_url = client.storage.from_(bucket).get_public_url(filename)
    logger.info(f"Uploaded {filename} to Supabase Storage bucket '{bucket}'")
    return public_url