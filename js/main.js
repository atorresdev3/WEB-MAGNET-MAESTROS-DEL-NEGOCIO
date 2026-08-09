// ===== CONTROL DE PANTALLAS =====
function goToScreen(fromEl, toEl, duration = 700) {
    if (fromEl) {
        fromEl.classList.remove("page-turn-in");
        fromEl.classList.add("page-turn-out");
    }

    toEl.classList.remove("hidden", "page-turn-out");
    void toEl.offsetWidth;
    toEl.classList.add("page-turn-in");

    setTimeout(() => {
        if (fromEl) {
            fromEl.classList.add("hidden");
            fromEl.classList.remove("page-turn-out");
        }
        toEl.classList.remove("page-turn-in");
    }, duration);
}

// ===== BARRAS DE PROGRESO: GENERAR RAYITAS SHIMMER =====
function buildShineBars(containerId, count = 16) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < count; i++) {
        const bar = document.createElement("div");
        bar.className = "shine-bar";
        container.appendChild(bar);
    }
}

buildShineBars("quiz-shine");
buildShineBars("processing-shine");
buildShineBars("loading2-shine");

const splash = document.getElementById("splash-perspective");
const screenWelcome = document.getElementById("screen-welcome");
const btnComenzar = document.getElementById("btn-comenzar");
const starsBg = document.getElementById("stars-bg");

// Cuando termina la animación del libro (3.2s delay + 1s giro = 4.2s), pasamos a bienvenida
const bookCover = document.getElementById("book-cover");
const coverImg = bookCover ? bookCover.querySelector("img") : null;

let flipStarted = false;

function startSplashFlip() {
    if (flipStarted) return;
    flipStarted = true;
    if (bookCover) bookCover.classList.add("start-flip");
    setTimeout(() => {
        splash.style.display = "none";
        goToScreen(null, screenWelcome);
    }, 1000);
}

let imgLoaded = !coverImg || (coverImg.complete && coverImg.naturalWidth > 0);
let minTimePassed = false;

function maybeStartFlip() {
    if (imgLoaded && minTimePassed) {
        startSplashFlip();
    }
}

if (coverImg && !imgLoaded) {
    coverImg.addEventListener("load", () => {
        imgLoaded = true;
        maybeStartFlip();
    });
    coverImg.addEventListener("error", () => {
        imgLoaded = true;
        maybeStartFlip();
    });
}

setTimeout(() => {
    minTimePassed = true;
    maybeStartFlip();
}, 2000);

// SEGURO ABSOLUTO: pase lo que pase, a los 5s se fuerza el avance sí o sí
setTimeout(startSplashFlip, 5000);

// ===== EFECTO DE TEXTO ANIMADO LETRA POR LETRA =====
function renderAnimatedText(el, text) {
    el.innerHTML = "";
    [...text].forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "loader-letter";
        span.style.animationDelay = `${i * 0.05}s`;
        span.textContent = char === " " ? "\u00A0" : char;
        el.appendChild(span);
    });
}

// ===== DATOS DEL QUIZ =====
const quizQuestions = [
    {
        question: "¿Cómo ves el dinero hoy?",
        options: ["Como algo que me limita, no como algo que yo controlo", "Sé ganarlo, pero no sé hacerlo crecer", "Lo manejo bien, pero no lo conecto con un proyecto propio"],
    },
    {
        question: "¿Qué te ha detenido hasta ahora?",
        options: ["El miedo a fallar", "No saber por dónde empezar", "No tener un plan claro"],
    },
    {
        question: "Si mejoraras tu economía y tuvieras tu propio negocio o emprendimiento, ¿qué cambiaría primero?",
        options: ["Mi estabilidad económica", "Mi tiempo y libertad", "Cómo me veo a mí mismo"],
    },
];

let quizIndex = 0;
const quizAnswers = [];

const screenQuiz = document.getElementById("screen-quiz");
const quizQuestionCard = document.getElementById("quiz-question-card");
const quizQuestionText = document.getElementById("quiz-question-text");
const quizOptionsContainer = document.getElementById("quiz-options-container");
const quizProgressBar = document.getElementById("quiz-progress-bar");
const quizProgressText = document.getElementById("quiz-progress-text");

