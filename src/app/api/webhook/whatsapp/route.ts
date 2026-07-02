import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import {
  extractMessages,
  extractStatuses,
  inferFollowup,
  type WhatsAppWebhookPayload,
} from "@/lib/whatsapp";
import { optionalEnv, requiredEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === requiredEnv("WHATSAPP_VERIFY_TOKEN") && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as WhatsAppWebhookPayload;
  const supabase = createServiceClient();
  const receivedAt = new Date().toISOString();

  const eventRows = (payload.entry || []).flatMap((entry) =>
    (entry.changes || []).map((change) => ({
      event_type: "webhook_event",
      waba_id: entry.id || null,
      field: change.field || null,
      raw_payload: change,
      received_at: receivedAt,
    }))
  );

  if (eventRows.length > 0) {
    const { error } = await supabase.from("webhook_events").insert(eventRows);
    if (error) {
      console.error("webhook_events insert failed", error);
    }
  }

  const messages = extractMessages(payload);
  for (const message of messages) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert(
        {
          wa_id: message.waId,
          name: message.contactName || null,
          phone: message.waId,
          last_seen_at: receivedAt,
          updated_at: receivedAt,
        },
        { onConflict: "wa_id" }
      )
      .select("id")
      .single();

    if (contactError) {
      console.error("contact upsert failed", contactError);
      continue;
    }

    const { error: messageError } = await supabase.from("messages").upsert(
      {
        wa_message_id: message.waMessageId,
        contact_id: contact.id,
        wa_id: message.waId,
        direction: "inbound",
        type: message.type,
        text: message.text,
        raw_payload: message.raw,
        message_timestamp: message.messageTimestamp,
        received_at: receivedAt,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true }
    );

    if (messageError) {
      console.error("message upsert failed", messageError);
    }
  }

  const statuses = extractStatuses(payload);
  if (statuses.length > 0) {
    const { error } = await supabase.from("message_statuses").insert(
      statuses.map((status) => ({
        wa_message_id: status.waMessageId || null,
        recipient_id: status.recipientId || null,
        status: status.status || null,
        raw_payload: status.raw,
        status_timestamp: status.statusTimestamp,
        received_at: receivedAt,
      }))
    );
    if (error) {
      console.error("status insert failed", error);
    }
  }

  await refreshFollowupsForMessages(messages.map((message) => message.waId), receivedAt);

  return NextResponse.json({
    ok: true,
    received_at: receivedAt,
    messages: messages.length,
    statuses: statuses.length,
    app: optionalEnv("VERCEL_PROJECT_PRODUCTION_URL", "local"),
  });
}

async function refreshFollowupsForMessages(waIds: string[], receivedAt: string) {
  const uniqueWaIds = Array.from(new Set(waIds.filter(Boolean)));
  if (uniqueWaIds.length === 0) return;

  const supabase = createServiceClient();
  const reportDate = receivedAt.slice(0, 10);

  for (const waId of uniqueWaIds) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id")
      .eq("wa_id", waId)
      .single();

    if (contactError || !contact) {
      console.error("followup contact lookup failed", contactError);
      continue;
    }

    const dayStart = `${reportDate}T00:00:00.000Z`;
    const dayEnd = `${reportDate}T23:59:59.999Z`;
    const { data: dayMessages, error: messageError } = await supabase
      .from("messages")
      .select("text")
      .eq("wa_id", waId)
      .gte("received_at", dayStart)
      .lte("received_at", dayEnd)
      .order("received_at", { ascending: true });

    if (messageError) {
      console.error("followup message lookup failed", messageError);
      continue;
    }

    const followup = inferFollowup((dayMessages || []).map((message) => message.text || ""));
    const { error: followupError } = await supabase.from("customer_followups").upsert(
      {
        contact_id: contact.id,
        report_date: reportDate,
        need_summary: followup.needSummary,
        product: followup.product,
        quantity: followup.quantity,
        intent: followup.intent,
        status: followup.status,
        next_action: followup.nextAction,
        updated_at: receivedAt,
      },
      { onConflict: "contact_id,report_date" }
    );

    if (followupError) {
      console.error("followup upsert failed", followupError);
    }
  }
}
