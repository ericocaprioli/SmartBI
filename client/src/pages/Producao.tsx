import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

const MESES = [
  { value: "2026-01", label: "Janeiro 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Maio 2026" },
  { value: "2026-06", label: "Junho 2026" },
];

export default function Producao() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    funcionario_id: 0,
    mes_referencia: mesSelecionado,
    meta_dia: 0,
    meta_mes: 0,
    valor_peca: 0,
    producao_realizada: 0,
  });

  const { data: producao, refetch } = trpc.producao.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  const createMutation = trpc.producao.create.useMutation();

  const handleSubmit = async () => {
    if (formData.funcionario_id <= 0 || formData.meta_dia <= 0 || formData.valor_peca <= 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const metaMes = formData.meta_dia * 30;
      const faturamentoMensal = formData.producao_realizada * formData.valor_peca;

      await createMutation.mutateAsync({
        ...formData,
        mes_referencia: mesSelecionado,
        meta_mes: metaMes,
        faturamento_mensal: faturamentoMensal,
      });

      toast.success("Produção registrada com sucesso");
      setFormData({
        funcionario_id: 0,
        mes_referencia: mesSelecionado,
        meta_dia: 0,
        meta_mes: 0,
        valor_peca: 0,
        producao_realizada: 0,
      });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao registrar produção");
    }
  };

  const getFuncionarioNome = (id: number) => {
    return funcionarios?.find((f) => f.id === id)?.nome || `Funcionário ${id}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CONTROLE DE PRODUÇÃO</h1>
            <p className="text-muted-foreground dimension-marker">Registro de metas e produção mensal</p>
          </div>
          <div className="flex gap-4">
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="cad-button">+ REGISTRAR PRODUÇÃO</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border">
                <DialogHeader>
                  <DialogTitle className="text-white">REGISTRAR PRODUÇÃO</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                  <div>
                    <label className="text-sm dimension-marker">META DIÁRIA (peças)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.meta_dia}
                      onChange={(e) => setFormData({ ...formData, meta_dia: parseInt(e.target.value) })}
                    />
                  </div>
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
                  <div>
                    <label className="text-sm dimension-marker">PRODUÇÃO REALIZADA (peças)</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.producao_realizada}
                      onChange={(e) => setFormData({ ...formData, producao_realizada: parseInt(e.target.value) })}
                    />
                  </div>
                  <Button onClick={handleSubmit} className="cad-button w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabela de Produção */}
        <div className="cad-card overflow-x-auto">
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
              {producao?.map((p) => {
                const eficiencia = p.meta_mes > 0 ? ((p.producao_realizada / p.meta_mes) * 100).toFixed(1) : "0";
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{getFuncionarioNome(p.funcionario_id)}</td>
                    <td className="p-3 text-white">{p.meta_dia || 0}</td>
                    <td className="p-3 text-white">{p.meta_mes || 0}</td>
                    <td className="p-3 text-white">R$ {(p.valor_peca / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">{p.producao_realizada || 0}</td>
                    <td className="p-3 text-white">R$ {(p.faturamento_mensal / 100).toFixed(2)}</td>
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
