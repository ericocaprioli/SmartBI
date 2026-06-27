import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
import { pagamentos, producao } from "../drizzle/schema";
import { getDb } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  funcionarios: router({
    list: publicProcedure.query(async () => {
      return await getFuncionarios();
    }),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getFuncionarioById(input);
    }),
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
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importFuncionariosCSV(input.csvContent);
      }),
  }),

  pagamentos: router({
    listByMes: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getPagamentosByMes(input);
    }),
    listAll: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(pagamentos);
    }),
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
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importPagamentosCSV(input.csvContent);
      }),
  }),

  producao: router({
    listByMes: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getProducaoByMes(input);
    }),
    listAll: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(producao);
    }),
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
    importCSV: publicProcedure
      .input(z.object({ csvContent: z.string() }))
      .mutation(async ({ input }) => {
        return await importProducaoCSV(input.csvContent);
      }),
  }),

  dashboard: router({
    getKPIs: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getKPIsDashboard(input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
