# Checklist de lanzamiento: web Syntropic

Se repasa con Mauro en la Fase 6, antes de publicar. Claude Code tiene que recordarlo.

## Antes de publicar

- [ ] Dominio comprado y conectado a Cloudflare Pages.
- [ ] Cloudflare: HABILITAR los bots de IA. Desde 2025 Cloudflare los bloquea por defecto en dominios nuevos; sin esto, ChatGPT, Claude y Perplexity no pueden leer la web. Revisar la configuración de bots / AI Crawl Control del dominio.
- [ ] `robots.txt` publicado y permitiendo buscadores y bots de IA.
- [ ] `sitemap.xml` publicado.

## Apenas se publica

- [ ] Google Search Console: verificar el dominio y enviar el sitemap.
- [ ] Bing Webmaster Tools: verificar y enviar el sitemap (ChatGPT usa el índice de Bing). Se puede importar desde Search Console.
- [ ] Medir PageSpeed de la web de Syntropic (objetivo 90+ en todo).
- [ ] Cuando Talar Maderas esté en su dominio real: rehacer su captura, volver a medir PageSpeed y sumar su SEO a la tarjeta.
- [ ] Probar el formulario en producción (llega a Airtable y dispara el evento del Pixel).

## Fuera de la web (cuando se pueda)

- [ ] Perfil de Google Business como empresa de área de servicio (sin mostrar dirección), zona Argentina.
- [ ] Pedir reseñas en Google a los clientes.
- [ ] Mismos datos en todos lados: nombre, descripción, servicios, WhatsApp y mail iguales en la web, Google Business, Instagram y LinkedIn.
- [ ] Links de Instagram y LinkedIn en el footer y en los datos estructurados (`sameAs`).
