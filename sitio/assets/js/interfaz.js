/* ==========================================================================
   Syntropic: comportamiento de la interfaz (sin animaciones)
   - Menú hamburguesa de pantalla completa (mobile y tablet).
   - En mobile, el botón de WhatsApp se esconde mientras se ve el formulario.
   ========================================================================== */
(function () {
  'use strict';

  /* --- Menú hamburguesa --- */
  var menu = document.querySelector('.menu');
  var botonMenu = document.querySelector('.menu-hamburguesa');
  var escritorio = window.matchMedia('(min-width: 1024px)');

  function abrirMenu(abrir) {
    menu.classList.toggle('abierto', abrir);
    document.body.classList.toggle('menu-abierto', abrir);
    botonMenu.setAttribute('aria-expanded', String(abrir));
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  }

  if (menu && botonMenu) {
    botonMenu.addEventListener('click', function () {
      abrirMenu(!menu.classList.contains('abierto'));
    });

    // Al tocar un link, el menú se cierra y la página baja a la sección
    menu.querySelectorAll('.menu-lista a').forEach(function (link) {
      link.addEventListener('click', function () { abrirMenu(false); });
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
        abrirMenu(false);
        botonMenu.focus();
      }
    });

    // Si se agranda la ventana a desktop con el menú abierto, se cierra
    escritorio.addEventListener('change', function (e) {
      if (e.matches) abrirMenu(false);
    });
  }

  /* --- WhatsApp: se esconde en mobile mientras se ve el formulario --- */
  var whatsapp = document.querySelector('.whatsapp');
  var formulario = document.querySelector('.formulario');
  var mobile = window.matchMedia('(max-width: 767px)');
  var formularioVisible = false;

  function actualizarWhatsapp() {
    whatsapp.classList.toggle('oculto', mobile.matches && formularioVisible);
  }

  if (whatsapp && formulario && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      formularioVisible = entradas[0].isIntersecting;
      actualizarWhatsapp();
    }).observe(formulario);

    mobile.addEventListener('change', actualizarWhatsapp);
  }
})();
