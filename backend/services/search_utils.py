import re
import unicodedata


def normalize_search(value: str | None) -> str:
    text = str(value or "").strip().casefold()
    text = " ".join(text.split())
    return "".join(
        char
        for char in unicodedata.normalize("NFD", text)
        if unicodedata.category(char) != "Mn"
    )


def compact_search(value: str | None) -> str:
    return re.sub(r"\s+", "", normalize_search(value))
