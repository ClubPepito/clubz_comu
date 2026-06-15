import { useEffect, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface WidgetRunnerProps {
  widgetId: string;
  remoteUrl: string;
  name: string;
  className?: string;
}

export function WidgetRunner({ widgetId, remoteUrl, name, className }: WidgetRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Pour des raisons de sécurité, on peut vérifier que la source vient bien de notre iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      try {
        // Le SDK envoie un objet JSON (parfois sous forme de string si c'est du Native Mobile, mais en Web c'est un objet)
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // On ignore les messages qui ne viennent pas du SDK
        if (message.source !== 'klyb-widget' || !message.id || !message.action) {
          return;
        }

        let responseData = null;

        switch (message.action) {
          case 'GET_USER':
            responseData = user ? { id: user.id, name: user.username || user.email } : null;
            break;

          case 'GET_SESSION_TOKEN':
            // Appel à l'API pour générer le token court
            try {
              const res = await api.post(`/auth/widget-token`, { widgetId });
              responseData = res.data.token;
            } catch (err) {
              console.error('[WidgetRunner] Failed to fetch session token:', err);
              throw new Error('Impossible de générer le token de session');
            }
            break;

          default:
            console.warn(`[WidgetRunner] Action non supportée : ${message.action}`);
            throw new Error(`Action non supportée : ${message.action}`);
        }

        // Renvoi de la réponse au widget
        iframeRef.current.contentWindow?.postMessage(
          {
            id: message.id,
            success: true,
            data: responseData,
          },
          '*'
        );
      } catch (error: any) {
        // Envoi de l'erreur au widget
        if (event.data && event.data.id) {
          iframeRef.current.contentWindow?.postMessage(
            {
              id: event.data.id,
              success: false,
              error: error.message || 'Erreur interne du bridge',
            },
            '*'
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, widgetId]);

  return (
    <iframe
      ref={iframeRef}
      src={remoteUrl}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      className={className}
      title={`Widget — ${name}`}
    />
  );
}
