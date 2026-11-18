# Progress: web Syntropic

Lo mantiene Claude Code. Se actualiza al cerrar cada paso.

## Actual

- Fase 1, paso 2 terminado (maquetación mobile first, tablet y desktop). Esperando revisión de Mauro. Próximo: paso 3 (scroll suave del menú).
- Decisiones de Mauro en la Fase 1, paso 2:
  - Íconos copiados de Lucide (línea) y Simple Icons (marcas) a un solo archivo `iconos.svg`, sin instalar nada. Ícono de Desarrollo web del formulario: laptop y smartphone de Lucide juntos (no existe uno combinado).
  - En mobile los botones de sección ocupan todo el ancho menos el lugar del botón de WhatsApp: nunca se superponen.
  - Nodos de Automatizaciones con dos líneas también en mobile.
  - Se creó `docs/componentes.md`.
- Decisiones de Mauro en la Fase 1, paso 1:
  - Botón de WhatsApp: etiqueta chica `[FALTA: número de WhatsApp]` (en el paso 2 quedó arriba del círculo, del mismo ancho, para no tapar los botones) y link sin destino hasta tener el número.
  - Preguntas frecuentes: las 5 propuestas del brief tal cual, con el desplegable nativo del navegador.
  - Formulario: "Paso 1 de 5". Solo el paso 1 armado; el resto es de la Fase 4.
  - Se muestran los nombres de los clientes (el permiso se confirma antes de publicar).
  - Los botones de las secciones marcan el servicio con un atributo `data-servicio` y apuntan a `#contacto`; la lógica es de la Fase 4.
- Decisiones de Mauro en la Fase 0:
  - Logo del menú: `Tipo_Blanco.png` (solo la palabra). Logo del footer: `Syntropic_LogoBlanco.png` (apilado). Se mantiene el "DEV" en los logos.
  - Fuentes en WOFF2 subseteadas a caracteres latinos (incluye á é í ó ú ü ñ, mayúsculas, ¿ ¡ $ % @ « »).
  - Repo git local conectado a GitHub (privado). Push autorizado por Mauro al cerrar cada paso.

## Pendiente

- Todo el roadmap desde la Fase 1.
- Pendientes de Mauro: ver `docs/brief.md`, sección 11.
- [FALTA] logos de LinkedIn (footer), Excel y Slack ("Y también conectamos"): Simple Icons ya no los tiene. Decide Mauro de dónde salen.

## Hecho

- 18/11: Fase 1, paso 2: maquetación de toda la landing a 390, 768 y 1440 px siguiendo los mockups 01 a 06. Nuevos `componentes.css`, `secciones.css`, `interfaz.js` (menú hamburguesa a pantalla completa, elección de cliente, WhatsApp que se esconde con el formulario en mobile) e `iconos.svg`. Sin scroll horizontal en ningún ancho, orden de teclado verificado.
- 18/11: brief, roadmap y reglas del proyecto escritos con Mauro en Claude.ai.
- 18/11: Fase 0 aprobada por Mauro.
- 18/11: Fase 1, paso 1: HTML semántico de toda la landing (menú, hero, 3 secciones, preguntas frecuentes, formulario paso 1, footer, WhatsApp) con los textos del brief y marcadores `[FALTA]`. Un h1, un h2 por sección, anclas del menú verificadas. Sin estilos de sección todavía.
- 18/11: Fase 0 completa. Estructura de `sitio/`, fuentes WOFF2 (Archivo Expanded Black y Bold, Inter Regular, Medium y SemiBold), logos blancos en WebP (más el isologo en PNG para las partículas), `base.css` con paleta, reset, botón y tarjeta de vidrio, GSAP y ScrollTrigger 3.15.1 locales, servidor local con Python. Probado a 390 px y 1440 px.
