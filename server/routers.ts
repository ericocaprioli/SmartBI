// Importação do Zod para validação de schemas
import { z } from "zod";

// Importação de constantes compartilhadas para autenticação
import { COOKIE_NAME } from "@shared/const";

// Importação de função para obter opções de cookie de sessão
import { getSessionCookieOptions } from "./_core/cookies";

// Importação do router de sistema do núcleo
import { systemRouter } from "./_core/systemRouter";

// Importação de utilitários do tRPC do núcleo
import { publicProcedure, router } from "./_core/trpc";

// Importação de funções de banco de dados para operações CRUD
import {
  getFuncionarios,
  getFuncionarioById,
  createFuncionario,
  updateFuncionario,
  getPagamentosByMes,
  getPagamentoByFuncionarioAndMes,
  createPagamento,
  updatePagamento,
  getProducaoByMes,
  getProducaoByFuncionarioAndMes,
  createProducao,
  updateProducao,
  getKPIsDashboard,
  importFuncionariosCSV,
  importPagamentosCSV,
  importProducaoCSV,
} from "./db";

// Importação de schemas do Drizzle para tabelas
import { pagamentos, producao } from "../drizzle/schema";

// Importação da função para obter conexão com banco de dados
import { getDb } from "./db";

/**
 * appRouter é o router principal do tRPC
 * Define todos os procedimentos (endpoints) disponíveis na API
 * 
 * Estrutura de rotas:
 * - system: rotas de sistema (health check, etc.)
 * - auth: rotas de autenticação (me, logout)
 * - funcionarios: CRUD de funcionários
 * - pagamentos: CRUD de pagamentos
 * - producao: CRUD de produção
 * - dashboard: KPIs e métricas do dashboard
 * 
 * Cada rota usa publicProcedure (sem autenticação obrigatória)
 * Os procedimentos são type-safe graças ao tRPC
 */
