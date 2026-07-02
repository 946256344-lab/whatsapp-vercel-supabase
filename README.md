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

正式 Callback URL 建议：

```text
https://whatsapp.krlpower.com/api/webhook/whatsapp
```

## 1. Supabase 建表

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

## 2. Vercel 环境变量

复制 `.env.example`，在 Vercel Project Settings -> Environment Variables 填：

```text
WHATSAPP_VERIFY_TOKEN=自己生成的一串长随机口令
ADMIN_TOKEN=后台访问口令

SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key

NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabase anon key
```

可用下面命令生成两个随机口令：

```powershell
.\scripts\generate-secrets.ps1
```

注意：`SUPABASE_SERVICE_ROLE_KEY` 只能放服务端环境变量，不要放到前端页面、截图或公开仓库。

## 3. Vercel 域名

在 Vercel 项目里添加域名：

```text
whatsapp.krlpower.com
```

然后根据 Vercel 提示，在 Cloudflare DNS 里添加对应记录。

## 4. Meta Webhooks

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

## 5. 后台

访问：

```text
https://whatsapp.krlpower.com/admin?token=你的_ADMIN_TOKEN
```

后台可以查看：

- 总消息数
- 客户数
- 当天客户跟进表
- 最近消息
- CSV 导出

## 6. 本地开发

安装依赖：

```powershell
pnpm install
```

启动：

```powershell
pnpm dev
```

本地 webhook：

```text
http://localhost:3000/api/webhook/whatsapp
```

本地后台：

```text
http://localhost:3000/admin?token=你的_ADMIN_TOKEN
```

## 7. 测试 Webhook 验证

```powershell
$token="你的_WHATSAPP_VERIFY_TOKEN"
Invoke-WebRequest "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=$token&hub.challenge=hello"
```

应该返回：

```text
hello
```
