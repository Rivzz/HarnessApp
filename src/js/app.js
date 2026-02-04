/**
 * App Module
 * Main application initialization and coordination
 */

const App = (function() {
    const STATS_KEY = 'pomodoro_stats';
    const TASKS_KEY = 'pomodoro_tasks';

    let stats = {
        todayPomodoros: 0,
        todayFocusTime: 0, // in minutes
        lastDate: new Date().toDateString()
    };

    // DOM Elements
    const elements = {
        todayPomodoros: document.getElementById('today-pomodoros'),
        todayFocusTime: document.getElementById('today-focus-time')
    };

    /**
     * Initialize the application
     */
    function init() {
        loadStats();
        checkDateReset();

        // Initialize modules
        Settings.init();
        Timer.init(Settings.get());
        Tasks.init(loadTasks());

        // Set up callbacks
        Settings.setOnSettingsChange(handleSettingsChange);
        Timer.setOnTimerEnd(handleTimerEnd);
        Timer.setOnTick(handleTick);
        Tasks.setOnTasksChange(saveTasks);

        // Update display
        updateStatsDisplay();

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
            playNotificationSound();
        }

        // Show browser notification
        if (Settings.areBrowserNotificationsEnabled()) {
            showBrowserNotification(sessionType);
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
     */
    function playNotificationSound() {
        // Create a simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();

            // Fade out
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
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
