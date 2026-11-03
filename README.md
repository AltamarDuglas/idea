# ¿Existen traumas en las moscas? — Tratado y Ensayo Interactivo Next.js + React

**Escrito por Duglas Altamar Gómez**  
*Reflexión filosófica y neurobiológica + 4 experimentos interactivos*

Bienvenido a la documentación oficial del tratado interactivo **¿Existen traumas en las moscas?**, un ensayo de divulgación neurobiológica y reflexión humana construido con **Next.js 14**, **React 18** y la filosofía de diseño e ingeniería de microinteracciones de **Emil Kowalski**.

Esta guía está diseñada para que cualquier desarrollador, diseñador o investigador, sin importar su nivel de experiencia técnica, pueda comprender la arquitectura del software, ejecutar el proyecto localmente y extenderlo siguiendo buenas prácticas y la metodología SOLID.

---

## Tabla de Contenidos
1. [Descripción General y Tesis](#descripción-general-y-tesis)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Filosofía de Animación e Interacción (Emil Kowalski)](#filosofía-de-animación-e-interacción-emil-kowalski)
4. [Laboratorios y Experimentos Interactivos](#laboratorios-y-experimentos-interactivos)
5. [Componentes Flotantes y Glosario (ScientificTooltip)](#componentes-flotantes-y-glosario-scientifictooltip)
6. [Arquitectura y Principios SOLID](#arquitectura-y-principios-solid)
7. [Temática Editorial: Estilo Libro (Mobile-First)](#temática-editorial-estilo-libro-mobile-first)
8. [Instalación y Ejecución Local](#instalación-y-ejecución-local)
9. [Licencia y Fuentes Científicas](#licencia-y-fuentes-científicas)

---

## Descripción General y Tesis

El ensayo parte de una reflexión sobre nuestro propio **egocentrismo como especie**, cómo la comunicación honesta ayuda a acercarnos más y cómo nuestros sesgos cognitivos distorsionan el entendimiento del dolor ajeno.

A través de una narrativa editorial articulada y 4 figuras interactivas en tiempo real, el lector transita por un aprendizaje progresivo de empatía y comunicación:
1. **Frontispicio (Introducción):** El egocentrismo humano como jaula biológica. Juzgamos la herida ajena desde la comodidad de nuestros propios sentidos y asumimos que si el dolor no habla nuestro idioma, no existe.
2. **Capítulo 01 (El bosque y la humildad de la mirada):** La paradoja del árbol al caer. Distinción entre la física objetiva (ondas mecánicas de presión) y la fabricación mental de la sensación (sonido). Reconocer que nuestra mente no es un espejo del universo, sino un traductor subjetivo.
3. **Capítulo 02 (El Umwelt: cada uno en su burbuja):** Concepto de Jakob von Uexküll. La mosca (*Drosophila melanogaster*) procesa el tiempo a 250 Hz frente a nuestros 60 Hz; su mundo subjetivo no es inferior, sino radicalmente diferente. Incluye ficha flotante biológica interactiva.
4. **Capítulo 03 (Aprender a escuchar: la prueba científica del trauma):** Cuando dejamos de exigirles que hablen nuestro idioma y aprendemos a observar sus señales, el trauma se vuelve demostrable y matemáticamente predictible a través de tres experimentos seminales:
   - *La herida del rechazo* (Science, 2012): Desplome de Neuropéptido F y consumo compensatorio de alcohol.
   - *El fantasma de la amenaza* (Current Biology, 2015): Hipervigilancia postraumática ante sombras repetidas.
   - *La resignación aprendida* (J. Exp. Biology, 2013): Indefensión aprendida ante calor sin salida.
5. **Capítulo 04 (El espejo evolutivo: el puente de la empatía y la comunicación):** Las emociones no son creaciones exclusivas del alma humana: la evolución construyó el miedo y el apego cientos de millones de años antes del lenguaje. La distancia entre dos mentes se acorta cuando decidimos escuchar y desarmar nuestros prejuicios.

---

## Estructura del Proyecto

```text
Traumas_Moscas/
├── package.json                         # Dependencias (Next.js 14, React 18, Framer Motion, Lucide)
├── next.config.mjs                      # Configuración de Next.js
├── tsconfig.json                        # Configuración de TypeScript con alias @/*
├── README.md                            # Documentación exhaustiva (este archivo)
├── .agents/
│   └── skills/
│       ├── animate/                     # Skill oficial de Emil Kowalski para animaciones
│       └── emil-design-eng/             # Skill oficial de Emil Kowalski para microinteracciones y pulido UI
└── src/
    ├── app/
    │   ├── layout.jsx                   # Layout raíz con metadatos SEO y tipografía
    │   └── page.jsx                     # Página principal con orquestación de capítulos y scroll observer
    ├── components/
    │   ├── figures/                     # Componentes de laboratorio interactivo
    │   │   ├── TreeParadoxFigure.jsx    # Exp 01: Árbol en el bosque, distancia de oyente y Web Audio API
    │   │   ├── DrosophilaUmweltFigure.jsx# Exp 02: Comparador visual 60 Hz vs 250 Hz (cámara lenta biológica)
    │   │   ├── BehavioralArenaFigure.jsx # Exp 03: Arena de predicción con telemetría de neurotransmisores
    │   │   └── EvolutionaryMirrorFigure.jsx # Exp 04: Conectoma comparado humano vs mosca y puente sináptico
    │   ├── layout/
    │   │   ├── TopNavbar.jsx            # Barra superior con progreso de lectura e interruptor de tema
    │   │   ├── HeroSection.jsx          # Frontispicio del libro con autoría y letra capitular
    │   │   └── BibliographySection.jsx  # Referencias científicas rigurosas
    │   └── ui/
    │       ├── ScientificTooltip.jsx    # Ficha flotante accesible para términos científicos (hover/tap)
    │       └── BlueprintCard.jsx        # Fichas técnicas explicativas al pie de cada figura
    ├── domain/                          # Modelos de dominio puro y lógica desacoplada (SOLID)
    │   ├── models/
    │   │   ├── AcousticPhysics.js       # Simulación de propagación de ondas de presión y atenuación acústica
    │   │   ├── Neurochemistry.js        # Modelo de neurotransmisores (Arousal, NPF, Motor)
    │   │   └── SensoryFilter.js         # Modelo matemático de frecuencia de fusión y tiempo dilatado
    │   └── services/
    │       ├── TraumaPredictionService.js # Motor de predicción de protocolos experimentales
    │       └── EvolutionaryContinuityService.js # Síntesis evolutiva de circuitos del dolor
    └── styles/
        ├── tokens.css                   # Variables de diseño (curvas de Emil Kowalski, paleta de libro)
        ├── globals.css                  # Estilos globales y reglas de microinteracción
        └── iso.css                      # Reglas específicas de esquemas anatómicos
```


---

## ✨ Filosofía de Animación e Interacción (Emil Kowalski)

El proyecto sigue estrictamente las directrices codificadas en las skills `emil-design-eng` y `animate`:

1. **Curvas de aceleración precisas (Nunca valores inventados):**
   - `--ease-out`: `cubic-bezier(0.23, 1, 0.32, 1)` para entradas y respuestas interactivas ágiles.
   - `--ease-in-out`: `cubic-bezier(0.77, 0, 0.175, 1)` para elementos en desplazamiento continuo.
2. **Propiedades aceleradas por hardware:**
   - Animaciones limitadas exclusivamente a `transform` y `opacity` para garantizar 60/120 fps sin recalcular diseño (*layout thrashing*).
3. **Respuesta háptica y táctil inmediata:**
   - Botones con compresión visual al presionar: `:active { transform: scale(0.97); }` (duración `< 160ms`).
4. **Patrón "Sliding Pill" con `layoutId`:**
   - El selector de protocolos en el Experimento 03 utiliza el indicador flotante animado de Framer Motion, garantizando continuidad espacial al cambiar de protocolo.
5. **Telemetría con resortes físicos:**
   - Los medidores neuroquímicos emplean físicas de resorte (`stiffness: 120, damping: 18`) para reaccionar orgánicamente a los estímulos.
6. **Accesibilidad integrada:**
   - Soporte total para `@media (prefers-reduced-motion: reduce)`, atenuando el movimiento para usuarios sensibles.

---

## 🔬 Laboratorios y Experimentos Interactivos

### Experimento 01: El Árbol que Cae y la Paradoja del Sonido
- **Premisa Central:** Resolver de forma intuitiva la paradoja: ¿hace ruido un árbol al caer si no hay nadie para escucharlo?
- **Interacción Directa y Tangible:**
  - **Empuje y Toque Directo:** El usuario puede tocar el árbol en la pantalla o usar el botón para provocar la caída gravitacional física.
  - **Selector Simple de Presencia (2 Estados):**
    1. *Nadie en el bosque:* Las ondas de presión se expanden en silencio absoluto.
    2. *Hay una persona escuchando:* Cuando la onda alcanza a la persona, su oído y cerebro convierten el golpe de aire en sonido real en tus altavoces.
  - **Control de Distancia del Oyente:** Un deslizador permite colocar a la persona cerca (golpe fuerte e inmediato) o lejos (golpe más suave y tardío).
  - **Botón de Restablecimiento:** Permite volver a levantar el árbol para repetir el experimento en cualquier momento.
  - **Explicación Técnica Diferida:** Colocada al final para no sobrecargar la experiencia inmediata, explicando la distinción entre las ondas físicas de aire y la percepción subjetiva fabricada por el cerebro.

### Experimento 02: El Filtro del Umwelt
- **Premisa:** Ilustrar cómo la frecuencia crítica de fusión de destellos (*Flicker Fusion Rate*) define la velocidad subjetiva del tiempo.
- **Interacción:** Un control deslizante transiciona desde la visión foveal humana (60 Hz) hacia los ojos compuestos de Drosophila (250 Hz). A máxima frecuencia, el movimiento de la mano atacante se ralentiza más de 4 veces y se traza el vector de evasión en tiempo real.

### Experimento 03: Arena de Predicción Conductual
- **Premisa:** Validar que una experiencia traumática previa permite predecir matemáticamente la conducta futura del insecto.
- **Interacción:** 4 protocolos intercambiables:
  1. *Estado Basal:* Exploración tranquila hacia glucosa.
  2. *Sombra (TEPT):* Barrido aéreo que activa hipervigilancia motora y rechazo al alimento.
  3. *Calor Sin Salida:* Indefensión aprendida con parálisis motora total (inmóvil ante la salida abierta).
  4. *Rechazo + Etanol:* Caída crítica de Neuropéptido F que empuja al sujeto directamente al comedero con alcohol al 15%.

### Experimento 04: El Espejo Evolutivo
- **Premisa:** Comparar el conectoma de 140.000 neuronas del insecto con los 86.000 millones del cerebro humano.
- **Interacción:** Un dial continuo equilibra la postura entre el Mecanicismo Reduccionista y la Empatía Filogenética, iluminando el puente sináptico con pulsos de partículas iónicas.

---

## Componentes Flotantes y Glosario (ScientificTooltip)

En el Capítulo 02 y Capítulo 03, los términos neurobiológicos clave (como *Drosophila melanogaster*) incorporan el componente accesible `ScientificTooltip` (`src/components/ui/ScientificTooltip.jsx`):

1. **Interacción Dual Móvil/Escritorio:**
   - **Escritorio:** Al pasar el cursor (`onMouseEnter`), emerge una tarjeta flotante estilizada como una ficha de herbario o tratado antiguo con reborde pan de oro.
   - **Móvil / Pantalla Táctil:** Al tocar la palabra con subrayado punteado (`onClick`), se abre la ficha biológica. Para cerrarla, basta con tocar cualquier punto fuera de la tarjeta (`pointerdown outside listener`), evitando que el tooltip bloquee la lectura.
2. **Animación Fluida:**
   - Transición de entrada y salida con `framer-motion` (`opacity` y microdesplazamiento vertical en eje `y`) respetando la aceleración ágil de 160ms.
3. **Accesibilidad:**
   - Uso de `role="tooltip"`, `aria-expanded` y botón interactivo semántico nativo.

---

## Arquitectura y Principios SOLID

El código se encuentra desacoplado para máxima claridad y mantenibilidad:

1. **S - Responsabilidad Única (Single Responsibility):**
   - Los modelos `Neurochemistry`, `AcousticPhysics` y `SensoryFilter` se limitan a la matemática física y las reglas de dominio.
   - Los componentes de React en `src/components/figures/` se ocupan exclusivamente de la vista y la interacción táctil.
2. **O - Abierto/Cerrado (Open/Closed):**
   - El servicio `TraumaPredictionService` permite agregar nuevos protocolos experimentales simplemente registrando un objeto de configuración, sin necesidad de modificar el ciclo de animación de la arena.
3. **L - Sustitución de Liskov:**
   - Todos los protocolos experimentales implementan una estructura de telemetría y metadatos coherente y compatible.
4. **I - Segregación de Interfaces:**
   - Se evitan propiedades monolíticas. Las fuentes bibliográficas, la barra de navegación, las tarjetas blueprint y los tooltips son componentes atómicos independientes.
5. **D - Inversión de Dependencias:**
   - La lógica fisiológica y acústica no depende de Next.js ni del DOM; puede ser testeada en entornos puros de JavaScript.

---

## Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** v18.18+ (o v20+)
- **NPM** v9+


### Pasos
1. Clona o abre la carpeta del proyecto en tu terminal.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre tu navegador web en [http://localhost:3000](http://localhost:3000).

Para compilar la versión optimizada de producción:
```bash
npm run build
npm run start
```

---

## Licencia y Fuentes Científicas

- **Nagel, T. (1974).** *What Is It Like to Be a Bat?* The Philosophical Review, 83(4), 435-450.
- **Von Uexküll, J. (1934).** *A Stroll Through the Worlds of Animals and Men.*
- **Gibson, W. T., Gonzalez, C. R., & Anderson, D. J. (2015).** *Behavioral Responses to a Repetitive Visual Threat Stimulus Express a Persistent State of Defensive Arousal in Drosophila.* Current Biology, 25(11), 1401-1415.
- **Shohat-Ophir, G., Kaun, K. R., Azanchi, R., & Heberlein, U. (2012).** *Sexual Deprivation Increases Ethanol Intake in Drosophila.* Science, 335(6074), 1351-1355.
- **Yang, Z., Bertolucci, F., Wolf, R., & Heisenberg, M. (2013).** *Flies cope with uncontrollable stress by learned helplessness.* Journal of Experimental Biology, 216(11), 2056-2063.
- **Emil Kowalski Skills:** Filosofía de microinteracciones, animaciones y diseño de interfaces bajo licencia MIT.

---

## Temática Editorial: Estilo Libro (Mobile-First)

El proyecto adopta una identidad visual inspirada en un **tratado científico clásico encuadernado**, combinando el rigor editorial con la interactividad de vanguardia:

1. **Pliegos de Libro (`.book-page-folio`):**
   - Cada capítulo está contenido en un pliego visual con fondo de pergamino (`var(--bg-book)`), borde sutil de encuadernación y sombra de lomo (`var(--book-page-shadow)`).
2. **Letra Capitular Histórica (`.drop-cap`):**
   - La letra inicial de cada capítulo se eleva como una capitular destacada en tono pan de oro (`var(--accent-amber)`), emulando los manuscritos y tratados renacentistas.
3. **Cinta Marcapáginas y Barra de Folio:**
   - Una cinta roja de tela en la esquina superior (`.ribbon-bookmark`) acompaña la lectura, mientras que la barra superior (`TopNavbar`) muestra el folio y capítulo activo mediante un `IntersectionObserver`.
4. **Paleta Dual Pergamino / Biblioteca Nocturna:**
   - **Modo Oscuro (Por defecto):** *Biblioteca Nocturna*, tinta marfil suave (`#F5F2EB`) sobre fondo de tomo oscuro (`#141210`) con toques de pan de oro (`#F59E0B`).
   - **Modo Claro:** *Papel Vergé Marfil*, tinta nuez profunda (`#1C1814`) sobre pergamino cálido (`#FBF8F2`).
5. **Diseño Mobile-First Estricto:**
   - Diseñado primero para pantallas móviles desde **320px** de ancho.
   - Objetivos táctiles con un tamaño mínimo de **42px a 48px** para evitar toques accidentales.
   - Distribución fluida: los controles y telemetrías se apilan verticalmente en smartphones y se expanden dinámicamente en tabletas y escritorios (600px+ y 680px+).
   - Canvas con resolución de píxel ratio dinámico (`window.devicePixelRatio`) para máxima nitidez en pantallas Retina y OLED móviles.

---

## Diagnóstico y Resolución de Problemas

### Si los estilos no cargan o Next.js muestra errores 404 en CSS:
Next.js en modo desarrollo (*Fast Refresh / HMR*) puede llegar a desincronizar los identificadores estáticos de la caché en `.next/` tras modificaciones de archivos en disco. Para restablecer el servicio en limpio:

```bash
# 1. Detener el servidor con Ctrl + C
# 2. Eliminar la caché y compilar en limpio
powershell -Command "if (Test-Path .next) { Remove-Item -Recurse -Force .next }; npm run build"

# 3. Reiniciar el servidor de desarrollo
npm run dev
```
Esto garantiza la regeneración completa de `tokens.css` y `globals.css` sin caché residual.

