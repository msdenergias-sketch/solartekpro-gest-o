import React, { useState } from 'react';
import { Header } from './components/Header';
import { NewClient } from './components/NewClient';
import { ClientList } from './components/ClientList';
import { FinancialControl } from './components/FinancialControl';
import { Tab, Client } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.NEW_CLIENT);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const handleTabChange = (tab: Tab) => {
    // Se o usuário clicar manualmente na aba "Novo Cliente", limpamos o estado de edição
    // para garantir um formulário em branco.
    if (tab === Tab.NEW_CLIENT) {
      setClientToEdit(null);
    }
    setActiveTab(tab);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setActiveTab(Tab.NEW_CLIENT);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.NEW_CLIENT:
        return <NewClient initialData={clientToEdit} />;
      case Tab.CLIENT_LIST:
        return <ClientList onEditClient={handleEditClient} />;
      case Tab.FINANCIAL:
        return <FinancialControl />;
      default:
        return <NewClient />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-solar-blue selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header activeTab={activeTab} setActiveTab={handleTabChange} />
        
        <main className="transition-all duration-500 ease-in-out">
          {renderContent()}
        </main>

        <footer className="mt-12 text-center text-slate-600 text-xs pb-8">
          <p>© 2024 SolarTekPro Sistemas. Todos os direitos reservados.</p>
          <p className="mt-1">Desenvolvido com React, Tailwind e Gemini API</p>
        </footer>
      </div>
    </div>
  );
}

export default App;