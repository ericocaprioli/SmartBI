// Importação do hook useState para gerenciar estado local
import { useState } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

// Importação do toast para notificações
import { toast } from "sonner";

// Importação do ícone Upload do Lucide React
import { Upload } from "lucide-react";

/**
 * Lista de meses disponíveis para seleção na folha de pagamento
 * Cada objeto contém valor (formato YYYY-MM) e label exibido
 */
const MESES = [
  { value: "2026-01", label: "Janeiro 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Maio 2026" },
  { value: "2026-06", label: "Junho 2026" },
];

/**
 * Pagamentos é a página de gerenciamento de folha de pagamento
 * 
 * Funcionalidades:
 * - Seleção de mês para registro de pagamentos
 * - Registro de pagamentos por funcionário
 * - Cálculo automático de salários (bruto, líquido)
 * - Registro de proventos (salário família, prêmios, horas extras, férias, 13º)
 * - Registro de descontos (INSS, diversos)
 * - Importação de pagamentos de arquivo CSV
 * - Download de template CSV para importação
 * - Exibição de tabela com todos os pagamentos do mês
 * - Conversão de valores de centavos para reais na exibição
 * 
 * Cálculos realizados:
 * - Salário base do mês (do funcionário)
 * - Valor diário (salário base / 30)
 * - Salário bruto (valor dia * dias trabalhados)
 * - Total de proventos (soma de todos os benefícios)
 * - Total de descontos (INSS + descontos diversos)
 * - Salário líquido (proventos - descontos)
 */
