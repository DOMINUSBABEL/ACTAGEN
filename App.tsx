import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Header, 
  Footer, 
  PageNumber,
  WidthType
} from "docx";
import { 
  LayoutDashboard, 
  Bot,
  Loader2,
  CheckCircle2,
  Youtube,
  X,
  FileText,
  ShieldCheck,
  Zap,
  FileSearch,
  Code,
  Layers,
  Eye,
  Check,
  AlertTriangle,
  PenTool,
  Search,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Download,
  Trash2,
  ArrowRight,
  Sparkles,
  FileDown,
  Menu,
  MoreHorizontal
} from 'lucide-react';
import { geminiService, GeminiResponse } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';
import { FileUploader } from './components/FileUploader';

// Configure PDF.js worker
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
} else {
  console.warn("PDF.js GlobalWorkerOptions not found. PDF extraction may fail.");
}

const INITIAL_SESSIONS: SessionData[] = [
  {
    id: '348',
    name: 'Sesión Ordinaria #348',
    date: 'Oct 24, 2026',
    status: SessionStatus.PENDING,
    files: ['Anexo_A_Asistencia.pdf', 'Anexo_B_Presupuesto.pdf'],
    duration: '2h 14m',
    youtubeUrl: 'https://youtube.com/watch?v=example',
    transcriptFiles: ['348_parte1.docx', '348_parte2.docx', '348_parte3.docx'],
    actaType: 'Literal'
  },
  {
    id: '347',
    name: 'Sesión Extraordinaria #347',
    date: 'Oct 10, 2026',
    status: SessionStatus.COMPLETED,
    files: ['video_sesion_347.mp4', 'Anexo_Unico.pdf'],
    duration: '45m',
    actaType: 'Sucinta'
  }
];

interface FlawDetail {
    original: string;
    suggestion: string;
    type: string;
    reason?: string;
    id: string; 
}

