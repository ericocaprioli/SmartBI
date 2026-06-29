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
 * AdminFuncoes é a página de cadastro de funções (cargos).
 *
 * Funcionalidades:
 * - Listar funções ativas
 * - Criar, editar e excluir funções
 * - Bloquear exclusão se a função estiver em uso por funcionários
 */
export default function AdminFuncoes() {
  // Lista de funções
  const { data: funcoes, refetch } = trpc.funcoes.list.useQuery();

  // Mutations
  const createMutation = trpc.funcoes.create.useMutation();
  const updateMutation = trpc.funcoes.update.useMutation();
  const deleteMutation = trpc.funcoes.delete.useMutation();

  // Estado do formulário e modal
  const [nome, setNome] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  /** Limpa o formulário e o estado de edição */
  const handleClear = () => {
    setNome("");
    setEditingId(null);
  };

  /** Carrega os dados da função no formulário para edição */
  const handleEdit = (funcao: { id: number; nome: string }) => {
    setEditingId(funcao.id);
    setNome(funcao.nome);
    setOpen(true);
  };

  /** Salva (cria ou atualiza) a função */
  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da função");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, nome: nome.trim() });
        toast.success("Função atualizada com sucesso");
      } else {
        await createMutation.mutateAsync({ nome: nome.trim() });
        toast.success("Função criada com sucesso");
      }
      handleClear();
      setOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar função");
    }
  };

  /** Exclui a função */
  const handleDelete = async (id: number, nomeFuncao: string) => {
    if (!confirm(`Deseja realmente excluir a função "${nomeFuncao}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Função excluída com sucesso");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir função");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CADASTRO DE FUNÇÕES</h1>
            <p className="text-muted-foreground dimension-marker">Gerenciamento de funções/cargos</p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) handleClear();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-button">+ NOVA FUNÇÃO</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingId ? "EDITAR FUNÇÃO" : "NOVA FUNÇÃO"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingId ? "Edite o nome da função" : "Informe o nome da nova função"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm dimension-marker">Nome da Função</label>
                  <Input
                    className="cad-input mt-1"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Operador de Máquina"
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
                <th className="text-left p-3 dimension-marker">FUNÇÃO</th>
                <th className="text-left p-3 dimension-marker">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {funcoes?.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-accent/10">
                  <td className="p-3 text-white">{f.nome}</td>
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
