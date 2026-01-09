import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, AlertTriangle } from 'lucide-react';
import * as api from '../utils/api';

interface CSVImporterProps {
  type: 'ingredients' | 'meals';
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImporter({ type, onClose, onSuccess }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [maxLines, setMaxLines] = useState<number>(10000); // Default to 10k for safety
  const [result, setResult] = useState<{
    success: boolean;
    stats?: any;
    errors?: string[];
    error?: string;
  } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
      setProgress(0);
      setProgressText('');
    } else {
      alert('Por favor, selecciona un archivo CSV válido');
    }
  };

  // Process CSV file line by line and send in batches to avoid memory issues
  const processFileInBatches = async (file: File, maxLines: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      let offset = 0;
      let buffer = '';
      let linesProcessed = 0;
      let header = '';
      let csvBatch = '';
      const batchSize = 1000; // Send 1000 lines at a time
      let batchCount = 0;
      
      let totalStats = {
        totalLines: 0,
        spanishProducts: 0,
        nonSpanish: 0,
        incompleteData: 0,
        new: 0,
        duplicates: 0,
        totalIngredients: 0
      };

      const sendBatch = async (batch: string, isLast: boolean) => {
        if (!batch || batch.trim().split('\n').length <= 1) {
          if (isLast) resolve();
          return;
        }

        try {
          batchCount++;
          setProgressText(`Procesando lote ${batchCount}... (${linesProcessed.toLocaleString()} líneas)`);
          
          let uploadResult;
          if (type === 'ingredients') {
            uploadResult = await api.importIngredientsCSV(batch);
          } else {
            uploadResult = await api.importMealsCSV(batch);
          }

          // Accumulate stats
          if (uploadResult.success && uploadResult.stats) {
            const stats = uploadResult.stats;
            totalStats.totalLines += stats.totalLines || 0;
            totalStats.spanishProducts += stats.spanishProducts || 0;
            totalStats.nonSpanish += stats.nonSpanish || 0;
            totalStats.incompleteData += stats.incompleteData || 0;
            totalStats.new += stats.new || 0;
            totalStats.duplicates += stats.duplicates || 0;
            totalStats.totalIngredients = stats.totalIngredients || 0;
          }

          if (isLast) {
            setResult({
              success: true,
              stats: totalStats
            });
            resolve();
          }
        } catch (error: any) {
          reject(error);
        }
      };

      const processLines = async (text: string, isLastChunk: boolean) => {
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Skip if we've reached max lines
          if (linesProcessed >= maxLines) {
            // Send remaining batch
            if (csvBatch) {
              await sendBatch(header + '\n' + csvBatch, true);
            }
            resolve();
            return;
          }

          // Store header
          if (linesProcessed === 0 && !header) {
            header = line;
            linesProcessed++;
            continue;
          }

          // Skip empty lines
          if (!line.trim()) {
            continue;
          }

          // Add line to batch
          csvBatch += line + '\n';
          linesProcessed++;

          // Send batch when it reaches batchSize
          if (linesProcessed % batchSize === 0) {
            await sendBatch(header + '\n' + csvBatch, false);
            csvBatch = ''; // Reset batch
          }
        }

        // If this was the last chunk and we have remaining lines, send them
        if (isLastChunk && csvBatch) {
          await sendBatch(header + '\n' + csvBatch, true);
        }
      };

      const readNextChunk = () => {
        if (offset >= file.size || linesProcessed >= maxLines) {
          // Send any remaining batch
          if (csvBatch) {
            sendBatch(header + '\n' + csvBatch, true).then(() => resolve());
          } else {
            resolve();
          }
          return;
        }

        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsText(slice);
      };

      reader.onload = async (e) => {
        const chunk = e.target?.result as string;
        if (!chunk) {
          if (csvBatch) {
            await sendBatch(header + '\n' + csvBatch, true);
          }
          resolve();
          return;
        }

        // Add chunk to buffer
        buffer += chunk;

        // Find last complete line
        const lastNewline = buffer.lastIndexOf('\n');
        if (lastNewline !== -1) {
          const completeText = buffer.substring(0, lastNewline + 1);
          buffer = buffer.substring(lastNewline + 1); // Keep incomplete line for next chunk

          // Process complete lines
          try {
            await processLines(completeText, false);
          } catch (error) {
            reject(error);
            return;
          }
        }

        offset += chunkSize;
        
        // Update progress
        const progressPercent = Math.min(95, Math.round((offset / file.size) * 100));
        setProgress(progressPercent);

        // Continue reading
        setTimeout(readNextChunk, 10); // Small delay to not block UI
      };

      reader.onerror = (error) => {
        reject(error);
      };

      readNextChunk();
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    // Warn for very large files
    const fileSizeMB = file.size / (1024 * 1024);
    const isVeryLarge = fileSizeMB > 1000; // >1GB

    if (isVeryLarge && maxLines > 50000) {
      const confirmProcess = confirm(
        `Este archivo tiene ${fileSizeMB.toFixed(0)}MB.\n\n` +
        `Se procesarán ${maxLines.toLocaleString()} líneas en lotes.\n` +
        `Esto puede tardar varios minutos.\n\n` +
        `¿Deseas continuar?`
      );
      
      if (!confirmProcess) {
        return;
      }
    }

    setIsUploading(true);
    setResult(null);
    setProgress(0);
    setProgressText('Iniciando procesamiento...');

    try {
      await processFileInBatches(file, maxLines);
      setProgress(100);
      setProgressText('¡Completado!');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      setResult({
        success: false,
        error: error.message || 'Error al procesar el archivo. Por favor, verifica el formato.'
      });
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let filename = '';
    
    if (type === 'ingredients') {
      csvContent = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,porcion\n' +
                   'Pechuga de pollo,165,31,0,3.6,proteína,100g\n' +
                   'Arroz blanco,130,2.7,28,0.3,carbohidrato,100g\n' +
                   'Brócoli,34,2.8,7,0.4,vegetal,100g';
      filename = 'plantilla_ingredientes.csv';
    } else {
      csvContent = 'nombre,calorias,proteinas,carbohidratos,grasas,categoria,tipo\n' +
                   'Pollo con arroz,450,45,50,8,principal,lunch\n' +
                   'Ensalada César,280,15,12,20,ensalada,dinner\n' +
                   'Tostadas con aguacate,320,12,35,15,desayuno,breakfast';
      filename = 'plantilla_comidas.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">
                Importar {type === 'ingredients' ? 'Ingredientes' : 'Comidas'} desde CSV
              </h2>
              <p className="text-sm text-neutral-500">
                Procesamiento en lotes para archivos grandes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  ¿Primera vez? Descarga la plantilla
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Usa nuestra plantilla CSV con el formato correcto para evitar errores
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Formato requerido
            </h3>
            <div className="text-sm text-neutral-600 space-y-2">
              {type === 'ingredients' ? (
                <>
                  <p className="font-medium">Columnas obligatorias:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><code className="bg-white px-1.5 py-0.5 rounded">nombre</code> - Nombre del ingrediente</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">calorias</code> - Calorías por 100g</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">proteinas</code> - Gramos de proteína por 100g</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">carbohidratos</code> - Gramos de carbohidratos por 100g</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">grasas</code> - Gramos de grasa por 100g</li>
                  </ul>
                  <p className="font-medium mt-3">Columnas opcionales:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><code className="bg-white px-1.5 py-0.5 rounded">categoria</code> - Categoría (proteína, carbohidrato, grasa, vegetal, fruta, lácteo, etc.)</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">porcion</code> - Siempre 100g (referencia)</li>
                  </ul>
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-800 font-medium">
                      💡 <strong>Importante:</strong> Todos los valores nutricionales deben ser por 100g del ingrediente
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">Columnas obligatorias:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><code className="bg-white px-1.5 py-0.5 rounded">nombre</code> - Nombre del plato</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">calorias</code> - Calorías por porción</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">proteinas</code> - Gramos de proteína</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">carbohidratos</code> - Gramos de carbohidratos</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">grasas</code> - Gramos de grasa</li>
                  </ul>
                  <p className="font-medium mt-3">Columnas opcionales:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li><code className="bg-white px-1.5 py-0.5 rounded">categoria</code> - Categoría del plato</li>
                    <li><code className="bg-white px-1.5 py-0.5 rounded">tipo</code> - Tipo de comida (breakfast, lunch, snack, dinner, any)</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Selecciona el archivo CSV
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-sm text-neutral-600
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100
                  cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  border border-neutral-200 rounded-xl"
              />
            </div>
            {file && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Tamaño: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-blue-900">
                  {progressText}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                No cierres esta ventana hasta que termine el proceso
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando en lotes...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Iniciar Importación</span>
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? '¡Importación Completada!' : 'Error en la Importación'}
                  </h3>
                  
                  {result.success && result.stats && (
                    <div className="space-y-1 text-sm text-green-800">
                      <p>📊 <strong>Total de líneas procesadas:</strong> {(result.stats.totalLines || 0).toLocaleString()}</p>
                      {type === 'ingredients' && result.stats.spanishProducts !== undefined ? (
                        <>
                          <p>🇪🇸 <strong>Productos de España encontrados:</strong> {(result.stats.spanishProducts || 0).toLocaleString()}</p>
                          <p>🌍 <strong>Otros países (filtrados):</strong> {(result.stats.nonSpanish || 0).toLocaleString()}</p>
                          <p>⚠️ <strong>Datos incompletos (omitidos):</strong> {(result.stats.incompleteData || 0).toLocaleString()}</p>
                          <p>🆕 <strong>Nuevos agregados a la BD:</strong> {(result.stats.new || 0).toLocaleString()}</p>
                          <p>🔄 <strong>Duplicados omitidos:</strong> {(result.stats.duplicates || 0).toLocaleString()}</p>
                        </>
                      ) : (
                        <>
                          <p>✅ <strong>Procesados correctamente:</strong> {(result.stats.parsed || 0).toLocaleString()}</p>
                          <p>🆕 <strong>Nuevos agregados:</strong> {(result.stats.new || 0).toLocaleString()}</p>
                          <p>🔄 <strong>Duplicados omitidos:</strong> {(result.stats.duplicates || 0).toLocaleString()}</p>
                          {(result.stats.errors || 0) > 0 && (
                            <p>⚠️ <strong>Errores encontrados:</strong> {(result.stats.errors || 0).toLocaleString()}</p>
                          )}
                        </>
                      )}
                      <p className="pt-2 font-semibold">
                        💾 <strong>Total en base de datos:</strong> {(type === 'ingredients' ? (result.stats.totalIngredients || 0) : (result.stats.totalMeals || 0)).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <p className="text-sm text-red-700">{result.error}</p>
                  )}
                  
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
                      >
                        {showErrors ? 'Ocultar' : 'Ver'} errores ({result.errors.length})
                      </button>
                      {showErrors && (
                        <div className="mt-2 bg-white rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                          {result.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600">• {error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}