export const appRouter = router({
  // Rotas de sistema
  system: systemRouter,
  
  // Rotas de autenticação
  auth: router({
    /**
     * Retorna informações do usuário autenticado
     * Se não autenticado, retorna null ou undefined
     */
    me: publicProcedure.query(opts => opts.ctx.user),
    
    /**
     * Faz logout do usuário
     * Limpa o cookie de autenticação
     */
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Limpa cookie definindo maxAge como -1 (expira imediatamente)
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Rotas de funcionários
  funcionarios: router({
    /**
     * Lista todos os funcionários
     * @returns Array de funcionários
     */
    list: publicProcedure.query(async () => {
      return await getFuncionarios();
    }),
    
    /**
     * Obtém um funcionário por ID
     * @param input - ID do funcionário (número)
     * @returns Funcionário encontrado ou null
     */
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getFuncionarioById(input);
    }),
    
    /**
     * Cria um novo funcionário
     * @param input - Dados do funcionário (nome, funcao, situacao, forma_pagamento, pix, salario_base)
     * @returns Funcionário criado
     */
    create: publicProcedure
      .input(
        z.object({
          nome: z.string(),
          funcao: z.string(),
          situacao: z.enum(["CLT", "Contrato", "Experiência"]),
          forma_pagamento: z.string(),
          pix: z.string().optional(),
          salario_base: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await createFuncionario(input);
      }),
    
    /**
     * Atualiza um funcionário existente
     * @param input - ID do funcionário e dados a atualizar (todos opcionais exceto ID)
     * @returns Funcionário atualizado
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          funcao: z.string().optional(),
          situacao: z.enum(["CLT", "Contrato", "Experiência"]).optional(),
          forma_pagamento: z.string().optional(),
          pix: z.string().optional(),
          salario_base: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateFuncionario(id, data);
      }),
    
    /**
     * Importa funcionários de um CSV
     * @param input - Conteúdo do CSV como string
     * @returns Resultado da importação
     */
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importFuncionariosCSV(input.csvContent);
      }),
  }),

  // Rotas de pagamentos
  pagamentos: router({
    /**
     * Lista pagamentos por mês
     * @param input - Mês no formato YYYY-MM
     * @returns Array de pagamentos do mês
     */
    listByMes: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getPagamentosByMes(input);
    }),
    
    /**
     * Lista todos os pagamentos
     * @returns Array de todos os pagamentos
     */
    listAll: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(pagamentos);
    }),
    
    /**
     * Obtém pagamento de um funcionário em um mês específico
     * @param input - funcionario_id e mes
     * @returns Pagamento encontrado ou null
     */
    getByFuncionarioAndMes: publicProcedure
      .input(
        z.object({
          funcionario_id: z.number(),
          mes: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await getPagamentoByFuncionarioAndMes(input.funcionario_id, input.mes);
      }),
    
    /**
     * Cria um novo pagamento
     * @param input - Dados do pagamento (funcionario_id, mes_referencia, e valores opcionais)
     * @returns Pagamento criado
     */
    create: publicProcedure
      .input(
        z.object({
          funcionario_id: z.number(),
          mes_referencia: z.string(),
          dias_trabalhados: z.number().optional(),
          salario_base_mes: z.number().optional(),
          valor_dia: z.number().optional(),
          salario_bruto: z.number().optional(),
          salario_familia: z.number().optional(),
          premio_producao: z.number().optional(),
          premio_assiduidade: z.number().optional(),
          hora_extra: z.number().optional(),
          inss: z.number().optional(),
          desconto_diversos: z.number().optional(),
          salario_liquido: z.number().optional(),
          ferias: z.number().optional(),
          terco_ferias: z.number().optional(),
          decimo_terceiro: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createPagamento(input);
      }),
    
    /**
     * Atualiza um pagamento existente
     * @param input - ID do pagamento e dados a atualizar (todos opcionais exceto ID)
     * @returns Pagamento atualizado
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          dias_trabalhados: z.number().optional(),
          salario_base_mes: z.number().optional(),
          valor_dia: z.number().optional(),
          salario_bruto: z.number().optional(),
          salario_familia: z.number().optional(),
          premio_producao: z.number().optional(),
          premio_assiduidade: z.number().optional(),
          hora_extra: z.number().optional(),
          inss: z.number().optional(),
          desconto_diversos: z.number().optional(),
          salario_liquido: z.number().optional(),
          ferias: z.number().optional(),
          terco_ferias: z.number().optional(),
          decimo_terceiro: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePagamento(id, data);
      }),
    
    /**
     * Importa pagamentos de um CSV
     * @param input - Conteúdo do CSV como string
     * @returns Resultado da importação
     */
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importPagamentosCSV(input.csvContent);
      }),
  }),

  // Rotas de produção
  producao: router({
    /**
     * Lista produção por mês
     * @param input - Mês no formato YYYY-MM
     * @returns Array de produção do mês
     */
    listByMes: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getProducaoByMes(input);
    }),
    
    /**
     * Lista toda a produção
     * @returns Array de toda a produção
     */
    listAll: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(producao);
    }),
    
    /**
     * Obtém produção de um funcionário em um mês específico
     * @param input - funcionario_id e mes
     * @returns Produção encontrada ou null
     */
    getByFuncionarioAndMes: publicProcedure
      .input(
        z.object({
          funcionario_id: z.number(),
          mes: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await getProducaoByFuncionarioAndMes(input.funcionario_id, input.mes);
      }),
    
    /**
     * Cria um novo registro de produção
     * @param input - Dados da produção (funcionario_id, mes_referencia, e valores opcionais)
     * @returns Produção criada
     */
    create: publicProcedure
      .input(
        z.object({
          funcionario_id: z.number(),
          mes_referencia: z.string(),
          meta_dia: z.number().optional(),
          meta_mes: z.number().optional(),
          valor_peca: z.number().optional(),
          producao_realizada: z.number().optional(),
          faturamento_mensal: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createProducao(input);
      }),
    
    /**
     * Atualiza um registro de produção existente
     * @param input - ID da produção e dados a atualizar (todos opcionais exceto ID)
     * @returns Produção atualizada
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          meta_dia: z.number().optional(),
          meta_mes: z.number().optional(),
          valor_peca: z.number().optional(),
          producao_realizada: z.number().optional(),
          faturamento_mensal: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateProducao(id, data);
      }),
    
    /**
     * Importa produção de um CSV
     * @param input - Conteúdo do CSV como string
     * @returns Resultado da importação
     */
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importProducaoCSV(input.csvContent);
      }),
  }),

  // Rotas de dashboard
  dashboard: router({
    /**
     * Obtém KPIs do dashboard para um mês específico
     * @param input - Mês no formato YYYY-MM
     * @returns KPIs calculados (total funcionarios, total pagamentos, etc.)
     */
    getKPIs: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getKPIsDashboard(input);
    }),
  }),
});

/**
 * Tipo AppRouter exportado para uso no frontend
 * Permite que o frontend tenha type-safety ao chamar procedimentos
 */
export type AppRouter = typeof appRouter;
