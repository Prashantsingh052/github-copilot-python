"""Leaderboard helpers for completed Sudoku games."""

from copy import deepcopy

MAX_LEADERBOARD_ENTRIES = 10

_LEADERBOARD = []


def get_leaderboard():
    """Return a copy of the current leaderboard."""
    return [deepcopy(entry) for entry in _LEADERBOARD]


def add_leaderboard_entry(name, completion_time, difficulty, hints_used):
    """Add a completed game to the leaderboard and keep the top results."""
    normalized_name = (name or "Anonymous").strip() or "Anonymous"
    entry = {
        "name": normalized_name,
        "completion_time": int(completion_time),
        "difficulty": (difficulty or "medium").lower(),
        "hints_used": int(hints_used),
    }
    _LEADERBOARD.append(entry)
    _LEADERBOARD.sort(
        key=lambda item: (
            item["completion_time"],
            item["hints_used"],
            item["name"].lower(),
        )
    )
    del _LEADERBOARD[MAX_LEADERBOARD_ENTRIES:]
    return deepcopy(entry)


def clear_leaderboard():
    """Reset the leaderboard for testing and local development."""
    _LEADERBOARD.clear()
