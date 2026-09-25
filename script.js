// ===== Theme toggle =====
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const sunIcon = `<i class="fas fa-sun"></i>`;
const moonIcon = `<i class="fas fa-moon"></i>`;

function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

// Init: check saved preference or default to dark
const saved = localStorage.getItem('theme');
setTheme(saved || 'dark');

themeBtn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ===== Nav scroll =====
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== Mobile toggle =====
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');
toggle.addEventListener('click', () => links.classList.toggle('open'));
links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
});

// ===== Scroll reveal =====
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('vis');
    });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
