/**
 * PIPELINE TAB
 * Nueva pestaña para ejecutar el Kernel 19 Pasos con visualización de razonamiento
 */

import React, { useState, useCallback } from 'react';
import { 
  Play, 
  FileUp, 
  Loader2, 
  Download, 
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { AgentReasoningTerminal } from './AgentReasoningTerminal';
import { useAgenticPipeline } from '../hooks/useAgenticPipeline';
import { FileUploader } from './FileUploader';
import { PipelineInput } from '../services/agenticPipeline';

interface PipelineTabProps {
  sessionId?: string;
  sessionName?: string;
}

export const PipelineTab: React.FC<PipelineTabProps> = ({ 
  sessionId = 'nueva',
  sessionName = 'Nueva Sesión'
}) => {
  const { state, isRunning, startPipeline, resetPipeline, exportLog } = useAgenticPipeline(sessionName);
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [transcriptContents, setTranscriptContents] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setError(null);
    
    // Leer contenido de los archivos
    const contents: string[] = [];
    for (const file of files) {
      try {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        contents.push(text);
      } catch (e) {
        console.error('Error leyendo archivo:', e);
      }
    }
    
    setTranscriptContents(prev => [...prev, ...contents]);
  }, []);

  const handleClearFiles = useCallback(() => {
    setUploadedFiles([]);
    setTranscriptContents([]);
    setGeneratedDocument('');
    setError(null);
    resetPipeline(sessionName);
  }, [resetPipeline, sessionName]);

  const handleStartPipeline = useCallback(async () => {
    if (transcriptContents.length === 0) {
      setError('Debes cargar al menos un archivo de transcripción');
      return;
    }

    setError(null);
    setGeneratedDocument('');

    const input: PipelineInput = {
      sessionId,
      sessionName,
      transcriptParts: transcriptContents,
      youtubeUrl: youtubeUrl || undefined
    };

    try {
      const result = await startPipeline(input);
      setGeneratedDocument(result);
    } catch (e: any) {
      setError(e.message || 'Error ejecutando el pipeline');
    }
  }, [transcriptContents, youtubeUrl, sessionId, sessionName, startPipeline]);

  const handleDownloadLog = useCallback(() => {
    const log = exportLog();
    const blob = new Blob([log], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACTAGEN_LOG_${sessionId}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportLog, sessionId]);

  const handleDownloadDocument = useCallback(() => {
    if (!generatedDocument) return;
    
    const blob = new Blob([generatedDocument], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACTA_${sessionId}_KERNEL19.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedDocument, sessionId]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                🧠 Kernel 19 Pasos - Pipeline Agéntico
              </h2>
              <p className="text-slate-500 mt-1">
                Procesamiento secuencial con visualización de razonamiento en tiempo real
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleClearFiles}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} />
                Reiniciar
              </button>
              
              <button
                onClick={handleDownloadLog}
                disabled={state.globalThoughts.length === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                Exportar Log
              </button>
            </div>
          </div>

          {/* Input Section */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div>
              <FileUploader
                accept=".txt,.md,.docx"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                label="Cargar Transcripciones"
                subLabel="Fragmentos de la sesión (Parte 1, Parte 2...)"
                icon={FileUp}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {uploadedFiles.length} archivo(s) cargados
                    </span>
                  </div>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="text-xs text-slate-500 truncate">
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* YouTube URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL de YouTube (Opcional)
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Para cross-check de auditoría (Paso 8)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Start Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleStartPipeline}
              disabled={isRunning || uploadedFiles.length === 0}
              className={`
                px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 transition-all
                ${isRunning || uploadedFiles.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                }
              `}
            >
              {isRunning ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Ejecutando Kernel 19 Pasos...
                </>
              ) : (
                <>
                  <Play size={20} />
                  EJECUTAR PIPELINE AGÉNTICO
                </>
              )}
            </button>
          </div>
        </div>

        {/* Agent Reasoning Terminal */}
        <AgentReasoningTerminal 
          state={state}
          onExportLog={handleDownloadLog}
        />

        {/* Generated Document */}
        {generatedDocument && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                📄 Documento Generado
              </h3>
              <button
                onClick={handleDownloadDocument}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Download size={14} />
                Descargar Acta
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                {generatedDocument}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineTab;
