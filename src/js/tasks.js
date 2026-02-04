/**
 * Tasks Module
 * Handles task list functionality
 */

const Tasks = (function() {
    let tasks = [];
    let activeTaskId = null;
    let onTasksChange = null;
    let onActiveTaskChange = null;
    let draggedTaskId = null;

    // DOM Elements
    const elements = {
        taskInput: document.getElementById('task-input'),
        taskEstimate: document.getElementById('task-estimate'),
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

        const estimatedPomodoros = parseInt(elements.taskEstimate.value) || 1;

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            estimatedPomodoros: Math.max(1, Math.min(10, estimatedPomodoros)),
            actualPomodoros: 0
        };

        tasks.push(task);
        elements.taskInput.value = '';
        elements.taskEstimate.value = '1';
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
            li.draggable = !task.completed;
            li.dataset.taskId = task.id;

            const estimated = task.estimatedPomodoros || 1;
            const actual = task.actualPomodoros || 0;
            const pomodoroClass = actual >= estimated ? 'complete' : '';

            li.innerHTML = `
                ${!task.completed ? '<span class="drag-handle">⋮⋮</span>' : ''}
                <input type="checkbox"
                       ${task.completed ? 'checked' : ''}
                       aria-label="Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-pomodoros ${pomodoroClass}">${actual}/${estimated} 🍅</span>
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

                // Drag and drop events
                li.addEventListener('dragstart', handleDragStart);
                li.addEventListener('dragend', handleDragEnd);
                li.addEventListener('dragover', handleDragOver);
                li.addEventListener('drop', handleDrop);
                li.addEventListener('dragleave', handleDragLeave);
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
     * Handle drag start
     */
    function handleDragStart(e) {
        draggedTaskId = e.currentTarget.dataset.taskId;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Handle drag end
     */
    function handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        draggedTaskId = null;

        // Remove all drag-over classes
        document.querySelectorAll('.task-item.drag-over').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    /**
     * Handle drag over
     */
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const targetId = e.currentTarget.dataset.taskId;
        if (targetId !== draggedTaskId) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave
     */
    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    /**
     * Handle drop
     */
    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const targetId = e.currentTarget.dataset.taskId;
        if (draggedTaskId && targetId && draggedTaskId !== targetId) {
            reorderTasks(draggedTaskId, targetId);
        }
    }

    /**
     * Reorder tasks
     */
    function reorderTasks(draggedId, targetId) {
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged task
        const [draggedTask] = tasks.splice(draggedIndex, 1);

        // Insert at new position
        const newTargetIndex = tasks.findIndex(t => t.id === targetId);
        tasks.splice(newTargetIndex, 0, draggedTask);

        render();
        notifyChange();
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
     * Increment actual pomodoros for a task
     */
    function incrementTaskPomodoro(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            task.actualPomodoros = (task.actualPomodoros || 0) + 1;
            render();
            notifyChange();
            return true;
        }
        return false;
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
        getActiveTaskId,
        incrementTaskPomodoro
    };
})();
