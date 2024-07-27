const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Hasura GraphQL endpoint
const HASURA_ENDPOINT = 'https://exact-pangolin-96.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'q8AGezgHXFh24EU1hLVYrnVGxw76h1Kjz4mXHXQg3fdD8BtfAw6Frx3r0sAnvscu';

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'test@gmail.com', // Your email 
        pass: 'test@123'     // Your email password
    }
});

// Function to send email notifications
async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: '<your-email@gmail.com>',
        to: to,
        subject: subject,
        text: text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Login endpoint
app.post('/login', async (req, res) => {
    const { loginId, password } = req.body;
    try {
        const { data } = await axios.post(HASURA_ENDPOINT, {
            query: `
                query {
                    users(where: {login_id: {_eq: "${loginId}"}}) {
                        id
                        password
                        balance
                        email
                    }
                }
            `
        }, {
            headers: {
                'x-hasura-admin-secret': HASURA_ADMIN_SECRET
            }
        });
        const user = data.data.users[0];
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ success: true, balance: user.balance });
        } else {
            res.json({ success: false, message: 'Invalid login credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend' });
    }
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { loginId, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data } = await axios.post(HASURA_ENDPOINT, {
            query: `
                mutation {
                    insert_users(objects: {login_id: "${loginId}", password: "${hashedPassword}", email: "${email}"}) {
                        returning {
                            id
                        }
                    }
                }
            `
        }, {
            headers: {
                'x-hasura-admin-secret': HASURA_ADMIN_SECRET
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend' });
    }
});

// Handle transactions (deposit/withdraw)
app.post('/transaction', async (req, res) => {
    const { userId, amount, type } = req.body;
    try {
        const adjustment = type === 'deposit' ? amount : -amount;

        // Update user balance
        const { data: updateData } = await axios.post(HASURA_ENDPOINT, {
            query: `
                mutation {
                    update_users(
                        where: {id: {_eq: ${userId}}},
                        _set: {balance: balance + ${adjustment}}
                    ) {
                        returning {
                            id
                            balance
                            email
                        }
                    }
                    insert_transactions(objects: {user_id: ${userId}, amount: ${amount}, type: "${type}"}) {
                        affected_rows
                    }
                }
            `
        }, {
            headers: {
                'x-hasura-admin-secret': HASURA_ADMIN_SECRET
            }
        });

        // Fetch updated balance and user email
        const { data: balanceData } = await axios.post(HASURA_ENDPOINT, {
            query: `
                query {
                    users_by_pk(id: ${userId}) {
                        balance
                        email
                    }
                }
            `
        }, {
            headers: {
                'x-hasura-admin-secret': HASURA_ADMIN_SECRET
            }
        });

        const updatedBalance = balanceData.data.users_by_pk.balance;
        const userEmail = balanceData.data.users_by_pk.email;

        // Send notification email
        await sendEmail(userEmail, 'Balance Updated', `Your balance has been updated. New balance: $${updatedBalance}`);

        res.json({ success: true, message: `Transaction successful. New balance: $${updatedBalance}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing transaction' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
