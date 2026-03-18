// Main application server and authentication routes

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Global variable for session tracking
let loggedInUser = null;

// Handle user login authentication
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Read user data from JSON file
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

// Return current logged-in user
app.get('/api/user', (req, res) => {
    if (loggedInUser) {
        res.json({ username: loggedInUser });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Handle user logout by clearing session
app.get('/logout', (req, res) => {
    loggedInUser = null;
    res.json({ success: true });
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});