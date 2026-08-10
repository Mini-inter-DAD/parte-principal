import hashlib
import json
import os
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
MANIFEST = CACHE_DIR / "manifest.json"

BYPASS_ENV = "PIPELINE_NO_CACHE"


def is_disabled() -> bool:
    return os.environ.get(BYPASS_ENV, "").strip() not in ("", "0", "false", "False")


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def file_hash(path: Path) -> str:
    return text_hash(path.read_bytes().decode("utf-8", errors="replace"))


def _read_manifest() -> dict:
    if not MANIFEST.exists():
        return {}
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def get_cache(step: str, fingerprint: str):
    if is_disabled():
        return None

    entry = _read_manifest().get(step)
    cache_file = CACHE_DIR / f"{step}.json"

    if entry and entry.get("fingerprint") == fingerprint and cache_file.exists():
        print(f"[cache] {step}: cache válido, pulando recomputo")
        return json.loads(cache_file.read_text(encoding="utf-8"))

    return None


def set_cache(step: str, fingerprint: str, value):
    if is_disabled():
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    manifest = _read_manifest()
    manifest[step] = {"fingerprint": fingerprint}
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    (CACHE_DIR / f"{step}.json").write_text(
        json.dumps(value, ensure_ascii=False, indent=4),
        encoding="utf-8",
    )
