/**
 * Settings Module
 * Handles user preferences and settings persistence
 */

const Settings = (function() {
    const STORAGE_KEY = 'pomodoro_settings';

    const defaults = {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        pomodorosUntilLongBreak: 4,
        soundEnabled: true,
        soundStyle: 'classic',
        browserNotifications: false,
        darkMode: false,
        autoStart: false
    };

    let settings = { ...defaults };
    let onSettingsChange = null;

    // DOM Elements
    const elements = {
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettings: document.getElementById('close-settings'),
        workDuration: document.getElementById('work-duration'),
        shortBreak: document.getElementById('short-break'),
        longBreak: document.getElementById('long-break'),
        pomodorosUntilLong: document.getElementById('pomodoros-until-long'),
        soundEnabled: document.getElementById('sound-enabled'),
        soundStyle: document.getElementById('sound-style'),
        previewSound: document.getElementById('preview-sound'),
        browserNotifications: document.getElementById('browser-notifications'),
        darkMode: document.getElementById('dark-mode'),
        autoStart: document.getElementById('auto-start'),
        resetSettings: document.getElementById('reset-settings'),
        saveSettings: document.getElementById('save-settings'),
        resetAllData: document.getElementById('reset-all-data')
    };

    /**
     * Initialize settings
     */
    function init() {
        load();
        applyTheme();
        bindEvents();
        populateForm();
    }

    /**
     * Load settings from localStorage
     */
    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                settings = { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    /**
     * Bind UI events
     */
    function bindEvents() {
        elements.settingsBtn.addEventListener('click', openModal);
        elements.closeSettings.addEventListener('click', closeModal);
        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                closeModal();
            }
        });
        elements.resetSettings.addEventListener('click', resetToDefaults);
        elements.saveSettings.addEventListener('click', saveFromForm);
        elements.resetAllData.addEventListener('click', resetAllData);
        elements.previewSound.addEventListener('click', previewSoundStyle);

        // Keyboard shortcut to open settings
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                openModal();
            }
            if (e.code === 'Escape') {
                closeModal();
            }
        });

        // Request notification permission when enabled
        elements.browserNotifications.addEventListener('change', (e) => {
            if (e.target.checked && 'Notification' in window) {
                Notification.requestPermission();
            }
        });
    }

    /**
     * Open settings modal
     */
    function openModal() {
        populateForm();
        elements.settingsModal.classList.remove('hidden');
        elements.workDuration.focus();
    }

    /**
     * Close settings modal
     */
    function closeModal() {
        elements.settingsModal.classList.add('hidden');
    }

    /**
     * Populate form with current settings
     */
    function populateForm() {
        elements.workDuration.value = settings.workDuration;
        elements.shortBreak.value = settings.shortBreakDuration;
        elements.longBreak.value = settings.longBreakDuration;
        elements.pomodorosUntilLong.value = settings.pomodorosUntilLongBreak;
        elements.soundEnabled.checked = settings.soundEnabled;
        elements.soundStyle.value = settings.soundStyle || 'classic';
        elements.browserNotifications.checked = settings.browserNotifications;
        elements.darkMode.checked = settings.darkMode;
        elements.autoStart.checked = settings.autoStart;
    }

    /**
     * Save settings from form
     */
    function saveFromForm() {
        settings.workDuration = parseInt(elements.workDuration.value) || defaults.workDuration;
        settings.shortBreakDuration = parseInt(elements.shortBreak.value) || defaults.shortBreakDuration;
        settings.longBreakDuration = parseInt(elements.longBreak.value) || defaults.longBreakDuration;
        settings.pomodorosUntilLongBreak = parseInt(elements.pomodorosUntilLong.value) || defaults.pomodorosUntilLongBreak;
        settings.soundEnabled = elements.soundEnabled.checked;
        settings.soundStyle = elements.soundStyle.value;
        settings.browserNotifications = elements.browserNotifications.checked;
        settings.darkMode = elements.darkMode.checked;
        settings.autoStart = elements.autoStart.checked;

        // Clamp values
        settings.workDuration = Math.max(1, Math.min(60, settings.workDuration));
        settings.shortBreakDuration = Math.max(1, Math.min(15, settings.shortBreakDuration));
        settings.longBreakDuration = Math.max(5, Math.min(60, settings.longBreakDuration));
        settings.pomodorosUntilLongBreak = Math.max(2, Math.min(10, settings.pomodorosUntilLongBreak));

        save();
        applyTheme();
        closeModal();

        if (onSettingsChange) {
            onSettingsChange(settings);
        }
    }

    /**
     * Reset settings to defaults
     */
    function resetToDefaults() {
        settings = { ...defaults };
        populateForm();
    }

    /**
     * Reset all application data
     */
    function resetAllData() {
        if (!confirm('This will delete all your tasks, stats, and settings. Are you sure?')) {
            return;
        }

        // Clear all pomodoro-related localStorage keys
        localStorage.removeItem('pomodoro_settings');
        localStorage.removeItem('pomodoro_stats');
        localStorage.removeItem('pomodoro_tasks');
        localStorage.removeItem('pomodoro_timer_state');
        localStorage.removeItem('pomodoro_active_task');
        localStorage.removeItem('pomodoro_history');

        // Reload the page to reset everything
        window.location.reload();
    }

    /**
     * Apply theme based on settings
     */
    function applyTheme() {
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    /**
     * Get current settings
     */
    function get() {
        return { ...settings };
    }

    /**
     * Set callback for settings changes
     */
    function setOnSettingsChange(callback) {
        onSettingsChange = callback;
    }

    /**
     * Check if sound is enabled
     */
    function isSoundEnabled() {
        return settings.soundEnabled;
    }

    /**
     * Check if browser notifications are enabled
     */
    function areBrowserNotificationsEnabled() {
        return settings.browserNotifications;
    }

    /**
     * Check if auto-start is enabled
     */
    function isAutoStartEnabled() {
        return settings.autoStart;
    }

    /**
     * Get current sound style
     */
    function getSoundStyle() {
        return settings.soundStyle || 'classic';
    }

    /**
     * Preview the currently selected sound style
     */
    function previewSoundStyle() {
        const style = elements.soundStyle.value;
        playPreviewSound(style, 'work');
    }

    /**
     * Play a preview sound for a given style
     */
    function playPreviewSound(style, sessionType) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            switch (style) {
                case 'bell':
                    // Bell: higher frequencies with decay
                    playTone(audioContext, 830, 0, 0.3, 'sine');
                    playTone(audioContext, 1245, 0.05, 0.25, 'sine');
                    break;
                case 'chime':
                    // Chime: musical notes
                    playTone(audioContext, 523, 0, 0.2, 'sine'); // C
                    playTone(audioContext, 659, 0.15, 0.2, 'sine'); // E
                    playTone(audioContext, 784, 0.3, 0.3, 'sine'); // G
                    break;
                case 'digital':
                    // Digital: square wave blips
                    playTone(audioContext, 1000, 0, 0.1, 'square');
                    playTone(audioContext, 1200, 0.12, 0.1, 'square');
                    playTone(audioContext, 1000, 0.24, 0.1, 'square');
                    break;
                case 'classic':
                default:
                    // Classic: simple beeps
                    if (sessionType === 'work') {
                        playTone(audioContext, 880, 0, 0.15, 'sine');
                        playTone(audioContext, 1100, 0.2, 0.15, 'sine');
                    } else {
                        playTone(audioContext, 440, 0, 0.4, 'sine');
                    }
                    break;
            }
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    }

    /**
     * Play a single tone
     */
    function playTone(audioContext, frequency, delay, duration, type) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type || 'sine';
        gainNode.gain.value = 0.2;

        const startTime = audioContext.currentTime + delay;
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.stop(startTime + duration);
    }

    // Public API
    return {
        init,
        get,
        setOnSettingsChange,
        isSoundEnabled,
        areBrowserNotificationsEnabled,
        isAutoStartEnabled,
        getSoundStyle,
        playPreviewSound
    };
})();
