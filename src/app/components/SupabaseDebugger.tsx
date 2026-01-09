import { useState, useEffect } from 'react';
import { X, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import * as api from '../utils/api';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface SupabaseDebuggerProps {
  onClose: () => void;
}

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export default function SupabaseDebugger({ onClose }: SupabaseDebuggerProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Check environment variables
    testResults.push({
      test: 'Variables de entorno',
      status: projectId && publicAnonKey ? 'success' : 'error',
      message: projectId && publicAnonKey 
        ? `Project ID: ${projectId.substring(0, 10)}...`
        : 'Variables de entorno no configuradas',
      details: { projectId, hasAnonKey: !!publicAnonKey }
    });
    setResults([...testResults]);

    // Test 2: Check server health
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b0e879f0/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        testResults.push({
          test: 'Servidor backend',
          status: 'success',
          message: 'Servidor respondiendo correctamente',
          details: data
        });
      } else {
        testResults.push({
          test: 'Servidor backend',
          status: 'error',
          message: `Error HTTP ${response.status}`,
          details: await response.text()
        });
      }
    } catch (error: any) {
      testResults.push({
        test: 'Servidor backend',
        status: 'error',
        message: 'No se puede conectar al servidor',
        details: error.message
      });
    }
    setResults([...testResults]);

    // Test 3: Test save user
    try {
      const testUser = {
        email: 'test@debug.com',
        name: 'Test User',
        sex: 'male' as const,
        age: 25,
        weight: 75,
        height: 180,
        goal: 'maintenance' as const,
        trainingFrequency: 3,
        mealsPerDay: 3,
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65
        },
        preferences: {
          likes: [],
          dislikes: [],
          intolerances: [],
          allergies: []
        },
        createdAt: new Date().toISOString()
      };

      const saveResult = await api.saveUser(testUser);
      
      testResults.push({
        test: 'Guardar usuario de prueba',
        status: saveResult ? 'success' : 'error',
        message: saveResult ? 'Usuario guardado correctamente' : 'Error al guardar usuario',
        details: { saveResult }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Guardar usuario de prueba',
        status: 'error',
        message: 'Excepción al guardar usuario',
        details: error.message
      });
    }
    setResults([...testResults]);

    // Test 4: Test get user
    try {
      const getUserResult = await api.getUser('test@debug.com');
      
      if (getUserResult) {
        testResults.push({
          test: 'Recuperar usuario de prueba',
          status: 'success',
          message: 'Usuario recuperado correctamente',
          details: getUserResult
        });
      } else {
        testResults.push({
          test: 'Recuperar usuario de prueba',
          status: 'warning',
          message: 'Usuario no encontrado (puede ser normal si acabas de crear la cuenta)',
          details: null
        });
      }
    } catch (error: any) {
      testResults.push({
        test: 'Recuperar usuario de prueba',
        status: 'error',
        message: 'Error al recuperar usuario',
        details: error.message
      });
    }
    setResults([...testResults]);

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  const allTestsPassed = results.length > 0 && results.every(r => r.status === 'success');
  const hasErrors = results.some(r => r.status === 'error');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Diagnóstico de Supabase</h2>
              <p className="text-blue-100 text-sm">Verificando conexión con la base de datos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary */}
        <div className="p-6 border-b border-neutral-200">
          {isRunning && (
            <div className="flex items-center gap-3 text-neutral-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Ejecutando pruebas de diagnóstico...</span>
            </div>
          )}
          
          {!isRunning && allTestsPassed && (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">✅ Todas las pruebas pasaron correctamente</span>
            </div>
          )}
          
          {!isRunning && hasErrors && (
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">❌ Se detectaron problemas de conexión</span>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`border-2 rounded-xl p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    {result.test}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-2">
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
                        Ver detalles técnicos
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded-lg text-xs overflow-x-auto border border-neutral-200">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex gap-3">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Volver a ejecutar pruebas</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-neutral-300 rounded-xl hover:bg-neutral-100 transition-all"
          >
            Cerrar
          </button>
        </div>

        {/* Help Section */}
        {hasErrors && !isRunning && (
          <div className="p-6 bg-red-50 border-t-2 border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">🔧 ¿Cómo solucionar?</h3>
            <ul className="text-sm text-red-700 space-y-2">
              <li>
                • <strong>Servidor backend no responde:</strong> Verifica que la Edge Function esté desplegada en Supabase
              </li>
              <li>
                • <strong>Error de JWT:</strong> Revisa que las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY estén configuradas
              </li>
              <li>
                • <strong>Error al guardar:</strong> Asegúrate de que la tabla kv_store_b0e879f0 existe en la base de datos
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
