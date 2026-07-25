import { NextResponse } from "next/server";

import { getOptionalAuthenticatedCustomer } from "@/lib/customerAccounts";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

const allowedAnswers = {
  productType: ["eyeglasses", "sunglasses", "both"],
  style: ["classic", "modern", "bold", "minimal"],
  faceShape: ["round", "oval", "square", "heart", "unknown"],
  frameShape: ["redondo", "cuadrado", "rectangular", "aviador"],
  material: ["acetate", "metal", "mixed", "any"],
  color: ["black", "tortoise", "clear", "metallic", "colorful"],
  priority: ["light", "elegant", "statement", "everyday"],
} as const;

type QuestionId = keyof typeof allowedAnswers;
type QuizAnswers = Record<QuestionId, string>;

function parseQuizAnswers(value: unknown): QuizAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const parsed = {} as QuizAnswers;

  for (const questionId of Object.keys(allowedAnswers) as QuestionId[]) {
    const answer = input[questionId];

    if (
      typeof answer !== "string" ||
      !allowedAnswers[questionId].includes(answer as never)
    ) {
      return null;
    }

    parsed[questionId] = answer;
  }

  return parsed;
}

function parseRecommendationSlugs(value: unknown) {
  if (!Array.isArray(value)) return null;

  const slugs = value
    .filter((slug): slug is string => typeof slug === "string")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 3);

  return slugs.length === value.length ? slugs : null;
}

export async function GET() {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) {
      return NextResponse.json({ authenticated: false, result: null });
    }

    const result = await pool.query(
      `
        SELECT answers, recommendation_slugs, completed_at
        FROM customer_style_quiz_results
        WHERE customer_id = $1
        LIMIT 1
      `,
      [customer.customerId]
    );

    const savedResult = result.rows[0];

    return NextResponse.json({
      authenticated: true,
      result: savedResult
        ? {
            answers: savedResult.answers,
            recommendationSlugs: savedResult.recommendation_slugs,
            completedAt: savedResult.completed_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Error loading style quiz result:", error);
    return NextResponse.json(
      { error: "No se pudo cargar tu resultado de estilo." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) {
      return NextResponse.json(
        { error: "Inicia sesión para guardar tu resultado." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      answers?: unknown;
      recommendationSlugs?: unknown;
    };
    const answers = parseQuizAnswers(body.answers);
    const recommendationSlugs = parseRecommendationSlugs(
      body.recommendationSlugs
    );

    if (!answers || !recommendationSlugs) {
      return NextResponse.json(
        { error: "Las respuestas del quiz no son válidas." },
        { status: 400 }
      );
    }

    await pool.query(
      `
        INSERT INTO customer_style_quiz_results (
          customer_id,
          answers,
          recommendation_slugs,
          completed_at
        )
        VALUES ($1, $2::jsonb, $3::text[], NOW())
        ON CONFLICT (customer_id) DO UPDATE
        SET
          answers = EXCLUDED.answers,
          recommendation_slugs = EXCLUDED.recommendation_slugs,
          completed_at = NOW()
      `,
      [customer.customerId, JSON.stringify(answers), recommendationSlugs]
    );

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error saving style quiz result:", error);
    return NextResponse.json(
      { error: "No se pudo guardar tu resultado de estilo." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const customer = await getOptionalAuthenticatedCustomer();

    if (!customer) {
      return NextResponse.json({ deleted: false, authenticated: false });
    }

    await pool.query(
      `DELETE FROM customer_style_quiz_results WHERE customer_id = $1`,
      [customer.customerId]
    );

    return NextResponse.json({ deleted: true, authenticated: true });
  } catch (error) {
    console.error("Error deleting style quiz result:", error);
    return NextResponse.json(
      { error: "No se pudo reiniciar tu resultado de estilo." },
      { status: 500 }
    );
  }
}
