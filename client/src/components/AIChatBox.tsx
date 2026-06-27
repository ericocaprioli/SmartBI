// Importações de componentes UI shadcn para botão, textarea e área de scroll
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Importação da função utilitária cn para mesclar classes CSS
import { cn } from "@/lib/utils";

// Importações de ícones Lucide React para a interface do chat
import { Loader2, Send, User, Sparkles } from "lucide-react";

// Importações de hooks do React para gerenciar estado, efeitos e referências
import { useState, useEffect, useRef } from "react";

// Importação do Streamdown para renderização de Markdown em streaming
import { Streamdown } from "streamdown";

/**
 * Tipo Message representa uma mensagem no chat
 * Compatível com a interface de mensagens LLM usada no servidor
 * 
 * role: tipo de mensagem (system, user ou assistant)
 * content: texto da mensagem
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Interface das props do componente AIChatBox
 * Define todas as configurações e callbacks do componente de chat
 */
export type AIChatBoxProps = {
  /**
   * Array de mensagens para exibir no histórico do chat
   * Deve corresponder ao formato usado pelo invokeLLM no servidor
   * Mensagens com role "system" são filtradas e não exibidas visualmente
   */
  messages: Message[];

  /**
   * Callback acionado quando o usuário envia uma nova mensagem
   * Normalmente usado para chamar uma mutação tRPC que invoca o LLM
   * Recebe o conteúdo da mensagem como parâmetro
   */
  onSendMessage: (content: string) => void;

  /**
   * Indica se a IA está gerando uma resposta
   * Quando true, exibe indicador de carregamento e desabilita entrada
   */
  isLoading?: boolean;

  /**
   * Texto de placeholder exibido no campo de entrada quando vazio
   * Padrão: "Type your message..."
   */
  placeholder?: string;

  /**
   * Classe CSS personalizada para o container do chat
   * Permite estilização adicional além do estilo padrão
   */
  className?: string;

  /**
   * Altura do chat box
   * Pode ser string (ex: "600px") ou número (ex: 600)
   * Padrão: "600px"
   */
  height?: string | number;

  /**
   * Texto exibido quando não há mensagens no chat
   * Padrão: "Start a conversation with AI"
   */
  emptyStateMessage?: string;

  /**
   * Array de sugestões de prompt exibidas no estado vazio
   * Usuário pode clicar para enviar a sugestão diretamente
   * Útil para guiar o usuário em interações iniciais
   */
  suggestedPrompts?: string[];
};

