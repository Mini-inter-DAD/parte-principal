import os
import json
import re
import time
from groq import Groq
from pathlib import Path

from dotenv import load_dotenv

from pipeline.cache import get_cache, set_cache, file_hash, text_hash

load_dotenv()


client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

ROOT = Path(__file__).resolve().parent.parent
missing_json = ROOT / "data" / "missing.json"
players_json = ROOT / "output" / "players.json"

MISSING = json.loads(missing_json.read_text(encoding="utf-8"))

MODEL = "llama-3.3-70b-versatile"
TEMPERATURE = 0.1

SYSTEM_PROMPT = (
    "You are a football analyst. For each player, estimate their EA FC 26 overall rating "
    "as an integer between 55 and 91. Base it on real-world reputation, league level, and performance. "
    "Respond ONLY with a JSON array of integers in the same order as the input. "
    "Example: [72, 68, 81, 75]. No explanation, no text, just the array."
)


def estimate_batch(batch: list) -> list:
    players_text = "\n".join(
        f"{i+1}. {p['name']} | {p['pos']} | {p['nation']}"
        for i, p in enumerate(batch)
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": players_text
            }
        ],
        max_tokens=200,
        temperature=TEMPERATURE,
    )

    raw = response.choices[0].message.content.strip()
    numbers = json.loads(re.search(r'\[.*?\]', raw, re.DOTALL).group())
    return numbers


def main():
    players = json.loads(players_json.read_text(encoding="utf-8"))

    fingerprint = text_hash(
        file_hash(missing_json)
        + json.dumps(players, ensure_ascii=False, sort_keys=True)
        + text_hash(SYSTEM_PROMPT)
        + MODEL
        + str(TEMPERATURE)
    )

    generated = get_cache("fill_missing", fingerprint)
    if generated is not None:
        print(f"[cache] {len(generated)} overalls recuperados do cache")
        all_players = players + generated
        players_json.write_text(
            json.dumps(all_players, ensure_ascii=False, indent=4),
            encoding="utf-8",
        )
        print(f"Total: {len(all_players)} jogadores")
        return

    generated = []

    BATCH_SIZE = 10
    for i in range(0, len(MISSING), BATCH_SIZE):
        batch = MISSING[i:i + BATCH_SIZE]
        print(f"Estimando overalls {i+1}-{i+len(batch)}...")
        try:
            overalls = estimate_batch(batch)
            for player, overall in zip(batch, overalls):
                generated.append({
                    "nation": player["nation"],
                    "wc_name": player["name"],
                    "ea_id": None,
                    "name": player["name"],
                    "common_name": None,
                    "overall": overall,
                    "position": player["pos"],
                    "nationality": player["nation"],
                    "club": "Unknown",
                    "photo": None,
                })
        except Exception as e:
            print(f"  ERRO no batch {i}: {e}")
            # Fallback: usa o overall padrão 70 para não interromper o pipeline.
            for player in batch:
                generated.append({
                    "nation": player["nation"],
                    "wc_name": player["name"],
                    "ea_id": None,
                    "name": player["name"],
                    "common_name": None,
                    "overall": 70,
                    "position": player["pos"],
                    "nationality": player["nation"],
                    "club": "Unknown",
                    "photo": None,
                })
        time.sleep(0.5)

    print(f"\n{len(generated)} overalls estimados")

    set_cache("fill_missing", fingerprint, generated)

    print("Salvando JSON final...")

    all_players = players + generated

    players_json.write_text(
        json.dumps(all_players, ensure_ascii=False, indent=4),
        encoding="utf-8",
    )

    print(f"Total: {len(all_players)} jogadores")


if __name__ == "__main__":
    main()
