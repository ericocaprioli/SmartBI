# Guia de Importação CSV - SmartBi

Este guia explica como formatar corretamente os arquivos CSV para importação no sistema SmartBi.

## Formato Geral dos Arquivos CSV

- **Codificação**: UTF-8
- **Separador**: Vírgula (`,`)
- **Delimitador de texto**: Aspas duplas (`"`) quando necessário
- **Primeira linha**: Cabeçalho com nomes das colunas
- **Decimais**: Ponto (`.`) não vírgula
- **Datas**: Formato ISO (YYYY-MM-DD)

## Template de Funcionários

### Colunas Obrigatórias

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| nome | Texto | Nome completo do funcionário | João Silva |
| funcao | Texto | Cargo/função do funcionário | Operador |
| situacao | Texto | Situação contratual (CLT, Contrato, Experiência) | CLT |
| forma_pagamento | Texto | Forma de pagamento (Pix, Transferência, etc.) | Pix |
| pix | Texto | Chave PIX para pagamento (opcional) | 12345678900 |
| salario_base | Decimal | Salário base em reais | 2500.00 |

### Exemplo de Arquivo CSV

```csv
nome,funcao,situacao,forma_pagamento,pix,salario_base
João Silva,Operador,CLT,Pix,12345678900,2500.00
Maria Santos,Supervisor,Contrato,Pix,98765432100,3500.00
Pedro Costa,Auxiliar,Experiência,Pix,55555555500,2200.00
```

### Observações

- **salario_base**: Deve ser em reais com duas casas decimais
- **situacao**: Valores aceitos: CLT, Contrato, Experiência
- **forma_pagamento**: Exemplos: Pix, Transferência, Dinheiro
- **pix**: Campo opcional, pode ser deixado em branco
- O sistema gera automaticamente o ID e marca como ativo

---

## Template de Pagamentos

### Colunas Obrigatórias

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| funcionario_id | Número | ID do funcionário (deve existir no sistema) | 1 |
| mes_referencia | Texto | Mês de referência (YYYY-MM) | 2026-06 |
| dias_trabalhados | Número | Dias trabalhados no mês | 22 |
| salario_base_mes | Número | Salário base do mês em centavos | 250000 |
| valor_dia | Número | Valor por dia em centavos | 8333 |
| salario_bruto | Número | Salário bruto em centavos | 183333 |
| salario_familia | Número | Salário família em centavos | 0 |
| premio_producao | Número | Prêmio produção em centavos | 0 |
| premio_assiduidade | Número | Prêmio assiduidade em centavos | 0 |
| hora_extra | Número | Horas extras em centavos | 0 |
| inss | Número | Desconto INSS em centavos | 0 |
| desconto_diversos | Número | Descontos diversos em centavos | 0 |
| salario_liquido | Número | Salário líquido em centavos | 183333 |
| ferias | Número | Valor férias em centavos | 0 |
| terco_ferias | Número | Terço de férias em centavos | 0 |
| decimo_terceiro | Número | 13º salário em centavos | 0 |

### Correspondência com Planilha

| Coluna do Sistema | Coluna da Planilha |
|-------------------|-------------------|
| funcionario_id | Qtdd Func |
| mes_referencia | Mês Referência |
| dias_trabalhados | Dias Trabalhados |
| salario_base_mes | Salário Base |
| valor_dia | Valor R$ Dia |
| salario_bruto | Salário |
| salario_familia | Salário Família |
| premio_producao | Prêmio Produção |
| premio_assiduidade | Prêmio Assiduidade |
| hora_extra | Hora Extra |
| inss | INSS |
| desconto_diversos | Desconto |
| salario_liquido | Salário Líquido |
| ferias | Férias |
| terco_ferias | 1/3 Férias |
| decimo_terceiro | 13º Salário |

### Exemplo de Arquivo CSV

```csv
funcionario_id,mes_referencia,dias_trabalhados,salario_base_mes,valor_dia,salario_bruto,salario_familia,premio_producao,premio_assiduidade,hora_extra,inss,desconto_diversos,salario_liquido,ferias,terco_ferias,decimo_terceiro
1,2026-06,22,250000,8333,183333,0,0,0,0,0,0,183333,0,0,0
2,2026-06,22,350000,11666,256666,0,0,0,0,0,0,256666,0,0,0
```

### Observações Importantes

- **funcionario_id**: Deve corresponder a um funcionário cadastrado no sistema (obtido do cadastro de funcionários)
- **Valores monetários**: Em CENTAVOS (250000 = R$ 2.500,00)
- **mes_referencia**: Formato YYYY-MM (2026-06 = junho de 2026)
- **Campos opcionais**: Podem ser 0 se não aplicável
- **Nome do funcionário**: Não é usado no CSV, apenas o ID

---

## Template de Produção

