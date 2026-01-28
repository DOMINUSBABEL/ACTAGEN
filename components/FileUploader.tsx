import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Loader2, FileAudio, FileText, FileSpreadsheet, Presentation } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label?: string;
  subLabel?: string;
  icon?: React.ElementType;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  accept, 
  multiple = false, 
  label = "Haga clic para subir archivos", 
  subLabel = "Soporta MP3, DOCX, PDF, TXT, XLSX, PPTX",
  icon: Icon = UploadCloud
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.mp3') || name.endsWith('.wav')) return FileAudio;
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return FileSpreadsheet;
    if (name.endsWith('.pptx') || name.endsWith('.ppt')) return Presentation;
    if (name.endsWith('.pdf')) return FileText;
    return FileIcon;
  };

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setFileName(files.length === 1 ? files[0].name : `${files.length} archivos seleccionados`);

    // Simulación de carga basada en el tamaño total para UX
    // En una app real, esto estaría atado al FileReader o XHR
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const simulationDuration = Math.min(Math.max(totalSize / 100000, 800), 3000); // Min 800ms, Max 3s
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      // Curva de progreso logarítmica para realismo
      const increment = Math.max(1, (100 - currentProgress) / 10);
      setUploadProgress(prev => Math.min(prev + increment, 99));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          onFilesSelected(files);
        }, 400);
      }
    }, simulationDuration / 20);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const CurrentIcon = fileName ? getFileIcon(fileName) : Icon;

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group overflow-hidden ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-200 hover:bg-slate-50 hover:border-blue-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-full max-w-[200px] bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-200 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 animate-pulse">
               <Loader2 size={14} className="animate-spin" />
               <span>Subiendo... {Math.round(uploadProgress)}%</span>
            </div>
          </div>
        ) : (
          <>
            <CurrentIcon 
              className={`mx-auto mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 text-blue-600' : 'text-blue-500 group-hover:scale-110'}`} 
              size={32} 
            />
            
            <p className="text-sm font-bold text-slate-700 mb-1">
              {label}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              {subLabel}
            </p>
          </>
        )}
      </div>
    </div>
  );
};