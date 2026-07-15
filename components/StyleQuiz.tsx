"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { products } from "@/data/products";
import type { Product } from "@/types/product";

type QuestionId =
  | "productType"
  | "style"
  | "faceShape"
  | "frameShape"
  | "material"
  | "color"
  | "priority";

type QuizOption = {
  value: string;
  label: string;
  description?: string;
};

type QuizQuestion = {
  id: QuestionId;
  question: string;
  helper: string;
  options: QuizOption[];
};

type QuizAnswers = Partial<Record<QuestionId, string>>;

const questions: QuizQuestion[] = [
  {
    id: "productType",
    question: "¿Qué buscas?",
    helper: "Empecemos por la colección que quieres explorar.",
    options: [
      { value: "eyeglasses", label: "Lentes ópticos" },
      { value: "sunglasses", label: "Lentes de sol" },
      { value: "both", label: "Ambos" },
    ],
  },
  {
    id: "style",
    question: "¿Qué estilo te gusta?",
    helper: "Elige la opción que mejor se parece a tu forma de vestir.",
    options: [
      { value: "classic", label: "Clásico" },
      { value: "modern", label: "Moderno" },
      { value: "bold", label: "Atrevido" },
      { value: "minimal", label: "Minimalista" },
    ],
  },
  {
    id: "faceShape",
    question: "¿Cuál es la forma de tu rostro?",
    helper: "No hay respuestas incorrectas; esto solo afina la selección.",
    options: [
      { value: "round", label: "Redondo" },
      { value: "oval", label: "Ovalado" },
      { value: "square", label: "Cuadrado" },
      { value: "heart", label: "Corazón" },
      { value: "unknown", label: "No sé" },
    ],
  },
  {
    id: "frameShape",
    question: "¿Qué forma de armazón prefieres?",
    helper: "Piensa en la silueta que más te gusta cuando te ves al espejo.",
    options: [
      { value: "redondo", label: "Redondo" },
      { value: "cuadrado", label: "Cuadrado" },
      { value: "rectangular", label: "Rectangular" },
      { value: "aviador", label: "Aviador" },
    ],
  },
  {
    id: "material",
    question: "¿Qué material prefieres?",
    helper: "Usaremos tu elección como una señal de estilo y sensación.",
    options: [
      { value: "acetate", label: "Acetato" },
      { value: "metal", label: "Metal" },
      { value: "mixed", label: "Mixto" },
      { value: "any", label: "Sin preferencia" },
    ],
  },
  {
    id: "color",
    question: "¿Qué color prefieres?",
    helper: "Selecciona el tono que usarías con más frecuencia.",
    options: [
      { value: "black", label: "Negro" },
      { value: "tortoise", label: "Carey" },
      { value: "clear", label: "Transparente" },
      { value: "metallic", label: "Dorado o plateado" },
      { value: "colorful", label: "Colorido" },
    ],
  },
  {
    id: "priority",
    question: "¿Qué buscas en tus lentes?",
    helper: "Elige lo que más te importa para el uso que les darás.",
    options: [
      { value: "light", label: "Ligero y discreto" },
      { value: "elegant", label: "Elegante" },
      { value: "statement", label: "Llamativo" },
      { value: "everyday", label: "Para diario" },
    ],
  },
];

const faceShapeMatches: Record<string, Product["shape"][]> = {
  round: ["cuadrado", "rectangular"],
  oval: ["redondo", "cuadrado", "rectangular", "aviador"],
  square: ["redondo", "aviador"],
  heart: ["redondo", "aviador"],
  unknown: [],
};

