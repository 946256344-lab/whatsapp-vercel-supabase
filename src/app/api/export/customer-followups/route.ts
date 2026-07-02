import { NextRequest, NextResponse } from "next/server";
import { isAdminTokenValid } from "@/lib/admin";
import { toCsv } from "@/lib/csv";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  if (!isAdminTokenValid(token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_followups")
    .select("*, contacts(name, wa_id)")
    .eq("report_date", date)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows: unknown[][] = [
    [
      "date",
      "contact_name",
      "whatsapp_id",
      "need_summary",
      "product",
      "quantity",
      "intent",
      "status",
      "next_action",
      "updated_at",
    ],
  ];

  for (const row of data || []) {
    const contact = row.contacts as { name?: string | null; wa_id?: string | null } | null;
    rows.push([
      row.report_date,
      contact?.name || "",
      contact?.wa_id || "",
      row.need_summary || "",
      row.product || "",
      row.quantity || "",
      row.intent || "",
      row.status || "",
      row.next_action || "",
      row.updated_at || "",
    ]);
  }

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="customer-followups-${date}.csv"`,
    },
  });
}
