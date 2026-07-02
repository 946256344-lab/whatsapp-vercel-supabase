# WhatsApp Vercel Supabase

云端版 WhatsApp 客户数据整理系统。

## 架构

```text
WhatsApp 客户消息
  -> Meta WABA Webhook
  -> Vercel /api/webhook/whatsapp
  -> Supabase Postgres
  -> /admin 后台
  -> CSV 导出
```

正式 Callback URL：

```text
https://whatsapp.krlpower.com/api/webhook/whatsapp
```

## Supabase

在 Supabase 项目里打开 SQL Editor，执行：

```text
supabase/schema.sql
```

这会创建：

- `contacts`
- `messages`
- `message_statuses`
- `webhook_events`
- `customer_followups`

数据库启用 RLS。Vercel 服务端用 Supabase anon/publishable key 加 `APP_DB_SECRET` 请求头访问，普通公开请求不能直接读写表。

## Vercel 环境变量

```text
WHATSAPP_VERIFY_TOKEN=长随机口令
ADMIN_TOKEN=后台访问口令

SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVER_KEY=Supabase anon 或 publishable key
APP_DB_SECRET=长随机服务端密钥

NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
```

可用下面命令生成随机口令：

```powershell
.\scripts\generate-secrets.ps1
```

## Meta Webhooks

在 Meta WABA Webhooks 填：

```text
Callback URL:
https://whatsapp.krlpower.com/api/webhook/whatsapp

Verify token:
与 WHATSAPP_VERIFY_TOKEN 相同
```

保存后订阅：

```text
messages
```

## 后台

```text
https://whatsapp.krlpower.com/admin?token=你的_ADMIN_TOKEN
```

后台可以查看客户消息、每日客户跟进表，并导出 CSV。
