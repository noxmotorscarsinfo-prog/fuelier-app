/**
 * Sistema de logging condicional para producción
 * 
 * En desarrollo: muestra todos los logs
 * En producción: solo muestra errores críticos
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Logs generales de información (solo en desarrollo)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Warnings (solo en desarrollo)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Errores críticos (siempre se muestran)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Logs de debug detallados (solo en desarrollo)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Información de éxito (solo en desarrollo)
   */
  success: (...args: any[]) => {
    if (isDev) {
      console.log('✅', ...args);
    }
  },

  /**
   * Información de sistema adaptativo (solo en desarrollo)
   */
  adaptive: (...args: any[]) => {
    if (isDev) {
      console.log('🤖', ...args);
    }
  }
};

export default logger;
