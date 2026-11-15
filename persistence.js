/* Persist CyberCrack progress for this browser. Load this script after the main inline script in index.html. */
(() => {
    const STORAGE_KEY = 'cyberCrackSimulatorState.v1';

    function saveState() {
        try {
            const terminalHistory = document.getElementById('terminalHistory');
            const welcomeMessage = document.getElementById('welcomeMessageContainer');
            const state = {
                currentTaskIndex,
                completedTasks: [...completedTasks],
                revealedHints: [...revealedHints],
                machineActive,
                isConnectedToTarget,
                userXP,
                terminalHistory: terminalHistory ? terminalHistory.textContent : '',
                welcomeHidden: welcomeMessage ? getComputedStyle(welcomeMessage).display === 'none' : false
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('CyberCrack: Spielstand konnte nicht gespeichert werden.', error);
        }
    }

    function restoreState() {
        let saved;
        try {
            saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (error) {
            console.warn('CyberCrack: Gespeicherter Spielstand ist ungültig.', error);
            return;
        }
        if (!saved || typeof saved !== 'object') return;

        const validTaskIndex = Number.isInteger(saved.currentTaskIndex)
            && saved.currentTaskIndex >= 0
            && saved.currentTaskIndex < tasks.length;
        currentTaskIndex = validTaskIndex ? saved.currentTaskIndex : 0;
        completedTasks = new Set(Array.isArray(saved.completedTasks)
            ? saved.completedTasks.filter(id => tasks.some(task => task.id === id))
            : []);
        revealedHints = new Set(Array.isArray(saved.revealedHints)
            ? saved.revealedHints.filter(id => tasks.some(task => task.id === id))
            : []);
        userXP = Number.isFinite(saved.userXP) && saved.userXP >= 0 ? saved.userXP : 0;
        machineActive = saved.machineActive === true;
        isConnectedToTarget = machineActive && saved.isConnectedToTarget === true;

        renderTasksList();
        updateHeaderStats();
        selectTask(currentTaskIndex);

        // Restore the machine UI without toggling the saved state back off.
        if (machineActive) {
            machineActive = false;
            toggleMachine();
        }
        isConnectedToTarget = machineActive && saved.isConnectedToTarget === true;
        updatePromptDisplay();

        const history = document.getElementById('terminalHistory');
        if (history && typeof saved.terminalHistory === 'string') {
            history.textContent = saved.terminalHistory;
            history.classList.add('whitespace-pre-wrap');
        }
        const welcomeMessage = document.getElementById('welcomeMessageContainer');
        if (welcomeMessage && saved.welcomeHidden === true) {
            welcomeMessage.style.display = 'none';
        }
    }

    function wrapAndSave(functionName) {
        const original = window[functionName];
        if (typeof original !== 'function') return;
        window[functionName] = function (...args) {
            const result = original.apply(this, args);
            saveState();
            return result;
        };
    }

    // Main inline script runs before this file, so its state and functions are ready.
    restoreState();

    ['selectTask', 'toggleHint', 'toggleMachine', 'submitFlag', 'clearTerminal', 'resetWorkspace']
        .forEach(wrapAndSave);

    // Save command results after the simulator's existing Enter handler has run.
    const terminalInput = document.getElementById('terminalInput');
    if (terminalInput) {
        terminalInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') setTimeout(saveState, 0);
        });
    }
    window.addEventListener('pagehide', saveState);
    window.addEventListener('beforeunload', saveState);
})();
