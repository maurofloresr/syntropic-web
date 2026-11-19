# Roadmap: web Syntropic

Orden de construcción. Una fase a la vez; cada fase termina con Mauro revisando y aprobando antes de seguir. Lo aprobado no se vuelve a tocar salvo que Mauro lo pida.

## Fase 0: Base

1. Crear la estructura de `sitio/`: `index.html`, `assets/css/`, `assets/js/`, `assets/js/vendor/`, `assets/fonts/`, `assets/img/`.
2. Convertir a WOFF2 solo los pesos usados de Archivo Expanded e Inter (desde `../branding/Tipografías/`) y cargarlos con `@font-face` y `font-display: swap`.
3. Copiar a `assets/img/` los logos blancos necesarios desde `../branding/Logos/` (isologo y logo completo). Optimizar (WebP o SVG si se puede vectorizar sin perder fidelidad).
4. Variables CSS con la paleta y la tipografía del brief. Reset, estilos base, botones y tarjetas de vidrio.
5. Descargar GSAP y ScrollTrigger a `assets/js/vendor/`.
6. Servidor local para ver `sitio/` (solo esa carpeta) en desktop y en el celu.

**Revisión de Mauro:** se ve el fondo navy, las tipografías correctas y un botón de prueba.

## Fase 1: Estructura y contenido (sin animaciones)

1. HTML semántico de las 5 secciones y las preguntas frecuentes con todos los textos del brief, menú, footer y botón flotante de WhatsApp.
2. Maquetación mobile first de cada sección (390 px), después tablet y desktop, siguiendo las imágenes de `originales/mockups/`.
3. Scroll suave del menú a cada sección.
4. Los títulos h2 se ven como texto normal (las partículas llegan en la Fase 2).

**Revisión de Mauro:** la web completa navegable, estática, en celu y en compu.

## Fase 2: Sistema de partículas (la pieza central)

1. Canvas fijo de pantalla completa y motor de partículas (posición, destino, color, tamaño).
2. Estado galaxia del hero, con movimiento lento.
3. Estado S: forma muestreada del isologo blanco.
4. Estado título: forma muestreada de cada h2, con caracteres 0 y 1.
5. Transición en espiral entre estados, atada al scroll con ScrollTrigger (scrub), que rebobine al subir.
6. Encadenar todo: galaxia > S > DESARROLLO WEB > AUTOMATIZACIONES > SISTEMAS > HABLEMOS.
7. Cruce entre partículas y h2 real (fade).
8. Ajuste de cantidad de partículas para mobile, pausa en pestaña oculta y versión con `prefers-reduced-motion`.
9. Estrellas fugaces y luces al tocar (brief, sección 9).

**Revisión de Mauro:** recorrer toda la web scrolleando para abajo y para arriba, en celu y en compu.

## Fase 3: Animaciones de cada sección

1. Desarrollo web: notebook y celular con las webs de clientes, cambio al tocar cada nombre, tarjeta del puntaje.
2. Automatizaciones: aparición de los nodos, cables, loop de luz (entra > la S late > sale) y versión vertical para mobile.
3. Sistemas: notebook que se abre sola al entrar la sección, dashboard en HTML/CSS y tarjeta "Stock actualizado".
4. Entradas suaves de textos y botones.

**Revisión de Mauro:** cada sección por separado.

## Fase 4: Formulario

1. Formulario por pasos con barra de progreso, Siguiente y Atrás.
2. Paso 1 con selección múltiple y etiqueta de "solución integral".
3. Botones de las secciones que llegan con el servicio ya marcado.
4. Pasos 2 a 5 con las preguntas que defina Mauro (no inventar: si no están definidas, frenar y pedirlas).
5. Validaciones y pantalla de gracias.
6. Envío al webhook de Make y evento Lead del Pixel de Meta.

**Revisión de Mauro:** completar el formulario de punta a punta con cada combinación de servicios y ver que llegue a Airtable.

## Fase 5: SEO, rendimiento y accesibilidad

1. Meta tags, Open Graph, favicon, JSON-LD, robots.txt y sitemap.xml.
2. Pixel de Meta y Analytics con carga diferida.
3. Medir con PageSpeed (mobile y desktop) y corregir hasta 90 o más en todas las categorías.
4. Revisión de accesibilidad (teclado, contraste, foco, alt).
5. Prueba en Chrome, Safari (iPhone) y Firefox.

## Fase 6: Publicación (cierra la v1)

0. Repasar con Mauro `docs/lanzamiento.md` y no publicar hasta que esté completo.
1. Generar `publicar/` con HTML, CSS y JS minificados y sin comentarios.
2. Deploy en Cloudflare Pages y conexión del dominio.
3. Medir el PageSpeed real de la web publicada (objetivo 90+ en todo).
4. Prueba final del formulario en producción.

## Fase 7: v2, páginas por servicio

Arranca cuando Mauro tenga los contenidos de cada servicio (textos, casos reales, preguntas frecuentes).

1. Páginas `/desarrollo-web`, `/automatizaciones` y `/sistemas` reutilizando los componentes de la landing.
2. En cada sección de la landing, dos botones: el principal sigue yendo al formulario y se suma uno secundario "Ver más" a la página del servicio.
3. Menú con links a las páginas, sitemap actualizado y enlaces internos entre páginas.
4. Datos estructurados Service y FAQPage por página.
