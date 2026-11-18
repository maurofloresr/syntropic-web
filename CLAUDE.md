# Web Syntropic: reglas del proyecto

Web propia de Syntropic (webs, automatizaciones y sistemas). Es la vidriera de la marca y la prueba de lo que vendemos: tiene que ser rápida, accesible y con buen SEO, además de impactante.

## Antes de cada tarea

1. Leer `docs/brief.md` (qué se construye y cómo se ve), `docs/roadmap.md` (en qué orden) y `docs/progress.md` (dónde quedamos).
2. Trabajar SOLO la fase y el paso que indica `docs/progress.md`. No adelantar fases.
3. Arrancar en plan mode y presentar el plan antes de tocar archivos.
4. Las imágenes de referencia están en `originales/mockups/`. Son la guía de forma y estilo, no un diseño pixel perfect: tienen errores de texto de la IA que las generó. Los textos correctos están en `docs/brief.md`.

## Reglas que nunca se rompen

- Paleta: SOLO los colores de `docs/brief.md` (sección Marca). Ningún otro color, salvo el verde de WhatsApp #25D366.
- Tipografías: SOLO Archivo Expanded (títulos) e Inter (textos), autoalojadas desde `../branding/Tipografías/`. Nada de Google Fonts.
- Logos: SOLO los de `../branding/Logos/`. No redibujar la S.
- Syntropic es una empresa: los textos van siempre en plural ("creamos", "te respondemos"). Al cliente se le habla de vos.
- No inventar textos, datos, clientes, números ni links. Si falta algo, dejar un marcador visible `[FALTA: ...]` y anotarlo en `docs/progress.md` > Pendiente.
- Nada de rayas largas (em dash) en los textos.
- `originales/` y `../branding/` son de solo lectura. Lo que se necesite se copia o convierte dentro de `sitio/assets/`.
- Todo el texto importante es HTML real (títulos h1/h2, párrafos). Las animaciones van por encima, nunca reemplazan el texto (SEO y accesibilidad).
- Respetar `prefers-reduced-motion`: sin animaciones pesadas, títulos estáticos.
- Mobile first: cada sección se construye y prueba primero en 390 px de ancho.

## Stack

- HTML + CSS + JavaScript sin framework. Sitio estático en `sitio/`.
- GSAP + ScrollTrigger para animaciones atadas al scroll (archivos locales en `sitio/assets/js/vendor/`, no CDN).
- Canvas 2D para la galaxia y las partículas de bytes (un solo canvas fijo para todo el sitio).
- Servidor local (desde `web/`): `python -m http.server 8000 --directory sitio --bind 0.0.0.0`. Se ve en `http://localhost:8000` y en el celu con la IP local de la PC (misma red WiFi).
- Deploy: Cloudflare Pages. Se sube una carpeta `publicar/` con todo minificado y sin comentarios. `sitio/` queda como versión legible.

## Estructura

```
web/
  CLAUDE.md          reglas (de Mauro)
  docs/
    brief.md         qué se construye (de Mauro, escrito con Claude.ai)
    roadmap.md       fases y pasos (de Mauro)
    progress.md      estado (lo mantiene Claude Code)
  originales/mockups imágenes de referencia (solo lectura)
  sitio/             código fuente legible
  publicar/          build minificado para Cloudflare (se genera en la fase final)
```

## Al cerrar cada paso

- Actualizar `docs/progress.md`: qué se hizo, qué quedó pendiente, qué decisión necesita Mauro.
- Commit y push a GitHub (`origin`, repo privado maurofloresr/syntropic-web, rama `main`). En este proyecto Mauro autorizó el push al cerrar cada paso, sin pedirlo cada vez.
- Contarle a Mauro en palabras qué cambió y cómo verlo (qué sección, en qué ancho de pantalla). No mostrarle código salvo que lo pida.
- Avisar aparte si un cambio afecta cómo funciona el proyecto de ahí en adelante.
- Si algo del brief no se puede hacer o hay una forma mejor, avisar antes de cambiarlo. Las decisiones las toma Mauro.
