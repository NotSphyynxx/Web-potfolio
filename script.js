// ===== Theme toggle =====
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const sunIcon = `<i class="fas fa-sun"></i>`;
const moonIcon = `<i class="fas fa-moon"></i>`;

function getTheme() {
    return html.getAttribute('data-theme');
}

function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    // Update glitch colors when theme changes
    if (window.glitch) window.glitch.updateColors(theme);
}

const saved = localStorage.getItem('theme');
setTheme(saved || 'dark');

themeBtn.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
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


// ===== Letter Glitch Background (vanilla port) =====
class LetterGlitch {
    constructor(canvas, opts = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.speed = opts.speed || 50;
        this.smooth = opts.smooth !== false;
        this.characters = opts.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&*()-_+=/;:<>.';
        this.chars = Array.from(this.characters);
        this.fontSize = 16;
        this.charW = 10;
        this.charH = 20;
        this.letters = [];
        this.grid = { cols: 0, rows: 0 };
        this.lastGlitch = Date.now();
        this.raf = null;

        // Theme-aware colors
        this.darkColors = [
            { r: 46, g: 16, b: 101 },   // #2e1065
            { r: 76, g: 29, b: 149 },   // #4c1d95
            { r: 109, g: 40, b: 217 },  // #6d28d9
            { r: 55, g: 20, b: 120 },   // deep violet
        ];
        this.lightColors = [
            { r: 196, g: 181, b: 253 },  // #c4b5fd
            { r: 167, g: 139, b: 250 },  // #a78bfa
            { r: 221, g: 214, b: 254 },  // #ddd6fe
            { r: 180, g: 160, b: 245 },  // soft violet
        ];

        this.colors = getTheme() === 'dark' ? this.darkColors : this.lightColors;

        this.resize();
        this.animate();

        this._resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                cancelAnimationFrame(this.raf);
                this.resize();
                this.animate();
            }, 100);
        });
    }

    updateColors(theme) {
        this.colors = theme === 'dark' ? this.darkColors : this.lightColors;
        // Retarget all letters to new palette
        this.letters.forEach(l => {
            l.targetRgb = this.randColor();
            l.colorProgress = 0;
        });
    }

    randChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }

    randColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    mixRgb(a, b, t) {
        return {
            r: Math.round(a.r + (b.r - a.r) * t),
            g: Math.round(a.g + (b.g - a.g) * t),
            b: Math.round(a.b + (b.b - a.b) * t),
        };
    }

    resize() {
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.grid.cols = Math.ceil(rect.width / this.charW);
        this.grid.rows = Math.ceil(rect.height / this.charH);

        const total = this.grid.cols * this.grid.rows;
        this.letters = Array.from({ length: total }, () => {
            const rgb = this.randColor();
            return {
                char: this.randChar(),
                rgb: { ...rgb },
                fromRgb: { ...rgb },
                targetRgb: this.randColor(),
                colorProgress: 1,
            };
        });

        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const { width, height } = this.canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
        ctx.font = this.fontSize + 'px monospace';
        ctx.textBaseline = 'top';

        this.letters.forEach((l, i) => {
            const x = (i % this.grid.cols) * this.charW;
            const y = Math.floor(i / this.grid.cols) * this.charH;
            ctx.fillStyle = `rgb(${l.rgb.r},${l.rgb.g},${l.rgb.b})`;
            ctx.fillText(l.char, x, y);
        });
    }

    update() {
        const count = Math.max(1, Math.floor(this.letters.length * 0.05));
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * this.letters.length);
            const l = this.letters[idx];
            if (!l) continue;
            l.char = this.randChar();
            l.fromRgb = { ...l.rgb };
            l.targetRgb = this.randColor();
            if (!this.smooth) {
                l.rgb = { ...l.targetRgb };
                l.colorProgress = 1;
            } else {
                l.colorProgress = 0;
            }
        }
    }

    smoothStep() {
        let dirty = false;
        this.letters.forEach(l => {
            if (l.colorProgress < 1) {
                l.colorProgress = Math.min(1, l.colorProgress + 0.05);
                l.rgb = this.mixRgb(l.fromRgb, l.targetRgb, l.colorProgress);
                dirty = true;
            }
        });
        if (dirty) this.draw();
    }

    animate() {
        const now = Date.now();
        if (now - this.lastGlitch >= this.speed) {
            this.update();
            this.draw();
            this.lastGlitch = now;
        }
        if (this.smooth) this.smoothStep();
        this.raf = requestAnimationFrame(() => this.animate());
    }
}

// Init glitch background
const glitchCanvas = document.getElementById('glitch-canvas');
if (glitchCanvas) {
    window.glitch = new LetterGlitch(glitchCanvas, {
        speed: 50,
        smooth: true,
    });
}
