/*
 * Particle-network background, ported from index.html, shared across
 * community/*.html. Expects <canvas id="particle-bg"></canvas> to exist
 * in the page (styled fixed/full-bleed via css/community.css).
 */
(function () {
  const canvas = document.getElementById("particle-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const mouse = { x: null, y: null, radius: 150 };
  window.addEventListener("mousemove", (e) => { mouse.x = e.x; mouse.y = e.y; });

  const particleCount = 60;
  const connectionDistance = 150;

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 2 + 1;
  }
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    if (mouse.x != null) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.vx -= Math.cos(angle) * force * 0.2;
        this.vy -= Math.sin(angle) * force * 0.2;
      }
    }
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 2) { this.vx = (this.vx / speed) * 2; this.vy = (this.vy / speed) * 2; }
  };
  Particle.prototype.draw = function () {
    ctx.fillStyle = "rgba(255, 107, 53, 0.6)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  };

  const particles = [];
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());

  function connect() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.3;
          ctx.strokeStyle = "rgba(255, 107, 53, " + opacity + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => { p.update(); p.draw(); });
    connect();
    requestAnimationFrame(animate);
  }
  animate();
})();