### Colunas Obrigatórias

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| funcionario_id | Número | ID do funcionário (deve existir no sistema) | 1 |
| mes_referencia | Texto | Mês de referência (YYYY-MM) | 2026-06 |
| meta_dia | Número | Meta diária de produção | 750 |
| meta_mes | Número | Meta mensal de produção | 16500 |
| valor_peca | Número | Valor por peça em centavos | 100 |
| producao_realizada | Número | Produção realizada no mês | 15016 |
| faturamento_mensal | Número | Faturamento mensal em centavos | 1501600 |
| dias_trabalhados | Número | Dias trabalhados no mês | 22 |
| eficiencia | Número | Eficiência diária (realizado / meta_dia * 100) | 2003 |
| producao_percentual | Número | Percentual de produção acumulada | 91 |
| saldo | Número | Saldo de produção (realizado - meta) | 1484 |
| eficiencia_acumulada | Número | Eficiência acumulada no mês | 91 |

### Correspondência com Planilha Oficial

| Coluna do Sistema | Coluna da Planilha |
|-------------------|-------------------|
| funcionario_id | Qtdd Func |
| mes_referencia | Mês Referência |
| meta_dia | Meta Dia |
| meta_mes | Meta Mês |
| valor_peca | Valor Peça |
| producao_realizada | Realizado |
| faturamento_mensal | Faturamento Mensal |
| dias_trabalhados | Dias Trabalhados |
| eficiencia | Eficiência |
| producao_percentual | Produção (%) |
| saldo | Saldo |
| eficiencia_acumulada | Eficiência Acumulada |

### Exemplo de Arquivo CSV

```csv
funcionario_id,mes_referencia,meta_dia,meta_mes,valor_peca,producao_realizada,faturamento_mensal,dias_trabalhados,eficiencia,producao_percentual,saldo,eficiencia_acumulada
1,2026-06,750,16500,100,15016,1501600,22,2003,91,1484,91
2,2026-06,800,24000,120,18000,2160000,22,2250,75,6000,75
```

### Observações Importantes

- **funcionario_id**: Deve corresponder a um funcionário cadastrado no sistema (obtido do cadastro de funcionários)
- **meta_mes**: Geralmente é meta_dia × dias_trabalhados
- **valor_peca**: Em CENTAVOS (100 = R$ 1,00 por peça)
- **faturamento_mensal**: Em CENTAVOS (producao_realizada × valor_peca)
- **eficiencia**: Calculada como (producao_realizada / meta_dia) × 100
- **producao_percentual**: Percentual da meta mensal alcançada
- **saldo**: Diferença entre produção realizada e meta (pode ser negativo)
- **eficiencia_acumulada**: Eficiência média acumulada no mês

---

## Como Criar Arquivos CSV

### Usando Excel

1. Abra o Excel
2. Insira os dados conforme as colunas especificadas
3. Clique em **Arquivo** > **Salvar Como**
4. Selecione **CSV (Separado por vírgulas) (*.csv)**
5. Escolha a codificação **UTF-8**
6. Salve o arquivo

### Usando Google Sheets

1. Crie uma nova planilha
2. Insira os dados conforme as colunas especificadas
3. Clique em **Arquivo** > **Fazer download** > **Valores separados por vírgula (.csv)**
4. O arquivo será baixado no formato correto

### Usando Bloco de Notas/Editor de Texto

1. Abra o editor de texto
2. Digite os dados separados por vírgulas
3. Salve o arquivo com extensão `.csv`
4. Certifique-se de usar codificação UTF-8

---

## Validação Antes da Importação

### Checklist

- [ ] Arquivo está em formato CSV
- [ ] Codificação é UTF-8
- [ ] Primeira linha contém os cabeçalhos corretos
- [ ] Todas as colunas obrigatórias estão presentes
- [ ] IDs de funcionários existem no sistema
- [ ] Valores monetários estão em centavos (exceto funcionários)
- [ ] Datas estão no formato YYYY-MM-DD ou YYYY-MM
- [ ] Não há caracteres especiais inválidos
- [ ] Arquivo não está vazio

---

## Erros Comuns e Soluções

### Erro: "Coluna não encontrada"

**Causa**: Nome da coluna no cabeçalho não corresponde ao esperado
**Solução**: Verifique se os nomes das colunas estão exatamente como especificado

### Erro: "Funcionário não encontrado"

**Causa**: ID do funcionário não existe no sistema
**Solução**: Cadastre o funcionário primeiro ou verifique o ID correto

### Erro: "Valor inválido"

**Causa**: Formato incorreto de número ou data
**Solução**: Use ponto para decimais, formato YYYY-MM-DD para datas

### Erro: "Arquivo vazio"

**Causa**: Arquivo CSV não contém dados além do cabeçalho
**Solução**: Adicione pelo menos uma linha de dados

---

## Download de Templates

O sistema oferece templates prontos para download:

1. Acesse a página desejada (Funcionários, Pagamentos ou Produção)
2. Clique no botão **IMPORTAR CSV**
3. Clique em **BAIXAR TEMPLATE**
4. Use o template como base para seus dados

---

## Suporte

Para dúvidas sobre importação de CSV:
- Consulte este guia
- Entre em contato com o suporte técnico
- Verifique os logs do sistema para mensagens de erro específicas
