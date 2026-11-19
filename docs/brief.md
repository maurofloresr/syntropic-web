# Brief: web Syntropic

Escrito con Mauro en Claude.ai el 18/11/2026. Es la guía de qué se construye y cómo se ve.

## 1. Concepto

**Sintropía es lo contrario de entropía: el orden que nace del caos.** Es lo que hace Syntropic: toma el desorden de un negocio (mensajes sueltos, planillas, tareas repetidas) y lo convierte en algo que funciona solo.

Toda la web cuenta esa historia con una sola animación que la recorre de punta a punta:
galaxia de puntos (caos) > se ordena y forma la S > la S se desarma en 0 y 1 > los bytes viajan en espiral > forman el título de la siguiente sección > ese título se desarma y viaja al siguiente, y así hasta el final.

**Versiones:**
- **v1 (ahora, para la pauta):** una sola página (landing). El menú y los botones llevan a cada sección con scroll suave.
- **v2 (después):** se suma una página por servicio (`/desarrollo-web`, `/automatizaciones`, `/sistemas`) con contenido propio, casos y preguntas frecuentes de ese servicio. Es la base del SEO: cada servicio es una búsqueda distinta y necesita su propia página. La v1 se construye pensando en esto (componentes reutilizables, menú preparado para links a páginas).

## 2. Marca

**Paleta (oficial, del brandbook):**

| Nombre | HEX | Uso |
| --- | --- | --- |
| Navy | #0B1524 | Fondo de toda la web |
| Azul eléctrico | #0040FF | Botones, acentos fuertes, glows |
| Celeste | #47ADFF | Bordes, íconos, cables, partículas |
| Celeste claro | #A0D3FD | Textos secundarios, partículas |
| Blanco | #FFFFFF | Títulos, textos principales, partículas brillantes |
| Verde WhatsApp | #25D366 | Solo el botón flotante de WhatsApp |

**Tipografías:**
- Títulos: Archivo Expanded (Black y Bold), en mayúsculas. Formato de dos líneas del brandbook: primera línea Black, segunda más liviana (ejemplo "5 SEMANAS / UNA WEB NUEVA").
- Textos: Inter (Regular, Medium, SemiBold).
- Archivos en `../branding/Tipografías/`. Convertir a WOFF2 y cargar solo los pesos que se usen.

**Logos:** `../branding/Logos/` (usar las versiones blancas sobre el fondo navy). El isologo blanco es la forma exacta de la S de la galaxia.

**Estilo:** minimalista, premium, tecnológico, mucho espacio negativo oscuro. Botones: fondo #0040FF, texto blanco Inter SemiBold, bordes redondeados. Tarjetas: "vidrio oscuro" (navy apenas más claro, borde fino #47ADFF con baja opacidad).

## 3. Elementos fijos (en toda la web)

- **Menú superior:** fijo arriba y siempre visible, sin fondo sólido. Efecto vidrio esmerilado: desenfoca y oscurece apenas lo que pasa por debajo (backdrop-filter con un tinte navy muy transparente), igual en el hero y en el resto de la página. En mobile es bajo (56 px de alto). Izquierda: logo blanco. Derecha: Desarrollo web, Automatizaciones, Sistemas, Contacto. Cada link baja a su sección. En mobile, menú hamburguesa.
- **Botón flotante de WhatsApp:** abajo a la derecha, siempre visible, círculo #25D366 con ícono blanco. Abre WhatsApp con un mensaje ya escrito. Número: [FALTA: número de WhatsApp de Syntropic]. Mensaje: "Hola Syntropic, vengo de la web y quiero hacer una consulta."
- **Canvas de partículas:** un solo canvas fijo detrás del contenido para la galaxia y los bytes (ver sección 9).

## 4. Sección 1: Hero

Referencia: `originales/mockups/01-hero.jpg`

