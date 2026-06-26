# GIT setup

Arquivos adicionados para ajudar a inicializar e publicar este repositório.

- `scripts/setup-repo.ps1`: script PowerShell para inicializar, commitar e criar o repo no GitHub (se `gh` estiver instalado).
- `.gitignore`: regras comuns para Node/Vite/IDE.

Exemplo de uso (PowerShell):

```powershell
.\scripts\setup-repo.ps1 -RepoName "NOME_DO_REPO" -GitHubUser "SEU_USUARIO" -Public
```

Se preferir comandos manuais:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

Se quiser que eu tente executar comandos aqui, instale/permita `git` e `gh` no ambiente onde este agente roda.
