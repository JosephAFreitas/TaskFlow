/*
  script.js - To-Do List Logic with Event Delegation, Persistence, and Accessibility

  Data Stored in localStorage:
  - Key: "todoTasks"
  - Value: JSON string of an array of task objects:
    [
      {
        id: <number>,         // unique identifier (Date.now())
        text: <string>,       // task description
        timestamp: <string>,  // formatted time (e.g., "2:45 PM")
        completed: <boolean>  // true if task is marked done
      }
    ]
*/

// Select the text input where the user types a new task
const taskInput = document.querySelector('#taskInput');

// Select the "Add Task" button that the user clicks to add a task
const addButton = document.querySelector('#addBtn');

// Select the <ul> element where task items will be added
const taskList = document.querySelector('#taskList');

// Storage key used for localStorage
const STORAGE_KEY = 'todoTasks';

// In-memory list of tasks (kept in sync with localStorage)
let tasks = [];

// Initialize app by loading tasks from localStorage and rendering them
function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      tasks = JSON.parse(saved);
    } catch (e) {
      // If parsing fails due to corrupted data, reset to empty array
      tasks = [];
    }
  }

  tasks.forEach((task) => addTaskToDOM(task));
}

// Persist the current tasks array to localStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Add event listener for Enter key in the input field to submit tasks
taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

// Add event listener for the Add Task button click
addButton.addEventListener('click', addTask);

// Use event delegation on the task list to handle all task-related clicks
taskList.addEventListener('click', (event) => {
  const target = event.target;
  const listItem = target.closest('.task-item');
  if (!listItem) return;

  const taskId = parseInt(listItem.dataset.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (target.classList.contains('done-btn')) {
    // Toggle the completed state of the task
    listItem.classList.toggle('completed');
    task.completed = listItem.classList.contains('completed');
    saveTasks();
  } else if (target.classList.contains('delete-btn')) {
    // Remove the task from the DOM and from the tasks array
    listItem.remove();
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
  } else if (target.classList.contains('edit-btn')) {
    // Enter edit mode for the task
    enterEditMode(task, listItem.querySelector('.task-text'));
  }
});

// Also handle double-click on task text for editing
taskList.addEventListener('dblclick', (event) => {
  if (event.target.classList.contains('task-text')) {
    const listItem = event.target.closest('.task-item');
    const taskId = parseInt(listItem.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      enterEditMode(task, event.target);
    }
  }
});

// Create and add a new task to the list
function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) {
    return;
  }

  const newTask = {
    id: Date.now(),  // Generate unique ID using current timestamp
    text: taskText,
    timestamp: formatCurrentTime(),
    completed: false,
  };

  tasks.push(newTask);
  saveTasks();
  addTaskToDOM(newTask);

  taskInput.value = '';
  taskInput.focus();
}

// Format the current local time as HH:MM AM/PM
function formatCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;
  const formattedHour = ((hours + 11) % 12) + 1;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
}

// Render a task object into the DOM with accessibility attributes
function addTaskToDOM(task) {
  const listItem = document.createElement('li');
  listItem.className = 'task-item';
  listItem.dataset.id = task.id;

  // Task text at top
  const taskSpan = document.createElement('span');
  taskSpan.className = 'task-text';
  taskSpan.textContent = task.text;  // Use textContent to prevent XSS

  // Bottom footer row: timestamp on left, buttons on right
  const timeSpan = document.createElement('span');
  timeSpan.className = 'task-timestamp';
  timeSpan.textContent = task.timestamp;

  // Action buttons: Done / Edit / Delete with aria-labels for accessibility
  const doneButton = document.createElement('button');
  doneButton.textContent = '✓';
  doneButton.className = 'done-btn';
  doneButton.setAttribute('aria-label', 'Mark task as done');

  const editButton = document.createElement('button');
  editButton.textContent = '✏️';
  editButton.className = 'edit-btn';
  editButton.setAttribute('aria-label', 'Edit task');

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.className = 'delete-btn';
  deleteButton.setAttribute('aria-label', 'Delete task');

  const actionContainer = document.createElement('div');
  actionContainer.className = 'task-actions';
  actionContainer.appendChild(doneButton);
  actionContainer.appendChild(editButton);
  actionContainer.appendChild(deleteButton);

  // Footer: timestamp + actions on same line
  const footerContainer = document.createElement('div');
  footerContainer.className = 'task-footer';
  footerContainer.appendChild(timeSpan);
  footerContainer.appendChild(actionContainer);

  // Content: wraps text + footer
  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';
  contentContainer.appendChild(taskSpan);
  contentContainer.appendChild(footerContainer);

  listItem.appendChild(contentContainer);

  if (task.completed) {
    listItem.classList.add('completed');
  }

  taskList.appendChild(listItem);
}

// Handle in-place editing of a task
function enterEditMode(task, taskSpan) {
  const originalText = task.text;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.value = originalText;
  editInput.className = 'task-edit-input';

  taskSpan.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  const saveChanges = () => {
    const newText = editInput.value.trim();

    if (newText) {
      task.text = newText;
      taskSpan.textContent = newText;  // Use textContent to prevent XSS

      const index = tasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        tasks[index].text = newText;
        saveTasks();
      }
    }

    editInput.replaceWith(taskSpan);
  };

  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      saveChanges();
    }
  });

  editInput.addEventListener('blur', saveChanges);
}

// Initialize the app when the script loads
init();
