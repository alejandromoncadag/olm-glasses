import { NextResponse } from "next/server";

import { pool } from "@/lib/db";
import {
  cleanText,
  invoiceStatuses,
  type InvoiceStatus,
} from "@/lib/invoiceRequests";
import {
  getAuthenticatedAdmin,
  unauthorizedAdminResponse,
} from "@/lib/requireAdmin";

export const runtime = "nodejs";

function cleanNullableText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function cleanDocumentUrl(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) return { value: null, valid: true };

  try {
    const url = new URL(cleaned);
    return {
      value: cleaned,
      valid: url.protocol === "https:" || url.protocol === "http:",
    };
  } catch {
    return { value: cleaned, valid: false };
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/invoice-requests/[requestNumber]">
) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) return unauthorizedAdminResponse();

  try {
    const { requestNumber } = await context.params;
    const body = await request.json();
    const status = cleanText(body.status) as InvoiceStatus;
    const adminNotes = cleanNullableText(body.adminNotes);
    const rejectionReason = cleanNullableText(body.rejectionReason);
    const xmlUrl = cleanDocumentUrl(body.xmlUrl);
    const pdfUrl = cleanDocumentUrl(body.pdfUrl);

    if (!invoiceStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Selecciona un estado de factura válido." },
        { status: 400 }
      );
    }

    if (
      (adminNotes && adminNotes.length > 2000) ||
      (rejectionReason && rejectionReason.length > 1000)
    ) {
      return NextResponse.json(
        { error: "Las notas o el motivo de rechazo son demasiado largos." },
        { status: 400 }
      );
    }

    if (!xmlUrl.valid || !pdfUrl.valid) {
      return NextResponse.json(
        { error: "Los enlaces XML y PDF deben comenzar con http:// o https://." },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { error: "Agrega el motivo antes de rechazar la solicitud." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE invoice_requests
        SET
          status = $2,
          admin_notes = $3,
          rejection_reason = $4,
          xml_url = $5,
          pdf_url = $6
        WHERE request_number = $1
        RETURNING
          request_number,
          status,
          admin_notes,
          rejection_reason,
          xml_url,
          pdf_url,
          updated_at
      `,
      [
        requestNumber,
        status,
        adminNotes,
        rejectionReason,
        xmlUrl.value,
        pdfUrl.value,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Solicitud de factura no encontrada." },
        { status: 404 }
      );
    }

    const updated = result.rows[0];

    return NextResponse.json({
      invoiceRequest: {
        requestNumber: updated.request_number,
        status: updated.status,
        adminNotes: updated.admin_notes || "",
        rejectionReason: updated.rejection_reason || "",
        xmlUrl: updated.xml_url || "",
        pdfUrl: updated.pdf_url || "",
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Invoice request update error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "No pudimos actualizar la solicitud de factura." },
      { status: 500 }
    );
  }
}
