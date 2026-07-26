"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import ProductGrid from "@/components/ProductGrid";
import { products as fallbackProducts } from "@/data/products";
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
  description: string;
};

type QuizQuestion = {
  id: QuestionId;
  question: string;
  helper: string;
  options: QuizOption[];
};

type QuizAnswers = Partial<Record<QuestionId, string>>;
type SaveState = "idle" | "saving" | "saved" | "guest" | "error";

const questions: QuizQuestion[] = [
  {
    id: "productType",
    question: "¿Qué buscas?",
    helper: "Empecemos por la colección que quieres explorar.",
    options: [
      {
        value: "eyeglasses",
        label: "Lentes ópticos",
        description: "Armazones para graduación o descanso.",
      },
      {
        value: "sunglasses",
        label: "Lentes de sol",
        description: "Protección solar con tu propio estilo.",
      },
      {
        value: "both",
        label: "Ambos",
        description: "Quiero descubrir toda la colección.",
      },
    ],
  },
  {
    id: "style",
    question: "¿Qué estilo se parece más a ti?",
    helper: "Elige la estética que usarías con más frecuencia.",
    options: [
      {
        value: "classic",
        label: "Clásico",
        description: "Siluetas atemporales y fáciles de combinar.",
      },
      {
        value: "modern",
        label: "Moderno",
        description: "Líneas limpias con detalles actuales.",
      },
      {
        value: "bold",
        label: "Atrevido",
        description: "Un armazón que sea parte del look.",
      },
      {
        value: "minimal",
        label: "Minimalista",
        description: "Ligero, discreto y sin exceso.",
      },
    ],
  },
  {
    id: "faceShape",
    question: "¿Cuál es la forma de tu rostro?",
    helper: "No hay respuestas incorrectas; esto solo afina la selección.",
    options: [
      {
        value: "round",
        label: "Redondo",
        description: "Contornos suaves y proporciones similares.",
      },
      {
        value: "oval",
        label: "Ovalado",
        description: "Más largo que ancho, con líneas suaves.",
      },
      {
        value: "square",
        label: "Cuadrado",
        description: "Mandíbula marcada y frente amplia.",
      },
      {
        value: "heart",
        label: "Corazón",
        description: "Frente más ancha y barbilla estrecha.",
      },
      {
        value: "unknown",
        label: "No estoy seguro",
        description: "Nos enfocaremos en tus otras preferencias.",
      },
    ],
  },
  {
    id: "frameShape",
    question: "¿Qué forma de armazón prefieres?",
    helper: "Piensa en la silueta que más te gusta cuando te ves al espejo.",
    options: [
      {
        value: "redondo",
        label: "Redondo",
        description: "Curvas suaves y carácter retro.",
      },
      {
        value: "cuadrado",
        label: "Cuadrado",
        description: "Ángulos definidos y presencia equilibrada.",
      },
      {
        value: "rectangular",
        label: "Rectangular",
        description: "Perfil estilizado y versátil.",
      },
      {
        value: "aviador",
        label: "Aviador",
        description: "Forma icónica con puente protagonista.",
      },
    ],
  },
  {
    id: "material",
    question: "¿Qué material prefieres?",
    helper: "El material cambia el peso, la textura y la presencia del armazón.",
    options: [
      {
        value: "acetate",
        label: "Acetato",
        description: "Color profundo, brillo suave y mayor presencia.",
      },
      {
        value: "metal",
        label: "Metal",
        description: "Líneas finas, sensación ligera y elegante.",
      },
      {
        value: "mixed",
        label: "Combinado",
        description: "Acetato y metal en un mismo armazón.",
      },
      {
        value: "any",
        label: "Sin preferencia",
        description: "Muéstrame la mejor opción sin limitar el material.",
      },
    ],
  },
  {
    id: "color",
    question: "¿Qué color usarías más?",
    helper: "Selecciona el tono que combinaría mejor con tu guardarropa.",
    options: [
      {
        value: "black",
        label: "Negro",
        description: "Definido, clásico y fácil de combinar.",
      },
      {
        value: "tortoise",
        label: "Carey",
        description: "Cálido, con profundidad y variaciones únicas.",
      },
      {
        value: "clear",
        label: "Transparente",
        description: "Luminoso, moderno y discreto.",
      },
      {
        value: "metallic",
        label: "Dorado o plateado",
        description: "Un acabado fino con brillo sutil.",
      },
      {
        value: "colorful",
        label: "Colorido",
        description: "Tonos expresivos para destacar.",
      },
    ],
  },
  {
    id: "priority",
    question: "¿Qué es lo más importante para ti?",
    helper: "Elige la sensación que quieres tener al usar tus lentes.",
    options: [
      {
        value: "light",
        label: "Ligero y discreto",
        description: "Que se sientan cómodos durante todo el día.",
      },
      {
        value: "elegant",
        label: "Elegante",
        description: "Un acabado refinado para cualquier ocasión.",
      },
      {
        value: "statement",
        label: "Con personalidad",
        description: "Quiero que mis lentes llamen la atención.",
      },
      {
        value: "everyday",
        label: "Para diario",
        description: "Versátiles, resistentes y fáciles de combinar.",
      },
    ],
  },
];

