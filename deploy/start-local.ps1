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
  $existing = if (Test-Path -LiteralPath $pidPath) { Get-Process -Id (Get-Content -LiteralPath $pidPath) -ErrorAction SilentlyContinue } else { $null }
  if (!$existing) {
    $process = Start-Process -FilePath $nodePath -ArgumentList $service.File -WorkingDirectory (Join-Path $projectPath 'server') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectPath ('var\' + $service.Name + '.log')) -RedirectStandardError (Join-Path $projectPath ('var\' + $service.Name + '-error.log')) -PassThru
    $process.Id | Set-Content -LiteralPath $pidPath
  }
}
Write-Output 'JobFAIR: http://localhost:8081'
