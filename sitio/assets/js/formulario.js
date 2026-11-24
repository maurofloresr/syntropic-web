/* ==========================================================================
   Syntropic: formulario por pasos (docs/paginas-servicio.md, sección
   "Formulario completo"). UN solo componente para la landing y las tres
   páginas de servicio.

   En el HTML:
     <div class="formulario-lugar" data-formulario data-servicio="web"></div>
   data-servicio (opcional): servicio que arranca marcado en esa página.

   Pasos: servicios > negocio > una pantalla por servicio marcado >
   presupuesto y plazo > contacto > gracias. "Paso X de N" se ajusta solo.

   Servicio ya marcado al llegar:
   - desde un botón o link con data-servicio en la misma página;
   - desde otra página, con ?servicio=web (o automatizaciones, sistemas).

   Envío: FALTA (webhook de Make y evento Lead). Al terminar, las respuestas
   quedan en un objeto listo para enviar: evento "syntropic:formulario" del
   documento (detail) y SyntropicFormulario.respuestas().
   ========================================================================== */
(function () {
  'use strict';

  var lugar = document.querySelector('[data-formulario]');
  if (!lugar) return;

  var ICONOS = new URL('../img/iconos.svg', document.currentScript.src).pathname;
  var reducido = !!(window.Syntropic && window.Syntropic.reducido);

  /* ======================= Contenido ======================= */
  var SERVICIOS = [
    { id: 'web', nombre: 'Desarrollo web', corto: 'Web', icono: 'web-dispositivos', texto: 'Una web profesional que te haga encontrar y vender.' },
    { id: 'automatizaciones', nombre: 'Automatizaciones', corto: 'Automatización', icono: 'waypoints', texto: 'Que las tareas repetitivas se hagan solas.' },
    { id: 'sistemas', nombre: 'Sistemas', corto: 'Sistema', icono: 'layout-dashboard', texto: 'Un sistema a medida para ordenar tu negocio.' }
  ];

  // tipo: texto | parrafo | numero | una (fichas, se elige una) | varias
  var PASOS = [
    { id: 'servicios', titulo: '¿Qué estás buscando?', aclaracion: 'Podés elegir más de uno.' },
    {
      id: 'negocio', titulo: 'Tu negocio', campos: [
        { id: 'negocio_nombre', tipo: 'texto', etiqueta: 'Nombre del negocio', completar: 'organization' },
        { id: 'negocio_rubro', tipo: 'texto', etiqueta: 'Rubro' },
        { id: 'negocio_link', tipo: 'texto', etiqueta: '¿Tenés web o redes?', ayuda: 'Pegá el link.', opcional: true, teclado: 'url' }
      ]
    },
    {
      id: 'web', servicio: 'web', titulo: 'Desarrollo web', campos: [
        { id: 'web_marca', tipo: 'una', etiqueta: '¿Tenés identidad de marca?', opciones: ['Sí, logo y colores', 'Solo logo', 'No, necesito branding'] },
        { id: 'web_necesita', tipo: 'una', etiqueta: '¿Qué necesitás?', opciones: ['Web informativa', 'Tienda online', 'No sé, quiero que me orienten'] },
        { id: 'web_tiene', tipo: 'una', etiqueta: '¿Tenés web hoy?', opciones: ['Sí', 'No'] },
        { id: 'web_link', tipo: 'texto', etiqueta: 'Link de tu web', teclado: 'url', si: { campo: 'web_tiene', vale: 'Sí' } }
      ]
    },
    {
      id: 'automatizaciones', servicio: 'automatizaciones', titulo: 'Automatizaciones', campos: [
        { id: 'auto_tarea', tipo: 'parrafo', etiqueta: '¿Qué tarea te gustaría que se haga sola?', ejemplo: 'Por ejemplo: pasar a una planilla los pedidos que llegan por WhatsApp.' },
        { id: 'auto_herramientas', tipo: 'varias', etiqueta: '¿Qué herramientas usás hoy?', opciones: ['WhatsApp', 'Instagram', 'Gmail', 'Google Sheets o Excel', 'Tiendanube', 'Mercado Pago', 'Otra'] }
      ]
    },
    {
      id: 'sistemas', servicio: 'sistemas', titulo: 'Sistemas', campos: [
        { id: 'sis_hoy', tipo: 'una', etiqueta: '¿Cómo te organizás hoy?', opciones: ['Planillas', 'Cuaderno', 'Un sistema que no se adapta', 'Nada'] },
        { id: 'sis_controlar', tipo: 'varias', etiqueta: '¿Qué querés controlar?', opciones: ['Ventas', 'Stock', 'Caja', 'Compras', 'Clientes', 'Producción', 'Otro'] },
        { id: 'sis_personas', tipo: 'numero', etiqueta: '¿Cuántas personas lo usarían?' }
      ]
    },
    {
      id: 'presupuesto', titulo: 'Presupuesto y plazo', campos: [
        // Sin rangos no se puede elegir: el marcador queda visible y no frena el avance
        { id: 'presupuesto', tipo: 'una', etiqueta: 'Presupuesto aproximado', opciones: [], falta: '[FALTA: rangos de presupuesto]' },
        { id: 'plazo', tipo: 'una', etiqueta: '¿Para cuándo lo necesitás?', opciones: ['Urgente', 'En un mes', 'Sin apuro'] }
      ]
    },
    {
      id: 'contacto', titulo: 'Contacto', campos: [
        { id: 'contacto_nombre', tipo: 'texto', etiqueta: 'Nombre', completar: 'name' },
        { id: 'contacto_whatsapp', tipo: 'texto', etiqueta: 'WhatsApp', teclado: 'tel', completar: 'tel', valida: 'telefono' },
        { id: 'contacto_mail', tipo: 'texto', etiqueta: 'Mail', teclado: 'email', completar: 'email', valida: 'mail' }
      ]
    }
  ];

  var ERRORES = {
    servicios: 'Elegí al menos una opción para seguir.',
    una: 'Elegí una opción.',
    varias: 'Elegí al menos una opción.',
    texto: 'Completá este dato.',
    parrafo: 'Contanos qué tarea.',
    numero: 'Poné un número.',
    telefono: 'Revisá el número: falta algún dígito.',
    mail: 'Revisá el mail: parece incompleto.'
  };

  /* ======================= Armado del HTML ======================= */
  function icono(id, clase) {
    return '<svg class="icono ' + (clase || '') + '" aria-hidden="true"><use href="' + ICONOS + '#i-' + id + '"></use></svg>';
  }

  function htmlServicios() {
    return '<div class="opciones">' + SERVICIOS.map(function (s) {
      return '<label class="opcion">' +
        '<input class="opcion-input" type="checkbox" name="servicio" value="' + s.id + '">' +
        icono(s.icono, 'opcion-icono') +
        '<span class="opcion-titulo">' + s.nombre + '</span>' +
        '<span class="opcion-texto">' + s.texto + '</span>' +
        icono('check', 'opcion-check') +
        '</label>';
    }).join('') + '</div>' +
    '<p class="campo-error" data-error="servicios" id="error-servicios" hidden></p>';
  }

  function htmlCampo(c) {
    var opcional = c.opcional ? ' <span class="campo-opcional">(opcional)</span>' : '';
    var error = '<p class="campo-error" data-error="' + c.id + '" id="error-' + c.id + '" hidden></p>';
    if (c.tipo === 'una' || c.tipo === 'varias') {
      var entrada = c.tipo === 'una' ? 'radio' : 'checkbox';
      return '<fieldset class="campo" data-campo="' + c.id + '">' +
        '<legend class="campo-etiqueta">' + c.etiqueta + (c.tipo === 'varias' ? ' <span class="campo-opcional">(podés elegir varias)</span>' : '') + '</legend>' +
        (c.falta ? '<p class="formulario-falta">' + c.falta + '</p>' : '') +
        '<div class="fichas">' + c.opciones.map(function (o) {
          return '<label class="ficha"><input class="opcion-input" type="' + entrada + '" name="' + c.id + '" value="' + o + '"><span>' + o + '</span></label>';
        }).join('') + '</div>' + error + '</fieldset>';
    }
    var describe = 'error-' + c.id + (c.ayuda ? ' ayuda-' + c.id : '');
    var comunes = ' id="campo-' + c.id + '" name="' + c.id + '" class="campo-entrada" aria-describedby="' + describe + '"' + (c.completar ? ' autocomplete="' + c.completar + '"' : ' autocomplete="off"');
    var control;
    if (c.tipo === 'parrafo') {
      control = '<textarea rows="4" maxlength="1000"' + comunes + ' placeholder="' + (c.ejemplo || '') + '"></textarea>';
    } else if (c.tipo === 'numero') {
      control = '<input type="text" inputmode="numeric" maxlength="4"' + comunes + '>';
    } else {
      control = '<input type="' + (c.teclado === 'tel' || c.teclado === 'email' ? c.teclado : 'text') + '"' + (c.teclado ? ' inputmode="' + c.teclado + '"' : '') + ' maxlength="200"' + comunes + '>';
    }
    return '<div class="campo" data-campo="' + c.id + '"' + (c.si ? ' hidden' : '') + '>' +
      '<label class="campo-etiqueta" for="campo-' + c.id + '">' + c.etiqueta + opcional + '</label>' +
      (c.ayuda ? '<p class="campo-ayuda" id="ayuda-' + c.id + '">' + c.ayuda + '</p>' : '') +
      control + error + '</div>';
  }

  function htmlPaso(p, i) {
    return '<fieldset class="formulario-pregunta" data-paso="' + p.id + '"' + (i ? ' hidden' : '') + '>' +
      '<legend tabindex="-1">' + p.titulo + '</legend>' +
      (p.aclaracion ? '<p class="formulario-aclaracion">' + p.aclaracion + '</p>' : '') +
      (p.id === 'servicios' ? htmlServicios() : '<div class="campos">' + p.campos.map(htmlCampo).join('') + '</div>') +
      '</fieldset>';
  }

  lugar.innerHTML =
    '<form class="formulario tarjeta-vidrio" action="#" novalidate>' +
      '<div class="formulario-progreso">' +
        '<progress class="formulario-barra" value="1" max="5" aria-labelledby="formulario-paso"></progress>' +
        '<p class="formulario-paso" id="formulario-paso" aria-live="polite">Paso 1 de 5</p>' +
      '</div>' +
      PASOS.map(htmlPaso).join('') +
      '<div class="formulario-pie">' +
        '<p class="etiqueta-integral" aria-live="polite" hidden></p>' +
        '<div class="formulario-botones">' +
          '<button class="formulario-atras" type="button" hidden>Atrás</button>' +
          '<button class="boton formulario-siguiente" type="submit"><span>Siguiente</span>' + icono('arrow-right') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="formulario-gracias" tabindex="-1" hidden>' +
        '<span class="formulario-gracias-check">' + icono('check') + '</span>' +
        '<p class="formulario-gracias-titulo">¡Gracias!</p>' +
        '<p class="formulario-gracias-texto">Te respondemos en menos de 24 horas.</p>' +
        '<p class="formulario-falta">[FALTA: envío a Make y evento Lead. Por ahora las respuestas no se mandan a ningún lado]</p>' +
      '</div>' +
    '</form>';

  var form = lugar.firstChild;
  var barra = form.querySelector('.formulario-barra');
  var textoPaso = form.querySelector('.formulario-paso');
  var integral = form.querySelector('.etiqueta-integral');
  var atras = form.querySelector('.formulario-atras');
  var siguiente = form.querySelector('.formulario-siguiente');
  var gracias = form.querySelector('.formulario-gracias');
  var cajaPaso = {};
  PASOS.forEach(function (p) { cajaPaso[p.id] = form.querySelector('[data-paso="' + p.id + '"]'); });
  var actual = 'servicios';
  var terminado = false;

  /* ======================= Estado ======================= */
  function marcados(nombre) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + nombre + '"]:checked'), function (i) { return i.value; });
  }
  function valor(id) {
    var el = form.querySelector('#campo-' + id);
    return el ? el.value.trim() : '';
  }
  function servicios() { return marcados('servicio'); }

  /* Pasos que corresponden según los servicios marcados */
  function recorrido() {
    var s = servicios();
    return PASOS.filter(function (p) { return !p.servicio || s.indexOf(p.servicio) >= 0; }).map(function (p) { return p.id; });
  }
  function pasoDe(id) { return PASOS.filter(function (p) { return p.id === id; })[0]; }
  function seVe(c) { return !c.si || marcados(c.si.campo).indexOf(c.si.vale) >= 0; }

  function actualizarProgreso() {
    var r = recorrido();
    // Antes de elegir se cuenta con un servicio (Paso 1 de 5)
    var total = Math.max(r.length, 5);
    var n = r.indexOf(actual) + 1;
    barra.max = total;
    barra.value = n;
    textoPaso.textContent = 'Paso ' + n + ' de ' + total;
    barra.textContent = textoPaso.textContent;
    atras.hidden = n === 1;
    siguiente.firstChild.textContent = n === r.length && n > 1 ? 'Enviar' : 'Siguiente';
  }

  function actualizarIntegral() {
    var s = servicios();
    var ver = actual === 'servicios' && s.length > 1;
    var texto = ver ? SERVICIOS.filter(function (x) { return s.indexOf(x.id) >= 0; }).map(function (x) { return x.corto; }).join(' + ') + ': solución integral' : '';
    if (integral.textContent !== texto) integral.textContent = texto;
    integral.hidden = !ver;
  }

  function actualizarCondicionales() {
    PASOS.forEach(function (p) {
      (p.campos || []).forEach(function (c) {
        if (c.si) form.querySelector('[data-campo="' + c.id + '"]').hidden = !seVe(c);
      });
    });
  }

  /* ======================= Validación ======================= */
  function ponerError(id, texto) {
    var p = form.querySelector('[data-error="' + id + '"]');
    p.textContent = texto || '';
    p.hidden = !texto;
    var el = form.querySelector('#campo-' + id);
    if (el) { if (texto) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  }

  function errorDe(c) {
    if (!seVe(c) || c.falta) return '';
    if (c.tipo === 'una' || c.tipo === 'varias') return marcados(c.id).length ? '' : ERRORES[c.tipo];
    var v = valor(c.id);
    if (!v) return c.opcional ? '' : ERRORES[c.tipo];
    if (c.tipo === 'numero') return /^[1-9]\d*$/.test(v) ? '' : ERRORES.numero;
    if (c.valida === 'telefono') {
      var d = v.replace(/\D/g, '').length;
      return d >= 8 && d <= 15 ? '' : ERRORES.telefono;
    }
    if (c.valida === 'mail') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : ERRORES.mail;
    return '';
  }

  /* Marca los errores del paso y lleva el foco al primero */
  function validarPaso() {
    if (actual === 'servicios') {
      var falta = !servicios().length;
      ponerError('servicios', falta ? ERRORES.servicios : '');
      if (falta) form.querySelector('input[name="servicio"]').focus();
      return !falta;
    }
    var primero = null;
    pasoDe(actual).campos.forEach(function (c) {
      var e = errorDe(c);
      ponerError(c.id, e);
      if (e && !primero) primero = form.querySelector('#campo-' + c.id) || form.querySelector('input[name="' + c.id + '"]');
    });
    if (primero) primero.focus();
    return !primero;
  }

  /* ======================= Cambio de paso ======================= */
  function irArriba() {
    var menu = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--altura-menu')) || 56;
    var y = form.getBoundingClientRect().top;
    if (y < menu || y > window.innerHeight * 0.6) {
      window.scrollTo({ top: window.scrollY + y - menu - 16, behavior: reducido ? 'auto' : 'smooth' });
    }
  }

  function entrar(caja, atrasar) {
    if (reducido || !caja.animate) return;
    caja.animate([
      { opacity: 0, transform: 'translateX(' + (atrasar ? -18 : 18) + 'px)' },
      { opacity: 1, transform: 'none' }
    ], { duration: 320, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
  }

  function irA(id, opciones) {
    var r = recorrido();
    var haciaAtras = r.indexOf(id) < r.indexOf(actual);
    cajaPaso[actual].hidden = true;
    actual = id;
    var caja = cajaPaso[id];
    caja.hidden = false;
    actualizarProgreso();
    actualizarIntegral();
    if (opciones && opciones.quieto) return;
    entrar(caja, haciaAtras);
    caja.querySelector('legend').focus({ preventScroll: true });
    irArriba();
  }

  function terminar() {
    terminado = true;
    cajaPaso[actual].hidden = true;
    form.querySelector('.formulario-progreso').hidden = true;
    form.querySelector('.formulario-pie').hidden = true;
    gracias.hidden = false;
    entrar(gracias);
    gracias.focus({ preventScroll: true });
    irArriba();
    document.dispatchEvent(new CustomEvent('syntropic:formulario', { detail: respuestas() }));
    // FALTA: acá va el envío al webhook de Make y el evento Lead del Pixel
  }

  /* Objeto listo para enviar: solo lo que corresponde a lo elegido */
  function respuestas() {
    var s = servicios();
    var datos = {
      pagina: location.pathname,
      servicios: s,
      negocio: { nombre: valor('negocio_nombre'), rubro: valor('negocio_rubro'), web_o_redes: valor('negocio_link') },
      presupuesto: marcados('presupuesto')[0] || '',
      plazo: marcados('plazo')[0] || '',
      contacto: { nombre: valor('contacto_nombre'), whatsapp: valor('contacto_whatsapp'), mail: valor('contacto_mail') }
    };
    if (s.indexOf('web') >= 0) {
      datos.desarrollo_web = { identidad_de_marca: marcados('web_marca')[0] || '', necesita: marcados('web_necesita')[0] || '', tiene_web: marcados('web_tiene')[0] || '', link: marcados('web_tiene')[0] === 'Sí' ? valor('web_link') : '' };
    }
    if (s.indexOf('automatizaciones') >= 0) {
      datos.automatizaciones = { tarea: valor('auto_tarea'), herramientas: marcados('auto_herramientas') };
    }
    if (s.indexOf('sistemas') >= 0) {
      datos.sistemas = { organizacion_actual: marcados('sis_hoy')[0] || '', controlar: marcados('sis_controlar'), personas: valor('sis_personas') };
    }
    return datos;
  }

  /* ======================= Eventos ======================= */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (terminado || !validarPaso()) return;
    var r = recorrido();
    var i = r.indexOf(actual);
    if (i < r.length - 1) irA(r[i + 1]); else terminar();
  });

  atras.addEventListener('click', function () {
    var r = recorrido();
    var i = r.indexOf(actual);
    if (i > 0) irA(r[i - 1]);
  });

  // Al corregir, el error se va solo
  form.addEventListener('input', function (e) {
    var nombre = e.target.name === 'servicio' ? 'servicios' : e.target.name;
    if (form.querySelector('[data-error="' + nombre + '"]')) ponerError(nombre, '');
    actualizarCondicionales();
    if (nombre === 'servicios') { actualizarProgreso(); actualizarIntegral(); }
  });

  /* Marca un servicio (botones de las secciones y links de otras páginas).
     Si el formulario ya iba por otro paso, vuelve al primero para que se vea. */
  function marcar(id) {
    var entrada = form.querySelector('input[name="servicio"][value="' + id + '"]');
    if (!entrada || terminado) return;
    entrada.checked = true;
    ponerError('servicios', '');
    if (actual !== 'servicios') irA('servicios', { quieto: true });
    actualizarProgreso();
    actualizarIntegral();
  }

  document.addEventListener('click', function (e) {
    var boton = e.target.closest && e.target.closest('a[data-servicio]');
    if (boton) marcar(boton.dataset.servicio);
  });

  if (lugar.dataset.servicio) marcar(lugar.dataset.servicio);
  var pedido = new URLSearchParams(location.search).get('servicio');
  if (pedido) marcar(pedido);
  actualizarCondicionales();
  actualizarProgreso();

  window.SyntropicFormulario = { respuestas: respuestas };
})();
