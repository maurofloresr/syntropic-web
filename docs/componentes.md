# Componentes: web Syntropic

Lo mantiene Claude Code. Registro de las piezas reutilizables, para usarlas en las páginas de servicio de la v2 en vez de duplicarlas.

## Archivos

- `sitio/assets/css/base.css`: fuentes, paleta, reset, botón, tarjeta de vidrio, foco, movimiento reducido.
- `sitio/assets/css/componentes.css`: los componentes de abajo.
- `sitio/assets/css/secciones.css`: disposición de cada sección de la landing (no se reutiliza).
- `sitio/assets/js/interfaz.js`: menú hamburguesa y WhatsApp que se esconde con el formulario en mobile.
- `sitio/assets/js/secciones.js`: animaciones de cada sección (Fase 3). Funciones de ayuda `alEntrar` (una vez, al aparecer en pantalla), `alVer` (cada vez que entra o sale) y `cuandoLibre`. Las entradas se disparan con IntersectionObserver y no con posiciones de scroll, para que el pin del hero y el parallax no las corran. Desarrollo web: cambio de cliente, rotación automática, carga diferida de capturas, entrada de las pantallas e indicador del puntaje.
- `sitio/assets/img/clientes/`: capturas de las webs de clientes en WebP, `<cliente>-desktop.webp` (1280x800) y `<cliente>-mobile.webp` (600x1298, sacada a 390x844 con pantalla retina). Solo la primera pantalla de cada web.
- `sitio/assets/img/iconos.svg`: todos los íconos en un solo archivo.
- `sitio/assets/js/particulas.js`: sistema de partículas (galaxia, S, títulos de 0 y 1, espiral atada al scroll, estrellas fugaces, luces al tocar). Ver "Partículas" abajo.
- `sitio/assets/img/isologo-s-muestreo.png`: copia del isologo blanco SIN el "DEV", recortada a la S y a 400 px de ancho. Solo se usa para muestrear la forma de la S (el original de `../branding/` no se tocó).

## Íconos

Uso: `<svg class="icono" aria-hidden="true"><use href="assets/img/iconos.svg#i-NOMBRE"></use></svg>`. Toman el color del texto (`color`) y el grosor de línea se ajusta con `stroke-width` en CSS.

- De línea (Lucide 1.75.0, licencia ISC): search, bot, smartphone, zap, chart-column, palette, globe, shopping-bag, calendar, file-spreadsheet, bell, shield, pointer, puzzle, waypoints, layout-dashboard, check, x, arrow-down, arrow-right, mail.
- Marcas (Simple Icons 16.38.0, CC0): whatsapp, gmail, instagram, mercadopago, facebook, notion, googledrive, calendly, trello, zoom, make, airtable, tiktok.
- Armado: `web-dispositivos` (laptop y smartphone de Lucide juntos, para la tarjeta Desarrollo web del formulario).
- Excel: Microsoft no publica una versión monocroma oficial (sus íconos son a color y no se pueden recolorear). Se usa `file-spreadsheet` de Lucide con la palabra "Excel" al lado (clase `.conectamos-con-nombre`).

## Componentes

