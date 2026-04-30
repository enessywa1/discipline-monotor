# School Discipline Department Admin System

A professional, centralized web application designed to manage school discipline, staff tasks, and student performance reporting.

## 🚀 System Overview

This system serves as a digital hub for the Discipline Department, replacing manual paperwork with real-time data entry, automated reporting, and role-based performance tracking.

## 🛠️ Core Features

### 1. Unified Dashboard
- **Real-time Stats**: Track "Cases Today", "Pending Tasks", and "Staff Active" at a glance.
- **Announcement Feed**: Instant access to the latest administrative updates.
- **Auto-Refresh**: Statistics and announcements update automatically every 30 seconds.

### 2. Digital Discipline Records
- **Discipline Form**: A standardized form for recording student incidents, accessible to all staff members.
- **Unified Student Search**: Look up a student's history across all record types (Statements and Reports).
- **Incident History**: Chronological view of a student's past behavior with exact timestamps for better accountability.

### 3. Task Management
- **Assignment**: Admins can assign specific tasks to staff members.
- **Tracking**: Staff can update task status (Pending, In Progress, Completed).
- **Notifications**: System popups notify staff immediately when a new task is assigned.

### 4. Weekly Performance Reports
- **7-Day Window**: Automatically generates a 1-week summary of all school activity.
- **Incident Summary**: Real-time tallying of offence types (e.g., Late, Noise, Bullying).
- **Staff Grading**: Ranks Patron and Matron performance based on hygiene, discipline, and time management.
- **Printable/Exportable**: Designed for professional printing to PDF or exporting to Excel.

### 5. Staff Management
- **Role-Based Access**: Specialized views for Discipline Masters (Admins) vs. Patrons/Matrons.
- **Activity Log**: Admins can monitor which staff members are currently active in the system.

### 6. Student Tracking & Watchlist
- **Chronic Cases**: A dedicated watchlist for students with frequent discipline issues.
- **Improvement Tracker**: Record and monitor students showing positive behavioral changes.
- **Role-Based Security**: Only Discipline Masters can remove students from these lists.

## 🔐 User Roles & Permissions

| Role | Permissions |
| :--- | :--- |
| **Admin / Discipline Master** | Full access: User management, all reports, task assignment, and announcements. |
| **Principal / Director** | High-level overview, posting announcements, and report viewing. |
| **Patron / Matron** | Record discipline incidents, manage assigned tasks, and view performance standings. |

## 💻 Technical Stack

- **Backend**: Node.js with Express.
- **Database**: SQLite3 (Single-file database for easy deployment and portability).
- **Frontend**: Vanilla JavaScript (ES6+), Semantic HTML5, and Modern CSS Variables.
- **Icons**: Boxicons (Locally hosted for **Offline Support**).
- **Styles**: Custom premium dark green theme with "glassmorphism" and "capsule" UI elements.
- **Performance**: 
    - **SQLite WAL Mode**: Optimized for high concurrency (20+ users).
    - **Gzip Compression**: Reduced network latency and fast page loads.
    - **Database Indexing**: Search and reporting queries optimized for scale.
    - **Persistent Sessions**: Reliable login management using a database-backed session store.

## ⚙️ How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Database**:
   ```bash
   node database/setup.js
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. **Access**: Open `http://localhost:3000` in your browser.

## 📂 Project Structure

- `/public`: Frontend assets (HTML, CSS, JS, Images).
- `/routes`: Server-side API logic.
- `/database`: SQLite schema and connection logic.
- `/vendor`: Localized libraries (Boxicons) for offline reliability.

---
**Developed for the Discipline Department.**
