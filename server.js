const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const cors = require("cors");
const mysql = require("mysql");
require("dotenv").config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// MySQL Database Connection (Using WebHostMost)
const db = mysql.createConnection({
    host: localhost,     // MySQL host from WebHostMost
    user: lsgboemp_z,     // MySQL username
    password: G55bBftSZB5KZKqpAthx, // MySQL password
    database: lsgboemp_z, // MySQL database name
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1); // Stop server if database connection fails
    }
    console.log("✅ Connected to MySQL database");
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const clients = new Set();

// WebSocket Connection
wss.on("connection", (ws) => {
    console.log("New client connected");
    clients.add(ws);

    ws.on("message", (message) => {
        const messageData = JSON.parse(message.toString());
        clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        clients.delete(ws);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
