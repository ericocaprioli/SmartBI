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
  // Query para listar meses do banco
  const { data: meses } = trpc.meses.list.useQuery();
  
  // Estado para mês selecionado (padrão: primeiro mês disponível ou 2026-05)
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const mesesDisponiveis = meses || [];
    return mesesDisponiveis.length > 0 ? mesesDisponiveis[0].mes_referencia : "2026-05";
  });
  
  // Estado para controlar abertura do modal de criação
  const [open, setOpen] = useState(false);
  
  // Estado para controlar modo de edição
  const [editingId, setEditingId] = useState<number | null>(null);
  
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
    vale_transporte: 0,
    irrf: 0,
    fgts: 0,
    total_proventos: 0,
    total_descontos: 0,
    salario_total: 0,
    // Campos de Férias/13º mantidos apenas para referência, não usados no cálculo mensal
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
  
  // Mutation para atualizar pagamento
  const updateMutation = trpc.pagamentos.update.useMutation();
  
  // Mutation para excluir pagamento
  const deleteMutation = trpc.pagamentos.delete.useMutation();
  
  // Função para abrir modal em modo de edição
  const handleEdit = (pagamento: any) => {
    setEditingId(pagamento.id);
    setFormData({
      funcionario_id: pagamento.funcionario_id,
      mes_referencia: pagamento.mes_referencia,
      dias_trabalhados: pagamento.dias_trabalhados || 0,
      salario_base_mes: pagamento.salario_base_mes || 0,
      valor_dia: pagamento.valor_dia || 0,
      salario_bruto: pagamento.salario_bruto || 0,
      salario_familia: pagamento.salario_familia || 0,
      premio_producao: pagamento.premio_producao || 0,
      premio_assiduidade: pagamento.premio_assiduidade || 0,
      hora_extra: pagamento.hora_extra || 0,
      inss: pagamento.inss || 0,
      desconto_diversos: pagamento.desconto_diversos || 0,
      vale_transporte: pagamento.vale_transporte || 0,
      irrf: pagamento.irrf || 0,
      fgts: pagamento.fgts || 0,
      total_proventos: pagamento.total_proventos || 0,
      total_descontos: pagamento.total_descontos || 0,
      salario_total: pagamento.salario_total || 0,
      ferias: pagamento.ferias || 0,
      terco_ferias: pagamento.terco_ferias || 0,
      decimo_terceiro: pagamento.decimo_terceiro || 0,
    });
    setOpen(true);
  };
  
  // Função para limpar estado de edição
  const handleClearEdit = () => {
    setEditingId(null);
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
      vale_transporte: 0,
      irrf: 0,
      fgts: 0,
      total_proventos: 0,
      total_descontos: 0,
      salario_total: 0,
      ferias: 0,
      terco_ferias: 0,
      decimo_terceiro: 0,
    });
  };

  /**
 * handleSubmit processa o formulário de registro de pagamento
 *
 * Validações:
 * - Funcionário deve ser selecionado
 * - Dias trabalhados deve ser maior que 0
 *
 * Cálculos realizados:
 * 1. Converte valores de reais para centavos
 * 2. Calcula total de proventos (salário base + salário família + prêmios + hora extra)
 * 3. Calcula total de descontos (INSS + descontos diversos + vale-transporte + IRRF)
 * 4. Calcula salário líquido (total_proventos - total_descontos)
 *
 * NOTA: Férias, 1/3 de Férias e 13º Salário são mantidos no banco para relatórios,
 * mas NÃO entram no cálculo do salário mensal para evitar distorções.
 *
 * Processo:
 * 1. Valida campos obrigatórios
 * 2. Realiza cálculos automáticos
 * 3. Chama mutation de criação/atualização
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
      // Converte valores de reais para centavos
      const salarioBaseMes = Math.round(formData.salario_base_mes * 100);
      const salarioFamilia = Math.round(formData.salario_familia * 100);
      const premioProducao = Math.round(formData.premio_producao * 100);
      const premioAssiduidade = Math.round(formData.premio_assiduidade * 100);
      const horaExtra = Math.round(formData.hora_extra * 100);
      const inss = Math.round(formData.inss * 100);
      const descontoDiversos = Math.round(formData.desconto_diversos * 100);
      const valeTransporte = Math.round(formData.vale_transporte * 100);
      const irrf = Math.round(formData.irrf * 100);
      const fgts = Math.round(formData.fgts * 100);

      // Calcula total de proventos (bruto + benefícios)
      const totalProventos = salarioBaseMes + salarioFamilia + premioProducao + premioAssiduidade + horaExtra;
      // Calcula total de descontos (INSS + descontos diversos + vale-transporte + IRRF)
      const totalDescontos = inss + descontoDiversos + valeTransporte + irrf;
      // Calcula salário total (soma de todos os campos)
      const salarioTotal = totalProventos - totalDescontos;
      // Calcula salário líquido (igual ao salário total)
      const salarioLiquido = salarioTotal;

      if (editingId) {
        // Modo de edição - chama updateMutation
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          salario_base_mes: salarioBaseMes,
          salario_familia: salarioFamilia,
          premio_producao: premioProducao,
          premio_assiduidade: premioAssiduidade,
          hora_extra: horaExtra,
          inss: inss,
          desconto_diversos: descontoDiversos,
          vale_transporte: valeTransporte,
          irrf: irrf,
          fgts: fgts,
          total_proventos: totalProventos,
          total_descontos: totalDescontos,
          salario_total: salarioTotal,
          salario_liquido: salarioLiquido,
        });
        toast.success("Pagamento atualizado com sucesso");
      } else {
        // Modo de criação - chama createMutation
        await createMutation.mutateAsync({
          ...formData,
          mes_referencia: mesSelecionado,
          salario_base_mes: salarioBaseMes,
          salario_familia: salarioFamilia,
          premio_producao: premioProducao,
          premio_assiduidade: premioAssiduidade,
          hora_extra: horaExtra,
          inss: inss,
          desconto_diversos: descontoDiversos,
          vale_transporte: valeTransporte,
          irrf: irrf,
          fgts: fgts,
          total_proventos: totalProventos,
          total_descontos: totalDescontos,
          salario_total: salarioTotal,
          salario_liquido: salarioLiquido,
        });
        toast.success("Pagamento registrado com sucesso");
      }

      // Limpa formulário e estado de edição
      handleClearEdit();
      // Fecha modal
      setOpen(false);
      // Recarrega lista
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar pagamento");
    }
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
                {meses?.map((mes) => (
                  <SelectItem key={mes.mes_referencia} value={mes.mes_referencia}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Dialog de registro de pagamento */}
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleClearEdit();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-button">+ REGISTRAR PAGAMENTO</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingId ? "EDITAR PAGAMENTO" : "REGISTRAR PAGAMENTO"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
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
                  {/* Campo: Salário Base */}
                  <div>
                    <label className="text-sm dimension-marker">SALÁRIO BASE (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.salario_base_mes / 100}
                      onChange={(e) => setFormData({ ...formData, salario_base_mes: Math.round(parseFloat(e.target.value) * 100) })}
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
                  {/* Campo: Vale-transporte */}
                  <div>
                    <label className="text-sm dimension-marker">VALE-TRANSPORTE (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.vale_transporte / 100}
                      onChange={(e) => setFormData({ ...formData, vale_transporte: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: IRRF */}
                  <div>
                    <label className="text-sm dimension-marker">IRRF (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.irrf / 100}
                      onChange={(e) => setFormData({ ...formData, irrf: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: FGTS */}
                  <div>
                    <label className="text-sm dimension-marker">FGTS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.fgts / 100}
                      onChange={(e) => setFormData({ ...formData, fgts: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                  {/* Campo: Descontos Eventuais */}
                  <div>
                    <label className="text-sm dimension-marker">DESCONTOS EVENTUAIS (R$)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      step="0.01"
                      value={formData.desconto_diversos / 100}
                      onChange={(e) => setFormData({ ...formData, desconto_diversos: Math.round(parseFloat(e.target.value) * 100) })}
                    />
                  </div>
                </div>
                {/* Botão de salvar - fora da área de scroll */}
                <Button onClick={handleSubmit} className="gradient-button w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                </Button>
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
                <th className="text-left p-3 dimension-marker">ID</th>
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BASE</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO FAMÍLIA</th>
                <th className="text-left p-3 dimension-marker">PRÊMIO PRODUÇÃO</th>
                <th className="text-left p-3 dimension-marker">PRÊMIO ASSIDUIDADE</th>
                <th className="text-left p-3 dimension-marker">HORA EXTRA</th>
                <th className="text-left p-3 dimension-marker">INSS</th>
                <th className="text-left p-3 dimension-marker">VALE-TRANSPORTE</th>
                <th className="text-left p-3 dimension-marker">IRRF</th>
                <th className="text-left p-3 dimension-marker">FGTS</th>
                <th className="text-left p-3 dimension-marker">DESCONTOS EVENTUAIS</th>
                <th className="text-left p-3 dimension-marker">TOTAL PROVENTOS</th>
                <th className="text-left p-3 dimension-marker">TOTAL DESCONTOS</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO TOTAL</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapeia pagamentos para linhas da tabela */}
              {pagamentos?.map((p) => {
                // Busca nome do funcionário
                const funcionario = funcionarios?.find((f) => f.id === p.funcionario_id);
                
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{p.mes_referencia}</td>
                    <td className="p-3 text-white">{p.id}</td>
                    <td className="p-3 text-white">{funcionario?.nome || `Funcionário ${p.funcionario_id}`}</td>
                    {/* Converte centavos para reais */}
                    <td className="p-3 text-white">R$ {((p.salario_base_mes || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.salario_familia || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.premio_producao || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.premio_assiduidade || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.hora_extra || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.inss || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.vale_transporte || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.irrf || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.fgts || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.desconto_diversos || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.total_proventos || 0) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {((p.total_descontos || 0) / 100).toFixed(2)}</td>
                    {/* Calcula salário total a partir dos campos disponíveis */}
                    <td className="p-3 text-white">R$ {(((p.total_proventos || 0) - (p.total_descontos || 0)) / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          onClick={() => handleEdit(p)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          onClick={async () => {
                            if (confirm("Tem certeza que deseja excluir este pagamento?")) {
                              try {
                                await deleteMutation.mutateAsync({ id: p.id });
                                toast.success("Pagamento excluído com sucesso");
                                refetch();
                              } catch (error) {
                                toast.error("Erro ao excluir pagamento");
                              }
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                        </Button>
                      </div>
                    </td>
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
