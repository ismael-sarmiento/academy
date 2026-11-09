# IsAcademy

> *Website of IsAcademy by Ismael Sarmiento, an online academy for programming, data and AI. Spanish and English.*

> La Inteligencia Artificial (IA) te da respuestas. *Aquí te enseñamos a pensar.*

Web de **IsAcademy by Ismael Sarmiento**, academia online de programación, datos e IA
(Python, POO, SQL, analítica, Big Data/Spark, Data Engineering, IA, TFG/TFM y orientación profesional).
Su objetivo es captar alumnos: todas las secciones llevan al contacto.

- **URL de producción:** https://isuniverse.dev/academy/
- **Repositorio:** `ismael-sarmiento/academy`, copia con historial de `isacademy` (que ahora solo redirige `/isacademy/` aquí; los carteles y QR apuntan allí).
- **Hosting:** GitHub Pages (sitio 100 % estático, sin backend ni build).
- **Idiomas:** español e inglés · **Temas:** claro y oscuro.

## Cómo funciona

1. **Intro (en cada visita):** el "Is" caligráfico se esboza a mano y "Academy" se decodifica como una IA. Botones ES/EN y claro/oscuro, y "Entrar a la academia".
2. **Apertura (cinemática):** manos ilustradas (humana dorada y robótica con LED) pellizcan las palabras y las separan con una estela sutil de tinta y píxeles. También en móvil.
3. **Landing:** barra fija (Quiénes somos, Metodología, Materias, Por qué elegirnos, Opiniones, Recursos, **Reservar clase**; idioma y tema a la derecha), franja de **aulas abiertas gratuitas cada 15 días**, mini-clases animadas en el hero y **consola de Python** (Pyodide) en Recursos con **depurador paso a paso** (línea actual, variables, pila de llamadas, salida, puntos de parada; tope de 1000 pasos). La tarjeta de IsGame sigue el tema claro/oscuro de la página mediante los tokens de superficie y texto; conserva la retícula dorada y no lleva antetítulo. Su retícula solo se desplaza con puntero preciso y sin movimiento reducido.
4. **Asistente "Alan":** avatar ilustrado con chat local (sin servidor) que responde sobre la academia y deriva al formulario.
5. **Reservar clase:** formulario propio que llega por email a través del Worker `isa-forms` (pieza común `/assets/ds/contact.js`).

Los enlaces directos (`/#contacto`, `/#materias`) saltan la intro.

## Estructura

```
index.html              Intro + landing; import map (única versión del sitio), CSP, JSON-LD
css/main.css            Tokens de diseño (colores, tipografía, movimiento) y componentes, por secciones
css/print.css           El folleto en PDF: la propia web en dos páginas A4, en claro u oscuro
js/app.js               Punto de entrada: solo arranca y conecta los módulos
js/core/dom.js          Utilidades comunes ($, $$, esc, sleep, reducedMotion…)
js/core/highlight.js    Coloreado de código Python/SQL (mini-clases y depurador)
js/core/frame-guard.js  Anti-clickjacking
js/i18n.js              Idioma (ES por defecto, ?lang=en), textos y URL canónica
js/theme.js             Modo claro/oscuro
js/config.js            URL del sitio y canales de contacto
js/sections.js          Secciones pintadas desde i18n (materias, opiniones, FAQ, curiosidades…)
js/form.js              Formulario de reserva y email (Worker isa-forms)
js/lessons.js           Mini-clases del hero
js/nav.js               Scroll: aparición, menú activo, progreso, brillo de tarjetas, enlaces de inicio
js/intro.js             Animación del logo
js/opening.js           Cinemática de apertura (manos SVG)
(fx)                    Partículas de la cinemática: /assets/ds/fx.js, compartidas con Inicio y IsProfile
js/console.js           Interfaz de la consola y botón Detener
js/core/python-runtime.js Controlador de sesión, integridad y plazos
js/python-worker.js     Pyodide y trazador en un Web Worker del navegador
js/debugger.js          Representación de la traza paso a paso
js/assistant.js         Asistente "Alan": contenido de la academia sobre el Alan compartido (/assets/ds/)
js/prerender.js         Exporta el texto para tools/prerender.py
js/pdf.js               El enlace «Descargar PDF» de la intro apunta al folleto del idioma y el tema de la página
i18n/es.json, en.json   Todos los textos
assets/brand/           Iconos, og.png y logo · assets/brand/print/ logos y QR para imprimir
tools/                  bump-version.sh, prerender.py, pdf.py (folleto ES/EN × claro/oscuro), brand/ (logos y QR), qa/ (baterías de calidad)
```

## Probar en local

Los módulos JS y los `fetch` de `i18n/` necesitan servirse por HTTP (no abrir el fichero con doble clic):

```bash
python3 -m http.server 8000
```

Abrir http://localhost:8000/

## Consola y recuperación

Python y la generación de la traza se ejecutan en un Web Worker del navegador, sin backend nuevo. «Detener» termina esa sesión y conserva el texto del editor; se pierden variables, imports y archivos virtuales de Python. La siguiente ejecución prepara una sesión nueva.

Límites educativos: 60 s para inicializar o preparar paquetes, 15 s para ejecutar, 50.000 caracteres de código, 64.000 de salida y 1000 pasos de depurador. Al vencer un plazo se termina el Worker, sin reejecutar el programa. Estos controles no constituyen un límite duro de memoria ni un origen de seguridad separado.

