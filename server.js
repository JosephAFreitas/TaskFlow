// Main application server and authentication routes
// Passwords are hashed using bcrypt for secure storage

const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Parse JSON request bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Global variable for session tracking
let loggedInUser = null;

// Handle user login authentication
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            loggedInUser = { username: user.username, id: user.id };
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error validating credentials' });
    }
});

// Handle user signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Validate username: at least 3 characters, no spaces or special characters
    if (username.length < 3 || /[^a-zA-Z0-9]/.test(username)) {
        return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters and numbers' });
    }

    // Validate password: at least 8 characters
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        // Check if username exists
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password and insert user
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id', [username, hash]);
        const userId = result.rows[0].id;

        loggedInUser = { username, id: userId };
        res.json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error creating account' });
    }
});

// Return current logged-in user
app.get('/api/user', (req, res) => {
    if (loggedInUser) {
        res.json({ username: loggedInUser.username });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Get tasks for logged-in user
app.get('/api/tasks', async (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    try {
        const result = await pool.query('SELECT id, text, priority, completed, created_at, due_date FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [loggedInUser.id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error reading tasks' });
    }
});

// Add new task for logged-in user
app.post('/api/tasks', async (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { text, priority, completed, due_date } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Task text is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, text, priority, completed, due_date, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, created_at, due_date',
            [loggedInUser.id, text, priority || 'Low', completed || false, due_date || null]
        );
        const newTask = {
            id: result.rows[0].id,
            text,
            priority: priority || 'Low',
            completed: completed || false,
            created_at: result.rows[0].created_at,
            due_date: result.rows[0].due_date
        };
        res.json(newTask);
    } catch (error) {
        console.error('Add task error:', error);
        res.status(500).json({ error: 'Server error adding task' });
    }
});

// Update task for logged-in user
app.put('/api/tasks/:id', async (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const taskId = parseInt(req.params.id);
    const { text, completed, due_date } = req.body;

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (text !== undefined) {
        updates.push(`text = $${paramIndex++}`);
        params.push(text);
    }

    if (completed !== undefined) {
        updates.push(`completed = $${paramIndex++}`);
        params.push(completed);
    }

    if (due_date !== undefined) {
        updates.push(`due_date = $${paramIndex++}`);
        params.push(due_date || null);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No update fields provided' });
    }

    params.push(taskId, loggedInUser.id);

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

    try {
        const result = await pool.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

// Delete task for logged-in user
app.delete('/api/tasks/:id', async (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
    }

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, loggedInUser.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error deleting task' });
    }
});

// Handle user logout by clearing session
app.get('/logout', (req, res) => {
    loggedInUser = null;
    res.json({ success: true });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ time: result.rows[0], message: 'Database connected successfully' });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});