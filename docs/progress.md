# Progress: web Syntropic

Lo mantiene Claude Code. Se actualiza al cerrar cada paso.

## Actual

- **Fase 3, paso 1 (Desarrollo web): hecho, esperando la revisión de Mauro.** No arrancar el paso 2 sin su confirmación. Fases 1 y 2 aprobadas por Mauro el 19/11 (los detalles de la galaxia se pulen más adelante).
- Correcciones de Mauro al paso 1 (19/11), hechas: celular más grande (más que la proporción física, para que la web se lea) superpuesto a la esquina de la notebook; capturas mobile sin franja de la sección siguiente; tarjeta con el PageSpeed real de cada cliente que cambia con la rotación; disposición de tablet hasta 1280 px.
- Preguntas abiertas para Mauro:
  - ATR mobile: su hero es más ancho que una pantalla de celular (escala con el ancho: 390x700), así que abajo asoma su sección blanca siguiente. Llenar la pantalla sin esa franja obliga a recortar los costados (se corta el logo o el botón "Compra online"). Lo mismo pasa con ATR en la notebook. Se dejó la captura como estaba hasta que Mauro decida.
  - Desktop desde 1280 px: en dos columnas, "DESARROLLO" deja la columna de las pantallas en ~400 px, así que el celular queda en ~110 px y la web no se lee. Propuesta: el h2 arriba ocupando todo el ancho y debajo textos a la izquierda y pantallas a la derecha (columna de ~600 px). Es maquetación aprobada: no se toca sin su OK.
- Decisiones tomadas en el paso 1 (revisar): rotación cada 5 segundos; con movimiento reducido no rota (se cambia solo tocando); al rotar en mobile, la fila de nombres se desliza sola para mostrar el activo; las pantallas suben con un fundido al entrar y la tarjeta llega después; en desktop la tarjeta se corre hacia el espacio entre columnas; el número de la tarjeta sube contando la primera vez que aparece y el círculo se llena; después cambia junto con el cliente.
- Decisiones de Mauro para la Fase 3 (19/11):
  - Clientes de Desarrollo web: Novo Hair | Talar Maderas | ATR (cambio en el brief). Capturas sacadas por Claude Code de las webs publicadas, quietas (solo la primera pantalla), desktop 1440x900 y mobile 390x844 (Novo Hair a 390x938 recortada a 844, para que su hero de 90% de pantalla llene todo el celular).
  - Los clientes rotan solos cada unos segundos; la rotación se corta apenas el usuario toca un nombre y se pausa fuera de pantalla.
  - La tarjeta del puntaje muestra el PageSpeed real (computadora) del cliente que se está viendo, con los números del brief, sección Desarrollo web. Talar Maderas sin SEO hasta su dominio real.
  - Check de "Stock actualizado" en #25D366 (excepción a la paleta: el verde de WhatsApp también en ese check).
  - Dashboard de Sistemas con datos demo y productos genéricos de cualquier comercio, nada que remita a un cliente real.
  - La notebook de Sistemas se abre una vez y queda abierta.
  - Los textos de cada sección aparecen solos al entrar en pantalla (no esperan al título de bytes).
  - Las entradas se disparan cuando cada elemento aparece en pantalla (no por posiciones de scroll calculadas), así el pin del hero y el parallax no las corren.
- **Excepción a la paleta aprobada por Mauro:** violeta #B49CF0 (tomado de la referencia `originales/mockups/07-galaxia-referencia.png`), SOLO en algunas estrellas sueltas de la galaxia del hero (alrededor del 3% de las estrellas de campo). En títulos y en el resto de la web, solo la paleta del brief.
- Decisiones de Mauro en la revisión de las Fases 1 y 2:
  - Galaxia del hero con brazos en espiral como la referencia 07, núcleo más denso blanco y celeste claro con brillo azul eléctrico (sin el amarillo de la referencia) y estrellas que llenan toda la sección del hero.
  - Pin del hero durante el 60% del alto de pantalla: las estrellas se enroscan siguiendo los brazos, llegan del centro hacia afuera, la S se arma primero en contorno y después se llena, pulso de brillo al completarse y un instante quieta. Al soltarse el hero, la S se desarma en los bytes que forman "DESARROLLO WEB".
  - Supernova solo sobre la zona densa de la galaxia suelta (núcleo y brazos). Fuera de esa zona, las luces al tocar de siempre; nunca los dos efectos en el mismo lugar.
  - Estrellas fugaces: nunca sobre el hero.
  - Títulos: el nuevo se forma apenas asoma su sección y queda completo con el h2 al 60% de la pantalla en mobile y al 40% en desktop; el anterior, al acercarse al menú, cae en bytes que se pierden.
