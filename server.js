// Main application server and authentication routes
// Passwords are hashed using bcrypt for secure storage

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

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
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const storedPassword = user.password;
        const isHashed = typeof storedPassword === 'string' && storedPassword.startsWith('$2');

        // Handle legacy plain-text passwords by upgrading to a hash on first successful login
        if (!isHashed) {
            if (password !== storedPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            bcrypt.hash(password, SALT_ROUNDS).then((hash) => {
                user.password = hash;

                fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), (writeErr) => {
                    if (writeErr) {
                        return res.status(500).json({ error: 'Server error saving user' });
                    }

                    loggedInUser = username;
                    res.json({ success: true });
                });
            }).catch(() => {
                res.status(500).json({ error: 'Server error validating credentials' });
            });

            return;
        }

        bcrypt.compare(password, storedPassword).then((match) => {
            if (match) {
                loggedInUser = username;
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }).catch(() => {
            res.status(500).json({ error: 'Server error validating credentials' });
        });
    });
});

// Handle user signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Read user data from JSON file
    fs.readFile(path.join(__dirname, 'users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Server error reading users' });
        }

        let users = JSON.parse(data);
        const existingUser = users.find(u => u.username === username);

        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password before storing
        bcrypt.hash(password, SALT_ROUNDS).then((hash) => {
            users.push({ username, password: hash, tasks: [] });

            // Write back to file
            fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Server error saving user' });
                }
                res.json({ success: true });
            });
        }).catch(() => {
            res.status(500).json({ error: 'Server error creating account' });
        });
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

// Get tasks for logged-in user
app.get('/api/tasks', (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    // Read user data
    fs.readFile(path.join(__dirname, 'users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Server error reading users' });
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.username === loggedInUser);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.tasks || []);
    });
});

// Save tasks for logged-in user
app.post('/api/tasks', (req, res) => {
    if (!loggedInUser) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const tasks = req.body;

    if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Tasks must be an array' });
    }

    // Read user data
    fs.readFile(path.join(__dirname, 'users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Server error reading users' });
        }

        let users = JSON.parse(data);
        const userIndex = users.findIndex(u => u.username === loggedInUser);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user's tasks
        users[userIndex].tasks = tasks;

        // Write back to file
        fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Server error saving tasks' });
            }
            res.json({ success: true });
        });
    });
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