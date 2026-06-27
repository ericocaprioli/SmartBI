# SmartBi Developer Manual

## Visão Geral

Este manual descreve a arquitetura completa do projeto `SmartBi`, incluindo setup, configuração, back-end, front-end, banco de dados, build e testes. O objetivo é permitir que um desenvolvedor leigo reconstrua o sistema a partir do zero.

## Requisitos Básicos

- Node.js (recomendado >= 20)
- pnpm
- MySQL compatível com `mysql2`
- Editor de código (VS Code, WebStorm, etc.)
- Acesso a um OAuth provider compatível com o fluxo usado aqui (Manus/OAuth)

## Git e Repositório

### Inicializar repositório Git

Se você estiver começando do zero:

```bash
cd /path/to/project
git init
git add .
git commit -m "Initial commit"
```

### Arquivo `.gitignore`

O projeto usa `.gitignore` para evitar que arquivos temporários, dependências locais, builds e variáveis de ambiente sejam versionados.

Itens ignorados principais:

- `node_modules/`
- `dist/`, `build/`
- `.env` e variantes
- arquivos de log `*.log`
- caches de TypeScript, ESLint e ferramentas
- artefatos de IDE (`.vscode/`, `.idea/`)
- artifacts de plataforma (`.DS_Store`, `Thumbs.db`)

## Estrutura do Projeto

A raiz do repositório contém:

- `package.json` - dependências e scripts
- `pnpm-lock.yaml` - lockfile do pnpm
- `tsconfig.json` - configuração TypeScript geral
- `vite.config.ts` - configuração de build e dev do Vite
- `vitest.config.ts` - configuração dos testes
- `drizzle.config.ts` - configuração do Drizzle ORM
- `client/` - aplicativo front-end React + Vite
- `server/` - back-end Express + tRPC
- `shared/` - constantes e tipos compartilhados
- `drizzle/` - esquema e migrações de banco de dados

### Diretórios importantes

- `client/src/` - código front-end principal
- `client/src/components/` - componentes React da interface
- `client/src/pages/` - páginas do app
- `client/src/_core/` - hooks e lógica central do front-end
- `server/_core/` - infraestrutura do servidor, autenticação e roteamento
- `server/routers.ts` - definição das APIs tRPC
- `server/db.ts` - implementação de acesso ao banco de dados
- `shared/` - constantes e tipos que são usados por front-end e back-end

## `package.json`

### Scripts importantes

- `pnpm dev` - inicia o servidor em desenvolvimento (`server/_core/index.ts`) com modo watch
- `pnpm build` - gera o front-end com Vite e empacota o servidor com esbuild
- `pnpm start` - inicia o servidor `dist/index.js` em produção
- `pnpm check` - executa `tsc --noEmit`
- `pnpm format` - formata o código com Prettier
- `pnpm test` - executa testes com Vitest
- `pnpm db:push` - gera migrações e aplica ao banco (Drizzle)
- `pnpm db:seed` - executa o seed de dados em `scripts/db-seed.ts`
- `pnpm db:setup` - executa `db:push` e `db:seed`

### Dependências

O projeto depende de bibliotecas de front-end e back-end:

- React 19, Vite, Tailwind, Radix UI e componentes de interface
- tRPC para API tipada entre cliente e servidor
- `drizzle-orm` com dialeto MySQL
- `express` para servidor HTTP
- `jose` para JWT
- `axios` para chamadas HTTP externas
- `mysql2` para conexão com banco de dados

### DevDependencies

Inclui:

- `typescript`
- `vite`
- `vitest`
- `tsx`
- `esbuild`
- `@tailwindcss/vite`
- `prettier`

## `tsconfig.json`

Configuração central de TypeScript.

- `include`: `client/src/**/*`, `shared/**/*`, `server/**/*`
- `exclude`: `node_modules`, `build`, `dist`, `**/*.test.ts`
- `module`: `ESNext`
- `strict`: `true`
- `lib`: `esnext`, `dom`, `dom.iterable`
- `jsx`: `preserve`
- `moduleResolution`: `bundler`
- alias de paths:
  - `@/*` → `./client/src/*`
  - `@shared/*` → `./shared/*`

## `vite.config.ts`

O Vite está configurado para rodar o front-end a partir da pasta `client/`.

- `root`: `client`
- `publicDir`: `client/public`
- `outDir`: `dist/public`
- `base`: `/SmartBI/` quando `GITHUB_PAGES` estiver definido, caso contrário `/`
- alias:
  - `@` → `client/src`
  - `@shared` → `shared`
  - `@assets` → `attached_assets`
