/* ==========================================================================
   Syntropic: página Desarrollo web (docs/paginas-servicio.md)
   - Hero, "la web se arma sola": caen bytes dentro de las pantallas, se
     dibuja el esqueleto de una web y la pantalla se prende con un destello
     con la captura real. Después sigue la rotación de clientes
     (dispositivos.js espera el evento "syntropic:prendida").
   - El problema: tarjetas del caos al orden, atadas al scroll.
   - Qué incluye: las tarjetas se encienden en orden, como estrellas.
   - $0 de mantenimiento: pulso y una órbita que lo rodea una vez.
   - Velocidad: los anillos se llenan y los números suben contando.
   - Casos: las tarjetas giran hasta quedar de frente.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  var reducido = S.reducido;

  /* ======================= La web se arma sola ======================= */
  var pantallas = document.querySelector('.hero-web .dw-pantallas');

  // Esqueleto de la web: menú, bloque de hero y tres tarjetas, en la
  // proporción de cada pantalla. [x, y, ancho, alto]
  var ESQUELETOS = {
    notebook: { caja: [160, 100], bloques: [[8, 7, 144, 9], [8, 23, 88, 34], [104, 23, 48, 34], [8, 65, 44, 27], [58, 65, 44, 27], [108, 65, 44, 27]], lineas: [[14, 32, 50], [14, 40, 68], [14, 48, 30]] },
    celular: { caja: [60, 130], bloques: [[5, 12, 50, 8], [5, 25, 50, 40], [5, 70, 50, 16], [5, 90, 50, 16], [5, 110, 50, 14]], lineas: [[10, 34, 34], [10, 42, 40], [10, 50, 20]] }
  };

  function armar(pantalla, esqueleto) {
    var capa = document.createElement('div');
    capa.className = 'armado';
    capa.setAttribute('aria-hidden', 'true');
    var w = esqueleto.caja[0], h = esqueleto.caja[1];
    // Medidas en píxeles de la pantalla, para que el trazo se dibuje parejo
    var kx = pantalla.offsetWidth / w, ky = pantalla.offsetHeight / h;
    var svg = S.svg('svg', { viewBox: '0 0 ' + pantalla.offsetWidth + ' ' + pantalla.offsetHeight });
    var orden = 0;
    function trazo(d) {
      var p = S.svg('path', { d: d, pathLength: '1' }, svg);
      p.style.setProperty('--orden', orden++);
    }
    esqueleto.bloques.forEach(function (b) {
      trazo('M' + b[0] * kx + ' ' + b[1] * ky + 'h' + b[2] * kx + 'v' + b[3] * ky + 'h' + -b[2] * kx + 'Z');
    });
    esqueleto.lineas.forEach(function (l) { trazo('M' + l[0] * kx + ' ' + l[1] * ky + 'h' + l[2] * kx); });
    capa.appendChild(svg);
    var destello = document.createElement('span');
    destello.className = 'armado-destello';

    // Bytes: cada uno cae hasta un punto del contorno de un bloque
    var cantidad = pantalla.offsetWidth > 260 ? 64 : 36;
    var alto = pantalla.offsetHeight;
    for (var i = 0; i < cantidad; i++) {
      var b = esqueleto.bloques[i % esqueleto.bloques.length];
      var lado = Math.random() * 2 * (b[2] + b[3]), x, y;
      if (lado < b[2]) { x = b[0] + lado; y = b[1]; }
      else if (lado < b[2] + b[3]) { x = b[0] + b[2]; y = b[1] + lado - b[2]; }
      else if (lado < 2 * b[2] + b[3]) { x = b[0] + lado - b[2] - b[3]; y = b[1] + b[3]; }
      else { x = b[0]; y = b[1] + lado - 2 * b[2] - b[3]; }
      var byte = document.createElement('span');
      byte.className = 'armado-byte';
      byte.textContent = Math.random() < 0.5 ? '0' : '1';
      byte.style.left = (x / w * 100) + '%';
      byte.style.top = (y / h * 100) + '%';
      capa.appendChild(byte);
      var caida = byte.animate([
        { transform: 'translate(-50%, -50%) translateY(' + -(y / h * alto + 20 + Math.random() * 60) + 'px)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -50%)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-50%, -50%)', opacity: 0 }
      ], { duration: 1150 + Math.random() * 250, delay: 150 + Math.random() * 550, easing: 'cubic-bezier(0.3, 0.1, 0.3, 1)', fill: 'both' });
      caida.onfinish = (function (el) { return function () { el.remove(); }; })(byte);
    }
    capa.appendChild(destello);
    pantalla.appendChild(capa);
    return capa;
  }

  if (pantallas && !reducido && pantallas.animate) {
    var capas = [];
    ['notebook', 'celular'].forEach(function (cual) {
      var p = pantallas.querySelector('.' + cual + ' .pantalla');
      if (p && p.offsetWidth) capas.push(armar(p, ESQUELETOS[cual]));
      // Todo quieto hasta que se vea
      else if (p) capas.push(null);
    });
    capas = capas.filter(Boolean);
    var animaciones = [];
    capas.forEach(function (c) {
      animaciones = animaciones.concat(c.getAnimations({ subtree: true }));
    });
    animaciones.forEach(function (a) { a.pause(); });

    S.alEntrar(pantallas, function () {
      animaciones.forEach(function (a) { a.play(); });
      capas.forEach(function (c) { c.classList.add('dibujando'); });
      setTimeout(function () {
        capas.forEach(function (c) { c.classList.add('prendida'); });
        pantallas.classList.add('prendida');
        document.dispatchEvent(new CustomEvent('syntropic:prendida'));
        setTimeout(function () { capas.forEach(function (c) { c.remove(); }); }, 1200);
      }, 2300);
    }, 0.15);
  } else if (pantallas) {
    pantallas.classList.add('prendida');
    document.dispatchEvent(new CustomEvent('syntropic:prendida'));
  }

  /* ======================= Números que suben contando ======================= */
  document.querySelectorAll('[data-contar]').forEach(function (el) { S.contar(el, +el.dataset.contar); });

  /* ======================= El problema: del caos al orden ======================= */
  // Cada tarjeta entra corrida y rotada y se acomoda al acercarse al centro.
  // Se mueve la tarjeta de adentro: el li queda quieto y sirve para medir.
  var CAOS = [[-70, 40, -11], [60, -20, 9], [50, 50, -8], [-60, -10, 12]];
  var ancha = window.innerWidth >= 768;
  document.querySelectorAll('.caos > li').forEach(function (li, i) {
    var t = li.firstElementChild, c = CAOS[i % CAOS.length], k = ancha ? 1.8 : 0.55;
    S.atado(li, 'top 98%', 'center 60%', function (p) {
      var falta = 1 - (1 - Math.pow(1 - p, 2)); // se acomoda suave al final
      t.style.transform = falta < 0.002 ? '' : 'translate(' + (c[0] * k * falta).toFixed(1) + 'px,' + (c[1] * falta).toFixed(1) + 'px) rotate(' + (c[2] * falta).toFixed(2) + 'deg)';
      t.style.opacity = (0.45 + 0.55 * p).toFixed(2);
    });
  });

  /* ======================= Qué incluye: estrellas ======================= */
  S.enOrden(document.querySelectorAll('.estrellas > li'), 'encendida', 130);

  /* ======================= $0 de mantenimiento ======================= */
  var mantenimiento = document.querySelector('.mantenimiento');
  var cero = mantenimiento && mantenimiento.querySelector('.cero');
  if (cero) {
    var orbita = S.svg('svg', { 'class': 'cero-orbita', viewBox: '0 0 200 120', 'aria-hidden': 'true', focusable: 'false' });
    var elipse = S.svg('ellipse', { cx: 100, cy: 60, rx: 94, ry: 40, pathLength: '1', transform: 'rotate(-12 100 60)' }, orbita);
    var luz = S.svg('circle', { r: 3.2, opacity: 0 }, orbita);
    cero.appendChild(orbita);
    S.alEntrar(cero, function () {
      mantenimiento.classList.add('visible');
      if (reducido) return;
      var inicio = performance.now(), giro = -12 * Math.PI / 180;
      (function paso(ahora) {
        var t = Math.min((ahora - inicio) / 2000, 1);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var a = e * Math.PI * 2, x = 94 * Math.cos(a), y = 40 * Math.sin(a);
        luz.setAttribute('cx', (100 + x * Math.cos(giro) - y * Math.sin(giro)).toFixed(2));
        luz.setAttribute('cy', (60 + x * Math.sin(giro) + y * Math.cos(giro)).toFixed(2));
        luz.setAttribute('opacity', Math.min(1, t * 8, (1 - t) * 8).toFixed(2));
        elipse.style.strokeDashoffset = 1 - e;
        if (t < 1) requestAnimationFrame(paso);
      })(inicio);
    }, 0.6);
    S.alVer(mantenimiento, function (v) { mantenimiento.classList.toggle('en-vista', v); });
  }

  /* ======================= Anillos de PageSpeed ======================= */
  document.querySelectorAll('.anillo').forEach(function (a) {
    S.alEntrar(a, function () { a.querySelector('.indicador').classList.add('lleno'); }, 0.5);
  });

  /* ======================= Casos ======================= */
  S.enOrden(document.querySelectorAll('.caso'), 'de-frente', 160);
})();
