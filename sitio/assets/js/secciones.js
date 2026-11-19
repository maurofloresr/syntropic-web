/* ==========================================================================
   Syntropic: animaciones de cada sección (Fase 3)
   - Las entradas se disparan cuando el elemento aparece en pantalla
     (IntersectionObserver), no por posiciones de scroll calculadas: así el
     espacio extra del pin del hero y el parallax de la galaxia no las corren.
   - Con prefers-reduced-motion todo queda quieto y ya armado.
   - Sin JavaScript se ve todo, sin animar (los estados ocultos dependen de
     la clase .js en <html>).

   Desarrollo web:
   - Notebook y celular muestran la web del cliente elegido.
   - Al principio solo se carga la captura del cliente activo; las otras se
     cargan cuando la sección se acerca y la página está libre.
   - Los clientes rotan solos cada ROTACION_MS mientras la sección está en
     pantalla. La rotación se corta para siempre apenas el usuario toca un
     nombre. Con movimiento reducido no rota.
   - Tarjeta del puntaje: muestra el PageSpeed (computadora) del cliente que
     se está viendo, tomado de data-rendimiento y data-seo de cada botón.
     La primera vez que aparece, el arco se llena y el número sube contando;
     después cambia junto con el cliente. Sin data-seo, no hay línea de SEO.
   ========================================================================== */
(function () {
  'use strict';

  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      fn(entradas[0].isIntersecting);
    }, { rootMargin: margen || '0px' }).observe(el);
  }

  /* Ejecuta fn cuando el navegador está libre */
  function cuandoLibre(fn) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 3000 });
    else setTimeout(fn, 600);
  }

  /* ======================= Desarrollo web ======================= */
  var dw = document.querySelector('.dw');
  if (dw) {
    var ROTACION_MS = 5000;
    var botones = Array.prototype.slice.call(dw.querySelectorAll('.cliente'));
    var capturas = Array.prototype.slice.call(dw.querySelectorAll('.pantalla-captura'));
    var lista = dw.querySelector('.clientes-lista');
    var activo = 0;
    var rotando = !reducido;
    var enPantalla = false;
    var temporizador = null;

    // Carga diferida de las capturas de los otros clientes
    function cargarCapturas() {
      capturas.forEach(function (img) {
        if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
      });
    }
    alVer(dw, function (visible) {
      if (visible) cuandoLibre(cargarCapturas);
    }, '400px 0px');

    // Tarjeta del puntaje
    var indicador = dw.querySelector('.indicador');
    var numero = dw.querySelector('.dw-puntaje-numero');
    var lineaSeo = dw.querySelector('.dw-puntaje-seo');
    var numeroSeo = dw.querySelector('.dw-puntaje-seo-numero');
    var puntajeVisto = false; // hasta que la tarjeta aparece, no se anima nada
    var conteo = null;

    function contar(hasta) {
      cancelAnimationFrame(conteo);
      if (reducido) { numero.textContent = hasta; return; }
      var inicio = performance.now();
      (function paso(ahora) {
        var t = Math.min((ahora - inicio) / 1400, 1);
        numero.textContent = Math.round(hasta * (1 - Math.pow(1 - t, 3)));
        if (t < 1) conteo = requestAnimationFrame(paso);
      })(inicio);
    }

    function mostrarPuntaje(boton) {
      if (!indicador || !numero) return;
      var rendimiento = boton.dataset.rendimiento;
      var seo = boton.dataset.seo;
      indicador.style.setProperty('--puntaje', rendimiento);
      if (puntajeVisto) { cancelAnimationFrame(conteo); numero.textContent = rendimiento; }
      if (lineaSeo) {
        lineaSeo.hidden = !seo;
        if (seo && numeroSeo) numeroSeo.textContent = seo;
      }
    }

    function mostrar(indice, desdeRotacion) {
      activo = indice;
      mostrarPuntaje(botones[indice]);
      var id = botones[indice].dataset.cliente;
      botones.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === indice)); });
      capturas.forEach(function (img) {
        if (img.dataset.src && img.dataset.cliente === id) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
        var esta = img.dataset.cliente === id;
        img.classList.toggle('activa', esta);
        if (img.alt) img.toggleAttribute('aria-hidden', !esta);
      });
      // En mobile la fila de nombres se desliza: si rota solo, el nombre
      // activo se acomoda a la vista (solo en horizontal, sin mover la página)
      if (desdeRotacion && lista && lista.scrollWidth > lista.clientWidth) {
        var b = botones[indice].parentElement;
        lista.scrollTo({ left: b.offsetLeft - (lista.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
      }
    }

    function programarRotacion() {
      clearTimeout(temporizador);
      if (!rotando || !enPantalla || document.hidden) return;
      temporizador = setTimeout(function () {
        mostrar((activo + 1) % botones.length, true);
        programarRotacion();
      }, ROTACION_MS);
    }

    botones.forEach(function (boton, i) {
      boton.addEventListener('click', function () {
        rotando = false; // el usuario eligió: no rota más
        clearTimeout(temporizador);
        mostrar(i, false);
      });
    });

    alVer(dw.querySelector('.dw-visual'), function (visible) {
      enPantalla = visible;
      programarRotacion();
    });
    document.addEventListener('visibilitychange', programarRotacion);

    // Entrada de las pantallas y la tarjeta del puntaje
    var visual = dw.querySelector('.dw-pantallas');
    alEntrar(visual, function () { visual.classList.add('visible'); }, 0.2);

    // La primera vez que se ve la tarjeta: el arco se llena y el número cuenta
    if (indicador && numero) {
      numero.textContent = reducido ? botones[activo].dataset.rendimiento : '0';
      alEntrar(indicador, function () {
        // espera a que la tarjeta termine de entrar (llega después de las pantallas)
        setTimeout(function () {
          puntajeVisto = true;
          indicador.classList.add('lleno');
          contar(+botones[activo].dataset.rendimiento);
        }, reducido ? 0 : 700);
      }, 0.6);
    }
  }
})();
