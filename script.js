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
  This function reads the input value, creates a new task item, and appends it to the list.
*/
function addTask() {
  // Read the current input value (trim removes leading/trailing spaces)
  const taskText = taskInput.value.trim();

  // If the input is empty, do nothing and exit the function
  if (!taskText) {
    return;
  }

  // Create a new list item (<li>) to hold the task text
  const listItem = document.createElement('li');
  listItem.className = 'task-item';

  // Create a span to hold the task text for styling and structure
  const taskSpan = document.createElement('span');
  taskSpan.textContent = taskText;
  taskSpan.className = 'task-text';

  // Create a delete button so the user can remove the task
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '✕';
  deleteButton.className = 'delete-btn';

  // When the delete button is clicked, remove this task item from the list
  deleteButton.addEventListener('click', () => {
    listItem.remove();
  });

  // Add the task text and delete button into the list item
  listItem.appendChild(taskSpan);
  listItem.appendChild(deleteButton);

  // Append the new list item to the task list (<ul>)
  taskList.appendChild(listItem);

  // Clear the input field so the user can type a new task
  taskInput.value = '';

  // Optional: Return focus to the input so the user can keep typing
  taskInput.focus();
}
