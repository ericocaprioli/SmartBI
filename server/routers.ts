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
  deleteFuncionario,
  getPagamentosByMes,
  getPagamentoByFuncionarioAndMes,
  createPagamento,
  updatePagamento,
  deletePagamento,
  getProducaoByMes,
  getProducaoByFuncionarioAndMes,
  createProducao,
  updateProducao,
  getKPIsDashboard,
  importFuncionariosCSV,
  importPagamentosCSV,
  importProducaoCSV,
  getLatestCotacoes,
  getCotacoesByTipo,
  getMeses,
  createMes,
  updateMes,
  deleteMes,
  getFuncoes,
  createFuncao,
  updateFuncao,
  deleteFuncao,
  getSituacoes,
  createSituacao,
  updateSituacao,
  deleteSituacao,
  getFormasPagamento,
  createFormaPagamento,
  updateFormaPagamento,
  deleteFormaPagamento,
} from "./db";

// Importação de schemas do Drizzle para tabelas
import { pagamentos, producao } from "../drizzle/schema";

// Importação da função para obter conexão com banco de dados
import { getDb } from "./db";

// Importação do serviço de coleta de cotações
import { collectCotacoes } from "./cotacoes";

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
          situacao: z.string(),
          forma_pagamento: z.string(),
          tipo_chave_pix: z.string().optional(),
          pix: z.string().optional(),
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
          salario_base: z.number(),
          data_admissao: z.string().optional(),
          data_demissao: z.string().optional(),
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
          situacao: z.string().optional(),
          forma_pagamento: z.string().optional(),
          tipo_chave_pix: z.string().optional(),
          pix: z.string().optional(),
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
          salario_base: z.number().optional(),
          data_admissao: z.string().optional(),
          data_demissao: z.string().optional(),
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
    
    /**
     * Exclui um funcionário (soft delete)
     * @param input - ID do funcionário
     * @returns Resultado da exclusão
     */
    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return await deleteFuncionario(input);
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
          vale_transporte: z.number().optional(),
          irrf: z.number().optional(),
          fgts: z.number().optional(),
          total_proventos: z.number().optional(),
          total_descontos: z.number().optional(),
          salario_total: z.number().optional(),
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
          vale_transporte: z.number().optional(),
          irrf: z.number().optional(),
          fgts: z.number().optional(),
          total_proventos: z.number().optional(),
          total_descontos: z.number().optional(),
          salario_total: z.number().optional(),
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
    
    /**
     * Exclui um pagamento
     * @param input - ID do pagamento
     * @returns Pagamento excluído
     */
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePagamento(input.id);
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
          dia: z.number().optional(),
          meta_dia: z.number().optional(),
          producao_dia: z.number().optional(),
          eficiencia: z.number().optional(),
          producao_acumulada: z.number().optional(),
          saldo_acumulado: z.number().optional(),
          eficiencia_acumulada: z.number().optional(),
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
          dia: z.number().optional(),
          meta_dia: z.number().optional(),
          producao_dia: z.number().optional(),
          eficiencia: z.number().optional(),
          producao_acumulada: z.number().optional(),
          saldo_acumulado: z.number().optional(),
          eficiencia_acumulada: z.number().optional(),
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

  // Rotas de cotações (dólar, algodão, diesel)
  cotacoes: router({
    /**
     * Retorna a cotação mais recente de cada tipo (dólar, algodão, diesel)
     * @returns Array com a última cotação de cada tipo
     */
    latest: publicProcedure.query(async () => {
      return await getLatestCotacoes();
    }),

    /**
     * Retorna o histórico de cotações de um tipo específico
     * @param input - Tipo da cotação (dolar, algodao, diesel)
     * @returns Array de cotações em ordem cronológica
     */
    history: publicProcedure
      .input(z.enum(["dolar", "algodao", "diesel"]))
      .query(async ({ input }) => {
        return await getCotacoesByTipo(input);
      }),

    /**
     * Dispara uma coleta manual de cotações
     * Útil para atualizar imediatamente sem esperar o agendador
     * @returns Resumo da coleta (sucessos e falhas)
     */
    refresh: publicProcedure.mutation(async () => {
      return await collectCotacoes();
    }),
  }),

  // Rotas de meses
  meses: router({
    /**
     * Lista todos os meses ativos
     * @returns Array de meses ativos ordenados por mes_referencia
     */
    list: publicProcedure.query(async () => {
      return await getMeses();
    }),

    /**
     * Cria um novo mês
     * @param input - Dados do mês (mes_referencia, label, status, observacoes)
     * @returns Mês criado
     */
    create: publicProcedure
      .input(
        z.object({
          mes_referencia: z.string(),
          label: z.string(),
          status: z.enum(["planejado", "em_andamento", "concluido"]).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createMes(input);
      }),

    /**
     * Atualiza um mês existente
     * @param input - ID do mês e dados a atualizar (todos opcionais exceto ID)
     * @returns Mês atualizado
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          ativo: z.number().optional(),
          status: z.enum(["planejado", "em_andamento", "concluido"]).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateMes(id, data);
      }),

    /**
     * Exclui um mês por ID
     * @param input - ID do mês
     * @returns Mês excluído
     */
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteMes(input.id);
      }),
  }),

  // Rotas de funções (cargos)
  funcoes: router({
    /** Lista todas as funções ativas */
    list: publicProcedure.query(async () => {
      return await getFuncoes();
    }),

    /** Cria uma nova função */
    create: publicProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return await createFuncao(input);
      }),

    /** Atualiza uma função existente */
    update: publicProcedure
      .input(z.object({ id: z.number(), nome: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateFuncao(id, data);
      }),

    /** Exclui uma função por ID */
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteFuncao(input.id);
      }),
  }),

  // Rotas de situações contratuais
  situacoes: router({
    /** Lista todas as situações ativas */
    list: publicProcedure.query(async () => {
      return await getSituacoes();
    }),

    /** Cria uma nova situação */
    create: publicProcedure
      .input(z.object({ nome: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return await createSituacao(input);
      }),

    /** Atualiza uma situação existente */
    update: publicProcedure
      .input(z.object({ id: z.number(), nome: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateSituacao(id, data);
      }),

    /** Exclui uma situação por ID */
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteSituacao(input.id);
      }),
  }),

  // Rotas de formas de pagamento
  formasPagamento: router({
    /** Lista todas as formas de pagamento ativas */
    list: publicProcedure.query(async () => {
      return await getFormasPagamento();
    }),

    /** Cria uma nova forma de pagamento */
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          tipo: z.enum(["pix", "conta", "dinheiro"]),
        })
      )
      .mutation(async ({ input }) => {
        return await createFormaPagamento(input);
      }),

    /** Atualiza uma forma de pagamento existente */
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).optional(),
          tipo: z.enum(["pix", "conta", "dinheiro"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateFormaPagamento(id, data);
      }),

    /** Exclui uma forma de pagamento por ID */
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteFormaPagamento(input.id);
      }),
  }),
});

/**
 * Tipo AppRouter exportado para uso no frontend
 * Permite que o frontend tenha type-safety ao chamar procedimentos
 */
export type AppRouter = typeof appRouter;
