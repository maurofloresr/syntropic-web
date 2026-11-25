/* ==========================================================================
   Laboratorio: apretón de manos de /sistemas (no se publica)

   - Mano humana: imagen (preparada por preparar-imagenes.py) con un brillo
     #47ADFF en el borde, que se arma una sola vez en un canvas aparte.
   - Mano de código: partículas 0 y 1. Sus destinos salen de los píxeles
     celestes de la referencia (la técnica de la S: una partícula por celda de
     una grilla), filtrados por color y por zona.
   - Todo se calcula en "píxeles de la referencia" (1672 x 941) y se lleva a
     la pantalla con una escala y un corrimiento (la "escena").
   - El pin es position: sticky dentro de un marco con scroll propio, para
     poder simular el celular. En la web va con ScrollTrigger, como la S.
   - La secuencia depende solo del scroll (rebobina al subir); el río y el
     titileo corren con el reloj.
   - Números al azar con semilla fija, para poder comparar.
   ========================================================================== */
(function () {
  'use strict';

  const ANCHO = 1672, ALTO = 941;
  const NAVY = [11, 21, 36];                 // #0B1524
  const CELESTE = [71, 173, 255];            // #47ADFF
  const CELESTE_CLARO = [160, 211, 253];     // #A0D3FD
  const BLANCO = [255, 255, 255];            // #FFFFFF
  const COLORES = [CELESTE, CELESTE_CLARO, BLANCO]; // los de los títulos
  const CONTACTO = { x: 850, y: 430 };       // centro del apretón en la referencia
  const EJE_Y = 300;                         // altura del eje de la sacudida (hombro)
  const MUNECA = 1126;                       // desde acá a la derecha es estela

  /* --- Valores --- */
  const DESKTOP = {
    // Escena (dónde va todo el dibujo en la pantalla)
    escenaAncho: 72, escenaX: 70, escenaY: 51, fundidoDesde: 39, fundidoAncho: 14,
    // Alineación de la mano humana (en píxeles de la referencia)
    manoEscala: 0.87, manoX: 140, manoY: -53, manoGiro: 3, manoSombra: 0,
    // Mano de código
    particulas: 3000, tamano: 8.5, umbral: 30, estela: 70, fondoPulgar: 0.85, brilloBytes: 1,
    // Flujo inicial
    rioVelocidad: 130, rioDensidad: 45, rioAncho: 110, rioLargo: 600,
    // Tramos
    pin: 200, tEntrada: 30, tFormacion: 30, tContacto: 12, tSacudida: 20, tQuietud: 8,
    // Sacudida
    sacudidas: 3, amplitud: 16,
    // Brillo
    brilloBorde: 1, brilloAncho: 16, pulso: 1
  };
  const MOVIL = Object.assign({}, DESKTOP, {
    escenaAncho: 172, escenaX: 50, escenaY: 31, fundidoDesde: 0, fundidoAncho: 0,
    particulas: 1500, tamano: 6, rioVelocidad: 110, rioAncho: 100, rioLargo: 500,
    pin: 160, amplitud: 9, brilloAncho: 10
  });

  const copia = (o) => Object.assign({}, o);
  const porModo = { escritorio: copia(DESKTOP), celular: copia(MOVIL) };
  const general = { mano: 'abierta', velocidadScroll: 700 };
  let simulado = false;
  const angosto = window.matchMedia('(max-width: 760px)');
  const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducido = menosMovimiento.matches;
  const modo = () => (simulado || angosto.matches ? 'celular' : 'escritorio');
  const cfg = () => porModo[modo()];

  /* --- Utilidades --- */
  const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mezclar = (a, b, t) => a + (b - a) * t;
  function suave(a, b, v) { const t = limitar((v - a) / (b - a || 1), 0, 1); return t * t * (3 - 2 * t); }
  function entradaSalida(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  function semilla(s) { // mulberry32
    let a = s >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function nuevoLienzo(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }

  /* --- Elementos --- */
  const $ = (id) => document.getElementById(id);
  const rodar = $('rodar'), pista = $('pista'), hero = $('hero'), lienzo = $('lienzo');
  const ctx = lienzo.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const escena = { s: 1, x: 0, y: 0 };
  const img = {};

  /* ==========================================================================
     Preparación: se hace una vez por tamaño o por cambio de control
     ========================================================================== */

  /* Puntaje de color de cada píxel de la referencia: 0 si no es celeste */
  let puntaje = null, zona = null;
  function leerReferencia() {
    const c = nuevoLienzo(ANCHO, ALTO), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img.referencia, 0, 0, ANCHO, ALTO);
    const d = x.getImageData(0, 0, ANCHO, ALTO).data;
    x.clearRect(0, 0, ANCHO, ALTO);
    x.drawImage(img.zonas, 0, 0, ANCHO, ALTO);
    const z = x.getImageData(0, 0, ANCHO, ALTO).data;
    puntaje = new Uint8Array(ANCHO * ALTO);
    zona = new Uint8Array(ANCHO * ALTO); // 0 nada, 1 al frente, 2 cuerpo, 3 estela
    for (let i = 0, p = 0; i < puntaje.length; i++, p += 4) {
      const frente = z[p] > 127, cuerpo = z[p + 1] > 127, humana = z[p + 2] > 127;
      const col = i % ANCHO;
      zona[i] = frente ? 1 : humana ? 0 : col > MUNECA ? 3 : cuerpo ? 2 : 0;
      const r = d[p], g = d[p + 1], b = d[p + 2];
      // Celeste: el verde y el azul por encima del rojo. Los bordes casi
      // blancos también pasan; la piel y la tela, no.
      if (zona[i] && b >= r && g >= r) puntaje[i] = limitar((g + b) / 2 * (1 - 0.25 * r / Math.max(1, g)), 0, 255);
    }
  }

  /* Destinos: una partícula por celda de la grilla, en el píxel más celeste */
  function muestrear(presupuesto) {
    const c = cfg(), minimo = c.umbral / 100 * 255;
    const fin = MUNECA + (ANCHO - MUNECA) * c.estela / 100;
    const intento = (paso) => {
      const rnd = semilla(7), lista = [];
      for (let gy = 40; gy < ALTO - 40; gy += paso) {
        for (let gx = 500; gx < fin; gx += paso) {
          let mejor = 0, mi = -1;
          const x1 = Math.min(fin, gx + paso), y1 = Math.min(ALTO, gy + paso);
          for (let py = Math.ceil(gy); py < y1; py++) {
            let k = py * ANCHO + Math.ceil(gx);
            for (let px = Math.ceil(gx); px < x1; px++, k++) if (puntaje[k] > mejor) { mejor = puntaje[k]; mi = k; }
          }
          const azar = rnd(), azar2 = rnd();
          if (mi < 0 || mejor < minimo) continue;
          const x = mi % ANCHO, y = (mi / ANCHO) | 0;
          // La estela se va perdiendo hacia el final
          if (x > MUNECA && azar < suave(MUNECA + (fin - MUNECA) * 0.35, fin, x) * 0.8) continue;
          lista.push({ x: x + (azar2 - 0.5) * 2, y, luz: mejor / 255, zona: zona[mi] });
        }
      }
      return lista;
    };
    // Busca el paso de grilla que da la cantidad pedida sin pasarse
    let bajo = 4, alto = 60, lista = intento(alto);
    for (let k = 0; k < 9; k++) {
      const medio = (bajo + alto) / 2, l = intento(medio);
      if (l.length > presupuesto) bajo = medio; else { alto = medio; lista = l; }
    }
    return lista;
  }

  /* --- Partículas --- */
  let N = 0, nMano = 0, P = null;
  function generar() {
    if (!puntaje) return;
    N = Math.round(cfg().particulas);
    // El 8% no forma la mano: sigue corriendo por la estela como un río
    const destinos = muestrear(Math.floor(N * 0.92));
    nMano = destinos.length;
    const rnd = semilla(21);
    const F = () => new Float32Array(N);
    P = {
      dx: F(), dy: F(), da: F(), tam: F(), fase: F(), u: F(), carril: F(), vel: F(), azar: F(), orden: F(), arco: F(), estela: F(),
      capa: new Uint8Array(N), color: new Uint8Array(N), dig: new Uint8Array(N), forma: new Uint8Array(N)
    };
    for (let i = nMano - 1; i > 0; i--) { // mezcla: que no queden en orden de lectura
      const j = Math.floor(rnd() * (i + 1)), t = destinos[i];
      destinos[i] = destinos[j]; destinos[j] = t;
    }
    for (let i = 0; i < N; i++) {
      const d = destinos[i], r = rnd();
      P.fase[i] = rnd() * 6.283; P.u[i] = rnd(); P.azar[i] = rnd();
      P.carril[i] = (rnd() + rnd() + rnd() - 1.5) / 1.5;
      P.vel[i] = 0.7 + rnd() * 0.6;
      P.dig[i] = rnd() < 0.5 ? 0 : 1;
      P.tam[i] = 0.85 + rnd() * 0.3;
      if (d) {
        P.forma[i] = 1;
        P.dx[i] = d.x; P.dy[i] = d.y; P.capa[i] = d.zona === 1 ? 1 : 0;
        P.da[i] = 0.3 + 0.7 * Math.pow(d.luz, 1.2);
        P.color[i] = d.luz > 0.82 ? (r < 0.65 ? 2 : 1) : d.luz > 0.6 ? (r < 0.25 ? 2 : r < 0.65 ? 1 : 0) : (r < 0.25 ? 1 : 0);
        // Primero llega la muñeca y al final se cierran el pulgar y los dedos
        P.orden[i] = limitar((1400 - d.x) / 870, 0, 1) * 0.8 + P.azar[i] * 0.2;
        P.arco[i] = (d.y < 420 ? -1 : 1) * (40 + 110 * P.azar[i]) * (d.zona === 1 ? 1.3 : 0.7);
        P.estela[i] = 1 - suave(MUNECA, ANCHO, d.x);
      } else {
        P.color[i] = r < 0.5 ? 0 : r < 0.8 ? 1 : 2;
      }
    }
    armarSprites();
  }

  /* Los seis dígitos (3 colores por 0 y 1) en una sola imagen: la placa de
     video los dibuja de una tanda */
  const atlas = { c: null, w: 1, h: 1 };
  function armarSprites() {
    // Cada dígito se dibuja al tamaño en que se usa: se ve nítido y pesa menos
    const px = Math.max(4, cfg().tamano * dpr);
    const w = Math.ceil(px * 0.72 + 3), h = Math.ceil(px + 3);
    const c = nuevoLienzo(w * 6, h), x = c.getContext('2d');
    x.font = '600 ' + px * 1.2 + 'px Inter, system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    COLORES.forEach((col, k) => {
      x.fillStyle = rgba(col, 1);
      x.fillText('0', w * (k * 2 + 0.5), h / 2 + px * 0.05);
      x.fillText('1', w * (k * 2 + 1.5), h / 2 + px * 0.05);
    });
    atlas.c = c; atlas.w = w; atlas.h = h;
  }

  /* --- Capas fijas: manos con brillo, fondo del pulgar y resplandor --- */
  const capas = { abierta: null, cerrada: null, vidrio: null, aura: null };

  /* Dibuja la imagen con brillo afuera y en el borde de adentro */
  function manoConBrillo(imagen, escala) {
    const c = cfg(), k = escala * escena.s * dpr;
    const w = Math.max(2, Math.round(ANCHO * k)), h = Math.max(2, Math.round(ALTO * k));
    const r = Math.max(0.5, c.brilloAncho * dpr), m = Math.ceil(r * 2.5);
    const base = nuevoLienzo(w + m * 2, h + m * 2), x = base.getContext('2d');
    const lejos = base.width + m * 4;
    // 1. Brillo de afuera: la sombra de la silueta, en celeste
    if (c.brilloBorde > 0) {
      x.shadowColor = rgba(CELESTE, Math.min(1, 0.75 * c.brilloBorde));
      x.shadowBlur = r * 1.6; x.shadowOffsetX = lejos;
      x.drawImage(imagen, m - lejos, m, w, h);
      x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetX = 0;
    }
    // 2. La mano (con la sombra navy, si se pidió) y el borde de adentro
    const mano = nuevoLienzo(base.width, base.height), y = mano.getContext('2d');
    y.drawImage(imagen, m, m, w, h);
    y.globalCompositeOperation = 'source-atop';
    if (c.manoSombra > 0) { y.fillStyle = rgba(NAVY, c.manoSombra); y.fillRect(0, 0, mano.width, mano.height); }
    if (c.brilloBorde > 0) {
      const hueco = nuevoLienzo(base.width, base.height), z = hueco.getContext('2d');
      // Arranca en m: el corte de la manga (a la izquierda) no lleva borde
      z.fillStyle = '#fff'; z.fillRect(m, 0, hueco.width, hueco.height);
      z.globalCompositeOperation = 'destination-out';
      z.drawImage(imagen, m, m, w, h);
      y.shadowColor = rgba(CELESTE, Math.min(1, 0.85 * c.brilloBorde));
      y.shadowBlur = r * 0.8; y.shadowOffsetX = lejos;
      y.drawImage(hueco, -lejos, 0);
    }
    x.drawImage(mano, 0, 0);
    const u = dpr * escena.s;
    return { c: base, m: m / u, w: base.width / u, h: base.height / u };
  }

  function armarCapas() {
    if (!puntaje || !W) return;
    capas.abierta = manoConBrillo(img.abierta, cfg().manoEscala);
    capas.cerrada = general.mano === 'cierra' ? manoConBrillo(img.cerrada, 1) : null;
    if (!capas.vidrio) armarMascaras(); // no dependen de ningún control
  }

  /* A media resolución: vidrio oscuro bajo el pulgar y los dedos, y un
     resplandor suave de toda la mano de código */
  function armarMascaras() {
    const w = ANCHO / 2, h = Math.round(ALTO / 2);
    const mascara = (todas) => {
      const t = nuevoLienzo(w, h), x = t.getContext('2d', { willReadFrequently: true });
      x.drawImage(img.zonas, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const a = todas ? Math.max(d.data[i], d.data[i + 1]) : d.data[i];
        d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = a;
      }
      x.putImageData(d, 0, 0);
      return t;
    };
    const frente = mascara(false), toda = mascara(true);

    const v = nuevoLienzo(w, h), vx = v.getContext('2d');
    vx.drawImage(frente, 0, 0);
    vx.globalCompositeOperation = 'source-in';
    vx.fillStyle = rgba(NAVY, 1); vx.fillRect(0, 0, w, h);
    // Borde celeste por dentro, para que el pulgar se lea como un volumen
    vx.globalCompositeOperation = 'source-atop';
    const hueco = nuevoLienzo(w, h), hx = hueco.getContext('2d');
    hx.fillStyle = '#fff'; hx.fillRect(0, 0, w, h);
    hx.globalCompositeOperation = 'destination-out'; hx.drawImage(frente, 0, 0);
    vx.shadowColor = rgba(CELESTE, 0.7); vx.shadowBlur = 9; vx.shadowOffsetX = w * 2;
    vx.drawImage(hueco, -w * 2, 0);
    capas.vidrio = v;

    const a = nuevoLienzo(w, h), ax = a.getContext('2d');
    ax.shadowColor = rgba(CELESTE, 0.55); ax.shadowBlur = 34; ax.shadowOffsetX = w * 2;
    ax.drawImage(toda, -w * 2, 0);
    ax.shadowColor = 'transparent'; ax.shadowBlur = 0; ax.shadowOffsetX = 0;
    ax.globalCompositeOperation = 'destination-out'; ax.globalAlpha = 0.55;
    ax.drawImage(toda, 0, 0); // adentro queda más oscuro: el brillo es del borde
    // A la altura del antebrazo se pierde, para no cortar la estela
    const g = ax.createLinearGradient(w * 0.6, 0, w * 0.73, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    ax.globalAlpha = 1; ax.fillStyle = g; ax.fillRect(w * 0.6, 0, w, h);
    capas.aura = a;
  }

  function ubicarEscena() {
    const c = cfg();
    escena.s = c.escenaAncho / 100 * W / ANCHO;
    // escenaX y escenaY dicen dónde cae el centro del apretón
    escena.x = c.escenaX / 100 * W - CONTACTO.x * escena.s;
    escena.y = c.escenaY / 100 * H - CONTACTO.y * escena.s;
  }

  const largoPin = () => cfg().pin / 100 * H;
  function medir() {
    const w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    const enPin = progreso > 0 && progreso < 1;
    W = w; H = h;
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    pista.style.height = (reducido ? H : H + largoPin()) + 'px';
    if (!reducido && enPin) rodar.scrollTop = progreso * largoPin();
    ubicarEscena();
    armarCapas();
    pedirDibujo();
  }

  /* ==========================================================================
     Secuencia
     ========================================================================== */
  let progreso = 0;  // scroll real, 0 a 1
  let t = 0;         // suavizado, como el scrub de la web
  let reproduccion = 0, alCambiar = null;

  function tramos() {
    const c = cfg();
    const partes = [c.tEntrada, c.tFormacion, c.tContacto, c.tSacudida, c.tQuietud];
    const total = partes.reduce((a, b) => a + b, 0) || 1;
    let suma = 0;
    return partes.map((p) => { suma += p / total; return suma; });
  }
  function estado(p) {
    const f = tramos();
    const parte = (a, b) => (b - a < 1e-6 ? (p >= b ? 1 : 0) : limitar((p - a) / (b - a), 0, 1));
    return {
      entrada: parte(0, f[0]), formacion: parte(f[0], f[1]), contacto: parte(f[1], f[2]), sacudida: parte(f[2], f[3]),
      // La mano humana llega a su lugar a la mitad de la formación
      mano: parte(0, mezclar(f[0], f[1], 0.5)),
      nombre: p <= 0 ? 'Inicio' : p < f[0] ? 'Entrada' : p < f[1] ? 'Formación' : p < f[2] ? 'Contacto' : p < f[3] ? 'Sacudida' : p < 1 ? 'Quietud' : 'Pin suelto'
    };
  }

  rodar.addEventListener('scroll', () => {
    if (reducido) return;
    progreso = largoPin() > 0 ? limitar(rodar.scrollTop / largoPin(), 0, 1) : 0;
    if (alCambiar) alCambiar(progreso);
  }, { passive: true });

  /* ==========================================================================
     Dibujo
     ========================================================================== */
  const inicio = performance.now();
  let anterior = inicio, cuadros = 0, marca = inicio, costo = 0, dibujadas = 0, pendiente = false;
  // Centro del río y de la estela: sube hacia la derecha, como en la referencia
  const centroRio = (x) => 440 - (x - MUNECA) * 0.17;

  function dibujarMano(capa, alfa, x, y, giro) {
    if (!capa || alfa < 0.005) return;
    ctx.save();
    ctx.translate(x, y);
    if (giro) ctx.rotate(giro * Math.PI / 180);
    ctx.globalAlpha = alfa;
    ctx.drawImage(capa.c, -capa.m, -capa.m, capa.w, capa.h);
    ctx.restore();
  }

  function dibujar(tiempo, dt, p) {
    const c = cfg(), e = estado(p), s = escena.s;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    dibujadas = 0;
    if (!P || !capas.abierta) return e;

    const xIni = Math.max(1500, (W - escena.x) / s + 50); // el río nace fuera de la pantalla
    const pulso = Math.sin(Math.PI * e.contacto) * c.pulso;
    const formado = suave(0.55, 1, e.formacion);

    // Sacudida: giro chico con eje en el hombro (a la izquierda). El ángulo
    // sale de cuántos píxeles se quiere mover el punto de contacto
    const envolvente = suave(0, 0.12, e.sacudida) * (1 - suave(0.8, 1, e.sacudida));
    const ang = Math.sin(e.sacudida * Math.PI * 2 * Math.round(c.sacudidas)) * envolvente * c.amplitud / s / CONTACTO.x;

    const plano = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const enEscena = (giro) => {
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * escena.x, dpr * escena.y);
      if (giro) { ctx.translate(0, EJE_Y); ctx.rotate(giro); ctx.translate(0, -EJE_Y); }
    };
    const resplandor = (r, fuerza, techo, medio) => {
      const cx = escena.x + CONTACTO.x * s, cy = escena.y + CONTACTO.y * s;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(CELESTE, Math.min(techo, fuerza)));
      g.addColorStop(0.4, rgba(CELESTE, Math.min(techo, fuerza) * medio));
      g.addColorStop(1, rgba(CELESTE, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    };

    // Hasta dónde llega el río: al scrollear avanza hasta el punto de encuentro
    const frente0 = xIni - c.rioLargo;
    const frenteRio = mezclar(frente0, Math.min(frente0, 900), entradaSalida(e.entrada));
    const avanceRio = c.rioVelocidad / Math.max(200, xIni - frenteRio) * dt;
    const visible = c.rioDensidad / 100;
    const ESC = 0.55, f = e.formacion;

    function particula(i) {
      const forma = P.forma[i];
      const uF = forma ? limitar((f - ESC * P.orden[i]) / (1 - ESC), 0, 1) : 0;
      let x, y, al, enMano = 0;
      if (uF < 1) {
        // Río: avanza siempre; al llegar al frente vuelve a empezar (o espera
        // ahí, apagada, si ya está viajando a la mano)
        let u = P.u[i] + avanceRio * P.vel[i];
        if (u >= 1) u = uF > 0 ? 1 : u % 1;
        P.u[i] = u;
        // La estela viva no entra en la mano ya formada
        const hasta = forma ? frenteRio : mezclar(frenteRio, 1150, formado);
        const rx = xIni - u * (xIni - hasta);
        const abre = 0.75 + 0.35 * suave(MUNECA, xIni, rx);
        const ry = centroRio(rx) + P.carril[i] * c.rioAncho * abre + Math.sin(rx * 0.006 + tiempo * 0.9 + P.fase[i] * 0.4) * 22;
        const ra = (!forma || P.azar[i] < visible ? 1 : 0) * suave(0, 0.12, u) * (1 - suave(0.72, 1, u)) * (0.45 + 0.4 * P.azar[i] * (forma ? 1 / Math.max(visible, 0.01) : 1));
        if (uF <= 0) { x = rx; y = ry; al = ra; } else {
          enMano = entradaSalida(uF);
          x = mezclar(rx, P.dx[i], enMano);
          y = mezclar(ry, P.dy[i], enMano) + P.arco[i] * Math.sin(Math.PI * uF);
          al = mezclar(Math.min(1, ra), P.da[i] * c.brilloBytes, suave(0, 0.75, uF));
        }
      } else { x = P.dx[i]; y = P.dy[i]; al = P.da[i] * c.brilloBytes; enMano = 1; }
      if (al < 0.02) return;
      al *= (0.86 + 0.14 * Math.sin(tiempo * 2.1 + P.fase[i])) * (1 + 0.6 * pulso * enMano);
      if (ang && enMano) {
        const g = ang * P.estela[i] * enMano, ox = x, oy = y - EJE_Y;
        x = ox - oy * g; y = EJE_Y + oy + ox * g;
      }
      const px = escena.x + x * s, py = escena.y + y * s;
      if (px < -10 || px > W + 10 || py < -10 || py > H + 10) return;
      // Cada tanto un byte cambia de 0 a 1
      const sx = atlas.w * (P.color[i] * 2 + (P.dig[i] ^ (((tiempo * 0.35 + P.fase[i]) | 0) & 1)));
      const tam = c.tamano * P.tam[i] * (1 + 0.15 * pulso * enMano), an = tam * atlas.w / atlas.h;
      ctx.globalAlpha = al > 1 ? 1 : al;
      ctx.drawImage(atlas.c, sx, 0, atlas.w, atlas.h, px - an / 2, py - tam / 2, an, tam);
      dibujadas++;
    }

    // 1. Resplandor de la mano de código y pulso (por detrás)
    if (formado > 0.01) {
      enEscena(ang);
      ctx.globalAlpha = Math.min(1, 0.75 * formado * (1 + 0.8 * pulso));
      ctx.drawImage(capas.aura, 0, 0, ANCHO, ALTO);
    }
    plano();
    if (pulso > 0.01) resplandor((260 + 300 * e.contacto) * s, 0.75 * pulso, 0.95, 0.4);

    // 2. Bytes de atrás (río, cuerpo de la mano y estela)
    for (let i = 0; i < N; i++) if (!P.capa[i]) particula(i);

    // 3. Mano humana: sale de cuadro por la izquierda
    const falta = Math.pow(1 - e.mano, 2.2);
    const alfaMano = suave(0.02, 0.6, e.mano);
    const corrida = -falta * 900, baja = falta * 40;
    // "Se cierra": la mano abierta pasa a la cerrada en el pico del pulso
    const cierre = general.mano === 'cierra' ? suave(0.15, 0.6, e.contacto) : 0;
    enEscena(ang);
    dibujarMano(capas.abierta, alfaMano * (1 - suave(0.35, 1, cierre)), c.manoX + corrida, c.manoY + baja, c.manoGiro);
    if (cierre > 0) dibujarMano(capas.cerrada, alfaMano * suave(0, 0.65, cierre), corrida, baja, 0);
    plano();
    // El brazo se pierde hacia la izquierda, para no pisar el texto
    if (c.fundidoDesde > 0 || c.fundidoAncho > 0) {
      const x0 = c.fundidoDesde / 100 * W, x1 = x0 + Math.max(1, c.fundidoAncho / 100 * W);
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = g; ctx.fillRect(0, 0, x1, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // 4. Vidrio oscuro del pulgar y los dedos, y sus bytes por encima
    const vidrio = suave(0.62, 1, e.formacion);
    if (vidrio > 0.01) {
      enEscena(ang);
      ctx.globalAlpha = vidrio * c.fondoPulgar;
      ctx.drawImage(capas.vidrio, 0, 0, ANCHO, ALTO);
      plano();
    }
    for (let i = 0; i < N; i++) if (P.capa[i]) particula(i);

    // 5. Destello del contacto por delante, más chico
    if (pulso > 0.01) resplandor(230 * s * (0.8 + 0.6 * e.contacto), 0.28 * pulso, 0.5, 0.5);
    ctx.globalAlpha = 1;
    return e;
  }

  const hud = { fps: $('fps'), ms: $('ms'), cantidad: $('cantidad'), tramo: $('tramo'), detalle: $('detalle') };
  function escribirHud(nombre, fps, ms) {
    hud.fps.textContent = fps; hud.ms.textContent = ms;
    hud.cantidad.textContent = dibujadas;
    hud.tramo.textContent = nombre;
    hud.detalle.textContent = 'mano ' + nMano + ' de ' + N + ' · ' + W + 'x' + H + ' · ' + (modo() === 'celular' ? 'mobile' : 'desktop');
  }

  /* Movimiento reducido: la pose final, dibujada una sola vez */
  function pedirDibujo() {
    if (!reducido || pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      if (!P) return;
      dibujar(0, 0, 1);
      escribirHud('Pose final (movimiento reducido)', '0', '0');
    });
  }

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;
    if (reducido || !P) return;

    if (reproduccion) {
      const maximo = largoPin() + 40;
      const y = limitar(posicionScroll() + reproduccion * general.velocidadScroll * dt, 0, maximo);
      ponerScroll(y);
      if (y <= 0 || y >= maximo) reproduccion = 0;
    }
    // Mismo suavizado que el scrub de la web (0,6 s)
    t += (progreso - t) * (1 - Math.exp(-dt * 6));
    if (Math.abs(progreso - t) < 0.0005) t = progreso;

    // Fuera de pantalla no se dibuja
    if (rodar.scrollTop > largoPin() + H) { cuadros = 0; costo = 0; marca = ahora; hud.tramo.textContent = 'Fuera de pantalla (en pausa)'; return; }
    const t0 = performance.now();
    const e = dibujar((ahora - inicio) / 1000, dt, t);
    costo += performance.now() - t0;
    cuadros++;
    if (ahora - marca >= 500) {
      escribirHud(e.nombre, Math.round(cuadros * 1000 / (ahora - marca)), (costo / cuadros).toFixed(1));
      cuadros = 0; costo = 0; marca = ahora;
    }
  }

  // El scroll simulado lleva su propia cuenta con decimales (scrollTop redondea)
  let scrollFino = 0;
  function posicionScroll() { return Math.abs(scrollFino - rodar.scrollTop) < 2 ? scrollFino : rodar.scrollTop; }
  function ponerScroll(y) { scrollFino = y; rodar.scrollTop = y; }

  /* ==========================================================================
     Lo que usa el panel
     ========================================================================== */
  const DE_PARTICULAS = new Set(['particulas', 'umbral', 'estela']);
  const DE_CAPAS = new Set(['manoEscala', 'manoSombra', 'brilloBorde', 'brilloAncho']);
  const DE_ESCENA = new Set(['escenaAncho', 'escenaX', 'escenaY', 'pin']);
  const espera = {};
  function luego(nombre, ms, fn) { clearTimeout(espera[nombre]); espera[nombre] = setTimeout(() => { fn(); pedirDibujo(); }, ms); }

  function aplicar(clave, valor) {
    if (clave in general) {
      general[clave] = valor;
      if (clave === 'mano') armarCapas();
    } else {
      cfg()[clave] = valor;
      if (DE_PARTICULAS.has(clave)) luego('particulas', 90, generar);
      if (clave === 'tamano') armarSprites();
      if (DE_CAPAS.has(clave)) luego('capas', 60, armarCapas);
      if (DE_ESCENA.has(clave)) luego('escena', 40, medir);
    }
    pedirDibujo();
  }

  function rehacer() { medir(); generar(); pedirDibujo(); }

  function exportar() {
    return { mano: general.mano, velocidadScroll: general.velocidadScroll, modoActual: modo(), simulado, escritorio: copia(porModo.escritorio), celular: copia(porModo.celular) };
  }
  function importar(d) {
    if (!d) return;
    if (d.mano === 'abierta' || d.mano === 'cierra') general.mano = d.mano;
    if (d.velocidadScroll > 0) general.velocidadScroll = d.velocidadScroll;
    [['escritorio', DESKTOP], ['celular', MOVIL]].forEach(([m, base]) => {
      Object.keys(base).forEach((k) => { if (d[m] && typeof d[m][k] === 'number') porModo[m][k] = d[m][k]; });
    });
    simulado = !!d.simulado;
    document.body.classList.toggle('celular', simulado);
  }
  function restablecer() {
    Object.assign(porModo.escritorio, DESKTOP); Object.assign(porModo.celular, MOVIL);
    general.mano = 'abierta'; general.velocidadScroll = 700;
    reproduccion = 0;
    rehacer();
  }
  function ponerSimulado(si) {
    simulado = si;
    document.body.classList.toggle('celular', si);
    modoPrevio = modo();
    const avance = progreso; // el mismo momento de la secuencia en el otro modo
    requestAnimationFrame(() => { rehacer(); if (!reducido) L.saltarA(avance); });
  }

  let modoPrevio = '';
  new ResizeObserver(() => {
    if (!puntaje || (hero.clientWidth === W && hero.clientHeight === H)) return;
    const cambio = modo() !== modoPrevio;
    modoPrevio = modo();
    if (cambio) { rehacer(); if (L.alCambiarModo) L.alCambiarModo(); } else medir();
  }).observe(hero);
  menosMovimiento.addEventListener('change', () => {
    reducido = menosMovimiento.matches;
    rodar.scrollTop = 0; progreso = t = 0;
    rehacer();
    if (L.alCambiarModo) L.alCambiarModo();
  });
  $('cta').addEventListener('click', (ev) => ev.preventDefault());

  const cargar = (src) => new Promise((ok, mal) => {
    const i = new Image();
    i.onload = () => ok(i); i.onerror = () => mal(new Error(src)); i.src = src;
  });

  const L = window.LabManos = {
    cfg, general, aplicar, exportar, importar, restablecer, ponerSimulado, tramos,
    esCelular: () => modo() === 'celular', esSimulado: () => simulado, esReducido: () => reducido,
    irA(p) { reproduccion = 0; ponerScroll(p * largoPin()); },
    // Para las pruebas: salta sin esperar al suavizado
    saltarA(p) { reproduccion = 0; ponerScroll(p * largoPin()); progreso = t = p; },
    reproducir(d) { reproduccion = d; scrollFino = rodar.scrollTop; },
    alCambiarProgreso(fn) { alCambiar = fn; },
    alCambiarModo: null,
    listo: false,
    arrancar() {
      const fuentes = document.fonts ? document.fonts.load('600 32px Inter').catch(() => {}) : null;
      Promise.all([cargar('mano-humana.webp'), cargar('mano-cerrada.webp'), cargar('referencia.webp'), cargar('zonas.png'), fuentes]).then((r) => {
        img.abierta = r[0]; img.cerrada = r[1]; img.referencia = r[2]; img.zonas = r[3];
        leerReferencia();
        modoPrevio = modo();
        rehacer();
        L.listo = true;
        requestAnimationFrame(cuadro);
      }, () => { $('aviso').textContent = 'No se pudieron cargar las imágenes. Abrí el laboratorio con el servidor, no como archivo.'; });
    }
  };
})();