El controlador obtiene el bootstrap de Pyodide 0.26.4 con `fetch` y el SHA384 fijado, antes de crear el Worker Blob con esos mismos bytes. La biblioteca no se ejecuta en el hilo principal. Se conserva la CSP existente, sin añadir `unsafe-eval`; SRI cubre el bootstrap, no todas las descargas transitivas.

Pruebas sin red: `node --test tools/qa/python-runtime.test.mjs`. La ejecución real, paquetes, cancelación y depurador también requieren revisión en navegador.

## Versionado (caché)

La versión vive en un único sitio: el *import map* de `index.html` carga cada módulo como `fichero.js?v=<versión>` (los módulos se importan entre sí sin versión) y `i18n.js` la toma de su propia URL para los textos. `tools/bump-version.sh` regenera el import map con todos los módulos de `js/`, actualiza CSS y entrada, y recalcula la huella del import map en la CSP.
**Antes de publicar cambios**, ejecuta:

```bash
tools/bump-version.sh <versión>
python3 -m http.server 8766 &   # la web servida en local
python3 tools/prerender.py      # escribe el texto en español dentro de index.html (SEO)
python3 tools/pdf.py http://127.0.0.1:8777/   # regenera los cuatro folletos isacademy[-en][-dark].pdf
```

`tools/prerender.py` abre la web en Chrome sin ventana y copia el texto ya pintado en `index.html` (entre
`<!--pre-->` y `<!--/pre-->`), para que los buscadores que no ejecutan JavaScript lean toda la página.
La curiosidad exportada es la primera del diccionario, para que dos prerenders produzcan los mismos bytes. En una visita normal la curiosidad sigue siendo aleatoria.

El cambio de idioma confirma el diccionario antes de modificar el idioma visible, la URL o la preferencia. Solo gana la última petición; una descarga fallida se puede reintentar. Durante la carga se bloquean ambos botones de idioma y, si falla, aparece un aviso accesible sin perder la página ni los campos del formulario. `node --test tools/qa/*.test.mjs` incluye cinco regresiones de idioma (37 pruebas en total).

## Despliegue

GitHub Pages publica la rama `main` desde la raíz del repositorio en cada cambio, en
https://isuniverse.dev/academy/. No hay paso de build.

## Contacto (formulario)

El formulario de «Reservar clase» pide una comprobación invisible de Cloudflare Turnstile y envía los datos al Worker
`isa-forms` (código en el repo privado `panel`, `isa-forms.js`), que verifica la comprobación y los entrega
con Resend en **ismaelantonio.professional@gmail.com**, el buzón común de las webs personales. La dirección profesional también es pública en los enlaces de correo y en la información de privacidad; las credenciales del proveedor solo existen como secretos del Worker.
- Si eliges «Aula abierta», el mensaje es opcional.

## Seguridad

Sitio estático sin backend ni secretos. Medidas en el propio código:
- **Content-Security-Policy** (meta en `index.html` y `404.html`): solo scripts propios y de jsDelivr (Pyodide), conexiones solo al Worker `isa-forms`, jsDelivr y la analítica de Cloudflare, Turnstile (script e iframe de challenges.cloudflare.com), sin `object`, `base` ni envíos de formularios nativos.
- **Estilos sin `unsafe-inline`:** los retrasos de aparición se expresan con `data-reveal-delay` y reglas de `css/main.css`. No reintroducir atributos `style` en el HTML de `js/sections.js` ni en el prerender; las propiedades individuales actualizadas por las animaciones JS no requieren relajar la política.
- **Integridad SHA384** del bootstrap `pyodide.js` (`js/core/python-runtime.js` → `PYODIDE_SRI`, fetch con integrity antes de crear el Worker). Si se cambia la versión de Pyodide, recalcula el hash:
  `curl -s <url>/pyodide.js | openssl dgst -sha384 -binary | openssl base64 -A`.
- **Anti-clickjacking**: la web sale de cualquier marco de otro dominio (GitHub Pages no permite `frame-ancestors`).
- Todo el texto dinámico se escapa antes de pintarse; enlaces externos con `rel="noopener noreferrer"`, incluido el enlace de Turnstile que reconstruye el formulario al cambiar el idioma. Las aperturas JS también incluyen ambas opciones.

## Control de calidad (antes de cada publicación)

1. `tools/qa/color-audit.js` en la consola del navegador: por tema debe haber **un dorado de marca** (logo, botones,
   notas manuscritas, números, estrellas, bordes) y **un dorado de texto** (rótulos pequeños), más el dorado claro de
   las superficies siempre oscuras (código, contacto, editor).
2. `tools/qa/flows.js` con la web abierta: cada botón que lleva al formulario, pulsado después de los demás, deja
   «¿Qué te interesa?» como debe (materia, aula abierta o vacío; lo elegido a mano no se pisa).
3. Claro frente a oscuro, sección a sección, en 360, 768 px y escritorio; asistente, depurador y formulario simulado.

Integración real de Python, paquetes, error, depurador, puntos de parada, teclado, cancelación y recuperación (descarga el runtime público fijado; no envía formularios):

```bash
node ../kit/tools/browser_check.mjs http://127.0.0.1:8804/academy/#recursos --flow tools/qa/python.flow.js --widths 375,1280 --block cloudflareinsights.com
```

Los controles del depurador abierto, incluidos los puntos de parada y el slider, tienen al menos 44 px de área efectiva. Revisarlos abiertos: la portada de Recursos no los muestra.

© Ismael Sarmiento. Todos los derechos reservados sobre el contenido y la marca IsAcademy.
