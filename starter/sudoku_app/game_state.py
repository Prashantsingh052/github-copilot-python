"""Shared state helpers for the Sudoku Flask application."""

CURRENT_GAME = {
    "puzzle": None,
    "solution": None,
    "hints_used": 0,
    "locked_cells": [],
    "completed": False,
}


def get_current_game_state():
    """Return the current game state dictionary."""
    return CURRENT_GAME


def set_current_game_state(puzzle=None, solution=None, hints_used=0, locked_cells=None):
    """Replace the current puzzle and solution values."""
    CURRENT_GAME["puzzle"] = puzzle
    CURRENT_GAME["solution"] = solution
    CURRENT_GAME["hints_used"] = hints_used
    CURRENT_GAME["locked_cells"] = [] if locked_cells is None else locked_cells
    CURRENT_GAME["completed"] = False


def reset_current_game_state():
    """Reset the current game state to an empty state."""
    set_current_game_state(None, None)
