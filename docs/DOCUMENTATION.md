# School Discipline Admin System - Documentation

Welcome to the official documentation for the **School Discipline Admin System**. This platform is designed to streamline student discipline management, staff coordination, and institutional reporting with a premium, user-centric experience.

---

## 🎨 Branding & Design
The system is built with a "Premium Teal" aesthetic, designed by **Murashi Creatives**.

- **Typography**: Inter (Modern sans-serif).
- **Aesthetic**: Glassmorphism effects, smooth transitions, and high-quality iconography (Boxicons).

---

## 🚀 Getting Started

### Login Steps
first log in as a school then login as user
1. Navigate to the homepage (index.html).
2. Enter your **Username** and **Password**.
3. Click **Sign In**.
   - Note: The system has a rate limiter. Too many failed attempts will lock login for 15 minutes.
   - Upon successful login, you will be redirected to the **Dashboard**.

---

## 👥 User Roles & Permissions

The system uses a robust Role-Based Access Control (RBAC) model to ensure data security and organizational hierarchy.

| Role | Access Level | Primary Capabilities |
| :--- | :--- | :--- |
| **Discipline Master (DM)** | Top Admin | Full system access, edit/delete any record, manage staff, view weekly reports. |
| **Director / Principal** | Top Admin | Full view access, manage staff, view all reports and standings. |
| **Assistant DM** | Admin | Full view access, manage records, assist in staff management. |
| **Head Patron** | Staff Lead | View reports, assign tasks to matrons/patrons, record standings. |
| **Matron / Patron** | Staff | Submit discipline forms, view announcements, manage assigned tasks. |

---

## 🛠️ System Modules & Features

### 1. Dashboard
The central hub of the system.
- **Analytics**: Real-time charts showing discipline trends and task statuses.
- **Quick Stats**: Summary of active cases, pending tasks, and recent announcements.

### 2. Announcements
Stay updated with official communications.
- **Post News**: Admins can broadcast messages to all staff.
- **Visibility**: Toggle between public announcements and role-specific notes.

### 3. Task Management
Efficient staff coordination.
- **Assign Tasks**: Admins can assign specific duties to patrons/matrons.
- **Progress Tracking**: Tasks move from *Pending* → *In Progress* → *Completed*.

### 4. Discipline Form
The primary tool for recording student incidents.
- **Quick Entry**: Search existing students or enter new ones.
- **Incident Details**: Categorize offenses (e.g., Late, Poor Time Management, Custom Offenses).
- **Actions**: Record the immediate action taken by the staff member.

### 5. Discipline Statements
Deep-dive incident reporting.
- **Narratives**: Record detailed descriptions of major incidents or case hearings.
- **Punitive Measures**: Formally document the final disciplinary outcome.

### 6. Student Tracking
Monitor student behavior over time.
- **Watchlist**: Track students who need closer supervision due to recurring issues.
- **Improved Students**: Positive reinforcement module for students showing growth.

### 7. Performance Standings
Internal staff/section monitoring (Patron/Matron primary focus).
- **Metrics**: Weekly scoring on Hygiene, Discipline, Time Mgmt, Supervision, and Dress Code.
- **Analysis**: Helps the DM identify areas of excellence or needed improvement.

### 8. All Submissions
A central searchable database of every record.
- **Global Search**: Filter by student name, staff, or offense type.
- **Export**: Generate Excel sheets of all data for offline analysis.
- **DM Power**: Discipline Masters can Edit or Delete records from this view if corrections are needed.

### 9. Suspensions & Expulsions
Tracking major disciplinary actions.
- **Active Records**: View currently suspended students and their return dates.
- **History**: Formal log of all expulsions in the system.

### 10. Weekly/Monthly Reports
High-level management briefing.
- **Automated Summaries**: Aggregates data for periodic review by school leadership.

---

## ⚙️ Technical Overview
- **Backend**: Node.js & Express.
- **Database**: SQLite3 (Local) / PostgreSQL (Optional Cloud sync).
- **Real-time**: Socket.io for instant dashboard updates and notifications.
- **Frontend**: Vanilla JS (SPA-style routing) & Custom CSS.

---

## 🔒 Security & Performance
- **RLS**: Row-Level Security ensures data is only accessible to authorized roles.
- **Hashing**: All passwords are encrypted using `bcrypt`.
- **Compression**: Gzip compression enabled for fast page loads.
- **Rate Limiting**: Protection against brute-force attacks on sensitive endpoints.

---
*&copy; 2026 Murashi Creatives. Designed & Developed for Excellence.*
