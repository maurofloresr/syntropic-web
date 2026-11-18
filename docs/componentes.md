# Componentes: web Syntropic

Lo mantiene Claude Code. Registro de las piezas reutilizables, para usarlas en las páginas de servicio de la v2 en vez de duplicarlas.

## Archivos

- `sitio/assets/css/base.css`: fuentes, paleta, reset, botón, tarjeta de vidrio, foco, movimiento reducido.
- `sitio/assets/css/componentes.css`: los componentes de abajo.
- `sitio/assets/css/secciones.css`: disposición de cada sección de la landing (no se reutiliza).
- `sitio/assets/js/interfaz.js`: menú hamburguesa, elección de cliente, WhatsApp que se esconde con el formulario en mobile.
- `sitio/assets/img/iconos.svg`: todos los íconos en un solo archivo.

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
| Marco reservado | `.marco .marco-notebook`, `.marco .marco-celular` | componentes.css | Lugar de las pantallas de Desarrollo web y Sistemas hasta la Fase 3 |
| Nodo | `.nodo` + `.nodo-texto` | componentes.css | Lienzo de Automatizaciones |
| Bloque | `.bloque` | componentes.css | Seguro, Sencillo, Personalizado |
| Acordeón | `.acordeon` + `.acordeon-item` (details/summary) | componentes.css | Preguntas frecuentes |
| Opción seleccionable | `.opcion` + `.opcion-input` | componentes.css | Paso 1 del formulario |
| WhatsApp flotante | `.whatsapp` | componentes.css | Toda la web |

## Anclas y menú fijo

Cada `.seccion` calcula su `scroll-margin-top` con `--altura-menu` y su espacio de arriba (`--seccion-espacio`): al llegar desde un link, el h2 frena siempre 40 px debajo del menú (96 px desde arriba en mobile y tablet, 112 px en desktop). Si se cambia el alto del menú o el espacio de las secciones, no hay que tocar nada más. El scroll suave es `scroll-behavior: smooth` en `base.css` y se apaga con `prefers-reduced-motion`.

## Cortes de pantalla

Mobile first desde 390 px. Tablet desde 768 px. Desktop desde 1024 px.
