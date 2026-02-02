// about.js
const About = {
    render: (container) => {
        container.innerHTML = `
            <div class="about-container">
                <div class="about-hero">
                    <div class="hero-content">
                        <h1>About the Discipline System</h1>
                        <p class="lead">A professional solution by Murashi Creatives for streamlined school administration.</p>
                    </div>
                </div>

                <div class="about-grid">
                    <section class="about-section fade-in-up">
                        <div class="section-icon"><i class='bx bx-info-circle'></i></div>
                        <h2>System Purpose</h2>
                        <p>This application was designed to replace manual, paper-based discipline tracking with a real-time, digital environment. It ensures accountability, provides data-driven insights through weekly reports, and facilitates seamless communication between staff members.</p>
                    </section>

                    <section class="about-section fade-in-up" style="animation-delay: 0.1s;">
                        <div class="section-icon"><i class='bx bx-book-open'></i></div>
                        <h2>How to Use (Tutorials)</h2>
                        <ul class="tutorial-list">
                            <li>
                                <strong>Recording Incidents:</strong> Use the <em>Discipline Form</em> for quick entry or <em>Statements</em> for detailed case logging.
                            </li>
                            <li>
                                <strong>Task Management:</strong> Check your assigned tasks in <em>Task Management</em>. Update status as you progress.
                            </li>
                            <li>
                                <strong>Generating Reports:</strong> Admins can view and print weekly performance summaries in the <em>Weekly Reports</em> section.
                            </li>
                            <li>
                                <strong>Student Tracking:</strong> Monitor chronic cases via the <em>Watchlist</em> and record positive behavioral changes in <em>Improved Students</em>.
                            </li>
                        </ul>
                    </section>

                    <section class="about-section fade-in-up" style="animation-delay: 0.2s;">
                        <div class="section-icon"><i class='bx bx-rocket'></i></div>
                        <h2>Key Tech Features</h2>
                        <p>Built with <strong>Node.js</strong> and <strong>SQLite/PostgreSQL</strong>, featuring real-time updates via <strong>Socket.io</strong> and a responsive, secure dashboard with role-based access control.</p>
                    </section>

                    <section class="about-section murashi-card fade-in-up" style="animation-delay: 0.3s;">
                        <div class="murashi-logo">
                            <i class='bx bxs-paint-roll'></i>
                            <span>Murashi Creatives</span>
                        </div>
                        <h2>The Developers</h2>
                        <p>Murashi Creatives specializes in premium digital experiences. We focus on high-impact visuals combined with robust engineering to help institutions excel.</p>
                        <div class="social-links">
                            <a href="#"><i class='bx bxl-facebook-square'></i></a>
                            <a href="#"><i class='bx bxl-instagram'></i></a>
                            <a href="#"><i class='bx bxl-linkedin-square'></i></a>
                        </div>
                    </section>
                </div>

                <div class="about-footer">
                    <p>&copy; 2026 Murashi Creatives. Version 1.2.0-STABLE</p>
                </div>
            </div>
        `;
    }
};
