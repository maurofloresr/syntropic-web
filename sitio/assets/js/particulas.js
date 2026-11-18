/* ==========================================================================
   Syntropic: sistema de partículas (docs/brief.md, sección 9)

   Un solo canvas fijo detrás del contenido. Las mismas partículas recorren
   toda la web:
     galaxia > S > DESARROLLO WEB > AUTOMATIZACIONES > SISTEMAS > HABLEMOS

   Cómo funciona:
   - Cada partícula tiene un destino en cada estado (galaxia, S, cada título).
   - El scroll (ScrollTrigger con scrub) define en qué tramo estamos: un
     estado quieto ("pausa") o una transición en espiral entre dos estados.
     Si el usuario sube, todo se rebobina porque la posición depende solo
     del scroll.
   - Cuando un título termina de formarse, el h2 real aparece encima (fade)
     y las partículas se apagan. El h2 siempre existe en el HTML.
   - Estrellas fugaces y luces al tocar se dibujan en el mismo canvas.
   - Con prefers-reduced-motion: sin canvas animado. Solo una S estática de
     puntos en el hero y los h2 normales.

   Anclaje de cada estado (cómo se mueve con el scroll):
   - k = 1    pegado al documento (los títulos: se mueven con su h2).
   - k < 1    hero: se mueve más lento que la página (galaxia y S).
   - k = 0    pegado a la pantalla (estrellas de fondo).
   ========================================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lienzoSoportado = !!document.createElement('canvas').getContext;
  if (!lienzoSoportado) return;

  /* --- Paleta: solo los colores de la marca (brief, sección Marca) --- */
  var PALETA = [
    [0, 64, 255],    // 0 azul eléctrico #0040FF
    [71, 173, 255],  // 1 celeste #47ADFF
    [160, 211, 253], // 2 celeste claro #A0D3FD
    [255, 255, 255]  // 3 blanco #FFFFFF
  ];
  // Los 0 y 1 de los títulos van en celeste, celeste claro y blanco
  // (el azul eléctrico sobre navy no se lee): el azul pasa a celeste.
  var COLOR_DIGITO = [1, 1, 2, 3];

  var TITULOS = ['titulo-desarrollo-web', 'titulo-automatizaciones', 'titulo-sistemas', 'titulo-contacto'];
  var IMAGEN_S = 'assets/img/isologo-s-muestreo.png';

  /* --- Utilidades --- */
  function limitar(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mezclar(a, b, t) { return a + (b - a) * t; }
  function suave(a, b, v) { var t = limitar((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function entradaSalida(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function cargarImagen(src) {
    return new Promise(function (ok, error) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = error;
      img.src = src;
    });
  }

  function anchoPantalla() { return raiz.clientWidth; }
  function altoPantalla() { return window.innerHeight; }

  /* ==========================================================================
     Muestreo de formas
     ========================================================================== */

  /* S del isologo: puntos al azar dentro de una grilla (como el mockup, denso
     y sin orden visible). Devuelve coordenadas del documento. */
  function muestrearS(img, cx, cy, alto, presupuesto) {
    var ancho = Math.round(alto * img.width / img.height);
    alto = Math.round(alto);
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, ancho, alto);
    var datos = x.getImageData(0, 0, ancho, alto).data;

    var area = 0;
    for (var p = 3; p < datos.length; p += 4) if (datos[p] > 128) area++;
    var paso = Math.max(2.5, Math.sqrt(area / presupuesto));
    var puntos;
    do {
      puntos = [];
      for (var gy = paso / 2; gy < alto; gy += paso) {
        for (var gx = paso / 2; gx < ancho; gx += paso) {
          var px = gx + (Math.random() - 0.5) * paso;
          var py = gy + (Math.random() - 0.5) * paso;
          var ix = limitar(Math.round(px), 0, ancho - 1);
          var iy = limitar(Math.round(py), 0, alto - 1);
          if (datos[(iy * ancho + ix) * 4 + 3] > 128) {
            puntos.push(cx - ancho / 2 + px, cy - alto / 2 + py);
          }
        }
      }
      paso *= 1.06;
    } while (puntos.length / 2 > presupuesto);
    return { puntos: puntos, cx: cx, cy: cy, alto: alto };
  }

  /* Título: se dibuja cada palabra del h2 en un canvas oculto, en la misma
     posición y tamaño que el texto real, y se toma una grilla de celdas.
     Cada celda es un 0 o un 1. */
  function muestrearTitulo(h2, presupuesto) {
    var rect = h2.getBoundingClientRect();
    var sx = window.scrollX, sy = window.scrollY;
    var ancho = Math.ceil(rect.width), alto = Math.ceil(rect.height);
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d', { willReadFrequently: true });
    var estilo = getComputedStyle(h2);
    var fs = parseFloat(estilo.fontSize);
    x.font = estilo.fontWeight + ' ' + fs + 'px "Archivo Expanded"';
    x.fillStyle = '#fff';
    x.textBaseline = 'alphabetic';
    var medida = x.measureText('M');
    var ascenso = medida.fontBoundingBoxAscent || fs * 0.92;

    var recorrido = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT);
    var nodo;
    while ((nodo = recorrido.nextNode())) {
      var re = /\S+/g, m;
      while ((m = re.exec(nodo.data))) {
        var rango = document.createRange();
        rango.setStart(nodo, m.index);
        rango.setEnd(nodo, m.index + m[0].length);
        var r = rango.getBoundingClientRect();
        x.fillText(m[0].toLocaleUpperCase('es-AR'), r.left - rect.left, r.top - rect.top + ascenso);
      }
    }

    var datos = x.getImageData(0, 0, ancho, alto).data;
    var area = 0;
    for (var p = 3; p < datos.length; p += 4) if (datos[p] > 128) area++;

    var paso = Math.max(fs / 14, 3.5, Math.sqrt(area / presupuesto));
    var celdas;
    do {
      celdas = [];
      for (var gy = paso / 2; gy < alto; gy += paso) {
        for (var gx = paso / 2; gx < ancho; gx += paso) {
          if (datos[(Math.round(gy) * ancho + Math.round(gx)) * 4 + 3] > 128) {
            celdas.push(rect.left + sx + gx, rect.top + sy + gy);
          }
        }
      }
      paso *= 1.06;
    } while (celdas.length / 2 > presupuesto);
    paso /= 1.06;

    return {
      celdas: celdas,
      paso: paso,
      cx: rect.left + sx + rect.width / 2,
      cy: rect.top + sy + rect.height / 2
    };
  }

  /* ==========================================================================
     Sprites (se dibujan una vez y se reusan: mucho más rápido que dibujar
     cada punto o cada número por separado)
     ========================================================================== */
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

  /* ==========================================================================
     Versión con movimiento reducido: S estática de puntos en el hero
     ========================================================================== */
  function iniciarReducido() {
    var visual = document.querySelector('.hero-visual');
    if (!visual) return;
    cargarImagen(IMAGEN_S).then(function (img) {
      var lienzo = document.createElement('canvas');
      lienzo.className = 'particulas-estaticas';
      lienzo.setAttribute('aria-hidden', 'true');
      visual.appendChild(lienzo);
      var anchoPrevio = 0;

      function dibujar() {
        var w = visual.clientWidth, h = visual.clientHeight;
        if (!w || !h || w === anchoPrevio) return;
        anchoPrevio = w;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        lienzo.width = Math.round(w * dpr);
        lienzo.height = Math.round(h * dpr);
        var x = lienzo.getContext('2d');
        x.setTransform(dpr, 0, 0, dpr, 0, 0);
        var alto = Math.min(h * 0.8, w * 0.95 * img.height / img.width);
        var forma = muestrearS(img, w / 2, h / 2, alto, w < 768 ? 700 : 1600);
        var sprites = PALETA.map(crearSpritePunto);
        // Glow suave detrás de la S
        var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(alto * 0.7, w / 2, h / 2));
        g.addColorStop(0, rgba(PALETA[0], 0.28));
        g.addColorStop(1, rgba(PALETA[0], 0));
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        for (var i = 0; i < forma.puntos.length; i += 2) {
          var r = Math.random();
          var color = r < 0.3 ? 0 : r < 0.65 ? 1 : r < 0.9 ? 2 : 3;
          var d = (1 + Math.random() * 1.2 + (color === 3 ? 0.5 : 0)) * 4;
          x.globalAlpha = 0.7 + Math.random() * 0.3;
          x.drawImage(sprites[color], forma.puntos[i] - d / 2, forma.puntos[i + 1] - d / 2, d, d);
        }
      }

      dibujar();
      window.addEventListener('resize', dibujar);
    }).catch(function () {});
  }

  /* ==========================================================================
     Versión animada
     ========================================================================== */
  function iniciarAnimado() {
    var titulos = TITULOS.map(function (id) { return document.getElementById(id); });
    var visual = document.querySelector('.hero-visual');
    if (titulos.some(function (t) { return !t; }) || !visual) return;

    var esMobile = anchoPantalla() < 768;
    var N = esMobile ? 900 : 2500;
    if (!esMobile && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) N = 1800;
    var N_ESTRELLAS = esMobile ? 90 : 220;
    // Galaxia y S suben más lento que la página. En el diseño en columna
    // (mobile y tablet) la galaxia está arriba del texto: más lento todavía,
    // para que la S formada no quede debajo del menú.
    var enColumna = anchoPantalla() < 1024;
    var K_HERO = enColumna ? 0.2 : 0.45;

    /* --- Datos fijos de cada partícula --- */
    var color = new Uint8Array(N);
    var tam = new Float32Array(N);
    var fase = new Float32Array(N);
    var digito = new Uint8Array(N);
    var demora = new Float32Array(N);
    var vueltas = new Uint8Array(N);
    var apertura = new Float32Array(N);
    var galR = new Float32Array(N), galA = new Float32Array(N), galW = new Float32Array(N), galAlfa = new Float32Array(N);
    var estX = new Float32Array(N), estY = new Float32Array(N);
    var rango = new Uint32Array(N); // orden al azar: define quién va a cada lugar

    for (var i = 0; i < N; i++) {
      var r = Math.random();
      color[i] = r < 0.3 ? 0 : r < 0.65 ? 1 : r < 0.9 ? 2 : 3;
      tam[i] = 0.8 + Math.random() * 1.2 + (color[i] === 3 ? 0.5 : 0);
      fase[i] = Math.random() * Math.PI * 2;
      digito[i] = Math.random() < 0.5 ? 0 : 1;
      demora[i] = Math.random() * 0.25;
      vueltas[i] = Math.random() < 0.55 ? 1 : 0;
      apertura[i] = 0.5 + Math.random() * 0.8;

      // Galaxia: núcleo denso, dos brazos en espiral y polvo suelto
      var radio, angulo, tipo = Math.random();
      if (tipo < 0.2) {
        radio = Math.pow(Math.random(), 1.6) * 0.3;
        angulo = Math.random() * Math.PI * 2;
      } else if (tipo < 0.78) {
        radio = 0.08 + Math.pow(Math.random(), 1.1) * 0.92;
        angulo = (Math.random() < 0.5 ? 0 : Math.PI) + radio * 4.2 + gauss() * (0.25 + radio * 0.35);
      } else {
        radio = Math.pow(Math.random(), 0.7) * 1.1;
        angulo = Math.random() * Math.PI * 2;
      }
      galR[i] = radio;
      galA[i] = angulo;
      galW[i] = 0.035 + 0.09 * (1 - Math.min(radio, 1));
      galAlfa[i] = (0.45 + Math.random() * 0.55) * (1 - 0.4 * Math.min(radio, 1));

      estX[i] = Math.random();
      estY[i] = Math.random();
      rango[i] = i;
    }
    for (i = N - 1; i > 0; i--) { // mezcla de Fisher-Yates
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = rango[i]; rango[i] = rango[j]; rango[j] = tmp;
    }

    /* --- Canvas fijo --- */
    var lienzo = document.createElement('canvas');
    lienzo.className = 'particulas';
    lienzo.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(lienzo, document.body.firstChild);
    var ctx = lienzo.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function ajustarLienzo() {
      W = anchoPantalla(); H = altoPantalla();
      lienzo.width = Math.round(W * dpr);
      lienzo.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ajustarLienzo();

    var spritesPunto = PALETA.map(crearSpritePunto);
    var spritesDigito = PALETA.map(function (c) { return [crearSpriteDigito(c, '0'), crearSpriteDigito(c, '1')]; });

    /* --- Estados --- */
    function nuevoEstado(tipo) {
      return {
        tipo: tipo,
        X: new Float32Array(N), Y: new Float32Array(N), K: new Float32Array(N),
        G: new Uint8Array(N),   // 1 = se dibuja como 0/1, 0 = punto
        A: new Float32Array(N), // opacidad base
        T: new Uint8Array(N),   // 1 = parte del título (se apaga cuando aparece el h2)
        Z: new Float32Array(N), // multiplicador de tamaño
        cx: 0, cy: 0, ck: 1,    // centro de la forma y su anclaje
        tamDigito: 0,
        h2: null, h2op: 0
      };
    }
    var galaxia = nuevoEstado('galaxia');
    var estadoS = nuevoEstado('s');
    var estadosTitulo = titulos.map(function (h2) { var e = nuevoEstado('titulo'); e.h2 = h2; return e; });
    var estados = [galaxia, estadoS].concat(estadosTitulo);

    var hero = { cx: 0, cy: 0, R: 0 };
    var tramos = [];
    var imagenS = null;
    var listo = false;

    /* Mide todo y arma los destinos. Se llama al iniciar y en cada refresh
       de ScrollTrigger (cambio de tamaño, carga de fuentes). */
    function construir() {
      if (!imagenS) return;
      if (anchoPantalla() !== W || Math.abs(altoPantalla() - H) > 1) ajustarLienzo();
      var sy = window.scrollY;
      var minimo = Math.min(W, H);

      // Hero: centro y tamaño de la galaxia
      var rv = visual.getBoundingClientRect();
      hero.cx = rv.left + rv.width / 2;
      hero.cy = rv.top + sy + rv.height / 2;
      hero.R = W >= 1024 ? Math.min(H * 0.42, 380) : Math.min(rv.width, rv.height) * 0.62;

      // Galaxia (las posiciones se calculan en cada cuadro porque gira)
      galaxia.cx = hero.cx; galaxia.cy = hero.cy; galaxia.ck = K_HERO;
      for (var i = 0; i < N; i++) {
        galaxia.K[i] = K_HERO; galaxia.G[i] = 0; galaxia.A[i] = galAlfa[i]; galaxia.T[i] = 0; galaxia.Z[i] = 1;
      }

      // S: la mayoría de las partículas forman la S, el resto queda como halo
      var altoS = Math.min(hero.R * 1.05, rv.height * 0.85);
      var formaS = muestrearS(imagenS, hero.cx, hero.cy, altoS, Math.floor(N * 0.78));
      var nS = formaS.puntos.length / 2;
      estadoS.cx = hero.cx; estadoS.cy = hero.cy; estadoS.ck = K_HERO;
      estadoS.altoS = altoS;
      for (i = 0; i < N; i++) {
        var k = rango[i];
        estadoS.K[i] = K_HERO; estadoS.G[i] = 0; estadoS.T[i] = 0;
        if (k < nS) {
          estadoS.X[i] = formaS.puntos[k * 2];
          estadoS.Y[i] = formaS.puntos[k * 2 + 1];
          estadoS.A[i] = 0.75 + 0.25 * ((fase[i] / 6.283) % 1);
          estadoS.Z[i] = 1;
        } else {
          estadoS.A[i] = galAlfa[i] * 0.55;
          estadoS.Z[i] = 0.9;
          estadoS.X[i] = NaN; // halo: se calcula desde la galaxia en cada cuadro
        }
      }

      // Títulos: celdas con 0 y 1, polvo fino y estrellas de fondo
      var presupuesto = N - N_ESTRELLAS;
      estadosTitulo.forEach(function (e) {
        var forma = muestrearTitulo(e.h2, presupuesto);
        var nC = forma.celdas.length / 2;
        e.cx = forma.cx; e.cy = forma.cy; e.ck = 1;
        e.tamDigito = forma.paso * 1.2;
        for (var i = 0; i < N; i++) {
          var k = rango[i];
          if (k >= N - N_ESTRELLAS) {
            e.X[i] = estX[i] * W; e.Y[i] = estY[i] * H; e.K[i] = 0;
            e.G[i] = 0; e.T[i] = 0; e.A[i] = 0.18 + 0.32 * estY[i]; e.Z[i] = 0.8;
          } else if (k < nC) {
            e.X[i] = forma.celdas[k * 2]; e.Y[i] = forma.celdas[k * 2 + 1]; e.K[i] = 1;
            e.G[i] = 1; e.T[i] = 1; e.A[i] = 0.82 + 0.18 * estX[i]; e.Z[i] = 1;
          } else {
            var c = (k % nC) * 2;
            e.X[i] = forma.celdas[c] + (estX[i] - 0.5) * forma.paso * 1.2;
            e.Y[i] = forma.celdas[c + 1] + (estY[i] - 0.5) * forma.paso * 1.2;
            e.K[i] = 1; e.G[i] = 0; e.T[i] = 1; e.A[i] = 0.35; e.Z[i] = 0.7;
          }
        }
      });

      // Tramos del scroll
      var menu = parseFloat(getComputedStyle(raiz).getPropertyValue('--altura-menu')) || 56;
      var reposo = Math.max(menu + 40, H * 0.2); // dónde queda el título formado
      var listos = titulos.map(function (h2) {
        return h2.getBoundingClientRect().top + sy - reposo;
      });
      tramos = [];
      var a0 = H * 0.02;
      // En columna la S se forma con el primer pedacito de scroll, antes de
      // que el texto del hero suba y la pise
      var a1 = Math.min(H * (enColumna ? 0.14 : 0.3), listos[0] * 0.4);
      tramos.push({ a: 0, b: 0, s0: -Infinity, s1: a0 });
      tramos.push({ a: 0, b: 1, s0: a0, s1: a1 });
      var b0 = Math.min(Math.max(a1 + H * 0.05, listos[0] - H * 0.95), listos[0] - H * 0.25);
      b0 = Math.max(b0, a1);
      tramos.push({ a: 1, b: 1, s0: a1, s1: b0 });
      tramos.push({ a: 1, b: 2, s0: b0, s1: listos[0] });
      for (var t = 0; t < listos.length - 1; t++) {
        var c0 = Math.max(listos[t] + H * 0.08, listos[t + 1] - H * 0.95);
        tramos.push({ a: 2 + t, b: 2 + t, s0: listos[t], s1: c0 });
        tramos.push({ a: 2 + t, b: 3 + t, s0: c0, s1: listos[t + 1] });
      }
      tramos.push({ a: 5, b: 5, s0: listos[listos.length - 1], s1: Infinity });

      // Si el título anterior quedó muy arriba (secciones largas), las
      // partículas arrancan apenas por encima de la pantalla
      tramos.forEach(function (tr) {
        tr.corrimiento = 0;
        if (tr.a === tr.b || estados[tr.a].ck !== 1) return;
        var centroPantalla = estados[tr.a].cy - tr.s0;
        if (centroPantalla < -H * 0.3) tr.corrimiento = -H * 0.3 - centroPantalla;
      });

      minimoPantalla = minimo;
      listo = true;
    }
    var minimoPantalla = 0;

    /* --- Scroll con scrub (ScrollTrigger) --- */
    var proxy = { p: 0 };
    var usaGsap = window.gsap && window.ScrollTrigger;
    if (usaGsap) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.6 }
      });
      ScrollTrigger.addEventListener('refresh', construir);
    }
    function scrollSuavizado() {
      if (!usaGsap) return window.scrollY;
      return proxy.p * ScrollTrigger.maxScroll(window);
    }

    /* --- Galaxia en el tiempo --- */
    function actualizarGalaxia(tiempo) {
      var R = hero.R;
      for (var i = 0; i < N; i++) {
        var a = galA[i] + galW[i] * tiempo;
        var x = hero.cx + Math.cos(a) * galR[i] * R;
        var y = hero.cy + Math.sin(a) * galR[i] * R * 0.9;
        galaxia.X[i] = x; galaxia.Y[i] = y;
        if (estadoS.Z[i] !== 1) { // halo alrededor de la S
          estadoS.X[i] = hero.cx + (x - hero.cx) * 1.18;
          estadoS.Y[i] = hero.cy + (y - hero.cy) * 1.18;
        }
      }
    }

    /* --- Opacidad de cada h2 según el tramo --- */
    function opacidadesTitulos(tramo, t) {
      for (var e = 0; e < estadosTitulo.length; e++) {
        var idx = e + 2, op = 0;
        if (tramo.a === idx && tramo.b === idx) op = 1;
        else if (tramo.b === idx) op = suave(0.86, 1, t);
        else if (tramo.a === idx) op = 1 - suave(0, 0.1, t);
        var est = estadosTitulo[e];
        est.h2op = op;
        var redondeada = Math.round(op * 100) / 100;
        if (est.opAplicada !== redondeada) {
          est.h2.style.opacity = String(redondeada);
          est.opAplicada = redondeada;
        }
      }
    }

    function buscarTramo(v) {
      for (var i = 0; i < tramos.length; i++) {
        if (v < tramos[i].s1) return tramos[i];
      }
      return tramos[tramos.length - 1];
    }

    /* --- Estrellas fugaces --- */
    var fugaz = null;
    var proximaFugaz = 0;
    function programarFugaz(ahora) { proximaFugaz = ahora + 6 + Math.random() * 4; }

    function crearFugaz() {
      var abajo = 0.3 + Math.random() * 0.35;
      var dir = Math.random() < 0.5 ? 1 : -1;
      var vel = (0.8 + Math.random() * 0.5) * Math.max(W, H) * 0.95;
      fugaz = {
        x: W * (0.15 + Math.random() * 0.7),
        y: H * (0.06 + Math.random() * 0.4),
        vx: Math.cos(abajo) * vel * dir,
        vy: Math.sin(abajo) * vel,
        largo: (esMobile ? 55 : 90) + Math.random() * (esMobile ? 35 : 60),
        vida: 0.5 + Math.random() * 0.3,
        edad: 0,
        color: PALETA[Math.random() < 0.6 ? 3 : 2]
      };
    }

    function dibujarFugaz(dt) {
      var f = fugaz;
      f.edad += dt;
      if (f.edad >= f.vida) { fugaz = null; return; }
      f.x += f.vx * dt; f.y += f.vy * dt;
      var alfa = Math.sin(Math.PI * f.edad / f.vida);
      var v = Math.hypot(f.vx, f.vy);
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
    var chispas = [];
    var toque = null;
    window.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) { toque = null; return; }
      toque = { x: e.clientX, y: e.clientY, t: performance.now() };
    }, { passive: true });
    window.addEventListener('pointerup', function (e) {
      if (!toque || !e.isPrimary) return;
      var lejos = Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 10;
      var largo = performance.now() - toque.t > 500;
      if (!lejos && !largo) crearChispas(e.clientX, e.clientY);
      toque = null;
    }, { passive: true });
    window.addEventListener('pointercancel', function () { toque = null; }, { passive: true });
    window.addEventListener('scroll', function () { toque = null; }, { passive: true });

    function crearChispas(x, y) {
      var n = 6 + Math.floor(Math.random() * 5);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var v = 70 + Math.random() * 130;
        var r = Math.random();
        chispas.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          vida: 0.55 + Math.random() * 0.35, edad: 0,
          color: r < 0.35 ? 3 : r < 0.75 ? 2 : 1,
          tam: 1.4 + Math.random() * 1.2
        });
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
        var alfa = 1 - c.edad / c.vida;
        var d = c.tam * 4;
        ctx.globalAlpha = alfa * alfa;
        ctx.drawImage(spritesPunto[c.color], c.x - d / 2, c.y - d / 2, d, d);
      }
    }

    /* --- Cuadro a cuadro --- */
    var inicio = performance.now();
    var anterior = inicio;
    var idCuadro = 0;
    var corriendo = false;
    programarFugaz(1.5);

    function dibujarParticula(i, x, y, alfa, g, z, tamDigito) {
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
      // Punto o 0/1, nunca los dos (la mitad de dibujos en las transiciones)
      ctx.globalAlpha = alfa;
      if (g < 0.5 || !(tamDigito > 0)) {
        var d = tam[i] * z * 4;
        ctx.drawImage(spritesPunto[color[i]], x - d / 2, y - d / 2, d, d);
      } else {
        var spr = spritesDigito[COLOR_DIGITO[color[i]]][digito[i]];
        var h = tamDigito * 1.25, w = h * spr.width / spr.height;
        ctx.drawImage(spr, x - w / 2, y - h / 2, w, h);
      }
    }

    function alfaDe(e, i, tiempo) {
      var a = e.A[i];
      if (e.T[i]) a *= 1 - e.h2op;
      else if (e.K[i] === 0) a *= 0.6 + 0.4 * Math.sin(tiempo * 0.9 + fase[i]); // estrellas que titilan
      else a *= 0.82 + 0.18 * Math.sin(tiempo * 1.6 + fase[i]);
      return a;
    }

    function cuadro(ahora) {
      idCuadro = requestAnimationFrame(cuadro);
      var dt = Math.min((ahora - anterior) / 1000, 0.05);
      anterior = ahora;
      if (!listo) return;
      var tiempo = (ahora - inicio) / 1000;
      var scroll = window.scrollY;
      var v = scrollSuavizado();
      var tramo = buscarTramo(v);
      var enTransicion = tramo.a !== tramo.b;
      var t = enTransicion ? limitar((v - tramo.s0) / (tramo.s1 - tramo.s0), 0, 1) : 0;
      var A = estados[tramo.a], B = estados[tramo.b];
      var aparicion = suave(0, 1.2, tiempo);

      if (A.tipo !== 'titulo' || B.tipo !== 'titulo') actualizarGalaxia(tiempo);
      opacidadesTitulos(tramo, t);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Glow suave detrás de la S
      var pesoS = 0;
      if (tramo.a === 1 && tramo.b === 1) pesoS = 1;
      else if (tramo.b === 1) pesoS = suave(0.3, 1, t);
      else if (tramo.a === 1) pesoS = 1 - suave(0, 0.4, t);
      if (pesoS > 0.01) {
        var gx = estadoS.cx, gy = estadoS.cy - scroll * K_HERO;
        var gr = estadoS.altoS * 0.75;
        var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, rgba(PALETA[0], 0.3 * pesoS * aparicion));
        g.addColorStop(1, rgba(PALETA[0], 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }

      // Los 0 y 1 cambian de vez en cuando (se ven "vivos")
      if (A.tipo === 'titulo' || B.tipo === 'titulo') {
        for (var f = 0; f < 4; f++) digito[(Math.random() * N) | 0] ^= 1;
      }

      var i;
      if (!enTransicion) {
        for (i = 0; i < N; i++) {
          var al = alfaDe(A, i, tiempo) * aparicion;
          if (al < 0.01) continue;
          dibujarParticula(i, A.X[i], A.Y[i] - scroll * A.K[i], al, A.G[i], A.Z[i], A.tamDigito);
        }
      } else {
        // Transición en espiral (coordenadas polares alrededor de un centro
        // que viaja de una forma a la otra)
        var corr = tramo.corrimiento;
        var cfx = A.cx, cfy = A.cy - tramo.s0 * A.ck + (A.ck === 1 ? corr : 0);
        var cdx = B.cx, cty = B.cy - tramo.s1 * B.ck;
        var abre = minimoPantalla * 0.17;
        var tamDigito = A.tamDigito && B.tamDigito ? null : (A.tamDigito || B.tamDigito);

        for (i = 0; i < N; i++) {
          // Todas llegan al 80% del tramo: el título de bytes queda completo
          // un momento antes de que aparezca el h2 real
          var u = limitar((t - demora[i]) / 0.55, 0, 1);
          var e = entradaSalida(u);

          var fx = A.X[i], fy = A.Y[i] - tramo.s0 * A.K[i] + (A.K[i] === 1 ? corr : 0);
          var tx = B.X[i], ty = B.Y[i] - tramo.s1 * B.K[i];

          var lx = mezclar(fx, tx, e), ly = mezclar(fy, ty, e);
          var distancia = Math.hypot(tx - fx, ty - fy);
          var peso = suave(8, minimoPantalla * 0.3, distancia);
          var px = lx, py = ly;
          if (peso > 0 && e > 0 && e < 1) {
            var dx0 = fx - cfx, dy0 = fy - cfy, dx1 = tx - cdx, dy1 = ty - cty;
            var r0 = Math.hypot(dx0, dy0), r1 = Math.hypot(dx1, dy1);
            var a0 = Math.atan2(dy0, dx0), a1 = Math.atan2(dy1, dx1);
            var giro = a1 - a0;
            giro = ((giro % 6.2832) + 6.2832) % 6.2832 + vueltas[i] * 6.2832;
            var cx = mezclar(cfx, cdx, e), cy = mezclar(cfy, cty, e);
            var rr = mezclar(r0, r1, e) + abre * apertura[i] * Math.sin(Math.PI * e);
            var aa = a0 + giro * e;
            px = mezclar(lx, cx + Math.cos(aa) * rr, peso);
            py = mezclar(ly, cy + Math.sin(aa) * rr, peso);
          }
          // Al salir y al llegar, cada partícula queda pegada a su forma
          // (se mueve con el scroll real, igual que el h2); en el medio del
          // viaje la corrección se anula y la espiral queda en pantalla
          py -= (scroll - tramo.s1) * B.K[i] * e + (scroll - tramo.s0) * A.K[i] * (1 - e);

          var alfa = mezclar(alfaDe(A, i, tiempo), alfaDe(B, i, tiempo), e) * aparicion;
          if (alfa < 0.01) continue;
          var gA = A.G[i], gB = B.G[i];
          // Punto a 0/1 apenas arranca ("la S se desarma en 0 y 1");
          // 0/1 a punto recién al llegar
          var gl = gA === gB ? gA : (gB ? suave(0.05, 0.3, u) : 1 - suave(0.7, 0.95, u));
          var z = mezclar(A.Z[i], B.Z[i], e);
          var td = tamDigito === null ? mezclar(A.tamDigito, B.tamDigito, e) : tamDigito;
          dibujarParticula(i, px, py, alfa, gl, z, td);
        }
      }

      // Estrellas fugaces: una cada 6 a 10 segundos, nunca en una transición
      if (!fugaz && tiempo >= proximaFugaz) {
        if (enTransicion && t > 0 && t < 1) proximaFugaz = tiempo + 2 + Math.random() * 3;
        else { crearFugaz(); programarFugaz(tiempo); }
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
    function frenar() {
      corriendo = false;
      cancelAnimationFrame(idCuadro);
    }

    // Pausa con la pestaña oculta
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) frenar(); else arrancar();
    });

    window.addEventListener('resize', function () {
      if (anchoPantalla() !== W || altoPantalla() !== H) {
        ajustarLienzo();
        if (!usaGsap) construir();
      }
    });

    // Las formas se miden con las fuentes reales ya cargadas
    var fuentes = document.fonts ? Promise.all([
      document.fonts.load('900 40px "Archivo Expanded"'),
      document.fonts.load('600 32px Inter')
    ]).catch(function () {}) : Promise.resolve();

    Promise.all([cargarImagen(IMAGEN_S), fuentes]).then(function (res) {
      imagenS = res[0];
      spritesDigito = PALETA.map(function (c) { return [crearSpriteDigito(c, '0'), crearSpriteDigito(c, '1')]; });
      raiz.classList.add('con-particulas');
      if (usaGsap) ScrollTrigger.refresh(); else construir();
      if (!listo) construir();
      if (!document.hidden) arrancar();
    }).catch(function () {
      // Si algo falla, la web queda como texto normal
      lienzo.remove();
      titulos.forEach(function (h2) { h2.style.opacity = ''; });
    });
  }

  /* --- Arranque: después de la carga, sin bloquear el contenido --- */
  function iniciar() {
    if (reducido) iniciarReducido(); else iniciarAnimado();
  }
  function programar() {
    if ('requestIdleCallback' in window) requestIdleCallback(iniciar, { timeout: 1500 });
    else setTimeout(iniciar, 200);
  }
  if (document.readyState === 'complete') programar();
  else window.addEventListener('load', programar);
})();