- plugins:
  - `@vitejs/plugin-react`
  - `@tailwindcss/vite`
  - `@builder.io/vite-plugin-jsx-loc`
  - `vite-plugin-manus-runtime`

### Nota sobre `vitePluginManusDebugCollector`

O arquivo ainda contém a definição de um plugin de coleta de logs do navegador, mas ele não está incluído na lista de plugins ativos. Essa lógica registra eventos de debug em `.manus-logs/` somente no modo de desenvolvimento se ativada.

## `vitest.config.ts`

Configuração de testes unitários e de integração.

- `root`: raiz do repositório
- alias: iguais ao Vite (`@`, `@shared`, `@assets`)
- `test.environment`: `node`
- inclui apenas arquivos `server/**/*.test.ts` ou `server/**/*.spec.ts`

## `drizzle.config.ts`

Configuração do Drizzle ORM para migrações.

- `schema`: `./drizzle/schema.ts`
- `out`: `./drizzle`
- `dialect`: `mysql`
- `dbCredentials.url`: `process.env.DATABASE_URL`

## Arquivos de configuração de ambiente

### Variáveis de ambiente obrigatórias

- `DATABASE_URL` - string de conexão MySQL
- `JWT_SECRET` - segredo usado para assinar cookies JWT
- `VITE_APP_ID` - ID do app Manus/OAuth para front-end
- `VITE_OAUTH_PORTAL_URL` - URL do portal de autenticação OAuth
- `OAUTH_SERVER_URL` - URL base do servidor OAuth
- `OWNER_OPEN_ID` - OpenID do administrador do sistema
- `BUILT_IN_FORGE_API_KEY` - chave do proxy de storage se usado
- `BUILT_IN_FORGE_API_URL` - URL base do serviço de storage Forge
- `PORT` - porta opcional para o servidor Express
- `NODE_ENV` - `development` ou `production`

### Exemplo de `.env`

```env
DATABASE_URL=mysql://user:password@localhost:3306/smartbi
JWT_SECRET=uma_chave_muito_forte_aqui
VITE_APP_ID=your_app_id
VITE_OAUTH_PORTAL_URL=https://oauth-portal.example.com
OAUTH_SERVER_URL=https://oauth-api.example.com
OWNER_OPEN_ID=admin_open_id
BUILT_IN_FORGE_API_KEY=forge-api-key
BUILT_IN_FORGE_API_URL=https://forge.example.com
PORT=3000
NODE_ENV=development
```

## Configuração de Banco de Dados

### Esquema do banco

O banco de dados usa MySQL com as tabelas definidas em `drizzle/schema.ts`:

- `users` - armazenamento de usuários autenticados via OAuth
- `funcionarios` - dados de funcionários
- `pagamentos` - registros de pagamento mensal
- `producao` - metas e produção mensal

### Comandos Drizzle

- `pnpm db:push` - gera migrações e aplica no banco
- `pnpm db:seed` - popula o banco com dados iniciais
- `pnpm db:setup` - executa `db:push` e `db:seed`

### Observações sobre as tabelas

- `users`: guarda `openId`, `name`, `email`, `loginMethod`, `role`, timestamps.
- `funcionarios`: guarda salário base, função, situação, forma de pagamento e estado de ativo.
- `pagamentos`: guarda dados de salário mensal, descontos, benefícios e feriados.
- `producao`: guarda metas diárias/mensais e faturamento.

## Arquitetura do Back-end

### Fluxo principal do servidor

1. `server/_core/index.ts`
   - importa `dotenv/config` para variáveis de ambiente
   - cria app Express e servidor HTTP
   - registra middleware JSON com limite de 50MB
   - registra proxies de armazenamento e rotas OAuth
   - monta middleware tRPC em `/api/trpc`
   - em `development`, usa Vite para servir o client com hot reload
   - em `production`, serve arquivos estáticos da pasta `dist/public`
   - define porta disponível a partir de `PORT` ou 3000

2. `server/routers.ts`
   - monta a `appRouter` tRPC com vários sub-routers:
     - `system` - rotas de saúde e notificações administrativas
     - `auth` - `me` e `logout`
     - `funcionarios` - listagem, CRUD e importação CSV
     - `pagamentos` - listagem por mês, CRUD e busca por funcionário/mês
     - `producao` - listagem por mês, CRUD e busca por funcionário/mês
     - `dashboard` - KPIs de dashboard

3. `server/_core/context.ts`
   - cria contexto tRPC para cada requisição
   - autentica a requisição com `sdk.authenticateRequest`
   - torna `req`, `res` e `user` disponíveis nos handlers

