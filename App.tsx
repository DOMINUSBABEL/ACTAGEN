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
  FileText,
  ShieldCheck,
  Zap,
  Info
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agent' | 'protocol' | 'manual'>('dashboard');
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
    setMobileMenuOpen(false); 
    
    const session = sessions.find(s => s.id === id);
    const hasYoutube = !!session?.youtubeUrl;
    const transcriptCount = session?.transcriptFiles?.length || 0;

    if (chatHistory.length === 0 || selectedSessionId !== id) {
      setChatHistory([{
        id: 'welcome',
        role: 'model',
        content: `**AGENTE ACTAGEN v3.0 ONLINE**\n\nHe cargado los parámetros de configuración agéntica:\n- **Precisión:** Máxima\n- **Validación:** Cruzada Video/Texto\n- **Estilo:** Manual de Estilo Concejo 2026 (Activo)\n\nDetecto ${transcriptCount} fragmentos de acta. ¿Procedo con la auditoría y fusión agéntica?`,
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
    const generatedContent = `[CONTENIDO DE EJEMPLO DEL ACTA CON PARÁMETROS AGÉNTICOS...]`;
    const element = document.createElement("a");
    const file = new Blob([generatedContent], {type: 'application/msword'});
    element.href = URL.createObjectURL(file);
    element.download = `PROPUESTA_ACTA_${session?.id}_CROSSREF.docx`;
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
      { text: `Inicializando Kernel Agéntico con parámetros HIGH_PRECISION...`, type: 'info' },
    ];

    if (files.length > 0) {
        steps.push({ text: `[PASO 1] Ejecutando AUTO_FUSION en ${files.length} fragmentos...`, type: 'command' });
        files.forEach((f, i) => {
            if (i > 0) {
                 steps.push({ text: `   >> Sincronización exitosa entre Parte ${i} y ${i+1}. Redundancia eliminada.`, type: 'success' });
            }
        });
    }

    if (hasYoutube) {
        steps.push({ text: `[PASO 9] Activando VIDEO_AUDIT. Escaneando URL: ${session?.youtubeUrl}...`, type: 'command' });
        steps.push({ text: `   >> Auditoría de Votación: Detectada discrepancia de 1 voto en folio 15. Corrigiendo.`, type: 'warning' });
    }

    steps.push({ text: `[PASO 10] Validando STYLE_COMPLIANCE (Reglas 1-5)...`, type: 'command' });
    steps.push({ text: `   >> Normalización de cifras aplicada ($ 10 000 format).`, type: 'success' });
    steps.push({ text: `[PASO 19] Compilando OBSERVATION_LOG detallado para el equipo.`, type: 'info' });
    steps.push({ text: `Protocolo completado. Documento maestro agéntico listo.`, type: 'success' });

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
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Agentic Kernel v3.0</span>
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
            icon={ShieldCheck} 
            label="Protocolo (19 Pasos)" 
            active={activeTab === 'protocol'} 
            onClick={() => setActiveTab('protocol')}
            badge="Master"
          />
          <SidebarItem 
            icon={FileText} 
            label="Manual de Estilo" 
            active={activeTab === 'manual'} 
            onClick={() => setActiveTab('manual')}
            badge="Audit"
          />
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Historial</p>
          </div>
          <SidebarItem 
            icon={History} 
            label="Logs de Auditoría" 
            active={false} 
          />
          <SidebarItem 
            icon={FolderOpen} 
            label="Mis Archivos" 
            active={false} 
          />
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Modo Agéntico</h4>
              <p className="text-[10px] text-green-600 font-bold uppercase">Optimizado</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">Gemini 3 procesando con parámetros de validación cruzada activos.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full shadow-2xl">
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

      <aside className="hidden md:flex w-[280px] flex-col h-full flex-shrink-0">
        <Sidebar />
      </aside>

      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white md:bg-[#F8FAFC]">
        
        <header className="h-16 flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Centro de Control' : 
               activeTab === 'protocol' ? 'Protocolo de 19 Pasos' : 
               activeTab === 'manual' ? 'Manual de Estilo Municipal' : 'Auditoría Agéntica'}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-bold text-slate-900">142</div>
                    <div className="text-slate-500 text-sm font-medium">Actas Finalizadas</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-bold text-slate-900">320h</div>
                    <div className="text-slate-500 text-sm font-medium">Tiempo Ahorrado</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-bold text-green-600">99.4%</div>
                    <div className="text-slate-500 text-sm font-medium">Precisión de Estilo</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Sesiones en Espera</h2>
                  <button 
                    onClick={() => setShowImportModal(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                  >
                    Importar Borradores
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

          {activeTab === 'protocol' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Protocolo Master</h2>
                      <p className="text-sm text-slate-500">Configuración AGENTIC_MASTER / MULTI_MODAL_CROSSREF</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {['AUTO_FUSION: Habilitado', 'VIDEO_AUDIT: Activo', 'STYLE_COMPLIANCE: Bloqueante', 'OBSERVATION_LOG: Detallado'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
                        <CheckCircle2 size={14} className="text-green-500" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {[
                      { step: 1, title: 'Fusión y Limpieza', desc: 'Eliminación de data de digitadoras y overlaps de texto entre partes.' },
                      { step: 2, title: 'Portada y Tipo', desc: 'Validación de No. de Acta y Modalidad (Literal/Sucinta).' },
                      { step: 3, title: 'Metadatos', desc: 'Sincronización de Títulos, Índices y Fechas.' },
                      { step: 7, title: 'Auditoría de Asistencia', desc: 'Cruce de Video vs. Listado de Ausentismo.' },
                      { step: 9, title: 'Validación de Votaciones', desc: 'Sumatoria matemática de votos. Flag de error si SÍ + NO != Total.' },
                      { step: 10, title: 'Check de Estilo', desc: 'Aplicación rigurosa del Manual de Estilo Municipal.' },
                      { step: 12, title: 'Gestión Visual', desc: 'Ajuste de imágenes y centrado automático.' },
                      { step: 19, title: 'Generación de Feedback', desc: 'Listado de discrepancias encontradas para mejora continua.' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="flex-none w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                          {step.step}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#F8FAFC] custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Manual de Estilo V3_2026</h2>
                      <p className="text-sm text-slate-500">Directrices obligatorias de redacción y formateo municipal.</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash size={14} /> 1. Puntuación y Comillas
                      </h3>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <p className="text-sm font-medium text-slate-700">Regla Oro: Primer nivel con comillas Inglesas (“”), segundo nivel con comillas españolas «».</p>
                        <p className="text-sm text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-block">Prohibido: El uso de comillas simples ('')</p>
                        <p className="text-sm text-slate-500">El punto (.) siempre se sitúa posterior a cualquier signo de cierre (comillas, paréntesis, corchetes).</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash size={14} /> 2. Cifras y Moneda
                      </h3>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <span className="block text-[10px] text-slate-400 font-bold mb-1">FORMATO</span>
                            <code className="text-blue-600 font-bold">$ [espacio] [valor]</code>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <span className="block text-[10px] text-slate-400 font-bold mb-1">EJEMPLO</span>
                            <code className="text-slate-800 font-bold">$ 13 450</code>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">Nota: Si se usa la palabra "billones", se omite la palabra "pesos" para evitar redundancia legislativa.</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash size={14} /> 3. Cargos y Entidades
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xs">abc</div>
                          <p className="text-sm text-slate-700 font-medium">Minúsculas para cargos: alcalde, secretario, concejal, personero.</p>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xs">ABC</div>
                          <p className="text-sm text-slate-700 font-medium">Mayúsculas para instituciones: Secretaría de Educación, Concejo de Medellín.</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hash size={14} /> 4. Estructura de Intervención
                      </h3>
                      <div className="bg-slate-900 p-6 rounded-2xl font-mono text-xs text-slate-300">
                        <p className="text-blue-400 mb-2"># Formato Estándar</p>
                        <p>Intervino el [cargo], [Nombre Completo]:</p>
                        <p className="mt-4 text-emerald-400"># Marcas de Audio</p>
                        <p>Ininteligible -> (sic)</p>
                        <p>Pausas largas -> [...]</p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="flex flex-col h-full relative">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 space-y-8 custom-scrollbar">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[70%] ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl px-6 py-4 shadow-lg' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-2xl shadow-xl'
                    }`}>
                      {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                          <Sparkles size={14} className="text-indigo-600" />
                          <span className="font-bold text-xs uppercase text-indigo-600">Audit Kernal</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      {terminalLines.length > 0 && msg.type === 'audit' && (
                          <div className="mt-4">
                            <TerminalOutput lines={terminalLines} />
                          </div>
                      )}
                      {msg.type === 'audit' && (
                        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-3">
                            <CheckCircle2 size={16} /> Auditoría Agéntica Exitosa
                          </div>
                          <button 
                            onClick={handleDownloadDocx}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> Descargar Propuesta Consolidada
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
                       <Loader2 className="animate-spin text-blue-600" size={18} />
                       <span className="text-sm text-slate-500">Ejecutando parámetros de auditoría...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Comandos agénticos (ej: 'Fusión paso 1', 'Auditoría votación')..."
                    className="flex-1 rounded-2xl border border-slate-200 px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-sm font-medium transition-all"
                    disabled={isProcessing}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isProcessing || !inputMessage}
                    className={`px-6 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
                      isProcessing || !inputMessage 
                        ? 'bg-slate-100 text-slate-400' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showImportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900">Configurar Importación</h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nombre Sesión</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sesión Ordinaria #350"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none text-sm"
                    value={newSessionData.name}
                    onChange={(e) => setNewSessionData({...newSessionData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Borradores</label>
                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-all cursor-pointer">
                    <Files className="text-blue-500 mx-auto mb-2" size={24} />
                    <p className="text-xs font-bold text-slate-600">{newSessionData.transcriptFiles.length ? `${newSessionData.transcriptFiles.length} Archivos` : 'Subir borradores (.docx)'}</p>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Fuente Video</label>
                  <div className="relative">
                    <Youtube className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="URL YouTube"
                      className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 outline-none text-sm"
                      value={newSessionData.youtubeUrl}
                      onChange={(e) => setNewSessionData({...newSessionData, youtubeUrl: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleCreateSession}
                    disabled={!newSessionData.name}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                    <Zap size={20} />
                    Iniciar Auditoría
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
