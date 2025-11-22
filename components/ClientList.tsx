import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, Filter, X, MapPin, Zap, Mail, Phone, User } from 'lucide-react';
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
    case 'Fechado': 
    case 'Cliente Ativo': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'Proposta Enviada': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'Lead': return 'bg-slate-600/30 text-slate-300 border border-slate-600/50';
    case 'Inativo': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  }
};

interface ClientListProps {
  onEditClient?: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onEditClient }) => {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinCons, setFilterMinCons] = useState('');
  const [filterMaxCons, setFilterMaxCons] = useState('');

  // View Modal State
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

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

  const handleView = (client: Client) => {
    setViewingClient(client);
  };

  const closeViewModal = () => {
    setViewingClient(null);
  };

  // Filtering Logic
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus ? client.status === filterStatus : true;
    
    const min = parseFloat(filterMinCons);
    const max = parseFloat(filterMaxCons);
    const matchesMin = !isNaN(min) ? client.avgConsumption >= min : true;
    const matchesMax = !isNaN(max) ? client.avgConsumption <= max : true;

    return matchesSearch && matchesStatus && matchesMin && matchesMax;
  });

  return (
    <div className="w-full max-w-5xl mx-auto relative">
        <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-white">Carteira de Clientes</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar cliente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2 pl-4 pr-10 text-white text-sm focus:outline-none focus:border-solar-blue placeholder:text-slate-500 transition-colors"
                    />
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-solar-blue border-solar-blue text-white' : 'bg-navy-950 border-navy-700 text-slate-400 hover:text-white hover:border-solar-blue'}`}
                    title="Filtros Avançados"
                >
                    <Filter size={20} />
                </button>
            </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
            <div className="bg-navy-950/50 border-b border-navy-800 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold">Status</label>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg py-2 px-3 text-white text-sm focus:border-solar-blue outline-none"
                    >
                        <option value="">Todos</option>
                        <option value="Lead">Lead</option>
                        <option value="Proposta Enviada">Proposta Enviada</option>
                        <option value="Fechado">Fechado</option>
                        <option value="Cliente Ativo">Cliente Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold">Consumo Mín (kWh)</label>
                    <input 
                        type="number" 
                        value={filterMinCons}
                        onChange={(e) => setFilterMinCons(e.target.value)}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg py-2 px-3 text-white text-sm focus:border-solar-blue outline-none"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold">Consumo Máx (kWh)</label>
                    <input 
                        type="number" 
                        value={filterMaxCons}
                        onChange={(e) => setFilterMaxCons(e.target.value)}
                        className="w-full bg-navy-900 border border-navy-700 rounded-lg py-2 px-3 text-white text-sm focus:border-solar-blue outline-none"
                        placeholder="10000"
                    />
                </div>
            </div>
        )}

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
                            onClick={() => handleView(client)}
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center w-full">
                      <Search size={32} className="mb-2 opacity-20" />
                      <span>Nenhum cliente encontrado com os filtros atuais.</span>
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

        {/* View Modal */}
        {viewingClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                    {/* Header */}
                    <div className="p-6 border-b border-navy-800 flex justify-between items-center bg-navy-950">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User size={20} className="text-solar-blue" />
                            Detalhes do Cliente
                        </h3>
                        <button 
                            onClick={closeViewModal}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-navy-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Header Profile */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-navy-800 flex items-center justify-center text-2xl font-bold text-solar-blue border-2 border-navy-700">
                                {viewingClient.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{viewingClient.name}</h2>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${getStatusColor(viewingClient.status)}`}>
                                    {viewingClient.status}
                                </span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-navy-950/50 p-3 rounded-xl border border-navy-800 flex items-center gap-3">
                                <Mail className="text-slate-500" size={18} />
                                <div>
                                    <span className="block text-xs text-slate-500">Email</span>
                                    <span className="text-sm text-slate-200">{viewingClient.email}</span>
                                </div>
                            </div>
                            <div className="bg-navy-950/50 p-3 rounded-xl border border-navy-800 flex items-center gap-3">
                                <Phone className="text-slate-500" size={18} />
                                <div>
                                    <span className="block text-xs text-slate-500">Telefone</span>
                                    <span className="text-sm text-slate-200">{viewingClient.phone}</span>
                                </div>
                            </div>
                            <div className="bg-navy-950/50 p-3 rounded-xl border border-navy-800 flex items-center gap-3">
                                <MapPin className="text-slate-500" size={18} />
                                <div>
                                    <span className="block text-xs text-slate-500">Endereço de Instalação</span>
                                    <span className="text-sm text-slate-200">{viewingClient.installationAddress}</span>
                                    <div className="text-xs text-slate-400">{viewingClient.city} - {viewingClient.state}</div>
                                </div>
                            </div>
                            <div className="bg-navy-950/50 p-3 rounded-xl border border-navy-800 flex items-center gap-3">
                                <Zap className="text-solar-yellow" size={18} />
                                <div>
                                    <span className="block text-xs text-slate-500">Consumo Médio</span>
                                    <span className="text-sm text-white font-bold">{viewingClient.avgConsumption} kWh</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-navy-800 bg-navy-950/50 flex justify-end gap-3">
                        <button 
                            onClick={() => { closeViewModal(); handleEdit(viewingClient); }}
                            className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-medium rounded-lg transition-colors border border-navy-600 flex items-center gap-2"
                        >
                            <Edit size={16} /> Editar
                        </button>
                        <button 
                            onClick={closeViewModal}
                            className="px-4 py-2 bg-solar-blue hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
