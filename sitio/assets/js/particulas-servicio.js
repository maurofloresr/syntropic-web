/* ==========================================================================
   Syntropic: partículas de las páginas de servicio (versión liviana)
   (docs/paginas-servicio.md, sección "Animaciones comunes")

   El mismo canvas fijo de la landing, sin galaxia ni S:
   - Estrellas de fondo que titilan, estrellas fugaces y luces al tocar.
   - Formaciones de bytes (0 y 1):
       1. El h1 del hero, por tiempo, apenas carga la página.
       2. El h2 de contacto ("HABLEMOS"), atado al scroll.
       3. Las que pida cada página con Syntropic.bytes.formar() (por ejemplo,
          la mano de Sistemas).
   - Cuando un título termina de formarse aparece el texto real con un fade.
     El texto siempre existe en el HTML.
   - Con prefers-reduced-motion no hay canvas y los títulos se ven normales.
   - Sin violeta: es solo del hero de la landing.

   Para ahorrar batería, cuando solo hay estrellas se dibuja un cuadro de
   cada dos, y se pausa con la pestaña oculta.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  var raiz = document.documentElement;
  var lienzoSoportado = !!document.createElement('canvas').getContext;

  var PALETA = [
    [0, 64, 255],    // 0 azul eléctrico #0040FF
    [71, 173, 255],  // 1 celeste #47ADFF
    [160, 211, 253], // 2 celeste claro #A0D3FD
    [255, 255, 255]  // 3 blanco #FFFFFF
  ];

  /* --- Utilidades --- */
  function limitar(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mezclar(a, b, t) { return a + (b - a) * t; }
  function suave(a, b, v) { var t = limitar((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function entradaSalida(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ==========================================================================
     Muestreo: de una forma a celdas (cada celda es un 0 o un 1)
     Todas las celdas quedan en coordenadas del documento.
     ========================================================================== */

  /* Recorre los píxeles de un canvas oculto. El color dice el tono: rojo =
     tono 1 (celeste), cualquier otro = tono 0 (blanco y celeste claro). */
  function celdasDe(x, ancho, alto, pasoMinimo, presupuesto, ox, oy) {
    var datos = x.getImageData(0, 0, ancho, alto).data;
    var area = 0;
    for (var p = 3; p < datos.length; p += 4) if (datos[p] > 128) area++;
    var paso = Math.max(pasoMinimo, Math.sqrt(area / presupuesto)), celdas;
    do {
      celdas = [];
      for (var gy = paso / 2; gy < alto; gy += paso) {
        for (var gx = paso / 2; gx < ancho; gx += paso) {
          var k = (Math.round(gy) * ancho + Math.round(gx)) * 4;
          if (datos[k + 3] > 128) celdas.push({ x: ox + gx, y: oy + gy, tono: datos[k + 1] < 128 ? 1 : 0 });
        }
      }
      paso *= 1.06;
    } while (celdas.length > presupuesto);
    return { celdas: celdas, paso: paso / 1.06 };
  }

  /* Título: se dibuja cada palabra en la misma posición y tamaño que el texto
     real. La segunda línea del brandbook (.titulo-linea-2) va en celeste. */
  function muestrearTitulo(el, presupuesto) {
    var rect = el.getBoundingClientRect();
    var sx = window.scrollX, sy = window.scrollY;
    var ancho = Math.ceil(rect.width), alto = Math.ceil(rect.height);
    if (ancho < 8 || alto < 8) return null;
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.textBaseline = 'alphabetic';
    var fs = parseFloat(getComputedStyle(el).fontSize);
    var recorrido = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodo;
    while ((nodo = recorrido.nextNode())) {
      var padre = nodo.parentElement;
      x.font = getComputedStyle(padre).fontWeight + ' ' + fs + 'px "Archivo Expanded"';
      x.fillStyle = padre.closest('.titulo-linea-2') ? '#f00' : '#fff';
      var ascenso = x.measureText('M').fontBoundingBoxAscent || fs * 0.92;
      var re = /\S+/g, m;
      while ((m = re.exec(nodo.data))) {
        var rango = document.createRange();
        rango.setStart(nodo, m.index);
        rango.setEnd(nodo, m.index + m[0].length);
        var r = rango.getBoundingClientRect();
        x.fillText(m[0].toLocaleUpperCase('es-AR'), r.left - rect.left, r.top - rect.top + ascenso);
      }
    }
    var f = celdasDe(x, ancho, alto, Math.max(fs / 14, 3), presupuesto, rect.left + sx, rect.top + sy);
    f.cx = rect.left + sx + ancho / 2;
    f.cy = rect.top + sy + alto / 2;
    return f;
  }

  /* Silueta: un trazado (Path2D) escrito en una caja de ancho x alto unidades,
     llevado al tamaño de un elemento de la página */
  function muestrearSilueta(el, trazado, vista, presupuesto) {
    var rect = el.getBoundingClientRect();
    var ancho = Math.round(rect.width), alto = Math.round(rect.height);
    if (ancho < 8 || alto < 8) return null;
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.scale(ancho / vista[0], alto / vista[1]);
    x.fillStyle = '#fff';
    x.fill(trazado);
    var f = celdasDe(x, ancho, alto, 4, presupuesto, rect.left + window.scrollX, rect.top + window.scrollY);
    f.cx = rect.left + window.scrollX + ancho / 2;
    f.cy = rect.top + window.scrollY + alto / 2;
    return f;
  }

  /* --- Sprites --- */
  function crearSpritePunto(color) {
    var t = 32, c = document.createElement('canvas');
    c.width = c.height = t;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
    g.addColorStop(0, rgba(color, 1));
    g.addColorStop(0.22, rgba(color, 1));
    g.addColorStop(0.42, rgba(color, 0.32));
    g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, t, t);
    return c;
  }

  function crearSpriteDigito(color, digito) {
    var f = 32, c = document.createElement('canvas');
    var x = c.getContext('2d');
    x.font = '600 ' + f + 'px Inter, system-ui, sans-serif';
    var w = Math.ceil(x.measureText(digito).width) + 4;
    c.width = w; c.height = Math.ceil(f * 1.25);
    x.font = '600 ' + f + 'px Inter, system-ui, sans-serif';
    x.fillStyle = rgba(color, 1);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(digito, w / 2, c.height / 2 + f * 0.04);
    return c;
  }
  function crearSpritesDigito() {
    return PALETA.map(function (c) { return [crearSpriteDigito(c, '0'), crearSpriteDigito(c, '1')]; });
  }

  // Tono 0 (blanco): mezcla de blanco, celeste claro y celeste. Tono 1: celeste.
  function colorDe(tono) {
    var r = Math.random();
    if (tono === 1) return r < 0.78 ? 1 : 2;
    return r < 0.5 ? 3 : r < 0.82 ? 2 : 1;
  }

  var fuentes = document.fonts ? Promise.all([
    document.fonts.load('900 40px "Archivo Expanded"'),
    document.fonts.load('700 40px "Archivo Expanded"'),
    document.fonts.load('600 32px Inter')
  ]).catch(function () {}) : Promise.resolve();

  var pedidas = [];   // formaciones que piden las páginas (antes o después de arrancar)
  var sumar = null;   // se define al arrancar la versión animada

  S.bytes = {
    muestrearSilueta: muestrearSilueta,
    /* formar({ lugar, medir, entrada, dura, demora, alListo }) */
    formar: function (f) { if (sumar) sumar(f); else pedidas.push(f); },
    /* Versión quieta, para movimiento reducido: dibuja las celdas una vez en
       un canvas dentro del elemento */
    estatica: function (el, medir) {
      if (!lienzoSoportado) return;
      fuentes.then(function () {
        var lienzo = document.createElement('canvas');
        lienzo.className = 'particulas-estaticas';
        lienzo.setAttribute('aria-hidden', 'true');
        el.appendChild(lienzo);
        var sprites = crearSpritesDigito(), anchoPrevio = 0;
        function dibujar() {
          var w = el.clientWidth, h = el.clientHeight;
          if (!w || !h || w === anchoPrevio) return;
          anchoPrevio = w;
          var forma = medir();
          if (!forma) return;
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          var b = el.getBoundingClientRect();
          lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
          var x = lienzo.getContext('2d');
          x.setTransform(dpr, 0, 0, dpr, 0, 0);
          forma.celdas.forEach(function (c) {
            var spr = sprites[colorDe(c.tono)][Math.random() < 0.5 ? 0 : 1];
            var alto = forma.paso * 1.5, ancho = alto * spr.width / spr.height;
            x.globalAlpha = 0.75 + Math.random() * 0.25;
            x.drawImage(spr, c.x - b.left - window.scrollX - ancho / 2, c.y - b.top - window.scrollY - alto / 2, ancho, alto);
          });
        }
        dibujar();
        window.addEventListener('resize', dibujar);
      });
    }
  };

  if (!lienzoSoportado || S.reducido) return;

  /* ==========================================================================
     Versión animada
     ========================================================================== */
  function iniciar() {
    var esMobile = raiz.clientWidth < 768;

    /* --- Canvas fijo --- */
    var lienzo = document.createElement('canvas');
    lienzo.className = 'particulas';
    lienzo.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(lienzo, document.body.firstChild);
    var ctx = lienzo.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    function ajustarLienzo() {
      W = raiz.clientWidth; H = window.innerHeight;
      lienzo.width = Math.round(W * dpr);
      lienzo.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ajustarLienzo();

    var spritesPunto = PALETA.map(crearSpritePunto);
    var spritesDigito = crearSpritesDigito();

    /* --- Estrellas de fondo --- */
    var N = esMobile ? 90 : 220;
    var estrellas = [];
    for (var i = 0; i < N; i++) {
      var r = Math.random();
      var color = r < 0.28 ? 0 : r < 0.58 ? 1 : r < 0.84 ? 2 : 3;
      var y = Math.random();
      estrellas.push({ x: Math.random(), y: y, color: color, tam: (0.8 + Math.random() * 1.2 + (color === 3 ? 0.5 : 0)) * 3.2, alfa: 0.2 + 0.34 * y, fase: Math.random() * 6.28 });
    }

    /* --- Formaciones --- */
    var formaciones = [];

    function preparar(f) {
      // Si su lugar no cambió (o el título ya terminó), no se vuelve a muestrear
      var ref = f.el || f.lugar;
      if (ref) {
        if (f.el && f.hecho) return;
        var r = ref.getBoundingClientRect();
        var clave = [r.left, r.top + window.scrollY, r.width, r.height].map(Math.round).join();
        if (f.lista && clave === f.clave) return;
        f.clave = clave;
      }
      var forma = f.medir();
      f.lista = null;
      if (!forma) return;
      f.paso = forma.paso;
      f.tam = f.paso * 1.25;
      var viejas = f.particulas || [];
      f.particulas = forma.celdas.map(function (c, k) {
        // Si ya existía (se volvió a medir por un cambio de tamaño) conserva lo suyo
        var v = viejas[k], p = { x: c.x, y: c.y };
        if (v) { p.dx = v.dx; p.dy = v.dy; p.demora = v.demora; p.giro = v.giro; p.digito = v.digito; p.alfa = v.alfa; p.fase = v.fase; p.color = v.color; return p; }
        p.color = colorDe(c.tono);
        p.digito = Math.random() < 0.5 ? 0 : 1;
        p.alfa = 0.82 + Math.random() * 0.18;
        p.fase = Math.random() * 6.28;
        p.demora = Math.random() * 0.35;
        if (f.entrada === 'derecha') {
          // Llegan volando desde la derecha, las de adelante primero
          p.dx = W * (0.25 + Math.random() * 0.45); p.dy = (Math.random() - 0.5) * H * 0.5;
          p.giro = 0;
        } else {
          // Salen en espiral desde un círculo grande alrededor del título
          var a = Math.random() * 6.28, radio = Math.min(W, H) * (0.35 + Math.random() * 0.45);
          p.dx = forma.cx + Math.cos(a) * radio - c.x; p.dy = forma.cy + Math.sin(a) * radio * 0.8 - c.y;
          p.giro = 1.6 + Math.random() * 1.8;
        }
        return p;
      });
      f.cx = forma.cx; f.cy = forma.cy;
      f.lista = true;
    }

    sumar = function (f) {
      f.t = f.t || 0;
      preparar(f);
      f.inicio = 0;
      formaciones.push(f);
    };

    function mostrarTitulo(f, op) {
      var v = Math.max(0.004, Math.round(op * 100) / 100); // nunca cero (ver servicio.css)
      if (f.opAplicada === v) return;
      f.opAplicada = v;
      f.el.style.animation = 'none'; // se apaga el respaldo de CSS
      f.el.style.opacity = String(v);
    }

    /* Devuelve true si la formación está en movimiento */
    function dibujarFormacion(f, ahora, scroll, dt) {
      if (!f.lista) { if (f.el) mostrarTitulo(f, 1); return false; }
      if (f.dura) {
        if (!f.inicio) f.inicio = ahora + (f.demora || 0);
        f.t = limitar((ahora - f.inicio) / f.dura, 0, 1);
      }
      var t = f.t;
      var op = f.el ? suave(0.88, 1, t) : 0;
      if (f.el) mostrarTitulo(f, op);
      if (t >= 1 && !f.hecho && f.dura) { f.hecho = true; if (f.alListo) f.alListo(); }
      if (t <= 0 || (f.el && t >= 1)) return false;
      if (f.cy - scroll < -H || f.cy - scroll > H * 2) return false; // lejos de la pantalla

      var brillo = 1, quieta = t >= 1;
      if (f.pulso) { f.pulso = Math.max(0, f.pulso - dt / 0.9); brillo = 1 + 0.8 * Math.sin(Math.PI * f.pulso); }
      for (var k = 0; k < f.particulas.length; k++) {
        var p = f.particulas[k], x = p.x, y = p.y - scroll, alfa = p.alfa;
        if (!quieta) {
          var u = limitar((t - p.demora) / 0.5, 0, 1);
          if (u <= 0) continue;
          var e = entradaSalida(u), falta = 1 - e;
          if (p.giro) {
            // Espiral: el punto gira alrededor del centro mientras se acerca
            var rx = x + p.dx - f.cx, ry = p.y + p.dy - f.cy;
            var cosA = Math.cos(p.giro * falta), senA = Math.sin(p.giro * falta);
            x = mezclar(f.cx + rx * cosA - ry * senA, x, e);
            y = mezclar(f.cy - scroll + rx * senA + ry * cosA, y, e);
          } else { x += p.dx * falta; y += p.dy * falta * falta; }
          alfa *= suave(0, 0.35, u);
        } else {
          alfa *= 0.8 + 0.2 * Math.sin(ahora / 700 + p.fase);
        }
        alfa *= 1 - op;
        if (alfa < 0.01 || x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
        ctx.globalAlpha = Math.min(1, alfa * brillo);
        var spr = spritesDigito[p.color][p.digito];
        var alto = f.tam * 1.25 * (brillo > 1 ? 1 + (brillo - 1) * 0.2 : 1), ancho = alto * spr.width / spr.height;
        ctx.drawImage(spr, x - ancho / 2, y - alto / 2, ancho, alto);
      }
      // Los 0 y 1 cambian de vez en cuando (se ven "vivos")
      for (var v = 0; v < 3; v++) f.particulas[(Math.random() * f.particulas.length) | 0].digito ^= 1;
      return !quieta || !!f.pulso;
    }

    /* --- 1. El h1 del hero, por tiempo --- */
    var h1 = document.querySelector('.hero-servicio h1');
    if (h1) {
      // Si la página se abre ya scrolleada (recarga, link a una sección), el
      // título se muestra directo
      if (window.scrollY > H * 0.5) { h1.style.animation = 'none'; h1.style.opacity = '1'; }
      else {
        sumar({
          el: h1, dura: +(h1.dataset.dura || 1500), demora: +(h1.dataset.demora || 0),
          medir: function () { return muestrearTitulo(h1, esMobile ? 900 : 1500); }
        });
      }
    }

    /* --- 2. HABLEMOS, atado al scroll --- */
    var h2 = document.getElementById('titulo-contacto');
    if (h2 && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      var fContacto = { el: h2, medir: function () { return muestrearTitulo(h2, esMobile ? 800 : 1500); } };
      sumar(fContacto);
      var fin = esMobile ? '60%' : (raiz.clientWidth < 1024 ? '50%' : '42%');
      gsap.to(fContacto, {
        t: 1, ease: 'none',
        scrollTrigger: { trigger: h2, start: 'top 98%', end: 'top ' + fin, scrub: 0.6 }
      });
    }

    pedidas.forEach(sumar);
    pedidas = [];

    /* Si cambian las medidas (giro del celu, acordeón, formulario), las
       formaciones se vuelven a tomar en su lugar nuevo */
    function medirTodo() {
      if (raiz.clientWidth !== W || Math.abs(window.innerHeight - H) > 1) ajustarLienzo();
      formaciones.forEach(preparar);
    }
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', medirTodo);
    window.addEventListener('resize', function () {
      if (raiz.clientWidth === W && window.innerHeight === H) return;
      var cambioAncho = raiz.clientWidth !== W;
      ajustarLienzo();
      if (cambioAncho && !window.ScrollTrigger) medirTodo();
    });

    /* --- Estrellas fugaces: una cada 6 a 10 segundos, nunca durante una formación --- */
    var fugaz = null, proximaFugaz = performance.now() / 1000 + 5 + Math.random() * 3;

    function crearFugaz() {
      var abajo = 0.3 + Math.random() * 0.35, dir = Math.random() < 0.5 ? 1 : -1;
      var vel = (0.8 + Math.random() * 0.5) * Math.max(W, H) * 0.95;
      fugaz = {
        x: W * (0.15 + Math.random() * 0.7), y: H * (0.06 + Math.random() * 0.4),
        vx: Math.cos(abajo) * vel * dir, vy: Math.sin(abajo) * vel,
        largo: (esMobile ? 55 : 90) + Math.random() * (esMobile ? 35 : 60),
        vida: 0.5 + Math.random() * 0.3, edad: 0, color: PALETA[Math.random() < 0.6 ? 3 : 2]
      };
    }

    function dibujarFugaz(dt) {
      var f = fugaz;
      f.edad += dt;
      if (f.edad >= f.vida) { fugaz = null; return; }
      f.x += f.vx * dt; f.y += f.vy * dt;
      var alfa = Math.sin(Math.PI * f.edad / f.vida), v = Math.hypot(f.vx, f.vy);
      var colaX = f.x - f.vx / v * f.largo, colaY = f.y - f.vy / v * f.largo;
      var g = ctx.createLinearGradient(f.x, f.y, colaX, colaY);
      g.addColorStop(0, rgba(f.color, 0.9 * alfa));
      g.addColorStop(1, rgba(f.color, 0));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(colaX, colaY);
      ctx.stroke();
      ctx.globalAlpha = alfa;
      ctx.drawImage(spritesPunto[3], f.x - 4, f.y - 4, 8, 8);
    }

    /* --- Luces al tocar (solo toque o clic, nunca al deslizar) --- */
    var chispas = [], toque = null;
    window.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) { toque = null; return; }
      toque = { x: e.clientX, y: e.clientY, t: performance.now() };
    }, { passive: true });
    window.addEventListener('pointerup', function (e) {
      if (!toque || !e.isPrimary) return;
      var lejos = Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 10;
      if (!lejos && performance.now() - toque.t <= 500) crearChispas(e.clientX, e.clientY);
      toque = null;
    }, { passive: true });
    window.addEventListener('pointercancel', function () { toque = null; }, { passive: true });
    window.addEventListener('scroll', function () { toque = null; }, { passive: true });

    function crearChispas(x, y) {
      var n = 6 + Math.floor(Math.random() * 5);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, v = 70 + Math.random() * 130, r = Math.random();
        chispas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.55 + Math.random() * 0.35, edad: 0, color: r < 0.35 ? 3 : r < 0.75 ? 2 : 1, tam: 1.4 + Math.random() * 1.2 });
      }
    }

    function dibujarChispas(dt) {
      for (var i = chispas.length - 1; i >= 0; i--) {
        var c = chispas[i];
        c.edad += dt;
        if (c.edad >= c.vida) { chispas.splice(i, 1); continue; }
        var freno = Math.max(0, 1 - 3.2 * dt);
        c.vx *= freno; c.vy *= freno;
        c.x += c.vx * dt; c.y += c.vy * dt;
        var alfa = 1 - c.edad / c.vida, d = c.tam * 4;
        ctx.globalAlpha = alfa * alfa;
        ctx.drawImage(spritesPunto[c.color], c.x - d / 2, c.y - d / 2, d, d);
      }
    }

    /* --- Cuadro a cuadro --- */
    var anterior = performance.now(), idCuadro = 0, corriendo = false, activo = true, par = false;

    function cuadro(ahora) {
      idCuadro = requestAnimationFrame(cuadro);
      par = !par;
      // Solo estrellas: alcanza con la mitad de los cuadros
      var scrollMovido = window.scrollY !== cuadro.scroll;
      if (!activo && !scrollMovido && !fugaz && !chispas.length && par) return;
      cuadro.scroll = window.scrollY;
      var dt = Math.min((ahora - anterior) / 1000, 0.05);
      anterior = ahora;
      var scroll = window.scrollY, tiempo = ahora / 1000, i;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      for (i = 0; i < N; i++) {
        var s = estrellas[i];
        ctx.globalAlpha = s.alfa * (0.6 + 0.4 * Math.sin(tiempo * 0.9 + s.fase));
        ctx.drawImage(spritesPunto[s.color], s.x * W - s.tam / 2, s.y * H - s.tam / 2, s.tam, s.tam);
      }

      activo = false;
      for (i = 0; i < formaciones.length; i++) if (dibujarFormacion(formaciones[i], ahora, scroll, dt)) activo = true;

      if (!fugaz && tiempo >= proximaFugaz) {
        if (activo) proximaFugaz = tiempo + 2 + Math.random() * 3;
        else { crearFugaz(); proximaFugaz = tiempo + 6 + Math.random() * 4; }
      }
      if (fugaz) dibujarFugaz(dt);
      if (chispas.length) dibujarChispas(dt);
      ctx.globalAlpha = 1;
    }

    function arrancar() {
      if (corriendo) return;
      corriendo = true;
      anterior = performance.now();
      idCuadro = requestAnimationFrame(cuadro);
    }
    function frenar() { corriendo = false; cancelAnimationFrame(idCuadro); }
    document.addEventListener('visibilitychange', function () { if (document.hidden) frenar(); else arrancar(); });
    if (!document.hidden) arrancar();
  }

  /* El h1 se forma apenas están las fuentes, sin esperar a las imágenes */
  fuentes.then(function () { requestAnimationFrame(iniciar); });
})();
