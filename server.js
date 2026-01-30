require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
// db is the sqlite3 instance
const db = require('./database/db');
const helmet = require('helmet');
const session = require('express-session');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Share io instance with routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// ... Middleware ... 

app.use(helmet({
    contentSecurityPolicy: false, // Temporarily disable CSP to restore all button functionality
}));
app.use(compression()); // Compress all responses
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
}));

// Trust proxy for Render/Railway (required for rate limiting)
app.set('trust proxy', 1);


// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_not_for_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Rate Limiting (Login)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per window
    message: { error: "Too many login attempts, please try again after 15 minutes" }
});

// Database Connection
// Already imported at top

// Import Routes
const tasksRoutes = require('./routes/tasks');
const disciplineRoutes = require('./routes/discipline');
const usersRoutes = require('./routes/users');
const reportsRoutes = require('./routes/reports');
const announcementsRoutes = require('./routes/announcements');
const notificationsRoutes = require('./routes/notifications');

// Mount Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Auth Route
app.post('/api/login', loginLimiter, (req, res) => {
    let { username, password } = req.body;

    // input normalization
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();

    db.get('SELECT * FROM users WHERE LOWER(username) = ?', [username], async (err, user) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Server error during login" });
        }

        if (!user) {
            console.log(`Login failed: User '${username}' not found.`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        try {
            const match = await bcrypt.compare(password, user.password_hash);
            if (match) {
                console.log(`Login successful for: ${username}`);
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    full_name: user.full_name,
                    allocation: user.allocation
                };
                res.json({
                    success: true,
                    user: req.session.user
                });
            } else {
                console.log(`Login failed: Incorrect password for '${username}'`);
                res.status(401).json({ success: false, message: "Invalid credentials" });
            }
        } catch (hashErr) {
            console.error("Bcrypt error:", hashErr);
            res.status(500).json({ error: "Server error during password verification" });
        }
    });
});

// Fallback to index.html for SPA feel
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: "API not found" });
    }
});


server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