function loadQuizQuestion() {
    const q = quizQuestions[quizIndex];
    quizProgressText.textContent = `Pregunta ${quizIndex + 1} de ${quizQuestions.length}`;
    quizProgressBar.style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
    quizQuestionText.textContent = q.question;

    quizOptionsContainer.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.innerHTML = `<span class="radio-dot"></span><span>${opt}</span>`;
        btn.addEventListener("click", () => selectQuizOption(i, btn));
        quizOptionsContainer.appendChild(btn);
    });

    quizQuestionCard.classList.remove("page-turn-out");
    void quizQuestionCard.offsetWidth;
    quizQuestionCard.classList.add("page-turn-in");
    setTimeout(() => quizQuestionCard.classList.remove("page-turn-in"), 700);
}

function selectQuizOption(index, btnEl) {
    const allBtns = quizOptionsContainer.querySelectorAll(".quiz-option");
    allBtns.forEach((b) => b.classList.remove("selected"));
    btnEl.classList.add("selected");
    quizAnswers[quizIndex] = index;

    setTimeout(() => {
        quizQuestionCard.classList.add("page-turn-out");
        setTimeout(() => {
            quizIndex++;
            if (quizIndex < quizQuestions.length) {
                loadQuizQuestion();
            } else {
                showProcessingScreen();
            }
        }, 700);
    }, 400);
}

// ===== BOTÓN "COMENZAR" -> INICIA EL QUIZ =====
btnComenzar.addEventListener("click", () => {
    goToScreen(screenWelcome, screenQuiz);
    loadQuizQuestion();
});

// ===== PANTALLA 5: PROCESANDO =====
const screenProcessing = document.getElementById("screen-processing");
const screenReveal = document.getElementById("screen-reveal");
const processingText = document.getElementById("processing-text");
const processingBar = document.getElementById("processing-bar");

const processingSteps = [
    { text: "Analizando tus respuestas...", duration: 1500 },
    { text: "Comparando tu patrón con {count} personas...", duration: 4500, counter: true, target: 70000 },
    { text: "Identificando tu punto de partida...", duration: 1500 },
    { text: "Preparando tu Fase 1...", duration: 3000 },
];

function formatNumber(n) {
    return Math.floor(n).toLocaleString("es-CO"); // 70.000 con punto
}

function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
}

function animateCounter(step) {
    const duration = step.duration - 200;
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuad(rawProgress);
        const current = eased * step.target;
        renderAnimatedText(processingText, step.text.replace("{count}", formatNumber(current)));
        if (rawProgress < 1) {
            requestAnimationFrame(tick);
        } else {
            renderAnimatedText(processingText, step.text.replace("{count}", formatNumber(step.target)));
        }
    }
    requestAnimationFrame(tick);
}

function runProcessingSteps() {
    let stepIndex = 0;
    const total = processingSteps.length;
    const totalDuration = processingSteps.reduce((sum, s) => sum + s.duration, 0);
    let cumulative = 0;

    function playStep() {
        const step = processingSteps[stepIndex];
        cumulative += step.duration;

        processingBar.style.transitionDuration = `${step.duration}ms`;
        processingBar.style.width = `${(cumulative / totalDuration) * 100}%`;

        processingText.classList.remove("visible");
        setTimeout(() => {
            if (step.counter) {
                animateCounter(step);
            } else {
                renderAnimatedText(processingText, step.text);
            }
            processingText.classList.add("visible");
        }, 200);

        setTimeout(() => {
            stepIndex++;
            if (stepIndex < total) {
                playStep();
            } else {
                setTimeout(() => {
                    showRevealScreen();
                }, 500);
            }
        }, step.duration);
    }

    playStep();
}

function showProcessingScreen() {
    goToScreen(screenQuiz, screenProcessing);
    processingBar.style.width = "0%";
    runProcessingSteps();
}

// ===== PANTALLA 6: REVELACIÓN (texto condicional) =====
const revealBody = document.getElementById("reveal-body");
const btnContinuar = document.getElementById("btn-continuar");

const bloquesP1 = [
    "Llevas tiempo sintiendo que el dinero manda sobre ti. Eso está por cambiar.",
    "No es que no sepas ganar dinero — sabes. Lo que nunca te enseñaron es a hacerlo crecer.",
    "Manejas bien el dinero. Lo que te falta es un proyecto donde ponerlo a trabajar de verdad.",
];

const bloquesP2 = [
    "Ese miedo a fallar que te ha detenido tantas veces — no es debilidad tuya. Es solo que nadie te dio un mapa.",
    "No saber por dónde empezar no te hace menos capaz. Solo significa que te ha faltado el mapa correcto.",
    "Has tenido las ganas todo este tiempo. Lo único que faltaba era el plan.",
];

