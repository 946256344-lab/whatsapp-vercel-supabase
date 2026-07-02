# 部署执行清单

已经完成：

- Supabase 项目已发现：`fjbxwbieccikiqhhzlry`
- Supabase 表结构已创建成功
- 云端版项目代码已生成

还需要在后台完成一次：

## 1. Supabase 获取密钥

Supabase 后台进入：

```text
Project Settings -> API
```

复制：

```text
Project URL
anon public key
service_role key
```

注意：`service_role key` 只能放 Vercel 环境变量，不能公开。

## 2. Vercel 新建项目

项目目录：

```text
D:\codex\whatsapp-vercel-supabase
```

项目名建议：

```text
whatsapp-krlpower
```

Framework Preset:

```text
Next.js
```

## 3. Vercel 环境变量

填入：

```text
WHATSAPP_VERIFY_TOKEN=一串长随机口令
ADMIN_TOKEN=后台访问口令
SUPABASE_URL=Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key
NEXT_PUBLIC_SUPABASE_URL=Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabase anon public key
```

## 4. Vercel 域名

添加域名：

```text
whatsapp.krlpower.com
```

然后按 Vercel 提示去 Cloudflare DNS 添加记录。

## 5. Meta WABA Webhooks

Callback URL:

```text
https://whatsapp.krlpower.com/api/webhook/whatsapp
```

Verify token:

```text
和 WHATSAPP_VERIFY_TOKEN 完全相同
```

订阅字段：

```text
messages
```

## 6. 后台地址

```text
https://whatsapp.krlpower.com/admin?token=你的_ADMIN_TOKEN
```
