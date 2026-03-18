/*
  script.js - To-Do List Logic (with persistence, edit mode, and Enter key support)

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


/*
  STEP 1: Initialize app
  Load tasks from localStorage and render them.
*/
function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      tasks = JSON.parse(saved);
    } catch (e) {
      tasks = [];
    }
  }

  tasks.forEach((task) => addTaskToDOM(task));
}


/*
  STEP 2: Persist tasks to localStorage
*/
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}


/*
  STEP 3: Enter key support
  Pressing Enter in the input triggers the same behavior as clicking Add Task.
*/
taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});


/*
  STEP 4: Add Task button handler
*/
addButton.addEventListener('click', addTask);


/*
  STEP 5: Add a new task
*/
function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) {
    return;
  }

  const newTask = {
    id: Date.now(),
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


/*
  STEP 6: Format the current local time as HH:MM AM/PM
*/
function formatCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;
  const formattedHour = ((hours + 11) % 12) + 1;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
}


/*
  STEP 7: Render a task object into the DOM
*/
function addTaskToDOM(task) {
  const listItem = document.createElement('li');
  listItem.className = 'task-item';
  listItem.dataset.id = task.id;

  // Content: text + timestamp
  const taskSpan = document.createElement('span');
  taskSpan.className = 'task-text';
  taskSpan.textContent = task.text;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'task-timestamp';
  timeSpan.textContent = task.timestamp;

  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';
  contentContainer.appendChild(taskSpan);
  contentContainer.appendChild(timeSpan);

  // Action buttons: Done / Edit / Delete
  const doneButton = document.createElement('button');
  doneButton.textContent = '✓';
  doneButton.className = 'done-btn';

  const editButton = document.createElement('button');
  editButton.textContent = '✏️';
  editButton.className = 'edit-btn';

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.className = 'delete-btn';

  const actionContainer = document.createElement('div');
  actionContainer.className = 'task-actions';
  actionContainer.appendChild(doneButton);
  actionContainer.appendChild(editButton);
  actionContainer.appendChild(deleteButton);

  listItem.appendChild(contentContainer);
  listItem.appendChild(actionContainer);

  if (task.completed) {
    listItem.classList.add('completed');
  }

  // Toggle completed state
  doneButton.addEventListener('click', () => {
    listItem.classList.toggle('completed');
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks[index].completed = listItem.classList.contains('completed');
      saveTasks();
    }
  });

  // Delete task
  deleteButton.addEventListener('click', () => {
    listItem.remove();
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
  });

  // Edit task (via button or double-click)
  const startEdit = () => enterEditMode(task, taskSpan);
  editButton.addEventListener('click', startEdit);
  taskSpan.addEventListener('dblclick', startEdit);

  taskList.appendChild(listItem);
}


/*
  STEP 8: Edit-in-place functionality
*/
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
      taskSpan.textContent = newText;

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
