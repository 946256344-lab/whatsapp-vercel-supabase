$ErrorActionPreference = "Stop"

$BaseUrl = if ($args.Count -gt 0) { $args[0].TrimEnd("/") } else { "http://localhost:3000" }
$PayloadPath = Join-Path (Split-Path -Parent $PSScriptRoot) "supabase\mock-whatsapp-message.json"

Invoke-RestMethod `
  -Uri "$BaseUrl/api/webhook/whatsapp" `
  -Method Post `
  -ContentType "application/json" `
  -Body (Get-Content -Raw $PayloadPath) |
  ConvertTo-Json -Depth 10
