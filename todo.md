# Payroll & Production Dashboard - TODO

## Banco de Dados
- [ ] Schema: Tabela `funcionarios` (nome, função, situação, forma_pagamento, pix, salario_base)
- [ ] Schema: Tabela `pagamentos` (funcionario_id, mes_referencia, dias_trabalhados, salario_bruto, familia, premio_producao, premio_assiduidade, hora_extra, inss, desconto, salario_liquido, ferias, terco_ferias, decimo_terceiro)
- [ ] Schema: Tabela `producao` (funcionario_id, mes_referencia, meta_dia, meta_mes, valor_peca, producao_realizada, faturamento_mensal)
- [ ] Executar migrations SQL no banco

## Backend (tRPC Procedures)
- [ ] Procedure: Listar funcionários
- [ ] Procedure: Criar/editar funcionário
- [ ] Procedure: Deletar funcionário
- [ ] Procedure: Registrar/editar folha de pagamento mensal
- [ ] Procedure: Calcular automaticamente provisões (férias, 13º)
- [ ] Procedure: Registrar/editar produção mensal
- [ ] Procedure: Listar pagamentos por mês/funcionário
- [ ] Procedure: Listar produção por mês/funcionário
- [ ] Procedure: Gerar KPIs do dashboard executivo
- [ ] Procedure: Gerar dados de produção (meta vs realizado)
- [ ] Procedure: Gerar relatórios cruzados (por função, situação)
- [ ] Procedure: Gerar visão anual (DASHBORD)

## Interface Visual - Estética CAD
- [ ] Configurar tema com fundo azul royal (#003D82 ou similar)
- [ ] Implementar grade de fundo (grid pattern)
- [ ] Tipografia: Sans-serif branca, negrita
- [ ] Componentes com molduras retangulares e marcadores de dimensão
- [ ] Paleta de cores: azul profundo + branco + acentos técnicos

## Páginas e Componentes
- [ ] Página: Home/Dashboard Executivo
- [ ] Página: Cadastro de Funcionários
- [ ] Página: Folha de Pagamento Mensal
- [ ] Página: Controle de Produção
- [ ] Página: Dashboard de Produção
- [ ] Página: Relatórios Cruzados
- [ ] Página: Visão Anual (DASHBORD)
- [ ] Componente: Tabela dinâmica com filtros
- [ ] Componente: Gráficos (barras, linhas, pizza)
- [ ] Componente: Cards de KPI
- [ ] Componente: Formulário de entrada de dados

## Dashboards e Relatórios
- [ ] Dashboard Executivo: Total salários, descontos, média salarial, funcionários ativos, custo total
- [ ] Dashboard Produção: Meta vs Realizado, eficiência diária/acumulada, saldo acumulado
- [ ] Relatório: Custo de folha por função
- [ ] Relatório: Distribuição por situação contratual
- [ ] Relatório: Eficiência de produção por funcionário
- [ ] Visão Anual (DASHBORD): Totais mensais consolidados

## Filtros Interativos
- [ ] Filtro por mês
- [ ] Filtro por ano
- [ ] Filtro por funcionário
- [ ] Filtro por situação contratual
- [ ] Aplicar filtros em todos os relatórios

## Importação de Dados
- [ ] Criar interface de upload de arquivo Excel
- [ ] Parser para ler dados da planilha
- [ ] Validação de dados antes de importar
- [ ] Inserir dados no banco de dados
- [ ] Feedback de sucesso/erro ao usuário

## Testes e Validação
- [ ] Testes unitários para cálculos de folha
- [ ] Testes para cálculos de provisões
- [ ] Testes de importação de dados
- [ ] Validação de integridade de dados
- [ ] Testes de interface (screenshots)

## Entrega
- [ ] Revisar todo o sistema
- [ ] Criar checkpoint final
- [ ] Documentar funcionalidades
- [ ] Apresentar ao cliente
