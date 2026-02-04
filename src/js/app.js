/**
 * App Module
 * Main application initialization and coordination
 */

const App = (function() {
    const STATS_KEY = 'pomodoro_stats';
    const TASKS_KEY = 'pomodoro_tasks';
    const ACTIVE_TASK_KEY = 'pomodoro_active_task';

    let stats = {
        todayPomodoros: 0,
        todayFocusTime: 0, // in minutes
        lastDate: new Date().toDateString()
    };

    // DOM Elements
    const elements = {
        todayPomodoros: document.getElementById('today-pomodoros'),
        todayFocusTime: document.getElementById('today-focus-time'),
        activeTaskDisplay: document.getElementById('active-task-display'),
        activeTaskText: document.getElementById('active-task-text')
    };

    /**
     * Initialize the application
     */
    function init() {
        loadStats();
        checkDateReset();

        // Initialize modules
        Settings.init();

        // Load saved timer state
        const savedTimerState = Timer.loadState();
        Timer.init(Settings.get(), savedTimerState);

        // Load saved active task
        const savedActiveTaskId = loadActiveTaskId();
        Tasks.init(loadTasks(), savedActiveTaskId);

        // Set up callbacks
        Settings.setOnSettingsChange(handleSettingsChange);
        Timer.setOnTimerEnd(handleTimerEnd);
        Timer.setOnTick(handleTick);
        Tasks.setOnTasksChange(saveTasks);
        Tasks.setOnActiveTaskChange(handleActiveTaskChange);

        // Update displays
        updateStatsDisplay();
        updateActiveTaskDisplay(Tasks.getActiveTask());

        console.log('Pomodoro App initialized');
    }

    /**
     * Load stats from localStorage
     */
    function loadStats() {
        try {
            const saved = localStorage.getItem(STATS_KEY);
            if (saved) {
                stats = { ...stats, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    }

    /**
     * Save stats to localStorage
     */
    function saveStats() {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }

    /**
     * Load tasks from localStorage
     */
    function loadTasks() {
        try {
            const saved = localStorage.getItem(TASKS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load tasks:', e);
            return [];
        }
    }

    /**
     * Save tasks to localStorage
     */
    function saveTasks(tasks) {
        try {
            localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Failed to save tasks:', e);
        }
    }

    /**
     * Load active task ID from localStorage
     */
    function loadActiveTaskId() {
        try {
            return localStorage.getItem(ACTIVE_TASK_KEY);
        } catch (e) {
            console.error('Failed to load active task:', e);
            return null;
        }
    }

    /**
     * Save active task ID to localStorage
     */
    function saveActiveTaskId(taskId) {
        try {
            if (taskId) {
                localStorage.setItem(ACTIVE_TASK_KEY, taskId);
            } else {
                localStorage.removeItem(ACTIVE_TASK_KEY);
            }
        } catch (e) {
            console.error('Failed to save active task:', e);
        }
    }

    /**
     * Handle active task change
     */
    function handleActiveTaskChange(task) {
        saveActiveTaskId(task ? task.id : null);
        updateActiveTaskDisplay(task);
    }

    /**
     * Update active task display
     */
    function updateActiveTaskDisplay(task) {
        if (task && !task.completed) {
            elements.activeTaskText.textContent = task.text;
            elements.activeTaskDisplay.classList.remove('hidden');
        } else {
            elements.activeTaskDisplay.classList.add('hidden');
        }
    }

    /**
     * Check if date has changed and reset daily stats
     */
    function checkDateReset() {
        const today = new Date().toDateString();
        if (stats.lastDate !== today) {
            stats.todayPomodoros = 0;
            stats.todayFocusTime = 0;
            stats.lastDate = today;
            saveStats();
        }
    }

    /**
     * Handle settings changes
     */
    function handleSettingsChange(newSettings) {
        Timer.updateSettings({
            workDuration: newSettings.workDuration,
            shortBreakDuration: newSettings.shortBreakDuration,
            longBreakDuration: newSettings.longBreakDuration,
            pomodorosUntilLongBreak: newSettings.pomodorosUntilLongBreak
        });
    }

    /**
     * Handle timer completion
     */
    function handleTimerEnd(sessionType) {
        if (sessionType === 'work') {
            // Update stats
            stats.todayPomodoros++;
            stats.todayFocusTime += Settings.get().workDuration;
            saveStats();
            updateStatsDisplay();
        }

        // Play sound notification
        if (Settings.isSoundEnabled()) {
            playNotificationSound(sessionType);
        }

        // Show browser notification
        if (Settings.areBrowserNotificationsEnabled()) {
            showBrowserNotification(sessionType);
        }

        // Auto-start next session if enabled
        if (Settings.isAutoStartEnabled()) {
            setTimeout(() => {
                Timer.start();
            }, 1000); // 1 second delay before auto-starting
        }
    }

    /**
     * Handle timer tick (for tracking focus time precisely)
     */
    function handleTick(timeRemaining, sessionType) {
        // Could be used for more precise time tracking if needed
    }

    /**
     * Play notification sound
     * Different sounds for work completion vs break completion
     */
    function playNotificationSound(sessionType) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            if (sessionType === 'work') {
                // Work complete: triumphant double beep (higher pitch)
                playBeep(audioContext, 880, 0, 0.15);
                playBeep(audioContext, 1100, 0.2, 0.15);
            } else {
                // Break complete: gentle single tone (lower pitch)
                playBeep(audioContext, 440, 0, 0.4);
            }
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    }

    /**
     * Play a single beep tone
     */
    function playBeep(audioContext, frequency, delay, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        const startTime = audioContext.currentTime + delay;
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.stop(startTime + duration);
    }

    /**
     * Show browser notification
     */
    function showBrowserNotification(sessionType) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        const title = sessionType === 'work'
            ? '🍅 Pomodoro Complete!'
            : '☕ Break Over!';
        const body = sessionType === 'work'
            ? 'Time for a break. Great work!'
            : 'Ready to focus again?';

        new Notification(title, { body, icon: '🍅' });
    }

    /**
     * Update stats display
     */
    function updateStatsDisplay() {
        elements.todayPomodoros.textContent = stats.todayPomodoros;

        const hours = Math.floor(stats.todayFocusTime / 60);
        const minutes = stats.todayFocusTime % 60;

        if (hours > 0) {
            elements.todayFocusTime.textContent = `${hours}h ${minutes}m`;
        } else {
            elements.todayFocusTime.textContent = `${minutes}m`;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init
    };
})();
