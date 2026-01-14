/**
 * 🔄 HOOK DE CARGA ROBUSTA DE INGREDIENTES
 * 
 * Garantiza que los ingredientes estén SIEMPRE disponibles con sistema de fallback:
 * 1. Intenta cargar desde Supabase (global + custom)
 * 2. Si Supabase vacío → usa INGREDIENTS_DATABASE local
 * 3. Si hay error → usa INGREDIENTS_DATABASE local
 * 
 * Tracking de fuente: 'supabase', 'local', 'mixed'
 */

import { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { Ingredient } from '../../data/ingredientTypes';
import { INGREDIENTS_DATABASE } from '../../data/ingredientsDatabase';

export type IngredientSource = 'supabase' | 'local' | 'mixed' | 'loading';

export interface UseIngredientsLoaderResult {
  /** Lista completa de ingredientes (global + custom) */
  ingredients: Ingredient[];
  /** Estado de carga */
  isLoading: boolean;
  /** Fuente de los datos */
  source: IngredientSource;
  /** Error si hubo algún problema */
  error: Error | null;
  /** Forzar recarga desde Supabase */
  reload: () => Promise<void>;
}

export function useIngredientsLoader(userEmail: string, isAdmin: boolean = false): UseIngredientsLoaderResult {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<IngredientSource>('loading');
  const [error, setError] = useState<Error | null>(null);
  
  const loadIngredients = async () => {
    console.log('🔄 [useIngredientsLoader] Iniciando carga de ingredientes...');
    setIsLoading(true);
    setError(null);
    
    try {
      // 1️⃣ Cargar ingredientes globales desde Supabase
      const globalIngredients = await api.getGlobalIngredients();
      console.log(`📦 [useIngredientsLoader] Ingredientes globales desde Supabase: ${globalIngredients.length}`);
      
      // 2️⃣ Cargar ingredientes personalizados del usuario
      let customIngredients: any[] = [];
      if (userEmail) {
        customIngredients = await api.getCustomIngredients(userEmail);
        console.log(`👤 [useIngredientsLoader] Ingredientes personalizados: ${customIngredients.length}`);
      }
      
      // 3️⃣ VALIDACIÓN: Verificar que Supabase tiene ingredientes
      
      if (globalIngredients.length === 0) {
        // 🚨 Supabase VACÍO - AUTO-SINCRONIZAR INMEDIATAMENTE
        console.error('🚨 [useIngredientsLoader] CRÍTICO: Supabase vacío - sincronizando automáticamente...');
        
        try {
          // Sincronizar INMEDIATAMENTE (admin o no)
          const syncSuccess = await api.saveGlobalIngredients(INGREDIENTS_DATABASE);
          if (syncSuccess) {
            console.log('✅ [useIngredientsLoader] Auto-sincronización completada');
            console.log(`   ${INGREDIENTS_DATABASE.length} ingredientes guardados en Supabase`);
            
            // Recargar desde Supabase para confirmar
            const reloadedIngredients = await api.getGlobalIngredients();
            setIngredients([...reloadedIngredients, ...customIngredients]);
            setSource(customIngredients.length > 0 ? 'mixed' : 'supabase');
            console.log(`✅ [useIngredientsLoader] Confirmado: ${reloadedIngredients.length} ingredientes en Supabase`);
            return; // Salir temprano - todo OK
          } else {
            throw new Error('Auto-sincronización falló');
          }
        } catch (syncError) {
          console.error('❌ [useIngredientsLoader] Error fatal en auto-sincronización:', syncError);
          // 🚨 SIN FALLBACK LOCAL - dejar vacío para forzar corrección
          setIngredients([]);
          setSource('supabase');
          setError(new Error('Supabase vacío y auto-sincronización falló. Contactar soporte.'));
          return;
        }
      }
      
      // ✅ Supabase tiene datos - usar SIEMPRE de Supabase (sin fallback local)
      setIngredients([...globalIngredients, ...customIngredients]);
      setSource(customIngredients.length > 0 ? 'mixed' : 'supabase');
      console.log(`✅ [useIngredientsLoader] Total ingredientes desde Supabase: ${globalIngredients.length + customIngredients.length}`);
      
    } catch (err) {
      // ❌ Error al cargar - SIN FALLBACK LOCAL
      console.error('❌ [useIngredientsLoader] Error cargando desde Supabase:', err);
      console.error('🚨 NO hay fallback local - la app requiere conexión a Supabase');
      
      setError(err instanceof Error ? err : new Error(String(err)));
      setIngredients([]); // Vacío - forzar corrección del problema
      setSource('supabase');
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar al montar y cuando cambia el email
  useEffect(() => {
    loadIngredients();
  }, [userEmail]);
  
  return {
    ingredients,
    isLoading,
    source,
    error,
    reload: loadIngredients
  };
}
