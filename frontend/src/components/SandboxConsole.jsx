import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Play, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

export default function SandboxConsole({ onHitEndpoint, responseLog, requestLoading }) {
  const is200 = responseLog && responseLog.includes('200');
  const is429 = responseLog && responseLog.includes('429');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-2xl flex flex-col justify-between backdrop-blur-xl relative group"
    >
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Terminal className="text-cyan-400 w-4 h-4" /> Gateway Playground
        </h2>
        <hr className="border-slate-800/60 mb-5" />
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">Simulate automated pipeline requests against your live network proxy rules:</p>
        
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: '0 0 25px rgba(34, 211, 238, 0.15)' }}
          whileTap={{ scale: 0.99 }}
          disabled={requestLoading}
          onClick={onHitEndpoint}
          className="w-full py-3 px-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 hover:via-indigo-900/80 text-cyan-400 font-bold rounded-xl border border-cyan-500/30 text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-3 transition-all group-hover:border-cyan-400/50"
        >
          {requestLoading ? <Cpu className="w-4 h-4 animate-spin text-cyan-400" /> : <Play className="w-3.5 h-3.5 fill-current text-cyan-400 animate-pulse" />}
          Execute Request Trigger
        </motion.button>
      </div>

      <div className="mt-6 flex-1 flex flex-col justify-end">
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-wider">Gateway Response Terminal</p>
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 min-h-[110px] font-mono text-xs flex flex-col justify-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
          <AnimatePresence mode="wait">
            {responseLog ? (
              <motion.div key={responseLog} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex items-start gap-2 z-10">
                {is200 && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />}
                {is429 && <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
                <span className={`leading-relaxed break-all font-semibold ${is200 ? 'text-cyan-400' : is429 ? 'text-rose-400' : 'text-slate-300'}`}>{responseLog}</span>
              </motion.div>
            ) : (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="text-slate-500 italic text-center z-10 font-mono">// Terminal ready. Awaiting cluster instruction...</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}