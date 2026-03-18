/*
  script.js - To-Do List Logic with Event Delegation and Server Persistence

  Tasks stored on server per user with id, text, timestamp, completed properties.
*/

// Fetch current logged-in username and update page title
async function loadUser() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    if (data.username) {
      document.querySelector('h1').textContent = `${data.username}'s To-Do List`;
    } else {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Failed to load user:', error);
    window.location.href = 'login.html';
  }
}

// DOM element selectors
const taskInput = document.querySelector('#taskInput');
const addButton = document.querySelector('#addBtn');
const taskList = document.querySelector('#taskList');
const logoutButton = document.querySelector('#logoutBtn');

// In-memory tasks array
let tasks = [];

// Initialize app by loading user and tasks
async function init() {
  await loadUser();

  try {
    const response = await fetch('/api/tasks');
    if (response.ok) {
      tasks = await response.json();
    } else {
      tasks = [];
    }
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasks = [];
  }

  tasks.forEach((task) => addTaskToDOM(task));
}

// Persist tasks to server
async function saveTasks() {
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tasks)
    });
  } catch (error) {
    console.error('Failed to save tasks:', error);
  }
}

// Handle Enter key in input field
taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTask();
  }
});

// Handle add button click
addButton.addEventListener('click', addTask);

// Handle logout button click
logoutButton.addEventListener('click', logout);

// Event delegation for task actions
taskList.addEventListener('click', (event) => {
  const target = event.target;
  const listItem = target.closest('.task-item');
  if (!listItem) return;

  const taskId = parseInt(listItem.dataset.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (target.classList.contains('done-btn')) {
    listItem.classList.toggle('completed');
    task.completed = listItem.classList.contains('completed');
    saveTasks();
  } else if (target.classList.contains('delete-btn')) {
    listItem.remove();
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
  } else if (target.classList.contains('edit-btn')) {
    enterEditMode(task, listItem.querySelector('.task-text'));
  }
});

// Handle double-click for editing
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

// Add new task from input
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

// Handle user logout
async function logout() {
  console.log('Logout clicked');
  try {
    const response = await fetch('/logout');
    const data = await response.json();
    console.log('Logout response:', data);
    if (data.success) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Format current time as HH:MM AM/PM
function formatCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isPM = hours >= 12;
  const formattedHour = ((hours + 11) % 12) + 1;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHour}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
}

// Render task to DOM
function addTaskToDOM(task) {
  const listItem = document.createElement('li');
  listItem.className = 'task-item';
  listItem.dataset.id = task.id;

  const taskSpan = document.createElement('span');
  taskSpan.className = 'task-text';
  taskSpan.textContent = task.text;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'task-time';
  timeSpan.textContent = task.timestamp;

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

  const footerContainer = document.createElement('div');
  footerContainer.className = 'task-footer';
  footerContainer.appendChild(timeSpan);
  footerContainer.appendChild(actionContainer);

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

// Enter edit mode for task
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

// Initialize app on load
init();
