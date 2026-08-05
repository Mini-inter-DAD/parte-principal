# summary_squads.py
import json


def main():
    with open("output/players.json", encoding="utf-8") as f:
        players = json.load(f)

    # agrupa por nação
    by_nation = {}
    for p in players:
        nation = p["nation"]
        by_nation.setdefault(nation, []).append(p)

    # total de convocados por seleção (do openfootball = 26)
    TOTAL = 26

    print(f"{'Seleção':<30} {'Encontrados':>11} {'Ausentes':>9} {'Cobertura':>10}")
    print("-" * 65)

    total_found = 0
    total_missing = 0

    for nation in sorted(by_nation.keys()):
        found = len(by_nation[nation])
        missing = TOTAL - found
        pct = (found / TOTAL) * 100
        bar = "█" * (found // 2) + "░" * (missing // 2)
        print(f"{nation:<30} {found:>11} {missing:>9} {pct:>9.0f}%  {bar}")
        total_found += found
        total_missing += missing

    print("-" * 65)
    print(f"{'TOTAL':<30} {total_found:>11} {total_missing:>9} {(total_found/(total_found+total_missing)*100):>9.0f}%")


if __name__ == "__main__":
    main()