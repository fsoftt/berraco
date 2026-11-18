# Berraco

PWA de ayuno intermitente. Gratis, sin cuenta, tus datos se quedan en tu dispositivo.

- App: https://fsoftt.github.io/berraco/app/
- Landing: https://fsoftt.github.io/berraco/ (también `/en/` y `/pt/`)

## Funciones

- Temporizador con anillo de progreso, porcentaje, tiempo restante y hora estimada de fin; editar la hora de inicio si se te olvidó arrancar.
- Protocolos 13:11, 16:8, 18:6, 20:4, OMAD, 36 h, 48 h y personalizado.
- Fases del ayuno con beneficios (según estudios), fase actual y cuenta regresiva a la siguiente.
- Historial por semanas con edición, estado de ánimo, notas y confirmación al borrar.
- Estadísticas con gráficas (duración, peso, agua) y KPIs (racha, promedio, más largo, tasa de metas).
- Peso con IMC, cambio vs. primer registro y vs. hace una semana, y progreso hacia la meta.
- Agua con botones rápidos de +250 ml, rachas, mini timer (Document Picture-in-Picture si el navegador lo soporta) e insignia de la app con las horas transcurridas.
- Tema sistema/claro/oscuro, exportar/importar JSON, borrar todo.
- Funciona offline (Workbox) y es instalable.
- Idiomas: español (es-CO, por defecto), inglés (en) y portugués (pt-BR).

## Arquitectura

```
src/
  domain/           TS puro: entidades, protocolos, fases, rachas, IMC, estadísticas
  application/      casos de uso + puertos (repositorios, Clock, Notifier, Badge, Mirror)
  infrastructure/   Dexie (IndexedDB), WebNotifier, badge, espejo localStorage, archivos JSON
  i18n/             i18next + un archivo por idioma (locales/)
  presentation/     React: páginas, componentes, hooks, contexto (inyección de dependencias)

presentation --> application --> domain
infrastructure --> application (implementa los puertos) --> domain
```

El dominio es independiente del idioma: fases y protocolos exponen ids y los textos viven en `src/i18n/locales`.
El ayuno activo se espeja en `localStorage["berraco.activeFast"]` como `{startedAt, targetHours}` para que un widget nativo futuro pueda leerlo.

## Desarrollo

```bash
npm install
npm run dev        # servidor local en /berraco/app/
npm test           # Vitest (dominio, casos de uso, i18n, Dexie)
npm run build      # tsc estricto + vite build + PWA
npm run site       # arma artifact/ (landing en la raíz + app en /app/)
npm run icons      # regenera los PNG a partir de public/favicon.svg
```

El despliegue ocurre en cada push a `main` con `.github/workflows/deploy.yml` (tests, build, `npm run site`, GitHub Pages).

## Agregar un idioma

1. Crea `src/i18n/locales/<codigo>.ts` copiando `en.ts` (el tipo `Translation` obliga a tener las mismas claves; hay un test que lo verifica).
2. Regístralo en `src/i18n/index.ts` (`resources`, `LANGUAGES`, `normalizeLanguage`) y agrega el código a `LanguageCode` en `src/domain/entities.ts`.
3. Landing: agrega una entrada en `landing/content.mjs`.

La app detecta el idioma en el primer uso (`?lang=`, luego `navigator.language`) y lo guarda en el perfil; se cambia en Ajustes. La landing recuerda la elección en `localStorage` y pasa `?lang=` al abrir la app.

## Notificaciones: límites en la web

Los avisos de meta y de nueva fase se programan con `setTimeout` mientras la app está abierta y se muestran vía service worker. Las web apps no pueden programar notificaciones confiables en segundo plano sin un servidor push, así que si el navegador suspende o cierra la pestaña, el aviso puede no llegar. En iOS las notificaciones solo funcionan con la PWA instalada en la pantalla de inicio (iOS 16.4 o superior). El badge (`navigator.setAppBadge`) depende del navegador.

## Futuro Android

- **Capacitor**: `npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, `npx cap add android`, apuntando `webDir` a `dist` (con `base` ajustada a `./`). Los puertos (`Notifier`, `BadgeService`, `ActiveFastMirror`) permiten reemplazar la infraestructura web por plugins nativos (notificaciones locales programadas).
- **TWA con Bubblewrap**: `npx @bubblewrap/cli init --manifest https://fsoftt.github.io/berraco/app/manifest.webmanifest`, y publicar los `assetlinks.json` correspondientes.
- **Widget en la pantalla de inicio**: un `AppWidgetProvider` nativo que lee el ayuno activo `{startedAt, targetHours}` (con Capacitor, desde SharedPreferences, sincronizado por un plugin que escriba la misma clave que el espejo de `localStorage`) y pinta el tiempo transcurrido.

## Aviso

Berraco no es consejo médico. Consulta a un profesional de la salud antes de ayunar.
