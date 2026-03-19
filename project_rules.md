# To-Do List Web Application - Project Rules

## Core Goals

1. **Create a Simple To-Do List Interface** - Build a user-friendly web application where users can add, view, and remove tasks.
2. **Practice Fundamental Web Development** - Strengthen understanding of basic HTML, CSS, and JavaScript concepts and how they work together.
3. **Implement Basic CRUD Operations** - Enable Create (add tasks), Read (display tasks), Update (mark complete), and Delete (remove tasks) functionality.
4. **Build a Responsive Design** - Ensure the application is easy to use and looks decent on different screen sizes.
5. **Learn Front-End Development Basics** - Gain hands-on experience with DOM manipulation, event handling, and styling.
6. **Add Backend Authentication** - Implement a simple login system using Node.js and Express to practice server-side development.
7. **Learn Full-Stack Development** - Understand how frontend and backend communicate, and how to structure a web application with both client and server components.

## Tech Stack

### Frontend (Client-Side)
- **HTML** - Structure and semantic markup for the application interface
- **CSS** - Styling and layout for a clean, visually appealing design
- **JavaScript** - Logic, interactivity, and DOM manipulation for dynamic functionality
- **Browser APIs** - Uses built-in browser features (no external libraries or frameworks)

### Backend (Server-Side)
- **Node.js** - JavaScript runtime environment that allows running JavaScript on the server
- **Express.js** - Web framework for Node.js that simplifies building web applications and APIs
- **JSON File Storage** - Simple file-based storage for user data (users.json) to practice data persistence before using databases
- **HTTP/HTTPS** - Standard web protocols for client-server communication

## Backend Architecture

### Server Structure
- **server.js** - Main server file that starts the Express application and defines all routes
- **users.json** - JSON file storing user accounts with username, password, and personal task arrays
- **public/** - Folder containing all frontend files (HTML, CSS, JavaScript) served by the Express server

### Authentication Flow
1. **Login Page** - User visits the site and sees a login form asking for username and password
2. **Signup Option** - Users can toggle to signup mode to create new accounts
3. **Account Creation** - New users provide username and password, checked for uniqueness
   - Username: minimum 3 characters, letters and numbers only (no spaces/special characters)
   - Password: minimum 8 characters
4. **Credential Verification** - Server checks submitted credentials against users.json file
5. **Password Hashing** - Passwords are stored using bcrypt; legacy plain-text passwords are upgraded on first successful login
6. **Session Management** - Upon successful login, server tracks the logged-in user for the session
6. **Protected Routes** - To-do list page requires authentication; unauthenticated users are redirected to login
7. **Dynamic Content** - To-do list title displays the logged-in user's name (e.g., "Jose's To-Do List")
8. **Logout Functionality** - User can log out to clear session and return to login page

### Data Persistence
- **User-Specific Storage** - Each user has a private tasks array stored in users.json
- **Server-Side Persistence** - Tasks survive browser restarts, device changes, and are accessible from any location
- **Real-Time Sync** - Changes are immediately saved to server when tasks are added, modified, or deleted

## Coding Rules

### 1. Always Explain the Code You Write Step-by-Step
Every piece of code added to this project must include comments that clearly explain:
- **What** the code does
- **Why** it's necessary
- **How** it works (especially for functions and logic)

This ensures the codebase remains easy to understand and learn from during the development process.

### 2. Keep Code Simple and Beginner-Friendly
- Use clear, descriptive variable and function names
- Avoid complex patterns or advanced JavaScript features when simpler solutions exist
- Write code that is easy to read and maintain

### 3. Test Functionality as You Build
- Test changes in the browser immediately after writing code
- Verify that new features work as expected before moving to the next feature
- Test both frontend and backend components separately and together

### 4. Security First (Even for Learning)
- Use bcrypt (salt rounds = 10) to hash passwords before storing them
- Validate all user inputs on both client and server side- Enforce strong username/password requirements on signup- Use HTTPS in production (though we'll use HTTP for local development)

### 5. Professional Comment Styling
- Add a single, sleek comment block at the top of each file describing its primary responsibility
- Comments must be technical and concise, describing logic without tutorial language
- Remove all 'Step 1', 'Step 2', or instructional phrasing
- Ensure consistent spacing and capitalization across all comments
- Preserve functional code and styling when refactoring comments

---

**Last Updated:** March 18, 2026
