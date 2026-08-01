import io
import imagehash
from PIL import Image


def generate_image_hash(image_bytes: bytes) -> str:
    """
    Generates a perceptual difference hash (dhash) from raw image bytes.
    Perceptual hashes remain similar/identical even if the image is slightly resized or compressed.
    """
    image = Image.open(io.BytesIO(image_bytes))
    hash_value = imagehash.dhash(image)
    return str(hash_value)