- Decisiones tomadas en los ajustes de la revisión (revisar):
  - Tablet: el título queda completo con el h2 al 50% de la pantalla (punto medio entre mobile y desktop).
  - En desktop las secciones son más cortas que la pantalla y la siguiente asoma con el título anterior todavía a la vista. En ese caso el título anterior igual cae recién cuando se acerca al menú (con una caída más corta) y el nuevo arranca apenas termina esa caída, un poco después de asomar. Así ningún h2 desaparece mientras se lee su sección. Consecuencia: en desktop cada título se ve completo durante unos 150 a 200 px de scroll.
  - Los bytes del título nuevo arrancan desde donde se perdieron los del anterior (por eso se entiende que vienen de ahí).
  - Mobile y tablet: la S se achica y se centra en el espacio libre entre el menú y la etiqueta del h1, y el parallax de la galaxia y la S pasó a la mitad de la velocidad de la página (antes un quinto). La S formada nunca toca la etiqueta; al soltarse el hero, sus bytes en espiral sí pasan por encima del texto mientras viajan al título.
  - Nebulosa: además de los puntos, un brillo difuso de los brazos (azul eléctrico, celeste y blanco con transparencia) que gira con la galaxia y se apaga cuando se forma la S.
- Fase 2 completa (sistema de partículas, pasos 1 a 9), hecha de corrido junto con el paso 4 de la Fase 1 mientras Mauro no estaba.
- Decisiones tomadas en la Fase 2 (Mauro no estaba disponible, revisar):
  - El título de bytes queda completo un momento (último 20% de cada tramo) y después aparece el h2 real con fade mientras las partículas se apagan, como dice el brief. Los h2 que todavía no se formaron quedan con opacidad 0 (siguen en el HTML y para lectores de pantalla).
  - Los 0 y 1 de los títulos van en celeste, celeste claro y blanco (el azul eléctrico sobre navy no se lee); los puntos de la galaxia y la S usan los cuatro colores. Tipografía de los 0 y 1: Inter SemiBold.
  - Las partículas que sobran en cada título quedan como polvo fino dentro de las letras y como estrellas de fondo fijas (titilan) en toda la web.
  - (Reemplazada en la revisión de las Fases 1 y 2: ahora el título anterior cae en bytes y el nuevo se forma desde ahí.) En secciones largas el título anterior queda muy arriba: los bytes arrancan la espiral desde apenas arriba de la pantalla en vez de desde el título original.
  - (Reemplazada por el pin del hero en la revisión de las Fases 1 y 2.) Galaxia y S con parallax (suben más lento que la página). En mobile y tablet la S se forma con el primer pedacito de scroll para que el texto del hero no la pise.
  - Brillo de la S y de los puntos hecho con transparencia de los colores de la paleta (sin mezclas que generen colores nuevos).
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

- Fase 3, paso 2: Automatizaciones (aparición de los nodos, cables, loop de luz y versión vertical para mobile).
- Fase 3, paso 3: Sistemas (notebook que se abre sola, dashboard en HTML/CSS y tarjeta "Stock actualizado").
- Fase 3, paso 4: entradas suaves de textos y botones.
- Rehacer la captura de Talar Maderas cuando esté en su dominio real.
- Confirmar el permiso de Novo Hair, Talar Maderas y ATR antes de publicar.
- Pendientes de Mauro: ver `docs/brief.md`, sección 11.
- [FALTA] links de TikTok y Facebook de Syntropic (footer): se suman cuando estén creadas las cuentas.

## Hecho

