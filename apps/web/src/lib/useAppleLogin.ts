import { useEffect, useState } from "react";
import { authApi } from "./api";

/**
 * O botão "Continuar com Apple" só aparece quando o servidor tem as credenciais do Apple
 * Developer configuradas (APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY). Sem isso, mostrar o
 * botão só levaria o usuário a um 503 — melhor escondê-lo até a conta Apple estar pronta.
 */
export function useAppleLoginEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .providers()
      .then((p) => {
        if (!cancelled) setEnabled(p.apple);
      })
      .catch(() => {
        // Servidor antigo ou offline: mantém escondido em vez de arriscar um botão quebrado.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
