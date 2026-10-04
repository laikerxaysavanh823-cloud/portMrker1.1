# Builds the single-page versions of the app (no Node.js needed — uses web\tools\esbuild.exe):
#   web\portmrker.html     page content for claude.ai (published with the Artifact tool)
#   web\site\index.html    complete website for any static host (GitHub Pages, Netlify, ...)
# Usage (from the project folder):  powershell -ExecutionPolicy Bypass -File web\build-web.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$enc = New-Object System.Text.UTF8Encoding($false)
$esbuild = Join-Path $PSScriptRoot 'tools\esbuild.exe'
if (-not (Test-Path $esbuild)) { throw "esbuild not found at $esbuild" }

# 1. Compile + bundle the TypeScript/React sources. Libraries come from CDN globals (see template).
$outJs = Join-Path $env:TEMP 'portmrker-app.js'
$externals = @('react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'lucide-react', 'recharts') | ForEach-Object { "--external:$_" }
& $esbuild (Join-Path $root 'src\main.tsx') --bundle --format=iife --platform=browser --target=es2018 `
  --jsx=automatic --minify --charset=utf8 --loader:.css=empty --log-level=warning `
  --define:__STATIC_SITE__=true `
  @externals "--outfile=$outJs"
if ($LASTEXITCODE -ne 0) { throw 'esbuild failed' }

# Never let the bundle close its own <script> tag
$appJs = [IO.File]::ReadAllText($outJs, $enc) -replace '</(script)', '<\/$1'
Remove-Item $outJs

# 2. App CSS (index.css without the Vite-only @import; Tailwind runs in the page)
$css = [IO.File]::ReadAllText((Join-Path $root 'src\index.css'), $enc) -replace '@import "tailwindcss";', ''

$template = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'template.html'), $enc)
$page = $template.Replace('/*__APP_CSS__*/', $css).Replace('/*__APP_JS__*/', $appJs)

# 3a. claude.ai page (the platform adds <!doctype>, <head> and <body>)
$artifact = Join-Path $PSScriptRoot 'portmrker.html'
[IO.File]::WriteAllText($artifact, $page, $enc)

# 3b. Standalone website
$siteDir = New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot 'site')
$head = @'
<!doctype html>
<html lang="lo">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#020617">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="portMrker">
<meta name="description" content="Budget in Lao Kip with USD stocks, ETFs, Bitcoin and gold, savings goals and budget alerts.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23f59e0b'/%3E%3Cstop offset='1' stop-color='%23059669'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Ctext x='32' y='43' font-size='30' font-family='Arial' font-weight='bold' text-anchor='middle' fill='%23020617'%3E%E2%82%AD%3C/text%3E%3C/svg%3E">
<style>html,body{margin:0}:root{padding-top:env(safe-area-inset-top,0px)}</style>
</head>
<body>
'@
$site = Join-Path $siteDir 'index.html'
[IO.File]::WriteAllText($site, $head + $page + "`n</body>`n</html>`n", $enc)

"Built $artifact ($([Math]::Round((Get-Item $artifact).Length / 1KB)) KB)"
"Built $site"