// Helper to extract text from PDF
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n[PÁGINA ${i}]\n${pageText}\n`;
    }
    return fullText;
  } catch (error) {
    console.error("PDF Extraction Failed:", error);
    throw error;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'protocol' | 'manual' | 'validator'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const activeSession = sessions.find(s => s.id === selectedSessionId);
  
  // Validator State
  const [validatorFiles, setValidatorFiles] = useState<File[]>([]);
  const [validatorParts, setValidatorParts] = useState<any[]>([]); 
  const [xmlResult, setXmlResult] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [auditProgress, setAuditProgress] = useState<{current: number, total: number, status: string}>({ current: 0, total: 0, status: 'Esperando inicio...' });
  const [selectedFlaw, setSelectedFlaw] = useState<FlawDetail | null>(null);
  
  // UI State
  const [viewMode, setViewMode] = useState<'code' | 'visual'>('visual');
  const [zenMode, setZenMode] = useState(false); // New: Hide sidebar/header
  const [isAssistantOpen, setIsAssistantOpen] = useState(true); // New: Collapse assistant
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    geminiService.initChat();
  }, []);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
  };

  const handleTeiAudit = async () => {
    if (validatorParts.length === 0) return;
    setIsValidating(true);
    setXmlResult(''); 
    setAuditProgress({ current: 0, total: 0, status: 'Preparando documentos...' });
    setSelectedFlaw(null);
    
    try {
      await new Promise(r => setTimeout(r, 800));
      const result = await geminiService.auditTextWithTEI(validatorParts, (current, total) => {
          setAuditProgress({ current, total, status: `Analizando bloque ${current} de ${total}...` });
      });
      setAuditProgress(prev => ({ ...prev, status: 'Finalizando ensamblaje...' }));
      setXmlResult(result);
    } catch (error) {
      console.error(error);
      setXmlResult("Error crítico al ejecutar auditoría TEI/Fusión.");
    } finally {
      setIsValidating(false);
    }
  };

  const getCleanText = () => {
      if (!xmlResult) return "";
      // Clean up the text by applying suggestions logic
      let cleanText = xmlResult.replace(/<FLAW[^>]*suggestion="([^"]*)"[^>]*>.*?<\/FLAW>/g, '$1');
      // Remove any remaining tags
      cleanText = cleanText.replace(/<FLAW[^>]*>.*?<\/FLAW>/g, '');
      // Fallback for any other tags
      cleanText = cleanText.replace(/<\/?[^>]+(>|$)/g, "");
      return cleanText;
  };

  const generateDocxBlob = async (cleanText: string): Promise<Blob> => {
    const lines = cleanText.split('\n');
    const children: any[] = [];

    // Styles constants based on Gold Standard
    const STYLES = {
        font: "Arial",
        sizeBody: 24, // 12pt
        sizeCitation: 22, // 11pt
        sizeHeader: 20, // 10pt
        margins: {
            top: 1440, 
            bottom: 1440,
            left: 1700, 
            right: 1440,
        }
    };

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Logic from user script
        if (trimmed.startsWith("FECHA:") || trimmed.startsWith("HORA:") || trimmed.startsWith("LUGAR:")) {
            const parts = trimmed.split(":");
            const label = parts[0];
            const rest = parts.slice(1).join(":");
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: label + ": ", bold: true, size: STYLES.sizeBody, font: STYLES.font }),
                    new TextRun({ text: rest.trim(), size: STYLES.sizeBody, font: STYLES.font })
                ],
                spacing: { after: 100 }
            }));
        } 
        else if (trimmed.startsWith("Intervino")) {
             children.push(new Paragraph({
                children: [new TextRun({
                    text: trimmed,
                    size: STYLES.sizeBody,
                    bold: true,
                    font: STYLES.font
                })],
                spacing: { before: 400, after: 200, line: 360 },
                alignment: AlignmentType.JUSTIFIED
             }));
        }
        else if (trimmed.startsWith("“") || trimmed.startsWith("\"")) {
             children.push(new Paragraph({
                children: [new TextRun({
                    text: trimmed,
                    size: STYLES.sizeCitation,
                    font: STYLES.font
                })],
                spacing: { before: 0, after: 200, line: 360 },
                indent: { left: 720 },
                alignment: AlignmentType.JUSTIFIED
             }));
        }
        else if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
             children.push(new Paragraph({
                children: [new TextRun({
                    text: trimmed,
                    size: STYLES.sizeBody,
                    bold: true,
                    font: STYLES.font
                })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200, line: 360 }
             }));
        }
        else {
             children.push(new Paragraph({
                children: [new TextRun({
                    text: trimmed,
                    size: STYLES.sizeBody,
                    font: STYLES.font
                })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 0, after: 200, line: 360 }
             }));
        }
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: STYLES.font,
                        size: STYLES.sizeBody,
                    },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    margin: STYLES.margins,
                },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "CONCEJO DE MEDELLÍN", bold: true, size: STYLES.sizeHeader })],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "RELATORÍA - SISTEMA SIMI", size: 16 })], // 8pt
                            alignment: AlignmentType.CENTER,
                        })
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun("Página "),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                }),
                                new TextRun(" de "),
                                new TextRun({
                                    children: [PageNumber.TOTAL_PAGES],
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            children: children,
        }],
    });

    return await Packer.toBlob(doc);
  };
  
  const handleDownload = async (format: 'doc' | 'docx') => {
      if (!xmlResult) return;
      const cleanText = getCleanText();
      
      if (format === 'doc') {
        // Wrap in basic HTML for Word compatibility (.doc legacy)
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Acta Exportada</title>
                <style>
                    body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
                    p { margin-bottom: 1em; }
                </style>
            </head>
            <body>
            ${cleanText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
            </body></html>
        `;
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        triggerDownload(blob, 'doc');
      } else {
        // Native DOCX generation
        try {
            const blob = await generateDocxBlob(cleanText);
            triggerDownload(blob, 'docx');
        } catch (error) {
            console.error("DOCX Generation failed:", error);
            alert("Error generando DOCX. Intente con formato .doc");
        }
      }
      setShowExportMenu(false);
  };

  const triggerDownload = (blob: Blob, ext: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BORRADOR_ACTA_${new Date().getTime()}.${ext}`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
      const cleanText = getCleanText();
      navigator.clipboard.writeText(cleanText).then(() => {
          alert("Texto limpio copiado al portapapeles. Listo para pegar en Word.");
      });
  };

  const handleValidatorFileUpload = async (files: File[]) => {
    if (files && files.length > 0) {
        const updatedFiles = [...validatorFiles, ...files];
        setValidatorFiles(updatedFiles);
        setXmlResult(''); 
        
        const newParts: any[] = [];
        for (const file of files) {
             if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                 try {
                     const extractedText = await extractTextFromPDF(file);
                     newParts.push({ text: `[ARCHIVO PDF EXTRAÍDO: ${file.name}]\n${extractedText}` });
                 } catch (e) { 
                     const base64Data = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(file);
                     });
                     newParts.push({
                        inlineData: { data: base64Data, mimeType: 'application/pdf' }
                     });
                 }
            } else {
                const text = await new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = (e) => resolve(e.target?.result as string);
                     reader.readAsText(file);
                });
                newParts.push({ text: `[ARCHIVO: ${file.name}]\n${text}` });
            }
        }
        setValidatorParts(prev => [...prev, ...newParts]);
    }
  };

  const clearValidator = () => {
      setValidatorFiles([]);
      setValidatorParts([]);
      setXmlResult('');
      setAuditProgress({ current: 0, total: 0, status: '' });
      setSelectedFlaw(null);
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
        <div className="flex items-center gap-3"><Icon size={20} />{label}</div>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{badge}</span>}
      </button>
  );

  const Sidebar = () => (
      <div className="flex flex-col h-full bg-white border-r border-slate-200">
          <div className="p-6">
              <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Bot className="text-white" size={22} /></div><span className="font-bold text-lg">ActaGen</span></div>
              <nav className="space-y-1.5">
                  <SidebarItem icon={LayoutDashboard} label="Tablero Operativo" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                  <SidebarItem icon={ShieldCheck} label="Protocolo (19 Pasos)" active={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} badge="Master" />
                  <SidebarItem icon={FileSearch} label="Asistente de Revisión" active={activeTab === 'validator'} onClick={() => setActiveTab('validator')} badge="New" />
                  <SidebarItem icon={FileText} label="Manual de Estilo" active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
              </nav>
          </div>
      </div>
  );
  
  const getLabelForType = (type: string) => {
      if (type.includes('basura')) return { label: 'Basura Editorial / Typo', color: 'bg-slate-200 text-slate-600' };
      if (type.includes('coherencia')) return { label: 'Duda Semántica (¿Audio?)', color: 'bg-orange-100 text-orange-700' };
      if (type.includes('entidad') || type.includes('entity')) return { label: 'Entidad Faltante', color: 'bg-purple-100 text-purple-700' };
      if (type.includes('estilo') || type.includes('style')) return { label: 'Estilo / Convención', color: 'bg-yellow-100 text-yellow-700' };
      if (type.includes('ortografia') || type.includes('spelling')) return { label: 'Ortografía', color: 'bg-red-100 text-red-700' };
      if (type.includes('puntuacion') || type.includes('punctuation')) return { label: 'Puntuación', color: 'bg-orange-100 text-orange-700' };
      if (type.includes('formato') || type.includes('format')) return { label: 'Formato Cifras', color: 'bg-blue-100 text-blue-700' };
      return { label: 'Corrección General', color: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      {!zenMode && (
        <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0 border-r border-slate-200 shadow-sm transition-all duration-300">
            <Sidebar />
        </aside>
      )}
      
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        {!zenMode && (
            <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 transition-all duration-300">
                <h1 className="text-lg font-bold">ActaGen AI - Asistente de Relatoría</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setZenMode(true)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center gap-2 text-xs font-bold transition-all"
                        title="Activar Modo Zen (Pantalla Completa)"
                    >
                        <Maximize2 size={16} /> MODO ZEN
                    </button>
                </div>
            </header>
        )}

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
             <div className="h-full overflow-y-auto p-4 md:p-8"><SessionCard session={sessions[0]} active={false} onClick={handleSessionSelect} /></div>
          )}

          {activeTab === 'validator' && (
             <div className={`h-full flex flex-col ${zenMode ? 'p-0 bg-white' : 'p-4 md:p-6 bg-[#F8FAFC]'}`}>
                {/* Header Section / Toolbar */}
                <div className={`flex-none ${zenMode ? 'px-6 py-3 border-b border-slate-200 bg-slate-50' : 'mb-4'}`}>
                   {!zenMode ? (
                       <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Layers size={24} /></div>
                            <div>
                              <h2 className="text-lg font-bold text-slate-900 leading-tight">Revisión y Ensamble</h2>
                              <p className="text-xs text-slate-500">Carga documentos para unir y auditar.</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 items-center flex-1 justify-end">
                              <div className="w-[300px]">
                                <FileUploader 
                                    accept=".txt,.md,.xml,.docx,.pdf" 
                                    multiple={true} 
                                    onFilesSelected={handleValidatorFileUpload}
                                    label="Subir Partes"
                                    subLabel="PDF, DOCX"
                                    icon={FileSearch}
                                />
                              </div>
                              <button 
                                onClick={handleTeiAudit} 
                                disabled={validatorFiles.length === 0 || isValidating}
                                className={`h-12 px-6 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all ${validatorFiles.length === 0 || isValidating ? 'bg-slate-100 text-slate-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                              >
                                {isValidating ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                {isValidating ? 'PROCESANDO...' : 'AUDITAR'}
                              </button>
                              
                              {validatorFiles.length > 0 && (
                                <button onClick={clearValidator} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Limpiar todo">
                                    <Trash2 size={20} />
                                </button>
                              )}
                          </div>
                       </div>
                   ) : (
                       // Zen Mode Toolbar
                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <button 
                                    onClick={() => setZenMode(false)}
                                    className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg mr-2"
                                    title="Salir de Modo Zen"
                                >
                                    <Minimize2 size={18} />
                                </button>
                               <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg"><Zap size={16} /></div>
                               <span className="font-bold text-slate-700 text-sm hidden md:inline">Modo Zen: Edición Asistida</span>
                           </div>
                           <div className="flex gap-2 relative">
                                <button onClick={handleCopyToClipboard} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                                    <Copy size={14} /> COPIAR
                                </button>
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        className="px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2 shadow-sm"
                                    >
                                        <FileDown size={14} /> EXPORTAR REVISIÓN (DOC)
                                    </button>
                                    
                                    {showExportMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                            <button onClick={() => handleDownload('doc')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2">
                                                <FileText size={16} className="text-blue-600" />
                                                <span>Formato Word (.doc)</span>
                                                <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded ml-auto">Recomendado</span>
                                            </button>
                                            <button onClick={() => handleDownload('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100">
                                                <FileText size={16} className="text-blue-600" />
                                                <span>Formato Word (.docx)</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                           </div>
                       </div>
                   )}
                </div>

                {/* Main Split View Area */}
                <div className={`flex-1 flex overflow-hidden ${zenMode ? '' : 'gap-6'} relative`}>
                    
                    {/* Left Pane: Editor */}
                    <div className={`flex-1 bg-white flex flex-col overflow-hidden transition-all ${zenMode ? '' : 'rounded-3xl border border-slate-200 shadow-xl'}`}>
                        {/* Editor Toolbar inside Pane (only visible in standard mode or if needed) */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex bg-slate-200 rounded-lg p-1">
                                    <button 
                                        onClick={() => setViewMode('visual')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'visual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Eye size={14} /> Visual
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('code')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'code' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Code size={14} /> Código
                                    </button>
                                </div>
                                {isValidating && (
                                    <div className="flex flex-1 items-center gap-3 animate-pulse px-4 border-l border-slate-200 ml-4">
                                        <Loader2 size={14} className="text-purple-600 animate-spin" />
                                        <span className="text-xs font-bold text-purple-700 whitespace-nowrap">{auditProgress.status}</span>
                                        <div className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden max-w-[200px]">
                                            <div 
                                                className="h-full bg-purple-500 transition-all duration-500 ease-out" 
                                                style={{ width: `${(auditProgress.current / (auditProgress.total || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!zenMode && xmlResult && (
                                    <>
                                        <button onClick={handleCopyToClipboard} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Copiar texto">
                                            <Copy size={18} />
                                        </button>
                                        <div className="relative">
                                            <button onClick={() => setShowExportMenu(!showExportMenu)} className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-2">
                                                <Download size={16} /> EXPORTAR
                                            </button>
                                            {showExportMenu && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                                    <button onClick={() => handleDownload('doc')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2">
                                                        <FileText size={16} className="text-blue-600" />
                                                        <span>Formato Word (.doc)</span>
                                                    </button>
                                                    <button onClick={() => handleDownload('docx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-2 border-t border-slate-100">
                                                        <FileText size={16} className="text-blue-600" />
                                                        <span>Formato Word (.docx)</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-white relative">
                            {xmlResult ? (
                                viewMode === 'code' ? (
                                    <pre className="font-mono text-xs text-slate-600 whitespace-pre-wrap">{xmlResult}</pre>
                                ) : (
                                    <div className="prose max-w-none text-slate-700 leading-relaxed font-serif text-lg pb-20">
                                        {xmlResult.split(/(<FLAW[^>]*>.*?<\/FLAW>)/g).map((part, index) => {
                                            if (part.startsWith('<FLAW')) {
                                                const typeMatch = part.match(/type="([^"]*)"/);
                                                const suggestionMatch = part.match(/suggestion="([^"]*)"/);
                                                const reasonMatch = part.match(/reason="([^"]*)"/); 
                                                const contentMatch = part.match(/>(.*?)<\/FLAW>/);
                                                
                                                const type = typeMatch ? typeMatch[1] : 'unknown';
                                                const suggestion = suggestionMatch ? suggestionMatch[1] : '';
                                                const reason = reasonMatch ? reasonMatch[1] : '';
                                                const content = contentMatch ? contentMatch[1] : '';
                                                const id = `flaw-${index}`;

                                                let highlightClass = 'bg-slate-200 decoration-slate-400';
                                                if (type.includes('estilo')) highlightClass = 'bg-yellow-100 decoration-yellow-400 text-yellow-900';
                                                if (type.includes('puntuacion')) highlightClass = 'bg-orange-100 decoration-orange-400 text-orange-900';
                                                if (type.includes('ortografia')) highlightClass = 'bg-red-100 decoration-red-400 text-red-900';
                                                if (type.includes('formato')) highlightClass = 'bg-blue-100 decoration-blue-400 text-blue-900';
                                                if (type.includes('entidad')) highlightClass = 'bg-purple-100 decoration-purple-400 text-purple-900';
                                                if (type.includes('basura')) highlightClass = 'bg-slate-300 decoration-slate-500 text-slate-500 line-through opacity-60';
                                                if (type.includes('coherencia')) highlightClass = 'bg-orange-100 decoration-orange-400 text-orange-900 border-orange-200';

                                                const isSelected = selectedFlaw?.id === id;

                                                return (
                                                    <span 
                                                        key={index} 
                                                        onClick={() => {
                                                            setSelectedFlaw({ id, original: content, suggestion, type, reason });
                                                            if (!isAssistantOpen) setIsAssistantOpen(true);
                                                        }}
                                                        className={`cursor-pointer px-1 rounded mx-0.5 border-b-2 transition-all ${highlightClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 inline-block' : ''} border-dashed`}
                                                        title="Clic para revisar"
                                                    >
                                                        {content}
                                                    </span>
                                                );
                                            }
                                            return <span key={index}>{part}</span>;
                                        })}
                                    </div>
                                )
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <FileText size={64} className="mb-4" />
                                    <p>Sube archivos y presiona Auditar para ver el resultado.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collapsible Trigger */}
                    <button 
                        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                        className={`absolute top-1/2 ${isAssistantOpen ? 'right-[340px]' : 'right-0'} z-20 p-1.5 bg-white border border-slate-200 shadow-md rounded-l-xl text-slate-500 hover:text-blue-600 transition-all duration-300 transform -translate-y-1/2`}
                        title={isAssistantOpen ? "Ocultar Asistente" : "Mostrar Asistente"}
                    >
                        {isAssistantOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {/* Right Pane: Assistant */}
                    <div 
                        className={`${isAssistantOpen ? 'w-[340px] opacity-100' : 'w-0 opacity-0'} bg-white flex flex-col border-l border-slate-200 transition-all duration-300 overflow-hidden ${zenMode ? '' : 'rounded-3xl shadow-xl'}`}
                    >
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Sparkles size={18} className="text-purple-600" />
                                <span>Asistente de Corrección</span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {selectedFlaw ? (
                                <div className="space-y-6 animate-pulse-glow" style={{ animationDuration: '0.3s' }}>
                                    <div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getLabelForType(selectedFlaw.type).color}`}>
                                            {getLabelForType(selectedFlaw.type).label}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800 mt-3 mb-1 leading-tight">Observación del Asistente</h3>
                                    </div>

                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <div className="text-xs text-red-500 font-bold uppercase mb-1 flex items-center gap-1"><X size={12}/> Texto Original</div>
                                        <div className="text-red-900 font-medium line-through decoration-red-300 break-words">{selectedFlaw.original}</div>
                                    </div>

                                    <div className="flex justify-center">
                                        <ArrowRight size={20} className="text-slate-300" />
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                                        <div className="text-xs text-green-600 font-bold uppercase mb-1 flex items-center gap-1"><Check size={12}/> Sugerencia de Cambio</div>
                                        <div className="text-green-900 font-bold text-lg break-words">{selectedFlaw.suggestion || '(Eliminar)'}</div>
                                    </div>

                                    {selectedFlaw.reason && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 leading-snug">
                                            <span className="font-bold block mb-1">Por qué:</span> {selectedFlaw.reason}
                                        </div>
                                    )}

                                    {(selectedFlaw.type.includes('entidad') || selectedFlaw.type.includes('coherencia')) && activeSession?.youtubeUrl ? (
                                        <a 
                                            href={activeSession.youtubeUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all mb-2"
                                        >
                                            <Youtube size={18} />
                                            Verificar Audio en YouTube
                                        </a>
                                    ) : null}
                                    
                                    <div className="text-center text-xs text-slate-400 mt-4 border-t border-slate-100 pt-4">
                                        Use los botones de exportación superior para aplicar estos cambios en un documento final.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 mt-20">
                                    <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium text-slate-600 mb-2">Selecciona un error</p>
                                    <p className="text-sm">Haga clic en el texto subrayado en el panel izquierdo para ver la explicación en español y la corrección.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}