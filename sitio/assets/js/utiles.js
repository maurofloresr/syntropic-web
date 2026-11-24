/* ==========================================================================
   Syntropic: funciones de ayuda que usan todas las páginas
   Se carga primero. Queda en window.Syntropic:
   - reducido: true si el usuario pidió menos movimiento.
   - alEntrar(el, fn, umbral): una sola vez, cuando el elemento entra en pantalla.
   - alVer(el, fn, margen): cada vez que entra o sale de la pantalla.
   - cuandoLibre(fn): cuando el navegador está libre.
   ========================================================================== */
(function () {
  'use strict';

  var hayObserver = 'IntersectionObserver' in window;

  /* Llama a fn una sola vez cuando el elemento entra en pantalla */
  function alEntrar(el, fn, umbral) {
    if (!el) return;
    if (!hayObserver) { fn(); return; }
    var obs = new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) { obs.disconnect(); fn(); }
    }, { threshold: umbral || 0.25 });
    obs.observe(el);
  }

  /* Avisa cada vez que el elemento entra o sale de la pantalla */
  function alVer(el, fn, margen) {
    if (!el || !hayObserver) { fn(true); return; }
    new IntersectionObserver(function (entradas) {
      fn(entradas[entradas.length - 1].isIntersecting);
    }, { rootMargin: margen || '0px' }).observe(el);
  }

  /* Ejecuta fn cuando el navegador está libre */
  function cuandoLibre(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 3000 });
    else setTimeout(fn, 600);
  }

  /* En desarrollo (localhost o la red local) se marcan a la vista los textos
     por confirmar (.a-confirmar). En la web publicada no se nota nada. */
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)) {
    document.documentElement.classList.add('desarrollo');
  }

  window.Syntropic = {
    reducido: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    alEntrar: alEntrar,
    alVer: alVer,
    cuandoLibre: cuandoLibre
  };
})();
