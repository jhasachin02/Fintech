document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const loginId = document.getElementById('loginId').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginId, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'dashboard.html'; // Redirect to dashboard or other page
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});
