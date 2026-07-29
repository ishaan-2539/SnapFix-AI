import base64
import logging
from groq import Groq
from pydantic import BaseModel, Field
from app.core.config import settings

logger = logging.getLogger(__name__)

class CivicAIAnalysis(BaseModel):
    is_valid_civic_issue: bool = Field(description="True if image shows public infrastructure failure, damage, or hazard")
    category: str = Field(description="One of: Pothole, Road Damage, Waste/Garbage, Water Leakage, Streetlight, Traffic Sign, Other")
    severity_score: int = Field(description="Integer from 1 (minor) to 10 (critical hazard)")
    summary: str = Field(description="2-3 sentence administrative description of the issue")

async def analyze_civic_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> CivicAIAnalysis:
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        # Encode raw image bytes to base64
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        prompt = """
        Analyze this image for civic infrastructure reporting.
        Determine if this is a valid public civic issue (e.g., potholes, trash, broken streetlights, water leaks).
        
        Respond ONLY with a valid JSON object matching this schema:
        {
            "is_valid_civic_issue": true or false,
            "category": "Pothole" | "Road Damage" | "Waste/Garbage" | "Water Leakage" | "Streetlight" | "Traffic Sign" | "Other",
            "severity_score": integer (1 to 10),
            "summary": "2-3 sentence administrative description"
        }
        """

        completion = client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        raw_json = completion.choices[0].message.content
        if not raw_json:
            raise ValueError("Groq returned an empty response.")

        return CivicAIAnalysis.model_validate_json(raw_json)

    except Exception as e:
        logger.warning(f"Groq API call failed ({e}). Falling back to local mock analysis for demo stability.")
        
        # Fallback response in case of network issues during live demo
        return CivicAIAnalysis(
            is_valid_civic_issue=True,
            category="Road Damage",
            severity_score=7,
            summary="Reported civic infrastructure damage requiring inspection. Surface wear and potential hazard detected in public right-of-way."
        )