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
  // Excepción aprobada por Mauro: violeta #B49CF0 SOLO en algunas estrellas
  // sueltas de la galaxia del hero (tono tomado de la referencia 07).
  // Nunca en títulos ni en el resto de la web.
  var VIOLETA = [180, 156, 240];
  var C_VIOLETA = 4; // índice en spritesPunto

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
    function lleno(px, py) {
      var ix = Math.round(px), iy = Math.round(py);
      if (ix < 0 || iy < 0 || ix >= ancho || iy >= alto) return false;
      return datos[(iy * ancho + ix) * 4 + 3] > 128;
    }
    alto = Math.round(alto);
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, ancho, alto);
    var datos = x.getImageData(0, 0, ancho, alto).data;

    var area = 0;
    for (var p = 3; p < datos.length; p += 4) if (datos[p] > 128) area++;
    var paso = Math.max(2.5, Math.sqrt(area / presupuesto));
    var puntos, borde;
    do {
      puntos = []; borde = [];
      for (var gy = paso / 2; gy < alto; gy += paso) {
        for (var gx = paso / 2; gx < ancho; gx += paso) {
          var px = gx + (Math.random() - 0.5) * paso;
          var py = gy + (Math.random() - 0.5) * paso;
          if (lleno(px, py)) {
            puntos.push(cx - ancho / 2 + px, cy - alto / 2 + py);
            // Contorno: algún vecino cercano cae fuera de la S
            var r = paso * 1.3;
            borde.push(!lleno(px + r, py) || !lleno(px - r, py) || !lleno(px, py + r) || !lleno(px, py - r) ? 1 : 0);
          }
        }
      }
      paso *= 1.06;
    } while (puntos.length / 2 > presupuesto);
    return { puntos: puntos, borde: borde, cx: cx, cy: cy, alto: alto };
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
    var heroEl = document.querySelector('.hero');
    var textoHero = document.querySelector('.hero-texto');
    if (titulos.some(function (t) { return !t; }) || !visual || !heroEl || !textoHero) return;

    var esMobile = anchoPantalla() < 768;
    var N = esMobile ? 900 : 2500;
    if (!esMobile && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) N = 1800;
    var N_ESTRELLAS = esMobile ? 90 : 220;
    var GIRO_GALAXIA = 0.05; // velocidad de giro de la galaxia (radianes por segundo)
    // Brazos en espiral logarítmica (como las galaxias reales): cerrados
    // cerca del núcleo y cada vez más abiertos hacia afuera
    function anguloBrazo(r) { return Math.log(Math.max(r, 0.04) / 0.06) * 2.45; }
    // Estrellas de campo: solo del hero, llenan la sección hasta los bordes.
    // No viajan a la S ni a los títulos (se quedan en el hero).
    var M_CANDIDATAS = esMobile ? 700 : 1700;
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
    var inicioS = new Float32Array(N); // cuándo arranca cada una hacia la S (0 a 0.6)
    var caidaY = new Float32Array(N), derivaX = new Float32Array(N); // caída de los bytes
    var rango = new Uint32Array(N); // orden al azar: define quién va a cada lugar

    for (var i = 0; i < N; i++) {
      var r = Math.random();
      color[i] = r < 0.3 ? 0 : r < 0.65 ? 1 : r < 0.9 ? 2 : 3;
      tam[i] = 0.8 + Math.random() * 1.2 + (color[i] === 3 ? 0.5 : 0);
      fase[i] = Math.random() * Math.PI * 2;
      digito[i] = Math.random() < 0.5 ? 0 : 1;
      demora[i] = Math.random() * 0.25;
      caidaY[i] = 0.22 + Math.random() * 0.33;
      derivaX[i] = (Math.random() - 0.5) * 40;
      vueltas[i] = Math.random() < 0.55 ? 1 : 0;
      apertura[i] = 0.5 + Math.random() * 0.8;

      // Galaxia (referencia 07): núcleo denso, dos brazos principales bien
      // enroscados, pedazos de brazos secundarios y polvo suelto. Los brazos
      // son angostos para que entre ellos queden franjas oscuras.
      var radio, angulo, tipo = Math.random();
      if (tipo < 0.28) {
        radio = Math.pow(Math.random(), 2.4) * 0.27;
        angulo = Math.random() * Math.PI * 2;
        // Núcleo blanco y celeste claro (el brillo azul va por detrás)
        if (color[i] < 2 && Math.random() < 0.7) color[i] = Math.random() < 0.5 ? 2 : 3;
      } else if (tipo < 0.8) {
        radio = 0.07 + Math.pow(Math.random(), 1.05) * 0.93;
        angulo = (Math.random() < 0.5 ? 0 : Math.PI) + anguloBrazo(radio) + gauss() * (0.3 + radio * 0.3);
        radio *= 1 + gauss() * 0.09;
      } else if (tipo < 0.9) {
        radio = 0.3 + Math.random() * 0.6;
        angulo = (Math.random() < 0.5 ? 0.5 : 1.5) * Math.PI + anguloBrazo(radio) + gauss() * 0.35;
      } else {
        radio = Math.pow(Math.random(), 0.7) * 1.12;
        angulo = Math.random() * Math.PI * 2;
      }
      galR[i] = radio;
      galA[i] = angulo;
      // Ondulación propia, chica y acotada (los brazos no se deforman con el
      // tiempo): más amplia cerca del centro, que se ve girar apenas más rápido
      galW[i] = 0.05 + 0.07 * (1 - Math.min(radio, 1));
      galAlfa[i] = (0.5 + Math.random() * 0.5) * (1 - 0.35 * Math.min(radio, 1));

      estX[i] = Math.random();
      estY[i] = Math.random();
      rango[i] = i;
    }
    // Estrellas de campo: datos al azar fijos; dónde caen se calcula con el
    // tamaño del hero (así no cambian de lugar si se recalcula la página)
    var M = M_CANDIDATAS;
    var campoU = new Float32Array(M), campoV = new Float32Array(M), campoSorteo = new Float32Array(M);
    var campoColor = new Uint8Array(M), campoTam = new Float32Array(M), campoFase = new Float32Array(M);
    var campoX = new Float32Array(M), campoY = new Float32Array(M), campoA = new Float32Array(M);
    var campoVisible = new Uint8Array(M);
    for (i = 0; i < M; i++) {
      campoU[i] = Math.random(); campoV[i] = Math.random(); campoSorteo[i] = Math.random();
      var rc = Math.random();
      campoColor[i] = rc < 0.03 ? C_VIOLETA : rc < 0.22 ? 0 : rc < 0.52 ? 1 : rc < 0.82 ? 2 : 3;
      campoTam[i] = 0.45 + Math.pow(Math.random(), 2) * 0.9 + (campoColor[i] === C_VIOLETA ? 0.35 : 0);
      campoFase[i] = Math.random() * Math.PI * 2;
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

    var spritesPunto = PALETA.concat([VIOLETA]).map(crearSpritePunto);
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
    galaxia.heroico = estadoS.heroico = true; // anclados al hero (pin y parallax)
    var estadosTitulo = titulos.map(function (h2) { var e = nuevoEstado('titulo'); e.h2 = h2; return e; });
    var estadosCaida = titulos.slice(0, -1).map(function () { return nuevoEstado('caido'); });
    var estados = [galaxia, estadoS].concat(estadosTitulo, estadosCaida);

    var hero = { cx: 0, cy: 0, R: 0, alto: 0 };
    var usaGsap = !!(window.gsap && window.ScrollTrigger);
    var P = 0; // largo del pin del hero, en píxeles de scroll
    function largoPin() { return Math.round(altoPantalla() * 0.6); }
    var nebulosa = null;

    /* Nebulosa: el brillo difuso de los brazos (la "nube" de la referencia).
       Se dibuja una sola vez en un canvas aparte con muchas manchas suaves
       muy transparentes, y en cada cuadro se pega girada junto con las
       estrellas. Solo azul eléctrico y celeste (y blanco en el núcleo). */
    function crearNebulosa(R) {
      var lado = Math.min(640, Math.ceil(R * 2.5));
      var c = document.createElement('canvas');
      c.width = c.height = lado;
      var x = c.getContext('2d');
      var esc = lado / 2.5; // 1 unidad de radio de la galaxia en píxeles del canvas
      var m = lado / 2;
      var manchas = [crearSpritePunto(PALETA[0]), crearSpritePunto(PALETA[1]), crearSpritePunto(PALETA[2])];
      for (var k = 0; k < 3400; k++) {
        var secundario = Math.random() < 0.22;
        var r = secundario ? 0.3 + Math.random() * 0.6 : 0.05 + Math.pow(Math.random(), 1.1) * 1.0;
        var base = secundario ? (Math.random() < 0.5 ? 0.5 : 1.5) * Math.PI : (Math.random() < 0.5 ? 0 : Math.PI);
        var a = base + anguloBrazo(r) + gauss() * (secundario ? 0.4 : 0.3 + r * 0.32);
        var px = m + Math.cos(a) * r * esc, py = m + Math.sin(a) * r * esc;
        var d = (0.12 + Math.random() * 0.16) * esc;
        x.globalAlpha = (secundario ? 0.02 : 0.034) * (1 - 0.62 * r);
        x.drawImage(manchas[r < 0.35 ? (Math.random() < 0.5 ? 2 : 1) : (Math.random() < 0.6 ? 0 : 1)], px - d / 2, py - d / 2, d, d);
      }
      // Núcleo: blanco y celeste claro
      var g = x.createRadialGradient(m, m, 0, m, m, esc * 0.3);
      g.addColorStop(0, rgba(PALETA[3], 0.75));
      g.addColorStop(0.12, rgba(PALETA[3], 0.45));
      g.addColorStop(0.35, rgba(PALETA[2], 0.2));
      g.addColorStop(1, rgba(PALETA[1], 0));
      x.globalAlpha = 1;
      x.fillStyle = g;
      x.fillRect(0, 0, lado, lado);
      return { lienzo: c, radio: 1.25 };
    }

    function dibujarNebulosa(cx, cy, tiempo, alfa) {
      if (!nebulosa || alfa < 0.01) return;
      var lado = nebulosa.radio * 2 * hero.R;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.9);
      ctx.rotate(GIRO_GALAXIA * tiempo);
      ctx.globalAlpha = alfa;
      ctx.drawImage(nebulosa.lienzo, -lado / 2, -lado / 2, lado, lado);
      ctx.restore();
    }
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

      // Hero: centro y tamaño de la galaxia. El hero es lo primero de la
      // página, así que sus medidas se toman relativas a su borde de arriba
      // (sirve igual si está fijado por el pin o no).
      var rh = heroEl.getBoundingClientRect();
      var rv = visual.getBoundingClientRect();
      hero.alto = rh.height;
      hero.cx = rv.left + rv.width / 2;
      hero.cy = rv.top - rh.top + rv.height / 2;
      hero.R = W >= 1024 ? Math.min(H * 0.42, 380) : Math.min(rv.width, rv.height) * 0.62;

      // Estrellas de campo: toda la sección, más juntas cerca de la galaxia y
      // más chicas y tenues detrás del texto
      var rt = textoHero.getBoundingClientRect();
      var tx0 = rt.left - 8, tx1 = rt.right + 8, ty0 = rt.top - rh.top - 8, ty1 = rt.bottom - rh.top + 8;
      var densidad = Math.min(1, (W * hero.alto) / (esMobile ? 390 * 844 : 1440 * 900));
      for (i = 0; i < M; i++) {
        var fx = campoU[i] * W, fy = campoV[i] * hero.alto;
        var d = Math.hypot(fx - hero.cx, (fy - hero.cy) / 0.9) / hero.R;
        var prob = (0.22 + 0.78 * Math.exp(-d * d / 2.2)) * (0.45 + 0.55 * densidad);
        campoVisible[i] = campoSorteo[i] < prob ? 1 : 0;
        campoX[i] = fx; campoY[i] = fy;
        var detrasTexto = fx > tx0 && fx < tx1 && fy > ty0 && fy < ty1;
        campoA[i] = (0.45 + 0.5 * (campoTam[i] - 0.45) / 1.25) * (detrasTexto ? 0.4 : 1);
      }
      nebulosa = crearNebulosa(hero.R);

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
      // Quién va a cada punto de la S: las estrellas más cercanas al centro
      // de la galaxia llegan primero y dibujan el contorno; las de más afuera
      // llegan después y la rellenan; las del borde quedan como halo.
      var ordenS = [], porRadio = [];
      for (i = 0; i < nS; i++) ordenS.push(i);
      for (i = nS - 1; i > 0; i--) { var jj = Math.floor(Math.random() * (i + 1)); var tt = ordenS[i]; ordenS[i] = ordenS[jj]; ordenS[jj] = tt; }
      ordenS.sort(function (p, q) { return formaS.borde[q] - formaS.borde[p]; }); // contorno primero
      for (i = 0; i < N; i++) porRadio.push(i);
      porRadio.sort(function (p, q) { return galR[p] - galR[q]; });
      var destinoS = new Int32Array(N);
      for (var j = 0; j < N; j++) {
        destinoS[porRadio[j]] = j < nS ? ordenS[j] : -1;
        inicioS[porRadio[j]] = 0.6 * j / N;
      }
      for (i = 0; i < N; i++) {
        var k = destinoS[i];
        estadoS.K[i] = K_HERO; estadoS.G[i] = 0; estadoS.T[i] = 0;
        if (k >= 0) {
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
      var arriba = titulos.map(function (h2) { return h2.getBoundingClientRect().top + sy; });
      var asoma = titulos.map(function (h2) { // la sección asoma por abajo de la pantalla
        var sec = h2.closest('section') || h2;
        return sec.getBoundingClientRect().top + sy - H;
      });
      // Cuándo queda completo cada título: con el h2 a esta altura de la
      // pantalla (mobile bastante antes, desktop un poco antes)
      var alturaFin = esMobile ? 0.6 : (enColumna ? 0.5 : 0.4);
      function finDe(k, desde) { return Math.max(arriba[k] - alturaFin * H, desde + H * 0.25); }

      tramos = [];
      // Hero fijo (pin) durante P píxeles de scroll: la galaxia se convierte
      // en la S y la S queda quieta un instante antes de que la página siga
      P = usaGsap ? largoPin() : 0;
      var a0 = H * 0.02;
      var a1 = a0 + Math.max(P - a0, H * 0.3) * 0.78;
      tramos.push({ a: 0, b: 0, s0: -Infinity, s1: a0 });
      tramos.push({ a: 0, b: 1, s0: a0, s1: a1, tipo: 'galaxiaS' });
      // Al soltarse el hero, la S se desarma en bytes que forman el primer título
      var b0 = Math.max(a1 + H * 0.1, P, asoma[0]);
      tramos.push({ a: 1, b: 1, s0: a1, s1: b0 });
      var finPrevio = finDe(0, b0);
      tramos.push({ a: 1, b: 2, s0: b0, s1: finPrevio });

      // Entre títulos, dos momentos:
      // 1. Se va: cuando el título se acerca al menú (nunca queda debajo),
      //    el h2 real se apaga y sus bytes se sueltan, caen y se pierden.
      // 2. Llega: cuando la sección siguiente asoma por abajo, los bytes
      //    reaparecen donde se perdieron y viajan en espiral al título nuevo.
      // Si la sección es corta (la siguiente asoma mientras el título todavía
      // se ve), la caída es más corta y el título nuevo arranca apenas termina.
      var largoCaida = H * 0.22;
      for (var k = 0; k < titulos.length - 1; k++) {
        var idx = 2 + k, idxCaida = 2 + titulos.length + k;
        var cae0 = Math.max(arriba[k] - menu - H * 0.1, finPrevio + H * 0.04); // antes de llegar al menú
        var largo = cae0 + largoCaida > asoma[k + 1] ? H * 0.15 : largoCaida;
        var cae1 = cae0 + largo;
        var llega = Math.max(asoma[k + 1], cae1);
        var fin = finDe(k + 1, llega);
        tramos.push({ a: idx, b: idx, s0: finPrevio, s1: cae0 });
        tramos.push({ a: idx, b: idxCaida, s0: cae0, s1: cae1, tipo: 'cae' });
        tramos.push({ a: idxCaida, b: idxCaida, s0: cae1, s1: llega });
        tramos.push({ a: idxCaida, b: idx + 1, s0: llega, s1: fin });
        armarCaida(estadosTitulo[k], estadosCaida[k], cae0, cae1);
        finPrevio = fin;
      }
      tramos.push({ a: 1 + titulos.length, b: 1 + titulos.length, s0: finPrevio, s1: Infinity });

      minimoPantalla = minimo;
      listo = true;
    }
    var minimoPantalla = 0;

    /* Dónde termina cada byte al caer (coordenadas de pantalla). Cada uno
       se suelta en su momento, cae y se apaga. Desde ahí arranca después
       hacia el título siguiente. */
    function armarCaida(src, e, cae0, cae1) {
      e.cx = src.cx; e.cy = src.cy - cae0 + H * 0.35; e.ck = 0;
      e.tamDigito = src.tamDigito;
      var sueltaEn = e.suelta || (e.suelta = new Float32Array(N)); // scroll en que cada byte se suelta
      for (var i = 0; i < N; i++) {
        e.G[i] = src.G[i]; e.Z[i] = src.Z[i];
        if (src.K[i] === 0) { // estrellas de fondo: siguen iguales
          e.X[i] = src.X[i]; e.Y[i] = src.Y[i]; e.K[i] = 0; e.T[i] = 0; e.A[i] = src.A[i];
          continue;
        }
        sueltaEn[i] = cae0 + (cae1 - cae0) * demora[i] * 0.8;
        e.X[i] = src.X[i] + derivaX[i];
        e.Y[i] = src.Y[i] - sueltaEn[i] + caidaY[i] * H;
        e.K[i] = 0; e.T[i] = 1; e.A[i] = 0; // perdidos: no se ven
      }
    }

    /* Cuánto subió en pantalla algo anclado al hero: nada mientras el hero
       está fijo por el pin; después, lo que se scrolleó de más */
    function despHero(s) { return s > P ? s - P : 0; }
    function desp(e, s) { return e.heroico ? despHero(s) : s; }

    /* --- Scroll con scrub (ScrollTrigger) --- */
    var proxy = { p: 0 };
    if (usaGsap) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
      // Pin del hero: la página no avanza mientras se forma la S (el scroll
      // nunca se bloquea: el hero queda fijo y el resto espera debajo)
      ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: function () { return '+=' + largoPin(); },
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      });
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
      var giro = GIRO_GALAXIA * tiempo;
      for (var i = 0; i < N; i++) {
        // Giro de toda la galaxia junta (los brazos mantienen la forma) más
        // una ondulación chica propia de cada estrella
        var a = galA[i] + giro + 0.6 * galW[i] * Math.sin(tiempo * 0.25 + fase[i]);
        var rr = galR[i] * (1 + 0.025 * Math.sin(tiempo * 0.4 + fase[i] * 1.7));
        var x = hero.cx + Math.cos(a) * rr * R;
        var y = hero.cy + Math.sin(a) * rr * R * 0.9;
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

    /* Borde de abajo del hero en pantalla: las fugaces nunca pasan por la
       zona de la galaxia del hero (en el resto de la web siguen igual) */
    function pisoHero() { return hero.alto - despHero(window.scrollY); }

    function crearFugaz(libre) {
      var abajo = 0.3 + Math.random() * 0.35;
      var dir = Math.random() < 0.5 ? 1 : -1;
      var vel = (0.8 + Math.random() * 0.5) * Math.max(W, H) * 0.95;
      fugaz = {
        x: W * (0.15 + Math.random() * 0.7),
        y: libre + (H - libre) * (0.06 + Math.random() * 0.4),
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
      var piso = pisoHero();
      if (f.y < piso) { fugaz = null; return; } // si el hero baja y la alcanza, se apaga
      var alfa = Math.sin(Math.PI * f.edad / f.vida);
      var v = Math.hypot(f.vx, f.vy);
      var colaX = f.x - f.vx / v * f.largo, colaY = f.y - f.vy / v * f.largo;
      var g = ctx.createLinearGradient(f.x, f.y, colaX, colaY);
      g.addColorStop(0, rgba(f.color, 0.9 * alfa));
      g.addColorStop(1, rgba(f.color, 0));
      ctx.save();
      if (piso > 0) { ctx.beginPath(); ctx.rect(0, piso, W, H - piso); ctx.clip(); }
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
      ctx.restore();
    }

    /* --- Supernova: luz blanca que aparta las estrellas de la galaxia ---
       Solo mientras la galaxia está suelta (antes de que empiece la S) y solo
       cerca o sobre la zona densa (núcleo y brazos). En compu sigue al mouse;
       en celu aparece debajo del dedo apoyado. Los eventos son pasivos: nunca
       frenan el scroll. Fuera de esa zona siguen las luces al tocar. */
    var ofX = new Float32Array(N), ofY = new Float32Array(N), ovX = new Float32Array(N), ovY = new Float32Array(N);
    var cofX = new Float32Array(M), cofY = new Float32Array(M), covX = new Float32Array(M), covY = new Float32Array(M);
    var luz = { x: -999, y: -999, mouse: false, dedo: false, fuerza: 0 };
    var hayOnda = false;      // quedan estrellas fuera de su lugar
    var galaxiaSuelta = true; // se actualiza en cada cuadro
    var RADIO_ONDA = esMobile ? 85 : 115;

    function enZonaGalaxia(x, y) {
      var dx = (x - hero.cx) / hero.R;
      var dy = (y - (hero.cy - despHero(window.scrollY) * K_HERO)) / (hero.R * 0.9);
      return dx * dx + dy * dy < 1.1;
    }
    function supernovaEn(x, y) { return galaxiaSuelta && enZonaGalaxia(x, y); }

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') { luz.mouse = true; luz.x = e.clientX; luz.y = e.clientY; }
      else if (luz.dedo && e.isPrimary) { luz.x = e.clientX; luz.y = e.clientY; }
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' && e.isPrimary) { luz.dedo = true; luz.x = e.clientX; luz.y = e.clientY; }
    }, { passive: true });
    function soltarDedo(e) { if (e.pointerType !== 'mouse') luz.dedo = false; }
    window.addEventListener('pointerup', soltarDedo, { passive: true });
    window.addEventListener('pointercancel', soltarDedo, { passive: true }); // el navegador empezó a scrollear
    document.addEventListener('mouseleave', function () { luz.mouse = false; });

    /* Resorte: cada estrella cerca de la luz se corre hacia afuera (como una
       onda de energía) y, cuando la luz se aleja, vuelve sola a su lugar */
    function moverOnda(dt, bx, by, oX, oY, vX, vY, i, maximo) {
      var tx = 0, ty = 0;
      if (luz.fuerza > 0.001) {
        var dx = bx - luz.x, dy = by - luz.y;
        var d = Math.hypot(dx, dy);
        if (d < RADIO_ONDA && d > 0.01) {
          var k = 1 - d / RADIO_ONDA;
          var empuje = RADIO_ONDA * 0.55 * k * k * luz.fuerza;
          tx = dx / d * empuje; ty = dy / d * empuje;
        }
      }
      vX[i] += ((tx - oX[i]) * 90 - vX[i] * 12) * dt;
      vY[i] += ((ty - oY[i]) * 90 - vY[i] * 12) * dt;
      oX[i] += vX[i] * dt; oY[i] += vY[i] * dt;
      var m = Math.abs(oX[i]) + Math.abs(oY[i]) + Math.abs(vX[i]) * 0.05 + Math.abs(vY[i]) * 0.05;
      return m > maximo ? m : maximo;
    }

    function actualizarOnda(dt, dH, scroll) {
      var objetivo = galaxiaSuelta && (luz.mouse || luz.dedo) && enZonaGalaxia(luz.x, luz.y) ? 1 : 0;
      luz.fuerza += (objetivo - luz.fuerza) * Math.min(1, dt * 8);
      if (luz.fuerza < 0.001 && !hayOnda) return;
      var maximo = 0, i;
      for (i = 0; i < N; i++) maximo = moverOnda(dt, galaxia.X[i], galaxia.Y[i] - dH, ofX, ofY, ovX, ovY, i, maximo);
      var dh = despHero(scroll);
      for (i = 0; i < M; i++) {
        if (campoVisible[i]) maximo = moverOnda(dt, campoX[i], campoY[i] - dh, cofX, cofY, covX, covY, i, maximo);
      }
      hayOnda = maximo > 0.05;
      if (!hayOnda) { ofX.fill(0); ofY.fill(0); ovX.fill(0); ovY.fill(0); cofX.fill(0); cofY.fill(0); covX.fill(0); covY.fill(0); }
    }

    function dibujarLuz() {
      if (luz.fuerza < 0.01) return;
      var r = esMobile ? 34 : 42;
      var g = ctx.createRadialGradient(luz.x, luz.y, 0, luz.x, luz.y, r);
      g.addColorStop(0, rgba(PALETA[3], 0.95));
      g.addColorStop(0.08, rgba(PALETA[3], 0.85));
      g.addColorStop(0.25, rgba(PALETA[3], 0.28));
      g.addColorStop(0.6, rgba(PALETA[2], 0.08));
      g.addColorStop(1, rgba(PALETA[2], 0));
      ctx.globalAlpha = luz.fuerza;
      ctx.fillStyle = g;
      ctx.fillRect(luz.x - r, luz.y - r, r * 2, r * 2);
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
      // Sobre la galaxia suelta va la supernova: nunca los dos efectos juntos
      if (!lejos && !largo && !supernovaEn(e.clientX, e.clientY)) crearChispas(e.clientX, e.clientY);
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
    var tramoPrevio = null, pulsoInicio = -10;
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

    /* Estrellas de campo: se mueven con el hero (están en la sección) y no se
       dibujan fuera de ella */
    function dibujarCampo(scroll, tiempo, peso) {
      var dh = despHero(scroll); // cuánto subió el hero en pantalla
      var techo = -dh, piso = hero.alto - dh;
      if (piso < 0 || peso < 0.01) return;
      for (var i = 0; i < M; i++) {
        if (!campoVisible[i]) continue;
        var y = campoY[i] - dh;
        if (y < techo || y > piso || y < -10 || y > H + 10) continue;
        var al = campoA[i] * peso * (0.65 + 0.35 * Math.sin(tiempo * 0.8 + campoFase[i]));
        if (al < 0.01) continue;
        var d = campoTam[i] * 4;
        ctx.globalAlpha = al;
        ctx.drawImage(spritesPunto[campoColor[i]], campoX[i] + cofX[i] - d / 2, y + cofY[i] - d / 2, d, d);
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
      var dH = despHero(scroll) * K_HERO; // cuánto subieron la galaxia y la S

      // Pulso de brillo suave cuando la S termina de formarse (bajando)
      if (tramo.a === 1 && tramo.b === 1 && tramoPrevio && tramoPrevio.tipo === 'galaxiaS') pulsoInicio = tiempo;
      tramoPrevio = tramo;
      var pulso = tiempo - pulsoInicio < 0.9 ? Math.sin(Math.PI * (tiempo - pulsoInicio) / 0.9) : 0;
      galaxiaSuelta = tramo.a === 0 && tramo.b === 0 && scroll < tramo.s1 + 4;

      if (A.heroico || B.heroico) actualizarGalaxia(tiempo);
      opacidadesTitulos(tramo, t);
      actualizarOnda(dt, dH, scroll);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Estrellas de campo del hero (más tenues cuando ya está la S)
      var pesoGalaxia = 0;
      if (tramo.a === 0 && tramo.b === 0) pesoGalaxia = 1;
      else if (tramo.a === 0) pesoGalaxia = 1 - suave(0, 0.75, t);
      dibujarCampo(scroll, tiempo, (0.45 + 0.55 * pesoGalaxia) * aparicion);

      // Brillo del núcleo de la galaxia (azul eléctrico, por detrás)
      if (pesoGalaxia > 0.01) {
        var nx = hero.cx, ny = hero.cy - dH, nr = hero.R * 0.42;
        var gn = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        gn.addColorStop(0, rgba(PALETA[0], 0.32 * pesoGalaxia * aparicion));
        gn.addColorStop(0.35, rgba(PALETA[0], 0.14 * pesoGalaxia * aparicion));
        gn.addColorStop(1, rgba(PALETA[0], 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = gn;
        ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
        dibujarNebulosa(nx, ny, tiempo, pesoGalaxia * aparicion);
      }

      // Glow suave detrás de la S
      var pesoS = 0;
      if (tramo.a === 1 && tramo.b === 1) pesoS = 1;
      else if (tramo.b === 1) pesoS = suave(0.3, 1, t);
      else if (tramo.a === 1) pesoS = 1 - suave(0, 0.4, t);
      if (pesoS > 0.01) {
        var gx = estadoS.cx, gy = estadoS.cy - dH;
        var gr = estadoS.altoS * 0.75;
        var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, rgba(PALETA[0], Math.min(0.7, 0.3 * pesoS * (1 + 1.3 * pulso)) * aparicion));
        g.addColorStop(1, rgba(PALETA[0], 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }

      // Los 0 y 1 cambian de vez en cuando (se ven "vivos")
      if (A.tipo !== 'galaxia' && A.tipo !== 's' || B.tipo === 'titulo') {
        for (var f = 0; f < 4; f++) digito[(Math.random() * N) | 0] ^= 1;
      }

      var i;
      if (!enTransicion) {
        var dA = desp(A, scroll);
        var brillo = A === estadoS ? 1 + 0.4 * pulso : 1;
        var crece = A === estadoS ? 1 + 0.25 * pulso : 1;
        for (i = 0; i < N; i++) {
          var al = Math.min(1, alfaDe(A, i, tiempo) * brillo) * aparicion;
          if (al < 0.01) continue;
          var ox = A === galaxia ? ofX[i] : 0, oy = A === galaxia ? ofY[i] : 0;
          dibujarParticula(i, A.X[i] + ox, A.Y[i] - dA * A.K[i] + oy, al, A.G[i], A.Z[i] * crece, A.tamDigito);
        }
      } else if (tramo.tipo === 'cae') {
        var sueltaEn = B.suelta;
        // El título se desarma: cada byte se suelta (en orden al azar), cae
        // y se apaga. Las estrellas de fondo siguen en su lugar.
        for (i = 0; i < N; i++) {
          if (A.K[i] === 0) {
            var alF = alfaDe(A, i, tiempo) * aparicion;
            if (alF >= 0.01) dibujarParticula(i, A.X[i], A.Y[i], alF, A.G[i], A.Z[i], A.tamDigito);
            continue;
          }
          var xC = A.X[i], yC, alC = alfaDe(A, i, tiempo);
          if (scroll < sueltaEn[i]) yC = A.Y[i] - scroll;
          else {
            var uC = limitar((t - demora[i] * 0.8) / 0.8, 0, 1);
            yC = A.Y[i] - sueltaEn[i] + caidaY[i] * H * uC * uC;
            xC += derivaX[i] * uC;
            alC *= 1 - suave(0.2, 1, uC);
          }
          alC *= aparicion;
          if (alC < 0.01) continue;
          dibujarParticula(i, xC, yC, alC, A.G[i], A.Z[i], A.tamDigito);
        }
      } else if (tramo.tipo === 'galaxiaS') {
        // Galaxia a S: cada estrella se enrosca alrededor del centro en el
        // sentido de giro de los brazos mientras se acerca a su lugar. Salen
        // escalonadas: las del centro primero (dibujan el contorno), las de
        // los bordes al final (rellenan la S).
        var hx = hero.cx, hy = hero.cy - dH;
        for (i = 0; i < N; i++) {
          var uS = limitar((t - inicioS[i]) / 0.4, 0, 1);
          var gxp = galaxia.X[i] + ofX[i], gyp = galaxia.Y[i] - dH + ofY[i];
          if (uS <= 0) {
            var al0 = alfaDe(galaxia, i, tiempo) * aparicion;
            if (al0 >= 0.01) dibujarParticula(i, gxp, gyp, al0, 0, 1, 0);
            continue;
          }
          var sxp = estadoS.X[i], syp = estadoS.Y[i] - dH;
          var eR = entradaSalida(uS), eA = 1 - (1 - uS) * (1 - uS);
          var r0s = Math.hypot(gxp - hx, gyp - hy), r1s = Math.hypot(sxp - hx, syp - hy);
          var a0s = Math.atan2(gyp - hy, gxp - hx), a1s = Math.atan2(syp - hy, sxp - hx);
          var giroS = ((a1s - a0s) % 6.2832 + 6.2832) % 6.2832 + (galR[i] > 0.55 ? 6.2832 : 0);
          var rrS = mezclar(r0s, r1s, eR), aaS = a0s + giroS * eA;
          var alS = mezclar(alfaDe(galaxia, i, tiempo), alfaDe(estadoS, i, tiempo), eR);
          alS = Math.min(1, alS * (1 + 0.35 * Math.sin(Math.PI * uS))) * aparicion; // brillan un poco en viaje
          if (alS < 0.01) continue;
          dibujarParticula(i, hx + Math.cos(aaS) * rrS, hy + Math.sin(aaS) * rrS, alS, 0, mezclar(1, estadoS.Z[i], eR), 0);
        }
      } else {
        // Transición en espiral (coordenadas polares alrededor de un centro
        // que viaja de una forma a la otra)
        var dA0 = desp(A, tramo.s0), dB1 = desp(B, tramo.s1);
        var dAs = desp(A, scroll) - dA0, dBs = desp(B, scroll) - dB1;
        var cfx = A.cx, cfy = A.cy - dA0 * A.ck;
        var cdx = B.cx, cty = B.cy - dB1 * B.ck;
        var abre = minimoPantalla * 0.17;
        var tamDigito = A.tamDigito && B.tamDigito ? null : (A.tamDigito || B.tamDigito);

        for (i = 0; i < N; i++) {
          // Todas llegan al 80% del tramo: el título de bytes queda completo
          // un momento antes de que aparezca el h2 real
          var u = limitar((t - demora[i]) / 0.55, 0, 1);
          var e = entradaSalida(u);

          var fx = A.X[i], fy = A.Y[i] - dA0 * A.K[i];
          var tx = B.X[i], ty = B.Y[i] - dB1 * B.K[i];

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
          py -= dBs * B.K[i] * e + dAs * A.K[i] * (1 - e);

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
        else {
          var libre = Math.max(0, pisoHero());
          // Si el hero ocupa casi toda la pantalla, se espera un poco
          if (H - libre < H * 0.35) proximaFugaz = tiempo + 1.5 + Math.random() * 2;
          else { crearFugaz(libre); programarFugaz(tiempo); }
        }
      }
      dibujarLuz();
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
