/* ==========================================================================
   Syntropic: piezas comunes de las páginas de servicio
   - Cómo trabajamos: constelación. Una línea une las estrellas (pasos) y se
     dibuja con el scroll; cada estrella se enciende cuando la línea llega.
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
