/**
 * Timer Module
 * Handles core pomodoro timer functionality
 */

const Timer = (function() {
    // Timer state
    let state = {
        timeRemaining: 25 * 60, // in seconds
        isRunning: false,
        isPaused: false,
        sessionType: 'work', // 'work', 'shortBreak', 'longBreak'
        completedPomodoros: 0,
        intervalId: null
    };

    // Settings (will be updated from Settings module)
    let settings = {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        pomodorosUntilLongBreak: 4
    };

    // DOM Elements
    const elements = {
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds'),
        timerCircle: document.getElementById('timer-circle'),
        sessionType: document.getElementById('session-type'),
        pomodoroCount: document.getElementById('pomodoro-count'),
        startBtn: document.getElementById('start-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        resetBtn: document.getElementById('reset-btn'),
        skipSection: document.getElementById('skip-section'),
        skipBtn: document.getElementById('skip-btn')
    };

    // Event callbacks
    let onTimerEnd = null;
    let onTick = null;

    /**
     * Initialize timer with settings
     */
    function init(timerSettings) {
        if (timerSettings) {
            settings = { ...settings, ...timerSettings };
        }
        state.timeRemaining = settings.workDuration * 60;
        updateDisplay();
        bindEvents();
    }

    /**
     * Update settings
     */
    function updateSettings(newSettings) {
        settings = { ...settings, ...newSettings };
        if (!state.isRunning) {
            if (state.sessionType === 'work') {
                state.timeRemaining = settings.workDuration * 60;
            } else if (state.sessionType === 'shortBreak') {
                state.timeRemaining = settings.shortBreakDuration * 60;
            } else {
                state.timeRemaining = settings.longBreakDuration * 60;
            }
            updateDisplay();
        }
    }

    /**
     * Bind UI events
     */
    function bindEvents() {
        elements.startBtn.addEventListener('click', start);
        elements.pauseBtn.addEventListener('click', pause);
        elements.resetBtn.addEventListener('click', reset);
        elements.skipBtn.addEventListener('click', skipBreak);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (state.isRunning) {
                    pause();
                } else {
                    start();
                }
            } else if (e.code === 'KeyR') {
                reset();
            }
        });
    }

    /**
     * Start the timer
     */
    function start() {
        if (state.isRunning) return;

        state.isRunning = true;
        state.isPaused = false;

        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        elements.timerCircle.classList.add('running');

        if (state.sessionType !== 'work') {
            elements.timerCircle.classList.add('break');
        }

        state.intervalId = setInterval(tick, 1000);
    }

    /**
     * Pause the timer
     */
    function pause() {
        if (!state.isRunning) return;

        state.isRunning = false;
        state.isPaused = true;

        clearInterval(state.intervalId);

        elements.startBtn.disabled = false;
        elements.pauseBtn.disabled = true;
        elements.timerCircle.classList.remove('running');
    }

    /**
     * Reset the timer
     */
    function reset() {
        pause();
        state.isPaused = false;

        if (state.sessionType === 'work') {
            state.timeRemaining = settings.workDuration * 60;
        } else if (state.sessionType === 'shortBreak') {
            state.timeRemaining = settings.shortBreakDuration * 60;
        } else {
            state.timeRemaining = settings.longBreakDuration * 60;
        }

        elements.timerCircle.classList.remove('break');
        updateDisplay();
    }

    /**
     * Skip current break
     */
    function skipBreak() {
        if (state.sessionType === 'work') return;

        pause();
        startWorkSession();
    }

    /**
     * Timer tick - called every second
     */
    function tick() {
        state.timeRemaining--;

        if (onTick) {
            onTick(state.timeRemaining, state.sessionType);
        }

        updateDisplay();
        updateTabTitle();

        if (state.timeRemaining <= 0) {
            handleTimerEnd();
        }
    }

    /**
     * Handle timer completion
     */
    function handleTimerEnd() {
        pause();

        if (onTimerEnd) {
            onTimerEnd(state.sessionType);
        }

        if (state.sessionType === 'work') {
            state.completedPomodoros++;
            updatePomodoroCount();

            // Check if long break is needed
            if (state.completedPomodoros % settings.pomodorosUntilLongBreak === 0) {
                startLongBreak();
            } else {
                startShortBreak();
            }
        } else {
            startWorkSession();
        }
    }

    /**
     * Start work session
     */
    function startWorkSession() {
        state.sessionType = 'work';
        state.timeRemaining = settings.workDuration * 60;
        elements.sessionType.textContent = 'Focus Time';
        elements.skipSection.classList.add('hidden');
        elements.timerCircle.classList.remove('break');
        updateDisplay();
    }

    /**
     * Start short break
     */
    function startShortBreak() {
        state.sessionType = 'shortBreak';
        state.timeRemaining = settings.shortBreakDuration * 60;
        elements.sessionType.textContent = 'Short Break';
        elements.skipSection.classList.remove('hidden');
        updateDisplay();
    }

    /**
     * Start long break
     */
    function startLongBreak() {
        state.sessionType = 'longBreak';
        state.timeRemaining = settings.longBreakDuration * 60;
        elements.sessionType.textContent = 'Long Break';
        elements.skipSection.classList.remove('hidden');
        updateDisplay();
    }

    /**
     * Update the timer display
     */
    function updateDisplay() {
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = state.timeRemaining % 60;

        elements.minutes.textContent = minutes.toString().padStart(2, '0');
        elements.seconds.textContent = seconds.toString().padStart(2, '0');
    }

    /**
     * Update pomodoro count display
     */
    function updatePomodoroCount() {
        const cycleCount = state.completedPomodoros % settings.pomodorosUntilLongBreak ||
                          (state.completedPomodoros > 0 ? settings.pomodorosUntilLongBreak : 0);
        elements.pomodoroCount.textContent = `${cycleCount}/${settings.pomodorosUntilLongBreak}`;
    }

    /**
     * Update browser tab title with timer
     */
    function updateTabTitle() {
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = state.timeRemaining % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const sessionStr = state.sessionType === 'work' ? '🍅' : '☕';
        document.title = `${timeStr} ${sessionStr} Pomodoro`;
    }

    /**
     * Get current state
     */
    function getState() {
        return { ...state };
    }

    /**
     * Set callback for timer end
     */
    function setOnTimerEnd(callback) {
        onTimerEnd = callback;
    }

    /**
     * Set callback for each tick
     */
    function setOnTick(callback) {
        onTick = callback;
    }

    /**
     * Get total completed pomodoros
     */
    function getCompletedPomodoros() {
        return state.completedPomodoros;
    }

    /**
     * Set completed pomodoros (for loading saved state)
     */
    function setCompletedPomodoros(count) {
        state.completedPomodoros = count;
        updatePomodoroCount();
    }

    // Public API
    return {
        init,
        start,
        pause,
        reset,
        getState,
        updateSettings,
        setOnTimerEnd,
        setOnTick,
        getCompletedPomodoros,
        setCompletedPomodoros
    };
})();
