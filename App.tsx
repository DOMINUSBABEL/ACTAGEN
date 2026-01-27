import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FolderOpen, 
  UploadCloud, 
  Bot,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  BookOpen,
  Hash,
  Quote,
  Users,
  Youtube,
  X,
  Download,
  Files,
  Menu,
  ChevronRight,
  Activity,
  History,
  FileText
} from 'lucide-react';
import { geminiService } from './services/geminiService';
import { SessionData, SessionStatus, ChatMessage, TerminalLine } from './types';
import { SessionCard } from './components/SessionCard';
import { TerminalOutput } from './components/TerminalOutput';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'rules'>('dashboard');
  const [sessions, setSessions] = useState<SessionData[]>(INITIAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    name: '',
    youtubeUrl: '',
    transcriptFiles: [] as File[],
    actaType: 'Literal' as 'Literal' | 'Sucinta'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize service
  useEffect(() => {
    geminiService.initChat();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  const handleSessionSelect = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('agent');
    setMobileMenuOpen(false); // Close mobile menu on select
    
    const session = sessions.find(s => s.id === id);
    const hasYoutube = !!session?.youtubeUrl;
    const transcriptCount = session?.transcriptFiles?.length || 0;

    // Reset chat if selecting a new session for demo purposes
    if (chatHistory.length === 0 || selectedSessionId !== id) {
      setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `Hola. Soy ActaGen (v3.0). He cargado el **Protocolo de 19 Pasos** y el **Manual de Estilo Completo**.\n\n` +
                 (transcriptCount > 0 ? `📚 **Entrada**: ${transcriptCount} borradores de digitadoras detectados.\n` : '') +
                 (hasYoutube ? `🎥 **Contraste**: URL de YouTube activa. Generaré una propuesta interna basada en el video para contrastar con los borradores.\n` : '') +
                 `\nMi objetivo es construir una **Propuesta de Acta Literal** lo más completa posible y generar el reporte de observaciones (Paso 19).\n\n¿Inicio el protocolo de revisión y ensamblaje?`,
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
      youtubeUrl: newSessionData.youtubeUrl,
      transcriptFiles: newSessionData.transcriptFiles.map(f => f.name),
      actaType: newSessionData.actaType
    };

    setSessions([newSession, ...sessions]);
    setShowImportModal(false);
    handleSessionSelect(newId);
    setNewSessionData({ name: '', youtubeUrl: '', transcriptFiles: [], actaType: 'Literal' });
  };

  const handleDownloadDocx = () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    const generatedContent = `[CONTENIDO DE EJEMPLO DEL ACTA...]`;
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'application/msword'});
    element.href = URL.createObjectURL(file);
    element.download = `PROPUESTA_ACTA_${session?.id}_CON_OBSERVACIONES.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const simulateCodeExecution = async () => {
    setTerminalLines([]);
    const session = sessions.find(s => s.id === selectedSessionId);
    const files = session?.transcriptFiles || [];
    const hasYoutube = !!session?.youtubeUrl;

    const steps: TerminalLine[] = [
      { text: `iniciando Protocolo de Revisión de 19 Pasos...`, type: 'info' },
    ];

    if (files.length > 0) {
        steps.push({ text: `[PASO 1] Fusión de ${files.length} borradores. Eliminando info digitadoras y empalmes...`, type: 'command' });
        files.forEach((f, i) => {
            if (i > 0) {
                 steps.push({ text: `   >> Empalme Parte ${i}-${i+1}: Eliminado párrafo repetido (Overlap Detection).`, type: 'success' });
            }
        });
    }

    steps.push({ text: `[PASO 2-6] Verificando Metadatos (Portada, Fecha, Horas)...`, type: 'info' });
    
    if (hasYoutube) {
        steps.push({ text: `[CONTRASTE] Analizando Video Fuente (${session?.youtubeUrl})...`, type: 'command' });
        steps.push({ text: `[PASO 7] Asistencia: Cruzando video vs archivo ausentismo.`, type: 'info' });
        steps.push({ text: `[PASO 9] Votaciones: Auditando audio de Secretaría vs Video.`, type: 'warning' });
        steps.push({ text: `   >> Alerta: Borrador cuenta 17 votos, Video cuenta 18. Marcado para observación.`, type: 'error' });
    }

    steps.push({ text: `[PASO 10] Auditoría de Estilo: Revisando Reglas 1-5 (Cifras, Cargos, Puntuación)...`, type: 'command' });
    steps.push({ text: `   >> Regla 2 (Cifras): Corrigiendo "$2.500" a "$ 2500" en folio 12.`, type: 'success' });
    steps.push({ text: `[PASO 12] Formato Imágenes: Ajustando "Detrás del texto" y centrado.`, type: 'info' });
    steps.push({ text: `[PASO 19] Generando Reporte de Observaciones para Digitadoras...`, type: 'command' });
    steps.push({ text: `PROPUESTA DE ACTA LITERAL + FEEDBACK LISTO.`, type: 'success' });

    for (const step of steps) {
        await new Promise(r => setTimeout(r, 600));
        setTerminalLines(prev => [...prev, step]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const responseText = await geminiService.sendMessage(inputMessage);
      const isProcessingRequest = inputMessage.toLowerCase().includes('proce') || inputMessage.toLowerCase().includes('sí') || inputMessage.toLowerCase().includes('ok') || inputMessage.toLowerCase().includes('fusion') || inputMessage.toLowerCase().includes('generar') || inputMessage.toLowerCase().includes('inicio');

      if (isProcessingRequest) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          simulateCodeExecution();
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date(),
        type: isProcessingRequest ? 'audit' : 'text'
      };

      setChatHistory(prev => [...prev, modelMsg]);

      if (isProcessingRequest && selectedSessionId) {
          setSessions(prev => prev.map(s => s.id === selectedSessionId ? {...s, status: SessionStatus.COMPLETED} : s));
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setNewSessionData(prev => ({
            ...prev,
            transcriptFiles: Array.from(e.target.files || [])
        }));
    }
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
        {label}
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
          active ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Bot className="text-white" size={22} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">ActaGen</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Concejo de Medellín</span>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Tablero" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
           <SidebarItem 
            icon={BookOpen} 
            label="Protocolo (19 Pasos)" 
            active={activeTab === 'rules'} 
            onClick={() => setActiveTab('rules')}
            badge="Activo"
          />
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gestión</p>
          </div>
          <SidebarItem 
            icon={FolderOpen} 
            label="Mis Archivos" 
            active={false} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Configuración" 
            active={false} 
          />
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Gemini 3.0 Pro</h4>
              <p className="text-[10px] text-slate-500">Motor de Auditoría</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-right">75% cuota mensual</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full shadow-2xl animate-slide-in">
             <Sidebar />
             <button 
               onClick={() => setMobileMenuOpen(false)}
               className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
             >
               <X size={20} />
             </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        
        {/* Header */}
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {activeTab === 'dashboard' ? 'Resumen de Sesiones' : 
               activeTab === 'rules' ? 'Protocolo de Revisión' : (
               <>
                 <span className="text-slate-400 font-normal">Agente</span>
                 <ChevronRight size={16} className="text-slate-300" />
                 <span>Sesión #{selectedSessionId}</span>
               </>
               )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200/50 shadow-sm">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Operativo
            </div>
          </div>
        </header>

        {/* Content Views */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                         <FileText size={24} />
                       </div>
                       <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">142</div>
                    <div className="text-slate-500 text-sm font-medium">Actas Procesadas</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                         <Activity size={24} />
                       </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">320h</div>
                    <div className="text-slate-500 text-sm font-medium">Tiempo Ahorrado</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300">
                     <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                         <CheckCircle2 size={24} />
                       </div>
                       <span className="text-xs font-bold text-slate-400">v3.0</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">99.4%</div>
                    <div className="text-slate-500 text-sm font-medium">Precisión Auditada</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Sesiones Recientes</h2>
                  <button 
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                  >
                    <UploadCloud size={18} />
                    Nueva Importación
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12">
                  {sessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      active={false}
                      onClick={handleSessionSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rules View */}
          {activeTab === 'rules' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#F8FAFC]">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-sm">
                      <BookOpen size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Protocolo de 19 Pasos</h2>
                      <p className="text-slate-500 mt-1">Reglas de negocio estrictas para el Concejo de Medellín.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</span>
                        <h3 className="font-bold text-slate-800">Fusión y Limpieza</h3>
                      </div>
                      <p className="text-sm text-slate-600 pl-9">Unificar Partes 1, 2, 3... eliminando info digitadoras y empalmes redundantes mediante detección de overlaps.</p>
                    </div>
                    
                    <div className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">9</span>
                        <h3 className="font-bold text-slate-800">Auditoría de Votaciones</h3>
                      </div>
                      <p className="text-sm text-slate-600 pl-9">Conteo estricto (SÍ + NO == Total) y contraste automático con el audio/video de la sesión.</p>
                    </div>

                    <div className="group p-6 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">19</span>
                        <h3 className="font-bold text-blue-900">Observaciones (Feedback Loop)</h3>
                      </div>
                      <p className="text-sm text-blue-800 pl-9">Generación automática de tabla de hallazgos para retroalimentación directa a digitadoras.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agent View */}
          {activeTab === 'agent' && (
            <div className="flex flex-col h-full relative bg-white md:bg-transparent">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 space-y-8 custom-scrollbar">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  >
                    <div className={`max-w-[90%] md:max-w-[75%] lg:max-w-[65%] ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-lg shadow-blue-200' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm shadow-xl shadow-slate-100'
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                          <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                            <Sparkles size={14} className="text-white" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-wider text-indigo-600">
                            Gemini 3 Agent
                          </span>
                        </div>
                      )}
                      
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-normal">
                        {msg.content}
                      </div>

                      {terminalLines.length > 0 && msg.type === 'audit' && (
                          <div className="mt-4">
                            <TerminalOutput lines={terminalLines} />
                          </div>
                      )}

                      {msg.type === 'audit' && (
                        <div className="mt-4 bg-green-50/50 border border-green-100 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-3">
                            <CheckCircle2 size={16} className="text-green-600" /> Auditoría Completada
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                            <div className="bg-white p-2 rounded border border-green-100">
                               <span className="block text-[10px] text-slate-400 uppercase">Fuente</span>
                               <span className="font-semibold text-slate-800">{sessions.find(s => s.id === selectedSessionId)?.youtubeUrl ? 'Video + Texto' : 'Solo Texto'}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-green-100">
                               <span className="block text-[10px] text-slate-400 uppercase">Salida</span>
                               <span className="font-semibold text-slate-800">Acta + Feedback</span>
                            </div>
                          </div>
                          <button 
                            onClick={handleDownloadDocx}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Descargar Documento Final
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center gap-3">
                       <Loader2 className="animate-spin text-blue-600" size={18} />
                       <span className="text-sm text-slate-500 font-medium">Procesando solicitud agéntica...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sticky Input Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 z-20">
                <div className="max-w-4xl mx-auto flex gap-3 relative">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe instrucciones para el agente..."
                    className="flex-1 rounded-2xl border border-slate-200 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm text-sm font-medium transition-all"
                    disabled={isProcessing}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isProcessing || !inputMessage}
                    className={`px-6 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
                      isProcessing || !inputMessage 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-200 active:scale-95'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="max-w-4xl mx-auto mt-2 text-center">
                   <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                     <Users size={10} /> Gemini 3.0 Enterprise Environment
                   </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Nueva Importación */}
        {showImportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 animate-fade-in-up">
              <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Nueva Importación</h3>
                    <p className="text-xs text-slate-500">Configura la sesión para el agente.</p>
                </div>
                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nombre de la Sesión</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sesión Ordinaria #350"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                    value={newSessionData.name}
                    onChange={(e) => setNewSessionData({...newSessionData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Borradores (Partes)</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                        <Files className="text-blue-500" size={24} />
                    </div>
                    {newSessionData.transcriptFiles.length > 0 ? (
                       <div className="text-left">
                         <p className="text-xs font-bold text-green-600 mb-1 text-center">{newSessionData.transcriptFiles.length} Archivos listos</p>
                         <div className="flex justify-center gap-1 mt-2">
                             {newSessionData.transcriptFiles.map((_, i) => (
                                 <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                             ))}
                         </div>
                       </div>
                    ) : (
                       <>
                        <p className="text-sm font-medium text-slate-600">Click para subir borradores</p>
                        <p className="text-xs text-slate-400 mt-1">Soporta .docx, .txt</p>
                       </>
                    )}
                    <input 
                      type="file" 
                      accept=".txt,.docx"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Enlace de YouTube</label>
                  <div className="relative">
                    <Youtube className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="https://youtube.com/..."
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                      value={newSessionData.youtubeUrl}
                      onChange={(e) => setNewSessionData({...newSessionData, youtubeUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleCreateSession}
                    disabled={!newSessionData.name}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2 active:scale-95"
                  >
                    <Bot size={20} />
                    Iniciar Agente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}