4. `server/_core/trpc.ts`
   - inicializa tRPC com `superjson`
   - expõe `router`, `publicProcedure`, `protectedProcedure` e `adminProcedure`
   - `protectedProcedure` exige usuário autenticado
   - `adminProcedure` exige usuário com `role === 'admin'`

### Autenticação e sessão

- `server/_core/sdk.ts`
  - implementa chamadas OAuth para trocar código por token e obter dados de usuário
  - gera e verifica JWT de sessão com `jose`
  - lê cookie de sessão `app_session_id`
  - usa fallback `Authorization: Bearer` quando necessário
  - sincroniza usuário com a tabela `users`
  - trata sessões de cron com prefixo `cron_`

- `server/_core/cookies.ts`
  - define as opções do cookie de sessão
  - `httpOnly: true`, `sameSite: none`, `secure` conforme HTTPS

- `server/_core/oauth.ts`
  - define a rota `/api/oauth/callback`
  - troca o `code` por token OAuth
  - obtém informações de usuário
  - grava ou atualiza usuário no banco
  - cria cookie de sessão e redireciona para `/`

### Proxy de armazenamento

- `server/_core/storageProxy.ts`
  - implementa rota `/manus-storage/*`
  - gera URL assinada do Forge usando `BUILT_IN_FORGE_API_URL` e `BUILT_IN_FORGE_API_KEY`
  - redireciona o cliente para o URL pré-assinado

### Servidor Vite

- `server/_core/vite.ts`
  - em dev, cria servidor Vite em middleware mode
  - serve `client/index.html` via `vite.transformIndexHtml`
  - adiciona cache-busting ao payload do script principal
  - em produção, serve arquivos estáticos da pasta `dist/public`

### Acesso a dados

- `server/db.ts`
  - usa `drizzle-orm/mysql2`
  - `getDb()` cria a conexão lazy com `DATABASE_URL`
  - opera em tabelas `users`, `funcionarios`, `pagamentos`, `producao`
  - funções CRUD e consultas específicas
  - calcula KPIs para dashboard
  - importa dados CSV para `funcionarios`, `pagamentos` e `producao`

### Rotas e APIs tRPC

- `auth.me` - retorna o usuário logado ou `null`
- `auth.logout` - limpa cookie de sessão
- `funcionarios.list` - retorna funcionários ativos
- `funcionarios.getById` - busca funcionário específico
- `funcionarios.create` / `update` - CRUD de funcionários
- `funcionarios.importCSV` - importa funcionário via CSV
- `pagamentos.listByMes` - lista pagamentos por mês
- `pagamentos.listAll` - lista todos os pagamentos
- `pagamentos.getByFuncionarioAndMes` - busca por funcionário e mês
- `pagamentos.create` / `update` - CRUD de pagamentos
- `producao.listByMes` - lista produção por mês
- `producao.listAll` - lista toda produção
- `producao.getByFuncionarioAndMes` - busca por funcionário e mês
- `producao.create` / `update` - CRUD de produção
- `dashboard.getKPIs` - KPIs consolidados do dashboard

### Outros arquivos `server/_core` importantes

- `server/_core/dataApi.ts` - adaptadores ou helpers para chamadas a APIs externas.
- `server/_core/heartbeat.ts` - endpoints de heartbeat ou monitoramento de saúde.
- `server/_core/imageGeneration.ts` - lógica de geração ou proxy de imagens.
- `server/_core/map.ts` - suporte a dados de mapa / geolocalização.
- `server/_core/notification.ts` - envio de notificações e alertas.
- `server/_core/voiceTranscription.ts` - transcrição de voz ou integração de áudio.
- `server/_core/types/manusTypes.ts` - definições de tipos TypeScript usados pelo SDK Manus/Manus OAuth.

## Arquitetura do Front-end

### Entrada do aplicativo

- `client/src/main.tsx`
  - cria o cliente `trpc` com `httpBatchLink` para `/api/trpc`
  - usa `superjson` para serialização de dados complexos
  - define `credentials: include` para enviar cookies
  - implementa fallback de sessionStorage para token Bearer (caso cookies sejam bloqueados)
  - renderiza `<App />` dentro de `trpc.Provider` e `QueryClientProvider`

### `client/src/App.tsx`

- aplica `ErrorBoundary` para capturar erros de renderização
- usa `ThemeProvider` com tema `light`
- adiciona `TooltipProvider` e `Toaster`
- define rotas Wouter para as páginas do dashboard

### Constantes e configuração de login

