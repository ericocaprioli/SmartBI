// Importações de hooks do React para gerenciar estado e efeitos
import { useEffect, useState } from "react";

// Importação do componente Button da biblioteca UI
import { Button } from "@/components/ui/button";

// Importações de componentes Dialog da biblioteca UI para modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Interface das props do componente ManusDialog
 * Define as configurações e callbacks do dialog de login
 */
interface ManusDialogProps {
  /**
   * Título opcional exibido no cabeçalho do dialog
   * Se não fornecido, o título não é exibido
   */
  title?: string;

  /**
   * URL do logo opcional exibido no cabeçalho do dialog
   * Se fornecido, renderiza uma imagem dentro de um container estilizado
   */
  logo?: string;

  /**
   * Controla se o dialog está aberto ou fechado
   * Pode ser controlado externamente via prop ou internamente
   * Padrão: false
   */
  open?: boolean;

  /**
   * Callback acionado quando o usuário clica no botão de login
   * Deve iniciar o fluxo de autenticação com Manus
   */
  onLogin: () => void;

  /**
   * Callback opcional para controlar o estado de abertura/fechamento externamente
   * Se fornecido, o componente é controlado (controlled component)
   * Se não fornecido, o componente gerencia seu próprio estado (uncontrolled)
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Callback opcional acionado quando o dialog é fechado
   * Útil para limpeza ou ações pós-fechamento
   */
  onClose?: () => void;
}

/**
 * ManusDialog é um componente de dialog para exibir a janela de login do Manus
 * Manus é um provedor de autenticação externo
 * 
 * Características:
 * - Suporta controle externo (controlled) ou interno (uncontrolled) do estado
 * - Exibe logo opcional no cabeçalho
 * - Título customizável
 * - Descrição fixa instruindo o usuário a fazer login
 * - Botão de login que aciona o callback onLogin
 * - Estilização específica com cores e bordas personalizadas
 * - Efeito de backdrop-blur para aparência moderna
 * 
 * Modos de operação:
 * - Controlled: quando onOpenChange é fornecido, o estado é controlado externamente
 * - Uncontrolled: quando onOpenChange não é fornecido, o estado é gerenciado internamente
 */
export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  // Estado interno para gerenciar abertura/fechamento quando não controlado externamente
  const [internalOpen, setInternalOpen] = useState(open);

  // Efeito para sincronizar estado interno com prop open quando não controlado externamente
  // Só atualiza estado interno se onOpenChange não for fornecido (modo uncontrolled)
  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  /**
   * Trata mudanças no estado de abertura do dialog
   * Atualiza estado interno ou notifica controlador externo
   * Executa callback de fechamento quando dialog é fechado
   * 
   * @param nextOpen - novo estado de abertura (true/false)
   */
  const handleOpenChange = (nextOpen: boolean) => {
    // Se houver controlador externo (onOpenChange), notifica ele
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      // Caso contrário, atualiza estado interno
      setInternalOpen(nextOpen);
    }

    // Executa callback de fechamento sempre que o modal é fechado
    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      // Usa estado controlado (open) se onOpenChange for fornecido
      // Caso contrário, usa estado interno (internalOpen)
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-[#f8f8f7] rounded-[20px] w-[400px] shadow-[0px_4px_11px_0px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.08)] backdrop-blur-2xl p-0 gap-0 text-center">
        {/* Área do cabeçalho do dialog com logo, título e descrição */}
        <div className="flex flex-col items-center gap-2 p-5 pt-12">
          {/* Logo opcional - renderizado se fornecido */}
          {logo ? (
            <div className="w-16 h-16 bg-white rounded-xl border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
              <img
                src={logo}
                alt="Dialog graphic"
                className="w-10 h-10 rounded-md"
              />
            </div>
          ) : null}

          {/* Título opcional - renderizado se fornecido */}
          {title ? (
            <DialogTitle className="text-xl font-semibold text-[#34322d] leading-[26px] tracking-[-0.44px]">
              {title}
            </DialogTitle>
          ) : null}
          
          {/* Descrição fixa do dialog */}
          <DialogDescription className="text-sm text-[#858481] leading-5 tracking-[-0.154px]">
            Please login with Manus to continue
          </DialogDescription>
        </div>

        {/* Footer do dialog com botão de login */}
        <DialogFooter className="px-5 py-5">
          {/* Botão de login - aciona callback onLogin ao clicar */}
          <Button
            onClick={onLogin}
            className="w-full h-10 bg-[#1a1a19] hover:bg-[#1a1a19]/90 text-white rounded-[10px] text-sm font-medium leading-5 tracking-[-0.154px]"
          >
            Login with Manus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
