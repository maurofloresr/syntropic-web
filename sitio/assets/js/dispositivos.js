/* ==========================================================================
   Syntropic: notebook y celular con las webs de los clientes
   Lo usan la landing (sección Desarrollo web) y la página /desarrollo-web.

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

  var S = window.Syntropic;
  var reducido = S.reducido, alEntrar = S.alEntrar, alVer = S.alVer, cuandoLibre = S.cuandoLibre;

  /* ======================= Desarrollo web ======================= */
  var dw = document.querySelector('.dw, .hero-web');
  if (dw) {
    var ROTACION_MS = 5000;
    var botones = Array.prototype.slice.call(dw.querySelectorAll('.cliente'));
    var capturas = Array.prototype.slice.call(dw.querySelectorAll('.pantalla-captura'));
    var lista = dw.querySelector('.clientes-lista');
    var activo = 0;
    var rotando = !reducido;
    var enPantalla = false;
    var temporizador = null;

    // En /desarrollo-web la pantalla primero "se arma sola": la rotación y el
    // puntaje esperan a que se prenda (evento syntropic:prendida)
    var prendida = reducido || !dw.classList.contains('hero-web');
    function cuandoPrendida(fn) {
      if (prendida) { fn(); return; }
      document.addEventListener('syntropic:prendida', function () { prendida = true; fn(); }, { once: true });
    }

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
      if (!rotando || !prendida || !enPantalla || document.hidden) return;
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
    cuandoPrendida(programarRotacion);

    // Entrada de las pantallas y la tarjeta del puntaje
    var visual = dw.querySelector('.dw-pantallas');
    alEntrar(visual, function () { visual.classList.add('visible'); }, 0.2);

    // La primera vez que se ve la tarjeta: el arco se llena y el número cuenta
    if (indicador && numero) {
      numero.textContent = reducido ? botones[activo].dataset.rendimiento : '0';
      alEntrar(indicador, function () {
        // espera a que la tarjeta termine de entrar (llega después de las pantallas)
        cuandoPrendida(function () {
          setTimeout(function () {
            puntajeVisto = true;
            indicador.classList.add('lleno');
            contar(+botones[activo].dataset.rendimiento);
          }, reducido ? 0 : 700);
        });
      }, 0.6);
    }
  }
})();
