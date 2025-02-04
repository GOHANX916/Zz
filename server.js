const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const PORT = process.env.PORT || 3000;

// MySQL Database Connection (Replace with your WebHostMost credentials)
const db = mysql.createConnection({
    host: "localhost",
    user: "lsgboemp_z",
    password: "G55bBftSZB5KZKqpAthx",
    database: "lsgboemp_z"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL database!");
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true
}));

const clients = new Set();

// **User Registration (Sign-Up)**
app.post('/signup', (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).send("All fields are required");

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).send("Error hashing password");

        const sql = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
        db.query(sql, [email, username, hashedPassword], (err) => {
            if (err) return res.status(500).send("Error signing up");
            res.status(201).send("User registered successfully!");
        });
    });
});

// **User Login**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send("All fields are required");

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) return res.status(401).send("Invalid credentials");

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (!isMatch) return res.status(401).send("Invalid credentials");

            const token = jwt.sign({ id: user.id, username: user.username }, "your_secret_key", { expiresIn: "1h" });
            res.json({ message: "Login successful", token });
        });
    });
});

// **Handle WebSocket Upgrade with Authentication**
server.on('upgrade', (request, socket, head) => {
    const token = new URL(request.url, `http://${request.headers.host}`).searchParams.get("token");
    if (!token) return socket.destroy();

    try {
        const decoded = jwt.verify(token, "your_secret_key");
        request.username = decoded.username;
        wss.handleUpgrade(request, socket, head, ws => {
            wss.emit('connection', ws, request);
        });
    } catch (err) {
        socket.destroy();
    }
});

// **WebSocket Connection**
wss.on('connection', (ws, req) => {
    ws.username = req.username;
    console.log(`${ws.username} connected`);
    clients.add(ws);

    ws.on('message', (message) => {
        const messageData = JSON.parse(message.toString());
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ text: messageData.text, time: messageData.time, sender: ws.username }));
            }
        });
    });

    ws.on('close', () => {
        console.log(`${ws.username} disconnected`);
        clients.delete(ws);
    });
});

// **Start Server**
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
