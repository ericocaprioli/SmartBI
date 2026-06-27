import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function Funcionarios() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "",
    situacao: "CLT" as const,
    forma_pagamento: "Pix",
    pix: "",
    salario_base: 0,
  });

  const { data: funcionarios, refetch } = trpc.funcionarios.list.useQuery();
  const createMutation = trpc.funcionarios.create.useMutation();
  const importMutation = trpc.funcionarios.importCSV.useMutation();

  const handleSubmit = async () => {
    if (!formData.nome || !formData.funcao || formData.salario_base <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Funcionário criado com sucesso");
      setFormData({
        nome: "",
        funcao: "",
        situacao: "CLT",
        forma_pagamento: "Pix",
        pix: "",
        salario_base: 0,
      });
      setOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao criar funcionário");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      try {
        const result = await importMutation.mutateAsync({ csvContent });
        const successCount = result.filter((r: any) => r.success).length;
        const failCount = result.filter((r: any) => !r.success).length;
        toast.success(`Importação concluída: ${successCount} registros importados, ${failCount} erros`);
        setImportOpen(false);
        refetch();
      } catch (error) {
        toast.error("Erro ao importar CSV");
      }
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div className="border-2 border-border bg-card p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CADASTRO DE FUNCIONÁRIOS</h1>
            <p className="text-muted-foreground dimension-marker">Gerenciamento de dados cadastrais</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button className="cad-button" variant="outline">
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
                    O CSV deve conter as colunas: nome, funcao, setor, salario_base, data_admissao, situacao, ativo
                  </p>
                  <Button
                    className="cad-button w-full mt-2"
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
                <Button className="cad-button">+ NOVO FUNCIONÁRIO</Button>
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
                <Button onClick={handleSubmit} className="cad-button w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "SALVANDO..." : "SALVAR"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Tabela de Funcionários */}
        <div className="cad-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">NOME</th>
                <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                <th className="text-left p-3 dimension-marker">SITUAÇÃO</th>
                <th className="text-left p-3 dimension-marker">FORMA PGTO</th>
                <th className="text-left p-3 dimension-marker">PIX</th>
                <th className="text-left p-3 dimension-marker">SALÁRIO BASE</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios?.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{f.nome}</td>
                  <td className="p-3 text-white">{f.funcao}</td>
                  <td className="p-3 text-white">{f.situacao}</td>
                  <td className="p-3 text-white">{f.forma_pagamento}</td>
                  <td className="p-3 text-white">{f.pix ?? "-"}</td>
                  <td className="p-3 text-white">R$ {(f.salario_base / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
