/* ==========================================================================
   Syntropic: piezas comunes de las páginas de servicio
   - Cómo trabajamos: constelación. Una línea une las estrellas (pasos) y se
     dibuja con el scroll; cada estrella se enciende cuando la línea llega.
   - Syntropic.enOrden() y Syntropic.contar(): ayudas para las entradas.
   - Syntropic.guion(): animaciones en loop que se frenan fuera de pantalla.
   - Syntropic.atado(): ayuda para animaciones atadas al scroll (GSAP).
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  var hayGsap = !!(window.gsap && window.ScrollTrigger);
  if (hayGsap) gsap.registerPlugin(ScrollTrigger);
  var NS = 'http://www.w3.org/2000/svg';

  /* Llama a fn(avance de 0 a 1) según el scroll. Sin GSAP o con movimiento
     reducido, queda directo en el final. */
  S.atado = function (el, inicio, fin, fn, suavizado) {
    if (!el) return;
    if (!hayGsap || S.reducido) { fn(1); return; }
    var dato = { p: 0 };
    fn(0);
    gsap.to(dato, {
      p: 1, ease: 'none',
      onUpdate: function () { fn(dato.p); },
      scrollTrigger: { trigger: el, start: inicio, end: fin, scrub: suavizado === undefined ? 0.5 : suavizado }
    });
  };

  /* Posición de un elemento dentro de otro, sin contar transformaciones */
  S.lugarEn = function (el, contenedor) {
    var x = 0, y = 0, e = el;
    while (e && e !== contenedor) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y, ancho: el.offsetWidth, alto: el.offsetHeight };
  };

  S.svg = function (etiqueta, atributos, padre) {
    var el = document.createElementNS(NS, etiqueta);
    for (var k in atributos) el.setAttribute(k, atributos[k]);
    if (padre) padre.appendChild(el);
    return el;
  };

  /* Pone una clase a cada elemento cuando aparece en pantalla. Si aparecen
     varios juntos, van de a uno, en orden. */
  S.enOrden = function (elementos, clase, cada) {
    var turno = 0;
    Array.prototype.forEach.call(elementos, function (el) {
      S.alEntrar(el, function () {
        if (S.reducido) { el.classList.add(clase); return; }
        var ahora = performance.now();
        turno = Math.max(turno + cada, ahora);
        setTimeout(function () { el.classList.add(clase); }, turno - ahora);
      }, 0.25);
    });
  };

  /* El número sube contando la primera vez que se ve (en el HTML está el final) */
  S.contar = function (el, hasta) {
    if (S.reducido) return;
    el.textContent = '0';
    S.alEntrar(el, function () {
      var inicio = performance.now();
      (function paso(ahora) {
        var t = Math.min((ahora - inicio) / 1400, 1);
        el.textContent = Math.round(hasta * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(paso);
      })(inicio);
    }, 0.6);
  };

  /* Guion en loop: pasos { dura (ms), alEmpezar, cada(avance 0 a 1) }. El
     reloj se frena fuera de pantalla y con la pestaña oculta, y al volver
     sigue donde quedó. No usar con movimiento reducido. */
  S.guion = function (el, pasos) {
    var paso = 0, t = 0, ultimo = 0, cuadro = 0, empezo = false, enVista = false;
    function pintar(ahora) {
      t += Math.min(ahora - ultimo, 50);
      ultimo = ahora;
      var g = pasos[paso];
      if (!empezo) { empezo = true; if (g.alEmpezar) g.alEmpezar(); }
      if (g.cada) g.cada(Math.min(t / g.dura, 1));
      if (t >= g.dura) { t = 0; empezo = false; paso = (paso + 1) % pasos.length; }
      cuadro = requestAnimationFrame(pintar);
    }
    function actualizar() {
      var correr = enVista && !document.hidden;
      if (correr && !cuadro) { ultimo = performance.now(); cuadro = requestAnimationFrame(pintar); }
      else if (!correr && cuadro) { cancelAnimationFrame(cuadro); cuadro = 0; }
    }
    S.alVer(el, function (v) { enVista = v; actualizar(); });
    document.addEventListener('visibilitychange', actualizar);
  };

  /* ======================= Constelación ======================= */
  document.querySelectorAll('.constelacion').forEach(function (lista) {
    var estrellas = Array.prototype.slice.call(lista.querySelectorAll('.constelacion-estrella'));
    var svg = S.svg('svg', { 'class': 'constelacion-cielo', 'aria-hidden': 'true', focusable: 'false' });
    var fondo = S.svg('path', { 'class': 'constelacion-fondo' }, svg);
    var linea = S.svg('path', { 'class': 'constelacion-linea', pathLength: '1' }, svg);
    // Va adentro de un li para que la lista siga siendo válida
    var li = document.createElement('li');
    li.className = 'constelacion-dibujo';
    li.setAttribute('aria-hidden', 'true');
    li.appendChild(svg);
    lista.appendChild(li);
    var marcas = []; // a qué altura de la línea está cada estrella (0 a 1)
    var avance = 0;

    function dibujar() {
      svg.setAttribute('viewBox', '0 0 ' + lista.offsetWidth + ' ' + lista.offsetHeight);
      var puntos = estrellas.map(function (e) {
        var b = S.lugarEn(e, lista);
        return [b.x + b.ancho / 2, b.y + b.alto / 2];
      });
      var largo = 0, acumulado = [0];
      for (var i = 1; i < puntos.length; i++) {
        largo += Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]);
        acumulado.push(largo);
      }
      marcas = acumulado.map(function (a) { return largo ? a / largo : 0; });
      var d = 'M' + puntos.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
      fondo.setAttribute('d', d);
      linea.setAttribute('d', d);
      pintar(avance);
    }

    function pintar(p) {
      avance = p;
      linea.style.strokeDashoffset = 1 - p;
      estrellas.forEach(function (e, i) { e.classList.toggle('encendida', p > 0 && p >= marcas[i] - 0.004); });
    }

    dibujar();
    if ('ResizeObserver' in window) new ResizeObserver(dibujar).observe(lista);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);
    S.atado(lista, 'top 82%', 'bottom 52%', pintar);
  });
})();
