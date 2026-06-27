// Reexporta constantes compartilhadas do pacote @shared/const
// COOKIE_NAME: nome do cookie de autenticação
// ONE_YEAR_MS: tempo em milissegundos correspondente a um ano
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Gera URL de login OAuth em tempo de execução
 * 
 * Funcionalidades:
 * - Gera URL de login com base nas variáveis de ambiente
 * - Usa a origem atual para o redirect URI (reflete o domínio atual)
 * - Codifica o redirect URI em base64 como parâmetro state
 * - Retorna "/" como fallback se configuração estiver ausente
 * 
 * Parâmetros da URL OAuth:
 * - appId: ID da aplicação configurada no portal OAuth
 * - redirectUri: URL para redirecionamento após login
 * - state: parâmetro de segurança (redirect URI codificado em base64)
 * - type: tipo de autenticação (signIn)
 * 
 * @returns URL completa de login OAuth ou "/" se não configurado
 */
export const getLoginUrl = () => {
  // Obtém configurações OAuth das variáveis de ambiente
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Constrói redirect URI baseado na origem atual
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Codifica redirect URI em base64 para parâmetro state
  const state = btoa(redirectUri);

  // Valida se configurações OAuth estão presentes
  if (!oauthPortalUrl || !appId) {
    console.warn(
      "VITE_OAUTH_PORTAL_URL or VITE_APP_ID is not configured. Falling back to root path."
    );
    return "/";
  }

  // Remove barra final da URL do portal se presente
  const portalUrl = oauthPortalUrl.replace(/\/$/, "");

  try {
    // Constrói URL de autenticação OAuth
    const url = new URL(`${portalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    // Fallback se URL do portal for inválida
    console.warn(
      "Invalid VITE_OAUTH_PORTAL_URL value:",
      oauthPortalUrl,
      error
    );
    return "/";
  }
};

/**
 * Verifica se a autenticação OAuth está configurada
 * 
 * @returns true se VITE_OAUTH_PORTAL_URL e VITE_APP_ID estiverem configurados
 */
export const isAuthConfigured = () =>
  Boolean(import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID);
