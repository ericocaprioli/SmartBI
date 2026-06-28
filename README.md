# SmartBi - Sistema de Gestão de Folha de Pagamento e Produção

SmartBi é um sistema completo para gestão de folha de pagamento e controle de produção industrial, desenvolvido para simplificar o gerenciamento de funcionários, pagamentos e métricas de produtividade.

## 🚀 Funcionalidades

### Gestão de Funcionários
- Cadastro completo de funcionários
- Informações de cargo, situação contratual e forma de pagamento
- Gerenciamento de status (ativo/inativo)
- Integração com dados de pagamento e produção

### Folha de Pagamento
- Cálculo automático de salários líquidos
- Gestão de benefícios (salário família, prêmios, horas extras)
- Controle de descontos (INSS, descontos diversos)
- Cálculo de férias, 13º salário e terço de férias
- Geração de relatórios mensais por funcionário

### Controle de Produção
- Definição de metas diárias e mensais por funcionário
- Acompanhamento de produção realizada
- Cálculo de faturamento mensal
- Análise de eficiência (realizado vs meta)
- Dashboard visual com métricas de produtividade
- Cálculo de dias trabalhados, eficiência acumulada e saldo

### Cotações de Mercado
- Atualização automática de cotações (dólar, algodão, diesel)
- Coleta de dados via APIs externas (AwesomeAPI, Yahoo Finance)
- Atualização programada 2x ao dia
- Conversão automática para reais (R$/kg para algodão, R$/L para diesel)
- Histórico de preços com gráficos de tendência
- Cálculo de variação percentual
- Botão de atualização manual

### Relatórios e Análises
- Dashboard consolidado com KPIs principais
- Relatórios cruzados de custo por função
- Distribuição por situação contratual
- Análise de eficiência por funcionário e função
- Visão anual com consolidação mensal
- Gráficos interativos de barras e linhas

### Importação de Dados
- Importação de CSV para funcionários
- Importação de CSV para pagamentos
- Importação de CSV para produção
- Validação automática de dados

## 📋 Requisitos do Sistema

### Para Desenvolvimento Local
- Node.js 18 ou superior
- pnpm (gerenciador de pacotes)
- Navegador moderno (Chrome, Firefox, Edge)

### Para Uso (Cliente)
- Navegador moderno com JavaScript habilitado
- Conexão com internet (se hospedado na nuvem)

## 🛠️ Instalação e Execução

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ericocaprioli/SmartBI.git
cd SmartBI

# Instale as dependências
pnpm install
```

### Execução em Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev
```

O sistema estará disponível em `http://localhost:3000`

### Build para Produção

```bash
# Crie o build de produção
pnpm build

# Inicie o servidor de produção
pnpm start
```

## 📊 Estrutura do Sistema

### Navegação Principal

- **Home**: Página inicial com visão geral
- **Dashboard**: KPIs consolidados do sistema
- **Funcionários**: Gestão de cadastro de funcionários
- **Pagamentos**: Folha de pagamento mensal
- **Produção**: Controle de produção e metas
- **Cotações**: Cotações de mercado (dólar, algodão, diesel)
- **Relatórios**: Análises cruzadas de dados
- **Visão Anual**: Consolidação anual de métricas

### Componentes UI

O sistema utiliza componentes modernos da biblioteca shadcn/ui, incluindo:
- Tabelas interativas
- Gráficos de barras e linhas (Recharts)
- Formulários com validação
- Modais e diálogos
- Abas e acordeões
- Notificações toast

## 💾 Banco de Dados

O sistema utiliza SQLite como banco de dados local, com as seguintes tabelas:

- **users**: Usuários do sistema (autenticação)
- **funcionarios**: Cadastro de funcionários
- **pagamentos**: Dados de folha de pagamento
- **producao**: Dados de produção e metas
- **cotacoes**: Histórico de cotações de mercado (dólar, algodão, diesel)

## 🎯 Casos de Uso

### Para Gestores
- Acompanhar métricas de produtividade em tempo real
- Analisar custos de folha por função
- Identificar funcionários com baixa eficiência
- Tomar decisões baseadas em dados consolidados

### Para RH
- Gerenciar cadastro de funcionários
- Processar folha de pagamento mensal
- Controlar benefícios e descontos
- Gerar relatórios para auditoria

### Para Produção
- Definir metas de produção por funcionário
- Acompanhar realização diária e mensal
- Calcular faturamento por produção
- Identificar gargalos na linha de produção
- Acompanhar cotações de mercado relevantes (algodão, diesel)
- Monitorar variação cambial do dólar

## 🔒 Segurança

- Validação de dados em todas as entradas
- Proteção contra SQL injection (via Drizzle ORM)
- Autenticação de usuários (opcional)
- Variáveis de ambiente para dados sensíveis

## 📈 Métricas Disponíveis

### Dashboard Principal
- Total de funcionários ativos
- Custo total de folha do mês
- Faturamento total do mês
- Produção total realizada
- Eficiência média do time

### Relatórios
- Custo de folha por função
- Distribuição por situação contratual
- Eficiência por funcionário
- Eficiência média por função
- Margem (faturamento - custo)

### Visão Anual
- Evolução mensal de custos
- Evolução mensal de faturamento
- Evolução mensal de produção
- Comparativo custo vs faturamento

## 🐛 Suporte e Feedback

Para reportar bugs ou solicitar funcionalidades:
- Abra uma issue no GitHub
- Entre em contato com o suporte técnico

## 📝 Licença

Este projeto está sob licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📞 Contato

Para suporte e informações adicionais, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando React, TypeScript, Node.js e Drizzle ORM**
