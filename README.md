# TaskFlow

**Live Demo:** https://taskflow-joseph.onrender.com

A full-stack web application for intelligent task management with secure authentication and real-time synchronization.

---

## Preview

| Login Page | Desktop Dashboard | Mobile View |
| :--- | :--- | :--- |
| ![Login](screenshot1.png) | ![Dashboard](screenshot2.png) | ![Mobile](screenshot3.png) |

**TaskFlow** is a production-ready to-do list application demonstrating modern full-stack development practices. Built with vanilla JavaScript on the frontend and Node.js/Express on the backend, it features secure user authentication via bcrypt, timezone-aware date calculations, priority-based task sorting, and persistent data storage on PostgreSQL. The application emphasizes clean code architecture, accessibility standards, and responsive design patterns suitable for professional software engineering environments.

---

## Features

- **Secure User Login & Signup** – Password hashing with bcrypt (10 salt rounds), username validation, duplicate account detection
- **Dynamic Timezone-Aware Dashboard** – Personalized greeting with current date, open task count, and overdue task alerts
- **CRUD Operations** – Full Create, Read, Update, Delete functionality for task management with real-time database synchronization
- **Intelligent Urgency Sorting** – Tasks automatically prioritized by due date status (Overdue → Due Today → Due in X Days) and then by priority level
- **CSS Grid Responsive Design** – Modern, semantic layout that scales from mobile to desktop with professional styling and subtle animations
- **Date Validation** – Prevents selection of past dates at the input level and validates manual entry, with timezone-safe local date calculations
- **Ambient Background Animation** – Smooth, GPU-optimized breathing gradient animation on a fixed pseudo-element layer for visual polish

---

## Tech Stack

### Frontend
- **HTML5** – Semantic markup with ARIA labels for accessibility
- **CSS3** – Grid layout, flexbox, CSS animations (no preprocessors or frameworks)
- **Vanilla JavaScript** – ES6+ with event delegation, async/await, and DOM manipulation

### Backend
- **Node.js** – JavaScript runtime environment for server-side execution
- **Express.js** – Lightweight web framework for routing and middleware
- **PostgreSQL** (Neon) – Cloud-hosted relational database with connection pooling via `pg`
- **bcrypt** – Password hashing library with configurable salt rounds
- **RESTful API** – Standard HTTP methods (GET, POST, PUT, DELETE) for cross-origin data access

---

## Local Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** database (or Neon cloud account)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone [https://github.com/JosephAFreitas/TaskFlow.git](https://github.com/JosephAFreitas/TaskFlow.git)
   cd TaskFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the project root:
   ```bash
   DATABASE_URL=postgresql://username:password@hostname:5432/dbname
   NODE_ENV=development
   PORT=3000
   ```
   - Replace `username`, `password`, `hostname`, and `dbname` with your PostgreSQL credentials

4. **Initialize the database**
   - Ensure your PostgreSQL instance has the following tables:
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL
   );

   CREATE TABLE tasks (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id),
     text VARCHAR(500) NOT NULL,
     priority VARCHAR(20) DEFAULT 'Medium',
     completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     due_date DATE
   );
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   - The application will be available at `http://localhost:3000`

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Create a new account or log in with existing credentials
   - Begin managing your tasks

---

## Project Structure

```
taskflow/
├── public/
│   ├── index.html             # Main application interface
│   ├── login.html             # Authentication page
│   ├── styles.css             # Global styling and animations
│   ├── script.js              # Core application logic
│   └── login-script.js        # Authentication handler
├── server.js                  # Express server and API routes
├── db.js                      # PostgreSQL connection pool
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## Security Features

- **Password Hashing** – All user passwords are hashed with bcrypt using 10 salt rounds before storage
- **Input Validation** – Username (≥3 characters, alphanumeric only) and password (≥8 characters) validation on both client and server
- **Session Management** – In-memory user session tracking with logout functionality
- **Protected Routes** – All task endpoints require authentication; unauthenticated requests return 401 status
- **Database Security** – Parameterized queries to prevent SQL injection attacks

---

## Learning Outcomes

This project demonstrates proficiency in:
- Full-stack web development with vanilla JavaScript (no frameworks)
- RESTful API design and implementation
- Secure authentication patterns and password hashing
- Relational database design and SQL query optimization
- Frontend state management and DOM manipulation
- CSS Grid and responsive design techniques
- Timezone-aware date handling in JavaScript
- Professional code documentation and Git workflows

---

## License

This project is open source and available under the MIT License.

---

**Developed by Joseph Anthony Freitas | Engineered for performance, security, and scalability.** | Last Updated: March 23, 2026
