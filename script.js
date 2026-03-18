/*
  STEP 1: Select HTML elements from the page
  We use query selectors to get the input field, button, and list container.
*/

// Select the text input where the user types a new task
const taskInput = document.querySelector('#taskInput');

// Select the "Add Task" button that the user clicks to add a task
const addButton = document.querySelector('#addBtn');

// Select the <ul> element where task items will be added
const taskList = document.querySelector('#taskList');


/*
  STEP 2: Add a click event listener to the button
  When the user clicks, we run the addTask function.
*/
addButton.addEventListener('click', addTask);


/*
  STEP 3: Define the addTask function
  This function reads the input value, creates a new task card, and appends it to the list.
*/
function addTask() {
  // Read the current input value (trim removes leading/trailing spaces)
  const taskText = taskInput.value.trim();

  // If the input is empty, do nothing and exit the function
  if (!taskText) {
    return;
  }

  // Create a new list item (<li>) to hold the task card
  const listItem = document.createElement('li');
  listItem.className = 'task-item';

  // Create a span to hold the task text for styling and structure
  const taskSpan = document.createElement('span');
  taskSpan.textContent = taskText;
  taskSpan.className = 'task-text';

  // STEP: Create a timestamp (local device time) for when the task was added
  const timestamp = new Date();

  // Format the time as HH:MM AM/PM (e.g., "2:45 PM")
  const hours = timestamp.getHours();
  const minutes = timestamp.getMinutes();
  const isPM = hours >= 12;
  const formattedHour = ((hours + 11) % 12) + 1; // converts 0-23 to 1-12
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const timeString = `${formattedHour}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;

  // Create an element to display the timestamp
  const timeSpan = document.createElement('span');
  timeSpan.textContent = timeString;
  timeSpan.className = 'task-timestamp';

  // Create a container for the text + timestamp to keep layout clean
  const contentContainer = document.createElement('div');
  contentContainer.className = 'task-content';
  contentContainer.appendChild(taskSpan);
  contentContainer.appendChild(timeSpan);

  // Create a "Done" button to mark the task as completed
  const doneButton = document.createElement('button');
  doneButton.textContent = '✓';
  doneButton.className = 'done-btn';

  // Toggle the .completed state on the task item when Done is clicked
  doneButton.addEventListener('click', () => {
    listItem.classList.toggle('completed');
  });

  // Create a delete button so the user can remove the task
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.className = 'delete-btn';

  // When the delete button is clicked, remove this task item from the list
  deleteButton.addEventListener('click', () => {
    listItem.remove();
  });

  // Create a container for action buttons to keep them aligned
  const actionContainer = document.createElement('div');
  actionContainer.className = 'task-actions';
  actionContainer.appendChild(doneButton);
  actionContainer.appendChild(deleteButton);

  // Add the content and action buttons into the list item
  listItem.appendChild(contentContainer);
  listItem.appendChild(actionContainer);

  // Append the new list item to the task list (<ul>)
  taskList.appendChild(listItem);

  // Clear the input field so the user can type a new task
  taskInput.value = '';

  // Optional: Return focus to the input so the user can keep typing
  taskInput.focus();
}
