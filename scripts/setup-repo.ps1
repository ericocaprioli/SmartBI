param(
    [string]$RepoName,
    [string]$GitHubUser,
    [switch]$Public
)

function Check-Command($name){
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

if (-not (Check-Command git)){
    Write-Error "Git não encontrado. Instale Git em https://git-scm.com/ e tente novamente."
    exit 1
}

if (-not $RepoName){
    Write-Host "Uso: .\scripts\setup-repo.ps1 -RepoName 'NOME_DO_REPO' -GitHubUser 'SEU_USUARIO' -Public"
    exit 1
}

Write-Host "Inicializando repositório git..."
git init
git add .
git commit -m "Initial commit"

if (Check-Command gh) {
    $visibility = if ($Public) { '--public' } else { '--private' }
    Write-Host "Criando repositório no GitHub com 'gh' e empurrando..."
    gh repo create "$GitHubUser/$RepoName" $visibility --source=. --remote=origin --push
} else {
    Write-Host "'gh' (GitHub CLI) não encontrado. Para prosseguir manualmente:
1) Crie o repositório no GitHub (ou copie a URL do remoto).
2) Execute:
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/$RepoName.git
   git push -u origin main"
}
