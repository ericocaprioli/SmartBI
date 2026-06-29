import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// Tipos de forma de pagamento e seus rótulos amigáveis
const TIPOS = [
  { value: "pix", label: "PIX (chave: CPF, CNPJ, telefone, e-mail, aleatória)" },
  { value: "conta", label: "Conta Bancária (banco, agência, conta)" },
  { value: "dinheiro", label: "Dinheiro (sem dados adicionais)" },
] as const;

// Mapa de rótulo curto do tipo
const TIPO_LABEL: Record<string, string> = {
  pix: "PIX",
  conta: "Conta Bancária",
  dinheiro: "Dinheiro",
};

type TipoForma = "pix" | "conta" | "dinheiro";

/**
 * AdminFormasPagamento é a página de cadastro de formas de pagamento.
 *
 * Cada forma de pagamento possui um tipo (pix, conta ou dinheiro) que
 * determina quais campos condicionais aparecem no cadastro do funcionário.
 */
export default function AdminFormasPagamento() {
  // Lista de formas de pagamento
  const { data: formas, refetch } = trpc.formasPagamento.list.useQuery();

  // Mutations
  const createMutation = trpc.formasPagamento.create.useMutation();
  const updateMutation = trpc.formasPagamento.update.useMutation();
  const deleteMutation = trpc.formasPagamento.delete.useMutation();

  // Estado do formulário e modal
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoForma | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  /** Limpa o formulário e o estado de edição */
  const handleClear = () => {
    setNome("");
    setTipo("");
    setEditingId(null);
  };

  /** Carrega os dados da forma no formulário para edição */
  const handleEdit = (forma: { id: number; nome: string; tipo: string }) => {
    setEditingId(forma.id);
    setNome(forma.nome);
    setTipo(forma.tipo as TipoForma);
    setOpen(true);
  };

  /** Salva (cria ou atualiza) a forma de pagamento */
  const handleSubmit = async () => {
    if (!nome.trim() || !tipo) {
      toast.error("Informe o nome e o tipo da forma de pagamento");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, nome: nome.trim(), tipo });
        toast.success("Forma de pagamento atualizada com sucesso");
      } else {
        await createMutation.mutateAsync({ nome: nome.trim(), tipo });
        toast.success("Forma de pagamento criada com sucesso");
      }
      handleClear();
      setOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar forma de pagamento");
    }
  };

  /** Exclui a forma de pagamento */
  const handleDelete = async (id: number, nomeForma: string) => {
    if (!confirm(`Deseja realmente excluir a forma "${nomeForma}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Forma de pagamento excluída com sucesso");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir forma de pagamento");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CADASTRO DE FORMAS DE PAGAMENTO</h1>
            <p className="text-muted-foreground dimension-marker">
              Gerenciamento das formas de pagamento e seus tipos
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleClear();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-button">+ NOVA FORMA</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingId ? "EDITAR FORMA DE PAGAMENTO" : "NOVA FORMA DE PAGAMENTO"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  O tipo define os campos exibidos no cadastro do funcionário.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm dimension-marker">Nome</label>
                  <Input
                    className="cad-input mt-1"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: PIX, Conta Bancária, Dinheiro"
                  />
                </div>
                <div>
                  <label className="text-sm dimension-marker">Tipo</label>
                  <Select value={tipo} onValueChange={(value) => setTipo(value as TipoForma)}>
                    <SelectTrigger className="cad-input mt-1">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="gradient-button w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "SALVANDO..." : "SALVAR"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left p-3 dimension-marker">FORMA</th>
                <th className="text-left p-3 dimension-marker">TIPO</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {formas?.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{f.nome}</td>
                  <td className="p-3 text-white">{TIPO_LABEL[f.tipo] ?? f.tipo}</td>
                  <td className="p-3 text-white">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => handleEdit(f)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        onClick={() => handleDelete(f.id, f.nome)}
                      >
                        Excluir
                      </Button>
                    </div>
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
