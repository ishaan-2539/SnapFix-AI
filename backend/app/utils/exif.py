import io
import logging
from PIL import Image, ExifTags

logger = logging.getLogger(__name__)

def extract_exif_gps(image_bytes: bytes) -> tuple[float | None, float | None]:
    """
    Parses raw image bytes and extracts GPS (latitude, longitude) if available in EXIF metadata.
    Returns (latitude, longitude) or (None, None) if missing/invalid.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Safe dynamic lookup to avoid Pylance type-stub warnings
        get_exif = getattr(image, "_getexif", None)
        if not get_exif:
            return None, None
            
        exif = get_exif()
        if not exif:
            return None, None

        gps_info = {}
        for tag, value in exif.items():
            tag_name = ExifTags.TAGS.get(tag, tag)
            if tag_name == "GPSInfo":
                for gps_tag in value:
                    sub_tag_name = ExifTags.GPSTAGS.get(gps_tag, gps_tag)
                    gps_info[sub_tag_name] = value[gps_tag]

        if not gps_info:
            return None, None

        def convert_to_degrees(value):
            d, m, s = value
            return float(d) + (float(m) / 60.0) + (float(s) / 3600.0)

        lat = convert_to_degrees(gps_info["GPSLatitude"])
        if gps_info.get("GPSLatitudeRef") != "N":
            lat = -lat

        lon = convert_to_degrees(gps_info["GPSLongitude"])
        if gps_info.get("GPSLongitudeRef") != "E":
            lon = -lon

        return round(lat, 6), round(lon, 6)

    except Exception as e:
        logger.warning(f"Could not extract EXIF location: {e}")
        return None, None