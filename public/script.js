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
      currentUsername = data.username;
      const h1 = document.querySelector('h1');
      h1.innerHTML = `<span class="username">${currentUsername}'s</span><br>To-Do List`;
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
const dueDateInput = document.querySelector('#dueDateInput');
const prioritySelect = document.querySelector('#prioritySelect');
const addButton = document.querySelector('#addBtn');
const taskList = document.querySelector('#taskList');
const logoutButton = document.querySelector('#logoutBtn');
const greetingContainer = document.querySelector('#greetingContainer');

// In-memory tasks array
let tasks = [];
let currentUsername = '';

// Build a local YYYY-MM-DD string without UTC conversion
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Enforce no-past-date selection in the native date picker
function applyDueDateMinConstraint() {
  if (!dueDateInput) return;
  dueDateInput.min = getLocalDateString();
}

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

  if (task.createdAt) {
    return new Date(task.createdAt).getTime();
  }

  return Date.now();
}

// Parse YYYY-MM-DD as a local date to avoid UTC timezone drift
function parseDueDateLocal(dueDate) {
  if (!dueDate) return null;

  if (dueDate instanceof Date) {
    return new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  }

  if (typeof dueDate === 'string') {
    const match = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, monthIndex, day);
    }
  }

  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Calculate urgency status based on due date
function getUrgencyStatus(dueDate) {
  if (!dueDate) return 'No Date';

  const today = startOfTodayLocal();
  const due = parseDueDateLocal(dueDate);
  if (!due) return 'No Date';

  const daysDiff = Math.round((due - today) / (24 * 60 * 60 * 1000));

  if (daysDiff < 0) return 'Overdue';
  if (daysDiff === 0) return 'Due Today';
  return daysDiff === 1 ? 'Due in 1 Day' : `Due in ${daysDiff} Days`;
}

// Map urgency status to a CSS class
function getUrgencyClass(status) {
  if (status === 'Overdue') return 'urgency-overdue';
  if (status === 'Due Today') return 'urgency-today';
  if (status.startsWith('Due in')) return 'urgency-future';
  return 'urgency-no-date';
}

// Determine urgency group for sorting
function getUrgencyRank(status) {
  if (status === 'Overdue') return 0;
  if (status === 'Due Today') return 1;
  if (status.startsWith('Due in')) return 2;
  return 3;
}

// Build and render dashboard greeting using local time and current task urgency
function updateGreeting() {
  if (!greetingContainer) return;

  const now = new Date();
  const hour = now.getHours();

  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 18) timeGreeting = 'Good afternoon';

  const displayName = currentUsername || 'there';
  const currentDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const openTasks = tasks.filter((task) => !task.completed);
  const overdueCount = openTasks.filter((task) => getUrgencyStatus(task.dueDate) === 'Overdue').length;
  const dueTodayCount = openTasks.filter((task) => getUrgencyStatus(task.dueDate) === 'Due Today').length;

  let statusMessage = 'You are all caught up for today.';
  if (overdueCount > 0) {
    statusMessage = overdueCount === 1 ? 'You have 1 overdue task.' : `You have ${overdueCount} overdue tasks.`;
  } else if (dueTodayCount > 0) {
    statusMessage = dueTodayCount === 1 ? 'You have 1 task due today.' : `You have ${dueTodayCount} tasks due today.`;
  }

  greetingContainer.innerHTML = `
    <span class="greeting-title">${timeGreeting}, ${displayName}.</span>
    <span class="greeting-date">${currentDate}</span>
    <span class="greeting-status">${statusMessage}</span>
  `;
}

// Format a timestamp as a date/time string with relative days ago
function formatDateWithRelative(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);

  if (Number.isNaN(then.getTime())) {
    return 'Invalid date';
  }

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const datePart = then.toLocaleDateString(undefined, options);

  const timeOptions = { hour: 'numeric', minute: '2-digit' };
  const timePart = then.toLocaleTimeString(undefined, timeOptions);

  const oneDay = 24 * 60 * 60 * 1000;
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdLocal = new Date(then.getFullYear(), then.getMonth(), then.getDate());

  // Clamp negative values caused by timezone edge cases so created timestamps never show "-1 days ago".
  const daysDiff = Math.max(0, Math.floor((todayLocal - createdLocal) / oneDay));
  const relative = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`;

  return `${datePart} at ${timePart} - ${relative}`;
}

// Sort tasks by urgency, then priority, then due date / createdAt
function sortTasks() {
  tasks.sort((a, b) => {
    const aUrgency = getUrgencyStatus(a.dueDate);
    const bUrgency = getUrgencyStatus(b.dueDate);

    const urgencyDiff = getUrgencyRank(aUrgency) - getUrgencyRank(bUrgency);
    if (urgencyDiff !== 0) return urgencyDiff;

    const p = priorityValue(a.priority) - priorityValue(b.priority);
    if (p !== 0) return p;

    // Within the same urgency group, further sort by due date (earliest first)
    if (a.dueDate || b.dueDate) {
      const aDueDate = parseDueDateLocal(a.dueDate);
      const bDueDate = parseDueDateLocal(b.dueDate);
      const aDue = aDueDate ? aDueDate.getTime() : Infinity;
      const bDue = bDueDate ? bDueDate.getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
    }

    // Fallback to createdAt (most recent first)
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
  updateGreeting();
}

// Initialize app by loading user and tasks
async function init() {
  await loadUser();
  applyDueDateMinConstraint();

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
    dueDate: task.due_date || null,
  }));
  renderTasks();

  // Initialize Add button disabled state
  updateAddButtonState();
}

// Add new task from input
async function addTask() {
  const taskText = taskInput.value.trim();
  const priority = prioritySelect.value;
  if (!taskText) {
    return;
  }

  const dueDateValue = dueDateInput.value || null;
  const todayLocal = getLocalDateString();

  // Guard against manual input of dates earlier than today.
  if (dueDateValue && dueDateValue < todayLocal) {
    alert('Please select today or a future due date.');
    dueDateInput.focus();
    return;
  }

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: taskText, priority, completed: false, due_date: dueDateValue })
    });

    if (response.ok) {
      const newTask = await response.json();
      newTask.createdAt = normalizeCreatedAt(newTask);
      newTask.dueDate = newTask.due_date || null;
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
  dueDateInput.value = '';
  updateAddButtonState();
  taskInput.focus();
}

// Update Add button disabled state based on task input
function updateAddButtonState() {
  const hasText = taskInput.value.trim().length > 0;
  addButton.disabled = !hasText;
  addButton.style.opacity = hasText ? '1' : '0.5';
  addButton.style.cursor = hasText ? 'pointer' : 'not-allowed';
}

// Handle input changes to manage button state
taskInput.addEventListener('input', updateAddButtonState);

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
        updateGreeting();
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

  const urgencyStatus = getUrgencyStatus(task.dueDate);
  const urgencySpan = document.createElement('span');
  urgencySpan.className = `task-urgency ${getUrgencyClass(urgencyStatus)}`;
  urgencySpan.textContent = urgencyStatus;

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

  // Wrap metadata (timestamp and urgency) for mobile stack layout
  const metadataContainer = document.createElement('div');
  metadataContainer.className = 'task-metadata';
  metadataContainer.appendChild(timeSpan);
  metadataContainer.appendChild(urgencySpan);

  const footerContainer = document.createElement('div');
  footerContainer.className = 'task-footer';
  footerContainer.appendChild(metadataContainer);
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
