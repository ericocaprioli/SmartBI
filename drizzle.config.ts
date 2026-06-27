// Importação da função defineConfig do drizzle-kit
import { defineConfig } from "drizzle-kit";

/**
 * Obtém a string de conexão do banco de dados
 * Usa variável de ambiente DATABASE_URL ou caminho padrão para arquivo SQLite
 */
const connectionString = process.env.DATABASE_URL || "./smartbi.db";

/**
 * Configuração do Drizzle Kit para gerenciamento do banco de dados
 * Define o dialeto SQLite, caminho do schema e diretório de saída
 */
export default defineConfig({
  schema: "./drizzle/schema.ts", // Caminho para o arquivo de schema do banco
  out: "./drizzle", // Diretório onde as migrações serão geradas
  dialect: "sqlite", // Dialeto do banco de dados (SQLite)
  dbCredentials: {
    url: connectionString, // URL de conexão com o banco
  },
});
