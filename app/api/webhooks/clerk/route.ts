import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import {
  customerIdentityFromWebhookUser,
  markCustomerIdentityDeleted,
  upsertCustomerIdentity,
} from "@/lib/customerAccounts";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim()) {
    return NextResponse.json(
      { error: "Clerk webhook is not configured" },
      { status: 503 }
    );
  }

  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created" || event.type === "user.updated") {
      const identity = customerIdentityFromWebhookUser(event.data);

      if (identity) {
        await upsertCustomerIdentity(identity);
      }
    }

    if (event.type === "user.deleted" && event.data.id) {
      await markCustomerIdentityDeleted(event.data.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Clerk webhook error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "Invalid Clerk webhook" },
      { status: 400 }
    );
  }
}
