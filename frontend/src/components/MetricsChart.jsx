import React from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { BarChart3, Activity, Download } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function MetricsChart({ metrics, apiKey }) {
  const total = metrics ? metrics.allowed + metrics.blocked : 0;

  const chartData = {
    labels: ['Success (200)', 'Blocked (429)'],
    datasets: [
      {
        data: [metrics?.allowed || 0, metrics?.blocked || 0],
        backgroundColor: ['rgba(34, 211, 238, 0.85)', 'rgba(244, 63, 94, 0.85)'],
        borderColor: ['#22d3ee', '#f43f5e'],
        borderWidth: 1.5,
      },
    ],
  };

  const triggerPdfDownloadDownload = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/v1/tenants/analytics/download', {
        headers: { 'x-api-key': apiKey },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Avani_Gateway_SLA_Telemetry.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to assemble server-side streaming PDF file binary datasets.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl shadow-2xl flex flex-col justify-between backdrop-blur-xl"
    >
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
          <BarChart3 className="text-emerald-400 w-5 h-5" /> Analytics Distribution
        </h2>
        <hr className="border-slate-800/60 mb-5" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center min-h-[180px]">
        {total === 0 ? (
          <div className="text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <p className="text-sm text-slate-500 italic">No traffic logs tracked inside collections.</p>
          </div>
        ) : (
          <div className="w-full h-44 relative">
            <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Interceptions</span>
          <span className="text-sm font-black text-slate-200 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">{total}</span>
        </div>

        {total > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={triggerPdfDownloadDownload}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700/60"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Data Statement (.PDF)
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}