function scoreProduct(product: Product, answers: QuizAnswers) {
  let score = 0;
  const searchableText = [
    product.name,
    product.description,
    product.category,
    product.shape,
    product.frameColor,
  ]
    .join(" ")
    .toLowerCase();

  if (answers.productType === "both") {
    score += 1;
  } else if (answers.productType === product.type) {
    score += 7;
  } else {
    score -= 4;
  }

  if (answers.frameShape === product.shape) {
    score += 5;
  }

  const preferredFaceShapes = answers.faceShape
    ? faceShapeMatches[answers.faceShape] || []
    : [];

  if (preferredFaceShapes.includes(product.shape)) {
    score += answers.faceShape === "oval" ? 1 : 2;
  }

  const colorMatches: Record<string, Product["frameColor"][]> = {
    black: ["negro"],
    tortoise: ["cafe"],
    clear: ["transparente"],
    metallic: ["dorado"],
    colorful: [],
  };

  if (
    answers.color &&
    (colorMatches[answers.color] || []).includes(product.frameColor)
  ) {
    score += 4;
  }

  if (answers.color === "colorful" && /premium|urbano/.test(searchableText)) {
    score += 1;
  }

  if (answers.style === "classic") {
    if (/clásico|clasico/.test(searchableText)) score += 4;
    if (product.shape === "redondo" || product.shape === "aviador") score += 1;
  }

  if (answers.style === "modern") {
    if (/moderno|urbano|limpio/.test(searchableText)) score += 4;
    if (product.shape === "cuadrado" || product.shape === "rectangular") {
      score += 1;
    }
  }

  if (answers.style === "bold") {
    if (/premium|urbano/.test(searchableText)) score += 3;
    if (product.shape === "aviador" || product.frameColor === "dorado") {
      score += 2;
    }
  }

  if (answers.style === "minimal") {
    if (/ligero|limpio/.test(searchableText)) score += 3;
    if (product.frameColor === "transparente") score += 3;
  }

  if (answers.material === "acetate") {
    if (["negro", "cafe", "transparente"].includes(product.frameColor)) {
      score += 1;
    }
  }

  if (answers.material === "metal") {
    if (product.frameColor === "dorado" || product.shape === "aviador") {
      score += 2;
    }
  }

  if (answers.material === "mixed") {
    score += 1;
  }

  if (answers.priority === "light") {
    if (/ligero|limpio/.test(searchableText)) score += 3;
    if (product.frameColor === "transparente") score += 1;
  }

  if (answers.priority === "elegant") {
    if (/elegante|premium|clásico|clasico/.test(searchableText)) score += 3;
  }

  if (answers.priority === "statement") {
    if (/premium|urbano/.test(searchableText)) score += 2;
    if (product.frameColor === "dorado") score += 2;
  }

  if (answers.priority === "everyday" && /diario|todos los días/.test(searchableText)) {
    score += 3;
  }

  return score;
}

function getRecommendations(answers: QuizAnswers) {
  return products
    .filter((product) => product.isActive && product.stock > 0)
    .map((product) => ({ product, score: scoreProduct(product, answers) }))
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.product.name.localeCompare(second.product.name, "es")
    )
    .slice(0, 3)
    .map(({ product }) => product);
}

function getOptionLabel(questionId: QuestionId, value?: string) {
  return (
    questions
      .find((question) => question.id === questionId)
      ?.options.find((option) => option.value === value)?.label || ""
  );
}

function getResultSummary(answers: QuizAnswers) {
  const productType = getOptionLabel("productType", answers.productType);
  const style = getOptionLabel("style", answers.style).toLowerCase();
  const frameShape = getOptionLabel(
    "frameShape",
    answers.frameShape
  ).toLowerCase();
  const material = getOptionLabel("material", answers.material).toLowerCase();
  const color = getOptionLabel("color", answers.color).toLowerCase();
  const priority = getOptionLabel("priority", answers.priority).toLowerCase();

  const faceNotes: Record<string, string> = {
    round:
      "También consideramos formas cuadradas y rectangulares para aportar contraste a un rostro redondo.",
    oval:
      "Un rostro ovalado combina con muchas siluetas, así que dimos más peso a tus preferencias personales.",
    square:
      "También consideramos formas redondas y aviador para suavizar los ángulos de un rostro cuadrado.",
    heart:
      "También consideramos formas redondas y aviador para equilibrar un rostro con forma de corazón.",
    unknown:
      "Como no estás seguro de la forma de tu rostro, priorizamos tus elecciones de estilo, forma y color.",
  };

  return `Buscas ${productType.toLowerCase()} con un estilo ${style}. Prefieres un armazón ${frameShape}, ${material}, en ${color}, y que se sienta ${priority}. ${
    faceNotes[answers.faceShape || "unknown"]
  }`;
}

