/* Panel de controles del laboratorio (hecho a mano, sin librerías) */
(function () {
  'use strict';
  const L = window.LabGalaxia;
  const cfg = L.cfg;
  const GUARDADO = 'lab-galaxia-v1';

  const ETIQUETAS_COLOR = {
    azul: 'Azul eléctrico #0040FF',
    celeste: 'Celeste #47ADFF',
    celesteClaro: 'Celeste claro #A0D3FD',
    blanco: 'Blanco #FFFFFF',
    violeta: 'Violeta #B49CF0'
  };

  /* Cada sección del panel. tipo: rango (por defecto) o color.
     nota: aclaración chica debajo del control. */
  const SECCIONES = [
    { titulo: 'Estrellas', abierta: true, controles: [
      { k: 'estrellasGalaxia', e: 'Estrellas de la galaxia', min: 100, max: 6000, paso: 50, nota: 'Web hoy: 2500 en escritorio (1800 en compus de 4 núcleos o menos), 900 en celular.' },
      { k: 'estrellasCampo', e: 'Estrellas de campo (candidatas)', min: 0, max: 4000, paso: 50, nota: 'Llenan el hero. Se ve una parte, más juntas cerca de la galaxia.' },
      { k: 'tamanoEstrellas', e: 'Tamaño', min: 0.3, max: 3, paso: 0.05, x: true },
      { k: 'brilloEstrellas', e: 'Brillo', min: 0.2, max: 2, paso: 0.05, x: true },
      { k: 'titileo', e: 'Titileo (intensidad)', min: 0, max: 2.5, paso: 0.05, x: true },
      { k: 'velocidadTitileo', e: 'Titileo (velocidad)', min: 0, max: 4, paso: 0.05, x: true }
    ] },
    { titulo: 'Núcleo', controles: [
      { k: 'nucleoDensidad', e: 'Densidad (parte de las estrellas en el núcleo)', min: 0, max: 0.7, paso: 0.01, pct: true },
      { k: 'nucleoTamano', e: 'Tamaño (radio)', min: 0.05, max: 0.6, paso: 0.01 },
      { k: 'nucleoConcentracion', e: 'Concentración hacia el centro', min: 0.5, max: 5, paso: 0.1 },
      { k: 'nucleoClaro', e: 'Estrellas del núcleo que pasan a blanco o celeste claro', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'brilloNucleo', e: 'Brillo de fondo del núcleo', min: 0, max: 3, paso: 0.05, x: true }
    ] },
    { titulo: 'Brazos', controles: [
      { k: 'brazos', e: 'Cantidad de brazos', min: 1, max: 6, paso: 1 },
      { k: 'enroscado', e: 'Cuánto se enroscan', min: 0, max: 5, paso: 0.05 },
      { k: 'anchoBrazos', e: 'Ancho', min: 0.2, max: 3, paso: 0.05, x: true },
      { k: 'franjasOscuras', e: 'Franjas oscuras entre brazos', min: 0, max: 1, paso: 0.01, pct: true, nota: '50% es lo de hoy (20% de las estrellas entre brazos). 100%: nada entre brazos.' }
    ] },
    { titulo: 'Rotación', controles: [
      { k: 'rotacion', e: 'Velocidad de giro (radianes por segundo)', min: 0, max: 0.4, paso: 0.005, nota: '0,05 = una vuelta cada 2 minutos.' }
    ] },
    { titulo: 'Nebulosa y violetas', controles: [
      { k: 'nebulosa', e: 'Intensidad de la nebulosa', min: 0, max: 3, paso: 0.05, x: true },
      { k: 'violetasCampo', e: 'Violetas en las estrellas de campo', min: 0, max: 30, paso: 0.5, unidad: '%', nota: 'Lo aprobado: alrededor del 3%, solo en estrellas sueltas.' },
      { k: 'violetasGalaxia', e: 'Violetas en la galaxia', min: 0, max: 30, paso: 0.5, unidad: '%', nota: 'Hoy 0%. Usarlo sería ampliar la excepción del violeta.' }
    ] },
    { titulo: 'Colores', controles: [
      { k: 'pctAzul', e: 'Estrellas azul eléctrico', min: 0, max: 100, paso: 1, unidad: '%', nota: 'Las cuatro se reparten en proporción (no hace falta que sumen 100).' },
      { k: 'pctCeleste', e: 'Estrellas celeste', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'pctCelesteClaro', e: 'Estrellas celeste claro', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'pctBlanco', e: 'Estrellas blancas', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'colorBrilloNucleo', e: 'Brillo de fondo del núcleo', tipo: 'color' },
      { k: 'colorCentroNucleo', e: 'Centro del núcleo (nebulosa)', tipo: 'color' },
      { k: 'colorNebulosa1', e: 'Nebulosa: color principal de los brazos', tipo: 'color' },
      { k: 'colorNebulosa2', e: 'Nebulosa: color secundario', tipo: 'color' },
      { k: 'colorGlowS', e: 'Brillo detrás de la S', tipo: 'color' }
    ] },
    { titulo: 'Supernova', controles: [
      { k: 'supernovaTamano', e: 'Tamaño (radio de la onda)', min: 30, max: 300, paso: 1, unidad: ' px', nota: 'Web hoy: 115 px en escritorio, 85 en celular. Pasá el mouse por la galaxia (con el progreso de la S en 0).' },
      { k: 'supernovaFuerza', e: 'Fuerza del empuje', min: 0, max: 2, paso: 0.01 },
      { k: 'supernovaRegreso', e: 'Velocidad de regreso de las estrellas', min: 10, max: 300, paso: 1, nota: '90 es lo de hoy. Más alto vuelven más rápido.' }
    ] },
    { titulo: 'Transición galaxia > S', abierta: true, controles: [
      { k: 'progresoS', e: 'Progreso de la S (simula el scroll)', min: 0, max: 100, paso: 0.1, unidad: '%', decimales: 1 },
      { k: 'escalonado', e: 'Escalonado de las salidas', min: 0, max: 0.9, paso: 0.01, pct: true, nota: 'Hoy 60%: las del centro salen primero y las de afuera hasta el 60% del tramo. Cada una viaja el resto (40%).' },
      { k: 'largoTramo', e: 'Duración: largo del tramo de scroll', min: 10, max: 150, paso: 1, unidad: '% del alto', nota: 'Hoy 45% del alto de pantalla (78% del pin de 60%). Se nota con "Simular scroll".' },
      { k: 'velocidadScroll', e: 'Velocidad del scroll simulado', min: 200, max: 4000, paso: 50, unidad: ' px/s' }
    ], botones: true }
  ];

  const raiz = document.getElementById('controles');
  const salidas = {}, entradas = {}, muestras = {};

  function formato(c, v) {
    if (c.pct) return Math.round(v * 100) + '%';
    if (c.x) return Number(v).toFixed(2) + '×';
    const dec = c.decimales != null ? c.decimales : (c.paso >= 1 ? 0 : String(c.paso).split('.')[1].length);
    return Number(v).toFixed(dec) + (c.unidad || '');
  }

  function guardar() {
    try { localStorage.setItem(GUARDADO, JSON.stringify(L.exportar())); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function crearControl(c) {
    const caja = document.createElement('div');
    caja.className = 'control';
    const id = 'c-' + c.k;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = c.e;

    if (c.tipo === 'color') {
      caja.appendChild(label);
      const fila = document.createElement('div');
      fila.className = 'control-color';
      const muestra = document.createElement('span');
      muestra.className = 'muestra';
      const sel = document.createElement('select');
      sel.id = id;
      L.NOMBRES.forEach((n) => {
        const o = document.createElement('option');
        o.value = n; o.textContent = ETIQUETAS_COLOR[n];
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => {
        L.aplicar(c.k, sel.value);
        pintarMuestra(c.k);
        guardar();
      });
      fila.append(muestra, sel);
      caja.appendChild(fila);
      entradas[c.k] = sel; muestras[c.k] = muestra;
      return caja;
    }

    const salida = document.createElement('output');
    salida.htmlFor = id;
    label.appendChild(salida);
    const rango = document.createElement('input');
    rango.type = 'range';
    rango.id = id;
    rango.min = c.min; rango.max = c.max; rango.step = c.paso;
    rango.addEventListener('input', () => {
      const v = Number(rango.value);
      if (c.k === 'progresoS') L.reproducir(0); // mover a mano corta la simulación
      L.aplicar(c.k, v);
      salida.textContent = formato(c, v);
      guardar();
    });
    caja.append(label, rango);
    if (c.nota) {
      const n = document.createElement('div');
      n.className = 'nota';
      n.textContent = c.nota;
      caja.appendChild(n);
    }
    salidas[c.k] = { el: salida, c };
    entradas[c.k] = rango;
    return caja;
  }

  function pintarMuestra(k) {
    const rgb = L.COLORES[cfg[k]];
    muestras[k].style.background = 'rgb(' + rgb.join(',') + ')';
  }

  SECCIONES.forEach((s) => {
    const d = document.createElement('details');
    if (s.abierta) d.open = true;
    const sum = document.createElement('summary');
    sum.textContent = s.titulo;
    d.appendChild(sum);
    s.controles.forEach((c) => d.appendChild(crearControl(c)));
    if (s.botones) {
      const fila = document.createElement('div');
      fila.className = 'fila-botones';
      const bajar = document.createElement('button');
      bajar.type = 'button'; bajar.className = 'boton'; bajar.textContent = 'Simular scroll hacia abajo';
      bajar.addEventListener('click', () => L.reproducir(1));
      const subir = document.createElement('button');
      subir.type = 'button'; subir.className = 'boton'; subir.textContent = 'Hacia arriba';
      subir.addEventListener('click', () => L.reproducir(-1));
      fila.append(bajar, subir);
      d.appendChild(fila);
    }
    raiz.appendChild(d);
  });

  /* Muestra en el panel los valores actuales de cfg */
  function refrescar() {
    Object.keys(entradas).forEach((k) => {
      entradas[k].value = cfg[k];
      if (salidas[k]) salidas[k].el.textContent = formato(salidas[k].c, cfg[k]);
      if (muestras[k]) pintarMuestra(k);
    });
    const b = document.getElementById('celular');
    b.setAttribute('aria-pressed', String(L.esCelular()));
    b.textContent = L.esCelular() ? 'Simulando celular (390 px)' : 'Simular celular';
  }

  // El progreso avanza solo con "Simular scroll": el control lo acompaña
  let ultimoRefresco = 0;
  L.alCambiarProgreso((p) => {
    const ahora = performance.now();
    if (ahora - ultimoRefresco < 30 && p > 0 && p < 100) return;
    ultimoRefresco = ahora;
    entradas.progresoS.value = p;
    salidas.progresoS.el.textContent = formato(salidas.progresoS.c, p);
    if (p <= 0 || p >= 100) guardar();
  });

  /* --- Botones de arriba --- */
  const aviso = document.getElementById('aviso');
  let esperaAviso = 0;
  function avisar(texto) {
    aviso.textContent = texto;
    clearTimeout(esperaAviso);
    esperaAviso = setTimeout(() => { aviso.textContent = ''; }, 3500);
  }

  document.getElementById('celular').addEventListener('click', () => {
    L.ponerCelular(!L.esCelular());
    refrescar();
    guardar();
  });

  document.getElementById('restablecer').addEventListener('click', () => {
    L.restablecer();
    refrescar();
    guardar();
    avisar('Valores de la web de hoy restablecidos.');
  });

  document.getElementById('copiar').addEventListener('click', () => {
    const texto = JSON.stringify(L.exportar(), null, 2);
    function respaldo() {
      // Sin acceso al portapapeles (por ejemplo, abierto desde el celu con
      // la IP de la PC): se copia con un campo de texto temporal
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      avisar(ok ? 'Configuración copiada.' : 'No se pudo copiar. Abrí la consola: está impresa ahí.');
      if (!ok) console.log(texto);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(() => avisar('Configuración copiada.'), respaldo);
    } else respaldo();
  });

  const panel = document.getElementById('panel');
  const mostrar = document.getElementById('mostrar');
  document.getElementById('ocultar').addEventListener('click', () => {
    document.body.classList.add('sin-panel');
    mostrar.hidden = false;
    mostrar.focus();
  });
  mostrar.addEventListener('click', () => {
    document.body.classList.remove('sin-panel');
    mostrar.hidden = true;
    panel.querySelector('#ocultar').focus();
  });

  /* Recupera lo último que se probó en este navegador */
  try {
    const previo = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
    if (previo) L.importar(previo);
  } catch (e) { /* nada guardado o almacenamiento bloqueado */ }
  refrescar();
  L.arrancar();
})();
