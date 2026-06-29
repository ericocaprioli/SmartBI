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
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * AdminSituacoes é a página de cadastro de situações contratuais.
 *
 * Funcionalidades:
 * - Listar situações ativas
 * - Criar, editar e excluir situações
 * - Bloquear exclusão se a situação estiver em uso por funcionários
 */
export default function AdminSituacoes() {
  // Lista de situações
  const { data: situacoes, refetch } = trpc.situacoes.list.useQuery();

  // Mutations
  const createMutation = trpc.situacoes.create.useMutation();
  const updateMutation = trpc.situacoes.update.useMutation();
  const deleteMutation = trpc.situacoes.delete.useMutation();

  // Estado do formulário e modal
  const [nome, setNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  /** Limpa o formulário e o estado de edição */
  const handleClear = () => {
    setNome("");
    setEditingId(null);
  };

  /** Carrega os dados da situação no formulário para edição */
  const handleEdit = (situacao: { id: number; nome: string }) => {
    setEditingId(situacao.id);
    setNome(situacao.nome);
    setOpen(true);
  };

  /** Salva (cria ou atualiza) a situação */
  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da situação");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, nome: nome.trim() });
        toast.success("Situação atualizada com sucesso");
      } else {
        await createMutation.mutateAsync({ nome: nome.trim() });
        toast.success("Situação criada com sucesso");
      }
      handleClear();
      setOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar situação");
    }
  };

  /** Exclui a situação */
  const handleDelete = async (id: number, nomeSituacao: string) => {
    if (!confirm(`Deseja realmente excluir a situação "${nomeSituacao}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Situação excluída com sucesso");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir situação");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CADASTRO DE SITUAÇÕES</h1>
            <p className="text-muted-foreground dimension-marker">Gerenciamento de situações contratuais</p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleClear();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-button">+ NOVA SITUAÇÃO</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingId ? "EDITAR SITUAÇÃO" : "NOVA SITUAÇÃO"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingId ? "Edite o nome da situação" : "Informe o nome da nova situação"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm dimension-marker">Nome da Situação</label>
                  <Input
                    className="cad-input mt-1"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: CLT, Contrato, Experiência"
                  />
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
                <th className="text-left p-3 dimension-marker">SITUAÇÃO</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {situacoes?.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{s.nome}</td>
                  <td className="p-3 text-white">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => handleEdit(s)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        onClick={() => handleDelete(s.id, s.nome)}
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
