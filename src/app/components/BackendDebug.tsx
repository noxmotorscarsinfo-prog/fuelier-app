import { useState } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-b0e879f0`;

export function BackendDebug() {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (name: string, url: string, options?: RequestInit) => {
    try {
      console.log(`[DEBUG] Testing ${name}:`, url);
      const response = await fetch(url, options);
      const status = response.status;
      const data = await response.json().catch(() => ({ error: 'No JSON response' }));
      
      console.log(`[DEBUG] ${name} result:`, { status, data });
      return { name, status, success: response.ok, data };
    } catch (error: any) {
      console.error(`[DEBUG] ${name} error:`, error);
      return { name, status: 0, success: false, error: error.message };
    }
  };

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {};

    // Test 1: Ping endpoint (sin auth)
    testResults.ping = await testEndpoint(
      'Ping (no auth)',
      `${API_BASE_URL}/ping`
    );

    // Test 2: Health endpoint (sin auth)
    testResults.health = await testEndpoint(
      'Health (no auth)',
      `${API_BASE_URL}/health`
    );

    // Test 3: Test POST endpoint (sin auth)
    testResults.testPost = await testEndpoint(
      'Test POST (no auth)',
      `${API_BASE_URL}/test-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ test: 'data', timestamp: new Date().toISOString() })
      }
    );

    // Test 4: Global meals (con anonKey)
    testResults.globalMeals = await testEndpoint(
      'Global Meals (anonKey)',
      `${API_BASE_URL}/global-meals`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    // Test 5: POST user (con anonKey) - el verdadero test crítico
    testResults.postUser = await testEndpoint(
      'POST User (anonKey)',
      `${API_BASE_URL}/user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: 'test@debug.com',
          name: 'Test User',
          weight: 70,
          height: 175
        })
      }
    );

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: '#000', 
      color: '#0f0', 
      padding: '20px', 
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10000
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>🔍 Backend Debug Tool</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#222', borderRadius: '4px' }}>
        <div><strong>Project ID:</strong> {projectId}</div>
        <div><strong>Anon Key:</strong> {publicAnonKey.substring(0, 30)}...</div>
        <div><strong>Base URL:</strong> {API_BASE_URL}</div>
      </div>

      <button 
        onClick={runTests}
        disabled={testing}
        style={{
          padding: '10px 20px',
          background: testing ? '#666' : '#0a0',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {testing ? 'Testeando...' : 'Ejecutar Tests'}
      </button>

      {Object.keys(results).length > 0 && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '10px' }}>Resultados:</h2>
          {Object.entries(results).map(([key, result]: [string, any]) => (
            <div 
              key={key} 
              style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                background: result.success ? '#003300' : '#330000',
                borderLeft: `4px solid ${result.success ? '#0f0' : '#f00'}`,
                borderRadius: '4px'
              }}
            >
              <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
                {result.success ? '✅' : '❌'} {result.name}
              </div>
              <div>Status: <span style={{ color: result.status === 200 ? '#0f0' : '#f00' }}>{result.status || 'N/A'}</span></div>
              {result.data && (
                <details style={{ marginTop: '5px' }}>
                  <summary style={{ cursor: 'pointer', color: '#0af' }}>Ver datos</summary>
                  <pre style={{ 
                    marginTop: '5px', 
                    padding: '10px', 
                    background: '#111', 
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
              {result.error && (
                <div style={{ marginTop: '5px', color: '#f00' }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '10px', background: '#222', borderRadius: '4px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>📋 Instrucciones:</h3>
        <ol style={{ color: '#ccc', lineHeight: '1.6' }}>
          <li>Haz clic en "Ejecutar Tests" para probar todos los endpoints</li>
          <li>Si <strong>Ping</strong> falla → La Edge Function no está deployada</li>
          <li>Si <strong>Health</strong> falla → Problema de configuración del servidor</li>
          <li>Si <strong>Test POST</strong> falla → Problema con políticas RLS en tabla test_post</li>
          <li>Si <strong>Global Meals</strong> falla → Problema con la tabla base_meals o RLS</li>
          <li>Si <strong>POST User</strong> falla con 401 → Problema con políticas RLS en tabla users</li>
          <li>Si POST User falla con 500 → Ver detalles del error en "Ver datos"</li>
        </ol>
      </div>
    </div>
  );
}