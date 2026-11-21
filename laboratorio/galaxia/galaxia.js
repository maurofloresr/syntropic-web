/* ==========================================================================
   Laboratorio: galaxia del hero (no se publica)

   Copia del código de la galaxia de sitio/assets/js/particulas.js (estado
   galaxia, transición galaxia > S, S formada, nebulosa, estrellas de campo,
   supernova y luces al tocar), con cada número fijo convertido en un valor
   de configuración. Los valores de BASE son los de la web hoy.

   Diferencias con la web (por ser una página aislada):
   - Sin scroll real: el "progreso de la S" reemplaza al scroll del pin.
   - Sin texto del hero: la galaxia va centrada en el marco. En celular se
     ubica en la mitad de arriba, como el hero mobile (menú de 56 px arriba
     y el texto abajo).
   - Sin títulos de bytes ni estrellas fugaces (no pasan en el hero).
   - Números al azar con semilla fija: al mover un control, las estrellas
     que no cambian quedan en el mismo lugar y se puede comparar.
   ========================================================================== */
(function () {
  'use strict';

  /* --- Paleta del brief + violeta aprobado para estrellas sueltas --- */
  const COLORES = {
    azul: [0, 64, 255],          // #0040FF
    celeste: [71, 173, 255],     // #47ADFF
    celesteClaro: [160, 211, 253], // #A0D3FD
    blanco: [255, 255, 255],     // #FFFFFF
    violeta: [180, 156, 240]     // #B49CF0
  };
  const NOMBRES = ['azul', 'celeste', 'celesteClaro', 'blanco', 'violeta'];
  const IDX = { azul: 0, celeste: 1, celesteClaro: 2, blanco: 3, violeta: 4 };

  /* --- Valores de hoy en la web (escritorio) --- */
  const BASE = {
    // Estrellas
    estrellasGalaxia: 2500, estrellasCampo: 1700,
    tamanoEstrellas: 1, brilloEstrellas: 1, titileo: 1, velocidadTitileo: 1,
    // Núcleo
    nucleoDensidad: 0.28, nucleoTamano: 0.27, nucleoConcentracion: 2.4,
    nucleoClaro: 70, brilloNucleo: 1,
    // Brazos
    brazos: 2, enroscado: 2.45, anchoBrazos: 1, franjasOscuras: 0.5,
    // Rotación
    rotacion: 0.05,
    // Nebulosa y violetas
    nebulosa: 1, violetasCampo: 3, violetasGalaxia: 0,
    // Colores
    pctAzul: 30, pctCeleste: 35, pctCelesteClaro: 25, pctBlanco: 10,
    colorBrilloNucleo: 'azul', colorCentroNucleo: 'blanco',
    colorNebulosa1: 'azul', colorNebulosa2: 'celeste', colorGlowS: 'azul',
    // Supernova
    supernovaTamano: 115, supernovaFuerza: 0.55, supernovaRegreso: 90,
    // Transición galaxia > S
    progresoS: 0, largoTramo: 45, escalonado: 0.6, velocidadScroll: 1000
  };
  // Lo que cambia en mobile (la web usa estos valores debajo de 768 px)
  const MOVIL = { estrellasGalaxia: 900, estrellasCampo: 700, supernovaTamano: 85 };
  const CLAVES_POR_MODO = Object.keys(MOVIL);

  const cfg = Object.assign({}, BASE);
  let celular = false;

  /* --- Utilidades --- */
  const limitar = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mezclar = (a, b, t) => a + (b - a) * t;
  function suave(a, b, v) { const t = limitar((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function entradaSalida(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  // Números al azar con semilla (mulberry32)
  function semilla(s) {
    let a = s >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function crearGauss(rnd) { return () => (rnd() + rnd() + rnd() - 1.5) / 1.5; }

  function crearSpritePunto(color) {
    const t = 32, c = document.createElement('canvas');
    c.width = c.height = t;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
    g.addColorStop(0, rgba(color, 1));
    g.addColorStop(0.22, rgba(color, 1));
    g.addColorStop(0.42, rgba(color, 0.32));
    g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, t, t);
    return c;
  }
  const sprites = NOMBRES.map((n) => crearSpritePunto(COLORES[n]));

  /* S del isologo: puntos al azar dentro de una grilla (igual que la web) */
  function muestrearS(img, cx, cy, alto, presupuesto, rnd) {
    alto = Math.max(8, Math.round(alto));
    const ancho = Math.max(4, Math.round(alto * img.width / img.height));
    const c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, ancho, alto);
    const datos = x.getImageData(0, 0, ancho, alto).data;
    function lleno(px, py) {
      const ix = Math.round(px), iy = Math.round(py);
      if (ix < 0 || iy < 0 || ix >= ancho || iy >= alto) return false;
      return datos[(iy * ancho + ix) * 4 + 3] > 128;
    }
    let area = 0;
    for (let p = 3; p < datos.length; p += 4) if (datos[p] > 128) area++;
    let paso = Math.max(2.5, Math.sqrt(area / Math.max(1, presupuesto)));
    let puntos, borde;
    do {
      puntos = []; borde = [];
      for (let gy = paso / 2; gy < alto; gy += paso) {
        for (let gx = paso / 2; gx < ancho; gx += paso) {
          const px = gx + (rnd() - 0.5) * paso;
          const py = gy + (rnd() - 0.5) * paso;
          if (lleno(px, py)) {
            puntos.push(cx - ancho / 2 + px, cy - alto / 2 + py);
            const r = paso * 1.3;
            borde.push(!lleno(px + r, py) || !lleno(px - r, py) || !lleno(px, py + r) || !lleno(px, py - r) ? 1 : 0);
          }
        }
      }
      paso *= 1.06;
    } while (puntos.length / 2 > presupuesto);
    return { puntos, borde };
  }

  /* --- Canvas --- */
  const marco = document.getElementById('marco');
  const lienzo = document.getElementById('lienzo');
  const ctx = lienzo.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  /* --- Datos de las estrellas --- */
  let N = 0, M = 0;
  let color, tam, fase, galR, galA, galW, galAlfa, ordenRadio;
  let gX, gY, sX, sY, sA, sZ;
  let ofX, ofY, ovX, ovY;
  let cU, cV, cSorteo, cColor, cTam, cFase, cX, cY, cA, cVisible, cofX, cofY, covX, covY;
  const hero = { cx: 0, cy: 0, R: 0 };
  const forma = { cx: 0, cy: 0, alto: 0 };
  let nebulosa = null;
  let imagenS = null;
  let listo = false;

  function anguloBrazo(r) { return Math.log(Math.max(r, 0.04) / 0.06) * cfg.enroscado; }

  /* Fracciones de cada tipo de estrella. En la web: 28% núcleo, 52% brazos
     principales, 10% pedazos de brazos secundarios y 10% polvo suelto. Las
     franjas oscuras (0 a 1) sacan estrellas de entre los brazos: con 0.5
     (lo de hoy) queda 20% entre brazos; con 1, nada. */
  function fracciones() {
    const nucleo = limitar(cfg.nucleoDensidad, 0, 0.9);
    const entre = Math.min(1 - nucleo, 0.4 * (1 - cfg.franjasOscuras));
    return { nucleo, brazos: nucleo + (1 - nucleo - entre), secundarios: 1 - entre / 2 };
  }

  function sortearColor(rnd) {
    const p = [cfg.pctAzul, cfg.pctCeleste, cfg.pctCelesteClaro, cfg.pctBlanco];
    const total = p[0] + p[1] + p[2] + p[3] || 1;
    let r = rnd() * total;
    for (let k = 0; k < 4; k++) { if (r < p[k]) return k; r -= p[k]; }
    return 3;
  }

  function generarGalaxia() {
    N = Math.round(cfg.estrellasGalaxia);
    const rnd = semilla(1), gauss = crearGauss(semilla(11));
    color = new Uint8Array(N); tam = new Float32Array(N); fase = new Float32Array(N);
    galR = new Float32Array(N); galA = new Float32Array(N); galW = new Float32Array(N); galAlfa = new Float32Array(N);
    gX = new Float32Array(N); gY = new Float32Array(N);
    sX = new Float32Array(N); sY = new Float32Array(N); sA = new Float32Array(N); sZ = new Float32Array(N);
    ofX = new Float32Array(N); ofY = new Float32Array(N); ovX = new Float32Array(N); ovY = new Float32Array(N);
    ordenRadio = new Float32Array(N);
    const fr = fracciones();
    const nB = Math.max(1, Math.round(cfg.brazos));
    const paso = Math.PI * 2 / nB;
    for (let i = 0; i < N; i++) {
      color[i] = sortearColor(rnd);
      if (rnd() * 100 < cfg.violetasGalaxia) color[i] = IDX.violeta;
      tam[i] = 0.8 + rnd() * 1.2 + (color[i] === 3 ? 0.5 : 0);
      fase[i] = rnd() * Math.PI * 2;
      let radio, angulo;
      const tipo = rnd();
      if (tipo < fr.nucleo) {
        radio = Math.pow(rnd(), cfg.nucleoConcentracion) * cfg.nucleoTamano;
        angulo = rnd() * Math.PI * 2;
        if (color[i] < 2 && rnd() * 100 < cfg.nucleoClaro) color[i] = rnd() < 0.5 ? 2 : 3;
      } else if (tipo < fr.brazos) {
        radio = 0.07 + Math.pow(rnd(), 1.05) * 0.93;
        angulo = Math.floor(rnd() * nB) * paso + anguloBrazo(radio) + gauss() * (0.3 + radio * 0.3) * cfg.anchoBrazos;
        radio *= 1 + gauss() * 0.09 * cfg.anchoBrazos;
      } else if (tipo < fr.secundarios) {
        radio = 0.3 + rnd() * 0.6;
        angulo = (Math.floor(rnd() * nB) + 0.5) * paso + anguloBrazo(radio) + gauss() * 0.35 * cfg.anchoBrazos;
      } else {
        radio = Math.pow(rnd(), 0.7) * 1.12;
        angulo = rnd() * Math.PI * 2;
      }
      galR[i] = radio;
      galA[i] = angulo;
      galW[i] = 0.05 + 0.07 * (1 - Math.min(radio, 1));
      galAlfa[i] = (0.5 + rnd() * 0.5) * (1 - 0.35 * Math.min(radio, 1));
    }
  }

  function generarCampo() {
    M = Math.round(cfg.estrellasCampo);
    const rnd = semilla(2);
    cU = new Float32Array(M); cV = new Float32Array(M); cSorteo = new Float32Array(M);
    cColor = new Uint8Array(M); cTam = new Float32Array(M); cFase = new Float32Array(M);
    cX = new Float32Array(M); cY = new Float32Array(M); cA = new Float32Array(M); cVisible = new Uint8Array(M);
    cofX = new Float32Array(M); cofY = new Float32Array(M); covX = new Float32Array(M); covY = new Float32Array(M);
    const v = cfg.violetasCampo / 100;
    for (let i = 0; i < M; i++) {
      cU[i] = rnd(); cV[i] = rnd(); cSorteo[i] = rnd();
      // Mismo reparto que la web (22% azul, 30% celeste, 30% claro, 18% blanco)
      // con el violeta tomado primero
      const rc = rnd();
      cColor[i] = rc < v ? IDX.violeta : rc < v + 0.19 * (1 - v) / 0.97 ? 0 : rc < v + 0.49 * (1 - v) / 0.97 ? 1 : rc < v + 0.79 * (1 - v) / 0.97 ? 2 : 3;
      cTam[i] = 0.45 + Math.pow(rnd(), 2) * 0.9 + (cColor[i] === IDX.violeta ? 0.35 : 0);
      cFase[i] = rnd() * Math.PI * 2;
    }
  }

  /* Nebulosa: manchas suaves muy transparentes a lo largo de los brazos,
     dibujadas una vez en un canvas aparte que gira con la galaxia */
  function crearNebulosa() {
    const R = hero.R;
    const lado = Math.min(640, Math.ceil(R * 2.5));
    const c = document.createElement('canvas');
    c.width = c.height = Math.max(2, lado);
    const x = c.getContext('2d');
    const esc = lado / 2.5, m = lado / 2;
    const rnd = semilla(3), gauss = crearGauss(semilla(33));
    const c1 = sprites[IDX[cfg.colorNebulosa1]], c2 = sprites[IDX[cfg.colorNebulosa2]], claro = sprites[IDX.celesteClaro];
    const nB = Math.max(1, Math.round(cfg.brazos)), paso = Math.PI * 2 / nB;
    const intensidad = cfg.nebulosa;
    const entre = limitar(2 * (1 - cfg.franjasOscuras), 0, 2); // brillo entre brazos (1 = hoy)
    for (let k = 0; k < 3400; k++) {
      const secundario = rnd() < 0.22;
      const r = secundario ? 0.3 + rnd() * 0.6 : 0.05 + Math.pow(rnd(), 1.1) * 1.0;
      const base = secundario ? (Math.floor(rnd() * nB) + 0.5) * paso : Math.floor(rnd() * nB) * paso;
      const a = base + anguloBrazo(r) + gauss() * (secundario ? 0.4 : 0.3 + r * 0.32) * cfg.anchoBrazos;
      const px = m + Math.cos(a) * r * esc, py = m + Math.sin(a) * r * esc;
      const d = (0.12 + rnd() * 0.16) * esc;
      x.globalAlpha = Math.min(1, (secundario ? 0.02 * entre : 0.034) * (1 - 0.62 * r) * intensidad);
      x.drawImage(r < 0.35 ? (rnd() < 0.5 ? claro : c2) : (rnd() < 0.6 ? c1 : c2), px - d / 2, py - d / 2, d, d);
    }
    // Centro del núcleo
    const centro = COLORES[cfg.colorCentroNucleo];
    const g = x.createRadialGradient(m, m, 0, m, m, esc * 0.3);
    g.addColorStop(0, rgba(centro, Math.min(1, 0.75 * intensidad)));
    g.addColorStop(0.12, rgba(centro, Math.min(1, 0.45 * intensidad)));
    g.addColorStop(0.35, rgba(COLORES.celesteClaro, Math.min(1, 0.2 * intensidad)));
    g.addColorStop(1, rgba(COLORES.celeste, 0));
    x.globalAlpha = 1;
    x.fillStyle = g;
    x.fillRect(0, 0, lado, lado);
    nebulosa = { lienzo: c, radio: 1.25 };
  }

  /* Medidas: dónde va la galaxia, la S y qué estrellas de campo se ven */
  function medir() {
    if (!imagenS || !N) return;
    const r = marco.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);

    let altoS, centroS;
    if (celular) {
      // Hero mobile: menú de 56 px, galaxia arriba y texto abajo (en un
      // iPhone de 390x844 la caja de la galaxia mide unos 350x400)
      const menu = 56, pisoVisual = H * 0.55;
      const vw = W - 40, vh = pisoVisual - menu;
      hero.cx = W / 2; hero.cy = menu + vh / 2;
      hero.R = Math.min(vw, vh) * 0.62;
      altoS = Math.min(hero.R * 1.05, vh * 0.85);
      const techo = menu + 16, piso = pisoVisual - 24, libre = piso - techo;
      altoS = Math.min(altoS, libre * 0.62);
      centroS = techo + libre / 2;
    } else {
      hero.cx = W / 2; hero.cy = H / 2;
      hero.R = Math.min(H * 0.42, 380);
      altoS = Math.min(hero.R * 1.05, H * 0.85);
      centroS = hero.cy;
    }

    // Estrellas de campo: más juntas cerca de la galaxia
    const densidad = Math.min(1, (W * H) / (celular ? 390 * 844 : 1440 * 900));
    for (let i = 0; i < M; i++) {
      const fx = cU[i] * W, fy = cV[i] * H;
      const d = Math.hypot(fx - hero.cx, (fy - hero.cy) / 0.9) / hero.R;
      const prob = (0.22 + 0.78 * Math.exp(-d * d / 2.2)) * (0.45 + 0.55 * densidad);
      cVisible[i] = cSorteo[i] < prob ? 1 : 0;
      cX[i] = fx; cY[i] = fy;
      cA[i] = 0.45 + 0.5 * (cTam[i] - 0.45) / 1.25;
    }
    crearNebulosa();

    // S: las estrellas más cercanas al centro dibujan el contorno primero;
    // las de afuera la rellenan; las que sobran quedan como halo
    const rnd = semilla(4);
    const s = muestrearS(imagenS, hero.cx, centroS, altoS, Math.floor(N * 0.78), rnd);
    forma.cx = hero.cx; forma.cy = centroS; forma.alto = altoS;
    const nS = s.puntos.length / 2;
    const ordenS = [];
    for (let i = 0; i < nS; i++) ordenS.push(i);
    for (let i = nS - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = ordenS[i]; ordenS[i] = ordenS[j]; ordenS[j] = t; }
    ordenS.sort((p, q) => s.borde[q] - s.borde[p]);
    const porRadio = [];
    for (let i = 0; i < N; i++) porRadio.push(i);
    porRadio.sort((p, q) => galR[p] - galR[q]);
    for (let j = 0; j < N; j++) {
      const i = porRadio[j];
      ordenRadio[i] = j / N;
      if (j < nS) {
        const k = ordenS[j];
        sX[i] = s.puntos[k * 2]; sY[i] = s.puntos[k * 2 + 1];
        sA[i] = 0.75 + 0.25 * ((fase[i] / 6.283) % 1);
        sZ[i] = 1;
      } else {
        sX[i] = NaN; sA[i] = galAlfa[i] * 0.55; sZ[i] = 0.9;
      }
    }
    listo = true;
  }

  function rehacerTodo() {
    generarGalaxia();
    generarCampo();
    medir();
  }

  /* --- Galaxia en el tiempo --- */
  function actualizarGalaxia(tiempo) {
    const R = hero.R, giro = cfg.rotacion * tiempo;
    for (let i = 0; i < N; i++) {
      const a = galA[i] + giro + 0.6 * galW[i] * Math.sin(tiempo * 0.25 + fase[i]);
      const rr = galR[i] * (1 + 0.025 * Math.sin(tiempo * 0.4 + fase[i] * 1.7));
      const x = hero.cx + Math.cos(a) * rr * R;
      const y = hero.cy + Math.sin(a) * rr * R * 0.9;
      gX[i] = x; gY[i] = y;
      if (sZ[i] !== 1) { // halo alrededor de la S
        sX[i] = hero.cx + (x - hero.cx) * 1.18;
        sY[i] = hero.cy + (y - hero.cy) * 1.18;
      }
    }
  }

  /* --- Progreso de la S (reemplaza al scroll) --- */
  let t = 0;               // progreso suavizado (como el scrub de 0.6 s de la web)
  let reproduccion = 0;    // 1 bajando, -1 subiendo, 0 quieto
  let alCambiarProgreso = null;
  let pulsoInicio = -10;

  /* --- Supernova y luces al tocar --- */
  const luz = { x: -999, y: -999, mouse: false, dedo: false, fuerza: 0 };
  let hayOnda = false, galaxiaSuelta = true;
  const chispas = [];
  let toque = null;

  function enZona(x, y) {
    const dx = (x - hero.cx) / hero.R, dy = (y - hero.cy) / (hero.R * 0.9);
    return dx * dx + dy * dy < 1.1;
  }
  function posicion(e) {
    const r = lienzo.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  lienzo.addEventListener('pointermove', (e) => {
    const p = posicion(e);
    if (e.pointerType === 'mouse') { luz.mouse = true; luz.x = p.x; luz.y = p.y; }
    else if (luz.dedo && e.isPrimary) { luz.x = p.x; luz.y = p.y; }
  });
  lienzo.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') luz.mouse = false; });
  lienzo.addEventListener('pointerdown', (e) => {
    const p = posicion(e);
    if (e.pointerType !== 'mouse' && e.isPrimary) { luz.dedo = true; luz.x = p.x; luz.y = p.y; }
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) { toque = null; return; }
    toque = { x: p.x, y: p.y, t: performance.now() };
  });
  function soltar(e) {
    if (e.pointerType !== 'mouse') luz.dedo = false;
    if (!toque || !e.isPrimary || e.type !== 'pointerup') { toque = null; return; }
    const p = posicion(e);
    const lejos = Math.hypot(p.x - toque.x, p.y - toque.y) > 10;
    const largo = performance.now() - toque.t > 500;
    if (!lejos && !largo && !(galaxiaSuelta && enZona(p.x, p.y))) crearChispas(p.x, p.y);
    toque = null;
  }
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);

  function moverOnda(dt, bx, by, oX, oY, vX, vY, i, maximo, radio, rigidez, freno) {
    let tx = 0, ty = 0;
    if (luz.fuerza > 0.001) {
      const dx = bx - luz.x, dy = by - luz.y;
      const d = Math.hypot(dx, dy);
      if (d < radio && d > 0.01) {
        const k = 1 - d / radio;
        const empuje = radio * cfg.supernovaFuerza * k * k * luz.fuerza;
        tx = dx / d * empuje; ty = dy / d * empuje;
      }
    }
    vX[i] += ((tx - oX[i]) * rigidez - vX[i] * freno) * dt;
    vY[i] += ((ty - oY[i]) * rigidez - vY[i] * freno) * dt;
    oX[i] += vX[i] * dt; oY[i] += vY[i] * dt;
    const m = Math.abs(oX[i]) + Math.abs(oY[i]) + Math.abs(vX[i]) * 0.05 + Math.abs(vY[i]) * 0.05;
    return m > maximo ? m : maximo;
  }

  function actualizarOnda(dt) {
    const objetivo = galaxiaSuelta && (luz.mouse || luz.dedo) && enZona(luz.x, luz.y) ? 1 : 0;
    luz.fuerza += (objetivo - luz.fuerza) * Math.min(1, dt * 8);
    if (luz.fuerza < 0.001 && !hayOnda) return;
    // Velocidad de regreso: rigidez del resorte (90 hoy). El freno crece con
    // ella para que vuelva igual de "amortiguada", solo que más rápido o lento.
    const rigidez = cfg.supernovaRegreso, freno = 12 * Math.sqrt(rigidez / 90);
    const radio = cfg.supernovaTamano;
    let maximo = 0;
    for (let i = 0; i < N; i++) maximo = moverOnda(dt, gX[i], gY[i], ofX, ofY, ovX, ovY, i, maximo, radio, rigidez, freno);
    for (let i = 0; i < M; i++) if (cVisible[i]) maximo = moverOnda(dt, cX[i], cY[i], cofX, cofY, covX, covY, i, maximo, radio, rigidez, freno);
    hayOnda = maximo > 0.05;
    if (!hayOnda) { ofX.fill(0); ofY.fill(0); ovX.fill(0); ovY.fill(0); cofX.fill(0); cofY.fill(0); covX.fill(0); covY.fill(0); }
  }

  function dibujarLuz() {
    if (luz.fuerza < 0.01) return;
    const r = cfg.supernovaTamano * 0.37; // 42 px en escritorio, 34 en celular (como la web)
    const g = ctx.createRadialGradient(luz.x, luz.y, 0, luz.x, luz.y, r);
    g.addColorStop(0, rgba(COLORES.blanco, 0.95));
    g.addColorStop(0.08, rgba(COLORES.blanco, 0.85));
    g.addColorStop(0.25, rgba(COLORES.blanco, 0.28));
    g.addColorStop(0.6, rgba(COLORES.celesteClaro, 0.08));
    g.addColorStop(1, rgba(COLORES.celesteClaro, 0));
    ctx.globalAlpha = luz.fuerza;
    ctx.fillStyle = g;
    ctx.fillRect(luz.x - r, luz.y - r, r * 2, r * 2);
  }

  function crearChispas(x, y) {
    const n = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 130, r = Math.random();
      chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.55 + Math.random() * 0.35, edad: 0, color: r < 0.35 ? 3 : r < 0.75 ? 2 : 1, tam: 1.4 + Math.random() * 1.2 });
    }
  }
  function dibujarChispas(dt) {
    for (let i = chispas.length - 1; i >= 0; i--) {
      const c = chispas[i];
      c.edad += dt;
      if (c.edad >= c.vida) { chispas.splice(i, 1); continue; }
      const f = Math.max(0, 1 - 3.2 * dt);
      c.vx *= f; c.vy *= f; c.x += c.vx * dt; c.y += c.vy * dt;
      const alfa = 1 - c.edad / c.vida, d = c.tam * 4;
      ctx.globalAlpha = alfa * alfa;
      ctx.drawImage(sprites[c.color], c.x - d / 2, c.y - d / 2, d, d);
    }
  }

  /* --- Dibujo --- */
  let dibujadas = 0, dibujadasCampo = 0;

  function punto(i, x, y, alfa, z) {
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
    const d = tam[i] * z * 4 * cfg.tamanoEstrellas;
    ctx.globalAlpha = alfa;
    ctx.drawImage(sprites[color[i]], x - d / 2, y - d / 2, d, d);
    dibujadas++;
  }

  function titilar(tiempo, ritmo, fase, amplitud) {
    const a = Math.min(1, amplitud * cfg.titileo);
    return 1 - a + a * Math.sin(tiempo * ritmo * cfg.velocidadTitileo + fase);
  }
  const alfaGalaxia = (i, tiempo) => galAlfa[i] * titilar(tiempo, 1.6, fase[i], 0.18) * cfg.brilloEstrellas;
  const alfaS = (i, tiempo) => sA[i] * titilar(tiempo, 1.6, fase[i], 0.18) * cfg.brilloEstrellas;

  function dibujarCampo(tiempo, peso) {
    if (peso < 0.01) return;
    for (let i = 0; i < M; i++) {
      if (!cVisible[i]) continue;
      const al = Math.min(1, cA[i] * peso * titilar(tiempo, 0.8, cFase[i], 0.35) * cfg.brilloEstrellas);
      if (al < 0.01) continue;
      const d = cTam[i] * 4 * cfg.tamanoEstrellas;
      ctx.globalAlpha = al;
      ctx.drawImage(sprites[cColor[i]], cX[i] + cofX[i] - d / 2, cY[i] + cofY[i] - d / 2, d, d);
      dibujadasCampo++;
    }
  }

  function dibujarNebulosa(tiempo, alfa) {
    if (!nebulosa || alfa < 0.01) return;
    const lado = nebulosa.radio * 2 * hero.R;
    ctx.save();
    ctx.translate(hero.cx, hero.cy);
    ctx.scale(1, 0.9);
    ctx.rotate(cfg.rotacion * tiempo);
    ctx.globalAlpha = alfa;
    ctx.drawImage(nebulosa.lienzo, -lado / 2, -lado / 2, lado, lado);
    ctx.restore();
  }

  const inicio = performance.now();
  let anterior = inicio;
  let cuadrosFps = 0, marcaFps = inicio, fps = 0;
  const hud = { fps: document.getElementById('fps'), cantidad: document.getElementById('cantidad'), detalle: document.getElementById('detalle') };

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min((ahora - anterior) / 1000, 0.05);
    anterior = ahora;

    cuadrosFps++;
    if (ahora - marcaFps >= 500) {
      fps = Math.round(cuadrosFps * 1000 / (ahora - marcaFps));
      cuadrosFps = 0; marcaFps = ahora;
      hud.fps.textContent = fps;
      hud.cantidad.textContent = dibujadas + dibujadasCampo;
      hud.detalle.textContent = 'galaxia ' + dibujadas + ' de ' + N + ' · campo ' + dibujadasCampo + ' de ' + M + ' · ' + W + 'x' + H;
    }
    if (!listo) return;
    const tiempo = (ahora - inicio) / 1000;

    // Simular scroll: avanza el progreso a la velocidad elegida sobre el
    // largo del tramo (en la web, el tramo galaxia > S dura 45% del alto)
    if (reproduccion) {
      const largo = Math.max(1, cfg.largoTramo / 100 * H);
      let p = cfg.progresoS + reproduccion * cfg.velocidadScroll * dt / largo * 100;
      if (p >= 100 || p <= 0) { p = limitar(p, 0, 100); reproduccion = 0; }
      cfg.progresoS = p;
      if (alCambiarProgreso) alCambiarProgreso(p);
    }
    // Suavizado como el scrub de la web
    const objetivo = cfg.progresoS / 100;
    const previo = t;
    t += (objetivo - t) * (1 - Math.exp(-dt * 6));
    if (Math.abs(objetivo - t) < 0.0008) t = objetivo;
    if (previo < 1 && t >= 1) pulsoInicio = tiempo; // la S terminó de formarse
    const pulso = tiempo - pulsoInicio < 0.9 ? Math.sin(Math.PI * (tiempo - pulsoInicio) / 0.9) : 0;
    galaxiaSuelta = t <= 0 && objetivo === 0;

    actualizarGalaxia(tiempo);
    actualizarOnda(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    dibujadas = 0; dibujadasCampo = 0;
    const aparicion = suave(0, 1.2, tiempo);

    const pesoGalaxia = 1 - suave(0, 0.75, t);
    dibujarCampo(tiempo, (0.45 + 0.55 * pesoGalaxia) * aparicion);

    // Brillo del núcleo (por detrás) y nebulosa
    if (pesoGalaxia > 0.01) {
      const nr = hero.R * 0.42, cb = COLORES[cfg.colorBrilloNucleo];
      const gn = ctx.createRadialGradient(hero.cx, hero.cy, 0, hero.cx, hero.cy, nr);
      gn.addColorStop(0, rgba(cb, Math.min(1, 0.32 * cfg.brilloNucleo * pesoGalaxia * aparicion)));
      gn.addColorStop(0.35, rgba(cb, Math.min(1, 0.14 * cfg.brilloNucleo * pesoGalaxia * aparicion)));
      gn.addColorStop(1, rgba(cb, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = gn;
      ctx.fillRect(hero.cx - nr, hero.cy - nr, nr * 2, nr * 2);
      dibujarNebulosa(tiempo, pesoGalaxia * aparicion);
    }

    // Glow detrás de la S
    const pesoS = suave(0.3, 1, t);
    if (pesoS > 0.01) {
      const gr = forma.alto * 0.75, cg = COLORES[cfg.colorGlowS];
      const g = ctx.createRadialGradient(forma.cx, forma.cy, 0, forma.cx, forma.cy, gr);
      g.addColorStop(0, rgba(cg, Math.min(0.7, 0.3 * pesoS * (1 + 1.3 * pulso)) * aparicion));
      g.addColorStop(1, rgba(cg, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(forma.cx - gr, forma.cy - gr, gr * 2, gr * 2);
    }

    // Estrellas: galaxia suelta, en viaje en espiral o formando la S.
    // Escalonado: cada estrella sale en su momento (las del centro primero)
    // y viaja durante el resto del tramo, así todas llegan al 100%.
    const esc = limitar(cfg.escalonado, 0, 0.95), viaje = 1 - esc;
    const hx = hero.cx, hy = hero.cy;
    for (let i = 0; i < N; i++) {
      const gxp = gX[i] + ofX[i], gyp = gY[i] + ofY[i];
      const uS = t <= 0 ? 0 : limitar((t - esc * ordenRadio[i]) / viaje, 0, 1);
      if (uS <= 0) {
        const al = Math.min(1, alfaGalaxia(i, tiempo)) * aparicion;
        if (al >= 0.01) punto(i, gxp, gyp, al, 1);
        continue;
      }
      if (uS >= 1) { // en la S (pulso de brillo al completarse)
        const al = Math.min(1, alfaS(i, tiempo) * (1 + 0.4 * pulso)) * aparicion;
        if (al >= 0.01) punto(i, sX[i], sY[i], al, sZ[i] * (1 + 0.25 * pulso));
        continue;
      }
      // En viaje: se enroscan alrededor del centro en el sentido de los brazos
      const sxp = sX[i], syp = sY[i];
      const eR = entradaSalida(uS), eA = 1 - (1 - uS) * (1 - uS);
      const r0 = Math.hypot(gxp - hx, gyp - hy), r1 = Math.hypot(sxp - hx, syp - hy);
      const a0 = Math.atan2(gyp - hy, gxp - hx), a1 = Math.atan2(syp - hy, sxp - hx);
      const giro = ((a1 - a0) % 6.2832 + 6.2832) % 6.2832 + (galR[i] > 0.55 ? 6.2832 : 0);
      const rr = mezclar(r0, r1, eR), aa = a0 + giro * eA;
      let al = mezclar(alfaGalaxia(i, tiempo), alfaS(i, tiempo), eR);
      al = Math.min(1, al * (1 + 0.35 * Math.sin(Math.PI * uS))) * aparicion;
      if (al < 0.01) continue;
      punto(i, hx + Math.cos(aa) * rr, hy + Math.sin(aa) * rr, al, mezclar(1, sZ[i], eR));
    }

    dibujarLuz();
    if (chispas.length) dibujarChispas(dt);
    ctx.globalAlpha = 1;
  }

  /* --- Qué hay que rehacer según el valor que cambió --- */
  const REHACER_TODO = new Set(['estrellasGalaxia', 'estrellasCampo', 'nucleoDensidad', 'nucleoTamano', 'nucleoConcentracion', 'nucleoClaro',
    'brazos', 'enroscado', 'anchoBrazos', 'franjasOscuras', 'violetasCampo', 'violetasGalaxia', 'pctAzul', 'pctCeleste', 'pctCelesteClaro', 'pctBlanco']);
  const REHACER_NEBULOSA = new Set(['nebulosa', 'colorNebulosa1', 'colorNebulosa2', 'colorCentroNucleo']);
  let esperaTodo = 0, esperaNebulosa = 0;

  function aplicar(clave, valor) {
    cfg[clave] = valor;
    if (REHACER_TODO.has(clave)) {
      clearTimeout(esperaTodo);
      esperaTodo = setTimeout(rehacerTodo, 90);
    } else if (REHACER_NEBULOSA.has(clave)) {
      clearTimeout(esperaNebulosa);
      esperaNebulosa = setTimeout(() => { if (listo) crearNebulosa(); }, 60);
    }
  }

  /* Cada modo (escritorio y celular) guarda sus propias cantidades */
  const porModo = { escritorio: {}, celular: {} };
  CLAVES_POR_MODO.forEach((k) => { porModo.escritorio[k] = BASE[k]; porModo.celular[k] = MOVIL[k]; });

  function ponerCelular(activo) {
    const de = celular ? 'celular' : 'escritorio';
    CLAVES_POR_MODO.forEach((k) => { porModo[de][k] = cfg[k]; });
    celular = !!activo;
    const a = celular ? 'celular' : 'escritorio';
    CLAVES_POR_MODO.forEach((k) => { cfg[k] = porModo[a][k]; });
    document.body.classList.toggle('celular', celular);
    requestAnimationFrame(rehacerTodo);
  }

  function exportar() {
    const modo = celular ? 'celular' : 'escritorio';
    CLAVES_POR_MODO.forEach((k) => { porModo[modo][k] = cfg[k]; });
    return {
      modoActual: modo,
      valores: Object.assign({}, cfg),
      porModo: JSON.parse(JSON.stringify(porModo))
    };
  }

  function importar(datos) {
    if (!datos || !datos.valores) return;
    Object.keys(BASE).forEach((k) => { if (k in datos.valores) cfg[k] = datos.valores[k]; });
    if (datos.porModo) {
      ['escritorio', 'celular'].forEach((m) => {
        CLAVES_POR_MODO.forEach((k) => { if (datos.porModo[m] && k in datos.porModo[m]) porModo[m][k] = datos.porModo[m][k]; });
      });
    }
    celular = datos.modoActual === 'celular';
    CLAVES_POR_MODO.forEach((k) => { cfg[k] = porModo[celular ? 'celular' : 'escritorio'][k]; });
    document.body.classList.toggle('celular', celular);
  }

  function restablecer() {
    Object.assign(cfg, BASE);
    CLAVES_POR_MODO.forEach((k) => { porModo.escritorio[k] = BASE[k]; porModo.celular[k] = MOVIL[k]; });
    if (celular) CLAVES_POR_MODO.forEach((k) => { cfg[k] = MOVIL[k]; });
    reproduccion = 0;
    rehacerTodo();
  }

  new ResizeObserver(() => { if (imagenS) medir(); }).observe(marco);

  window.LabGalaxia = {
    cfg, BASE, NOMBRES, COLORES,
    aplicar, rehacerTodo, ponerCelular, exportar, importar, restablecer,
    esCelular: () => celular,
    reproducir(direccion) { reproduccion = direccion; },
    alCambiarProgreso(fn) { alCambiarProgreso = fn; },
    arrancar() {
      const img = new Image();
      img.onload = () => { imagenS = img; rehacerTodo(); };
      img.onerror = () => { document.getElementById('aviso').textContent = 'No se pudo cargar la S. Abrí el laboratorio con el servidor, no como archivo.'; };
      img.src = 'isologo-s-muestreo.png';
      requestAnimationFrame(cuadro);
    }
  };
})();