- **Izquierda (texto):**
  - Etiqueta chica arriba del h1 (Inter, #A0D3FD, mayúsculas, espaciado): "Desarrollo web, automatizaciones y sistemas a medida · Argentina". Es lo que le dice a Google y a las IAs qué hacemos, porque el h1 es una frase de marca sin palabras de búsqueda.
  - h1 en dos líneas: "CREANDO SOLUCIONES" (blanco, Archivo Expanded Black) / "QUE TRABAJAN POR VOS" (#47ADFF, peso más liviano).
  - Bajada (#A0D3FD, Inter): "Webs, automatizaciones y sistemas para que tu negocio funcione mientras hacés lo importante."
  - Botón: "Hablemos" (lleva al formulario).
- **Derecha (visual):** la galaxia de puntos con los colores de la marca, moviéndose despacio y sin orden.
- **Abajo al centro:** "Scrolleá" con una flecha fina hacia abajo.

**Animación (atada al scroll, ver sección 9):**
1. Al cargar: galaxia en movimiento lento, desordenada.
2. Al empezar a scrollear: los puntos se ordenan y forman la S del isologo, con un glow suave.
3. Al seguir bajando: la S se desarma en 0 y 1 que viajan en espiral y forman el título "DESARROLLO WEB".
4. Si el usuario vuelve a subir, todo se rebobina (la animación sigue al scroll en las dos direcciones).
5. La S NO sigue el mouse.

## 5. Sección 2: Desarrollo web

Referencia: `originales/mockups/02-desarrollo-web.jpg`

- **Izquierda:**
  - h2 "DESARROLLO WEB" formado por bytes (0 y 1 en #47ADFF y blanco).
  - Frase (blanco, Inter Medium): "Tu web, lista para que te encuentren."
  - Bajada (#A0D3FD): "Diseño a medida, rápida en el celular y preparada para Google y para las inteligencias artificiales."
  - Seis etiquetas tipo píldora (borde #47ADFF, ícono de línea):
    - SEO · Aparecé en Google
    - GEO · Recomendado por las IAs
    - Mobile first
    - Carga ultra rápida
    - Meta Pixel y Analytics
    - Diseño a medida
  - Botón: "Quiero mi web" (lleva al formulario con "Desarrollo web" ya marcado).
- **Derecha:**
  - Notebook y celular mostrando una web de cliente, con glow #0040FF detrás.
  - Tarjeta flotante con un indicador circular y el número del puntaje de rendimiento de Google (PageSpeed) de ESTA web, con el texto "Velocidad en Google". El número tiene que ser el real, medido después del deploy. Mientras tanto: [FALTA: puntaje real].
  - Debajo: "YA CONFIARON EN NOSOTROS" (#A0D3FD, mayúsculas, espaciado) y los nombres de los clientes: Novo Hair | Talar Maderas | ATR. Al tocar un nombre, las pantallas muestran la web de ese cliente (capturas en `sitio/assets/img/clientes/`). [FALTA: capturas desktop y mobile de cada web, y confirmación de Mauro de que cada cliente acepta aparecer].

## 6. Sección 3: Automatizaciones

Referencia: `originales/mockups/03-automatizaciones.jpg`

- **Arriba al centro:**
  - h2 "AUTOMATIZACIONES" formado por bytes.
  - Frase (blanco): "Lo que hoy hacés a mano, mañana se hace solo."
  - Bajada (#A0D3FD): "Conectamos tus herramientas para que las tareas repetitivas se hagan solas, sin errores y las 24 horas."
  - Botón: "Automatizar mi negocio" (lleva al formulario con "Automatizaciones" ya marcado).
- **Fondo de la sección:** grilla de puntos sutil (#47ADFF al 10%), como el lienzo de n8n o Make.
- **Lienzo de nodos (de izquierda a derecha):**
  - Izquierda, 3 nodos disparadores (lo que pasa en el negocio):
    1. WhatsApp · Un cliente escribe
    2. Formulario web · Llega una consulta
    3. Tienda online · Entra una venta
  - Centro: nodo circular grande #0040FF con la S blanca de Syntropic. Debajo: "IA que entiende y decide".
  - Derecha, 5 nodos de acción (lo que se hace solo):
    1. Responde al instante · WhatsApp
    2. Agenda el turno · Google Calendar
    3. Envía el presupuesto · Gmail
    4. Carga la venta · Google Sheets
    5. Avisa a tu equipo · Notificación
  - Cables curvos (bezier) #47ADFF de cada nodo izquierdo a la S y de la S a cada nodo derecho.
- **Animación del lienzo (loop constante mientras la sección está en pantalla):**
  1. Puntos de luz (blanco con glow #47ADFF) viajan por los cables de los nodos izquierdos HACIA la S.
  2. La S late (pulso de glow) al recibir la luz.
  3. Salen puntos de luz de la S HACIA los nodos derechos, y cada nodo se ilumina un instante al recibirlo.
  4. Ciclo continuo y escalonado (no todos los cables a la vez), para que se lea "entra un mensaje, Syntropic lo procesa, se resuelve solo".
  5. Los nodos aparecen en orden al entrar la sección.
- **Mobile:** el lienzo pasa a flujo vertical: disparadores arriba, la S al medio, acciones abajo, cables verticales.
- **Abajo:** "Y TAMBIÉN CONECTAMOS" y una fila de logos monocromos blancos al 70%: Mercado Pago, Instagram, Facebook, Notion, Google Drive, Excel, Make, Airtable, Calendly, Trello, Zoom. Excel va con el ícono de planilla de Lucide y la palabra "Excel" al lado (Microsoft no publica una versión monocroma). Regla: ninguna herramienta que ya esté en los nodos se repite acá. Logos en SVG oficiales (Simple Icons u oficiales de cada marca).

## 7. Sección 4: Sistemas

Referencia: `originales/mockups/04-sistemas.jpg`

- **Izquierda:**
  - h2 "SISTEMAS" formado por bytes.
  - Frase (blanco): "Un sistema que se adapta a tu negocio, no al revés."
  - Bajada (#A0D3FD): "Dejá las planillas sueltas y los cuadernos. Todo tu negocio en un solo lugar, ordenado y bajo control."
  - Tres bloques con ícono #47ADFF, título Archivo Expanded y una línea Inter:
    1. Escudo · SEGURO · "Tus datos protegidos, accesos por usuario y copias automáticas."
    2. Click · SENCILLO · "Tu equipo lo aprende en minutos, sin manuales."
    3. Pieza de rompecabezas · PERSONALIZADO · "Hecho a la medida de cómo trabajás vos."
  - Botón: "Quiero mi sistema" (lleva al formulario con "Sistemas" ya marcado).
- **Derecha:**
  - Notebook con glow #0040FF detrás.
  - **Animación: al entrar la sección, la tapa de la notebook se abre sola** (rotación 3D con CSS/GSAP) y la pantalla se prende mostrando el sistema.
  - Pantalla: dashboard de gestión en modo oscuro con los colores de la marca. Menú lateral: Ventas, Stock, Compras, Caja, Clientes. Tres tarjetas: "Ventas del día $ 485.300", "Productos en stock 1.248", "Caja $ 312.900". Gráfico de ventas semanal en #47ADFF y una tabla corta de ventas recientes. Datos inventados, nunca datos reales de clientes. Hecho en HTML/CSS (no imagen) para que se vea nítido.
  - Tarjeta flotante que aparece después de abrir: check verde + "Stock actualizado automáticamente".

## 7b. Preguntas frecuentes (antes del formulario)

- h2 normal (no forma parte de la cadena de bytes): "PREGUNTAS FRECUENTES".
- Acordeón de 4 o 5 preguntas generales, las que filtran clientes. Propuestas: ¿Cuánto cuesta? ¿Cuánto tarda? ¿Qué necesito para empezar? ¿Trabajan con Tiendanube? ¿Qué pasa después de la entrega?
- Respuestas: [FALTA: respuestas reales de Mauro]. No inventar.
- Datos estructurados FAQPage con las mismas preguntas y respuestas.
- En la v2, cada página de servicio tiene sus propias preguntas frecuentes.

## 8. Sección 5: Formulario y footer

Referencia: `originales/mockups/05-formulario.jpg`

- h2 "HABLEMOS" formado por bytes.
- Frase (blanco): "Contanos qué necesitás y te respondemos en menos de 24 horas."
- **Formulario por pasos** dentro de una tarjeta de vidrio oscuro: una pregunta por pantalla, barra de progreso #0040FF y "Paso X de N". Botones "Siguiente" y "Atrás".
- **Paso 1: "¿Qué estás buscando?"** con la aclaración "Podés elegir más de uno." Tres tarjetas grandes seleccionables (se marcan y desmarcan):
  1. Desarrollo web · "Una web profesional que te haga encontrar y vender." Ícono de línea: una notebook con un celular al lado (como la imagen de la sección Desarrollo web, pero en ícono simple). No usar ícono de archivo ni de ventana.
  2. Automatizaciones · "Que las tareas repetitivas se hagan solas." Ícono de nodos conectados.
  3. Sistemas · "Un sistema a medida para ordenar tu negocio." Ícono de dashboard.
  - Tarjeta marcada: borde #0040FF de 2 px, glow y check en la esquina.
  - Si se marcan 2 o más, aparece la etiqueta "[combinación]: solución integral" (ejemplo "Web + Automatización: solución integral").
  - Hay que elegir al menos una para avanzar.
- **Pasos siguientes:** cambian según lo elegido en el paso 1 (solo aparecen las preguntas de los servicios marcados). Estructura base, el contenido se define con Mauro:
  - Paso 2: el negocio (nombre, rubro).
  - Paso 3: preguntas específicas de cada servicio elegido. [FALTA: preguntas, se definen con Mauro]
  - Paso 4: presupuesto aproximado y plazo (es la pregunta que más filtra). [FALTA: rangos de presupuesto]
  - Paso 5: contacto (nombre, WhatsApp, mail).
  - Pantalla final de gracias.
- **Botones de las secciones:** "Quiero mi web", "Automatizar mi negocio" y "Quiero mi sistema" bajan al formulario con ese servicio ya marcado en el paso 1 (por ejemplo con `#contacto?servicio=web`).
- **Envío:** según el CHECKLIST: formulario > webhook de Make > Airtable, con evento Lead del Pixel de Meta al enviar. [FALTA: URL del webhook y ID del Pixel]
- **Footer** (separado por una línea fina): logo blanco a la izquierda; links Desarrollo web, Automatizaciones, Sistemas al centro; íconos de Instagram, TikTok, Facebook y WhatsApp y el mail a la derecha (LinkedIn no va por ahora); abajo "© 2026 Syntropic. Todos los derechos reservados." [FALTA: dominio, mail y links de redes]

## 9. La animación de bytes (la pieza central)

Es lo que hace única a la web. Especificación:

- **Un solo sistema de partículas** en un canvas fijo de pantalla completa, detrás del contenido. Las mismas partículas recorren toda la web: no se crean partículas nuevas por sección.
- **Estados (uno por sección):**
  1. Galaxia: puntos desordenados con movimiento lento (hero, al cargar).
  2. S: puntos ordenados con la forma del isologo (tomar la forma muestreando los píxeles del PNG del isologo blanco en un canvas oculto).
  3. Título de cada sección: las partículas se convierten en caracteres "0" y "1" y toman la forma del h2 (muestreando el texto renderizado en Archivo Expanded en un canvas oculto, a la misma posición y tamaño que el h2 real).
- **Transición entre estados: en espiral.** Al pasar de una sección a la siguiente, cada partícula sale de su posición, gira en espiral (coordenadas polares: el ángulo aumenta mientras el radio primero se abre y después se cierra hacia el destino) y llega a su lugar en el título nuevo. Cada partícula con un pequeño desfase para que no se muevan todas juntas.
- **Atada al scroll:** el avance de la espiral depende de cuánto scrolleó el usuario (GSAP ScrollTrigger con scrub), no de un tiempo fijo. Si para de scrollear, la animación se queda quieta; si sube, se rebobina.
- **Texto real:** cada h2 existe en el HTML. Cuando las partículas terminan de formar el título, el h2 real aparece encima (fade) y las partículas se desvanecen; al empezar la siguiente transición, el h2 se apaga y las partículas toman el control. Nunca texto oculto para Google.
- **Colores de las partículas:** #0040FF, #47ADFF, #A0D3FD y algunos #FFFFFF más brillantes. Nada más.
- **Rendimiento:**
  - Cantidad de partículas según el dispositivo: aproximadamente 2500 en desktop y 900 en mobile (ajustar midiendo).
  - Pausar el canvas cuando la pestaña no está visible.
  - Iniciar después de que cargue el contenido principal, sin bloquear la carga.
  - Objetivo: 90 o más en todas las categorías de PageSpeed (mobile y desktop).
- **prefers-reduced-motion:** sin canvas animado; S y títulos estáticos.

### Estrellas fugaces y luces al tocar (toda la web, mobile y desktop)

Mantienen viva la idea de galaxia en toda la página. Se dibujan en el mismo canvas de las partículas.
- **Estrellas fugaces:** chicas, finas y rápidas, con los colores de la marca. Una cada 6 a 10 segundos como máximo (intervalo al azar), nunca dos al mismo tiempo. Se pausan mientras los bytes están en una transición en espiral, para no distraer.
- **Luces al tocar:** en mobile, al tocar la pantalla salen unos pocos puntos de luz (6 a 10) desde el punto tocado y se apagan en menos de un segundo. En desktop, lo mismo con el clic. Solo con un toque o clic, NUNCA al deslizar o scrollear. No deben bloquear el toque en botones, links ni el formulario.
- Con `prefers-reduced-motion` no aparecen.

## 9b. Mobile

Referencia: `originales/mockups/06-mobile.jpg`. Todo pasa a una sola columna. Se construye primero a 390 px.

- **Menú:** "Syntropic" (Tipo_Blanco) a la izquierda y menú hamburguesa a la derecha. Al abrirlo, pantalla completa navy con los links grandes.
- **Hero:** la galaxia y la S ocupan la parte de arriba de la pantalla (mínimo 35% del alto); abajo, la etiqueta, el h1, la bajada y el botón "Hablemos" a todo el ancho. El botón "Hablemos" tiene que verse sin scrollear incluso en pantallas bajas (iPhone SE, Safari con barras).
- **Desarrollo web:** título, textos y las 6 etiquetas en 2 columnas. Abajo, SOLO el celular (sin notebook) con la tarjeta de puntaje encima. Los nombres de clientes en una fila que se desliza con el dedo. Botón a todo el ancho.
- **Automatizaciones:** título, textos y botón a todo el ancho. Después, el lienzo en vertical: los 3 disparadores arriba, la S al medio y las 5 acciones abajo, con cables verticales y la luz bajando. Los logos de "Y también conectamos" pasan solos en una fila en movimiento continuo.
- **Sistemas:** título y frase, enseguida la notebook (más chica) abriéndose, después los 3 bloques y el botón a todo el ancho.
- **Preguntas frecuentes:** acordeón a todo el ancho.
- **Formulario:** las tarjetas del paso 1 una debajo de la otra; el botón "Siguiente" fijo abajo de la pantalla. Mientras el formulario está en pantalla, el botón flotante de WhatsApp se esconde para no tapar "Siguiente".
- **Footer:** todo apilado y centrado.
- Botones y zonas táctiles de al menos 44 px de alto.

## 10. SEO, GEO y medición

Base: la guía oficial de Google de mayo 2026 dice que GEO es SEO bien hecho. No se usan llms.txt, contenido "en bloques para IA" ni schemas especiales. Lo que pesa: rastreo, estructura, mobile, velocidad, enlaces internos y contenido propio que no sea genérico.

- Title: "Syntropic | Desarrollo web, automatizaciones y sistemas a medida en Argentina". Meta description con los tres servicios y la zona.
- Zona de servicio: Argentina (`areaServed`). Textos de vos. Las versiones para otros países (Chile, Uruguay, Brasil) se harán más adelante como versiones aparte.
- Casos y datos: SOLO reales y verificables (puntajes de PageSpeed medidos, URLs conservadas en Talar Maderas, testimonios de clientes con permiso). Nunca inventados.
- `robots.txt` que permita los bots de IA (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended) además de los buscadores.
- Pendientes del lanzamiento (Cloudflare, Search Console, Bing, Google Business): ver `docs/lanzamiento.md`.
- Title, meta description, Open Graph (imagen con el logo sobre el fondo de la marca), favicon con la S.
- Un solo h1 (hero), un h2 por sección.
- Datos estructurados JSON-LD de tipo Organization y ProfessionalService (servicios, área: Argentina). [FALTA: dominio y datos de contacto]
- Textos claros que respondan qué hace Syntropic, para quién y dónde (sirve para Google y para que las IAs nos recomienden).
- `robots.txt` y `sitemap.xml`.
- Pixel de Meta y Google Analytics con carga diferida. [FALTA: IDs]
- Accesibilidad: contraste, foco visible, navegable con teclado, textos alternativos.

## 11. Pendientes de Mauro

- [x] Guardar las 5 imágenes de Gemini en `originales/mockups/` (18/11).
- [ ] Dominio (define mail, links y datos estructurados).
- [ ] Número de WhatsApp de Syntropic.
- [x] Instagram: https://www.instagram.com/syntropic__/ (el teléfono que figura en ese perfil NO es el de la web).
- [ ] TikTok y Facebook: se suman cuando estén creados. LinkedIn no va por ahora (ver `docs/a-futuro.md`).
- [ ] Capturas de las webs de clientes y su permiso para aparecer.
- [ ] Preguntas del formulario (pasos 2 a 4) y rangos de presupuesto.
- [ ] URL del webhook de Make, base de Airtable e ID del Pixel de Meta.
- [ ] Respuestas de las preguntas frecuentes.
- [ ] Datos reales para casos: PageSpeed de las webs publicadas, URLs conservadas en Talar Maderas, testimonios de clientes.