const bloquesP3 = [
    "Y vas a sentir, por fin, esa estabilidad económica que llevas tiempo persiguiendo.",
    "Y vas a recuperar tu tiempo — el que hoy le regalas a todo menos a ti.",
    "Y vas a mirarte distinto — como alguien que por fin actuó, no como alguien que solo lo pensó.",
];

function buildRevealText() {
    const parrafos = [bloquesP1[quizAnswers[0]], bloquesP2[quizAnswers[1]], bloquesP3[quizAnswers[2]]];

    revealBody.innerHTML = "";
    parrafos.forEach((texto) => {
        const p = document.createElement("p");
        p.className = "text-base sm:text-lg text-[#e8e4d8] leading-relaxed";
        p.textContent = texto;
        revealBody.appendChild(p);
    });
}

function showRevealScreen() {
    buildRevealText();
    goToScreen(screenProcessing, screenReveal);
}

const screenLoading2 = document.getElementById("screen-loading2");
const screenNext = document.getElementById("screen-next");

btnContinuar.addEventListener("click", () => {
    goToScreen(screenReveal, screenLoading2);

    const loading2Bar = document.getElementById("loading2-bar");
    loading2Bar.style.width = "0%";
    void loading2Bar.offsetWidth; // fuerza reflow para que la transición se dispare
    loading2Bar.style.transitionDuration = "1100ms";
    loading2Bar.style.width = "100%";

    setTimeout(() => {
        goToScreen(screenLoading2, screenNext);
        starsBg.style.display = "none";
    }, 1300);
});

// ===== PANTALLA 8: ROADMAP DE 11 FASES =====
const roadmapContainer = document.getElementById("roadmap");
const btnVerFases = document.getElementById("btn-ver-fases");

const checkIconPath = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
const lockIconPath =
    "M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2zm6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zM12 3a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z";
const flagIconPath = "M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z";

function buildRoadmap() {
    roadmapContainer.innerHTML = '<div class="roadmap-line"></div>';

    for (let i = 1; i <= 11; i++) {
        const node = document.createElement("div");
        node.className = "roadmap-node";

        let circleClass = "locked";
        let iconPath = lockIconPath;
        let labelClass = "locked";
        let labelText = `Fase ${i}`;

        if (i === 1) {
            circleClass = "done";
            iconPath = checkIconPath;
            labelClass = "active";
            labelText = "Fase 1 — Desbloqueada";
        } else if (i === 11) {
            circleClass = "goal";
            iconPath = flagIconPath;
            labelText = "Fase 11 — Meta final";
        }

        node.innerHTML = `
        <div class="node-circle ${circleClass}">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="${iconPath}"/>
            </svg>
        </div>
        <span class="node-label ${labelClass} text-sm sm:text-base">${labelText}</span>`;

        roadmapContainer.appendChild(node);
    }
}

btnVerFases.addEventListener("click", () => {
    window.location.href = "https://maestros.clubmentesmaestras.online/";
});

buildRoadmap();

// ===== INDICADOR DE SCROLL (PANTALLA 8) =====
const scrollHint = document.getElementById("scroll-hint");

screenNext.addEventListener("scroll", () => {
    if (screenNext.scrollTop > 30) {
        scrollHint.classList.add("hidden-hint");
    } else {
        scrollHint.classList.remove("hidden-hint");
    }
});

// ===== AJUSTE DINÁMICO DE LA PORTADA SEGÚN LA PANTALLA REAL =====
// ===== AJUSTE DINÁMICO DE LA PORTADA SEGÚN LA PANTALLA REAL =====
function adjustCoverImage() {
    if (!coverImg || !coverImg.naturalWidth) return;

    const screenRatio = window.innerWidth / window.innerHeight;
    const imgRatio = coverImg.naturalWidth / coverImg.naturalHeight;

    // Si la pantalla es relativamente más ancha que la imagen, "cover" recortaría el pie de portada
    coverImg.style.objectFit = screenRatio > imgRatio ? "contain" : "cover";
}

if (coverImg) {
    if (coverImg.complete) {
        adjustCoverImage();
    } else {
        coverImg.addEventListener("load", adjustCoverImage);
    }
}
window.addEventListener("resize", adjustCoverImage);
