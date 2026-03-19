/*
  script.js - To-Do List Logic with Event Delegation and Server Persistence

  Tasks stored on server per user with id, text, timestamp, completed properties.
*/

console.log('Script loaded successfully');

// Fetch current logged-in username and update page title
async function loadUser() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    if (data.username) {
      const h1 = document.querySelector('h1');
      h1.innerHTML = `<span class="username">${data.username}'s</span><br>To-Do List`;
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
const prioritySelect = document.querySelector('#prioritySelect');
const addButton = document.querySelector('#addBtn');
const taskList = document.querySelector('#taskList');
const logoutButton = document.querySelector('#logoutBtn');

// In-memory tasks array
let tasks = [];

// Normalize priority string to a sort value
function priorityValue(priority) {
  const mapping = { High: 0, Medium: 1, Low: 2 };
  return mapping[priority] ?? 2;
}

// Normalize createdAt field for legacy tasks or DB timestamps
function normalizeCreatedAt(task) {
  if (typeof task.createdAt === 'number') {
    return task.createdAt;
  }

  if (typeof task.id === 'number' && String(task.id).length >= 12) {
    return task.id;
  }

  if (task.created_at) {
    return new Date(task.created_at).getTime();
  }

  return Date.now();
}

// Format a timestamp as a date/time string with relative days ago
function formatDateWithRelative(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const datePart = then.toLocaleDateString(undefined, options);

  const timeOptions = { hour: 'numeric', minute: '2-digit' };
  const timePart = then.toLocaleTimeString(undefined, timeOptions);

  const oneDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((now.setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0)) / oneDay);
  const relative = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`;

  return `${datePart} at ${timePart} - ${relative}`;
}

// Sort tasks by priority (High -> Medium -> Low) then by newest createdAt
function sortTasks() {
  tasks.sort((a, b) => {
    const p = priorityValue(a.priority) - priorityValue(b.priority);
    if (p !== 0) return p;

    const aTime = normalizeCreatedAt(a);
    const bTime = normalizeCreatedAt(b);
    return bTime - aTime;
  });
}

// Render all tasks to the DOM
function renderTasks() {
  sortTasks();
  taskList.innerHTML = '';
  tasks.forEach((task) => addTaskToDOM(task));
}

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

  // Ensure tasks include priority and createdAt
  tasks = tasks.map((task) => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
    priority: task.priority || 'Low',
    createdAt: normalizeCreatedAt(task),
  }));
  renderTasks();
}

// Add new task from input
async function addTask() {
  const taskText = taskInput.value.trim();
  const priority = prioritySelect.value;
  if (!taskText) {
    return;
  }

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: taskText, priority, completed: false })
    });

    if (response.ok) {
      const newTask = await response.json();
      newTask.createdAt = normalizeCreatedAt(newTask);
      tasks.push(newTask);
      sortTasks();
      renderTasks();
    } else {
      console.error('Failed to add task');
    }
  } catch (error) {
    console.error('Failed to add task:', error);
  }

  taskInput.value = '';
  taskInput.focus();
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
taskList.addEventListener('click', handleTaskClick);

async function handleTaskClick(event) {
  const target = event.target;
  const listItem = target.closest('.task-item');
  if (!listItem) return;

  const taskId = parseInt(listItem.dataset.id);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (target.classList.contains('done-btn')) {
    const newCompleted = !task.completed;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      });
      if (response.ok) {
        listItem.classList.toggle('completed');
        task.completed = newCompleted;
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  } else if (target.classList.contains('delete-btn')) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        tasks = tasks.filter((t) => t.id !== taskId);
        renderTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  } else if (target.classList.contains('edit-btn')) {
    enterEditMode(task, listItem.querySelector('.task-text'));
  }
}

// Handle double-click for editing
taskList.addEventListener('dblclick', handleTaskDoubleClick);

function handleTaskDoubleClick(event) {
  if (event.target.classList.contains('task-text')) {
    const listItem = event.target.closest('.task-item');
    const taskId = parseInt(listItem.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      enterEditMode(task, event.target);
    }
  }
}

// Logout and redirect to login page
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
  timeSpan.className = 'task-created';
  const createdAt = normalizeCreatedAt(task);
  timeSpan.textContent = formatDateWithRelative(createdAt);

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

  // Apply task priority class for styling
  const priority = task.priority || 'Low';
  listItem.classList.add(`priority-${priority.toLowerCase()}`);

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

  const saveChanges = async () => {
    const newText = editInput.value.trim();

    if (newText && newText !== originalText) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText })
        });
        if (response.ok) {
          task.text = newText;
          taskSpan.textContent = newText;
        } else {
          taskSpan.textContent = originalText;
        }
      } catch (error) {
        console.error('Failed to update task text:', error);
        taskSpan.textContent = originalText;
      }
    } else {
      taskSpan.textContent = originalText;
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
