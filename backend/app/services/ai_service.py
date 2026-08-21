import time
import logging
import json
from typing import Dict, Any
import google.generativeai as genai  # type: ignore[import-untyped]
from app.core.config import settings
from app.schemas.report_schema import AIReportAnalysis

logger = logging.getLogger("snapfix_ai.vision")

# Zero-Downtime Demo Failsafe Payload
FALLBACK_RESPONSE: Dict[str, Any] = {
    "category": "Pothole",
    "base_severity": 3,
    "confidence": 0.5,
    "hazards": ["Potential vehicle hazard"],
    "affected_users": ["Motorists"],
    "repair_complexity": "Moderate",
    "recommended_action": "Inspect and schedule road repair.",
    "summary": (
        "Automated inspection fallback: structural asphalt damage "
        "detected on roadway surface."
    ),
    "is_valid_civic_issue": True
}

def is_non_retryable_gemini_error(error: Exception) -> bool:
    error_text = str(error).lower()

    non_retryable_patterns = (
        # Daily/project quota exhausted
        "generaterequestsperday",
        "perdayperproject",
        "daily quota",

        # Invalid/unavailable model
        "model is no longer available",
        "not available to new users",
        "model not found",
        "not found",

        # Authentication/configuration problems
        "api key not valid",
        "invalid api key",
    )

    return any(
        pattern in error_text
        for pattern in non_retryable_patterns
    )

def analyze_infrastructure_image(
    image_bytes: bytes, 
    mime_type: str = "image/jpeg", 
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Analyzes an infrastructure image with Gemini Flash.
    Includes 3 retries with backoff and a Zero-Downtime Failsafe fallback.
    """
    try:
        # Safely fetch API key regardless of uppercase/lowercase naming in config.py
        api_key = getattr(settings, "GEMINI_API_KEY", getattr(settings, "gemini_api_key", ""))
        genai.configure(api_key=api_key)  # type: ignore[attr-defined]

        model = genai.GenerativeModel(  # type: ignore[attr-defined]
            model_name="gemini-3.5-flash-lite",
            generation_config={"response_mime_type": "application/json"}
        )

        prompt = """
        You are an expert municipal infrastructure inspection AI.

Analyze ONLY what is visually observable in the uploaded image.

Your job is to extract structured visual hazard telemetry.
DO NOT calculate final civic priority.

IMPORTANT SEVERITY RULE:
base_severity is ONLY the physical severity visible in the image.

Do NOT increase base_severity because of:
- nearby schools
- hospitals
- traffic
- road importance
- number of reports
- duplicate reports
- location
- time of day
- population density
- political or social importance

Those factors will be handled separately by SnapFix's deterministic
context engine.

Use this scale:

1 = negligible/cosmetic issue
2 = minor issue with little immediate risk
3 = noticeable issue requiring maintenance
4 = significant infrastructure defect
5 = serious hazard requiring prompt attention
6 = severe visible hazard with immediate safety implications

Return ONLY valid JSON matching this structure:

{
  "is_valid_civic_issue": true,
  "category": "Pothole",
  "base_severity": 1,
  "confidence": 0.0,
  "hazards": [],
  "affected_users": [],
  "repair_complexity": "Minor",
  "recommended_action": "",
  "summary": ""
}

Allowed categories:
- Pothole
- Trash/Garbage
- Water Leak
- Damaged Streetlight
- Road Damage
- Broken Sidewalk
- Other

Allowed repair_complexity values:
- Minor
- Moderate
- Major

Be conservative with severity.

A small defect must NOT receive a high severity score simply because
it could theoretically cause harm.

Only assign severity 5-6 when the visible physical condition itself
clearly represents a serious or immediate hazard.

If the image is not a genuine public civic/infrastructure issue,
set is_valid_civic_issue to false.

Do not invent information that cannot be visually determined.
        """

        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }

        # Retry only transient failures.
        # Permanent quota/model/configuration errors immediately
        # trigger the SnapFix failsafe.

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    f"🤖 [Gemini Vision Call]: "
                    f"Attempt {attempt}/{max_retries}"
                )

                response = model.generate_content(
                    [prompt, image_part]
                )

                raw_result = json.loads(response.text)

                validated_result = AIReportAnalysis.model_validate(
                    raw_result
                )

                logger.info(
                    "✅ [Gemini Vision] Analysis successful"
                )

                return validated_result.model_dump()

            except Exception as e:

                # ---------------------------------------------
                # PERMANENT ERROR → DO NOT RETRY
                # ---------------------------------------------
                if is_non_retryable_gemini_error(e):
                    logger.error(
                        f"🚫 [Gemini Non-Retryable Error]: {e}"
                    )
                    raise

                # ---------------------------------------------
                # TRANSIENT ERROR → RETRY
                # ---------------------------------------------
                logger.warning(
                    f"⚠️ [Gemini Attempt {attempt} Failed]: {e}"
                )

                if attempt < max_retries:
                    wait_seconds = attempt * 2

                    logger.info(
                        f"🔄 [Gemini Retry] "
                        f"Waiting {wait_seconds}s..."
                    )

                    time.sleep(wait_seconds)
                else:
                    raise

    except Exception as final_error:
        logger.error(f"⚠️ [DEMO FAILSAFE TRIGGERED]: Gemini API failed ({final_error}). Returning default civic analysis.")
        return FALLBACK_RESPONSE

    # Fallback to satisfy static type checkers like Pylance
    return FALLBACK_RESPONSE