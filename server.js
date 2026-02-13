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
const SERVER_BOOT_TIME = Date.now();

// Share io instance with routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Send boot time to client for live reload detection
    socket.emit('server_init', { bootTime: SERVER_BOOT_TIME });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// ... Middleware ... 

app.use(helmet({
    contentSecurityPolicy: false, // Temporarily disable CSP to restore all button functionality
}));
app.set('etag', 'strong'); // Enable strong etags for better caching
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
const detentionsRoutes = require('./routes/detentions');
const suspensionsRoutes = require('./routes/suspensions');

// Mount Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/detentions', detentionsRoutes);
app.use('/api/suspensions', suspensionsRoutes);

// Auth Route
app.post('/api/login', loginLimiter, async (req, res) => {
    let { username, password } = req.body;
    const { supabaseAuth } = require('./database/supabase');

    // input normalization
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();

    // 1. Try Supabase Auth first if configured
    if (supabaseAuth) {
        try {
            // Fetch local user details to get email for Supabase lookup
            const localUser = await db.get('SELECT * FROM users WHERE LOWER(username) = ?', [username]);

            if (localUser) {
                // If the user has a space in their username, the migration script used underscores
                const sanitizedUsername = username.replace(/\s+/g, '_');
                const email = localUser.email || `${sanitizedUsername}@system.local`;

                const { data, error } = await supabaseAuth.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (data && data.user) {
                    console.log(`✅ Supabase login successful for: ${username}`);
                    req.session.user = {
                        id: localUser.id,
                        username: localUser.username,
                        role: localUser.role,
                        full_name: localUser.full_name,
                        allocation: localUser.allocation,
                        supabase_id: data.user.id
                    };

                    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [localUser.id]);
                    return res.json({ success: true, user: req.session.user });
                }

                // If Supabase fails (e.g. invalid password in Supabase), 
                // we fall through to local check in case they are using their old password
                console.warn(`⚠️ Supabase Auth failed for ${username}: ${error ? error.message : 'Unknown error'}. Falling back to local check...`);
            }
        } catch (supaErr) {
            console.error("❌ Supabase Auth Error:", supaErr.message);
        }
    }

    // 2. Fallback to local database authentication
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
                console.log(`Login successful (Local) for: ${username}`);
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    full_name: user.full_name,
                    allocation: user.allocation
                };

                db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

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
