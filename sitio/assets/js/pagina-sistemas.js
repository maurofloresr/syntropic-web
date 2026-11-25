/* ==========================================================================
   Syntropic: página Sistemas (docs/paginas-servicio.md)
   - Hero, el apretón de manos: a la izquierda una mano humana en línea que se
     traza sola; a la derecha una mano de 0 y 1 (canvas). Se encuentran, pulso
     de brillo y aparece el h1. Una sola vez, unos 2,5 s.
     [FALTA: siluetas de la diseñadora; MANO es provisoria]
   - El problema: los papeles sueltos vuelan y entran a la notebook.
   - Demo: primero el total, después el filtro, después el detalle, en loop.
   - Módulos: orbitan alrededor de la S; al tocar uno se frena y se acerca.
   - Seguridad: capas que se encienden de afuera hacia adentro y permisos.
   - Siempre con vos: el mismo dato cambia a la vez en los tres equipos.
   - Capacitación: el anillo se llena. Caso real: del desorden al orden.
   La apertura de la notebook está en secciones.js.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  var reducido = S.reducido;
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function suave(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ======================= El apretón de manos ======================= */
  // El mismo trazado que la mano en línea del HTML (caja de 520 x 300),
  // espejado para que venga desde la derecha
  var MANO = 'M0 120C80 118 150 124 208 120C226 116 240 106 258 96C286 80 316 66 342 58C358 54 368 66 360 78C350 92 332 104 322 114C366 112 428 110 478 116C494 118 496 138 480 140C500 140 510 142 510 152C510 164 496 164 482 164C496 166 500 172 497 180C494 188 482 188 470 188C478 192 478 200 472 205C464 212 440 210 420 210C380 218 320 224 270 220C240 218 224 210 206 208C140 210 70 214 0 214Z';
  var manos = document.querySelector('.manos');
  if (manos && S.bytes && window.Path2D && window.DOMMatrix) {
    var lugar = manos.querySelector('.mano-bytes');
    var silueta = new Path2D();
    silueta.addPath(new Path2D(MANO), new DOMMatrix([-1, 0, 0, 1, 520, 0]));
    var medir = function () {
      return S.bytes.muestrearSilueta(lugar, silueta, [520, 300], window.innerWidth < 768 ? 520 : 1150);
    };
    if (reducido) {
      S.bytes.estatica(lugar, medir);
      manos.classList.add('quietas');
    } else {
      var formacion = {
        medir: medir, entrada: 'derecha', dura: 1900, demora: 100,
        alListo: function () { formacion.pulso = 1; manos.classList.add('juntas'); }
      };
      S.bytes.formar(formacion);
      manos.classList.add('trazando');
    }
  }

  /* ======================= Los papeles vuelan a la notebook ======================= */
  var vuelo = document.querySelector('.vuelo');
  var pantallas = document.querySelector('.sis-pantallas');
  if (vuelo && pantallas) {
    var papeles = Array.prototype.slice.call(vuelo.querySelectorAll('.vuelo-papel'));
    var main = document.querySelector('main');
    var destinos = [], avance = 0;
    var medirVuelo = function () {
      var n = S.lugarEn(pantallas.querySelector('.notebook-tapa'), main);
      var v = S.lugarEn(vuelo, main);
      destinos = papeles.map(function (p, i) {
        // Cada uno entra a la pantalla por un lugar un poco distinto
        return {
          x: n.x + n.ancho * (0.3 + 0.4 * ((i * 0.37) % 1)) - (v.x + p.offsetLeft + p.offsetWidth / 2),
          y: n.y + n.alto * 0.55 - (v.y + p.offsetTop + p.offsetHeight / 2)
        };
      });
      pintarVuelo(avance);
    };
    var pintarVuelo = function (p) {
      avance = p;
      if (!destinos.length || reducido) return;
      papeles.forEach(function (el, i) {
        var u = suave(limitar((p - i * 0.05) / 0.55, 0, 1));
        var arco = Math.sin(Math.PI * u) * (i % 2 ? 60 : -60);
        el.style.transform = 'translate3d(' + (destinos[i].x * u + arco).toFixed(1) + 'px,' + (destinos[i].y * u).toFixed(1) + 'px,0) rotate(' + (u * (i % 2 ? 200 : -200)).toFixed(0) + 'deg) scale(' + (1 - 0.72 * u).toFixed(3) + ')';
        el.style.opacity = (1 - Math.pow(u, 6)).toFixed(2);
      });
    };
    medirVuelo();
    if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', medirVuelo);
    window.addEventListener('load', medirVuelo);
    if (!reducido && window.gsap) S.atado(pantallas, 'top 105%', 'center 58%', pintarVuelo);
    S.alVer(vuelo, function (v) { vuelo.classList.toggle('en-vista', v); });
  }

  /* ======================= Demo del dashboard ======================= */
  var dash = document.querySelector('.demo .dash');
  if (dash && pantallas && !reducido) {
    var cursor = dash.querySelector('.dash-cursor');
    var irCon = function (sel, x, y) {
      var d = S.lugarEn(dash.querySelector(sel), dash);
      cursor.style.transform = 'translate3d(' + (d.x + d.ancho * x).toFixed(1) + 'px,' + (d.y + d.alto * y).toFixed(1) + 'px,0)';
    };
    var tocar = function () {
      cursor.classList.add('toca');
      setTimeout(function () { cursor.classList.remove('toca'); }, 350);
    };
    var filtros = dash.querySelectorAll('.dash-filtro');
    var elegirFiltro = function (i) { filtros.forEach(function (f, k) { f.classList.toggle('activo', k === i); }); };
    S.guion(pantallas, [
      { dura: 4600 }, // la notebook se abre y se lee el total
      { dura: 1100, alEmpezar: function () { cursor.classList.add('visible'); irCon('.dash-menu-ventas', 0.5, 0.5); } },
      { dura: 500, alEmpezar: tocar },
      { dura: 1700, alEmpezar: function () { dash.classList.add('en-ventas'); } },
      { dura: 1000, alEmpezar: function () { irCon('.dash-filtro-cobradas', 0.5, 0.5); } },
      { dura: 400, alEmpezar: tocar },
      { dura: 1700, alEmpezar: function () { elegirFiltro(1); dash.classList.add('filtrado'); } },
      { dura: 1000, alEmpezar: function () { irCon('.dash-fila-elegida', 0.4, 0.5); } },
      { dura: 400, alEmpezar: tocar },
      { dura: 3600, alEmpezar: function () { dash.classList.add('con-detalle'); } },
      { dura: 1600, alEmpezar: function () {
        cursor.classList.remove('visible');
        dash.classList.remove('con-detalle', 'filtrado', 'en-ventas');
        elegirFiltro(0);
      } }
    ]);
  }

  /* ======================= Módulos ======================= */
  var modulos = document.querySelector('.modulos');
  if (modulos) {
    var botones = Array.prototype.slice.call(modulos.querySelectorAll('.modulo-boton'));
    var escritorio = window.matchMedia('(min-width: 1024px)');
    var VUELTA = 80000; // lo que tarda la órbita (igual que en el CSS)
    var moviendo = 0;

    var orbitas = function () {
      return botones.map(function (b) {
        return b.getAnimations ? b.getAnimations().filter(function (a) { return a.animationName === 'orbita'; })[0] : null;
      }).filter(Boolean);
    };

    // Lleva la órbita hasta que el módulo k quede del lado del panel
    var acercar = function (k) {
      var anims = orbitas();
      if (!anims.length) return;
      cancelAnimationFrame(moviendo);
      anims.forEach(function (a) { a.pause(); });
      var desde = (anims[0].currentTime || 0) % VUELTA;
      var destino = ((8 - k) % 8) / 8 * VUELTA;
      var falta = destino - desde;
      if (falta > VUELTA / 2) falta -= VUELTA;
      if (falta < -VUELTA / 2) falta += VUELTA;
      var inicio = performance.now();
      (function paso(ahora) {
        var t = Math.min((ahora - inicio) / 900, 1);
        var v = (desde + falta * suave(t) + VUELTA) % VUELTA;
        anims.forEach(function (a) { a.currentTime = v; });
        if (t < 1) moviendo = requestAnimationFrame(paso);
      })(inicio);
    };

    var abrir = function (k) {
      botones.forEach(function (b, i) {
        var abierto = i === k && b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(abierto));
        b.parentElement.classList.toggle('abierto', abierto);
      });
      var hay = botones.some(function (b) { return b.getAttribute('aria-expanded') === 'true'; });
      modulos.classList.toggle('con-panel', hay);
      if (!escritorio.matches) return;
      if (hay) acercar(k);
      else { cancelAnimationFrame(moviendo); orbitas().forEach(function (a) { a.play(); }); }
    };
    botones.forEach(function (b, i) { b.addEventListener('click', function () { abrir(i); }); });

    // Fuera de pantalla, la órbita se frena (si no hay un módulo abierto)
    S.alVer(modulos, function (v) { modulos.classList.toggle('en-vista', v); });
    S.alEntrar(modulos, function () { modulos.classList.add('visible'); }, 0.2);
  }

  /* ======================= Seguridad ======================= */
  var capas = document.querySelector('.capas');
  if (capas) S.alEntrar(capas, function () { capas.classList.add('encendidas'); }, 0.45);
  S.enOrden(document.querySelectorAll('.seguridad-lista > li'), 'encendida', 120);

  var roles = Array.prototype.slice.call(document.querySelectorAll('.permisos-rol'));
  if (roles.length) {
    var panel = document.getElementById('permisos-modulos');
    var elegirRol = function (i, foco) {
      var ve = roles[i].dataset.ve.split(',');
      roles.forEach(function (r, k) {
        r.setAttribute('aria-selected', String(k === i));
        r.tabIndex = k === i ? 0 : -1;
      });
      if (foco) roles[i].focus();
      panel.setAttribute('aria-labelledby', roles[i].id);
      panel.querySelectorAll('.permiso').forEach(function (p) {
        var abierto = ve.indexOf(p.dataset.modulo) >= 0;
        p.classList.toggle('abierto', abierto);
        p.querySelector('.permiso-estado').textContent = abierto ? 'Habilitado' : 'Bloqueado';
      });
    };
    roles.forEach(function (r, i) {
      r.addEventListener('click', function () { elegirRol(i); });
      r.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); elegirRol((i + d + roles.length) % roles.length, true); }
      });
    });
  }

  /* ======================= Siempre con vos ======================= */
  var equipos = document.querySelector('.equipos');
  if (equipos) {
    S.alEntrar(equipos, function () { equipos.classList.add('visible'); }, 0.3);
    if (!reducido) {
      var datos = equipos.querySelectorAll('.equipo-dato');
      var cambiar = function (texto) {
        return function () {
          equipos.classList.remove('cambio');
          void equipos.offsetWidth; // reinicia el destello
          equipos.classList.add('cambio');
          datos.forEach(function (d) { d.textContent = texto; });
        };
      };
      S.guion(equipos, [
        { dura: 2600 },
        { dura: 2200, alEmpezar: cambiar('$ 523.700') },
        { dura: 2200, alEmpezar: cambiar('$ 548.200') },
        { dura: 2200, alEmpezar: cambiar('$ 571.900') },
        { dura: 400, alEmpezar: cambiar('$ 485.300') }
      ]);
    }
  }

  /* ======================= Capacitación ======================= */
  var circulo = document.querySelector('.capacitacion-circulo');
  if (circulo) S.alEntrar(circulo, function () {
    circulo.querySelector('.indicador').classList.add('lleno');
    circulo.classList.add('lista');
  }, 0.5);

  /* ======================= Caso real ======================= */
  var caso = document.querySelector('.caso-real-pasos');
  if (caso) S.alEntrar(caso, function () { caso.classList.add('resuelto'); }, 0.5);
})();
