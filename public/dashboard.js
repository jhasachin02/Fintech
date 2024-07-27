document.addEventListener('DOMContentLoaded', function() {
    // Fetch user account info
    fetch('/account-info')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('accountBalance').textContent = `Balance: $${data.balance}`;
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error('Error fetching account info:', error));

    // Handle transaction form
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;

        fetch('/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: 1, amount, type }) // Replace with actual user ID
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Transaction successful');
                // Update balance
                return fetch('/account-info');
            } else {
                alert(data.message);
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('accountBalance').textContent = `Balance: $${data.balance}`;
            }
        })
        .catch(error => console.error('Error processing transaction:', error));
    });

    // Handle logout
    document.getElementById('logout').addEventListener('click', function() {
        window.location.href = 'login.html';
    });
});
