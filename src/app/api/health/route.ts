import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    messages: count || 0,
    at: new Date().toISOString(),
  });
}
