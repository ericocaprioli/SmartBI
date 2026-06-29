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

// Importação dos ícones Pencil e Trash do Lucide React
import { Pencil, Trash2 } from "lucide-react";

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
  // Estado para controlar abertura do modal de criação/edição
  const [open, setOpen] = useState(false);
  
  // Estado para controlar modo de edição
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estado para armazenar dados do formulário de criação
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "",
    situacao: "",
    forma_pagamento: "",
    tipo_chave_pix: "",
    pix: "",
    banco: "",
    agencia: "",
    conta: "",
    salario_base: 0,
    data_admissao: "",
    data_demissao: "",
  });

  // Query para listar funcionários
  const { data: funcionarios, refetch } = trpc.funcionarios.list.useQuery();

  // Queries dos cadastros auxiliares (populam os dropdowns)
  const { data: funcoes } = trpc.funcoes.list.useQuery();
  const { data: situacoes } = trpc.situacoes.list.useQuery();
  const { data: formasPagamento } = trpc.formasPagamento.list.useQuery();

  // Mutation para criar novo funcionário
  const createMutation = trpc.funcionarios.create.useMutation();
  
  // Mutation para atualizar funcionário
  const updateMutation = trpc.funcionarios.update.useMutation();
  
  // Mutation para excluir funcionário
  const deleteMutation = trpc.funcionarios.delete.useMutation();

  // Tipo da forma de pagamento selecionada (pix | conta | dinheiro | undefined)
  // Usado para exibir os campos condicionais corretos no formulário
  const tipoFormaPagamento = formasPagamento?.find(
    (f) => f.nome === formData.forma_pagamento
  )?.tipo;

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
    // Valida campos obrigatórios básicos
    if (!formData.nome || !formData.funcao || !formData.situacao || !formData.forma_pagamento || formData.salario_base <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validação condicional conforme o tipo da forma de pagamento
    if (tipoFormaPagamento === "pix") {
      if (!formData.tipo_chave_pix || !formData.pix) {
        toast.error("Informe o tipo e o valor da chave PIX");
        return;
      }
    } else if (tipoFormaPagamento === "conta") {
      if (!formData.banco || !formData.agencia || !formData.conta) {
        toast.error("Informe banco, agência e conta corrente");
        return;
      }
    }

    // Monta o payload limpando os campos que não pertencem ao tipo selecionado
    const payload = {
      nome: formData.nome,
      funcao: formData.funcao,
      situacao: formData.situacao,
      forma_pagamento: formData.forma_pagamento,
      salario_base: formData.salario_base,
      data_admissao: formData.data_admissao,
      data_demissao: formData.data_demissao,
      tipo_chave_pix: tipoFormaPagamento === "pix" ? formData.tipo_chave_pix : "",
      pix: tipoFormaPagamento === "pix" ? formData.pix : "",
      banco: tipoFormaPagamento === "conta" ? formData.banco : "",
      agencia: tipoFormaPagamento === "conta" ? formData.agencia : "",
      conta: tipoFormaPagamento === "conta" ? formData.conta : "",
    };

    try {
      if (editingId) {
        // Atualiza funcionário existente
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Funcionário atualizado com sucesso");
      } else {
        // Cria novo funcionário
        await createMutation.mutateAsync(payload);
        toast.success("Funcionário criado com sucesso");
      }
      // Limpa formulário
      setFormData({
        nome: "",
        funcao: "",
        situacao: "",
        forma_pagamento: "",
        tipo_chave_pix: "",
        pix: "",
        banco: "",
        agencia: "",
        conta: "",
        salario_base: 0,
        data_admissao: "",
        data_demissao: "",
      });
      // Reseta modo de edição
      setEditingId(null);
      // Fecha modal
      setOpen(false);
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error(editingId ? "Erro ao atualizar funcionário" : "Erro ao criar funcionário");
    }
  };

  /**
   * handleEdit abre o modal de edição com dados do funcionário
   * 
   * Processo:
   * 1. Busca funcionário pelo ID
   * 2. Preenche formulário com dados do funcionário
   * 3. Define modo de edição
   * 4. Abre modal
   */
  const handleEdit = (funcionario: any) => {
    setFormData({
      nome: funcionario.nome,
      funcao: funcionario.funcao,
      situacao: funcionario.situacao,
      forma_pagamento: funcionario.forma_pagamento,
      tipo_chave_pix: funcionario.tipo_chave_pix || "",
      pix: funcionario.pix || "",
      banco: funcionario.banco || "",
      agencia: funcionario.agencia || "",
      conta: funcionario.conta || "",
      salario_base: funcionario.salario_base,
      data_admissao: funcionario.data_admissao || "",
      data_demissao: funcionario.data_demissao || "",
    });
    setEditingId(funcionario.id);
    setOpen(true);
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-button">+ NOVO FUNCIONÁRIO</Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{editingId ? "EDITAR FUNCIONÁRIO" : "NOVO FUNCIONÁRIO"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm dimension-marker">ID</label>
                  <Input
                    className="cad-input mt-1"
                    value={editingId || "AUTO"}
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">FUNCIONÁRIO</label>
                  <Input
                    className="cad-input mt-1"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">FUNÇÃO</label>
                  <Select value={formData.funcao} onValueChange={(value) => setFormData({ ...formData, funcao: value })}>
                    <SelectTrigger className="cad-input mt-1">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes?.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm dimension-marker">SITUAÇÃO</label>
                  <Select value={formData.situacao} onValueChange={(value) => setFormData({ ...formData, situacao: value })}>
                    <SelectTrigger className="cad-input mt-1">
                      <SelectValue placeholder="Selecione a situação" />
                    </SelectTrigger>
                    <SelectContent>
                      {situacoes?.map((s) => (
                        <SelectItem key={s.id} value={s.nome}>
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm dimension-marker">FORMA DE PAGAMENTO</label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        forma_pagamento: value,
                        // Limpa os campos condicionais ao trocar a forma de pagamento
                        tipo_chave_pix: "",
                        pix: "",
                        banco: "",
                        agencia: "",
                        conta: "",
                      })
                    }
                  >
                    <SelectTrigger className="cad-input mt-1">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento?.map((fp) => (
                        <SelectItem key={fp.id} value={fp.nome}>
                          {fp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos condicionais: PIX */}
                {tipoFormaPagamento === "pix" && (
                  <>
                    <div>
                      <label className="text-sm dimension-marker">TIPO DE CHAVE PIX</label>
                      <Select
                        value={formData.tipo_chave_pix}
                        onValueChange={(value) => setFormData({ ...formData, tipo_chave_pix: value })}
                      >
                        <SelectTrigger className="cad-input mt-1">
                          <SelectValue placeholder="Selecione o tipo de chave" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="telefone">Telefone</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="aleatoria">Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm dimension-marker">CHAVE PIX</label>
                      <Input
                        className="cad-input mt-1"
                        value={formData.pix}
                        onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                        placeholder="Informe o valor da chave"
                      />
                    </div>
                  </>
                )}

                {/* Campos condicionais: Conta Bancária */}
                {tipoFormaPagamento === "conta" && (
                  <>
                    <div>
                      <label className="text-sm dimension-marker">BANCO</label>
                      <Input
                        className="cad-input mt-1"
                        value={formData.banco}
                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                        placeholder="Ex: Banco do Brasil"
                      />
                    </div>
                    <div>
                      <label className="text-sm dimension-marker">AGÊNCIA</label>
                      <Input
                        className="cad-input mt-1"
                        value={formData.agencia}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        placeholder="Ex: 1234-5"
                      />
                    </div>
                    <div>
                      <label className="text-sm dimension-marker">CONTA CORRENTE</label>
                      <Input
                        className="cad-input mt-1"
                        value={formData.conta}
                        onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                        placeholder="Ex: 12345-6"
                      />
                    </div>
                  </>
                )}

                {/* Dinheiro: nenhum campo adicional necessário */}
                {tipoFormaPagamento === "dinheiro" && (
                  <p className="text-xs text-muted-foreground">
                    Pagamento em dinheiro — nenhum dado adicional necessário.
                  </p>
                )}
                <div>
                  <label className="text-sm dimension-marker">SALÁRIO BASE (R$)</label>
                  <Input
                    className="cad-input mt-1"
                    inputMode="numeric"
                    value={(formData.salario_base / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    onChange={(e) => {
                      // Extrai apenas os dígitos e interpreta como centavos
                      const digits = e.target.value.replace(/\D/g, "");
                      const centavos = digits ? parseInt(digits, 10) : 0;
                      setFormData({ ...formData, salario_base: centavos });
                    }}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">DATA DE ADMISSÃO</label>
                  <Input
                    className="cad-input mt-1"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">DATA DE DEMISSÃO</label>
                  <Input
                    className="cad-input mt-1"
                    type="date"
                    value={formData.data_demissao}
                    onChange={(e) => setFormData({ ...formData, data_demissao: e.target.value })}
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
                <th className="text-left p-3 dimension-marker">ID</th>
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                <th className="text-left p-3 dimension-marker">SITUAÇÃO</th>
                <th className="text-left p-3 dimension-marker">FORMA PGTO</th>
                <th className="text-left p-3 dimension-marker">DADOS PGTO</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BASE</th>
                <th className="text-left p-3 dimension-marker">DATA ADMISSÃO</th>
                <th className="text-left p-3 dimension-marker">DATA DEMISSÃO</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia funcionários para linhas da tabela */}
              {funcionarios?.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{f.id}</td>
                  <td className="p-3 text-white">{f.nome}</td>
                  <td className="p-3 text-white">{f.funcao}</td>
                  <td className="p-3 text-white">{f.situacao}</td>
                  <td className="p-3 text-white">{f.forma_pagamento}</td>
                  {/* Exibe os dados de pagamento conforme o que estiver preenchido */}
                  <td className="p-3 text-white">
                    {f.pix
                      ? `${f.tipo_chave_pix ? f.tipo_chave_pix.toUpperCase() + ": " : ""}${f.pix}`
                      : f.banco
                        ? `${f.banco} | Ag: ${f.agencia ?? "-"} | C/C: ${f.conta ?? "-"}`
                        : "-"}
                  </td>
                  {/* Converte centavos para reais (divide por 100) */}
                  <td className="p-3 text-white">R$ {(f.salario_base / 100).toFixed(2)}</td>
                  {/* Exibe "-" se data for null, formata para DD/MM/AAAA */}
                  <td className="p-3 text-white">
                    {f.data_admissao ? new Date(f.data_admissao).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="p-3 text-white">
                    {f.data_demissao ? new Date(f.data_demissao).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  {/* Botões de ação */}
                  <td className="p-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(f)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-500/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
