(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.leaderboardStorage = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const STORAGE_KEY = 'sudoku-leaderboard';

    function getStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage;
            }
            if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
                return globalThis.localStorage;
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    function normalizeEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const normalizedName = String(entry.name || 'Anonymous').trim() || 'Anonymous';
        const completionTime = Number.parseInt(entry.completion_time, 10);
        const hintsUsed = Number.parseInt(entry.hints_used, 10);
        const difficulty = String(entry.difficulty || 'medium').trim().toLowerCase() || 'medium';

        if (!Number.isFinite(completionTime) || !Number.isFinite(hintsUsed)) {
            return null;
        }

        return {
            name: normalizedName,
            completion_time: completionTime,
            difficulty,
            hints_used: hintsUsed,
        };
    }

    function normalizeEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries
            .map(normalizeEntry)
            .filter(Boolean)
            .sort((first, second) => {
                if (first.completion_time !== second.completion_time) {
                    return first.completion_time - second.completion_time;
                }
                if (first.hints_used !== second.hints_used) {
                    return first.hints_used - second.hints_used;
                }
                return first.name.localeCompare(second.name);
            })
            .slice(0, 10);
    }

    function readLeaderboardFromStorage() {
        const storage = getStorage();
        if (!storage) {
            return [];
        }

        try {
            const rawValue = storage.getItem(STORAGE_KEY);
            if (!rawValue) {
                return [];
            }

            const parsed = JSON.parse(rawValue);
            return normalizeEntries(parsed);
        } catch (error) {
            return [];
        }
    }

    function writeLeaderboardToStorage(entries) {
        const storage = getStorage();
        if (!storage) {
            return;
        }

        const normalizedEntries = normalizeEntries(entries);
        try {
            storage.setItem(STORAGE_KEY, JSON.stringify(normalizedEntries));
        } catch (error) {
            // Ignore storage write errors to keep the UI resilient.
        }
    }

    return {
        STORAGE_KEY,
        readLeaderboardFromStorage,
        writeLeaderboardToStorage,
        normalizeEntry,
        normalizeEntries,
    };
}));
