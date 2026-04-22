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
                        <div class="section-icon"><i class='bx bx-bolt-circle'></i></div>
                        <h2>Performance</h2>
                        <p>The system is optimized for speed with <strong>Asynchronous Submissions</strong> and <strong>Database Indexing</strong>, ensuring forms save instantly even on slow connections.</p>
                    </section>

                    <section class="about-section download-card fade-in-up" style="animation-delay: 0.3s;">
                        <div class="section-icon"><i class='bx bx-download'></i></div>
                        <h2>How to Download (App)</h2>
                        <div class="download-info">
                            <p>You can install this system as a standalone app on your device for quick access:</p>
                            <div class="install-steps">
                                <div class="step">
                                    <strong><i class='bx bxl-android'></i> Mobile (Android/iOS)</strong>
                                    <span>Tap the browser menu (⋮ or <i class='bx bx-share-alt'></i>) and select <strong>"Add to Home Screen"</strong>.</span>
                                </div>
                                <div class="step">
                                    <strong><i class='bx bx-laptop'></i> Desktop (PC/Mac)</strong>
                                    <span>Look for the <i class='bx bx-plus-circle'></i> <strong>Install icon</strong> in your browser's address bar.</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="about-section murashi-card fade-in-up" style="animation-delay: 0.4s;">
                        <div class="murashi-logo">
                            <i class='bx bxs-paint-roll'></i>
                            <span>Murashi Creatives</span>
                        </div>
                        <h2>The Developers</h2>
                        <p>Murashi Creatives specializes in premium digital experiences. We focus on high-impact visuals combined with robust engineering to help institutions excel.</p>
                        <div class="social-links">
                            <a href="https://murashicreatives.vercel.app/" target="_blank" title="Website"><i class='bx bx-globe'></i></a>
                            <a href="https://www.instagram.com/murashicreatives/" target="_blank" title="Instagram"><i class='bx bxl-instagram'></i></a>
                            <a href="#" title="LinkedIn"><i class='bx bxl-linkedin-square'></i></a>
                        </div>
                    </section>
                </div>

                <div class="about-footer">
                    <p>&copy; 2026 Murashi Creatives. Version 1.5.0-STABLE</p>
                </div>
            </div>
        `;
    }
};
