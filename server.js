const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Global variable to track logged-in user (simple session for beginner)
let loggedInUser = null;

// POST route for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Read users from users.json
    fs.readFile(path.join(__dirname, 'users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Server error reading users' });
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            loggedInUser = username;
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// GET route for current user
app.get('/api/user', (req, res) => {
    if (loggedInUser) {
        res.json({ username: loggedInUser });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});