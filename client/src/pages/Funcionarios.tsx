// Importação do hook useState para gerenciar estado local
import { useState } from "react";

// Importação do cliente tRPC para chamadas de API
import { trpc } from "@/lib/trpc";

// Importação de componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Importação do layout do dashboard
import DashboardLayout from "@/components/DashboardLayout";

// Importação do toast para notificações
import { toast } from "sonner";

// Importação dos ícones Upload e Trash do Lucide React
import { Upload, Trash2 } from "lucide-react";

/**
 * Funcionários é a página de gerenciamento de funcionários
 * 
 * Funcionalidades:
 * - Listar todos os funcionários ativos
 * - Criar novo funcionário via formulário
 * - Importar funcionários de arquivo CSV
 * - Download de template CSV para importação
 * - Exibir dados em tabela formatada
 * - Conversão de salário de centavos para reais na exibição
 * 
 * Componentes UI utilizados:
 * - DashboardLayout: layout padrão do dashboard
 * - Dialog: modal para formulário de criação
 * - Table: tabela para listagem de funcionários
 * - Select: dropdown para seleção de situação
 * - Input: campos de entrada de dados
 * - Button: botões de ação
 */
export default function Funcionarios() {
  // Estado para controlar abertura do modal de criação
  const [open, setOpen] = useState(false);
  
  // Estado para controlar abertura do modal de importação CSV
  const [importOpen, setImportOpen] = useState(false);
  
  // Estado para armazenar dados do formulário de criação
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "",
    situacao: "CLT" as const,
    forma_pagamento: "Pix",
    pix: "",
    salario_base: 0,
  });

  // Query para listar funcionários
  const { data: funcionarios, refetch } = trpc.funcionarios.list.useQuery();
  
  // Mutation para criar novo funcionário
  const createMutation = trpc.funcionarios.create.useMutation();
  
  // Mutation para importar funcionários de CSV
  const importMutation = trpc.funcionarios.importCSV.useMutation();
  
  // Mutation para excluir funcionário
  const deleteMutation = trpc.funcionarios.delete.useMutation();

  /**
   * handleSubmit processa o formulário de criação de funcionário
   * 
   * Validações:
   * - Nome é obrigatório
   * - Função é obrigatória
   * - Salário base deve ser maior que 0
   * 
 * Processo:
   * 1. Valida campos obrigatórios
   * 2. Chama mutation de criação
   * 3. Limpa formulário em caso de sucesso
   * 4. Fecha modal
   * 5. Recarrega lista de funcionários
   */
  const handleSubmit = async () => {
    // Valida campos obrigatórios
    if (!formData.nome || !formData.funcao || formData.salario_base <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Chama mutation para criar funcionário
      await createMutation.mutateAsync(formData);
      toast.success("Funcionário criado com sucesso");
      // Limpa formulário
      setFormData({
        nome: "",
        funcao: "",
        situacao: "CLT",
        forma_pagamento: "Pix",
        pix: "",
        salario_base: 0,
      });
      // Fecha modal
      setOpen(false);
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error("Erro ao criar funcionário");
    }
  };

  /**
   * handleImportCSV processa importação de funcionários de arquivo CSV
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
   * handleDelete processa exclusão de funcionário
   * 
   * Processo:
   * 1. Confirma exclusão com usuário
   * 2. Chama mutation de exclusão (soft delete)
   * 3. Exibe mensagem de sucesso
   * 4. Recarrega lista de funcionários
   * 
   * @param id - ID do funcionário a excluir
   * @param nome - Nome do funcionário para confirmação
   */
  const handleDelete = async (id: number, nome: string) => {
    // Confirma exclusão com usuário
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${nome}"?`)) {
      return;
    }

    try {
      // Chama mutation de exclusão
      await deleteMutation.mutateAsync(id);
      toast.success("Funcionário excluído com sucesso");
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir funcionário");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho com título e botões de ação */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CADASTRO DE FUNCIONÁRIOS</h1>
            <p className="text-muted-foreground dimension-marker">Gerenciamento de dados cadastrais</p>
          </div>
          <div className="flex gap-4">
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
                    O CSV deve conter as colunas: nome, funcao, situacao, forma_pagamento, pix, salario_base
                  </p>
                  <Button
                    className="gradient-button w-full mt-2"
                    variant="outline"
                    onClick={() => window.open('/csv-templates/funcionarios_template.csv', '_blank')}
                  >
                    BAIXAR TEMPLATE
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button">+ NOVO FUNCIONÁRIO</Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="text-white">NOVO FUNCIONÁRIO</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm dimension-marker">NOME</label>
                  <Input
                    className="cad-input mt-1"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">FUNÇÃO</label>
                  <Input
                    className="cad-input mt-1"
                    value={formData.funcao}
                    onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">SITUAÇÃO</label>
                  <Select value={formData.situacao} onValueChange={(value: any) => setFormData({ ...formData, situacao: value })}>
                    <SelectTrigger className="cad-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="Contrato">Contrato</SelectItem>
                      <SelectItem value="Experiência">Experiência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm dimension-marker">FORMA DE PAGAMENTO</label>
                  <Input
                    className="cad-input mt-1"
                    value={formData.forma_pagamento}
                    onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">CHAVE PIX</label>
                  <Input
                    className="cad-input mt-1"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">SALÁRIO BASE (R$)</label>
                  <Input
                    className="cad-input mt-1"
                    type="number"
                    value={formData.salario_base}
                    onChange={(e) => setFormData({ ...formData, salario_base: parseInt(e.target.value) * 100 })}
                  />
                </div>
                <Button onClick={handleSubmit} className="gradient-button w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Tabela de Funcionários */}
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">NOME</th>
                <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                <th className="text-left p-3 dimension-marker">SITUAÇÃO</th>
                <th className="text-left p-3 dimension-marker">FORMA PGTO</th>
                <th className="text-left p-3 dimension-marker">PIX</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BASE</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia funcionários para linhas da tabela */}
              {funcionarios?.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{f.nome}</td>
                  <td className="p-3 text-white">{f.funcao}</td>
                  <td className="p-3 text-white">{f.situacao}</td>
                  <td className="p-3 text-white">{f.forma_pagamento}</td>
                  {/* Exibe "-" se PIX for null */}
                  <td className="p-3 text-white">{f.pix ?? "-"}</td>
                  {/* Converte centavos para reais (divide por 100) */}
                  <td className="p-3 text-white">R$ {(f.salario_base / 100).toFixed(2)}</td>
                  {/* Botão de exclusão */}
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(f.id, f.nome)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
