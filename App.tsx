import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  Youtube,
  X,
  Download,
  Files,
  Menu,
  FileText,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  ListTodo,
  Music,
  Headphones,
  FileSearch,
  Code,
  FileUp,
  Play,
  Layers
} from 'lucide-react';
import { geminiService, GeminiResponse } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';
import { FileUploader } from './components/FileUploader';

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

interface NewSessionState {
  name: string;
  sourceType: 'youtube' | 'audio';
  youtubeUrl: string;
  sourceAudio: File | null;
  transcriptFiles: File[];
  actaType: 'Literal' | 'Sucinta';
}

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'protocol' | 'manual' | 'validator'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<string>(''); // For progress bar
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States for Validator
  const [validatorFiles, setValidatorFiles] = useState<File[]>([]);
  const [validatorParts, setValidatorParts] = useState<any[]>([]); // Array of API parts
  const [xmlResult, setXmlResult] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState<NewSessionState>({
    name: '',
    sourceType: 'youtube',
    youtubeUrl: '',
    sourceAudio: null,
    transcriptFiles: [],
    actaType: 'Literal'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    geminiService.initChat();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing, terminalLines]);

  const activeSession = sessions.find(s => s.id === selectedSessionId);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
    setMobileMenuOpen(false); 
    setGeneratedDocument('');
    if (chatHistory.length === 0 || selectedSessionId !== id) {
       setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `**AGENTE RELATOR ONLINE**\n\nHola, soy tu asistente de relatoría.`,
        timestamp: new Date(),
        type: 'text'
      }]);
    }
  };

  const handleCreateSession = () => {
      const newId = (Math.floor(Math.random() * 1000) + 350).toString();
      const newSession: SessionData = {
        id: newId,
        name: newSessionData.name || `Sesión Nueva #${newId}`,
        date: new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: SessionStatus.PENDING,
        files: [],
        duration: '0h 0m',
        youtubeUrl: newSessionData.sourceType === 'youtube' ? newSessionData.youtubeUrl : undefined,
        sourceAudio: newSessionData.sourceType === 'audio' ? newSessionData.sourceAudio! : undefined,
        transcriptFiles: newSessionData.transcriptFiles.map(f => f.name),
        actaType: newSessionData.actaType
      };
  
      setSessions([newSession, ...sessions]);
      setShowImportModal(false);
      handleSessionSelect(newId);
      setNewSessionData({ name: '', sourceType: 'youtube', youtubeUrl: '', sourceAudio: null, transcriptFiles: [], actaType: 'Literal' });
  };
  
  const handleAddFilesToActiveSession = (files: File[]) => {
      if (files && selectedSessionId) {
        const newFiles = files.map((f: File) => f.name);
        setSessions(prev => prev.map(s => {
          if (s.id === selectedSessionId) {
            return {
              ...s,
              transcriptFiles: [...(s.transcriptFiles || []), ...newFiles]
            };
          }
          return s;
        }));
      }
  };

  const handleTeiAudit = async () => {
    if (validatorParts.length === 0) return;
    
    setIsValidating(true);
    setXmlResult(''); 
    
    try {
      await new Promise(r => setTimeout(r, 500));
      // Send the array of parts (files)
      const result = await geminiService.auditTextWithTEI(validatorParts);
      setXmlResult(result);
    } catch (error) {
      console.error(error);
      setXmlResult("Error crítico al ejecutar auditoría TEI/Fusión.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidatorFileUpload = async (files: File[]) => {
    if (files && files.length > 0) {
        // Append new files to existing ones or replace? For simplicity, we add them.
        const updatedFiles = [...validatorFiles, ...files];
        setValidatorFiles(updatedFiles);
        setXmlResult(''); 
        
        // Process ALL files into parts
        const newParts: any[] = [];
        for (const file of files) {
             if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                 try {
                     const base64Data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const res = reader.result as string;
                            if (res) resolve(res.split(',')[1]);
                            else reject("Empty file");
                        }
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                     });
                     newParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: 'application/pdf'
                        }
                     });
                 } catch (e) { console.error("PDF Error", e); }
            } else {
                // Text/XML/Code
                const text = await new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = (e) => resolve(e.target?.result as string);
                     reader.readAsText(file);
                });
                newParts.push({ text: `[ARCHIVO: ${file.name}]\n${text}` });
            }
        }
        
        // Accumulate parts
        setValidatorParts(prev => [...prev, ...newParts]);
    }
  };

  const clearValidator = () => {
      setValidatorFiles([]);
      setValidatorParts([]);
      setXmlResult('');
  };

  const handleDownloadDocx = () => {
      const session = sessions.find(s => s.id === selectedSessionId);
      const contentToDownload = generatedDocument || `Error: No se ha generado contenido aún.`;
      const element = document.createElement("a");
      const file = new Blob([contentToDownload], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = `ACTA_OFICIAL_${session?.id}_CONSOLIDADA.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  const executeMasterProcess = async () => {
     const session = sessions.find(s => s.id === selectedSessionId);
     if (isProcessing) return;
     setIsProcessing(true);
     const isAudioSession = !!session?.sourceAudio;
     
     setTerminalLines([]);
     try {
       if (isAudioSession && session?.sourceAudio) {
         setTerminalLines(prev => [...prev, { text: `Inicializando Kernel...`, type: 'info' }]);
         const audioPart = await fileToGenerativePart(session.sourceAudio);
         const contextInfo = `Sesión: ${session.name}`;
         let fullDocumentAccumulator = "";
         let phaseCounter = 1;
         for await (const chunk of geminiService.generateLongAudioActa(audioPart, contextInfo)) {
           fullDocumentAccumulator += `\n\n## ${chunk.step}\n\n${chunk.text}`;
           setProcessingPhase(`${phaseCounter}/5: ${chunk.step}`);
           phaseCounter++;
         }
         setGeneratedDocument(fullDocumentAccumulator);
       } else {
         const response = await geminiService.sendMessage(`Generar acta para ${session?.name}`, session?.youtubeUrl);
         setGeneratedDocument(response.text);
       }
     } catch (e) { console.error(e); } 
     finally { setIsProcessing(false); }
  };

  const handleSendMessage = async () => {
      if (!inputMessage.trim() || isProcessing) return;
      setInputMessage('');
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
                  <SidebarItem icon={FileSearch} label="Auditoría TEI / XML" active={activeTab === 'validator'} onClick={() => setActiveTab('validator')} badge="New" />
                  <SidebarItem icon={FileText} label="Manual de Estilo" active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
              </nav>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0 border-r border-slate-200 shadow-sm"><Sidebar /></aside>
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <h1 className="text-lg font-bold">ActaGen AI</h1>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
             <div className="h-full overflow-y-auto p-4 md:p-8"><SessionCard session={sessions[0]} active={false} onClick={handleSessionSelect} /></div>
          )}

          {activeTab === 'validator' && (
             <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
                <div className="max-w-6xl mx-auto flex flex-col h-full pb-12">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-6 flex-none">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Layers size={32} /></div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">Auditoría + Fusión de Insumos</h2>
                          <p className="text-slate-500">Carga múltiples borradores (Parte 1, Parte 2...). El Agente los fusionará, limpiará y auditará.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                             <FileUploader 
                                accept=".txt,.md,.xml,.docx,.pdf" 
                                multiple={true} // Enable multiple files
                                onFilesSelected={handleValidatorFileUpload}
                                label="Cargar Múltiples Borradores"
                                subLabel="Soporta DOCX, PDF, TXT (Parte 1, Parte 2...)"
                                icon={FileSearch}
                             />
                             {validatorFiles.length > 0 && (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                   <div className="flex gap-2 items-center">
                                      <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-md">{validatorFiles.length} archivos</span>
                                      <span className="text-xs text-slate-500 truncate max-w-[200px]">{validatorFiles.map(f => f.name).join(', ')}</span>
                                   </div>
                                   <button onClick={clearValidator} className="text-xs text-red-500 hover:underline">Limpiar</button>
                                </div>
                             )}
                          </div>
                          <div className="flex flex-col justify-center gap-2">
                             <button 
                                onClick={handleTeiAudit} 
                                disabled={validatorFiles.length === 0 || isValidating}
                                className={`h-full px-8 rounded-2xl font-bold text-sm shadow-lg flex flex-col items-center justify-center gap-2 transition-all ${validatorFiles.length === 0 || isValidating ? 'bg-slate-100 text-slate-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                             >
                                {isValidating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                                {isValidating ? 'Fusionando & Auditando...' : 'FUSIONAR Y AUDITAR'}
                             </button>
                          </div>
                      </div>
                   </div>

                   {/* Output Area */}
                   <div className="flex-1 min-h-[400px] bg-[#1E1E2E] rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col font-mono text-sm relative border border-slate-800">
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                         <div className="flex items-center gap-2 text-slate-400">
                           <Code size={16} />
                           <span className="font-bold">TEI_XML_OUTPUT_CONSOLE</span>
                         </div>
                         <div className="flex gap-4 text-xs">
                            <span className="text-red-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Spelling</span>
                            <span className="text-yellow-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Style</span>
                            <span className="text-blue-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Consistency</span>
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto custom-scrollbar text-slate-300 leading-relaxed whitespace-pre-wrap">
                         {xmlResult ? (
                            xmlResult.split(/(<FLAW[^>]*>.*?<\/FLAW>)/g).map((part, index) => {
                               if (part.startsWith('<FLAW')) {
                                  const typeMatch = part.match(/type="([^"]*)"/);
                                  const suggestionMatch = part.match(/suggestion="([^"]*)"/);
                                  const contentMatch = part.match(/>(.*?)<\/FLAW>/);
                                  
                                  const type = typeMatch ? typeMatch[1] : 'unknown';
                                  const suggestion = suggestionMatch ? suggestionMatch[1] : '';
                                  const content = contentMatch ? contentMatch[1] : '';

                                  let colorClass = 'text-slate-200';
                                  if (type === 'spelling') colorClass = 'text-red-400 border-b border-red-400/50';
                                  if (type === 'style') colorClass = 'text-yellow-400 border-b border-yellow-400/50';
                                  if (type === 'coherence') colorClass = 'text-orange-400 border-b border-orange-400/50';
                                  if (type === 'grammar') colorClass = 'text-blue-400 border-b border-blue-400/50';

                                  return (
                                     <span key={index} className="relative group cursor-help inline-block mx-1">
                                        <span className={`${colorClass} font-bold bg-white/5 px-1 rounded`}>{content}</span>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-black text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none border border-white/20">
                                           <div className="font-bold text-[10px] uppercase text-slate-400 mb-1">TYPE: {type}</div>
                                           <div className="text-green-400">SUGGESTION: {suggestion}</div>
                                        </span>
                                     </span>
                                  );
                               }
                               return <span key={index}>{part}</span>;
                            })
                         ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                               {isValidating ? (
                                   <>
                                      <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
                                      <p className="text-slate-400">El Agente está unificando borradores y auditando...</p>
                                   </>
                               ) : (
                                   <>
                                      <FileSearch size={48} className="opacity-20" />
                                      <p>Esperando archivos para procesar...</p>
                                   </>
                               )}
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