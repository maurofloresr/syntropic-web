/* ==========================================================================
   Syntropic: entradas suaves (fundido y subida corta al aparecer en pantalla)
   Cómo se usa en el HTML:
   - data-entrada              el elemento entra entero.
   - data-entrada="grupo"      entran sus hijos, uno atrás del otro.
   Reglas:
   - Lo que ya está en pantalla al cargar no se toca (no parpadea ni demora
     la carga): solo se esconde lo que está más abajo.
   - Entra una sola vez. Al terminar se sacan las clases: no queda nada que
     pise otras transiciones del elemento (hover de botones, etc.).
   - Sin JavaScript o con movimiento reducido se ve todo quieto.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  if (!S || S.reducido || !('IntersectionObserver' in window)) return;

  var ESCALON_MS = 80, DURA_MS = 750;

  function mostrar(el) {
    var demora = Math.min((+el.dataset.orden || 0) * ESCALON_MS, 800);
    el.style.setProperty('--entrada-demora', demora + 'ms');
    el.classList.add('entrada-llega');
    setTimeout(function () {
      el.classList.remove('entrada-espera', 'entrada-llega');
      el.style.removeProperty('--entrada-demora');
    }, demora + DURA_MS + 100);
  }

  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      // También si ya quedó arriba (la página saltó de largo, por un link)
      if (!e.isIntersecting && e.boundingClientRect.bottom > 0) return;
      obs.unobserve(e.target);
      mostrar(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  var lista = [];
  document.querySelectorAll('[data-entrada]').forEach(function (el) {
    if (el.dataset.entrada !== 'grupo') { lista.push(el); return; }
    Array.prototype.forEach.call(el.children, function (hijo, i) {
      hijo.dataset.orden = i;
      lista.push(hijo);
    });
  });
  // Primero se mide todo y después se esconde (sin recalcular en cada uno)
  lista.filter(function (el) {
    return el.getBoundingClientRect().top > window.innerHeight * 0.94;
  }).forEach(function (el) {
    el.classList.add('entrada-espera');
    obs.observe(el);
  });
})();
