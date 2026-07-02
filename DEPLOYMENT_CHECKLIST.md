# 部署执行清单

已完成：

- GitHub 仓库：`946256344-lab/whatsapp-vercel-supabase`
- Supabase 项目：`fjbxwbieccikiqhhzlry`
- Vercel 项目：`zayns-projects-a4968f9b/whatsapp-vercel-supabase`
- Vercel 已连接 GitHub 仓库

## Vercel 环境变量

生产环境需要：

```text
WHATSAPP_VERIFY_TOKEN=Meta webhook 验证口令
ADMIN_TOKEN=后台访问口令
SUPABASE_URL=Supabase Project URL
SUPABASE_SERVER_KEY=Supabase anon 或 publishable key
APP_DB_SECRET=服务端数据库访问密钥
NEXT_PUBLIC_SUPABASE_URL=Supabase Project URL
```

说明：项目默认不需要 `service_role key`。数据库 RLS 会检查 Vercel 服务端请求头里的 `APP_DB_SECRET`，普通公开请求不能直接读写表。

## Meta WABA Webhooks

Callback URL:

```text
https://whatsapp.krlpower.com/api/webhook/whatsapp
```

Verify token:

```text
与 WHATSAPP_VERIFY_TOKEN 完全相同
```

订阅字段：

```text
messages
```

## 后台地址

```text
https://whatsapp.krlpower.com/admin?token=你的_ADMIN_TOKEN
```
