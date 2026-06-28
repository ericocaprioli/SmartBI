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
 * Lista de meses disponíveis para seleção no controle de produção
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
 * Producao é a página de gerenciamento de controle de produção
 * 
 * Funcionalidades:
 * - Seleção de mês para registro de produção
 * - Registro de metas diárias e mensais
 * - Registro de valor por peça
 * - Registro de produção realizada
 * - Cálculo automático de meta mensal (meta dia * 30)
 * - Cálculo automático de faturamento mensal (produção * valor peça)
 * - Cálculo de eficiência (realizado / meta * 100)
 * - Importação de produção de arquivo CSV
 * - Download de template CSV para importação
 * - Exibição de tabela com todos os registros do mês
 * - Conversão de valores de centavos para reais na exibição
 * 
 * Cálculos realizados:
 * - Meta mensal (meta diária * 30 dias)
 * - Faturamento mensal (produção realizada * valor por peça)
 * - Eficiência (produção realizada / meta mensal * 100)
 */
export default function Producao() {
  // Estado para mês selecionado (padrão: junho 2026)
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  
  // Estado para controlar abertura do modal de criação
  const [open, setOpen] = useState(false);
  
  // Estado para controlar abertura do modal de importação CSV
  const [importOpen, setImportOpen] = useState(false);
  
  // Estado para armazenar dados do formulário de produção
  const [formData, setFormData] = useState({
    funcionario_id: 0,
    mes_referencia: mesSelecionado,
    meta_dia: 0,
    meta_mes: 0,
    valor_peca: 0,
    producao_realizada: 0,
  });

  // Query para listar produção do mês selecionado
  const { data: producao, refetch } = trpc.producao.listByMes.useQuery(mesSelecionado);
  
  // Query para listar funcionários para seleção
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  
  // Mutation para criar novo registro de produção
  const createMutation = trpc.producao.create.useMutation();
  
  // Mutation para importar produção de CSV
  const importMutation = trpc.producao.importCSV.useMutation();

  /**
 * handleSubmit processa o formulário de registro de produção
 * 
 * Validações:
 * - Funcionário deve ser selecionado
 * - Meta diária deve ser maior que 0
 * - Valor por peça deve ser maior que 0
 * 
 * Cálculos realizados:
 * 1. Calcula meta mensal (meta diária * 30 dias)
 * 2. Calcula faturamento mensal (produção realizada * valor por peça)
 * 
 * Processo:
 * 1. Valida campos obrigatórios
 * 2. Realiza cálculos automáticos
 * 3. Chama mutation de criação
 * 4. Limpa formulário em caso de sucesso
 * 5. Fecha modal
 * 6. Recarrega lista de produção
 */
  const handleSubmit = async () => {
    // Valida campos obrigatórios
    if (formData.funcionario_id <= 0 || formData.meta_dia <= 0 || formData.valor_peca <= 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      // Calcula meta mensal (meta diária * 30 dias)
      const metaMes = formData.meta_dia * 30;
      // Calcula faturamento mensal (produção realizada * valor por peça)
      const faturamentoMensal = formData.producao_realizada * formData.valor_peca;

      // Chama mutation para criar produção com cálculos automáticos
      await createMutation.mutateAsync({
        ...formData,
        mes_referencia: mesSelecionado,
        meta_mes: metaMes,
        faturamento_mensal: faturamentoMensal,
      });

      toast.success("Produção registrada com sucesso");
      // Limpa formulário
      setFormData({
        funcionario_id: 0,
        mes_referencia: mesSelecionado,
        meta_dia: 0,
        meta_mes: 0,
        valor_peca: 0,
        producao_realizada: 0,
      });
      // Fecha modal
      setOpen(false);
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error("Erro ao registrar produção");
    }
  };

  /**
 * handleImportCSV processa importação de produção de arquivo CSV
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

  /**
 * getFuncionarioNome busca o nome do funcionário pelo ID
 * @param id - ID do funcionário
 * @returns Nome do funcionário ou string padrão se não encontrado
 */
  const getFuncionarioNome = (id: number) => {
    return funcionarios?.find((f) => f.id === id)?.nome || `Funcionário ${id}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e botões de ação */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CONTROLE DE PRODUÇÃO</h1>
            <p className="text-muted-foreground dimension-marker">Registro de metas e produção mensal</p>
          </div>
          <div className="flex gap-4">
            {/* Dropdown para seleção de mês */}
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
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
                    O CSV deve conter as colunas: funcionario_id, mes_referencia, meta_dia, meta_mes, valor_peca, producao_realizada, faturamento_mensal, dias_trabalhados, eficiencia, producao_percentual, saldo, eficiencia_acumulada
                  </p>
                  <Button
                    className="gradient-button w-full mt-2"
                    variant="outline"
                    onClick={() => window.open('/csv-templates/producao_template.csv', '_blank')}
                  >
                    BAIXAR TEMPLATE
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Dialog de registro de produção */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button">+ REGISTRAR PRODUÇÃO</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border">
                <DialogHeader>
                  <DialogTitle className="text-white">REGISTRAR PRODUÇÃO</DialogTitle>
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
                  {/* Campo: Meta Diária */}
                  <div>
                    <label className="text-sm dimension-marker">META DIÁRIA (peças)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.meta_dia}
                      onChange={(e) => setFormData({ ...formData, meta_dia: parseInt(e.target.value) })}
                    />
                  </div>
                  {/* Campo: Valor por Peça (divide por 100 para exibição) */}
                  <div>
                    <label className="text-sm dimension-marker">VALOR POR PEÇA (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.valor_peca / 100}
                      onChange={(e) => setFormData({ ...formData, valor_peca: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Produção Realizada */}
                  <div>
                    <label className="text-sm dimension-marker">PRODUÇÃO REALIZADA (peças)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.producao_realizada}
                      onChange={(e) => setFormData({ ...formData, producao_realizada: parseInt(e.target.value) })}
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

        {/* Tabela de Produção */}
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">META DIA</th>
                <th className="text-left p-3 dimension-marker">META MÊS</th>
                <th className="text-left p-3 dimension-marker">VALOR/PEÇA</th>
                <th className="text-left p-3 dimension-marker">REALIZADO</th>
                <th className="text-left p-3 dimension-marker">FATURAMENTO</th>
                <th className="text-left p-3 dimension-marker">EFICIÊNCIA</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia produção para linhas da tabela */}
              {producao?.map((p) => {
                // Calcula eficiência (realizado / meta * 100)
                const eficiencia = (p.meta_mes ?? 0) > 0 ? (((p.producao_realizada ?? 0) / (p.meta_mes ?? 0)) * 100).toFixed(1) : "0";
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{getFuncionarioNome(p.funcionario_id)}</td>
                    <td className="p-3 text-white">{p.meta_dia || 0}</td>
                    <td className="p-3 text-white">{p.meta_mes || 0}</td>
                    {/* Converte centavos para reais */}
                    <td className="p-3 text-white">R$ {((p.valor_peca ?? 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">{p.producao_realizada || 0}</td>
                    {/* Converte centavos para reais */}
                    <td className="p-3 text-white">R$ {((p.faturamento_mensal ?? 0) / 100).toFixed(2)}</td>
                    {/* Exibe eficiência em porcentagem */}
                    <td className="p-3 text-white">{eficiencia}%</td>
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
