# Progress: web Syntropic

Lo mantiene Claude Code. Se actualiza al cerrar cada paso.

## Actual

- Fase 1, paso 4 terminado (tamaño final de los h2). Fase 1 completa, esperando revisión de Mauro. Siguiente: Fase 2 (sistema de partículas), pedida por Mauro en la misma sesión.
- Decisiones tomadas en el paso 4 (Mauro no estaba disponible, revisar):
  - Un solo tamaño para los h2 de la cadena: 9.4% del ancho de pantalla con tope de 72 px. En 390 px "DESARROLLO WEB" pasa a dos líneas (como el mockup mobile) y queda a 37 px; Automatizaciones mantiene su tamaño ajustado al ancho. Preguntas frecuentes no cambia.
  - En tablet y desktop el ancho máximo de Automatizaciones pasó a la frase y la bajada, para que el h2 no se salga de su caja.
- Decisiones de Mauro en el paso 3:
  - Galaxia del hero en mobile: mínimo 35% del alto de pantalla (antes 40%), para que "Hablemos" se vea sin scrollear también en pantallas bajas (iPhone con barras de Safari, iPhone SE).
  - Menú fijo: 56 px en mobile y tablet, 72 px en desktop.
- Decisiones de Mauro en los ajustes del paso 2:
  - Sin LinkedIn en ningún lado (footer ni datos estructurados). Instagram: https://www.instagram.com/syntropic__/. TikTok y Facebook en el footer como `[FALTA]` hasta que estén creados.
  - "Y también conectamos": sin Slack, se suman Make y Airtable (Simple Icons). Excel con el ícono de planilla de Lucide y la palabra "Excel", porque Microsoft no publica un ícono monocromo oficial.
  - Menú fijo arriba, siempre visible, con vidrio esmerilado (desenfoque y tinte navy muy transparente). 56 px de alto en mobile.
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
- [FALTA] links de TikTok y Facebook de Syntropic (footer): se suman cuando estén creadas las cuentas.

## Hecho

- 18/11: Fase 1, paso 4: h2 con tamaño y estilo finales. Medidos en 320, 360, 390, 768, 1024 y 1440 px: sin desbordes ni scroll horizontal, "DESARROLLO / WEB" en dos líneas en todos los anchos.
- 18/11: Fase 1, paso 3: cada link (menú, menú hamburguesa, logo, Scrolleá, botones de sección, footer) baja con scroll suave y el título frena 40 px debajo del menú fijo, en las dos alturas del menú. Con movimiento reducido salta directo. Galaxia mobile al 35% y menú desktop a 72 px. Probado en 390x844, 390x664, 375x667, 768 y 1440 px.
- 18/11: ajustes del paso 2: LinkedIn fuera del footer, link real de Instagram, TikTok y Facebook como `[FALTA]`; Slack fuera y Make, Airtable y Excel adentro de "Y también conectamos"; menú fijo con vidrio esmerilado (56 px en mobile). Brief sección 3 y `componentes.md` actualizados. Probado en 390, 768 y 1440 px.
- 18/11: Fase 1, paso 2: maquetación de toda la landing a 390, 768 y 1440 px siguiendo los mockups 01 a 06. Nuevos `componentes.css`, `secciones.css`, `interfaz.js` (menú hamburguesa a pantalla completa, elección de cliente, WhatsApp que se esconde con el formulario en mobile) e `iconos.svg`. Sin scroll horizontal en ningún ancho, orden de teclado verificado.
- 18/11: brief, roadmap y reglas del proyecto escritos con Mauro en Claude.ai.
- 18/11: Fase 0 aprobada por Mauro.
- 18/11: Fase 1, paso 1: HTML semántico de toda la landing (menú, hero, 3 secciones, preguntas frecuentes, formulario paso 1, footer, WhatsApp) con los textos del brief y marcadores `[FALTA]`. Un h1, un h2 por sección, anclas del menú verificadas. Sin estilos de sección todavía.
- 18/11: Fase 0 completa. Estructura de `sitio/`, fuentes WOFF2 (Archivo Expanded Black y Bold, Inter Regular, Medium y SemiBold), logos blancos en WebP (más el isologo en PNG para las partículas), `base.css` con paleta, reset, botón y tarjeta de vidrio, GSAP y ScrollTrigger 3.15.1 locales, servidor local con Python. Probado a 390 px y 1440 px.
