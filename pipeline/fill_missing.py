# fill_missing.py
import os
import json
import re
import time
from groq import Groq

from dotenv import load_dotenv

load_dotenv()


client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

with open('data/missing.json', 'r', encoding='utf-8') as arquivo:
    MISSING = json.load(arquivo)



def estimate_batch(batch: list) -> list:
    players_text = "\n".join(
        f"{i+1}. {p['name']} | {p['pos']} | {p['nation']}"
        for i, p in enumerate(batch)
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a football analyst. For each player, estimate their EA FC 26 overall rating "
                    "as an integer between 55 and 91. Base it on real-world reputation, league level, and performance. "
                    "Respond ONLY with a JSON array of integers in the same order as the input. "
                    "Example: [72, 68, 81, 75]. No explanation, no text, just the array."
                )
            },
            {
                "role": "user",
                "content": players_text
            }
        ],
        max_tokens=200,
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()
    numbers = json.loads(re.search(r'\[.*?\]', raw, re.DOTALL).group())
    return numbers


def main():
    with open("output/players.json", encoding="utf-8") as f:
        players = json.load(f)


    BATCH_SIZE = 10
    generated = []

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
                    "name": player["name"].lower(),
                    "common_name": None,
                    "overall": overall,
                    "position": player["pos"],
                    "nationality": player["nation"],
                    "club": "Unknown",
                    "photo": None,
                })
        except Exception as e:
            print(f"  ERRO no batch {i}: {e}")
            for player in batch:
                generated.append({
                    "nation": player["nation"],
                    "wc_name": player["name"],
                    "ea_id": None,
                    "name": player["name"].lower(),
                    "common_name": None,
                    "overall": 70,
                    "position": player["pos"],
                    "nationality": player["nation"],
                    "club": "Unknown",
                    "photo": None,
                })
        time.sleep(0.5)

    print(f"\n{len(generated)} overalls estimados")
    print("Salvando JSON final...")

    all_players = players + generated

    with open("output/players.json", "w", encoding="utf-8") as f:
        json.dump(all_players, f, ensure_ascii=False, indent=4)

    print(f"Total: {len(all_players)} jogadores")


if __name__ == "__main__":
    main()