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


def hash_distance(hash_a: str, hash_b: str) -> int:
    """
    Computes the Hamming distance between two dhash hex strings.

    dhash is a 64-bit hash, so distance ranges 0-64. Lower = more visually
    similar; 0 = identical. This replaces naive string equality so that
    re-compressed / slightly-recropped photos of the same pothole still
    match instead of silently becoming duplicate reports.
    """
    return imagehash.hex_to_hash(hash_a) - imagehash.hex_to_hash(hash_b)