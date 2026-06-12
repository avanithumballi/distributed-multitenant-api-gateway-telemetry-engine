import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, KeyRound, Radio, ShieldAlert, UserPlus, Sparkles, CheckCircle2, Sliders, Globe, Cpu } from 'lucide-react';
import { io } from 'socket.io-client';

import TenantProfile from './components/TenantProfile';
import SandboxConsole from './components/SandboxConsole';
import MetricsChart from './components/MetricsChart';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

export default function App() {
  // Customized with Avani's default placeholder string
  const [apiKey, setApiKey] = useState('sk_pro_712a41f797642f5c56f049cb6eebe92bc'); 
  const [tenantData, setTenantData] = useState(null);
  const [responseLog, setResponseLog] = useState('');
  
  const [liveNodesCount, setLiveNodesCount] = useState(1);
  const [engineConfig, setEngineConfig] = useState({ freeLimit: 3, proLimit: 10 });
  const [inputFreeLimit, setInputFreeLimit] = useState(3);
  const [inputProLimit, setInputProLimit] = useState(10);

  const [syncLoading, setSyncLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('free');

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('activeConnections', (count) => setLiveNodesCount(count));
    socketRef.current.on('gatewayConfigUpdate', (config) => {
      setEngineConfig(config);
      setInputFreeLimit(config.freeLimit);
      setInputProLimit(config.proLimit);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!tenantData?.profile?._id || !socketRef.current) return;

    const tenantId = tenantData.profile._id;
    const channelName = `analyticsUpdate:${tenantId}`;

    socketRef.current.off(channelName);
    socketRef.current.on(channelName, (freshMetrics) => {
      setTenantData((prev) => ({ ...prev, metrics: freshMetrics }));
      showNotificationToast('⚡ WebSocket Frame: Analytics charts updated live!');
    });

    return () => {
      socketRef.current.off(channelName);
    };
  }, [tenantData?.profile?._id]);

  const showNotificationToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const synchronizeMetricsDashboard = async (overrideKey) => {
    const activeKey = overrideKey || apiKey;
    if (!activeKey.trim()) return;
    setSyncLoading(true);
    setGlobalError('');
    try {
      const res = await axios.get(`${BACKEND_URL}/tenants/analytics`, {
        headers: { 'x-api-key': activeKey.trim() }
      });
      setTenantData(res.data.data);
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Gateway cluster handshake error.');
      setTenantData(null);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleHitEndpoint = async () => {
    setRequestLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/resource`, {
        headers: { 'x-api-key': apiKey.trim() }
      });
      setResponseLog(`📡 STATUS: 200 OK \n📦 MSG: ${res.data.message}`);
    } catch (err) {
      setResponseLog(`🚨 STATUS: ${err.response?.status || 'Reject'} \n❌ ERR: ${err.response?.data?.message || 'Blocked.'}`);
    } finally {
      setRequestLoading(false);
    }
  };

  const handlePlanUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await axios.patch(`${BACKEND_URL}/tenants/upgrade`, { apiKey: apiKey.trim() });
      await synchronizeMetricsDashboard();
      showNotificationToast('🔮 Cache Evicted! Tenant upgraded in Redis memory pipelines.');
    } catch (err) {
      alert('Subscription tier upgrade synchronization failed.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleRegisterTenant = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    setRegisterLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/tenants/register`, {
        name: newName,
        email: newEmail,
        plan: newPlan
      });
      const freshlyMintedKey = res.data.data.apiKey;
      setApiKey(freshlyMintedKey);
      setShowRegisterModal(false);
      setNewName('');
      setNewEmail('');
      await synchronizeMetricsDashboard(freshlyMintedKey);
      showNotificationToast('🎉 Gateway Profile Mapped and Tokens Dispatched!');
    } catch (err) {
      alert(err.response?.data?.message || 'Developer onboarding failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // 🎛️ HOT-SWAP RUNTIME CONFIGURATION UPDATE HANDLING (CORRECTED)
  const handleUpdateGatewayConfig = async (e) => {
    e.preventDefault();
    setConfigLoading(true); // Start spinner
    try {
      await axios.post(`${BACKEND_URL}/tenants/config`, {
        freeLimit: inputFreeLimit,
        proLimit: inputProLimit
      });
      showNotificationToast('⚙️ System Matrix Flushed! Threshold window changed globally.');
    } catch (err) {
      alert('Failed to transmit cluster parameter parameters.');
    } finally {
      setConfigLoading(false); // ✅ Correct setter function! Shuts the spinner down smoothly.
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#040711] relative overflow-x-hidden p-4 sm:p-8 md:p-12 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      <div className="absolute top-[-10%] left-[20%] w-[60vw] h-[40vw] bg-gradient-to-br from-indigo-600/10 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/90 border border-cyan-500/30 text-cyan-400 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-xl">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 animate-bounce" />
            <span className="text-sm font-semibold tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-4 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-medium backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Real-Time Telemetry Mode Active
            </span>
            <span className="w-px h-3 bg-slate-800" />
            <span className="text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Live Visual Tabs Connected: <strong className="text-slate-200">{liveNodesCount}</strong>
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 pb-1">Distributed API Gateway Dashboard</h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto font-medium">Enterprise multi-tenant traffic monitoring network engineered with in-memory Redis token buckets and real-time WebSocket feedback loops.</p>
        </motion.header>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-2xl max-w-3xl mx-auto backdrop-blur-xl flex flex-col md:flex-row gap-3 items-center">
          <div className="w-full relative flex items-center">
            <KeyRound className="absolute left-4 text-slate-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Synchronize dashboard using developer token (sk_...)"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-sm font-mono text-cyan-300 outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
          <div className="w-full md:w-auto flex gap-2 justify-end">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={syncLoading} onClick={() => synchronizeMetricsDashboard()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-md shadow-black/40">
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${syncLoading ? 'animate-spin' : ''}`} /> Sync Cluster
            </motion.button>
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }} whileTap={{ scale: 0.98 }} onClick={() => setShowRegisterModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-lg shadow-purple-950/20">
              <UserPlus className="w-4 h-4" /> Mint New Pass
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {globalError && (
            <div className="max-w-3xl mx-auto">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-rose-400 text-xs font-semibold flex items-center gap-2 pl-4 bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {globalError}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {tenantData ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TenantProfile profile={tenantData.profile} onUpgrade={handlePlanUpgrade} upgradeLoading={upgradeLoading} />
                <SandboxConsole onHitEndpoint={handleHitEndpoint} responseLog={responseLog} requestLoading={requestLoading} />
                <MetricsChart metrics={tenantData.metrics} apiKey={apiKey} />
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl max-w-4xl mx-auto backdrop-blur-xl">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-200 mb-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Active Infrastructure Configuration Overrides
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">Modify the sliding window rate limits on the fly. Adjusting these values instantly remaps memory parameters on the Node backend cluster without requiring service reboots.</p>
                
                <form onSubmit={handleUpdateGatewayConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Free Policy Cap (Req/Min)</label>
                    <input type="number" min="1" max="100" value={inputFreeLimit} onChange={(e) => setInputFreeLimit(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 text-slate-200 font-mono text-sm rounded-xl outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">Pro Policy Cap (Req/Min)</label>
                    <input type="number" min="1" max="500" value={inputProLimit} onChange={(e) => setInputProLimit(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500/60 text-slate-200 font-mono text-sm rounded-xl outline-none transition-all" />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={configLoading} type="submit" className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5">
                    {configLoading ? <Cpu className="w-4 h-4 animate-spin" /> : <><Sliders className="w-3.5 h-3.5" /> Deploy Strategy</>}
                  </motion.button>
                </form>
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Current Live System State limits:</span>
                  <span className="text-indigo-400 font-semibold">Free Tier: {engineConfig.freeLimit} req/m | Pro Tier: {engineConfig.proLimit} req/m</span>
                </div>
              </motion.div>

            </motion.div>
          ) : (
            !syncLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="text-center py-24 text-sm text-slate-500 tracking-widest font-mono italic">// Awaiting profile cluster validation key syncing entry...</motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegisterModal(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 15 }} className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xl font-black text-white">
                <Sparkles className="text-purple-400 w-5 h-5" /> Generate Edge Key
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Mint an authenticated API token coupled to our high-performance distributed key-caching layers.</p>
              
              <form onSubmit={handleRegisterTenant} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Account Holder Name</label>
                  {/* Changed to Avani placeholder example standard */}
                  <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Avani" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm outline-none font-medium transition-all text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Target Domain Email</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="avani@edge.io" className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm outline-none font-medium transition-all text-slate-100" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-wider">Default Subscription Model</label>
                  <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm outline-none font-semibold text-slate-300 transition-all">
                    <option value="free">FREE POLICIES TIER ({engineConfig.freeLimit} Requests/Min)</option>
                    <option value="pro">PRO POLICIES TIER ({engineConfig.proLimit} Requests/Min)</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowRegisterModal(false)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/40 font-bold text-xs text-slate-400 rounded-xl transition-all">Cancel</button>
                  <button type="submit" disabled={registerLoading} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg">
                    {registerLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-3.5 h-3.5 fill-current" /> Mint Credentials</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}