# Starbucks Coffee · Tu turno

Videojuego web en pixel art, hecho con React y Vite, pensado como **activación digital para Starbucks**. La persona es la barista de una cafetería: lee los pedidos de los clientes, arma cada bebida con los frascos de ingredientes y la entrega antes de que se termine el turno.

Todo ocurre dentro de un único universo inmersivo (la cafetería), a pantalla completa, sin ventanas ni marcos alrededor.

> Proyecto desarrollado con asistencia de IA (Claude Code). El proceso está documentado más abajo, en [Proceso de desarrollo asistido por IA](#proceso-de-desarrollo-asistido-por-ia).

## Qué es

- **Historia:** un gerente te recibe en la puerta, te cuenta qué hay que hacer y te deja entrar al café.
- **Un mundo para recorrer:** la pizarra del menú explica cómo jugar, el muro de la fama muestra el ranking, el casillero guarda tu perfil y tus cards, la radio maneja el sonido y la campanita empieza el turno.
- **Tres turnos de servicio:** cinco clientes por turno, con pedidos express, Hora feliz y Hora pico.
- **Sin servidor:** todo funciona en el navegador (cuenta, progreso y ranking son locales).

## Probarlo

Requiere Node.js 20 o superior.

```sh
npm install
npm run dev
```

Abrí la dirección local que aparece (normalmente http://localhost:5173).

```sh
npm test        # pruebas del motor de juego y del ranking
npm run lint    # revisión de código
npm run build   # versión lista para publicar, en dist/
```

### Publicar en Vercel

El proyecto es un Vite estándar: al importar el repositorio en Vercel se detecta solo el preset **Vite** (comando `npm run build`, salida `dist`). No necesita variables de entorno.

## El universo

La experiencia es un mundo de pantalla completa: una escena de 960×540 que se escala para llenar la ventana, con un fondo que continúa más allá de sus bordes. En celular hay que girar el teléfono a horizontal.

| Lugar | Qué es |
| --- | --- |
| **La puerta** (inicio) | Fachada de Starbucks Coffee. El gerente cuenta la historia del juego; al "entrar" se inicia sesión o se crea la cuenta. El juego siempre arranca acá, sin sesión. |
| **Vestuario** | Primera vez: se elige nombre y look de la barista. |
| **El café** (hub) | Tu avatar detrás de la barra y un salón con mesitas. Cada objeto lleva a un lugar: la **pizarra del menú** (Cómo jugar), el **muro de la fama** (ranking Top 10), el **casillero** (perfil, estadísticas, cards y editar avatar), la **radio** (sonido) y la **campanita** (empezar el turno). |
| **El turno** | La misma cafetería en pleno servicio, con los frascos sobre la barra. El puntaje y el reloj están en un tablero de la pared; las indicaciones, la cuenta regresiva, el fin de turno y los resultados aparecen dentro del local. |

## Flujo y reglas

Puerta → Inicio de sesión → Vestuario (solo la primera vez) → El café → Turno 1 → Turno 2 → Turno 3 → Resultado → El café.

| Turno | Tiempo | Clientes | Bebidas por pedido |
| --- | --- | --- | --- |
| 1 | 2 minutos | 5 | 1–2, al azar |
| 2 | 1 minuto y 30 segundos | 5 | 1–3, al azar |
| 3 | 1 minuto | 5 | 1–3, al azar |

Los clientes llegan de a uno y muestran su pedido en un globo. Cada toque en un frasco agrega una dosis y el vaso se llena por capas; con la receta completa se entrega con la campanita. Para superar cada turno hay que completar cinco pedidos correctos antes de que termine el tiempo. En pedidos de varias bebidas se prepara una a la vez.

- **Express:** puntos dobles y cinco segundos por bebida. Si se vence, el pedido se cancela (−100 puntos, −10 segundos y se corta la racha) y llega uno de reemplazo: igual hay que completar cinco.
- **Error:** una dosis incorrecta o de más se rechaza, resta diez segundos y corta la racha.
- **Hora feliz:** duplica los puntos durante veinte segundos.
- **Hora pico:** trae dos express seguidos.
- **Racha:** el multiplicador sube hasta ×5 y continúa entre turnos.
- **Reintento:** al perder se puede reintentar el turno con la misma secuencia.

Teclas: `1`–`6` ingredientes, `Enter` entregar, `Esc` pausa. También funciona con el mouse y táctil. Al cambiar de pestaña el juego se pausa solo.

### Ranking (Muro de la fama)

Guarda el **mejor puntaje de cada persona** (identificada por mail) y muestra el Top 10. Es **local**: vive en el navegador de cada dispositivo (`localStorage`), así que no se comparte entre personas ni dispositivos. Para un ranking compartido haría falta un backend. Las reglas están en `src/game/ranking.js` y tienen pruebas.

## Organización del código

```
src/
  game/        reglas y datos (sin React): data.js, engine.js, ranking.js, scene.js, storage.js, achievements.js
  world/       el universo: World, Cafe (dibujo), Exterior, Hub, Play, Panels, UI
  components/  formulario de perfil, inicio de sesión, avatar, avisos de puntos
  world.css    todo el estilo (paleta Starbucks)
  App.jsx      conecta pantallas, teclado, reloj, sonido y guardado
public/assets/ ilustraciones SVG de ingredientes, bebidas y cards, y la fuente local
tests/         pruebas del motor y del ranking
```

- `src/game/data.js`: recetas, ingredientes, tiempos y niveles. Acá se ajusta el balance.
- `src/game/engine.js`: máquina de estados del juego. Un único estado evita entregas duplicadas y cuenta el tiempo real transcurrido.
- `src/world/Cafe.jsx`: dibujo de la cafetería en SVG (pared, mostrador, mesitas, vaso, clientes, zonas clicables).
- Paleta: verde `#00704A`, verde oscuro `#1E3932`, crema `#F2F0EB`, dorado `#CBA258`.

## Cómo podría romperse y qué protección tiene

- Clics repetidos: los controles se bloquean mientras cae un ingrediente o se entrega un vaso.
- Reloj en cero: se verifica el tiempo antes de aceptar cada acción.
- Pausa durante una animación: se congelan reloj y plazo de animación.
- Reintentos: el puntaje vuelve al comienzo del turno para no acumular puntos duplicados.
- Mail, contraseña o nombre inválidos: se validan antes de iniciar; React muestra el nombre como texto.
- Recarga: la partida vuelve al inicio con un aviso. El récord se conserva si el navegador permite almacenamiento.
- Almacenamiento bloqueado o corrupto: se usan valores por defecto.
- Pantallas pequeñas: la escena se escala completa; en celular vertical se pide girar el teléfono.

## Alcance y límites actuales

- Versión local sin servidor. La cuenta, el progreso y el ranking viven en el navegador.
- El mail se guarda en el navegador solo para reconocer la cuenta; no se envía. La contraseña se valida pero nunca se guarda.
- El progreso de cards es uno por navegador (no uno por cuenta).
- No hay recuperación de una partida interrumpida.
- Las cards de logros usan ilustraciones SVG del diseño original, que todavía dicen "HABBO COFFEE" y tienen una paleta azul: faltan regenerarlas con la identidad Starbucks.
- Al iniciar, un borrado único limpia los datos guardados anteriormente (ver `resetSavedDataOnce` en `src/game/storage.js`); subir `RESET_VERSION` repite el borrado.
- El sello del cartel es una estrella dentro de un círculo verde, un dibujo propio y genérico; no reproduce el logo oficial de la marca.

## Proceso de desarrollo asistido por IA

Este proyecto se construyó conversando con **Claude Code** (extensión de VS Code, modelo Claude Sonnet 5.5). La persona a cargo del proyecto dirigió el producto, la estética y los textos; la IA leyó el código, propuso la arquitectura, escribió e hizo pruebas de los cambios. Sirve como registro de cómo se trabajó y qué se decidió en cada paso.

### Cómo se trabajó

1. **Pedido en lenguaje natural, en español rioplatense**, con referencias visuales (capturas, el video de inicio, wireframes de Figma).
2. **La IA primero lee el proyecto** (motor de reglas, pantallas, estilos) antes de tocar nada, y hace preguntas cuando una decisión es de producto.
3. **Preguntas puntuales de diseño** antes de los cambios grandes (por ejemplo: vista 2D o isométrica, ranking local u online, marca, qué lugares incluir).
4. **Implementación incremental**, conservando el motor de reglas (`engine.js`) y cambiando solo la capa visual y lo estrictamente necesario.
5. **Verificación en cada paso**, no solo "compila":
   - `npm run lint`, `npm test` y `npm run build` tras cada cambio.
   - Un navegador Chrome controlado por script (Playwright) para recorrer el juego real y sacar capturas: inicio, registro, vestuario, el café, cada panel, un turno completo, cuenta regresiva, fin de turno y resultados. Esas capturas se revisaron a ojo y fueron la fuente de varios ajustes de maquetación.
   - Pruebas con reloj adelantado para jugar turnos completos sin esperar y comprobar que el ranking se guarda y se ordena.
   - Revisión en distintos tamaños de pantalla (escritorio, panorámica, celular horizontal y vertical).
6. **Correcciones guiadas por la persona** tras ver el resultado, hasta quedar conforme.

Los scripts de prueba visual fueron herramientas de trabajo y no forman parte del repositorio.

### Cronología de decisiones

| Etapa | Pedido | Resultado |
| --- | --- | --- |
| 0. Punto de partida | Juego arcade en React a partir de wireframes de Figma, con motor de reglas y pruebas | Base de reglas, niveles, logros, perfil y audio |
| 1. Rediseño del turno | Escena inmersiva de cafetería, con el avatar en la barra, clientes que llegan y frascos de ingredientes | Cafetería en pixel art con clientes, pedido en globo, vaso por capas y entrega animada |
| 2. Un solo universo | Llevar ese criterio a todo: inicio, login, perfil, ranking, cómo jugar y el juego a pantalla completa | Mundo de pantalla completa con fachada, café recorrible, paneles en pizarra/papel y ranking local |
| 3. Datos y sonido | Arrancar de cero y siempre sin sesión; subir el volumen | Borrado único de datos, inicio siempre desde la puerta, volumen general más alto |
| 4. Storytelling | Textos del gerente en español argentino | Voseo en toda la narración |
| 5. Coherencia del café | Los frascos solo deben aparecer durante el turno | Salón con mesitas en el café; frascos únicamente en el turno |

### Decisiones de diseño que tomó la persona

- Estética pixel art vista de frente, con la paleta de Starbucks.
- Mecánica de clic en frascos (en vez de arrastrar y soltar), mejor para celular.
- Conservar las reglas del juego y cambiar solo la pantalla.
- Ranking local en esta etapa, con el online como posible evolución.
- Todo el texto de la historia en voseo argentino.

### Qué conviene revisar de un proyecto hecho con IA

- **Textos y marca:** confirmar con el equipo de Starbucks el uso del nombre, la paleta y el sello.
- **Balance de juego:** los tiempos se ajustan en `src/game/data.js`; por ejemplo, un express de 5 segundos por bebida es exigente para recetas de 4–5 dosis.
- **Accesibilidad:** hay etiquetas y foco por teclado, pero conviene una pasada con lector de pantalla antes de un lanzamiento.
- **Seguridad de la cuenta:** es una cuenta local de demostración, no un sistema de autenticación real.

## Créditos

Concepto, dirección de producto y textos: equipo del proyecto. Código, arte pixel art en SVG y pruebas: desarrollados con Claude Code (Anthropic) bajo esa dirección. Starbucks y su identidad pertenecen a sus propietarios; este proyecto es una pieza de activación digital.
