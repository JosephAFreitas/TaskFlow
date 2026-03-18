// Login form handling with signup toggle

// Track current mode
let isSignupMode = false;

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const endpoint = isSignupMode ? '/signup' : '/login';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            if (isSignupMode) {
                // After successful signup, automatically login
                const loginResponse = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                const loginData = await loginResponse.json();
                if (loginData.success) {
                    window.location.href = 'index.html';
                } else {
                    document.getElementById('errorMessage').textContent = 'Account created but login failed';
                }
            } else {
                window.location.href = 'index.html';
            }
        } else {
            document.getElementById('errorMessage').textContent = data.error || 'Request failed';
        }
    } catch (error) {
        document.getElementById('errorMessage').textContent = 'Network error';
    }
});

// Handle mode toggle
document.getElementById('toggleMode').addEventListener('click', (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;

    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleLink = document.getElementById('toggleMode');

    if (isSignupMode) {
        formTitle.textContent = 'Sign Up for To-Do List';
        submitBtn.textContent = 'Create Account';
        toggleLink.textContent = 'Already have an account? Login';
    } else {
        formTitle.textContent = 'Login to Your To-Do List';
        submitBtn.textContent = 'Login';
        toggleLink.textContent = 'Don\'t have an account? Sign Up';
    }

    // Clear any error messages
    document.getElementById('errorMessage').textContent = '';
});