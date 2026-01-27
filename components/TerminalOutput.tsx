import React, { useEffect, useRef } from 'react';
import { TerminalLine } from '../types';
import { Terminal } from 'lucide-react';

interface TerminalOutputProps {
  lines: TerminalLine[];
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ lines }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 shadow-2xl font-mono text-sm my-4">
      <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <Terminal size={14} />
          <span className="text-xs font-medium">Gemini Code Sandbox (Python 3.11)</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      <div className="p-4 h-48 overflow-y-auto text-gray-300 space-y-1 custom-scrollbar">
        {lines.map((line, idx) => (
          <div key={idx} className={`break-words ${
            line.type === 'command' ? 'text-blue-400 font-bold' :
            line.type === 'success' ? 'text-green-400' :
            line.type === 'warning' ? 'text-yellow-400' :
            line.type === 'error' ? 'text-red-400' : 'text-gray-300'
          }`}>
            <span className="opacity-50 select-none mr-2">{line.type === 'command' ? '$' : '>'}</span>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};