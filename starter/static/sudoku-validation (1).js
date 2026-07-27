(function (root, factory) {
    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    root.sudokuValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const SIZE = 9;

    function getBoardValidationState(board) {
        const validation = [];
        const rows = Array.isArray(board) ? board : [];

        for (let row = 0; row < SIZE; row += 1) {
            for (let col = 0; col < SIZE; col += 1) {
                const value = rows[row] && rows[row][col];
                if (!value) {
                    validation.push({ row, col, isValid: true, conflicts: [] });
                    continue;
                }

                const conflicts = [];
                const seen = new Set();

                for (let otherCol = 0; otherCol < SIZE; otherCol += 1) {
                    if (otherCol === col) {
                        continue;
                    }
                    if (rows[row][otherCol] === value) {
                        const key = `${row},${otherCol}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            conflicts.push({ row, col: otherCol });
                        }
                    }
                }

                for (let otherRow = 0; otherRow < SIZE; otherRow += 1) {
                    if (otherRow === row) {
                        continue;
                    }
                    if (rows[otherRow][col] === value) {
                        const key = `${otherRow},${col}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            conflicts.push({ row: otherRow, col });
                        }
                    }
                }

                const boxRow = Math.floor(row / 3) * 3;
                const boxCol = Math.floor(col / 3) * 3;
                for (let boxRowIndex = boxRow; boxRowIndex < boxRow + 3; boxRowIndex += 1) {
                    for (let boxColIndex = boxCol; boxColIndex < boxCol + 3; boxColIndex += 1) {
                        if (boxRowIndex === row && boxColIndex === col) {
                            continue;
                        }
                        if (rows[boxRowIndex][boxColIndex] === value) {
                            const key = `${boxRowIndex},${boxColIndex}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                conflicts.push({ row: boxRowIndex, col: boxColIndex });
                            }
                        }
                    }
                }

                validation.push({ row, col, isValid: conflicts.length === 0, conflicts });
            }
        }

        return validation;
    }

    return { SIZE, getBoardValidationState };
});
