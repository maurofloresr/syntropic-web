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

   Sistemas:
   - La notebook se abre sola una vez al entrar en pantalla y queda abierta.
   ========================================================================== */
(function () {
  'use strict';

  // Funciones de ayuda: utiles.js (se carga antes)
  var S = window.Syntropic;
  var reducido = S.reducido, alEntrar = S.alEntrar, alVer = S.alVer, cuandoLibre = S.cuandoLibre;

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

  /* ======================= Automatizaciones ======================= */
  var auto = document.querySelector('.auto');
  if (auto) {
    var lienzo = auto.querySelector('.lienzo');
    var svg = lienzo && lienzo.querySelector('.lienzo-cables');
    var disparadores = Array.prototype.slice.call(auto.querySelectorAll('.nodos-disparadores .nodo'));
    var acciones = Array.prototype.slice.call(auto.querySelectorAll('.nodos-acciones .nodo'));
    var central = auto.querySelector('.nodo-central');
    var circulo = auto.querySelector('.nodo-central-circulo');
    var horizontal = window.matchMedia('(min-width: 1024px)');
    var NS = 'http://www.w3.org/2000/svg';

    if (lienzo && svg && circulo && disparadores.length && acciones.length) {
      // Orden de aparición: disparadores, la S, acciones
      disparadores.concat([central], acciones).forEach(function (el, i) {
        el.style.setProperty('--orden', i);
      });

      /* Un cable: línea base, brillo que la recorre y punto de luz */
      function crearCable(orden) {
        var g = document.createElementNS(NS, 'g');
        var base = document.createElementNS(NS, 'path');
        var brillo = document.createElementNS(NS, 'path');
        var punto = document.createElementNS(NS, 'circle');
        base.setAttribute('class', 'cable');
        base.setAttribute('pathLength', '1');
        base.style.setProperty('--orden', orden);
        brillo.setAttribute('class', 'cable-brillo');
        brillo.setAttribute('pathLength', '1');
        punto.setAttribute('class', 'cable-punto');
        punto.setAttribute('r', '3.5');
        g.appendChild(base); g.appendChild(brillo); g.appendChild(punto);
        svg.appendChild(g);
        return { base: base, brillo: brillo, punto: punto, largo: 0 };
      }
      var entradas = disparadores.map(function (n, i) { return crearCable(i); });
      var salidas = acciones.map(function (n, i) { return crearCable(i + 3); });

      function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
      function f(n) { return Math.round(n * 10) / 10; }

      /* Arma la forma de cada cable según dónde quedaron los nodos */
      // Posición dentro del lienzo sin contar transformaciones (durante la
      // entrada los nodos están desplazados y la S late con scale)
      function posicion(el) {
        var x = 0, y = 0, e = el;
        while (e && e !== lienzo) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
        return { x: x, y: y, ancho: el.offsetWidth, alto: el.offsetHeight };
      }

      function dibujarCables() {
        var anchoL = lienzo.offsetWidth, altoL = lienzo.offsetHeight;
        var C = posicion(circulo);
        var cx = C.x + C.ancho / 2;
        var cy = C.y + C.alto / 2;
        var r = C.ancho / 2;
        svg.setAttribute('viewBox', '0 0 ' + anchoL + ' ' + altoL);
        var L = { height: altoL };

        function caja(n) {
          var b = posicion(n);
          return { izq: b.x, der: b.x + b.ancho, medio: b.y + b.alto / 2 };
        }
        // Punto del borde del círculo en un ángulo (radianes, 0 = derecha)
        function borde(angulo) { return { x: cx + r * Math.cos(angulo), y: cy + r * Math.sin(angulo) }; }

        if (horizontal.matches) {
          // Desktop: de la derecha de cada disparador al lado izquierdo de la S,
          // y del lado derecho de la S a la izquierda de cada acción
          var alto = L.height / 2;
          disparadores.forEach(function (n, i) {
            var b = caja(n);
            var e = borde(Math.PI - limitar((b.medio - cy) / alto, -1, 1) * 0.5);
            var dx = (e.x - b.der) * 0.5;
            entradas[i].base.setAttribute('d', 'M' + f(b.der) + ',' + f(b.medio) + ' C' + f(b.der + dx) + ',' + f(b.medio) + ' ' + f(e.x - dx) + ',' + f(e.y) + ' ' + f(e.x) + ',' + f(e.y));
          });
          acciones.forEach(function (n, i) {
            var b = caja(n);
            var e = borde(limitar((b.medio - cy) / alto, -1, 1) * 0.5);
            var dx = (b.izq - e.x) * 0.5;
            salidas[i].base.setAttribute('d', 'M' + f(e.x) + ',' + f(e.y) + ' C' + f(e.x + dx) + ',' + f(e.y) + ' ' + f(b.izq - dx) + ',' + f(b.medio) + ' ' + f(b.izq) + ',' + f(b.medio));
          });
        } else {
          // Mobile y tablet: cada cable sale de la izquierda del nodo, baja por
          // su propio carril y entra (o sale) por la izquierda de la S
          var R = 14;
          disparadores.forEach(function (n, i) {
            var b = caja(n);
            var carril = b.izq - 30 + i * 8;
            var e = borde(Math.PI + 0.35 + i * 0.3); // arriba a la izquierda de la S
            var radial = { x: (e.x - cx) / r, y: (e.y - cy) / r };
            var curva = limitar(e.y - (b.medio + R) - 10, 10, 60);
            entradas[i].base.setAttribute('d',
              'M' + f(b.izq) + ',' + f(b.medio) +
              ' C' + f(carril + R * 0.4) + ',' + f(b.medio) + ' ' + f(carril) + ',' + f(b.medio + R * 0.4) + ' ' + f(carril) + ',' + f(b.medio + R) +
              ' L' + f(carril) + ',' + f(e.y - curva) +
              ' C' + f(carril) + ',' + f(e.y - curva * 0.3) + ' ' + f(e.x + radial.x * curva * 0.6) + ',' + f(e.y + radial.y * curva * 0.6) + ' ' + f(e.x) + ',' + f(e.y));
          });
          acciones.forEach(function (n, i) {
            var b = caja(n);
            var carril = b.izq - 30 + (i % 3) * 8;
            var e = borde(Math.PI - 0.35 - (i % 3) * 0.3); // abajo a la izquierda de la S
            var radial = { x: (e.x - cx) / r, y: (e.y - cy) / r };
            var curva = limitar((b.medio - R) - e.y - 10, 10, 60);
            salidas[i].base.setAttribute('d',
              'M' + f(e.x) + ',' + f(e.y) +
              ' C' + f(e.x + radial.x * curva * 0.6) + ',' + f(e.y + radial.y * curva * 0.6) + ' ' + f(carril) + ',' + f(e.y + curva * 0.3) + ' ' + f(carril) + ',' + f(e.y + curva) +
              ' L' + f(carril) + ',' + f(b.medio - R) +
              ' C' + f(carril) + ',' + f(b.medio - R * 0.4) + ' ' + f(carril + R * 0.4) + ',' + f(b.medio) + ' ' + f(b.izq) + ',' + f(b.medio));
          });
        }
        entradas.concat(salidas).forEach(function (c) {
          c.brillo.setAttribute('d', c.base.getAttribute('d'));
          c.largo = c.base.getTotalLength();
        });
      }

      dibujarCables();
      if ('ResizeObserver' in window) new ResizeObserver(dibujarCables).observe(lienzo);
      else window.addEventListener('resize', dibujarCables);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujarCables);

      /* --- Loop de luz ---
         Reloj propio que solo avanza mientras el lienzo está en pantalla y la
         pestaña visible: al volver, todo sigue donde quedó. */
      var reloj = 0, ultimo = 0, cuadro = 0;
      var tareas = [];  // { en, fn }
      var viajes = [];  // { cable, desde, dura, alFinal }
      var enVista = false, arranco = false;

      function luego(ms, fn) { tareas.push({ en: reloj + ms, fn: fn }); }

      function viajar(cable, dura, alFinal) {
        viajes.push({ cable: cable, desde: reloj, dura: dura, alFinal: alFinal });
      }

      function encender(nodo) {
        if (!nodo.animate) return;
        nodo.animate([
          { borderColor: 'rgba(71, 173, 255, 0.25)', boxShadow: '0 0 0 rgba(71, 173, 255, 0)' },
          { borderColor: 'rgba(71, 173, 255, 1)', boxShadow: '0 0 22px rgba(71, 173, 255, 0.55)', offset: 0.25 },
          { borderColor: 'rgba(71, 173, 255, 0.25)', boxShadow: '0 0 0 rgba(71, 173, 255, 0)' }
        ], { duration: 900, easing: 'ease-out' });
      }

      function latir() {
        if (!circulo.animate) return;
        circulo.animate([
          { transform: 'scale(1)', boxShadow: '0 0 40px rgba(0, 64, 255, 0.6)' },
          { transform: 'scale(1.07)', boxShadow: '0 0 70px 8px rgba(71, 173, 255, 0.7)', offset: 0.3 },
          { transform: 'scale(1)', boxShadow: '0 0 40px rgba(0, 64, 255, 0.6)' }
        ], { duration: 700, easing: 'ease-out' });
      }

      // Un ciclo: un disparador se ilumina, la luz viaja a la S, la S late y
      // salen dos luces escalonadas a dos acciones, que se iluminan al llegar.
      // Disparadores y acciones van rotando para que se usen todos.
      var siguienteDisparador = 0, siguienteAccion = 0;
      function ciclo() {
        var d = siguienteDisparador;
        siguienteDisparador = (d + 1) % entradas.length;
        encender(disparadores[d]);
        viajar(entradas[d], 1100, function () {
          latir();
          [0, 1].forEach(function (k) {
            var a = (siguienteAccion + k) % salidas.length;
            luego(120 + k * 320, function () {
              viajar(salidas[a], 1000, function () { encender(acciones[a]); });
            });
          });
          siguienteAccion = (siguienteAccion + 2) % salidas.length;
        });
        luego(2700, ciclo);
      }

      function suave(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

      function pintar(ahora) {
        reloj += Math.min(ahora - ultimo, 50); // si se trabó un cuadro, no salta
        ultimo = ahora;

        for (var i = tareas.length - 1; i >= 0; i--) {
          if (reloj >= tareas[i].en) { var t = tareas.splice(i, 1)[0]; t.fn(); }
        }

        for (var j = viajes.length - 1; j >= 0; j--) {
          var v = viajes[j], c = v.cable;
          var p = Math.min((reloj - v.desde) / v.dura, 1);
          var avance = suave(p);
          var pt = c.base.getPointAtLength(avance * c.largo);
          var aparece = Math.min(p / 0.1, (1 - p) / 0.1, 1);
          c.punto.setAttribute('cx', f(pt.x));
          c.punto.setAttribute('cy', f(pt.y));
          c.punto.style.opacity = aparece;
          // brillo: un tramo corto que termina donde está el punto
          var tramo = 0.16;
          c.brillo.style.strokeDasharray = tramo + ' 2';
          c.brillo.style.strokeDashoffset = tramo - avance;
          c.brillo.style.opacity = aparece * 0.9;
          if (p >= 1) {
            c.punto.style.opacity = 0;
            c.brillo.style.opacity = 0;
            viajes.splice(j, 1);
            if (v.alFinal) v.alFinal();
          }
        }
        cuadro = requestAnimationFrame(pintar);
      }

      function actualizarLoop() {
        var correr = arranco && enVista && !document.hidden;
        if (correr && !cuadro) {
          ultimo = performance.now();
          cuadro = requestAnimationFrame(pintar);
        } else if (!correr && cuadro) {
          cancelAnimationFrame(cuadro);
          cuadro = 0;
        }
      }

      // Entrada: nodos en orden, después los cables, y recién ahí el loop
      alEntrar(lienzo, function () {
        lienzo.classList.add('visible');
        if (reducido) return; // con movimiento reducido: todo quieto y armado
        arranco = true;
        luego(2000, ciclo);
        actualizarLoop();
      }, 0.2);

      alVer(lienzo, function (visible) { enVista = visible; actualizarLoop(); });
      document.addEventListener('visibilitychange', actualizarLoop);
    }

    /* --- "Y también conectamos": fila que se desliza sola en mobile --- */
    var marquesina = auto.querySelector('.conectamos-marquesina');
    var logos = marquesina && marquesina.querySelector('.conectamos-lista');
    if (logos && !reducido) {
      Array.prototype.slice.call(logos.children).forEach(function (li) {
        var copia = li.cloneNode(true);
        copia.classList.add('clon');
        copia.setAttribute('aria-hidden', 'true');
        logos.appendChild(copia);
      });
      marquesina.classList.add('en-movimiento');
      // Fuera de pantalla, la fila se frena (no gasta batería)
      alVer(marquesina, function (visible) {
        logos.style.animationPlayState = visible ? 'running' : 'paused';
      });
    }
  }

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
