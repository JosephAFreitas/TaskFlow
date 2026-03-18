// Handle form submission for login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Redirect to index.html on successful login
            window.location.href = 'index.html';
        } else {
            // Display error message
            document.getElementById('errorMessage').textContent = data.error || 'Login failed';
        }
    } catch (error) {
        document.getElementById('errorMessage').textContent = 'Network error';
    }
});