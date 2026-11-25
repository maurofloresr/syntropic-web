/* Panel de controles del laboratorio de las manos (misma forma que el de la
   galaxia, hecho a mano, sin librerías) */
(function () {
  'use strict';
  const L = window.LabManos;
  const GUARDADO = 'lab-manos-v1';
  const $ = (id) => document.getElementById(id);

  const MANOS = { abierta: 'La imagen tal cual (abierta)', cierra: 'Entra abierta y se cierra al tocarse' };

  /* Cada sección del panel. tipo: rango (por defecto), opcion o progreso.
     general: vale igual para mobile y desktop. El resto se guarda por modo. */
  const SECCIONES = [
    { titulo: 'Avance del scroll', abierta: true, botones: true, controles: [
      { k: 'progreso', tipo: 'progreso', e: 'Avance (simula el scroll)', min: 0, max: 100, paso: 0.1, unidad: '%', decimales: 1, nota: 'También podés scrollear de verdad sobre la página.' },
      { k: 'velocidadScroll', general: true, e: 'Velocidad del scroll simulado', min: 100, max: 3000, paso: 50, unidad: ' px/s' }
    ] },
    { titulo: 'Mano humana', abierta: true, controles: [
      { k: 'mano', general: true, tipo: 'opcion', e: 'Qué mano se ve', opciones: MANOS, nota: 'La imagen viene abierta y con el pulgar arriba; la referencia está cerrada. "Se cierra" usa la mano humana recortada de la referencia para la pose final.' },
      { k: 'manoEscala', e: 'Escala', min: 0.4, max: 1.4, paso: 0.005 },
      { k: 'manoX', e: 'Posición X', min: -500, max: 700, paso: 1 },
      { k: 'manoY', e: 'Posición Y', min: -400, max: 400, paso: 1 },
      { k: 'manoGiro', e: 'Giro', min: -20, max: 20, paso: 0.25, unidad: '°', nota: 'Escala, X, Y y giro mueven la imagen abierta respecto de la mano de bytes.' },
      { k: 'manoSombra', e: 'Sombra navy encima', min: 0, max: 0.7, paso: 0.01, pct: true, nota: '0% es el color natural. Sirve para bajar la luz de la foto.' }
    ] },
    { titulo: 'Mano de código', abierta: true, controles: [
      { k: 'particulas', e: 'Cantidad de partículas', min: 300, max: 6000, paso: 50 },
      { k: 'tamano', e: 'Tamaño de los 0 y 1', min: 3, max: 18, paso: 0.25, unidad: ' px' },
      { k: 'umbral', e: 'Umbral del filtro de color', min: 8, max: 80, paso: 1, unidad: '%', nota: 'Más bajo: entran también los celestes oscuros. Más alto: solo lo más brillante.' },
      { k: 'estela', e: 'Cuánta estela se incluye', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'brilloBytes', e: 'Brillo de los bytes', min: 0.3, max: 2, paso: 0.05, x: true },
      { k: 'fondoPulgar', e: 'Fondo oscuro del pulgar y los dedos', min: 0, max: 1, paso: 0.01, pct: true, nota: 'Sin fondo, los 0 y 1 no se leen sobre la piel.' }
    ] },
    { titulo: 'Flujo de bytes inicial', controles: [
      { k: 'rioVelocidad', e: 'Velocidad', min: 0, max: 500, paso: 5 },
      { k: 'rioDensidad', e: 'Densidad', min: 0, max: 100, paso: 1, unidad: '%' },
      { k: 'rioAncho', e: 'Ancho', min: 10, max: 350, paso: 5 },
      { k: 'rioLargo', e: 'Largo al inicio', min: 150, max: 1200, paso: 10 }
    ] },
    { titulo: 'Tramos del scroll', controles: [
      { k: 'pin', e: 'Largo del pin', min: 60, max: 500, paso: 5, unidad: '% del alto' },
      { k: 'tEntrada', e: 'Entrada', min: 0, max: 60, paso: 1, tramo: 0 },
      { k: 'tFormacion', e: 'Formación', min: 1, max: 60, paso: 1, tramo: 1 },
      { k: 'tContacto', e: 'Contacto', min: 0, max: 60, paso: 1, tramo: 2 },
      { k: 'tSacudida', e: 'Sacudida', min: 0, max: 60, paso: 1, tramo: 3 },
      { k: 'tQuietud', e: 'Quietud', min: 0, max: 60, paso: 1, tramo: 4, nota: 'No hace falta que sumen 100: se reparten en proporción. El número es el porcentaje real de cada tramo.' }
    ] },
    { titulo: 'Sacudida', controles: [
      { k: 'sacudidas', e: 'Cantidad de movimientos', min: 1, max: 8, paso: 1 },
      { k: 'amplitud', e: 'Amplitud', min: 0, max: 60, paso: 1, unidad: ' px' }
    ] },
    { titulo: 'Brillo', controles: [
      { k: 'brilloBorde', e: 'Borde de la mano humana', min: 0, max: 1.3, paso: 0.05, x: true },
      { k: 'brilloAncho', e: 'Ancho del borde', min: 1, max: 50, paso: 1, unidad: ' px' },
      { k: 'pulso', e: 'Pulso del contacto', min: 0, max: 2.5, paso: 0.05, x: true }
    ] },
    { titulo: 'Escena (lugar en la pantalla)', controles: [
      { k: 'escenaAncho', e: 'Tamaño', min: 30, max: 300, paso: 1, unidad: '% del ancho' },
      { k: 'escenaX', e: 'Centro del apretón, X', min: 0, max: 100, paso: 0.5, unidad: '%' },
      { k: 'escenaY', e: 'Centro del apretón, Y', min: 0, max: 100, paso: 0.5, unidad: '%' },
      { k: 'fundidoDesde', e: 'El brazo se pierde: desde', min: 0, max: 80, paso: 0.5, unidad: '% del ancho' },
      { k: 'fundidoAncho', e: 'El brazo se pierde: largo', min: 0, max: 50, paso: 0.5, unidad: '% del ancho', nota: 'Para que la manga no pise el texto. Con 0 y 0 no hay fundido.' }
    ] }
  ];

  const raiz = $('controles'), aviso = $('aviso');
  const titulo = document.querySelector('.panel-cabecera strong');
  const salidas = {}, entradas = {};
  const valor = (c) => (c.general ? L.general[c.k] : L.cfg()[c.k]);

  function formato(c, v) {
    if (c.tramo != null) {
      const f = L.tramos();
      return Math.round((f[c.tramo] - (c.tramo ? f[c.tramo - 1] : 0)) * 100) + '%';
    }
    if (c.pct) return Math.round(v * 100) + '%';
    if (c.x) return Number(v).toFixed(2) + '×';
    const dec = c.decimales != null ? c.decimales : (c.paso >= 1 ? 0 : String(c.paso).split('.')[1].length);
    return Number(v).toFixed(dec) + (c.unidad || '');
  }

  function guardar() {
    try { localStorage.setItem(GUARDADO, JSON.stringify(L.exportar())); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function ponerNota(caja, c) {
    if (!c.nota) return;
    const n = document.createElement('div');
    n.className = 'nota';
    n.textContent = c.nota;
    caja.appendChild(n);
  }

  function crearControl(c) {
    const caja = document.createElement('div');
    caja.className = 'control';
    const id = 'c-' + c.k;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = c.e;

    if (c.tipo === 'opcion') {
      const fila = document.createElement('div');
      fila.className = 'control-color';
      const sel = document.createElement('select');
      sel.id = id;
      Object.keys(c.opciones).forEach((n) => {
        const o = document.createElement('option');
        o.value = n; o.textContent = c.opciones[n];
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => { L.aplicar(c.k, sel.value); guardar(); });
      fila.appendChild(sel);
      caja.append(label, fila);
      ponerNota(caja, c);
      entradas[c.k] = { el: sel, c };
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
      if (c.tipo === 'progreso') {
        L.irA(v / 100);
        salida.textContent = formato(c, v);
        return;
      }
      L.aplicar(c.k, v);
      if (c.tramo != null) refrescar(); // cambia el porcentaje de todos
      else salida.textContent = formato(c, v);
      guardar();
    });
    caja.append(label, rango);
    ponerNota(caja, c);
    salidas[c.k] = { el: salida, c };
    entradas[c.k] = { el: rango, c };
    return caja;
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

  /* Muestra en el panel los valores del modo actual */
  function refrescar() {
    Object.keys(entradas).forEach((k) => {
      const { el, c } = entradas[k];
      if (c.tipo === 'progreso') { el.disabled = L.esReducido(); return; }
      el.value = valor(c);
      if (salidas[k]) salidas[k].el.textContent = formato(c, valor(c));
    });
    const b = $('celular');
    b.setAttribute('aria-pressed', String(L.esSimulado()));
    b.textContent = L.esSimulado() ? 'Simulando celular (390 px)' : 'Simular celular';
    titulo.textContent = 'Laboratorio de las manos: ' + (L.esCelular() ? 'mobile' : 'desktop');
    if (L.esReducido()) avisar('Movimiento reducido activado en este equipo: se ve la pose final, quieta.', true);
  }

  // El scroll (real o simulado) mueve el control
  function mostrarProgreso(p) {
    entradas.progreso.el.value = p * 100;
    salidas.progreso.el.textContent = formato(salidas.progreso.c, p * 100);
  }
  L.alCambiarProgreso(mostrarProgreso);
  L.alCambiarModo = refrescar;

  /* --- Botones de arriba --- */
  let esperaAviso = 0;
  function avisar(texto, queda) {
    aviso.textContent = texto;
    clearTimeout(esperaAviso);
    if (!queda) esperaAviso = setTimeout(() => { aviso.textContent = ''; }, 3500);
  }

  $('celular').addEventListener('click', () => {
    L.ponerSimulado(!L.esSimulado());
    refrescar();
    guardar();
  });

  $('restablecer').addEventListener('click', () => {
    L.restablecer();
    refrescar();
    guardar();
    avisar('Valores iniciales restablecidos.');
  });

  $('copiar').addEventListener('click', () => {
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

  const panel = $('panel'), mostrar = $('mostrar');
  $('ocultar').addEventListener('click', () => {
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
  mostrarProgreso(0);
  L.arrancar();
})();
