/**
 * Canvas 2D Atmospheric Chamber Renderer
 * Graceful, high-quality spatial visualization without WebGL.
 * Communicates scale, enclosure, light, fragmentation, and verticality.
 */
(function (global) {
  'use strict';

  function Chamber2D(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.spatial = null;
    this.theme = 'liminal';
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.prev = { x: 0, y: 0 };
    this.animId = null;
    this.time = 0;

    this._bindEvents();
  }

  Chamber2D.prototype._bindEvents = function () {
    var self = this;
    var c = this.canvas;

    c.addEventListener('pointerdown', function (e) {
      self.isDragging = true;
      self.prev.x = e.clientX;
      self.prev.y = e.clientY;
      c.setPointerCapture(e.pointerId);
    });

    c.addEventListener('pointermove', function (e) {
      if (!self.isDragging) return;
      self.offsetX += (e.clientX - self.prev.x) * 0.8;
      self.offsetY += (e.clientY - self.prev.y) * 0.8;
      self.prev.x = e.clientX;
      self.prev.y = e.clientY;
    });

    c.addEventListener('pointerup', function (e) {
      self.isDragging = false;
      try { c.releasePointerCapture(e.pointerId); } catch (err) {}
    });

    c.addEventListener('pointerleave', function () {
      self.isDragging = false;
    });

    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor = e.deltaY > 0 ? 0.94 : 1.06;
      self.scale = Math.max(0.5, Math.min(2.2, self.scale * factor));
    }, { passive: false });
  };

  Chamber2D.prototype.resize = function () {
    var parent = this.canvas.parentElement;
    if (!parent) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w;
    this.h = h;
  };

  Chamber2D.prototype.setTheme = function (theme) {
    this.theme = theme;
  };

  Chamber2D.prototype.setSpatial = function (spatial) {
    this.spatial = spatial;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
  };

  Chamber2D.prototype._palette = function () {
    var t = this.theme;
    if (t === 'hearth') {
      return {
        bg: '#1c1814',
        wall: 'rgba(196,146,90,0.55)',
        wallDeep: 'rgba(80,55,30,0.7)',
        accent: 'rgba(220,170,100,0.85)',
        floor: 'rgba(60,45,30,0.6)',
        fog: 'rgba(40,30,20,0.15)',
        light: 'rgba(255,200,120,0.12)'
      };
    }
    if (t === 'fracture') {
      return {
        bg: '#0e0e14',
        wall: 'rgba(200,200,220,0.45)',
        wallDeep: 'rgba(40,40,55,0.75)',
        accent: 'rgba(230,230,245,0.9)',
        floor: 'rgba(30,30,40,0.65)',
        fog: 'rgba(20,20,30,0.2)',
        light: 'rgba(200,200,255,0.08)'
      };
    }
    // liminal
    return {
      bg: '#12151e',
      wall: 'rgba(139,157,195,0.4)',
      wallDeep: 'rgba(30,35,50,0.7)',
      accent: 'rgba(160,180,220,0.85)',
      floor: 'rgba(25,30,42,0.65)',
      fog: 'rgba(15,20,30,0.18)',
      light: 'rgba(150,170,220,0.1)'
    };
  };

  Chamber2D.prototype.draw = function () {
    if (!this.ctx || !this.w) return;
    var ctx = this.ctx;
    var w = this.w;
    var h = this.h;
    var p = this._palette();
    var s = this.spatial || {
      scale: 1, enclosure: 0.5, lightIntensity: 0.6,
      verticality: 0.4, fragmentation: 0.3, lightTemp: 0.5
    };

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, w, h);

    // Soft light glow (driven by lightIntensity + temp)
    var gx = w * 0.5 + this.offsetX * 0.1;
    var gy = h * 0.3 + this.offsetY * 0.05;
    var grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, w * 0.55 * s.lightIntensity);
    var lightAlpha = 0.08 + s.lightIntensity * 0.18;
    grad.addColorStop(0, p.light.replace(/[\d.]+\)$/, lightAlpha + ')'));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + this.offsetX, h * 0.62 + this.offsetY);
    ctx.scale(this.scale * (0.85 + s.scale * 0.25), this.scale * (0.85 + s.scale * 0.25));

    // Floor ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, 180 + (1 - s.enclosure) * 80, 50 + (1 - s.enclosure) * 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.floor;
    ctx.fill();

    // Back wall (height driven by verticality + enclosure)
    var wallH = 80 + s.verticality * 140;
    var wallW = 160 + (1 - s.enclosure) * 100;
    var openGap = (1 - s.enclosure) * 60;

    // Left wall plane
    ctx.beginPath();
    ctx.moveTo(-wallW / 2, 0);
    ctx.lineTo(-wallW / 2 - 40, -wallH * 0.3);
    ctx.lineTo(-wallW / 2 - 40, -wallH);
    ctx.lineTo(-wallW / 2, -wallH * 0.85);
    ctx.closePath();
    ctx.fillStyle = p.wallDeep;
    ctx.fill();

    // Right wall plane
    ctx.beginPath();
    ctx.moveTo(wallW / 2, 0);
    ctx.lineTo(wallW / 2 + 40, -wallH * 0.3);
    ctx.lineTo(wallW / 2 + 40, -wallH);
    ctx.lineTo(wallW / 2, -wallH * 0.85);
    ctx.closePath();
    ctx.fillStyle = p.wallDeep;
    ctx.fill();

    // Back wall
    ctx.beginPath();
    ctx.moveTo(-wallW / 2, -wallH * 0.85);
    ctx.lineTo(-wallW / 2 - 40, -wallH);
    ctx.lineTo(wallW / 2 + 40, -wallH);
    ctx.lineTo(wallW / 2, -wallH * 0.85);
    ctx.closePath();
    ctx.fillStyle = p.wall;
    ctx.fill();

    // Opening / aperture if low enclosure
    if (s.enclosure < 0.6) {
      var apW = openGap + 30;
      ctx.beginPath();
      ctx.moveTo(-apW / 2, -wallH * 0.15);
      ctx.lineTo(-apW / 2, -wallH * 0.75);
      ctx.lineTo(apW / 2, -wallH * 0.75);
      ctx.lineTo(apW / 2, -wallH * 0.15);
      ctx.closePath();
      ctx.fillStyle = p.bg;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Vertical columns
    var colCount = Math.round(2 + s.verticality * 4);
    for (var i = 0; i < colCount; i++) {
      var cx = -wallW * 0.35 + (i / Math.max(1, colCount - 1)) * wallW * 0.7;
      var ch = 40 + s.verticality * 90 + Math.sin(this.time * 0.001 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 0);
      ctx.lineTo(cx - 3, -ch);
      ctx.lineTo(cx + 3, -ch);
      ctx.lineTo(cx + 4, 0);
      ctx.closePath();
      ctx.fillStyle = p.accent;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Fragmentation planes
    var fragCount = Math.round(s.fragmentation * 10);
    for (var f = 0; f < fragCount; f++) {
      var fx = (Math.sin(f * 2.1 + this.time * 0.0003) * 0.5) * wallW * 0.7;
      var fy = -20 - Math.random() * wallH * 0.7;
      // Use deterministic positions from index
      fx = ((f * 47) % 100 - 50) / 50 * wallW * 0.6;
      fy = -30 - ((f * 31) % 80) / 80 * wallH * 0.7;
      var fw = 20 + (f % 5) * 8;
      var fh = 6 + (f % 3) * 4;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(((f * 13) % 20 - 10) * 0.02);
      ctx.fillStyle = f % 2 === 0 ? p.wall : p.accent;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Central core volume (emotional heart)
    var coreH = 30 + (1 - s.enclosure) * 40 + s.verticality * 30;
    var coreW = 28 + (1 - s.enclosure) * 20;
    ctx.beginPath();
    ctx.moveTo(-coreW / 2, -10);
    ctx.lineTo(-coreW / 2, -10 - coreH);
    ctx.lineTo(coreW / 2, -10 - coreH);
    ctx.lineTo(coreW / 2, -10);
    ctx.closePath();
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Soft core glow
    var cg = ctx.createRadialGradient(0, -10 - coreH * 0.5, 2, 0, -10 - coreH * 0.5, coreW * 1.8);
    cg.addColorStop(0, p.accent.replace(/[\d.]+\)$/, '0.25)'));
    cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, -10 - coreH * 0.5, coreW * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Atmospheric fog overlay
    ctx.fillStyle = p.fog;
    ctx.fillRect(0, 0, w, h);
  };

  Chamber2D.prototype.start = function () {
    var self = this;
    function loop(ts) {
      self.time = ts || 0;
      self.draw();
      self.animId = requestAnimationFrame(loop);
    }
    if (!this.animId) loop(0);
  };

  Chamber2D.prototype.stop = function () {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  };

  global.Chamber2D = Chamber2D;
})(typeof window !== 'undefined' ? window : this);
