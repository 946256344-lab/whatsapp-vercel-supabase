$ErrorActionPreference = "Stop"

function New-HexSecret($Prefix) {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return $Prefix + ([BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant())
}

$verifyToken = New-HexSecret "wa_verify_"
$adminToken = New-HexSecret "admin_"

Write-Host "WHATSAPP_VERIFY_TOKEN=$verifyToken"
Write-Host "ADMIN_TOKEN=$adminToken"
