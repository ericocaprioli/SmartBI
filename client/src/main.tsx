// Importação do cliente tRPC configurado
import { trpc } from "@/lib/trpc";

// Importação de constantes compartilhadas para autenticação
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';

// Importação do QueryClient e Provider do React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Importação de componentes do tRPC para comunicação com backend
import { httpBatchLink, TRPCClientError } from "@trpc/client";

// Importação do createRoot do React 18 para renderização
import { createRoot } from "react-dom/client";

// Importação do superjson para serialização de dados
import superjson from "superjson";

// Importação do componente App raiz da aplicação
import App from "./App";

// Importação da função getLoginUrl para redirecionamento
import { getLoginUrl } from "./const";

// Importação dos estilos globais CSS
import "./index.css";

/**
 * Cliente QueryClient do React Query
 * Gerencia cache, loading states e revalidação de dados
 */
const queryClient = new QueryClient();

/**
 * Função para redirecionar para login se erro for de não autorizado
 * 
 * Funcionalidades:
 * - Verifica se o erro é uma instância de TRPCClientError
 * - Verifica se a mensagem de erro corresponde a erro de não autorizado
 * - Redireciona para URL de login se configurada
 * 
 * @param error - Erro capturado em query ou mutation
 */
const redirectToLoginIfUnauthorized = (error: unknown) => {
  // Valida se é erro do tRPC
  if (!(error instanceof TRPCClientError)) return;
  
  // Valida se está no navegador (não no servidor)
  if (typeof window === "undefined") return;

  // Verifica se erro é de não autorizado
  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Redireciona para login se URL estiver configurada
  const loginUrl = getLoginUrl();
  if (loginUrl !== "/") {
    window.location.href = loginUrl;
  }
};

/**
 * Subscribe ao cache de queries do React Query
 * Monitora erros em queries e redireciona para login se necessário
 */
queryClient.getQueryCache().subscribe(event => {
  // Verifica se evento é de atualização com erro
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

/**
 * Subscribe ao cache de mutations do React Query
 * Monitora erros em mutations e redireciona para login se necessário
 */
queryClient.getMutationCache().subscribe(event => {
  // Verifica se evento é de atualização com erro
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

/**
 * Cliente tRPC configurado
 * 
 * Configurações:
 * - URL base: /api/trpc
 * - Transformer: superjson para serialização de dados complexos
 * - Headers: Bearer token fallback para Safari ITP/private browsing
 * - Fetch: credentials include para enviar cookies
 * 
 * Fallback de autenticação:
 * Quando o navegador bloqueia cookies em iframes (Safari ITP, private browsing, WebView),
 * o runtime espelha a sessão no sessionStorage e a envia como Bearer token.
 * O fluxo OAuth normal com cookies continua funcionando e tem prioridade no servidor.
 */
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      
      /**
       * Função para adicionar headers customizados
       * Implementa fallback de autenticação para casos onde cookies são bloqueados
       */
      headers() {
        try {
          // Tenta recuperar cookie do sessionStorage
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            // Extrai token do cookie
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              // Retorna header Authorization com Bearer token
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage indisponível (ex: em iframe cross-origin)
        }
        return {};
      },
      
      /**
       * Função fetch customizada
       * Garante que credentials: include seja enviado
       */
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

/**
 * Renderização da aplicação
 * 
 * Estrutura de providers:
 * 1. trpc.Provider: Fornece cliente tRPC para toda a aplicação
 * 2. QueryClientProvider: Fornece cliente React Query para cache de dados
 * 3. App: Componente raiz da aplicação
 */
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
