import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { Client } from '../types';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Fechado': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'Proposta Enviada': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'Lead': return 'bg-slate-600/30 text-slate-300 border border-slate-600/50';
    default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }
};

interface ClientListProps {
  onEditClient?: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onEditClient }) => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      setClients(prev => prev.filter(client => client.id !== id));
    }
  };

  const handleEdit = (client: Client) => {
    if (onEditClient) {
      onEditClient(client);
    }
  };

  const handleView = (id: string) => {
    console.log(`Visualizando cliente ${id}`);
    // Lógica de visualização seria implementada aqui
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
        <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-navy-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white">Carteira de Clientes</h2>
            <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
            <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2 pl-4 pr-10 text-white text-sm focus:outline-none focus:border-solar-blue placeholder:text-slate-500"
            />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-navy-950 text-slate-300 uppercase tracking-wider font-semibold text-xs border-b border-navy-800">
                <tr>
                <th className="px-6 py-4">CLIENTE</th>
                <th className="px-6 py-4">CONSUMO (MÉDIO)</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">ENDEREÇO</th>
                <th className="px-6 py-4 text-right">AÇÕES</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 bg-navy-900/50">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-navy-800/30 transition-colors group border-b border-navy-800/50 last:border-0">
                      <td className="px-6 py-4">
                      <div className="flex flex-col">
                          <span className="text-white font-bold text-sm group-hover:text-solar-blue transition-colors">{client.name}</span>
                          <span className="text-xs text-slate-500">{client.email}</span>
                      </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                      {client.avgConsumption} <span className="text-slate-500 text-xs font-normal">kWh</span>
                      </td>
                      <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${getStatusColor(client.status)}`}>
                          {client.status}
                      </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                      <div className="flex flex-col">
                          <span className="text-sm">{client.installationAddress}</span>
                          <span className="text-xs text-slate-600">{client.city} - {client.state}</span>
                      </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleView(client.id)}
                            className="p-2 rounded-lg bg-navy-950 border border-navy-800 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/30 transition-all shadow-sm"
                            title="Visualizar"
                          >
                              <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEdit(client)}
                            className="p-2 rounded-lg bg-navy-950 border border-navy-800 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 hover:border-yellow-500/30 transition-all shadow-sm"
                            title="Editar"
                          >
                              <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)}
                            className="p-2 rounded-lg bg-navy-950 border border-navy-800 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all shadow-sm"
                            title="Excluir"
                          >
                              <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhum cliente encontrado para "{searchTerm}".
                    </td>
                  </tr>
                )}
            </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-navy-800 bg-navy-950/30 flex justify-between items-center text-xs text-slate-500">
            <span>Mostrando {filteredClients.length} de {clients.length} clientes</span>
            <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors border border-navy-700 font-medium text-xs">Anterior</button>
            <button className="px-4 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors border border-navy-700 font-medium text-xs">Próximo</button>
            </div>
        </div>
        </div>
    </div>
  );
};