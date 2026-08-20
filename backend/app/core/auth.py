import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()
# auto_error=False: don't 403 when there's no Authorization header at all —
# used on endpoints that must work for anonymous/guest submissions too.
security_optional = HTTPBearer(auto_error=False)

# Supabase publishes its current signing key(s) here — no shared secret needed.
_JWKS_URL = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwk_client = PyJWKClient(_JWKS_URL)


def _decode(token: str) -> dict:
    signing_key = _jwk_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256"],
        audience="authenticated",
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verifies the Supabase-issued JWT using Supabase's public JWKS (ES256).
    Raises 401 if the token is missing, expired, or invalid.
    Use this for endpoints that REQUIRE login (e.g. GET /reports/mine).
    """
    try:
        payload = _decode(credentials.credentials)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )
    return payload


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_optional),
) -> dict | None:
    """
    Same JWT verification as get_current_user, but never raises. Returns
    None when there's no Authorization header (guest) OR when the token is
    invalid/expired — the caller decides how to treat "no user" rather than
    the request failing outright. Use this for endpoints that should work
    for both logged-in and anonymous callers (e.g. POST /reports/).
    """
    if credentials is None:
        return None
    try:
        return _decode(credentials.credentials)
    except jwt.PyJWTError:
        return None


def require_municipal(user: dict = Depends(get_current_user)) -> dict:
    """
    Gatekeeper dependency for municipal-only endpoints.
    Role lives in app_metadata, which users cannot self-edit
    (unlike user_metadata) — only settable via the Supabase dashboard/admin API.
    """
    role = (user.get("app_metadata") or {}).get("role")
    if role != "municipal_staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only municipal accounts can update report status.",
        )
    return user