- `client/src/const.ts`
  - exporta `COOKIE_NAME` e `ONE_YEAR_MS` de `@shared/const`
  - constrói `getLoginUrl()` usando `VITE_OAUTH_PORTAL_URL` e `VITE_APP_ID`
  - inclui a URL de callback `window.location.origin + /api/oauth/callback`
  - `isAuthConfigured()` verifica se a autenticação está configurada

### Hook de autenticação

- `client/src/_core/hooks/useAuth.ts`
  - consulta `trpc.auth.me`
  - mantém estado de usuário, loading, erro e autenticado
  - expõe `logout()` utilizando `trpc.auth.logout`
  - atualiza cache local e limpa `sessionStorage` de fallback
  - suporta redirecionamento automático quando não autenticado

### APIs do cliente

- `client/src/lib/trpc.ts`
  - cria o wrapper tRPC React tipado com `AppRouter` do servidor

### Contexto de tema

- `client/src/contexts/ThemeContext.tsx`
  - provê tema `light` ou `dark`
  - opcionalmente switchable (tema ajustável)
  - aplica `dark` na raiz do documento e persiste no `localStorage`

## Front-end React e Páginas

O `client/src/pages/` contém as telas do dashboard:

- `Home.tsx` - tela inicial
- `Dashboard.tsx` - dashboard principal
- `DashboardProducao.tsx` - dashboard de produção
- `Funcionarios.tsx` - gestão de funcionários
- `Pagamentos.tsx` - gestão de pagamentos
- `Producao.tsx` - gestão de produção
- `Relatorios.tsx` - relatórios
- `VisaoAnual.tsx` - visão anual
- `NotFound.tsx` - página 404

### Componentes comuns

- `client/src/components/DashboardLayout.tsx` - shell do dashboard com sidebar, menu e painel principal
- `client/src/components/DashboardLayoutSkeleton.tsx` - UI de carregamento enquanto o auth resolve
- `client/src/components/ErrorBoundary.tsx` - captura erros e exibe fallback
- `client/src/components/AIChatBox.tsx` - caixa de chat com IA
- `client/src/components/Gauge.tsx` - componente de gauge personalizado
- `client/src/components/Map.tsx` - integração com Google Maps via Forge proxy
- `client/src/components/ManusDialog.tsx` - modal de login Manus

### Biblioteca de UI

- `client/src/components/ui/` - coleção de componentes de interface reutilizáveis (botões, diálogos, menus, cards, etc.)

## Shared e Constantes Comuns

- `shared/const.ts`
  - `COOKIE_NAME` - nome do cookie de sessão
  - `ONE_YEAR_MS` - duração padrão do cookie
  - `AXIOS_TIMEOUT_MS` - timeout padrão do Axios
  - mensagens de erro de autenticação e permissão

## Esquema e migrações do DB

- `drizzle/schema.ts` - define todas as tabelas MySQL do projeto usando Drizzle
- `drizzle/migrations/` - migrações SQL geradas
- `drizzle/relations.ts` - relações entre tabelas (não inspecionado detalhadamente, mas presente como suporte de modelo)

## Rodando o Projeto

### Instalação

```bash
cd /path/to/SmartBi
pnpm install
```

### Execução em desenvolvimento

```bash
pnpm dev
```

Isso inicia a aplicação em modo dev com o servidor Express e o front-end Vite com hot reload.

### Build para produção

```bash
pnpm build
pnpm start
```

### Verificação de tipo

```bash
pnpm check
```

### Testes

```bash
pnpm test
```

Isso executa arquivos de teste localizados em `server/**/*.test.ts` ou `server/**/*.spec.ts`.

## Passo a passo para recriar do zero

1. Clone o repositório ou copie a estrutura de pastas.
2. Crie `.gitignore` com os padrões do projeto.
3. Instale Node.js e pnpm.
4. Execute `pnpm install` na raiz.
5. Crie um arquivo `.env` com as variáveis descritas acima.
6. Configure o MySQL e garanta que `DATABASE_URL` funcione.
7. Execute `pnpm db:push` para aplicar o esquema do banco.
8. Execute `pnpm db:seed` se desejar popular dados iniciais.
9. Inicie em dev com `pnpm dev`.
10. Acesse `http://localhost:3000`.

## Estrutura de arquivos explicada

### Raiz do repositório

- `package.json`: dependências e scripts de execução/build/test.
- `pnpm-lock.yaml`: versão das dependências bloqueada.
- `tsconfig.json`: configuração do compilador TypeScript.
- `vite.config.ts`: configuração do Vite para build/servidor front-end.
- `vitest.config.ts`: configuração do Vitest para rodar testes.
- `drizzle.config.ts`: configuração do Drizzle ORM.
- `.gitignore`: arquivos e pastas ignorados pelo Git.

