import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()

# Supabase publishes its current signing key(s) here — no shared secret needed.
_JWKS_URL = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwk_client = PyJWKClient(_JWKS_URL)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Verifies the Supabase-issued JWT using Supabase's public JWKS (ES256).
    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )
    return payload


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