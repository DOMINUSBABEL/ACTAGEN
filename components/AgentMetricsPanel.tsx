/**
 * AGENT METRICS PANEL
 * Panel de métricas en tiempo real del agente
 * 
 * Muestra: uso de tokens, tiempo de procesamiento, rendimiento, prompts, etc.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Clock,
  Zap,
  Database,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Hash,
  Timer,
  Gauge,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

// ===== TIPOS =====

export interface AgentMetrics {
  // Uso de tokens
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  tokensCost: number;         // USD estimado
  
  // Tiempos
  startTime: Date | null;
  currentTime: Date;
  elapsedMs: number;
  avgStepDurationMs: number;
  estimatedRemainingMs: number;
  
  // Rendimiento
  stepsCompleted: number;
  stepsTotal: number;
  stepsPerMinute: number;
  successRate: number;        // 0-100
  
  // Prompts y llamadas
  promptsSent: number;
  responsesReceived: number;
  errorsCount: number;
  retriesCount: number;
  
  // Modelo
  modelName: string;
  modelVersion: string;
  temperature: number;
  
  // Memoria/contexto
  contextWindowUsed: number;  // tokens
  contextWindowMax: number;   // tokens
  
  // Estado
  isRunning: boolean;
  currentPhase: 1 | 2 | 3 | null;
  currentStepName: string;
}

export interface MetricsHistoryPoint {
  timestamp: Date;
  tokensTotal: number;
  stepsCompleted: number;
  elapsedMs: number;
}

// ===== HELPERS =====

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
};

const formatCurrency = (usd: number): string => {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  return `$${usd.toFixed(4)}`;
};

// ===== COMPONENTE DE MÉTRICA INDIVIDUAL =====

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  subValue,
  trend,
  color = 'slate'
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-white">{value}</span>
        {subValue && <span className="text-xs opacity-50">{subValue}</span>}
        {trend && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-rose-400' :
            'text-slate-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
};

// ===== BARRA DE PROGRESO =====

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showPercent?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  color = 'bg-blue-500',
  showPercent = true
}) => {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{label}</span>
          {showPercent && <span>{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====

interface AgentMetricsPanelProps {
  metrics: AgentMetrics;
  history?: MetricsHistoryPoint[];
  onRefresh?: () => void;
}

export const AgentMetricsPanel: React.FC<AgentMetricsPanelProps> = ({
  metrics,
  history = [],
  onRefresh
}) => {
  const [, setTick] = useState(0);
  
  // Actualizar cada segundo si está corriendo
  useEffect(() => {
    if (!metrics.isRunning) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [metrics.isRunning]);

  const phaseLabels = {
    1: { name: 'INGENIERÍA', color: 'text-blue-400' },
    2: { name: 'AUDITORÍA', color: 'text-purple-400' },
    3: { name: 'CIERRE', color: 'text-emerald-400' },
  };

  return (
    <div className="bg-[#0D1117] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="bg-[#161B22] px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                AGENT METRICS
                {metrics.isRunning && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-normal">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                {metrics.modelName} • {metrics.modelVersion}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {metrics.currentPhase && (
              <span className={`text-xs font-bold ${phaseLabels[metrics.currentPhase].color}`}>
                FASE {metrics.currentPhase}: {phaseLabels[metrics.currentPhase].name}
              </span>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw size={14} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="p-4 space-y-4">
        {/* Row 1: Principales */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            icon={<Timer size={14} />}
            label="Tiempo Transcurrido"
            value={formatDuration(
              metrics.isRunning && metrics.startTime
                ? Date.now() - metrics.startTime.getTime()
                : metrics.elapsedMs
            )}
            color="blue"
          />
          <MetricCard
            icon={<Layers size={14} />}
            label="Progreso"
            value={`${metrics.stepsCompleted}/${metrics.stepsTotal}`}
            subValue={`${Math.round((metrics.stepsCompleted / metrics.stepsTotal) * 100)}%`}
            color="purple"
          />
          <MetricCard
            icon={<Hash size={14} />}
            label="Tokens Totales"
            value={formatNumber(metrics.tokensTotal)}
            subValue={formatCurrency(metrics.tokensCost)}
            color="emerald"
          />
          <MetricCard
            icon={<Gauge size={14} />}
            label="Pasos/Min"
            value={metrics.stepsPerMinute.toFixed(1)}
            trend={metrics.stepsPerMinute > 1 ? 'up' : 'stable'}
            color="amber"
          />
        </div>
        
        {/* Row 2: Tokens detallado */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            icon={<MessageSquare size={14} />}
            label="Tokens Input"
            value={formatNumber(metrics.tokensInput)}
            color="slate"
          />
          <MetricCard
            icon={<MessageSquare size={14} />}
            label="Tokens Output"
            value={formatNumber(metrics.tokensOutput)}
            color="slate"
          />
          <MetricCard
            icon={<Database size={14} />}
            label="Contexto Usado"
            value={`${Math.round((metrics.contextWindowUsed / metrics.contextWindowMax) * 100)}%`}
            subValue={`${formatNumber(metrics.contextWindowUsed)}/${formatNumber(metrics.contextWindowMax)}`}
            color={metrics.contextWindowUsed / metrics.contextWindowMax > 0.8 ? 'rose' : 'slate'}
          />
        </div>
        
        {/* Row 3: Prompts y errores */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            icon={<Zap size={14} />}
            label="Prompts Enviados"
            value={metrics.promptsSent}
            color="blue"
          />
          <MetricCard
            icon={<CheckCircle2 size={14} />}
            label="Respuestas OK"
            value={metrics.responsesReceived}
            color="emerald"
          />
          <MetricCard
            icon={<XCircle size={14} />}
            label="Errores"
            value={metrics.errorsCount}
            color={metrics.errorsCount > 0 ? 'rose' : 'slate'}
          />
          <MetricCard
            icon={<RefreshCw size={14} />}
            label="Reintentos"
            value={metrics.retriesCount}
            color={metrics.retriesCount > 2 ? 'amber' : 'slate'}
          />
        </div>
        
        {/* Progress bars */}
        <div className="space-y-3 pt-2">
          <ProgressBar
            value={metrics.stepsCompleted}
            max={metrics.stepsTotal}
            label="Progreso de Pipeline"
            color="bg-gradient-to-r from-blue-500 to-purple-500"
          />
          <ProgressBar
            value={metrics.contextWindowUsed}
            max={metrics.contextWindowMax}
            label="Ventana de Contexto"
            color={
              metrics.contextWindowUsed / metrics.contextWindowMax > 0.9
                ? 'bg-rose-500'
                : metrics.contextWindowUsed / metrics.contextWindowMax > 0.7
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }
          />
          <ProgressBar
            value={metrics.successRate}
            max={100}
            label="Tasa de Éxito"
            color="bg-emerald-500"
          />
        </div>
        
        {/* Current step indicator */}
        {metrics.currentStepName && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu size={14} className="text-blue-400 animate-pulse" />
              <span className="uppercase tracking-wide">Procesando:</span>
              <span className="text-slate-200 font-medium">{metrics.currentStepName}</span>
            </div>
            {metrics.estimatedRemainingMs > 0 && (
              <div className="mt-1 text-xs text-slate-500">
                Tiempo restante estimado: {formatDuration(metrics.estimatedRemainingMs)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== FACTORY PARA MÉTRICAS INICIALES =====

export function createInitialMetrics(): AgentMetrics {
  return {
    tokensInput: 0,
    tokensOutput: 0,
    tokensTotal: 0,
    tokensCost: 0,
    startTime: null,
    currentTime: new Date(),
    elapsedMs: 0,
    avgStepDurationMs: 0,
    estimatedRemainingMs: 0,
    stepsCompleted: 0,
    stepsTotal: 19,
    stepsPerMinute: 0,
    successRate: 100,
    promptsSent: 0,
    responsesReceived: 0,
    errorsCount: 0,
    retriesCount: 0,
    modelName: 'Gemini',
    modelVersion: '3-flash',
    temperature: 0.7,
    contextWindowUsed: 0,
    contextWindowMax: 1_000_000,
    isRunning: false,
    currentPhase: null,
    currentStepName: '',
  };
}

export default AgentMetricsPanel;
