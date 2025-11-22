import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BrainCircuit } from 'lucide-react';
import { FinancialRecord } from '../types';
import { analyzeFinancialTrends } from '../services/geminiService';

const DATA: FinancialRecord[] = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Fev', revenue: 52000, expenses: 34000, profit: 18000 },
  { month: 'Mar', revenue: 48000, expenses: 31000, profit: 17000 },
  { month: 'Abr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'Mai', revenue: 55000, expenses: 35000, profit: 20000 },
  { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000 },
];

export const FinancialControl: React.FC = () => {
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeFinancialTrends(DATA);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-navy-900 p-6 rounded-2xl border border-navy-700 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Receita Total (Semestre)</h3>
          <div className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <DollarSign size={24} /> 328.000
          </div>
          <div className="text-xs text-emerald-500/80 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +12% vs semestre anterior
          </div>
        </div>

        <div className="bg-navy-900 p-6 rounded-2xl border border-navy-700 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Despesas Totais</h3>
          <div className="text-3xl font-bold text-red-400 flex items-center gap-2">
            <DollarSign size={24} /> 210.000
          </div>
          <div className="text-xs text-red-500/80 mt-2 flex items-center gap-1">
            <TrendingDown size={12} /> +5% vs semestre anterior
          </div>
        </div>

        <div className="bg-navy-900 p-6 rounded-2xl border border-navy-700 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-solar-blue/10 rounded-bl-full"></div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">Lucro Líquido</h3>
          <div className="text-3xl font-bold text-blue-400 flex items-center gap-2">
            <DollarSign size={24} /> 118.000
          </div>
          <div className="text-xs text-blue-500/80 mt-2">Margem média: 36%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-navy-900 p-6 rounded-2xl border border-navy-700 shadow-lg">
          <h3 className="text-white font-bold mb-6">Receita vs Despesas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-navy-900 p-6 rounded-2xl border border-navy-700 shadow-lg">
          <h3 className="text-white font-bold mb-6">Evolução do Lucro</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Lucro" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 rounded-2xl border border-indigo-500/30 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BrainCircuit className="text-purple-500" /> Análise Inteligente (Gemini)
          </h3>
          {!analysis && (
            <button 
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analisando...' : 'Analisar Tendências'}
            </button>
          )}
        </div>
        
        <div className="bg-navy-950/50 rounded-xl p-4 min-h-[100px]">
          {analysis ? (
             <div className="prose prose-invert prose-sm max-w-none">
               <pre className="whitespace-pre-wrap font-sans text-slate-300">{analysis}</pre>
             </div>
          ) : (
            <p className="text-slate-500 text-sm">Clique no botão acima para solicitar à IA uma análise dos resultados financeiros do semestre.</p>
          )}
        </div>
      </div>
    </div>
  );
};