/**
 * AIChatBox é um componente de chat com IA pronto para uso
 * Integrado ao sistema LLM do servidor via tRPC
 * 
 * Funcionalidades principais:
 * - Compatível com a interface de mensagens do servidor (role: system/user/assistant)
 * - Renderização Markdown com Streamdown para respostas da IA
 * - Rolagem automática para a última mensagem
 * - Indicador de carregamento durante geração de resposta
 * - Sugestões de prompt para estado vazio
 * - Suporte a Enter para enviar e Shift+Enter para nova linha
 * - Filtro automático de mensagens de sistema (não exibidas visualmente)
 * - Layout responsivo com área de scroll customizada
 * - Usa as cores de tema globais definidas em index.css
 * 
 * @example
 * Exemplo de uso com tRPC:
 * ```tsx
 * const ChatPage = () => {
 *   const [messages, setMessages] = useState<Message[]>([
 *     { role: "system", content: "Você é um assistente útil." }
 *   ]);
 *
 *   const chatMutation = trpc.ai.chat.useMutation({
 *     onSuccess: (response) => {
 *       setMessages(prev => [...prev, {
 *         role: "assistant",
 *         content: response
 *       }]);
 *     },
 *     onError: (error) => {
 *       console.error("Erro no chat:", error);
 *     }
 *   });
 *
 *   const handleSend = (content: string) => {
 *     const newMessages = [...messages, { role: "user", content }];
 *     setMessages(newMessages);
 *     chatMutation.mutate({ messages: newMessages });
 *   };
 *
 *   return (
 *     <AIChatBox
 *       messages={messages}
 *       onSendMessage={handleSend}
 *       isLoading={chatMutation.isPending}
 *       suggestedPrompts={[
 *         "Explique computação quântica",
 *         "Escreva um hello world em Python"
 *       ]}
 *     />
 *   );
 * };
 * ```
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  // Estado local para armazenar o texto digitado pelo usuário no campo de entrada
  const [input, setInput] = useState("");

  // Referências para controle de rolagem e medição de layout
  // scrollAreaRef: referência à área de scroll das mensagens
  // containerRef: referência ao container principal do chat
  // inputAreaRef: referência ao formulário de entrada
  // textareaRef: referência ao campo de texto para foco
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtra as mensagens de sistema para que não apareçam no histórico visível
  // Mensagens de sistema são usadas apenas para contexto do LLM
  const displayMessages = messages.filter((msg) => msg.role !== "system");

  // Estado para calcular a altura mínima reservada para a última mensagem
  // Isso evita que a área de entrada sobreponha o conteúdo mais recente
  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  // Efeito para calcular a altura mínima da última mensagem
  // Executa apenas uma vez na montagem do componente
  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      // Obtém alturas do container e da área de entrada
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;

      // Reserva espaço para:
      // - padding (p-4 = 32px total de cima e baixo)
      // - mensagem do usuário: 40px (altura) + 16px (margem superior de space-y-4) = 56px
      // Nota: margin-bottom não é contado porque empurra naturalmente a mensagem do assistente
      const userMessageReservedHeight = 56;
      const calculatedHeight = scrollAreaHeight - 32 - userMessageReservedHeight;

      // Define a altura mínima calculada (não negativa)
      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []); // Array vazio: executa apenas na montagem

  /**
   * Função auxiliar que rola o chat para a mensagem mais recente
   * Usa requestAnimationFrame para renderização mais suave
   * Encontra o viewport do ScrollArea e rola até o final
   */
  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement;

    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth' // Rolagem suave
        });
      });
    }
  };

  /**
   * Trata o envio da mensagem pelo formulário
   * Valida entrada, chama callback, limpa campo e rola para baixo
   * 
   * @param e - Evento de submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previne comportamento padrão do formulário
    
    // Remove espaços em branco e valida se há conteúdo
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Chama o callback com a mensagem
    onSendMessage(trimmedInput);
    
    // Limpa o campo de entrada
    setInput("");

    // Rola imediatamente para baixo após o envio
    scrollToBottom();

    // Retorna o foco para o campo de entrada para mensagens rápidas
    textareaRef.current?.focus();
  };

  /**
   * Trata eventos de teclado no campo de entrada
   * Enter envia a mensagem, Shift+Enter cria nova linha
   * 
   * @param e - Evento de teclado
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Previne nova linha
      handleSubmit(e); // Envia mensagem
    }
    // Shift+Enter permite nova linha (comportamento padrão)
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm",
        className
      )}
      style={{ height }}
    >
      {/* Área de mensagens - ocupa todo o espaço disponível */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {/* Estado vazio: exibe mensagem e sugestões quando não há mensagens */}
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                {/* Ícone de brilho representando IA */}
                <Sparkles className="size-12 opacity-20" />
                {/* Mensagem de estado vazio */}
                <p className="text-sm">{emptyStateMessage}</p>
              </div>

              {/* Sugestões de prompt - botões clicáveis */}
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Estado com mensagens: exibe histórico com scroll
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-4">
              {/* Mapeia e renderiza cada mensagem */}
              {displayMessages.map((message, index) => {
                // Determina se é a última mensagem e se deve aplicar altura mínima
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      // Mensagens do usuário alinhadas à direita
                      // Mensagens da IA alinhadas à esquerda
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight
                        ? { minHeight: `${minHeightForLastMessage}px` }
                        : undefined
                    }
                  >
                    {/* Avatar da IA (ícone de brilho) */}
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                    )}

                    {/* Balão da mensagem */}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2.5",
                        // Estilo diferente para usuário (primary) e IA (muted)
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {/* Mensagens da IA: renderiza Markdown com Streamdown */}
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <Streamdown>{message.content}</Streamdown>
                        </div>
                      ) : (
                        // Mensagens do usuário: texto simples com preservação de quebras de linha
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {/* Avatar do usuário (ícone de usuário) */}
                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Indicador de carregamento quando IA está gerando resposta */}
              {isLoading && (
                <div
                  className="flex items-start gap-3"
                  style={
                    minHeightForLastMessage > 0
                      ? { minHeight: `${minHeightForLastMessage}px` }
                      : undefined
                  }
                >
                  <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2.5">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Área de entrada: formulário com textarea e botão de envio */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background/50 items-end"
      >
        {/* Campo de texto para entrada da mensagem */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-32 resize-none min-h-9"
          rows={1}
        />
        
        {/* Botão de envio - desabilitado quando vazio ou carregando */}
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-[38px] w-[38px]"
        >
          {isLoading ? (
            // Ícone de loading quando IA está gerando
            <Loader2 className="size-4 animate-spin" />
          ) : (
            // Ícone de enviar quando pronto
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
