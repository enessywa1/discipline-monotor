/* loader.js */
(function () {
    const body = document.body;
    body.classList.add('loading');

    let percentage = 0;
    const percentageEl = document.getElementById('loader-perc');
    const barEl = document.getElementById('loader-bar');
    const wrapper = document.getElementById('loader-wrapper');

    // Simulate progress (smoothly increment)
    const interval = setInterval(() => {
        if (percentage < 90) {
            percentage += Math.floor(Math.random() * 5) + 1;
            updateLoader(percentage);
        }
    }, 150);

    function updateLoader(val) {
        if (val > 100) val = 100;
        if (percentageEl) percentageEl.textContent = val + '%';
        if (barEl) barEl.style.width = val + '%';
    }

    // On window load, jump to 100% and finish
    window.addEventListener('load', () => {
        clearInterval(interval);
        percentage = 100;
        updateLoader(100);

        setTimeout(() => {
            if (wrapper) wrapper.classList.add('loaded');
            body.classList.remove('loading');

            // Cleanup: remove loader from DOM after animation
            setTimeout(() => {
                if (wrapper) wrapper.remove();
            }, 1000);
        }, 500);
    });
})();
