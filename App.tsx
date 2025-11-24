import React, { useState } from 'react';
import { Header } from './components/Header';
import { NewClient } from './components/NewClient';
import { ClientList } from './components/ClientList';
import { FinancialControl } from './components/FinancialControl';
import { Tab, Client, ClientFormData } from './types';

// Dados iniciais (Mock) movidos para o App
const INITIAL_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'Carlos Mendes', 
    email: 'carlos.m@gmail.com', 
    phone: '(11) 98765-4321', 
    avgConsumption: 450, 
    status: 'Fechado', 
    installationAddress: 'Rua das Palmeiras, 120',
    city: 'São Paulo',
    state: 'SP'
  },
  { 
    id: '2', 
    name: 'Ana Souza', 
    email: 'ana.s@hotmail.com', 
    phone: '(11) 91234-5678', 
    avgConsumption: 320, 
    status: 'Proposta Enviada', 
    installationAddress: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP'
  },
  { 
    id: '3', 
    name: 'Roberto Lima', 
    email: 'roberto.lima@uol.com.br', 
    phone: '(19) 99888-7777', 
    avgConsumption: 850, 
    status: 'Lead', 
    installationAddress: 'Rua do Lago, 45',
    city: 'Campinas',
    state: 'SP'
  },
  { 
    id: '4', 
    name: 'Mariana Costa', 
    email: 'mari.costa@tech.com', 
    phone: '(21) 97777-6666', 
    avgConsumption: 1200, 
    status: 'Proposta Enviada', 
    installationAddress: 'Estrada da Gávea, 500',
    city: 'Rio de Janeiro',
    state: 'RJ'
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.NEW_CLIENT);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const handleTabChange = (tab: Tab) => {
    if (tab === Tab.NEW_CLIENT) {
      // Se clicar na aba manualmente, limpa a edição para criar um novo
      setClientToEdit(null);
    }
    setActiveTab(tab);
  };

  // Chamado pelo ClientList ao clicar em Editar
  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setActiveTab(Tab.NEW_CLIENT);
  };

  // Chamado pelo ClientList ao clicar em Excluir
  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Chamado pelo NewClient ao clicar em Salvar
  const handleSaveClient = (formData: ClientFormData) => {
    const clientData: Client = {
      // Se existe clientToEdit, mantemos o ID dele. Se não, geramos um novo.
      id: clientToEdit ? clientToEdit.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cpfCnpj: formData.cpfCnpj,
      avgConsumption: Number(formData.consumption) || 0,
      status: (formData.clientStatus as any) || 'Lead',
      // Combina endereço e número para exibição simples na lista
      installationAddress: `${formData.address}, ${formData.number}`,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      connectionType: (formData.connectionType as any) || 'Monofásico',
      observations: formData.observations
    };

    if (clientToEdit) {
      // ATUALIZAR
      setClients(prev => prev.map(c => c.id === clientToEdit.id ? clientData : c));
      setClientToEdit(null); // Sai do modo de edição
      alert('Cliente atualizado com sucesso!');
    } else {
      // CRIAR NOVO
      setClients(prev => [clientData, ...prev]);
      alert('Cliente cadastrado com sucesso!');
    }

    // Redireciona para a lista para ver o resultado
    setActiveTab(Tab.CLIENT_LIST);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.NEW_CLIENT:
        return (
          <NewClient 
            initialData={clientToEdit} 
            onSave={handleSaveClient} 
          />
        );
      case Tab.CLIENT_LIST:
        return (
          <ClientList 
            clients={clients} 
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
          />
        );
      case Tab.FINANCIAL:
        return <FinancialControl />;
      default:
        return <NewClient onSave={handleSaveClient} />;
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