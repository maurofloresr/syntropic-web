/* ==========================================================================
   Syntropic: página Automatizaciones (docs/paginas-servicio.md)
   - Hilo conductor: un cable baja por la izquierda de toda la página, un
     punto de luz lo recorre con el scroll y cada sección tiene un nodo que
     se enciende y late cuando el punto llega.
   - El problema: las tareas a mano se apilan y el pulso las ordena en fila.
   - Recorridos (Qué incluye y Vos seguís al mando): un pulso que pasa de
     nodo en nodo, en loop, con un reloj que se frena fuera de pantalla.
   - Lo que no tiene límite: puntos sueltos que se conectan en una red.
   - Beneficios y conexiones: en CSS, se prenden solo mientras se ven.
   El lienzo interactivo del hero está en lienzo.js.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.Syntropic;
  var reducido = S.reducido;
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function suave(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ======================= Hilo conductor ======================= */
  var main = document.querySelector('main');
  (function () {
    var hilo = document.createElement('div');
    hilo.className = 'hilo';
    hilo.setAttribute('aria-hidden', 'true');
    hilo.innerHTML = '<span class="hilo-cable"></span><span class="hilo-luz"></span>';
    var punto = document.createElement('span');
    punto.className = 'hilo-punto';
    hilo.appendChild(punto);
    var luz = hilo.querySelector('.hilo-luz');
    var paradas = [];
    main.querySelectorAll(':scope > section').forEach(function (sec) {
      var titulo = sec.querySelector('h1, h2');
      if (!titulo) return;
      var nodo = document.createElement('span');
      nodo.className = 'hilo-nodo';
      hilo.appendChild(nodo);
      paradas.push({ titulo: titulo, nodo: nodo, y: 0 });
    });
    main.insertBefore(hilo, main.firstChild);
    var alto = 1, ultimo = -1;

    function medir() {
      alto = main.offsetHeight;
      paradas.forEach(function (p) {
        // Centro de la primera línea del título
        var linea = parseFloat(getComputedStyle(p.titulo).fontSize) * 0.55;
        p.y = S.lugarEn(p.titulo, main).y + linea;
        p.nodo.style.top = p.y + 'px';
      });
      ultimo = -1;
      pintar(scrollActual);
    }

    var scrollActual = window.scrollY;
    function pintar(s) {
      scrollActual = s;
      var H = window.innerHeight;
      // Arranca arriba de la pantalla y enseguida baja a la mitad
      var y = limitar(s + H * (0.16 + 0.36 * limitar(s / (H * 0.5), 0, 1)), 0, alto);
      if (Math.abs(y - ultimo) < 0.2) return;
      ultimo = y;
      punto.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      luz.style.transform = 'scaleY(' + (y / alto).toFixed(5) + ')';
      paradas.forEach(function (p) { p.nodo.classList.toggle('encendido', y >= p.y); });
    }

    if (reducido || !window.gsap || !window.ScrollTrigger) {
      hilo.classList.add('quieto');
      luz.style.transform = 'none';
      paradas.forEach(function (p) { p.nodo.classList.add('encendido'); });
    } else {
      var dato = { p: 0 };
      gsap.to(dato, {
        p: 1, ease: 'none',
        onUpdate: function () { pintar(dato.p * ScrollTrigger.maxScroll(window)); },
        scrollTrigger: { start: 0, end: 'max', scrub: 0.35 }
      });
      ScrollTrigger.addEventListener('refresh', medir);
    }
    medir();
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(main);
  })();

  /* ======================= El problema: la pila de tareas ======================= */
  var pila = document.querySelector('.pila');
  if (pila) {
    var cancha = pila.querySelector('.pila-cancha');
    var tareas = Array.prototype.slice.call(pila.querySelectorAll('.pila-tarea'));
    var numero = pila.querySelector('.pila-numero');
    var cable = pila.querySelector('.pila-cable');
    var pulso = pila.querySelector('.pila-pulso');
    var n = tareas.length;
    // Desorden fijo: lugar (0 a 1 del ancho y del alto) y giro de cada tarea
    var DESORDEN = tareas.map(function (t, i) {
      return { x: ((i * 0.382 + 0.11) % 1), y: ((i * 0.29 + 0.07) % 1), giro: ((i * 47) % 70) - 35 };
    });
    var lugares = [], anchoC = 0, altoC = 0, avancePila = reducido ? 1 : 0;

    function medirPila() {
      anchoC = cancha.offsetWidth; altoC = cancha.offsetHeight;
      var t = tareas[0].offsetWidth;
      var filas = anchoC < 700 ? 2 : 1, porFila = Math.ceil(n / filas);
      var paso = anchoC / porFila;
      lugares = tareas.map(function (el, i) {
        var f = Math.floor(i / porFila), c = i % porFila;
        return {
          x: paso * c + (paso - t) / 2,
          y: altoC / 2 + (filas === 1 ? -t / 2 : (f ? 10 : -t - 10)),
          cx: DESORDEN[i].x * (anchoC - t), cy: DESORDEN[i].y * (altoC - t),
          columna: (c + 0.5) / porFila
        };
      });
      pintarPila(avancePila);
    }

    function pintarPila(p) {
      avancePila = p;
      if (!lugares.length) return;
      var barrido = limitar((p - 0.55) / 0.4, 0, 1); // el pulso entra por la izquierda y barre
      var aMano = 0;
      tareas.forEach(function (el, i) {
        var l = lugares[i], d = DESORDEN[i];
        var cae = suave(limitar((p - i / n * 0.38) / 0.14, 0, 1));
        var orden = suave(limitar((barrido * 1.25 - l.columna) / 0.22, 0, 1));
        if (cae > 0.5 && orden < 0.5) aMano++;
        var x = l.cx + (l.x - l.cx) * orden, y = l.cy + (l.y - l.cy) * orden - (1 - cae) * 90;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + (d.giro * (1 - orden) + (1 - cae) * 40).toFixed(1) + 'deg)';
        el.style.opacity = cae.toFixed(2);
        el.classList.toggle('ordenada', orden > 0.6);
      });
      numero.textContent = aMano;
      cable.style.transform = 'scaleX(' + barrido.toFixed(3) + ')';
      pulso.style.transform = 'translate3d(' + (barrido * anchoC).toFixed(1) + 'px,0,0)';
      pulso.style.opacity = barrido > 0.01 && barrido < 0.99 ? 1 : 0;
    }

    medirPila();
    if ('ResizeObserver' in window) new ResizeObserver(medirPila).observe(cancha);
    S.atado(pila, 'top 88%', 'bottom 45%', pintarPila);
  }

  /* ======================= Recorridos: un pulso de nodo en nodo ======================= */
  document.querySelectorAll('[data-recorrido]').forEach(function (lista) {
    var nodos = Array.prototype.slice.call(lista.querySelectorAll('[data-nodo]'));
    var svg = S.svg('svg', { 'class': 'recorrido-cables', focusable: 'false' });
    var li = document.createElement('li');
    li.className = 'recorrido-dibujo';
    li.setAttribute('aria-hidden', 'true');
    li.appendChild(svg);
    lista.appendChild(li);
    var tramos = nodos.slice(1).map(function () { return S.svg('path', { 'class': 'recorrido-cable' }, svg); });
    var punto = S.svg('circle', { 'class': 'recorrido-punto', r: 4, opacity: 0 }, svg);

    /* Un cable entre cada nodo y el siguiente: de costado si están en la
       misma fila, de abajo hacia arriba si están uno debajo del otro */
    function dibujar() {
      svg.setAttribute('viewBox', '0 0 ' + lista.offsetWidth + ' ' + lista.offsetHeight);
      nodos.slice(1).forEach(function (b, i) {
        var A = S.lugarEn(nodos[i], lista), B = S.lugarEn(b, lista), d;
        if (B.y > A.y + A.alto - 4) {
          var x0 = A.x + Math.min(A.ancho, B.ancho) * 0.12 + 10;
          d = 'M' + x0 + ',' + (A.y + A.alto) + ' L' + x0 + ',' + B.y;
        } else {
          var ya = A.y + A.alto / 2, yb = B.y + B.alto / 2, dx = (B.x - A.x - A.ancho) / 2;
          d = 'M' + (A.x + A.ancho) + ',' + ya + ' C' + (A.x + A.ancho + dx) + ',' + ya + ' ' + (B.x - dx) + ',' + yb + ' ' + B.x + ',' + yb;
        }
        tramos[i].setAttribute('d', d);
      });
    }
    dibujar();
    if ('ResizeObserver' in window) new ResizeObserver(dibujar).observe(lista);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(dibujar);

    var revision = lista.querySelector('.nodo-revision');
    if (reducido) { if (revision) revision.classList.add('aprobado'); return; }

    function brillar(el) {
      el.classList.add('con-pulso');
      setTimeout(function () { el.classList.remove('con-pulso'); }, 900);
    }

    // Guion del loop: pares [dura, qué hace en cada cuadro o al terminar]
    var VIAJE = 620, guion = [];
    nodos.forEach(function (nodo, i) {
      guion.push({ dura: 60, alEmpezar: function () { brillar(nodo); } });
      var frena = +nodo.dataset.frena || 0;
      if (frena) {
        guion.push({ dura: frena, alEmpezar: function () { nodo.classList.add('titila'); } });
        guion.push({ dura: 900, alEmpezar: function () { nodo.classList.remove('titila'); nodo.classList.add('aprobado'); brillar(nodo); } });
      }
      if (i < tramos.length) guion.push({ dura: VIAJE, tramo: i });
    });
    guion.push({ dura: 1600, alEmpezar: function () { if (revision) revision.classList.remove('aprobado'); } });

    var paso = 0, t = 0, ultimo = 0, cuadro = 0, empezo = false, enVista = false;
    function pintar(ahora) {
      t += Math.min(ahora - ultimo, 50);
      ultimo = ahora;
      var g = guion[paso];
      if (!empezo) { empezo = true; if (g.alEmpezar) g.alEmpezar(); }
      if (g.tramo !== undefined) {
        var camino = tramos[g.tramo], p = limitar(t / g.dura, 0, 1);
        var pt = camino.getPointAtLength(suave(p) * camino.getTotalLength());
        punto.setAttribute('cx', pt.x.toFixed(1));
        punto.setAttribute('cy', pt.y.toFixed(1));
        punto.setAttribute('opacity', '1');
      } else punto.setAttribute('opacity', '0');
      if (t >= g.dura) { t = 0; empezo = false; paso = (paso + 1) % guion.length; }
      cuadro = requestAnimationFrame(pintar);
    }
    function actualizar() {
      var correr = enVista && !document.hidden;
      if (correr && !cuadro) { ultimo = performance.now(); cuadro = requestAnimationFrame(pintar); }
      else if (!correr && cuadro) { cancelAnimationFrame(cuadro); cuadro = 0; }
    }
    S.alVer(lista, function (v) { enVista = v; actualizar(); });
    document.addEventListener('visibilitychange', actualizar);
  });

  /* ======================= Lo que no tiene límite: de puntos a red ======================= */
  var red = document.querySelector('.limite-red');
  if (red) {
    var ancha = window.innerWidth >= 768;
    var W = ancha ? 1200 : 390, H = ancha ? 560 : 620;
    var svg = S.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid slice', focusable: 'false' }, red);
    var columnas = ancha ? 9 : 4, filas = ancha ? 5 : 7, puntos = [];
    for (var f = 0; f < filas; f++) {
      for (var c = 0; c < columnas; c++) {
        puntos.push({ x: (c + 0.2 + Math.random() * 0.6) * W / columnas, y: (f + 0.2 + Math.random() * 0.6) * H / filas });
      }
    }
    // Cada punto se une con sus dos vecinos más cercanos (sin repetir cables)
    var hechas = {}, orden = 0;
    puntos.forEach(function (p, i) {
      puntos.map(function (q, j) { return { j: j, d: Math.hypot(p.x - q.x, p.y - q.y) }; })
        .filter(function (o) { return o.j !== i; })
        .sort(function (a, b) { return a.d - b.d; })
        .slice(0, 2)
        .forEach(function (o) {
          var clave = Math.min(i, o.j) + '-' + Math.max(i, o.j);
          if (hechas[clave]) return;
          hechas[clave] = true;
          var l = S.svg('path', { 'class': 'red-linea', d: 'M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + 'L' + puntos[o.j].x.toFixed(1) + ' ' + puntos[o.j].y.toFixed(1), pathLength: '1' }, svg);
          l.style.setProperty('--orden', orden++);
        });
    });
    puntos.forEach(function (p, i) {
      var k = S.svg('circle', { 'class': 'red-punto', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: (1.6 + Math.random() * 2).toFixed(1) }, svg);
      k.style.setProperty('--dx', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
      k.style.setProperty('--dy', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
      k.style.setProperty('--orden', i);
    });
    S.alEntrar(red, function () { red.classList.add('unida'); }, 0.35);
  }

  /* ======================= Se prenden solo mientras se ven ======================= */
  document.querySelectorAll('.beneficios-lista, .conexiones .conectamos-lista').forEach(function (el) {
    S.alVer(el, function (v) { el.classList.toggle('en-vista', v); });
  });
  var listaB = document.querySelectorAll('.beneficio');
  S.enOrden(listaB, 'visible', 160);
})();
