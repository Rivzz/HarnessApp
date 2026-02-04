/**
 * Tasks Module
 * Handles task list functionality
 */

const Tasks = (function() {
    let tasks = [];
    let activeTaskId = null;
    let onTasksChange = null;
    let onActiveTaskChange = null;

    // DOM Elements
    const elements = {
        taskInput: document.getElementById('task-input'),
        addTaskBtn: document.getElementById('add-task-btn'),
        taskList: document.getElementById('task-list')
    };

    /**
     * Initialize tasks module
     */
    function init(savedTasks, savedActiveTaskId) {
        if (savedTasks && Array.isArray(savedTasks)) {
            tasks = savedTasks;
        }
        if (savedActiveTaskId) {
            // Verify the task still exists
            const taskExists = tasks.some(t => t.id === savedActiveTaskId && !t.completed);
            activeTaskId = taskExists ? savedActiveTaskId : null;
        }
        bindEvents();
        render();
    }

    /**
     * Bind UI events
     */
    function bindEvents() {
        elements.addTaskBtn.addEventListener('click', addTask);
        elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    /**
     * Add a new task
     */
    function addTask() {
        const text = elements.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        elements.taskInput.value = '';
        render();
        notifyChange();
    }

    /**
     * Toggle task completion
     */
    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedAt = new Date().toISOString();
                // Clear active task if it was completed
                if (activeTaskId === id) {
                    setActiveTask(null);
                }
            } else {
                delete task.completedAt;
            }
            render();
            notifyChange();
        }
    }

    /**
     * Delete a task
     */
    function deleteTask(id) {
        // Clear active task if it was deleted
        if (activeTaskId === id) {
            setActiveTask(null);
        }
        tasks = tasks.filter(t => t.id !== id);
        render();
        notifyChange();
    }

    /**
     * Set active task
     */
    function setActiveTask(id) {
        activeTaskId = id;
        render();
        if (onActiveTaskChange) {
            const activeTask = id ? tasks.find(t => t.id === id) : null;
            onActiveTaskChange(activeTask);
        }
    }

    /**
     * Get active task
     */
    function getActiveTask() {
        if (!activeTaskId) return null;
        return tasks.find(t => t.id === activeTaskId) || null;
    }

    /**
     * Get active task ID
     */
    function getActiveTaskId() {
        return activeTaskId;
    }

    /**
     * Render the task list
     */
    function render() {
        elements.taskList.innerHTML = '';

        if (tasks.length === 0) {
            elements.taskList.innerHTML = '<li class="empty-state">No tasks yet. Add one above!</li>';
            return;
        }

        // Sort: incomplete first, then completed
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            const isActive = task.id === activeTaskId;
            li.className = `task-item${task.completed ? ' completed' : ''}${isActive ? ' active' : ''}`;
            li.innerHTML = `
                <input type="checkbox"
                       ${task.completed ? 'checked' : ''}
                       aria-label="Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <button class="icon-btn delete-btn" aria-label="Delete task">&times;</button>
            `;

            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            // Click on task text to set as active (only for incomplete tasks)
            const taskText = li.querySelector('.task-text');
            if (!task.completed) {
                taskText.style.cursor = 'pointer';
                taskText.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setActiveTask(isActive ? null : task.id);
                });
            }

            elements.taskList.appendChild(li);
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Notify of changes (for saving)
     */
    function notifyChange() {
        if (onTasksChange) {
            onTasksChange(tasks);
        }
    }

    /**
     * Set callback for task changes
     */
    function setOnTasksChange(callback) {
        onTasksChange = callback;
    }

    /**
     * Set callback for active task changes
     */
    function setOnActiveTaskChange(callback) {
        onActiveTaskChange = callback;
    }

    /**
     * Get all tasks
     */
    function getTasks() {
        return [...tasks];
    }

    /**
     * Get completed tasks count
     */
    function getCompletedCount() {
        return tasks.filter(t => t.completed).length;
    }

    /**
     * Clear all completed tasks
     */
    function clearCompleted() {
        tasks = tasks.filter(t => !t.completed);
        render();
        notifyChange();
    }

    // Public API
    return {
        init,
        getTasks,
        getCompletedCount,
        clearCompleted,
        setOnTasksChange,
        setOnActiveTaskChange,
        setActiveTask,
        getActiveTask,
        getActiveTaskId
    };
})();
