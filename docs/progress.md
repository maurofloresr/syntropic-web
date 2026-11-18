# Progress: web Syntropic

Lo mantiene Claude Code. Se actualiza al cerrar cada paso.

## Actual

- Fase 0 (Base) terminada. Esperando la revisión de Mauro: fondo navy, tipografías y botón de prueba en `sitio/index.html`.
- Decisiones de Mauro en la Fase 0:
  - Logo del menú: `Tipo_Blanco.png` (solo la palabra). Logo del footer: `Syntropic_LogoBlanco.png` (apilado). Se mantiene el "DEV" en los logos.
  - Fuentes en WOFF2 subseteadas a caracteres latinos (incluye á é í ó ú ü ñ, mayúsculas, ¿ ¡ $ % @ « »).
  - Repo git local conectado a GitHub (privado). Push autorizado por Mauro al cerrar cada paso.

## Pendiente

- Todo el roadmap desde la Fase 1.
- Pendientes de Mauro: ver `docs/brief.md`, sección 11.

## Hecho

- 18/11: brief, roadmap y reglas del proyecto escritos con Mauro en Claude.ai.
- 18/11: Fase 0 completa. Estructura de `sitio/`, fuentes WOFF2 (Archivo Expanded Black y Bold, Inter Regular, Medium y SemiBold), logos blancos en WebP (más el isologo en PNG para las partículas), `base.css` con paleta, reset, botón y tarjeta de vidrio, GSAP y ScrollTrigger 3.15.1 locales, servidor local con Python. Probado a 390 px y 1440 px.
