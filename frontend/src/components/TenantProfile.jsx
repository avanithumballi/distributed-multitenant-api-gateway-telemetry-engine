import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, ShieldCheck, Key, Zap } from 'lucide-react';

export default function TenantProfile({ profile, onUpgrade, upgradeLoading }) {
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-xl h-full min-h-[440px] flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
          <ShieldCheck className="text-purple-400 w-4 h-4" /> Developer Profile
        </h2>
        <hr className="border-slate-800/60 mb-5" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <User className="text-slate-400 w-4 h-4 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Holder</p>
              <p className="text-xs font-semibold text-slate-300">{profile.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <Mail className="text-slate-400 w-4 h-4 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Developer Email</p>
              <p className="text-xs font-semibold text-slate-300">{profile.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
            <div className="flex items-center gap-3">
              <Zap className="text-slate-400 w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Strategy Tier</p>
                <p className="text-xs font-semibold text-slate-300">Rate Limits Plan</p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={profile.plan}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold tracking-wider uppercase ${
                  profile.plan === 'pro' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
                }`}
              >
                {profile.plan}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-3 shadow-inner">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 tracking-wider flex items-center gap-1">
            <Key className="w-3 h-3 text-purple-400" /> Authorized Secret Token
          </p>
          <code className="text-xs text-indigo-300 select-all block break-all font-mono tracking-tight">{profile.apiKey}</code>
        </div>

        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
          whileTap={{ scale: 0.99 }}
          disabled={upgradeLoading}
          onClick={onUpgrade}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase bg-slate-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {upgradeLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-purple-400 fill-current" /> 
              Hot-Swap Tier Cache
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}