- 19/11: correcciones del paso 1 de la Fase 3: celular más grande, captura mobile de Novo Hair sin franja, tarjeta con el PageSpeed real de cada cliente (Novo Hair 100 y SEO 100, Talar Maderas 99, ATR 100 y SEO 100) que cambia con la rotación y sin `[FALTA]`, disposición de tablet hasta 1280 px. Probado con Chrome en 375x667, 390x844, 768x1024, 1024x768, 1180x820, 1280x800, 1440x900 y con movimiento reducido: sin errores ni scroll horizontal. No probado en un celu real.
- 19/11: Fase 3, paso 1: Desarrollo web. Capturas de Novo Hair, Talar Maderas (link provisorio) y ATR sacadas con Chrome sin ventana y pasadas a WebP (37 a 100 KB). Notebook y celular hechos en CSS, cambio de cliente con fundido, rotación automática que se corta al tocar un nombre y se pausa fuera de pantalla o con la pestaña oculta, carga diferida de las capturas (en mobile no se bajan las de la notebook), indicador circular listo para el puntaje real. Nuevo `secciones.js`. Probado con Chrome en 375x667, 390x844, 768x1024, 1024x768, 1440x900, 1920x1080 y con movimiento reducido: sin errores de consola (solo falta el favicon, que es de la Fase 5) ni scroll horizontal. No probado en un celu real.
- 19/11: ajustes de la revisión de las Fases 1 y 2 (6 puntos): galaxia del hero más real con violetas sueltas, pin del hero con la formación de la S más rica, supernova sobre la galaxia, fugaces fuera del hero, títulos que se forman apenas asoma su sección y caen en bytes al irse, S que no toca la etiqueta en pantallas bajas. Probado con Chrome en 375x667, 390x664, 390x844, 768x1024, 1024x768 y 1440x900: sin errores de consola ni scroll horizontal, links del menú frenando 40 px debajo del menú, movimiento reducido sin pin, mobile a ~60 cuadros por segundo con la CPU frenada 4 veces. No probado en un celu real.
- 18/11: Fase 2 completa. Canvas fijo y motor de partículas (`particulas.js`), galaxia del hero en movimiento lento, S muestreada de una copia del isologo sin "DEV", títulos de 0 y 1 muestreados de cada h2, transición en espiral atada al scroll que rebobina al subir, cadena galaxia > S > DESARROLLO WEB > AUTOMATIZACIONES > SISTEMAS > HABLEMOS, cruce con el h2 real, 900/2500 partículas, pausa con pestaña oculta, versión con movimiento reducido, estrellas fugaces cada 6 a 10 s (nunca durante una espiral) y luces al tocar o hacer clic (no al deslizar, sin bloquear botones). Probado en 375x667, 390x844, 768x1024, 1024x768 y 1440x900 con Chrome sin placa de video: sin errores de consola ni scroll horizontal; mobile a ~60 cuadros por segundo con la CPU frenada 4 veces.
- 18/11: Fase 1, paso 4: h2 con tamaño y estilo finales. Medidos en 320, 360, 390, 768, 1024 y 1440 px: sin desbordes ni scroll horizontal, "DESARROLLO / WEB" en dos líneas en todos los anchos.
- 18/11: Fase 1, paso 3: cada link (menú, menú hamburguesa, logo, Scrolleá, botones de sección, footer) baja con scroll suave y el título frena 40 px debajo del menú fijo, en las dos alturas del menú. Con movimiento reducido salta directo. Galaxia mobile al 35% y menú desktop a 72 px. Probado en 390x844, 390x664, 375x667, 768 y 1440 px.
- 18/11: ajustes del paso 2: LinkedIn fuera del footer, link real de Instagram, TikTok y Facebook como `[FALTA]`; Slack fuera y Make, Airtable y Excel adentro de "Y también conectamos"; menú fijo con vidrio esmerilado (56 px en mobile). Brief sección 3 y `componentes.md` actualizados. Probado en 390, 768 y 1440 px.
- 18/11: Fase 1, paso 2: maquetación de toda la landing a 390, 768 y 1440 px siguiendo los mockups 01 a 06. Nuevos `componentes.css`, `secciones.css`, `interfaz.js` (menú hamburguesa a pantalla completa, elección de cliente, WhatsApp que se esconde con el formulario en mobile) e `iconos.svg`. Sin scroll horizontal en ningún ancho, orden de teclado verificado.
- 18/11: brief, roadmap y reglas del proyecto escritos con Mauro en Claude.ai.
- 18/11: Fase 0 aprobada por Mauro.
- 18/11: Fase 1, paso 1: HTML semántico de toda la landing (menú, hero, 3 secciones, preguntas frecuentes, formulario paso 1, footer, WhatsApp) con los textos del brief y marcadores `[FALTA]`. Un h1, un h2 por sección, anclas del menú verificadas. Sin estilos de sección todavía.
- 18/11: Fase 0 completa. Estructura de `sitio/`, fuentes WOFF2 (Archivo Expanded Black y Bold, Inter Regular, Medium y SemiBold), logos blancos en WebP (más el isologo en PNG para las partículas), `base.css` con paleta, reset, botón y tarjeta de vidrio, GSAP y ScrollTrigger 3.15.1 locales, servidor local con Python. Probado a 390 px y 1440 px.
