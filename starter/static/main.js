// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let basePuzzle = [];
let timerInterval = null;
let elapsedSeconds = 0;
let currentDifficulty = 'medium';
let hintsUsed = 0;
let completed = false;

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function setMessage(text, color = '#d32f2f') {
  const msg = document.getElementById('message');
  msg.style.color = color;
  msg.innerText = text;
}

function getBoardFromInputs() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  return board;
}

function renderPuzzle(puz, lockedCells = [], sourceBoard = null) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const referenceBoard = Array.isArray(sourceBoard) ? sourceBoard : puz;
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      const isLockedCell = Array.isArray(lockedCells) && lockedCells.some((cell) => cell[0] === i && cell[1] === j);
      const isPrefilled = Array.isArray(referenceBoard) && referenceBoard[i][j] !== 0;
      if (val !== 0) {
        inp.value = val;
        inp.disabled = isPrefilled || isLockedCell;
        inp.className = 'sudoku-cell' + (inp.disabled ? ' prefilled' : '');
      } else {
        inp.value = '';
        inp.disabled = false;
        inp.className = 'sudoku-cell';
      }
    }
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    elapsedSeconds += 1;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');
  document.getElementById('timer').innerText = `Time: ${minutes}:${seconds}`;
}

function updateLeaderboardDisplay() {
  const list = document.getElementById('leaderboard-list');
  const entries = leaderboardStorage.readLeaderboardFromStorage();
  list.innerHTML = '';
  if (!entries.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No completed games yet.';
    list.appendChild(empty);
    return;
  }
  entries.slice(0, 10).forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = `${entry.name} — ${entry.completion_time}s — ${entry.difficulty} — hints: ${entry.hints_used}`;
    list.appendChild(item);
  });
}

async function newGame() {
  const difficulty = document.getElementById('difficulty-select').value;
  currentDifficulty = difficulty;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  basePuzzle = data.puzzle.map((row) => row.slice());
  renderPuzzle(data.puzzle, data.locked_cells || [], basePuzzle);
  hintsUsed = data.hints_used || 0;
  completed = false;
  setMessage('');
  resetTimer();
}

async function checkSolution() {
  const board = getBoardFromInputs();
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    setMessage(data.error);
    return;
  }
  const incorrect = new Set((data.incorrect || []).map((x) => x[0] * SIZE + x[1]));
  const inputs = document.getElementById('sudoku-board').getElementsByTagName('input');
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (data.completed) {
    completed = true;
    stopTimer();
    setMessage('Congratulations! You solved it!', '#388e3c');
    const playerNameInput = document.getElementById('player-name');
    const name = (playerNameInput.value || '').trim() || window.prompt('Enter your name for the leaderboard', 'Anonymous') || 'Anonymous';
    playerNameInput.value = name;
    saveScore(name);
  } else if (incorrect.size === 0) {
    setMessage('Looks good so far.', '#388e3c');
  } else {
    setMessage('Some cells are incorrect.', '#d32f2f');
  }
}

async function provideHint() {
  const board = getBoardFromInputs();
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (data.error) {
    setMessage(data.error);
    return;
  }
  hintsUsed = data.hints_used || hintsUsed;
  renderPuzzle(data.puzzle, data.locked_cells || [], basePuzzle);
  if (data.hinted_cell) {
    setMessage('A hint was added.', '#1976d2');
  } else {
    setMessage('No more empty cells remain.', '#388e3c');
  }
}

function saveScore(name) {
  const existingEntries = leaderboardStorage.readLeaderboardFromStorage();
  const newEntry = {
    name: name || 'Anonymous',
    completion_time: elapsedSeconds,
    difficulty: currentDifficulty,
    hints_used: hintsUsed,
  };
  const nextEntries = [...existingEntries, newEntry];
  leaderboardStorage.writeLeaderboardToStorage(nextEntries);
  updateLeaderboardDisplay();
  fetch('/complete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: newEntry.name,
      completion_time: newEntry.completion_time,
      difficulty: newEntry.difficulty,
      hints_used: newEntry.hints_used,
    })
  }).catch(() => {});
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const button = document.getElementById('theme-toggle');
  button.innerText = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
}

window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint-button').addEventListener('click', provideHint);
  document.getElementById('save-score').addEventListener('click', () => {
    saveScore(document.getElementById('player-name').value);
  });
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  updateLeaderboardDisplay();
  newGame();
});
