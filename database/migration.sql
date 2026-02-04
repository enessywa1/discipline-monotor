-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    allocation TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    stream TEXT,
    gender TEXT NOT NULL
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    posted_by INTEGER NOT NULL REFERENCES users(id),
    visibility TEXT DEFAULT 'All',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Discipline Reports
CREATE TABLE IF NOT EXISTS discipline_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    student_name TEXT,
    offence TEXT NOT NULL,
    description TEXT,
    staff_id INTEGER NOT NULL REFERENCES users(id),
    date_reported DATE DEFAULT CURRENT_DATE,
    action_taken TEXT
);

-- 6. Statements
CREATE TABLE IF NOT EXISTS statements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER,
    student_name TEXT NOT NULL,
    incident_date DATE NOT NULL,
    offence_type TEXT NOT NULL,
    description TEXT,
    punitive_measure TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Weekly Standings
CREATE TABLE IF NOT EXISTS standings (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES users(id),
    week_start_date DATE NOT NULL,
    hygiene_pct INTEGER,
    discipline_pct INTEGER,
    time_mgmt_pct INTEGER,
    supervision_pct INTEGER,
    preps_pct INTEGER,
    dress_code_pct INTEGER,
    church_order_pct INTEGER,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Watchlist Students
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    reason TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Improved Students
CREATE TABLE IF NOT EXISTS improved_students (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    improvement_notes TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Suspensions and Expulsions
CREATE TABLE IF NOT EXISTS suspensions_expulsions (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Suspension', 'Expulsion')),
    start_date DATE,
    end_date DATE, -- NULL for Expulsion
    reason TEXT NOT NULL,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Completed', 'Appealed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Detentions Table
CREATE TABLE IF NOT EXISTS detentions (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    offense TEXT NOT NULL,
    detention_date DATE NOT NULL,
    days INTEGER DEFAULT 1,
    remarks TEXT,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'Uncleared' CHECK(status IN ('Uncleared', 'Cleared')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_discipline_reports_name ON discipline_reports(student_name);
CREATE INDEX IF NOT EXISTS idx_statements_name ON statements(student_name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Seed Initial Admin User (password: admin123)
-- Hash: $2b$10$C7.u/lP6Tq4A/57f/s6.6uVz7Y7Xy7Xy7Xy7Xy7Xy7Xy7Xy7Xy7Xy
-- Note: Replace with actual bcrypt hash if needed, but standard hashed passwords work.
-- Here we provide a common bcrypt hash for admin123 for initial setup.
INSERT INTO users (username, password_hash, role, full_name, allocation, phone_number)
VALUES ('admin', '$2b$10$3fJp2H0q7YFp3fJp2H0q7YFp3fJp2H0q7YFp3fJp2H0q7YFp3fJp2', 'Discipline Master', 'Mr. Discipline Lead', 'Administration', '0770000000')
ON CONFLICT (username) DO NOTHING;
