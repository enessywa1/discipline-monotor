// standings.js
const Standings = {
    render: (container) => {
        container.innerHTML = `
            <div class="layout-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
                
                <!-- Input Form (Staff) -->
                <div class="card">
                    <h3>Submit Weekly Standings</h3>
                    <p style="color:grey; font-size:0.9rem; margin-bottom:15px;">Enter percentage scores for your department.</p>
                    
                    <form id="standingsForm">
                        <div class="form-group">
                            <label>Week Start Date</label>
                            <input type="date" name="week_start_date" required>
                        </div>
                        
                        <div class="layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="form-group">
                                <label>Hygiene (%)</label>
                                <input type="number" name="hygiene_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Discipline (%)</label>
                                <input type="number" name="discipline_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Time Mgmt (%)</label>
                                <input type="number" name="time_mgmt_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Supervision (Meals/Canteen) (%)</label>
                                <input type="number" name="supervision_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Preps Behavior (%)</label>
                                <input type="number" name="preps_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Dress Code (%)</label>
                                <input type="number" name="dress_code_pct" min="0" max="100" required>
                            </div>
                            <div class="form-group">
                                <label>Church Order (%)</label>
                                <input type="number" name="church_order_pct" min="0" max="100" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Explanation / Comments</label>
                            <textarea name="explanation" rows="3" placeholder="Explain improvements, declines, or stagnation..." style="width:100%"></textarea>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">Submit Standings</button>
                    </form>
                </div>

                <!-- Recent Standings Display -->
                <div class="card">
                    <h3>Recent History</h3>
                    <div id="standingsHistory">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        `;

        const form = document.getElementById('standingsForm');
        if (form) form.onsubmit = Standings.submit;
        Standings.loadHistory();
    },

    submit: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.staff_id = Auth.getUser().id;

        try {
            const res = await fetch('/api/discipline/standings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Saved successfully');
                e.target.reset();
                Standings.loadHistory();
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            alert('Error saving data');
        }
    },

    loadHistory: async () => {
        // We need an endpoint for this, we'll quickly add it to routes/discipline.js or sim
        // For now, mock or assume endpoint exists. 
        // I will add the route in the next step.
        const container = document.getElementById('standingsHistory');
        try {
            const res = await fetch('/api/discipline/standings?limit=5');
            const data = await res.json();

            if (data.success && data.standings.length) {
                container.innerHTML = data.standings.map(s => `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                        <div style="font-weight: bold;">Week of ${s.week_start_date}</div>
                        <div style="font-size: 0.85rem; color: #666; display: flex; gap: 10px; flex-wrap: wrap;">
                            <span>Hygiene: ${s.hygiene_pct}%</span>
                            <span>Discipline: ${s.discipline_pct}%</span>
                            <span>Time: ${s.time_mgmt_pct}%</span>
                        </div>
                        <p style="font-size: 0.8rem; margin-top: 5px; font-style: italic;">"${s.explanation || 'No comments'}"</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = 'No records found.';
            }
        } catch (e) {
            container.innerHTML = 'Unavailable.';
        }
    }
};
