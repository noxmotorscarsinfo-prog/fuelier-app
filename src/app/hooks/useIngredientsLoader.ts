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
      
      // 3️⃣ VALIDACIÓN: Verificar que Supabase tiene los ingredientes del sistema
      const expectedCount = INGREDIENTS_DATABASE.length; // 60 ingredientes del sistema
      
      if (globalIngredients.length === 0) {
        // ⚠️ Supabase vacío - CRÍTICO
        console.error('❌ [useIngredientsLoader] CRÍTICO: Supabase vacío');
        console.error('   → Ejecuta: npm run sync-ingredients');
        console.error('   → O espera a que admin haga auto-sync');
        
        // 🔄 AUTO-SINCRONIZACIÓN: Si es admin, poblar Supabase automáticamente
        if (isAdmin) {
          console.log('🔄 [useIngredientsLoader] Usuario ADMIN detectado - iniciando auto-sincronización...');
          try {
            const syncSuccess = await api.saveGlobalIngredients(INGREDIENTS_DATABASE);
            if (syncSuccess) {
              console.log('✅ [useIngredientsLoader] Auto-sincronización completada exitosamente');
              console.log(`   ${INGREDIENTS_DATABASE.length} ingredientes guardados en Supabase`);
              
              // Recargar desde Supabase para confirmar
              const reloadedIngredients = await api.getGlobalIngredients();
              setIngredients([...reloadedIngredients, ...customIngredients]);
              setSource(customIngredients.length > 0 ? 'mixed' : 'supabase');
              console.log(`✅ [useIngredientsLoader] Confirmado: ${reloadedIngredients.length} ingredientes en Supabase`);
              return; // Salir temprano - todo OK
            } else {
              console.error('❌ [useIngredientsLoader] Auto-sincronización falló');
            }
          } catch (syncError) {
            console.error('❌ [useIngredientsLoader] Error en auto-sincronización:', syncError);
          }
        }
        
        // Si no es admin o la sincronización falló, usar local como FALLBACK
        console.warn('⚠️ [useIngredientsLoader] Usando INGREDIENTS_DATABASE local como fallback');
        setIngredients([...INGREDIENTS_DATABASE, ...customIngredients]);
        setSource(customIngredients.length > 0 ? 'mixed' : 'local');
        
      } else if (globalIngredients.length < expectedCount) {
        // ⚠️ Supabase incompleto
        console.warn(`⚠️ [useIngredientsLoader] Supabase tiene ${globalIngredients.length}/${expectedCount} ingredientes`);
        console.warn('   → Posible desincronización - considera ejecutar: npm run sync-ingredients');
        
        // Usar Supabase pero advertir
        setIngredients([...globalIngredients, ...customIngredients]);
        setSource(customIngredients.length > 0 ? 'mixed' : 'supabase');
        
      } else {
        // ✅ Supabase tiene datos completos
        setIngredients([...globalIngredients, ...customIngredients]);
        setSource(customIngredients.length > 0 ? 'mixed' : 'supabase');
        console.log(`✅ [useIngredientsLoader] Total ingredientes: ${globalIngredients.length + customIngredients.length}`);
      }
      
    } catch (err) {
      // ❌ Error al cargar - fallback a local
      console.error('❌ [useIngredientsLoader] Error cargando desde Supabase:', err);
      console.warn('🔄 Usando INGREDIENTS_DATABASE local como fallback');
      
      setError(err instanceof Error ? err : new Error(String(err)));
      setIngredients(INGREDIENTS_DATABASE);
      setSource('local');
      
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
