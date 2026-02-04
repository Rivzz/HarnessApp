/**
 * App Module
 * Main application initialization and coordination
 */

const App = (function() {
    const STATS_KEY = 'pomodoro_stats';
    const TASKS_KEY = 'pomodoro_tasks';
    const ACTIVE_TASK_KEY = 'pomodoro_active_task';
    const HISTORY_KEY = 'pomodoro_history';

    let stats = {
        todayPomodoros: 0,
        todayFocusTime: 0, // in minutes
        lastDate: new Date().toDateString()
    };

    let sessionHistory = [];

    // DOM Elements
    const elements = {
        todayPomodoros: document.getElementById('today-pomodoros'),
        todayFocusTime: document.getElementById('today-focus-time'),
        activeTaskDisplay: document.getElementById('active-task-display'),
        activeTaskText: document.getElementById('active-task-text'),
        toggleHistory: document.getElementById('toggle-history'),
        sessionHistory: document.getElementById('session-history'),
        historyList: document.getElementById('history-list')
    };

    /**
     * Initialize the application
     */
    function init() {
        loadStats();
        loadHistory();
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

        // Bind history toggle
        elements.toggleHistory.addEventListener('click', toggleHistoryDisplay);

        // Update displays
        updateStatsDisplay();
        updateActiveTaskDisplay(Tasks.getActiveTask());
        renderHistory();

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
     * Load session history from localStorage
     */
    function loadHistory() {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) {
                sessionHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
            sessionHistory = [];
        }
    }

    /**
     * Save session history to localStorage
     */
    function saveHistory() {
        try {
            // Keep only last 50 sessions to avoid localStorage bloat
            if (sessionHistory.length > 50) {
                sessionHistory = sessionHistory.slice(-50);
            }
            localStorage.setItem(HISTORY_KEY, JSON.stringify(sessionHistory));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    /**
     * Add a session to history
     */
    function addHistoryEntry(duration, taskName) {
        const entry = {
            timestamp: new Date().toISOString(),
            duration: duration,
            task: taskName || null
        };
        sessionHistory.push(entry);
        saveHistory();
        renderHistory();
    }

    /**
     * Render session history
     */
    function renderHistory() {
        if (!elements.historyList) return;

        if (sessionHistory.length === 0) {
            elements.historyList.innerHTML = '<li class="history-empty">No sessions yet</li>';
            return;
        }

        // Show most recent first
        const recentHistory = [...sessionHistory].reverse().slice(0, 20);

        elements.historyList.innerHTML = recentHistory.map(entry => {
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const taskStr = entry.task ? `<span class="history-task">${escapeHtml(entry.task)}</span>` : '';

            return `
                <li class="history-item">
                    <span class="history-time">${dateStr} ${timeStr}</span>
                    ${taskStr}
                    <span class="history-duration">${entry.duration}m</span>
                </li>
            `;
        }).join('');
    }

    /**
     * Toggle history display
     */
    function toggleHistoryDisplay() {
        const isHidden = elements.sessionHistory.classList.contains('hidden');
        elements.sessionHistory.classList.toggle('hidden');
        elements.toggleHistory.textContent = isHidden ? 'Hide Session History' : 'View Session History';
    }

    /**
     * Escape HTML for safe display
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            const workDuration = Settings.get().workDuration;

            // Update stats
            stats.todayPomodoros++;
            stats.todayFocusTime += workDuration;
            saveStats();
            updateStatsDisplay();

            // Get active task info before incrementing
            const activeTask = Tasks.getActiveTask();
            const taskName = activeTask ? activeTask.text : null;

            // Increment active task pomodoro count
            if (activeTask) {
                Tasks.incrementTaskPomodoro(activeTask.id);
            }

            // Add to session history
            addHistoryEntry(workDuration, taskName);
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
