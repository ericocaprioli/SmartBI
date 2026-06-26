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

export default function Pagamentos() {
  const [mesSelecionado, setMesSelecionado] = useState("2026-06");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    funcionario_id: 0,
    mes_referencia: mesSelecionado,
    dias_trabalhados: 0,
    salario_base_mes: 0,
    salario_familia: 0,
    premio_producao: 0,
    premio_assiduidade: 0,
    hora_extra: 0,
    inss: 0,
    desconto_diversos: 0,
  });

  const { data: pagamentos, refetch } = trpc.pagamentos.listByMes.useQuery(mesSelecionado);
  const { data: funcionarios } = trpc.funcionarios.list.useQuery();
  const createMutation = trpc.pagamentos.create.useMutation();

  const handleSubmit = async () => {
    if (formData.funcionario_id <= 0 || formData.dias_trabalhados <= 0) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const funcionario = funcionarios?.find((f) => f.id === formData.funcionario_id);
      const salarioBaseMes = (funcionario?.salario_base || 0);
      const valorDia = Math.round(salarioBaseMes / 30);
      const salarioBruto = valorDia * formData.dias_trabalhados;
      const totalProventos = salarioBruto + formData.salario_familia + formData.premio_producao + formData.premio_assiduidade + formData.hora_extra;
      const totalDescontos = formData.inss + formData.desconto_diversos;
      const salarioLiquido = totalProventos - totalDescontos;

      await createMutation.mutateAsync({
        ...formData,
        mes_referencia: mesSelecionado,
        salario_base_mes: salarioBaseMes,
        valor_dia: valorDia,
        salario_bruto: salarioBruto,
        salario_liquido: salarioLiquido,
      });

      toast.success("Pagamento registrado com sucesso");
      setFormData({
        funcionario_id: 0,
        mes_referencia: mesSelecionado,
        dias_trabalhados: 0,
        salario_base_mes: 0,
        salario_familia: 0,
        premio_producao: 0,
        premio_assiduidade: 0,
        hora_extra: 0,
        inss: 0,
        desconto_diversos: 0,
      });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">FOLHA DE PAGAMENTO</h1>
            <p className="text-muted-foreground dimension-marker">Registro mensal de pagamentos</p>
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
                <Button className="cad-button">+ REGISTRAR PAGAMENTO</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-2 border-border">
                <DialogHeader>
                  <DialogTitle className="text-white">REGISTRAR PAGAMENTO</DialogTitle>
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
                    <label className="text-sm dimension-marker">DIAS TRABALHADOS</label>
                    <Input
                      className="cad-input mt-1"
                      type="number"
                      value={formData.dias_trabalhados}
                      onChange={(e) => setFormData({ ...formData, dias_trabalhados: parseInt(e.target.value) })}
                    />
                  </div>
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
                  <Button onClick={handleSubmit} className="cad-button w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabela de Pagamentos */}
        <div className="cad-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">FUNCIONÁRIO</th>
                <th className="text-left p-3 dimension-marker">DIAS</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BRUTO</th>
                <th className="text-left p-3 dimension-marker">DESCONTOS</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO LÍQUIDO</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos?.map((p) => {
                const funcionario = funcionarios?.find((f) => f.id === p.funcionario_id);
                const descontos = (p.inss || 0) + (p.desconto_diversos || 0);
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/10">
                    <td className="p-3 text-white">{funcionario?.nome || `Funcionário ${p.funcionario_id}`}</td>
                    <td className="p-3 text-white">{p.dias_trabalhados || 0}</td>
                    <td className="p-3 text-white">R$ {(p.salario_bruto / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(descontos / 100).toFixed(2)}</td>
                    <td className="p-3 text-white">R$ {(p.salario_liquido / 100).toFixed(2)}</td>
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
