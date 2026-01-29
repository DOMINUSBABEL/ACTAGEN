/**
 * USE AGENTIC PIPELINE HOOK
 * Hook de React para manejar el estado del pipeline agéntico
 */

import { useState, useCallback, useRef } from 'react';
import { 
  AgentState, 
  PipelineStep, 
  ThoughtLine, 
  createInitialAgentState,
  KERNEL_19_STEPS
} from '../types';
import { AgenticPipeline, PipelineInput } from '../services/agenticPipeline';

export interface UseAgenticPipelineReturn {
  state: AgentState;
  isRunning: boolean;
  startPipeline: (input: PipelineInput) => Promise<string>;
  resetPipeline: (sessionName: string) => void;
  exportLog: () => string;
}

export function useAgenticPipeline(initialSessionName: string = 'Nueva Sesión'): UseAgenticPipelineReturn {
  const [state, setState] = useState<AgentState>(() => createInitialAgentState(initialSessionName));
  const pipelineRef = useRef<AgenticPipeline | null>(null);

  const handleThought = useCallback((thought: ThoughtLine) => {
    setState(prev => ({
      ...prev,
      globalThoughts: [...prev.globalThoughts, thought]
    }));
  }, []);

  const handleStepUpdate = useCallback((stepId: number, update: Partial<PipelineStep>) => {
    setState(prev => ({
      ...prev,
      currentStep: update.status === 'running' ? stepId : prev.currentStep,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, ...update }
          : step
      )
    }));
  }, []);

  const startPipeline = useCallback(async (input: PipelineInput): Promise<string> => {
    // Reset state
    setState(prev => ({
      ...createInitialAgentState(input.sessionName),
      isRunning: true
    }));

    // Create pipeline
    pipelineRef.current = new AgenticPipeline(input, handleThought, handleStepUpdate);

    try {
      const result = await pipelineRef.current.execute();
      
      setState(prev => ({
        ...prev,
        isRunning: false
      }));

      return result.finalDocument;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isRunning: false
      }));
      throw error;
    }
  }, [handleThought, handleStepUpdate]);

  const resetPipeline = useCallback((sessionName: string) => {
    setState(createInitialAgentState(sessionName));
    pipelineRef.current = null;
  }, []);

  const exportLog = useCallback((): string => {
    const lines: string[] = [
      '# ACTAGEN - LOG DE EJECUCIÓN',
      `## Sesión: ${state.sessionName}`,
      `## Fecha: ${new Date().toISOString()}`,
      '',
      '---',
      '',
      '## RESUMEN DE PASOS',
      ''
    ];

    for (const step of state.steps) {
      const statusEmoji = 
        step.status === 'success' ? '✅' :
        step.status === 'error' ? '❌' :
        step.status === 'warning' ? '⚠️' :
        step.status === 'running' ? '🔄' : '⏳';
      
      lines.push(`### ${statusEmoji} Paso ${step.id}: ${step.name}`);
      lines.push(`- **Estado:** ${step.status}`);
      lines.push(`- **Fase:** ${step.phase}`);
      if (step.result) lines.push(`- **Resultado:** ${step.result}`);
      if (step.startTime && step.endTime) {
        const duration = step.endTime.getTime() - step.startTime.getTime();
        lines.push(`- **Duración:** ${duration}ms`);
      }
      
      if (step.thoughts.length > 0) {
        lines.push('- **Pensamientos:**');
        for (const thought of step.thoughts) {
          lines.push(`  - [${thought.type}] ${thought.content}`);
        }
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## STREAM DE RAZONAMIENTO GLOBAL');
    lines.push('');

    for (const thought of state.globalThoughts) {
      const time = thought.timestamp.toLocaleTimeString('es-CO');
      lines.push(`- **[${time}]** [${thought.type.toUpperCase()}] ${thought.content}`);
    }

    return lines.join('\n');
  }, [state]);

  return {
    state,
    isRunning: state.isRunning,
    startPipeline,
    resetPipeline,
    exportLog
  };
}