export default function StyleQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const progress = showResults
    ? 100
    : ((currentStep + 1) / questions.length) * 100;

  const recommendations = useMemo(
    () => getRecommendations(answers),
    [answers]
  );

  function selectAnswer(value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: value,
    }));
  }

  function goBack() {
    if (showResults) {
      setShowResults(false);
      setCurrentStep(questions.length - 1);
      return;
    }

    setCurrentStep((step) => Math.max(0, step - 1));
  }

  function goNext() {
    if (!currentAnswer) return;

    if (currentStep === questions.length - 1) {
      setShowResults(true);
      return;
    }

    setCurrentStep((step) => step + 1);
  }

  function restartQuiz() {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (showResults) {
    const catalogHref =
      answers.productType === "sunglasses" ? "/sunglasses" : "/eyeglasses";

    return (
      <main className="min-h-screen bg-white text-black">
        <section className="bg-[#f7f3ee] px-6 py-20 text-center md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-600">
              Tu estilo · Resultado
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Encontramos opciones para ti
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-700">
              {getResultSummary(answers)}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#recomendaciones"
                className="rounded-full bg-black px-7 py-3.5 font-medium text-white transition hover:bg-black/80"
              >
                Ver mis recomendaciones
              </a>
              <a
                href={catalogHref}
                className="rounded-full border border-black px-7 py-3.5 font-medium transition hover:bg-black hover:text-white"
              >
                Ver todos los lentes
              </a>
              <button
                type="button"
                onClick={restartQuiz}
                className="rounded-full border border-black/20 px-7 py-3.5 font-medium transition hover:border-black"
              >
                Reiniciar quiz
              </button>
            </div>
          </div>
        </section>

        <section
          id="recomendaciones"
          className="mx-auto max-w-6xl scroll-mt-28 px-6 py-20 md:py-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gray-500">
                Selección OLM
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Tus mejores coincidencias
              </h2>
            </div>
            <button
              type="button"
              onClick={goBack}
              className="text-sm font-semibold underline underline-offset-4"
            >
              Cambiar mi última respuesta
            </button>
          </div>

          <ProductGrid products={recommendations} />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-16 text-black sm:px-6 md:py-24">
      <section id="quiz" className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-600">
            Tu estilo
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Encuentra los lentes que van contigo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Responde siete preguntas rápidas y descubre modelos de Óptica OLM
            elegidos para tus preferencias.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-black/10 bg-white p-7 shadow-sm md:mt-16 md:p-12">
          <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
            <span>
              Paso {currentStep + 1} de {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label="Progreso del quiz"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="h-full rounded-full bg-black transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-12">
            <p className="text-sm font-medium text-gray-500">
              Pregunta {currentStep + 1}
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {currentQuestion.question}
            </h2>
            <p className="mt-3 text-gray-600">{currentQuestion.helper}</p>
          </div>

          <div
            className="mt-10 grid gap-4 md:grid-cols-2"
            role="group"
            aria-label={currentQuestion.question}
          >
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectAnswer(option.value)}
                  aria-pressed={isSelected}
                  className={`flex min-h-28 items-center justify-between gap-5 rounded-2xl border p-6 text-left transition md:min-h-32 md:p-7 ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white hover:border-black"
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      isSelected
                        ? "border-white bg-white text-black"
                        : "border-black/30"
                    }`}
                    aria-hidden
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-between gap-4 border-t border-black/10 pt-7">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="rounded-full border border-black/20 px-6 py-3 font-medium transition hover:border-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!currentAnswer}
              className="rounded-full bg-black px-7 py-3 font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {currentStep === questions.length - 1
                ? "Ver resultados"
                : "Siguiente"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
