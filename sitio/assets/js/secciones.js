/* ==========================================================================
   Syntropic: animaciones de las secciones (Fase 3). Lo usan la landing y la
   página /sistemas. Desarrollo web está en dispositivos.js y Automatizaciones
   en lienzo.js.
   - Las entradas se disparan cuando el elemento aparece en pantalla
     (IntersectionObserver), no por posiciones de scroll calculadas: así el
     espacio extra del pin del hero y el parallax de la galaxia no las corren.
   - Con prefers-reduced-motion todo queda quieto y ya armado.
   - Sin JavaScript se ve todo, sin animar (los estados ocultos dependen de
     la clase .js en <html>).

   Sistemas:
   - La notebook se abre sola una vez al entrar en pantalla y queda abierta.
   ========================================================================== */
(function () {
  'use strict';

  // Funciones de ayuda: utiles.js (se carga antes)
  var S = window.Syntropic;
  var reducido = S.reducido, alEntrar = S.alEntrar;

  /* ======================= Sistemas ======================= */
  // La notebook aparece cerrada y se abre una sola vez cuando entra en
  // pantalla; queda abierta. Todo el orden (tapa, pantalla que se prende,
  // gráfico y tarjeta del stock) está en las transiciones de secciones.css.
  var sisPantallas = document.querySelector('.sis-pantallas');
  if (sisPantallas) {
    if (reducido) sisPantallas.classList.add('abierta');
    else alEntrar(sisPantallas, function () { sisPantallas.classList.add('abierta'); }, 0.4);
  }
})();