const questionIds = questions.map((question) => question.id);

const productVisuals: Partial<Record<QuestionId, Record<string, string>>> = {
  productType: {
    eyeglasses: "/products/olm/modelo-premium.webp",
    sunglasses: "/products/olm/sol-urbano.webp",
    both: "/images/style-quiz-editorial.png",
  },
  style: {
    classic: "/products/olm/modelo-clasico.webp",
    modern: "/products/olm/modelo-moderno.webp",
    bold: "/products/olm/modelo-premium.webp",
    minimal: "/products/olm/sol-clasico.webp",
  },
  frameShape: {
    redondo: "/products/olm/sol-premium.webp",
    cuadrado: "/products/olm/sol-urbano.webp",
    rectangular: "/products/olm/modelo-test-api.webp",
    aviador: "/products/olm/sol-clasico.webp",
  },
};

const faceShapePaths: Record<string, string> = {
  round: "M50 15C26 15 18 33 20 53c2 22 14 35 30 36 16-1 28-14 30-36 2-20-6-38-30-38Z",
  oval: "M50 10C28 10 20 29 22 53c2 25 14 38 28 38s26-13 28-38C80 29 72 10 50 10Z",
  square: "M27 15h46c8 0 12 5 12 13v37c0 16-15 25-35 25S15 81 15 65V28c0-8 4-13 12-13Z",
  heart: "M50 91C24 75 14 55 17 35c3-17 19-27 33-13 14-14 30-4 33 13 3 20-7 40-33 56Z",
  unknown: "M50 13c21 0 35 15 35 37S71 89 50 89 15 73 15 50 29 13 50 13Z",
};

const faceFeaturePaths: Record<string, string> = {
  round: "M34 47h8M58 47h8M43 67c4 3 10 3 14 0",
  oval: "M34 47h8M58 47h8M43 68c4 3 10 3 14 0",
  square: "M34 47h8M58 47h8M41 68c6 4 12 4 18 0",
  heart: "M34 47h8M58 47h8M43 67c4 3 10 3 14 0",
  unknown: "M44 39c1-7 13-8 15-1 2 6-8 8-8 14M51 67h.1",
};

const faceShapeMatches: Record<string, Product["shape"][]> = {
  round: ["cuadrado", "rectangular"],
  oval: ["redondo", "cuadrado", "rectangular", "aviador"],
  square: ["redondo", "aviador"],
  heart: ["redondo", "aviador"],
  unknown: [],
};

