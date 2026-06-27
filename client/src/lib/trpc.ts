// Importação da função createTRPCReact do pacote @trpc/react-query
// Esta função cria o cliente tRPC para React com integração com React Query
import { createTRPCReact } from "@trpc/react-query";

// Importação do tipo AppRouter do servidor
// AppRouter define a estrutura de todas as rotas/procedimentos disponíveis no backend
import type { AppRouter } from "../../../server/routers";

/**
 * Cliente tRPC para React
 * 
 * tRPC é um framework que permite chamadas de API type-safe
 * entre frontend e backend sem necessidade de definições manuais de tipos
 * 
 * Funcionalidades:
 * - Type-safety automática: tipos do TypeScript são inferidos do backend
 * - Integração com React Query para cache, loading states e revalidação
 * - Autocompletar de IDE baseado nos procedimentos do backend
 * - Serialização/deserialização automática de dados
 * 
 * Uso típico:
 * - trpc.procedimento.useQuery() para queries (GET)
 * - trpc.procedimento.useMutation() para mutations (POST/PUT/DELETE)
 * - trpc.procedimento.useSubscription() para subscriptions em tempo real
 * 
 * Exemplo:
 * const { data, isLoading } = trpc.users.list.useQuery();
 * const createUser = trpc.users.create.useMutation();
 */
export const trpc = createTRPCReact<AppRouter>();
