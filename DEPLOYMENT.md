# Deployment Guide - SmartBi

Este guia explica como fazer o deploy do sistema SmartBi na nuvem para que o cliente possa acessar via navegador sem precisar instalar nada.

## Arquitetura de Deployment

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express + tRPC)
- **Banco de Dados**: PlanetScale ou Supabase (MySQL)

## Pré-requisitos

1. Conta no Vercel (vercel.com)
2. Conta no Railway (railway.app)
3. Conta no PlanetScale (planetscale.com) ou Supabase (supabase.com)
4. Repositório no GitHub

## Passo 1: Configurar Banco de Dados

### Opção A: PlanetScale (Recomendado)

1. Crie uma conta em https://planetscale.com
2. Crie um novo banco de dados
3. Crie uma senha de acesso
4. Copie a connection string (DATABASE_URL)

### Opção B: Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Vá em Settings > Database
4. Copie a connection string

## Passo 2: Configurar Backend no Railway

1. Faça push do código para o GitHub
2. Acesse https://railway.app
3. Clique em "New Project" > "Deploy from GitHub repo"
4. Selecione o repositório do SmartBi
5. Configure as variáveis de ambiente:
   - `DATABASE_URL`: Connection string do banco de dados
   - `NODE_ENV`: `production`
   - `OAUTH_SERVER_URL`: (opcional, se usar autenticação)
   - `OWNER_OPEN_ID`: (opcional, se usar autenticação)
6. Clique em "Deploy"

## Passo 3: Configurar Frontend no Vercel

1. Acesse https://vercel.com
2. Clique em "New Project" > "Import Git Repository"
3. Selecione o repositório do SmartBi
4. Configure as variáveis de ambiente:
   - `VITE_API_URL`: URL do backend Railway (ex: https://seu-backend.railway.app)
5. Clique em "Deploy"

## Passo 4: Atualizar Frontend para Usar Backend em Nuvem

No arquivo `client/src/lib/trpc.ts`, atualize a URL do backend:

```typescript
export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    }),
  ],
});
```

## Passo 5: Testar

1. Acesse a URL do Vercel
2. Verifique se o sistema está funcionando
3. Teste as funcionalidades de CRUD
4. Teste a importação de CSV

## Variáveis de Ambiente Necessárias

### Backend (Railway)
- `DATABASE_URL`: Connection string do MySQL
- `NODE_ENV`: `production`
- `OAUTH_SERVER_URL`: (opcional)
- `OWNER_OPEN_ID`: (opcional)

### Frontend (Vercel)
- `VITE_API_URL`: URL do backend Railway

## Manutenção

- Para atualizar o sistema, faça push das mudanças para o GitHub
- Railway e Vercel farão deploy automático
- Backup do banco de dados é gerenciado pelo PlanetScale/Supabase

## Suporte ao Cliente

Forneça ao cliente:
1. URL do sistema (Vercel)
2. Instruções de login (se tiver autenticação)
3. Documentação de uso
4. Seu contato para suporte

## Custos Estimados

- Vercel: Plano gratuito (suficiente para uso moderado)
- Railway: ~$5-20/mês dependendo do uso
- PlanetScale: Plano gratuito (até 5GB) ou ~$29/mês (pro)
- Supabase: Plano gratuito (até 500MB) ou ~$25/mês (pro)

Total estimado: $0-50/mês
