const mysql = require('mysql');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// ✅ MySQL Connection (WebHostMost)
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",  // Use environment variable
    user: process.env.DB_USER || "your_username",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME || "your_database"
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL database!");
});

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        const messageData = JSON.parse(message.toString());
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
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
