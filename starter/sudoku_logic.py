import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def remove_cells(board, clues):
    removals_needed = SIZE * SIZE - clues
    removals_done = 0
    attempts = 0
    max_attempts = removals_needed * 12

    while removals_done < removals_needed and attempts < max_attempts:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] == EMPTY:
            attempts += 1
            continue

        saved_value = board[row][col]
        board[row][col] = EMPTY
        if has_unique_solution(board):
            removals_done += 1
        else:
            board[row][col] = saved_value
        attempts += 1

    return removals_done == removals_needed

def get_clue_count(difficulty="medium"):
    difficulty_map = {
        "easy": 40,
        "medium": 35,
        "hard": 28,
    }
    return difficulty_map.get(difficulty.lower(), difficulty_map["medium"])


def find_empty(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def get_hint(board, solution):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col, solution[row][col]
    return None, None, None


def find_incorrect_cells(board, solution, locked_cells=None, base_board=None):
    if locked_cells is None:
        locked_cells = []
    if base_board is None:
        base_board = [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

    locked_positions = {tuple(cell) for cell in locked_cells}
    for row in range(SIZE):
        for col in range(SIZE):
            if base_board[row][col] != EMPTY:
                locked_positions.add((row, col))

    incorrect = []
    for row in range(SIZE):
        for col in range(SIZE):
            if (row, col) in locked_positions:
                continue
            if board[row][col] == EMPTY:
                continue
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])
    return incorrect


def is_board_complete(board, solution, locked_cells=None, base_board=None):
    if board is None or solution is None:
        return False

    if any(cell == EMPTY for row in board for cell in row):
        return False

    incorrect = find_incorrect_cells(
        board,
        solution,
        locked_cells=locked_cells,
        base_board=base_board,
    )
    return len(incorrect) == 0


def count_solutions(board, limit=2):
    empty_cell = find_empty(board)
    if empty_cell is None:
        return 1

    row, col = empty_cell
    count = 0
    for num in range(1, SIZE + 1):
        if is_safe(board, row, col, num):
            board[row][col] = num
            count += count_solutions(board, limit)
            board[row][col] = EMPTY
            if count >= limit:
                return count
    return count


def has_unique_solution(board):
    return count_solutions(board, limit=2) == 1


def generate_puzzle(clues=None, difficulty="medium"):
    if clues is None:
        clues = get_clue_count(difficulty)

    attempts = 0
    max_attempts = 200
    while attempts < max_attempts:
        attempts += 1
        board = create_empty_board()
        fill_board(board)
        solution = deep_copy(board)
        if remove_cells(board, clues):
            puzzle = deep_copy(board)
            return puzzle, solution

    raise RuntimeError(
        "Unable to generate a unique-solution puzzle after {} attempts".format(max_attempts)
    )
