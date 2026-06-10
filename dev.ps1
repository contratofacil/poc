# EasyLaw -- Script de demarrage local
# Usage : .\dev.ps1
# Ouvre deux terminaux : auth-service (port 3001) + frontend Next.js (port 3000)

$Root = $PSScriptRoot

function Info { param($m) Write-Host "  $m" -ForegroundColor Cyan }
function Ok   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "  [!]  $m" -ForegroundColor Yellow }
function Err  { param($m) Write-Host "  [x]  $m" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  EasyLaw -- Demarrage local" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor Cyan
Write-Host ""

# -- Verification Node.js --------------------------------------------------
try {
    $nodeVer = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "not found" }
    Ok "Node.js $nodeVer detecte"
} catch {
    Err "Node.js introuvable. Installez Node.js >= 24 depuis https://nodejs.org"
    exit 1
}

# -- Verification .env ------------------------------------------------------
Write-Host ""
Info "Verification des fichiers d'environnement..."

$envChecks = @(
    @{ Dir = "$Root\apps\frontend"; File = ".env.local"; Example = "apps/frontend/.env.example"; Label = "Frontend" },
    @{ Dir = "$Root\services\auth"; File = ".env";       Example = "services/auth/.env.example"; Label = "Auth service" }
)

$missingEnv = $false
foreach ($c in $envChecks) {
    $envPath = Join-Path $c.Dir $c.File
    if (Test-Path $envPath) {
        Ok "$($c.Label) : $($c.File) trouve"
    } else {
        Warn "$($c.Label) : $($c.File) manquant"
        Warn "  -> Copiez $($c.Example) vers $($c.Dir)\$($c.File) et remplissez les valeurs"
        $missingEnv = $true
    }
}

if ($missingEnv) {
    Write-Host ""
    $resp = Read-Host "  Des .env sont manquants. Continuer quand meme ? (o/N)"
    if ($resp -notmatch "^[oO]$") {
        Info "Abandon. Configurez les .env et relancez .\dev.ps1"
        exit 1
    }
}

# -- Installation dependances -----------------------------------------------
Write-Host ""
Info "Verification des dependances npm..."

$packages = @(
    @{ Dir = $Root;                  Label = "Workspace racine" },
    @{ Dir = "$Root\apps\frontend";  Label = "Frontend" },
    @{ Dir = "$Root\services\auth";  Label = "Auth service" }
)

foreach ($p in $packages) {
    $nm = Join-Path $p.Dir "node_modules"
    if (!(Test-Path $nm)) {
        Warn "$($p.Label) : node_modules absent -- installation..."
        Push-Location $p.Dir
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            Err "Echec npm install dans $($p.Dir)"
            Pop-Location
            exit 1
        }
        Pop-Location
        Ok "$($p.Label) : installe"
    } else {
        Ok "$($p.Label) : node_modules present"
    }
}

# -- Demarrage des services -------------------------------------------------
Write-Host ""
Info "Demarrage des services..."

function Start-AppWindow {
    param(
        [string]$Title,
        [string]$WorkDir,
        [string]$Command
    )
    # title + cd + commande dans une seule instruction cmd
    $cmdLine = "title $Title && cd /d `"$WorkDir`" && $Command"
    Start-Process "cmd.exe" -ArgumentList "/k", $cmdLine -WindowStyle Normal
}

Start-AppWindow -Title "Auth (3001)"    -WorkDir "$Root\services\auth"  -Command "npm start"
Start-Sleep -Milliseconds 800
Start-AppWindow -Title "Frontend (3000)" -WorkDir "$Root\apps\frontend" -Command "npm run dev"

Write-Host ""
Write-Host "  Services demarres :" -ForegroundColor Green
Write-Host "    Frontend  ->  http://localhost:3000" -ForegroundColor Green
Write-Host "    Auth API  ->  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "  Fermez les onglets/fenetres pour tout arreter." -ForegroundColor Gray
Write-Host ""
