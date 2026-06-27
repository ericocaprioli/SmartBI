import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};

  // Determina a URL de redirecionamento para usuários não autenticados.
  // Se redirectPath for fornecido, ele tem prioridade. Caso contrário, usa a URL de login.
  const redirectUrl = useMemo(() => {
    if (redirectPath) return redirectPath;
    if (!redirectOnUnauthenticated) return undefined;
    return getLoginUrl();
  }, [redirectOnUnauthenticated, redirectPath]);

  const utils = trpc.useUtils();

  // Consulta o usuário atualmente autenticado no backend.
  // Isso fornece os dados do usuário e o estado de carregamento/erro para o app.
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Prepara a mutation de logout e mantém o cache local de auth sincronizado.
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  // Executa o logout quando solicitado.
  // Trata o logout no backend, a limpeza local da sessão e a invalidação do cache.
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Limpa o token de auto-login do Preview que é espelhado no sessionStorage,
      // para que sessões baseadas em cabeçalho (Safari ITP / WebView) também sejam desconectadas.
      // O cookie de backend já é limpo pela mutation de logout.
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // Cria um objeto de estado memoizado para o hook de autenticação.
  // Inclui o usuário atual, status de carregamento e informações de erro.
  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // Redireciona para login se o usuário não estiver autenticado e o redirecionamento estiver habilitado.
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (!redirectUrl || redirectUrl === window.location.pathname) return;
    if (redirectUrl === "/") return;

    window.location.href = redirectUrl;
  }, [
    redirectOnUnauthenticated,
    redirectUrl,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
