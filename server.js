const express = require('express');
const http = require('http');
const cors = require('cors');
const mysql = require('mysql');
const WebSocket = require('ws');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Database Connection
const db = mysql.createConnection({
    host: 'your-mysql-host',  // Replace with WebHostMost MySQL host
    user: 'your-mysql-user',
    password: 'your-mysql-password',
    database: 'your-database-name'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// **Sign Up Route**
app.post('/signup', (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const sql = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
        db.query(sql, [email, username, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ message: 'Error creating user' });
            res.json({ message: 'User registered successfully' });
        });
    });
});

// **Login Route**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (results.length === 0) return res.status(401).json({ message: 'User not found' });

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ message: 'Error comparing passwords' });
            if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

            req.session.user = user;
            res.json({ message: 'Login successful', username: user.username });
        });
    });
});

// **WebSocket Chat System**
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
