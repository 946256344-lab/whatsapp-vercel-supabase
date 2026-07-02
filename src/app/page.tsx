import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel">
        <h1 className="title">WhatsApp 客户数据后台</h1>
        <p className="subtitle">
          云端 Webhook 接收器已经部署后，可进入后台查看客户消息和导出跟进表。
        </p>
        <p>
          <Link className="button" href="/admin">
            进入后台
          </Link>
        </p>
      </section>
    </main>
  );
}