function QuizOptionVisual({
  questionId,
  value,
  label,
}: {
  questionId: QuestionId;
  value: string;
  label: string;
}) {
  const productImage = productVisuals[questionId]?.[value];

  if (productImage) {
    return (
      <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-[18px] bg-[#f6f3ef]">
        <Image
          src={productImage}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={value === "both" ? "object-cover" : "object-contain p-2"}
        />
      </div>
    );
  }

  if (questionId === "faceShape") {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-[18px] bg-[#f6f3ef]">
        <svg
          viewBox="0 0 100 100"
          className="h-24 w-24"
          aria-label={`Ilustración de rostro ${label.toLowerCase()}`}
          role="img"
        >
          <path
            d={faceShapePaths[value]}
            fill="#eadccf"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d={faceFeaturePaths[value]}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    );
  }

  if (questionId === "material") {
    const materialClasses: Record<string, string> = {
      acetate:
        "bg-[radial-gradient(circle_at_35%_30%,#d39a52_0_8%,transparent_9%),radial-gradient(circle_at_65%_65%,#5c321f_0_10%,transparent_11%),linear-gradient(135deg,#e5b46f,#6c3824)]",
      metal:
        "bg-[linear-gradient(120deg,#8f8f8f,#f5f5f5_45%,#9d8060_55%,#f1dfbd)]",
      mixed:
        "bg-[linear-gradient(90deg,#6c3824_0_50%,#d9c19b_50%_58%,#b7b7b7_58%)]",
      any: "bg-[conic-gradient(from_45deg,#6c3824,#e4c18b,#b8b8b8,#e8ded2,#6c3824)]",
    };

    return (
      <div className="flex h-28 w-full items-center justify-center rounded-[18px] bg-[#f6f3ef]">
        <div
          className={`h-16 w-32 rounded-full border border-black/10 shadow-[0_10px_24px_rgba(0,0,0,0.15)] ${materialClasses[value]}`}
          aria-hidden
        />
      </div>
    );
  }

  if (questionId === "color") {
    const colors: Record<string, string[]> = {
      black: ["#171514", "#3c3734"],
      tortoise: ["#5a2d1b", "#d19a45", "#1e1510"],
      clear: ["#f5eee7", "#d8d1ca"],
      metallic: ["#c6a15b", "#c7c7c7"],
      colorful: ["#7d2d44", "#879073", "#c8793f"],
    };

    return (
      <div className="flex h-28 w-full items-center justify-center gap-3 rounded-[18px] bg-[#f6f3ef]">
        {colors[value].map((color) => (
          <span
            key={color}
            className="h-14 w-14 rounded-full border border-black/10 shadow-sm"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  const priorityIcons: Record<string, ReactNode> = {
    light: (
      <>
        <path d="M18 51h64M27 51l6-20h21l6 20M60 51l7-20h16l5 20" />
        <path d="M48 18c7 4 11 10 12 18" />
      </>
    ),
    elegant: (
      <>
        <path d="M50 12l8 24 24 8-24 8-8 24-8-24-24-8 24-8 8-24Z" />
        <path d="M76 16l3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Z" />
      </>
    ),
    statement: (
      <>
        <path d="M18 26l18-8 12 26-18 8-12-26ZM52 44l12-26 18 8-12 26-18-8Z" />
        <path d="M39 57c6 7 16 7 22 0M50 50v30" />
      </>
    ),
    everyday: (
      <>
        <circle cx="50" cy="50" r="30" />
        <path d="M50 30v21l14 9M30 18l-8 8M70 18l8 8" />
      </>
    ),
  };

  return (
    <div className="flex h-28 w-full items-center justify-center rounded-[18px] bg-[#f6f3ef]">
      <svg
        viewBox="0 0 100 100"
        className="h-20 w-20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        aria-label={`Ilustración de ${label.toLowerCase()}`}
        role="img"
      >
        {priorityIcons[value]}
      </svg>
    </div>
  );
}

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

  if (answers.productType === "both") score += 1;
  else if (answers.productType === product.type) score += 7;
  else score -= 4;

  if (answers.frameShape === product.shape) score += 5;

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

  if (answers.material === "mixed") score += 1;

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

function getRecommendations(catalog: Product[], answers: QuizAnswers) {
  return catalog
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
  const frameShape = getOptionLabel("frameShape", answers.frameShape).toLowerCase();
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

function hasCompleteAnswers(answers: QuizAnswers) {
  return questionIds.every((questionId) => Boolean(answers[questionId]));
}

export default function StyleQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>(fallbackProducts);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const progress = showResults
    ? 100
    : ((currentStep + 1) / questions.length) * 100;

  const recommendations = useMemo(
    () => getRecommendations(catalog, answers),
    [answers, catalog]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQuizData() {
      const [productsResponse, quizResponse] = await Promise.allSettled([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/style-quiz", { cache: "no-store" }),
      ]);

      if (cancelled) return;

      if (
        productsResponse.status === "fulfilled" &&
        productsResponse.value.ok
      ) {
        const productData = (await productsResponse.value.json()) as {
          products?: Product[];
        };

        if (productData.products?.length) {
          setCatalog(productData.products);
        }
      }

      if (quizResponse.status === "fulfilled" && quizResponse.value.ok) {
        const quizData = (await quizResponse.value.json()) as {
          authenticated?: boolean;
          result?: { answers?: QuizAnswers } | null;
        };

        if (quizData.result?.answers && hasCompleteAnswers(quizData.result.answers)) {
          setAnswers(quizData.result.answers);
          setShowResults(true);
          setSaveState("saved");
        }
      }
    }

    void loadQuizData();

    return () => {
      cancelled = true;
    };
  }, []);

  function selectAnswer(value: string) {
    const completedAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };

    setAnswers(completedAnswers);
    setSaveState("idle");
    setResetError("");

    if (currentStep === questions.length - 1) {
      setShowResults(true);
      void saveQuizResult(completedAnswers);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setCurrentStep((step) => step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (showResults) {
      setShowResults(false);
      setCurrentStep(questions.length - 1);
      return;
    }

    setCurrentStep((step) => Math.max(0, step - 1));
  }

  async function saveQuizResult(completedAnswers: QuizAnswers) {
    setSaveState("saving");

    try {
      const selectedSlugs = getRecommendations(catalog, completedAnswers).map(
        (product) => product.slug
      );
      const response = await fetch("/api/style-quiz", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: completedAnswers,
          recommendationSlugs: selectedSlugs,
        }),
      });

      if (response.status === 401) {
        setSaveState("guest");
        return;
      }

      setSaveState(response.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  async function restartQuiz() {
    setIsResetting(true);
    setResetError("");

    try {
      const response = await fetch("/api/style-quiz", { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Quiz reset failed");
      }
    } catch {
      setResetError(
        "No pudimos borrar tu resultado guardado. Inténtalo de nuevo para reiniciar con seguridad."
      );
      setIsResetting(false);
      return;
    }

    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
    setSaveState("idle");
    setIsResetting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (showResults) {
    const catalogHref =
      answers.productType === "sunglasses" ? "/sunglasses" : "/eyeglasses";

    return (
      <main className="min-h-screen bg-white text-black">
        <section className="relative isolate min-h-[560px] overflow-hidden bg-[#f4eee7]">
          <Image
            src="/images/style-quiz-editorial.png"
            alt="Selección de armazones Óptica OLM de distintos estilos"
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f6efe7] via-[#f6efe7]/95 to-[#f6efe7]/10" />
          <div className="mx-auto flex min-h-[560px] max-w-7xl items-center px-6 py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/55">
                Tu estilo · Resultado
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
                Encontramos opciones para ti
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-black/70 md:text-lg">
                {getResultSummary(answers)}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#recomendaciones"
                  className="rounded-full border border-[var(--brand-espresso)] bg-[var(--brand-espresso)] px-7 py-3.5 font-medium text-white transition hover:bg-transparent hover:text-[var(--brand-espresso)]"
                >
                  Ver mis recomendaciones
                </a>
                <a
                  href={catalogHref}
                  className="rounded-full border border-[var(--brand-espresso)] bg-white/70 px-7 py-3.5 font-medium text-[var(--brand-espresso)] backdrop-blur transition hover:bg-[var(--brand-espresso)] hover:text-white"
                >
                  Ver todos los lentes
                </a>
                <button
                  type="button"
                  onClick={() => void restartQuiz()}
                  disabled={isResetting || saveState === "saving"}
                  className="rounded-full border border-black/20 bg-white/70 px-7 py-3.5 font-medium backdrop-blur transition hover:border-[var(--brand-espresso)] hover:bg-[var(--brand-espresso)] hover:text-white disabled:opacity-50"
                >
                  {isResetting ? "Reiniciando…" : "Reiniciar quiz"}
                </button>
              </div>

              <div className="mt-5 text-sm text-black/60" aria-live="polite">
                {saveState === "saving" && "Guardando tu resultado…"}
                {saveState === "saved" && "Resultado guardado en tu cuenta."}
                {saveState === "guest" && (
                  <>
                    <Link
                      href="/login?redirect_url=/tu-estilo"
                      className="font-semibold text-[var(--brand-espresso)] underline underline-offset-4"
                    >
                      Inicia sesión
                    </Link>{" "}
                    para guardar este resultado en tu cuenta.
                  </>
                )}
                {saveState === "error" &&
                  "Tus resultados se muestran aquí, pero no pudimos guardarlos en este momento."}
                {resetError}
              </div>
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
              <p className="mt-3 max-w-2xl text-gray-600">
                Modelos reales del catálogo, seleccionados con tus respuestas.
              </p>
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
    <main className="min-h-screen bg-[#f7f3ee] px-5 py-12 text-black sm:px-6 md:py-20">
      <section id="quiz" className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(55,36,27,0.08)]">
          <div className="relative h-44 overflow-hidden border-b border-black/10 md:h-56">
            <Image
              src="/images/style-quiz-editorial.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f6efe7]/95 via-[#f6efe7]/55 to-transparent" />
            <div className="absolute inset-0 flex items-center px-7 md:px-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/55">
                  Tu estilo
                </p>
                <p className="mt-2 max-w-sm text-2xl font-bold tracking-[-0.03em] md:text-3xl">
                  Una selección hecha para ti
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <span>
                Pregunta {currentStep + 1} de {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eee8e1]"
              role="progressbar"
              aria-label="Progreso del quiz"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="h-full rounded-full bg-[var(--brand-espresso)] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-10 text-center">
              <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-5xl">
                {currentQuestion.question}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                {currentQuestion.helper}
              </p>
            </div>

            <div
              className={`mx-auto mt-9 grid max-w-5xl gap-4 ${
                currentQuestion.options.length === 3
                  ? "sm:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-4"
              }`}
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
                    className={`group relative rounded-[22px] border p-3 text-left transition duration-200 ${
                      isSelected
                        ? "border-[var(--brand-espresso)] bg-[#f3e9df] shadow-[0_8px_24px_rgba(55,36,27,0.12)]"
                        : "border-black/10 bg-white hover:-translate-y-1 hover:border-[var(--brand-espresso)] hover:shadow-lg"
                    }`}
                  >
                    <QuizOptionVisual
                      questionId={currentQuestion.id}
                      value={option.value}
                      label={option.label}
                    />
                    <div className="px-2 pb-2 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold">{option.label}</span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                            isSelected
                              ? "border-[var(--brand-espresso)] bg-[var(--brand-espresso)] text-white"
                              : "border-black/25"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-black/60">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-black/10 pt-7">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0}
                className="rounded-full border border-[var(--brand-espresso)] px-6 py-3 font-medium text-[var(--brand-espresso)] transition hover:bg-[var(--brand-espresso)] hover:text-white disabled:cursor-not-allowed disabled:border-black/15 disabled:text-black/30"
              >
                Atrás
              </button>
              <p className="max-w-xs text-right text-sm text-black/50">
                Selecciona una opción para avanzar automáticamente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
