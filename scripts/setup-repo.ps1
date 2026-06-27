# Parâmetros do script: nome do repositório, usuário do GitHub e visibilidade (público ou privado)
param(
    [string]$RepoName,
    [string]$GitHubUser,
    [switch]$Public
)

/**
 * Check-Command verifica se um comando está disponível no sistema
 * Retorna true se o comando existe, false caso contrário
 */
function Check-Command($name){
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

# Verifica se Git está instalado
if (-not (Check-Command git)){
    Write-Error "Git não encontrado. Instale Git em https://git-scm.com/ e tente novamente."
    exit 1
}

# Verifica se o nome do repositório foi fornecido
if (-not $RepoName){
    Write-Host "Uso: .\scripts\setup-repo.ps1 -RepoName 'NOME_DO_REPO' -GitHubUser 'SEU_USUARIO' -Public"
    exit 1
}

# Inicializa repositório Git local
Write-Host "Inicializando repositório git..."
git init
git add .
git commit -m "Initial commit"

# Verifica se GitHub CLI (gh) está instalado
if (Check-Command gh) {
    # Define visibilidade do repositório baseado no parâmetro
    $visibility = if ($Public) { '--public' } else { '--private' }
    
    # Cria repositório no GitHub usando gh e faz push
    Write-Host "Criando repositório no GitHub com 'gh' e empurrando..."
    gh repo create "$GitHubUser/$RepoName" $visibility --source=. --remote=origin --push
} else {
    # Instruções manuais caso gh não esteja instalado
    Write-Host "'gh' (GitHub CLI) não encontrado. Para prosseguir manualmente:
1) Crie o repositório no GitHub (ou copie a URL do remoto).
2) Execute:
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/$RepoName.git
   git push -u origin main"
}
