import Link from "next/link";
import { isAdminTokenValid } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase-server";

type AdminPageProps = {
  searchParams: Promise<{ token?: string; date?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const token = params.token || "";
  const date = params.date || new Date().toISOString().slice(0, 10);

  if (!isAdminTokenValid(token)) {
    return (
      <main className="shell">
        <section className="panel">
          <h1 className="title">需要后台口令</h1>
          <p className="subtitle">请用 Vercel 环境变量 ADMIN_TOKEN 配置后台口令，然后访问：</p>
          <pre>/admin?token=你的口令</pre>
        </section>
      </main>
    );
  }

  const supabase = createServiceClient();
  const [
    { count: messageCount },
    { count: contactCount },
    { count: followupCount },
    { data: followups },
    { data: recentMessages },
  ] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase
      .from("customer_followups")
      .select("*", { count: "exact", head: true })
      .eq("report_date", date),
    supabase
      .from("customer_followups")
      .select("*, contacts(name, wa_id)")
      .eq("report_date", date)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("messages")
      .select("*, contacts(name)")
      .order("received_at", { ascending: false })
      .limit(20),
  ]);

  const exportHref = `/api/export/customer-followups?date=${encodeURIComponent(date)}&token=${encodeURIComponent(token)}`;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1 className="title">WhatsApp 客户数据后台</h1>
          <p className="subtitle">Webhook、客户消息、客户级跟进表和 CSV 导出。</p>
        </div>
        <Link className="button" href={exportHref}>
          导出客户跟进 CSV
        </Link>
      </header>

      <section className="metrics">
        <div className="metric">
          <div className="metric-label">总消息数</div>
          <div className="metric-value">{messageCount || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-label">客户数</div>
          <div className="metric-value">{contactCount || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-label">当天跟进项</div>
          <div className="metric-value">{followupCount || 0}</div>
        </div>
        <div className="metric">
          <div className="metric-label">报表日期</div>
          <div className="metric-value">{date}</div>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>客户跟进表</h2>
          <form action="/admin">
            <input type="hidden" name="token" value={token} />
            <input name="date" defaultValue={date} />
            <button className="button secondary" type="submit">
              切换日期
            </button>
          </form>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>客户</th>
                <th>WhatsApp ID</th>
                <th>需求摘要</th>
                <th>产品/服务</th>
                <th>数量</th>
                <th>意图</th>
                <th>状态</th>
                <th>下一步</th>
              </tr>
            </thead>
            <tbody>
              {(followups || []).map((row) => {
                const contact = row.contacts as { name?: string | null; wa_id?: string | null } | null;
                return (
                  <tr key={row.id}>
                    <td>{contact?.name || "未命名客户"}</td>
                    <td>{contact?.wa_id || ""}</td>
                    <td>{row.need_summary || ""}</td>
                    <td>{row.product || ""}</td>
                    <td>{row.quantity || ""}</td>
                    <td>
                      <span className="tag">{row.intent || "待判断"}</span>
                    </td>
                    <td>{row.status || ""}</td>
                    <td>{row.next_action || ""}</td>
                  </tr>
                );
              })}
              {(!followups || followups.length === 0) && (
                <tr>
                  <td colSpan={8} className="muted">
                    这个日期还没有客户跟进记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>最近消息</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>客户</th>
                <th>WhatsApp ID</th>
                <th>类型</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {(recentMessages || []).map((message) => {
                const contact = message.contacts as { name?: string | null } | null;
                return (
                  <tr key={message.id}>
                    <td>{new Date(message.received_at).toLocaleString("zh-CN")}</td>
                    <td>{contact?.name || "未命名客户"}</td>
                    <td>{message.wa_id}</td>
                    <td>{message.type}</td>
                    <td>{message.text}</td>
                  </tr>
                );
              })}
              {(!recentMessages || recentMessages.length === 0) && (
                <tr>
                  <td colSpan={5} className="muted">
                    还没有收到消息。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
