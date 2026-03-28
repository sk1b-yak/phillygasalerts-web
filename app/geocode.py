import hashlib
import json
import os
from threading import Lock


DEFAULT_CACHE_PATH = os.path.join(os.path.dirname(__file__), "geocode_cache.json")

_cache_lock = Lock()
_cache_mtime = None
_cache_data = {}


def _load_cache(cache_path: str):
    global _cache_mtime, _cache_data

    if not os.path.exists(cache_path):
        _cache_mtime = None
        _cache_data = {}
        return _cache_data

    mtime = os.path.getmtime(cache_path)
    if _cache_mtime == mtime:
        return _cache_data

    with open(cache_path, "r", encoding="utf-8") as cache_file:
        _cache_data = json.load(cache_file)
    _cache_mtime = mtime
    return _cache_data


def get_cached_coordinates(address: str, cache_path: str | None = None):
    if not address:
        return None

    resolved_cache_path = cache_path or os.environ.get("GEOCODE_CACHE_PATH", DEFAULT_CACHE_PATH)
    cache_key = hashlib.md5(address.encode("utf-8")).hexdigest()

    with _cache_lock:
        cache = _load_cache(resolved_cache_path)
        coords = cache.get(cache_key)

    if not coords or not isinstance(coords, list) or len(coords) != 2:
        return None

    lat, lng = coords
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None
