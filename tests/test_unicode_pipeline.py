from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class UnicodePipelineTest(unittest.TestCase):
    def test_player_csv_reader_declares_utf8_encoding(self):
        source = (ROOT / "pipeline" / "source" / "fifa_source.py").read_text(
            encoding="utf-8",
        )

        self.assertIn(
            'pd.read_csv("data/ea_fc26_players.csv", encoding="utf-8")',
            source,
        )

    def test_container_seeds_players_after_generating_catalog(self):
        source = (ROOT / "docker_entrypoint.sh").read_text(encoding="utf-8")

        pipeline_index = source.index("python -u run.py")
        seed_index = source.index("python -m database.seed_players")

        self.assertLess(pipeline_index, seed_index)


if __name__ == "__main__":
    unittest.main()
