import time
import sys

from pipeline.build_squads import main as build_squads
from pipeline.fill_missing import main as fill_missing
from metrics.summer_squads import main as show_metrics


def separator(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


def main():
    total_start = time.time()

    separator("1/3 - Construindo elencos")
    build_squads()

    separator("2/3 - Preenchendo ausentes com IA")
    fill_missing()

    separator("3/3 - Metricas finais")
    show_metrics()

    elapsed = time.time() - total_start
    print(f"\nPipeline completo em {elapsed:.1f}s ({elapsed/60:.1f} min)")


if __name__ == "__main__":
    main()
