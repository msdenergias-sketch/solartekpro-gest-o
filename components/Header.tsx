import React from 'react';
import { Sun, Zap, Briefcase, List, PieChart } from 'lucide-react';
import { Tab } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-full flex flex-col gap-6 mb-8">
      {/* Top Brand Bar */}
      <div className="w-full bg-navy-900/80 backdrop-blur-md border border-navy-700/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between shadow-lg shadow-black/40 relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-solar-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* Logo Area */}
        <div className="flex items-center gap-4 z-10">
          <div className="relative w-14 h-14 flex items-center justify-center bg-gradient-to-b from-navy-800 to-black rounded-full border-2 border-solar-green/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sun className="w-8 h-8 text-solar-yellow absolute top-2 right-2 opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-solar-green/20 rounded-b-full blur-sm"></div>
            <Zap className="w-6 h-6 text-white z-10 relative" fill="white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-1">
              SolarTek<span className="text-solar-green">Pro</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-[2px] w-6 bg-navy-700"></div>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                Energias Renováveis
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Title */}
        <div className="mt-4 md:mt-0 flex items-center border-l-0 md:border-l border-navy-700 pl-0 md:pl-6 z-10">
          <div className="text-right">
            <span className="block text-xs text-slate-400 uppercase tracking-wider">Sistema de</span>
            <span className="block text-xl font-bold text-slate-200">Gestão</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="w-full flex justify-center">
        <div className="bg-navy-900/90 border border-navy-700/50 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-lg max-w-3xl w-full sm:w-auto">
          
          <button
            onClick={() => setActiveTab(Tab.NEW_CLIENT)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === Tab.NEW_CLIENT
                ? 'bg-solar-blue text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            <Briefcase size={18} />
            <span>Novo Cliente</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.CLIENT_LIST)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === Tab.CLIENT_LIST
                ? 'bg-solar-blue text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            <List size={18} />
            <span>Lista de Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.FINANCIAL)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === Tab.FINANCIAL
                ? 'bg-solar-blue text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-navy-800'
            }`}
          >
            <PieChart size={18} />
            <span>Controle Financeiro</span>
          </button>

        </div>
      </div>
    </div>
  );
};
