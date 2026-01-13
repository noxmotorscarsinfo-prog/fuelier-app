import * as Sentry from "@sentry/react";

// Configuración de Sentry solo en producción
export const initSentry = () => {
  // Solo inicializar Sentry en producción
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: "https://your-sentry-dsn@sentry.io/your-project-id",
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% de las transacciones para reducir costos
      // Session Replay
      replaysSessionSampleRate: 0.05, // 5% de sesiones normales
      replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
      beforeSend(event) {
        // Filtrar errores conocidos o irrelevantes
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('Network Error') && 
              error?.value?.includes('Chse network')) {
            // Filtrar errores de red temporales
            return null;
          }
        }
        return event;
      },
    });
  }
};

// Helper para capturar errores manualmente
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  } else {
    // En desarrollo, solo mostrar en consola
    console.error('[DEV] Error captured:', error, context);
  }
};

// Helper para añadir contexto de usuario
export const setSentryUser = (user: { id: string; email: string; name?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name || 'Usuario',
    });
  }
};

export default Sentry;