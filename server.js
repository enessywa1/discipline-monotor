require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
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

// Socket.io Connection (Graceful fallback)
if (io) {
    io.on('connection', (socket) => {
        console.log('New client connected');

        // Send boot time to client for live reload detection
        socket.emit('server_init', { bootTime: SERVER_BOOT_TIME });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}

// Share io instance with routes safely
app.use((req, res, next) => {
    req.io = io;
    next();
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
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'fallback_secret_not_for_production',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies on Vercel/Render
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
};

// Use Postgres for sessions in production
if (db.isPostgres) {
    const PgSession = require('connect-pg-simple')(session);
    sessionConfig.store = new PgSession({
        pool: db, // Use the existing pool from supabase.js
        tableName: 'session',
        createTableIfMissing: true // Automatically create session table
    });
}

app.use(session(sessionConfig));

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

// Diagnostic Route
app.get('/api/debug', async (req, res) => {
    try {
        const dbStatus = await db.get('SELECT 1 as connected');
        const userCount = await db.get('SELECT count(*) as count FROM users');
        res.json({
            status: 'online',
            postgres: db.isPostgres,
            db_connected: !!dbStatus,
            user_count: userCount ? userCount.count : 0,
            session_store: sessionConfig.store ? 'postgres' : 'memory',
            node_env: process.env.NODE_ENV
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth Route
app.post('/api/login', loginLimiter, async (req, res) => {
    let { username, password } = req.body;
    const { supabaseAuth, supabaseAdmin } = require('./database/supabase');

    // input normalization
    username = (username || '').trim().toLowerCase();
    password = (password || '').trim();

    console.log(`🔑 [${new Date().toISOString()}] Login attempt for: ${username}`);
    console.time(`LoginTotal-${username}`);

    // Set a safety timeout for the entire request
    const loginTimeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error(`🕒 Login timed out for: ${username}`);
            res.status(504).json({ error: "Login request timed out. Please try again." });
        }
    }, 15000); // Increased to 15s to allow for cold starts

    res.on('finish', () => {
        clearTimeout(loginTimeout);
        console.timeEnd(`LoginTotal-${username}`);
    });

    try {
        console.time(`DbLookup-${username}`);
        const localUser = await db.get('SELECT * FROM users WHERE LOWER(username) = ?', [username]);
        console.timeEnd(`DbLookup-${username}`);

        if (!localUser) {
            console.log(`❌ Login failed: User '${username}' not found.`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // 1. Try Supabase Auth first
        if (supabaseAuth) {
            try {
                console.time(`SupabaseAuth-${username}`);
                const sanitizedUsername = username.replace(/\s+/g, '_');
                const email = localUser.email || `${sanitizedUsername}@system.local`;

                const { data, error } = await supabaseAuth.auth.signInWithPassword({
                    email: email,
                    password: password,
                });
                console.timeEnd(`SupabaseAuth-${username}`);

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

                    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [localUser.id]);
                    return res.json({ success: true, user: req.session.user });
                }

                if (error) {
                    console.warn(`⚠️ Supabase Auth failed for ${username}: ${error.message}. Falling back to local...`);
                }
            } catch (supaErr) {
                console.error("❌ Supabase Auth Exception:", supaErr.message);
                console.timeEnd(`SupabaseAuth-${username}`);
            }
        }

        // 2. Fallback to local database authentication
        console.time(`LocalBcrypt-${username}`);

        if (!password || !localUser.password_hash) {
            console.error(`❌ Missing bcrypt data for ${username}: password=${!!password}, hash=${!!localUser.password_hash}`);
            console.log("LocalUser keys:", Object.keys(localUser));
            return res.status(500).json({
                success: false,
                error: "Authentication data error. Please contact admin.",
                debug: `Missing hash for user: ${username}`
            });
        }

        const match = await bcrypt.compare(password, localUser.password_hash);
        console.timeEnd(`LocalBcrypt-${username}`);

        if (match) {
            console.log(`✅ Login successful (Local) for: ${username}`);
            req.session.user = {
                id: localUser.id,
                username: localUser.username,
                role: localUser.role,
                full_name: localUser.full_name,
                allocation: localUser.allocation,
                supabase_id: localUser.supabase_id
            };

            await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [localUser.id]);

            // 3. Just-in-Time Password Sync
            if (supabaseAuth && localUser.supabase_id && supabaseAdmin) {
                // Run sync in background so as not to block this response
                supabaseAdmin.auth.admin.updateUserById(localUser.supabase_id, { password: password })
                    .then(() => console.log(`🔄 JIT password sync done for: ${username}`))
                    .catch(e => console.error("⚠️ JIT sync error:", e.message));
            }

            return res.json({ success: true, user: req.session.user });
        } else {
            console.log(`❌ Login failed: Incorrect password for '${username}'`);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

    } catch (err) {
        console.error("🔥 Crash in login route:", err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: "Internal server error during login",
                debug: err.message // Temporarily expose for troubleshooting
            });
        }
    }
});

// Fallback to index.html for SPA feel
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: "API not found" });
    }
});


if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
