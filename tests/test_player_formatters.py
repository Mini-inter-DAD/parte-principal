import unittest

from backend.services.player_formatters import format_player_name, normalize_o_slash


class PlayerFormatterTest(unittest.TestCase):
    def test_normalizes_o_slash_for_storage_and_api_display(self):
        self.assertEqual(normalize_o_slash("Martin Ødegaard"), "Martin Odegaard")
        self.assertEqual(format_player_name("Martin Ødegaard"), "Martin Odegaard")
        self.assertEqual(format_player_name("Ørjan Nyland"), "Orjan Nyland")

    def test_recovers_legacy_question_mark_using_the_ea_source_name(self):
        self.assertEqual(
            format_player_name("Martin ?degaard", ea_id=222665),
            "Martin Odegaard",
        )


if __name__ == "__main__":
    unittest.main()
