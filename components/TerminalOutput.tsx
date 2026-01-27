import React, { useEffect, useRef } from 'react';
import { TerminalLine } from '../types';
import { Terminal, Command } from 'lucide-react';

interface TerminalOutputProps {
  lines: TerminalLine[];
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ lines }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="bg-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 font-mono text-sm my-4">
      <div className="bg-[#27273A] px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2 text-slate-400">
          <Command size={14} />
          <span className="text-xs font-bold tracking-wide text-slate-300">ACTAGEN KERNEL v3.0</span>
        </div>
        <div className="flex gap-1.5 opacity-70">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
        </div>
      </div>
      <div className="p-5 h-56 overflow-y-auto text-slate-300 space-y-2 custom-scrollbar">
        {lines.map((line, idx) => (
          <div key={idx} className={`font-medium flex items-start gap-2 ${
            line.type === 'command' ? 'text-blue-400' :
            line.type === 'success' ? 'text-emerald-400' :
            line.type === 'warning' ? 'text-amber-400' :
            line.type === 'error' ? 'text-rose-400' : 'text-slate-300'
          }`}>
            <span className="opacity-30 select-none text-xs mt-1">➜</span>
            <span className="leading-relaxed">{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};