| Componente | Clase | Archivo | Dónde se usa |
| --- | --- | --- | --- |
| Menú fijo de vidrio | `.menu` (el vidrio va en `.menu::before`) | secciones.css | Toda la web. Fijo arriba, sin fondo sólido: desenfoque de 14 px y tinte navy al 35% (al 85% si el navegador no soporta desenfoque). Alto en `--altura-menu`: 56 px en mobile y tablet, 72 px en desktop. El vidrio va en un pseudo-elemento porque un `backdrop-filter` en el header encerraría el menú mobile de pantalla completa |
| Botón | `.boton` | base.css | Todos los botones azules |
| Botón de sección | `.boton .boton-seccion` | componentes.css | Hablemos, Quiero mi web, Automatizar mi negocio, Quiero mi sistema. En mobile deja libre el lugar del botón de WhatsApp |
| Tarjeta de vidrio | `.tarjeta-vidrio` | base.css | Tarjeta del puntaje, formulario |
| Ícono | `.icono` | componentes.css | En todos lados |
| Etiqueta | `.etiqueta` | componentes.css | Arriba del h1, "Ya confiaron en nosotros", "Y también conectamos" |
| Frase y bajada | `.frase`, `.bajada` | componentes.css | Debajo de cada h2 |
| Píldora | `.pildora` | componentes.css | Desarrollo web (6 etiquetas) |
| Marco reservado | `.marco .marco-notebook` | componentes.css | Lugar de la notebook de Sistemas hasta el paso 3 de la Fase 3 |
| Notebook | `.notebook` > `.notebook-tapa` > `.pantalla`, más `.notebook-base` | componentes.css | Desarrollo web (desde tablet). Hecha en CSS, medidas en % para que escale con el ancho. El aluminio es celeste claro con transparencia |
| Celular | `.celular` > `.pantalla` | componentes.css | Desarrollo web. Con la isla de la cámara en `::after` |
| Pantalla con capturas | `.pantalla` + `.pantalla-captura` (`.activa` la que se ve) | componentes.css | Dentro de la notebook y el celular. Las capturas van apiladas y cambian con un fundido. Las que llevan `data-src` se cargan después |
| Indicador circular | `.indicador` (SVG con `.indicador-fondo` y `.indicador-arco`) | componentes.css | Tarjeta del puntaje. Con `data-puntaje` (0 a 100), el arco se llena al entrar en pantalla (clase `.lleno`). Sin puntaje queda solo el aro de fondo |
| Nodo | `.nodo` + `.nodo-texto` | componentes.css | Lienzo de Automatizaciones |
| Bloque | `.bloque` | componentes.css | Seguro, Sencillo, Personalizado |
| Acordeón | `.acordeon` + `.acordeon-item` (details/summary) | componentes.css | Preguntas frecuentes |
| Opción seleccionable | `.opcion` + `.opcion-input` | componentes.css | Paso 1 del formulario |
| WhatsApp flotante | `.whatsapp` | componentes.css | Toda la web |
| Canvas de partículas | `.particulas` (fijo) y `.particulas-estaticas` (movimiento reducido) | componentes.css | Lo crea `particulas.js`. `main` y `.footer` van por encima (z-index 1) |

## Anclas y menú fijo

Cada `.seccion` calcula su `scroll-margin-top` con `--altura-menu` y su espacio de arriba (`--seccion-espacio`): al llegar desde un link, el h2 frena siempre 40 px debajo del menú (96 px desde arriba en mobile y tablet, 112 px en desktop). Si se cambia el alto del menú o el espacio de las secciones, no hay que tocar nada más. El scroll suave es `scroll-behavior: smooth` en `base.css` y se apaga con `prefers-reduced-motion`.

## Cortes de pantalla

Mobile first desde 390 px. Tablet desde 768 px. Desktop desde 1024 px.

## Partículas

- Un solo canvas fijo detrás del contenido, creado por JavaScript al terminar la carga (sin JavaScript no existe y los h2 se ven normales).
- Estados en orden: galaxia, S, y los h2 con id `titulo-desarrollo-web`, `titulo-automatizaciones`, `titulo-sistemas`, `titulo-contacto`. Para sumar o sacar un título de la cadena se edita la lista `TITULOS` al principio de `particulas.js`.
- Los títulos se muestrean del h2 real (misma posición, tamaño y cortes de línea), así que si cambia el CSS del h2 las partículas lo siguen solas.
- El avance lo marca el scroll con ScrollTrigger (scrub de 0,6 s). Cada título queda formado cuando su h2 llega al 20% de la altura de la pantalla (o 40 px debajo del menú, lo que sea más bajo); ahí aparece el h2 real con un fade y las partículas se apagan.
- Cantidad: 900 partículas en mobile, 2500 en desktop (1800 en compus de 4 núcleos o menos). 90 o 220 de ellas quedan como estrellas de fondo en las secciones.
- Galaxia y S suben más lento que la página (parallax): 0,45 en desktop y 0,2 en el diseño en columna (hasta 1024 px). En columna la S se forma con el primer 14% de pantalla de scroll, antes de que el texto del hero la pise.
- Se pausa con la pestaña oculta. Con `prefers-reduced-motion`: sin canvas fijo, una S estática de puntos dentro de `.hero-visual` y los h2 normales.