### `client/`

- `index.html`: template HTML do aplicativo.
- `public/`: ativos estáticos públicos.
- `src/`: código fonte React.
  - `main.tsx`: ponto de entrada que monta o app e configura tRPC.
  - `App.tsx`: shell principal com roteamento e providers.
  - `_core/`: hooks e lógica central do front-end.
  - `components/`: componentes React reutilizáveis.
  - `pages/`: páginas do aplicativo.
  - `contexts/`: contexto de tema.
  - `lib/`: configurações de bibliotecas, como tRPC.

### `server/`

- `index.ts`: ponto de entrada do servidor Express.
- `routers.ts`: definição das rotas tRPC expostas.
- `db.ts`: funções de acesso e persistência no banco.
- `_core/`: infraestrutura do servidor (auth, OAuth, middleware, etc.).

### `drizzle/`

- `schema.ts`: definição do esquema das tabelas.
- `migrations/`: scripts SQL de migração.
- `relations.ts`: eventualmente usado para definir relações entre tabelas.

### `shared/`

- `const.ts`: constantes compartilhadas entre cliente e servidor.
- `types.ts`: (se existir) tipos compartilhados.

## Como o front-end se comunica com o back-end

- O cliente usa tRPC para chamar métodos remotos.
- O endpoint backend é `POST /api/trpc`.
- O cliente envia cookies com `credentials: include`.
- O servidor valida sessão JWT e monta contexto tRPC.
- O front-end chama rotas como `trpc.auth.me`, `trpc.funcionarios.list` e `trpc.dashboard.getKPIs`.

## Autenticação e sessão explicadas

1. O usuário entra no site.
2. Se a autenticação estiver configurada (`VITE_OAUTH_PORTAL_URL` + `VITE_APP_ID`), o app pode redirecionar para o portal OAuth.
3. O portal retorna para `/api/oauth/callback` com `code` e `state`.
4. `server/_core/oauth.ts` troca o código por token e obtém informações do usuário.
5. O app cria ou atualiza o usuário em `users`.
6. Um cookie JWT é criado e enviado ao navegador.
7. Em requisições subsequentes, `sdk.authenticateRequest` valida o JWT e carrega o usuário.
8. Rotas tRPC protegidas usam `protectedProcedure` ou `adminProcedure`.

## Componentes e páginas principais

### `DashboardLayout.tsx`

- Renderiza a sidebar e o painel principal.
- Suporta redimensionamento da sidebar pelo usuário.
- Mantém largura persistida no `localStorage`.
- Mostra splash de acesso ou modo convidado quando necessário.

### `DashboardLayoutSkeleton.tsx`

- Tela de carregamento para exibir enquanto o auth é buscado.

### `ErrorBoundary.tsx`

- Captura erros de React e exibe fallback com opção de reload.

### `AIChatBox.tsx`

- Componente de chat com renderização de mensagens e estado de carregamento.
- Auto-scroll e entrada de texto com suporte a `Enter` e `Shift+Enter`.

### `Gauge.tsx`

- Componente SVG que desenha um gauge com arco, ponteiro e valor.

### `Map.tsx`

- Exibe um mapa do Google carregado dinamicamente via proxy Forge.
- Usa `google.maps` com bibliotecas `marker`, `places`, `geocoding`, `geometry`.

### `ManusDialog.tsx`

- Modal de login Manus simples.

## Observações finais

- O manual fornece a base para reconstruir o projeto, mas é importante ter acesso ao OAuth provider e uma instância MySQL funcional.
- O front-end e o back-end usam paths de alias (`@`, `@shared`, `@assets`) configurados no Vite e no TypeScript.
- Os dados do tipo `mes_referencia` estão no formato `YYYY-MM`.
- O app foi pensado para ser extensível: novas rotas tRPC podem ser adicionadas em `server/routers.ts` e acompanhadas por novos componentes React.

## Dicas para recriação do sistema

1. Crie a mesma estrutura de pastas e arquivos listados acima.
2. Replique as configurações principais: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `drizzle.config.ts`.
3. Garanta que o banco e as tabelas existam antes de rodar o servidor.
4. Use o mesmo fluxo de autenticação: cookie JWT + fallback Bearer header.
5. Se quiser simplificar, comece sem OAuth e teste a API diretamente com `trpc` e mocks.

---

Este manual foi elaborado para que um desenvolvedor possa entender a solução completa deste projeto e recriá-la a partir da documentação sem precisar de conhecimento prévio profundo do código.
