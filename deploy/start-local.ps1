$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$pgBinPath = 'C:\Program Files\PostgreSQL\18\bin'
$dataPath = Join-Path $projectPath 'var\postgres'
if (!(Test-Path -LiteralPath (Join-Path $dataPath 'PG_VERSION'))) { throw 'Local database missing.' }
& (Join-Path $pgBinPath 'pg_ctl.exe') status -D $dataPath *> $null
if ($LASTEXITCODE -ne 0) {
  Start-Process -FilePath (Join-Path $pgBinPath 'postgres.exe') -ArgumentList @('-D', ('"' + $dataPath + '"'), '-p', '55439', '-h', '127.0.0.1') -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectPath 'var\postgres-output.log') -RedirectStandardError (Join-Path $projectPath 'var\postgres-error.log')
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    & (Join-Path $pgBinPath 'pg_isready.exe') -h 127.0.0.1 -p 55439 *> $null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Milliseconds 500
  }
  if ($LASTEXITCODE -ne 0) { throw 'Database did not start.' }
}
$nodePath = (Get-Command node.exe).Source
foreach ($service in @(@{Name='api'; File='src/server.mjs'}, @{Name='worker'; File='src/worker.mjs'})) {
  $pidPath = Join-Path $projectPath ('var\' + $service.Name + '.pid')
  $existing = $null
  if (Test-Path -LiteralPath $pidPath) {
    $pidFile = Get-Item -LiteralPath $pidPath
    $servicePid = 0
    if ([int]::TryParse((Get-Content -LiteralPath $pidPath -Raw).Trim(), [ref]$servicePid) -and $servicePid -gt 0) {
      $candidate = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
      if ($candidate -and $candidate.ProcessName -eq 'node' -and $candidate.StartTime.ToUniversalTime() -le $pidFile.LastWriteTimeUtc) {
        $existing = $candidate
      }
    }
  }
  if (!$existing) {
    $process = Start-Process -FilePath $nodePath -ArgumentList $service.File -WorkingDirectory (Join-Path $projectPath 'server') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectPath ('var\' + $service.Name + '.log')) -RedirectStandardError (Join-Path $projectPath ('var\' + $service.Name + '-error.log')) -PassThru
    $process.Id | Set-Content -LiteralPath $pidPath
  }
}
for ($attempt = 0; $attempt -lt 15; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8081/api/v1/health' -TimeoutSec 2
    if ($health.status -eq 'ok') { break }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}
if ($health.status -ne 'ok') { throw 'JobFAIR did not start. Check var\api-error.log.' }
Write-Output 'JobFAIR: http://localhost:8081'
