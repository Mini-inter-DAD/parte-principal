import unittest
from unittest.mock import Mock, patch

from backend.services import draft_service


class DraftPenaltyZoneTests(unittest.TestCase):
    def test_goalkeeper_overall_controls_available_zone_count(self):
        with patch.object(
            draft_service.random,
            "sample",
            side_effect=lambda zones, count: list(zones)[:count],
        ):
            self.assertEqual(len(draft_service.get_available_penalty_zones(84)), 5)
            self.assertEqual(len(draft_service.get_available_penalty_zones(85)), 4)
            self.assertEqual(len(draft_service.get_available_penalty_zones(90)), 3)

    def test_save_turn_returns_user_goalkeeper_zones(self):
        shootout = {
            "id": 1,
            "match_id": 10,
            "current_turn": "user_save",
            "current_shooter_name": "Opponent striker",
            "user_score": 0,
            "opponent_score": 0,
            "user_attempts": 0,
            "opponent_attempts": 0,
            "available_shoot_zones": list(draft_service.PENALTY_ZONES),
            "opponent_available_shoot_zones": ["top_left", "bottom_right"],
            "user_goalkeeper_name": "User goalkeeper",
            "user_goalkeeper_overall": 90,
            "opponent_goalkeeper_name": "Opponent goalkeeper",
            "opponent_goalkeeper_overall": 80,
            "is_finished": False,
            "winner": None,
        }

        payload = draft_service._penalty_state_payload(shootout)

        self.assertEqual(payload["available_zones"], ["top_left", "bottom_right"])
        self.assertEqual(
            set(payload["blocked_zones"]),
            {"top_center", "top_right", "bottom_left"},
        )

    def test_opponent_shot_is_selected_only_from_available_zones(self):
        available = ["top_left", "bottom_right"]
        shootout = {
            "shootout_id": 1,
            "match_id": 10,
            "user_id": 7,
            "user_score": 0,
            "opponent_score": 0,
            "user_attempts": 0,
            "opponent_attempts": 0,
            "current_turn": "user_save",
            "current_shooter_name": "Opponent striker",
            "available_shoot_zones": list(draft_service.PENALTY_ZONES),
            "opponent_available_shoot_zones": available,
            "user_goalkeeper_name": "User goalkeeper",
            "user_goalkeeper_overall": 90,
            "opponent_goalkeeper_name": "Opponent goalkeeper",
            "opponent_goalkeeper_overall": 80,
            "is_finished": False,
            "winner": None,
            "opponent_name": "France",
            "user_ovr": 80,
            "opponent_ovr": 82,
            "mode": "cup",
            "phase_index": 6,
        }
        updated_shootout = {
            **shootout,
            "current_turn": "user_shoot",
            "current_shooter_name": "User striker",
        }
        created_attempt = {}
        db = Mock()

        def capture_attempt(_db, **kwargs):
            created_attempt.update(kwargs)

        with (
            patch.object(
                draft_service.user_repository,
                "get_user",
                return_value={"id": 7, "username": "User", "coins": 1000},
            ),
            patch.object(
                draft_service.draft_repository,
                "get_penalty_shootout_for_update",
                return_value=shootout,
            ),
            patch.object(
                draft_service.draft_repository,
                "list_user_starters",
                return_value=[{"name": "User striker", "position": "ST", "overall": 80}],
            ),
            patch.object(
                draft_service,
                "list_opponents",
                return_value=[{
                    "id": "france",
                    "name": "France",
                    "players": [{"name": "Opponent striker", "position": "ST"}],
                }],
            ),
            patch.object(
                draft_service.draft_repository,
                "create_penalty_attempt",
                side_effect=capture_attempt,
            ),
            patch.object(
                draft_service.draft_repository,
                "update_penalty_shootout",
                return_value=updated_shootout,
            ),
            patch.object(draft_service.random, "choice", side_effect=lambda zones: zones[0]),
            patch.object(draft_service.random, "random", return_value=0.5),
        ):
            draft_service.save_penalty(
                db,
                user_id=7,
                match_id=10,
                dive_zone="top_left",
            )

        self.assertIn(created_attempt["shoot_zone"], available)
        self.assertNotIn(
            created_attempt["shoot_zone"],
            set(draft_service.PENALTY_ZONES) - set(available),
        )


if __name__ == "__main__":
    unittest.main()
