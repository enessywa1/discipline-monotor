# Deployment Guide

This guide explains how to deploy the **Discipline Department Web** application to Render or Railway with Supabase PostgreSQL.

## Prerequisites

1. A [Supabase](https://supabase.com) account with a project created
2. A [Render](https://render.com) or [Railway](https://railway.app) account

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection String** → **URI**
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 2: Set Up Your Database Schema

The application will automatically create tables on first run. However, you need to seed initial users.

### Option A: Run Setup Script Locally with Supabase

```bash
# Set your DATABASE_URL temporarily
export DATABASE_URL="your-supabase-connection-string"

# Run the setup script
node database/setup.js
```

### Option B: Manual SQL Setup

Run this SQL in your Supabase SQL Editor to create the initial admin user:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    allocation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user (password: admin123)
INSERT INTO users (username, password_hash, role, full_name)
VALUES ('admin', '$2b$10$o0uiDXj7l1X2m1I0OGSqcOr2wvzy8KPSkqyUZEDAYmYWKPxRG1pHa', 'Director', 'System Admin');
```

## Step 3: Deploy to Render

### 3.1 Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `discipline-department-web`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3.2 Set Environment Variables

In the **Environment** section, add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `SESSION_SECRET` | A long random string (e.g., generate with `openssl rand -base64 32`) |
| `NODE_ENV` | `production` |

### 3.3 Deploy

Click **Create Web Service**. Render will automatically deploy your application.

## Step 4: Deploy to Railway (Alternative)

### 4.1 Create a New Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### 4.2 Set Environment Variables

In the **Variables** tab, add:

```
DATABASE_URL=your-supabase-connection-string
SESSION_SECRET=your-long-random-string
NODE_ENV=production
```

### 4.3 Deploy

Railway will automatically deploy your application.

## Step 5: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-app.onrender.com`)
2. Log in with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Change the default password immediately!

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes (production) | PostgreSQL connection string from Supabase | `postgresql://postgres:...` |
| `SESSION_SECRET` | Yes | Secret key for session encryption | `a_very_secure_random_string` |
| `NODE_ENV` | No | Environment mode | `production` or `development` |
| `PORT` | No | Port to run on (auto-set by Render/Railway) | `3000` |

## Local Development

For local development, the app automatically uses SQLite:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The app will use `database/school_discipline.db` for local SQLite storage.

## Troubleshooting

### Database Connection Errors

- Verify your `DATABASE_URL` is correct
- Ensure your Supabase project is active
- Check that your database password is correct in the connection string

### Login Issues

- Make sure you've run the setup script or manually created the admin user
- Username is case-insensitive: `admin`, `Admin`, `ADMIN` all work
- Default password is `admin123`

### Port Binding Errors

- Render/Railway automatically set the `PORT` environment variable
- Don't manually set `PORT` in production

## Security Recommendations

1. **Change Default Password**: Immediately change the `admin` password after first login
2. **Use Strong SESSION_SECRET**: Generate a cryptographically secure random string
3. **Enable HTTPS**: Both Render and Railway provide free SSL certificates
4. **Regular Backups**: Set up automatic backups in Supabase

## Support

For issues or questions, check the logs in your Render/Railway dashboard.
