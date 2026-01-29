/**
 * AGENT REASONING TERMINAL
 * Visualizador de razonamiento paso a paso del agente
 * 
 * Muestra el Chain of Thought, progreso de pasos, y logs en tiempo real
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Terminal, 
  Brain, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  FileText,
  Search,
  Edit3,
  Shield,
  Download
} from 'lucide-react';

// Importar tipos desde el archivo central
import { 
  StepStatus, 
  ThoughtLine, 
  PipelineStep, 
  AgentState, 
  KERNEL_19_STEPS 
} from '../types';

// Re-exportar para compatibilidad
export type { StepStatus, ThoughtLine, PipelineStep, AgentState };
export { KERNEL_19_STEPS };

// ===== COMPONENTES AUXILIARES =====

const StatusIcon: React.FC<{ status: StepStatus; size?: number }> = ({ status, size = 16 }) => {
  switch (status) {
    case 'running':
      return <Loader2 size={size} className="text-blue-400 animate-spin" />;
    case 'success':
      return <CheckCircle2 size={size} className="text-emerald-400" />;
    case 'warning':
      return <AlertTriangle size={size} className="text-amber-400" />;
    case 'error':
      return <XCircle size={size} className="text-rose-400" />;
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
  }
};

const ThoughtIcon: React.FC<{ type: ThoughtLine['type'] }> = ({ type }) => {
  const iconClass = "w-3.5 h-3.5";
  switch (type) {
    case 'thought':
      return <Brain className={`${iconClass} text-purple-400`} />;
    case 'action':
      return <Zap className={`${iconClass} text-blue-400`} />;
    case 'observation':
      return <Search className={`${iconClass} text-cyan-400`} />;
    case 'decision':
      return <Sparkles className={`${iconClass} text-amber-400`} />;
    case 'error':
      return <XCircle className={`${iconClass} text-rose-400`} />;
    default:
      return <FileText className={`${iconClass} text-slate-400`} />;
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

// ===== COMPONENTE DE PASO INDIVIDUAL =====

interface StepCardProps {
  step: PipelineStep;
  isExpanded: boolean;
  onToggle: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, isExpanded, onToggle }) => {
  const phaseColors = {
    1: 'border-blue-500/30 bg-blue-500/5',
    2: 'border-purple-500/30 bg-purple-500/5',
    3: 'border-emerald-500/30 bg-emerald-500/5',
  };
  
  const phaseLabels = {
    1: 'INGENIERÍA',
    2: 'AUDITORÍA',
    3: 'CIERRE',
  };
  
  const duration = step.startTime && step.endTime 
    ? step.endTime.getTime() - step.startTime.getTime() 
    : null;

  return (
    <div className={`rounded-lg border ${phaseColors[step.phase]} overflow-hidden transition-all`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        <StatusIcon status={step.status} />
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              PASO {step.id}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
              {phaseLabels[step.phase]}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-200 mt-0.5">
            {step.name}
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(duration)}
            </span>
          )}
          {step.thoughts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-700 rounded">
              {step.thoughts.length} thoughts
            </span>
          )}
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/5 p-3 space-y-2 bg-black/20">
          <p className="text-xs text-slate-400 mb-3">{step.description}</p>
          
          {step.thoughts.length === 0 ? (
            <div className="text-xs text-slate-600 italic">Sin pensamientos registrados</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {step.thoughts.map((thought) => (
                <div key={thought.id} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-600 font-mono whitespace-nowrap">
                    {formatTime(thought.timestamp)}
                  </span>
                  <ThoughtIcon type={thought.type} />
                  <span className={`flex-1 ${
                    thought.type === 'error' ? 'text-rose-300' :
                    thought.type === 'decision' ? 'text-amber-300' :
                    thought.type === 'action' ? 'text-blue-300' :
                    'text-slate-300'
                  }`}>
                    {thought.content}
                  </span>
                  {thought.metadata?.tokens && (
                    <span className="text-slate-600">{thought.metadata.tokens} tok</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {step.result && (
            <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-300">
              <strong>Resultado:</strong> {step.result}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====

interface AgentReasoningTerminalProps {
  state: AgentState;
  onExportLog?: () => void;
}

export const AgentReasoningTerminal: React.FC<AgentReasoningTerminalProps> = ({ 
  state, 
  onExportLog 
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showGlobalThoughts, setShowGlobalThoughts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-expand current running step
    if (state.currentStep > 0) {
      setExpandedSteps(prev => new Set([...prev, state.currentStep]));
    }
  }, [state.currentStep]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.globalThoughts]);

  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const completedSteps = state.steps.filter(s => s.status === 'success').length;
  const progressPercent = state.totalSteps > 0 
    ? Math.round((completedSteps / state.totalSteps) * 100) 
    : 0;

  const stepsByPhase = {
    1: state.steps.filter(s => s.phase === 1),
    2: state.steps.filter(s => s.phase === 2),
    3: state.steps.filter(s => s.phase === 3),
  };

  return (
    <div className="bg-[#0D1117] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-sm">
      {/* Header */}
      <div className="bg-[#161B22] px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">AGENT REASONING TERMINAL</h3>
              <p className="text-xs text-slate-500">Kernel 19 Pasos • {state.sessionName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {state.isRunning && (
              <span className="flex items-center gap-2 text-xs text-blue-400">
                <Loader2 size={14} className="animate-spin" />
                Procesando...
              </span>
            )}
            {onExportLog && (
              <button 
                onClick={onExportLog}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
              >
                <Download size={12} />
                Exportar Log
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 font-bold min-w-[60px] text-right">
            {completedSteps}/{state.totalSteps} pasos
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex h-[500px]">
        {/* Steps Panel */}
        <div className="w-1/2 border-r border-slate-800 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Phase 1 */}
          <div>
            <h4 className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              FASE 1: INGENIERÍA DE ENTRADA
            </h4>
            <div className="space-y-2">
              {stepsByPhase[1].map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Phase 2 */}
          <div>
            <h4 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              FASE 2: AUDITORÍA Y CONTENIDO
            </h4>
            <div className="space-y-2">
              {stepsByPhase[2].map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Phase 3 */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              FASE 3: CIERRE Y EXPORTACIÓN
            </h4>
            <div className="space-y-2">
              {stepsByPhase[3].map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Live Thoughts Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setShowGlobalThoughts(!showGlobalThoughts)}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Terminal size={14} />
              LIVE REASONING STREAM
              {showGlobalThoughts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <span className="text-[10px] text-slate-600">
              {state.globalThoughts.length} entries
            </span>
          </div>
          
          {showGlobalThoughts && (
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-black/30">
              {state.globalThoughts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                  <Brain size={32} className="opacity-30" />
                  <p className="text-xs">Esperando inicio del proceso...</p>
                </div>
              ) : (
                state.globalThoughts.map((thought) => (
                  <div 
                    key={thought.id} 
                    className="flex items-start gap-2 text-xs py-1 border-l-2 pl-2 hover:bg-white/5 transition-colors"
                    style={{
                      borderColor: 
                        thought.type === 'thought' ? '#a855f7' :
                        thought.type === 'action' ? '#3b82f6' :
                        thought.type === 'observation' ? '#06b6d4' :
                        thought.type === 'decision' ? '#f59e0b' :
                        thought.type === 'error' ? '#f43f5e' :
                        '#64748b'
                    }}
                  >
                    <span className="text-slate-600 font-mono whitespace-nowrap">
                      {formatTime(thought.timestamp)}
                    </span>
                    <ThoughtIcon type={thought.type} />
                    <span className={`flex-1 leading-relaxed ${
                      thought.type === 'error' ? 'text-rose-300' :
                      thought.type === 'decision' ? 'text-amber-300 font-medium' :
                      thought.type === 'action' ? 'text-blue-300' :
                      thought.type === 'observation' ? 'text-cyan-300' :
                      'text-slate-300'
                    }`}>
                      {thought.content}
                    </span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentReasoningTerminal;