export default function Pagamentos() {
  // Estado para mês selecionado (padrão: junho 2026)
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  // Estado para controlar abertura do modal de criação
  const [open, setOpen] = useState(false);
  
  // Estado para controlar abertura do modal de importação CSV
  const [importOpen, setImportOpen] = useState(false);
  
  // Estado para armazenar dados do formulário de pagamento
  const [formData, setFormData] = useState({
    funcionario_id: 0,
    mes_referencia: mesSelecionado,
    dias_trabalhados: 0,
    salario_base_mes: 0,
    valor_dia: 0,
    salario_bruto: 0,
    salario_familia: 0,
    premio_producao: 0,
    premio_assiduidade: 0,
    hora_extra: 0,
    inss: 0,
    desconto_diversos: 0,
    ferias: 0,
    terco_ferias: 0,
    decimo_terceiro: 0,
  });

  // Query para listar pagamentos do mês selecionado
  const { data: pagamentos, refetch } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  
  // Query para listar funcionários para seleção
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  
  // Mutation para criar novo pagamento
  const createMutation = trpc.pagamentos.create.useMutation();
  
  // Mutation para importar pagamentos de CSV
  const importMutation = trpc.pagamentos.importCSV.useMutation();

  /**
 * handleSubmit processa o formulário de registro de pagamento
 * 
 * Validações:
 * - Funcionário deve ser selecionado
 * - Dias trabalhados deve ser maior que 0
 * 
 * Cálculos realizados:
 * 1. Busca salário base do funcionário
 * 2. Calcula valor diário (salário base / 30)
 * 3. Calcula salário bruto (valor dia * dias trabalhados)
 * 4. Soma total de proventos (bruto + benefícios)
 * 5. Soma total de descontos (INSS + diversos)
 * 6. Calcula salário líquido (proventos - descontos)
 * 
 * Processo:
 * 1. Valida campos obrigatórios
 * 2. Realiza cálculos automáticos
 * 3. Chama mutation de criação
 * 4. Limpa formulário em caso de sucesso
 * 5. Fecha modal
 * 6. Recarrega lista de pagamentos
 */
  const handleSubmit = async () => {
    // Valida campos obrigatórios
    if (formData.funcionario_id <= 0 || formData.dias_trabalhados <= 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      // Busca funcionário selecionado
      const funcionario = funcionarios?.find((f) => f.id === formData.funcionario_id);
      // Obtém salário base do funcionário
      const salarioBaseMes = funcionario?.salario_base || 0;
      // Calcula valor diário (salário base / 30 dias)
      const valorDia = Math.round(salarioBaseMes / 30);
      // Calcula salário bruto (valor dia * dias trabalhados)
      const salarioBruto = valorDia * formData.dias_trabalhados;
      // Soma total de proventos (bruto + todos os benefícios)
      const totalProventos = salarioBruto + formData.salario_familia + formData.premio_producao + formData.premio_assiduidade + formData.hora_extra + formData.ferias + formData.terco_ferias + formData.decimo_terceiro;
      // Soma total de descontos
      const totalDescontos = formData.inss + formData.desconto_diversos;
      // Calcula salário líquido (proventos - descontos)
      const salarioLiquido = totalProventos - totalDescontos;

      // Chama mutation para criar pagamento com cálculos automáticos
      await createMutation.mutateAsync({
        ...formData,
        mes_referencia: mesSelecionado,
        salario_base_mes: salarioBaseMes,
        valor_dia: valorDia,
        salario_bruto: salarioBruto,
        salario_liquido: salarioLiquido,
      });

      toast.success("Pagamento registrado com sucesso");
      // Limpa formulário
      setFormData({
        funcionario_id: 0,
        mes_referencia: mesSelecionado,
        dias_trabalhados: 0,
        salario_base_mes: 0,
        valor_dia: 0,
        salario_bruto: 0,
        salario_familia: 0,
        premio_producao: 0,
        premio_assiduidade: 0,
        hora_extra: 0,
        inss: 0,
        desconto_diversos: 0,
        ferias: 0,
        terco_ferias: 0,
        decimo_terceiro: 0,
      });
      // Fecha modal
      setOpen(false);
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  /**
 * handleImportCSV processa importação de pagamentos de arquivo CSV
 * 
 * Processo:
 * 1. Lê arquivo selecionado pelo usuário
 * 2. Conteúdo do arquivo é lido como texto
 * 3. Chama mutation de importação com conteúdo CSV
 * 4. Conta sucessos e falhas
 * 5. Exibe resultado ao usuário
 * 6. Fecha modal e recarrega lista
 */
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Obtém arquivo selecionado
    const file = e.target.files?.[0];
    if (!file) return;

    // Cria FileReader para ler conteúdo do arquivo
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Obtém conteúdo do arquivo como string
      const csvContent = event.target?.result as string;
      try {
        // Chama mutation de importação
        const result = await importMutation.mutateAsync({ csvContent });
        // Conta registros importados com sucesso
        const successCount = result.filter((r: any) => r.success).length;
        // Conta registros com erro
        const failCount = result.filter((r: any) => !r.success).length;
        toast.success(`Importação concluída: ${successCount} registros importados, ${failCount} erros`);
        // Fecha modal
        setImportOpen(false);
        // Recarrega lista
        refetch();
      } catch (error) {
        toast.error("Erro ao importar CSV");
      }
    };
    // Lê arquivo como texto
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e botões de ação */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">FOLHA DE PAGAMENTO</h1>
            <p className="text-muted-foreground dimension-marker">Registro mensal de pagamentos</p>
          </div>
          <div className="flex gap-4">
            {/* Dropdown para seleção de mês */}
            <Select value={mesSelecionado} onValueChange={(value) => {
              setMesSelecionado(value);
              // Atualiza mês de referência no formulário
              setFormData((prev) => ({ ...prev, mes_referencia: value }));
            }}>
              <SelectTrigger className="w-48 cad-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Dialog de importação CSV */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  IMPORTAR CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border">
                <DialogHeader>
                  <DialogTitle className="text-white">IMPORTAR CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm dimension-marker">ARQUIVO CSV</label>
                    <Input
                      className="cad-input mt-1"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      disabled={importMutation.isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O CSV deve conter as colunas: funcionario_id, mes_referencia, dias_trabalhados, salario_base_mes, valor_dia, salario_bruto, salario_familia, premio_producao, premio_assiduidade, hora_extra, inss, desconto_diversos, salario_liquido, ferias, terco_ferias, decimo_terceiro
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Correspondência: Qtdd Func, Mês Referência, Dias Trabalhados, Salário Base, Valor R$ Dia, Salário, Salário Família, Prêmio Produção, Prêmio Assiduidade, Hora Extra, INSS, Desconto, Salário Líquido, Férias, 1/3 Férias, 13º Salário
                  </p>
                  <Button
                    className="gradient-button w-full mt-2"
                    variant="outline"
                    onClick={() => window.open('/csv-templates/pagamentos_template.csv', '_blank')}
                  >
                    BAIXAR TEMPLATE
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Dialog de registro de pagamento */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button">+ REGISTRAR PAGAMENTO</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border">
                <DialogHeader>
                  <DialogTitle className="text-white">REGISTRAR PAGAMENTO</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Campo: Seleção de Funcionário */}
                  <div>
                    <label className="text-sm dimension-marker">FUNCIONÁRIO</label>
                    <Select value={formData.funcionario_id.toString()} onValueChange={(value) => setFormData({ ...formData, funcionario_id: parseInt(value) })}>
                      <SelectTrigger className="cad-input mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios?.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Campo: Dias Trabalhados */}
                  <div>
                    <label className="text-sm dimension-marker">DIAS TRABALHADOS</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.dias_trabalhados}
                      onChange={(e) => setFormData({ ...formData, dias_trabalhados: parseInt(e.target.value) })}
                    />
                  </div>
                  {/* Campo: Salário Família (divide por 100 para exibição) */}
                  <div>
                    <label className="text-sm dimension-marker">SALÁRIO FAMÍLIA (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.salario_familia / 100}
                      onChange={(e) => setFormData({ ...formData, salario_familia: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Prêmio Produção */}
                  <div>
                    <label className="text-sm dimension-marker">PRÊMIO PRODUÇÃO (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.premio_producao / 100}
                      onChange={(e) => setFormData({ ...formData, premio_producao: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Prêmio Assiduidade */}
                  <div>
                    <label className="text-sm dimension-marker">PRÊMIO ASSIDUIDADE (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.premio_assiduidade / 100}
                      onChange={(e) => setFormData({ ...formData, premio_assiduidade: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Hora Extra */}
                  <div>
                    <label className="text-sm dimension-marker">HORA EXTRA (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.hora_extra / 100}
                      onChange={(e) => setFormData({ ...formData, hora_extra: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Férias */}
                  <div>
                    <label className="text-sm dimension-marker">FERÍAS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.ferias / 100}
                      onChange={(e) => setFormData({ ...formData, ferias: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: 1/3 Férias */}
                  <div>
                    <label className="text-sm dimension-marker">1/3 FERÍAS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.terco_ferias / 100}
                      onChange={(e) => setFormData({ ...formData, terco_ferias: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: 13º Salário */}
                  <div>
                    <label className="text-sm dimension-marker">13º SALÁRIO (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.decimo_terceiro / 100}
                      onChange={(e) => setFormData({ ...formData, decimo_terceiro: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: INSS */}
                  <div>
                    <label className="text-sm dimension-marker">INSS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.inss / 100}
                      onChange={(e) => setFormData({ ...formData, inss: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Descontos Diversos */}
                  <div>
                    <label className="text-sm dimension-marker">DESCONTOS DIVERSOS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.desconto_diversos / 100}
                      onChange={(e) => setFormData({ ...formData, desconto_diversos: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Botão de salvar */}
                  <Button onClick={handleSubmit} className="gradient-button w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabela de Pagamentos */}
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">MÊS REFERÊNCIA</th>
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BASE</th>
                <th className="text-left p-3 dimension-marker">VALOR R$ DIA</th>
                <th className="text-left p-3 dimension-marker">DIAS TRABALHADOS</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO FAMÍLIA</th>
                <th className="text-left p-3 dimension-marker">PRÊMIO PRODUÇÃO</th>
                <th className="text-left p-3 dimension-marker">ASSIDUIDADE</th>
                <th className="text-left p-3 dimension-marker">HORA EXTRA</th>
                <th className="text-left p-3 dimension-marker">INSS</th>
                <th className="text-left p-3 dimension-marker">DESCONTO</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO LÍQUIDO</th>
                <th className="text-left p-3 dimension-marker">FÉRIAS</th>
                <th className="text-left p-3 dimension-marker">1/3 FÉRIAS</th>
                <th className="text-left p-3 dimension-marker">13º SALÁRIO</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia pagamentos para linhas da tabela */}
              {pagamentos?.map((p) => {
                // Busca nome do funcionário
                const funcionario = funcionarios?.find((f) => f.id === p.funcionario_id);
                // Calcula total de descontos
                const descontos = (p.inss || 0) + (p.desconto_diversos || 0);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{p.mes_referencia}</td>
                    <td className="p-3 text-white">{funcionario?.nome || `Funcionário ${p.funcionario_id}`}</td>
                    {/* Converte centavos para reais */}
                    <td className="p-3 text-white">R$ {(p.salario_base_mes / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.valor_dia / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">{p.dias_trabalhados || 0}</td>
                    <td className="p-3 text-white">R$ {(p.salario_bruto / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.salario_familia / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.premio_producao / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.premio_assiduidade / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.hora_extra / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.inss / 100).toFixed(2)}</td>
                    {/* Exibe total de descontos */}
                    <td className="p-3 text-white">R$ {(((p.inss || 0) + (p.desconto_diversos || 0)) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.salario_liquido / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.ferias / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.terco_ferias / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.decimo_terceiro / 100).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
