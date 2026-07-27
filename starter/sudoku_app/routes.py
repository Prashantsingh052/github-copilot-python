"""Route handlers for the Sudoku Flask application."""

from flask import Blueprint, jsonify, render_template, request

import sudoku_logic
from .game_state import get_current_game_state, set_current_game_state
from .leaderboard import add_leaderboard_entry, get_leaderboard

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/new")
def new_game():
    clues = request.args.get("clues")
    difficulty = request.args.get("difficulty", "medium")

    if clues is not None:
        clues = int(clues)
        puzzle, solution = sudoku_logic.generate_puzzle(clues=clues)
    else:
        puzzle, solution = sudoku_logic.generate_puzzle(difficulty=difficulty)

    set_current_game_state(puzzle=puzzle, solution=solution, hints_used=0, locked_cells=[])
    return jsonify({"puzzle": puzzle, "hints_used": 0, "locked_cells": []})


@main.route("/hint", methods=["POST"])
def provide_hint():
    state = get_current_game_state()
    puzzle = state.get("puzzle")
    solution = state.get("solution")

    if puzzle is None or solution is None:
        return jsonify({"error": "No game in progress"}), 400

    data = request.get_json(silent=True) or {}
    board = data.get("board")
    if board is None:
        current_board = [row[:] for row in puzzle]
    else:
        current_board = [row[:] for row in board]

    row, col, value = sudoku_logic.get_hint(current_board, solution)
    if row is None:
        return jsonify({"puzzle": current_board, "hints_used": state.get("hints_used", 0), "locked_cells": state.get("locked_cells", []), "hinted_cell": None})

    current_board[row][col] = value
    state["puzzle"] = current_board
    locked_cells = state.get("locked_cells", [])
    if [row, col] not in locked_cells:
        locked_cells.append([row, col])
    state["locked_cells"] = locked_cells
    state["hints_used"] = state.get("hints_used", 0) + 1

    return jsonify({
        "puzzle": current_board,
        "hints_used": state["hints_used"],
        "locked_cells": locked_cells,
        "hinted_cell": [row, col],
    })


@main.route("/check", methods=["POST"])
def check_solution():
    data = request.json
    board = data.get("board")
    state = get_current_game_state()
    solution = state.get("solution")
    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    incorrect = sudoku_logic.find_incorrect_cells(
        board,
        solution,
        locked_cells=state.get("locked_cells", []),
        base_board=state.get("puzzle"),
    )
    is_complete = sudoku_logic.is_board_complete(
        board,
        solution,
        locked_cells=state.get("locked_cells", []),
        base_board=state.get("puzzle"),
    )
    completed = False
    if is_complete and not state.get("completed", False):
        state["completed"] = True
        completed = True

    return jsonify({"incorrect": incorrect, "completed": completed, "is_complete": is_complete})


@main.route("/complete", methods=["POST"])
def complete_game():
    data = request.get_json(silent=True) or {}
    entry = add_leaderboard_entry(
        name=data.get("name"),
        completion_time=data.get("completion_time", 0),
        difficulty=data.get("difficulty"),
        hints_used=data.get("hints_used", 0),
    )
    return jsonify({"entry": entry, "leaderboard": get_leaderboard()})


@main.route("/leaderboard")
def leaderboard():
    return jsonify({"leaderboard": get_leaderboard()})
