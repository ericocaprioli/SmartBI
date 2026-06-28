# Deployment Guide - SmartBi

Este guia explica como fazer o deploy do sistema SmartBi na nuvem para que o cliente possa acessar via navegador sem precisar instalar nada.

## Arquitetura de Deployment

- **Aplicação**: Monolito Node.js (Express + React + Vite)
- **Banco de Dados**: SQLite (arquivo local)
- **Plataforma**: Railway ou Vercel

## Pré-requisitos

1. Conta no Railway (railway.app) ou Vercel (vercel.com)
2. Repositório no GitHub
3. Acesso a APIs externas (AwesomeAPI, Yahoo Finance) para cotações

## Passo 1: Configurar Banco de Dados

O projeto usa SQLite local, que é um arquivo de banco de dados armazenado junto com a aplicação. Não é necessário configurar um banco de dados externo.

**Nota**: Para produção com múltiplos usuários simultâneos, considere migrar para PostgreSQL ou MySQL.

## Passo 2: Deploy no Railway (Recomendado)

1. Faça push do código para o GitHub
2. Acesse https://railway.app
3. Clique em "New Project" > "Deploy from GitHub repo"
4. Selecione o repositório do SmartBi
5. Configure as variáveis de ambiente:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `./smartbi.db` (padrão)
6. Clique em "Deploy"

## Passo 3: Deploy no Vercel (Alternativa)

1. Acesse https://vercel.com
2. Clique em "New Project" > "Import Git Repository"
3. Selecione o repositório do SmartBi
4. Configure as variáveis de ambiente:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `./smartbi.db` (padrão)
5. Clique em "Deploy"

## Passo 4: Configurar Script de Build

No `package.json`, o script de build já está configurado:

```json
"build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

## Passo 5: Testar

1. Acesse a URL fornecida pela plataforma (Railway ou Vercel)
2. Verifique se o sistema está funcionando
3. Teste as funcionalidades de CRUD
4. Teste a importação de CSV
5. Verifique se as cotações de mercado estão sendo atualizadas
6. Teste o botão de atualização manual de cotações

## Variáveis de Ambiente Necessárias

- `NODE_ENV`: `production`
- `DATABASE_URL`: Caminho para o arquivo SQLite (padrão: `./smartbi.db`)

Nota: As cotações de mercado usam APIs públicas gratuitas (AwesomeAPI para USD/BRL, Yahoo Finance para algodão e diesel). Não é necessário configurar chaves de API.

## Limitações do SQLite

- **Acesso simultâneo**: SQLite suporta leituras simultâneas, mas escritas são sequenciais
- **Escalabilidade**: Para aplicações com alto volume de dados, considere PostgreSQL/MySQL
- **Backup**: O arquivo SQLite deve ser backupado regularmente
- **Persistência de cotações**: O histórico de cotações é armazenado no SQLite. Se o banco for perdido, o histórico será perdido e precisará ser reconstruído pelas APIs.

## Migração para Banco de Dados Externo (Opcional)

Se precisar de um banco de dados mais robusto:

1. **PlanetScale (MySQL)** ou **Supabase (PostgreSQL)**
2. Atualize `drizzle.config.ts` para usar o dialeto correspondente
3. Atualize `DATABASE_URL` nas variáveis de ambiente
4. Execute as migrações com `pnpm db:push`

## Manutenção

- Para atualizar o sistema, faça push das mudanças para o GitHub
- Railway/Vercel farão deploy automático
- Backup do banco de dados SQLite deve ser feito manualmente ou configurado
- As cotações são atualizadas automaticamente 2x ao dia pelo scheduler
- Verifique periodicamente se as APIs externas estão funcionando corretamente

## Suporte ao Cliente

Forneça ao cliente:
1. URL do sistema (Railway ou Vercel)
2. Documentação de uso
3. Seu contato para suporte

## Custos Estimados

- Railway: Plano gratuito ($5 de crédito inicial) ou ~$5-20/mês
- Vercel: Plano gratuito (suficiente para uso moderado)
- SQLite: Gratuito (arquivo local)

Total estimado: $0-20/mês
