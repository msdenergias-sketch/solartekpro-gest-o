import React, { useState, useEffect, useRef } from 'react';
import { 
  User, MapPin, Save, FileText, 
  Upload, CheckCircle, ClipboardList, Lightbulb, HardDrive, Loader2, Crosshair, Sparkles, Globe, Zap, ChevronDown, Calculator, AlertCircle, Camera, Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateSolarProposalText } from '../services/geminiService';
import { ClientFormData, Client } from '../types';

const STEPS = [
  { id: 'pessoais', label: '1. Dados Pessoais', icon: User },
  { id: 'instalacao', label: '2. Instalação', icon: MapPin },
  { id: 'doc_iniciais', label: '3. Doc. Iniciais', icon: FileText },
  { id: 'doc_concessionaria', label: '4. Doc. Concessionaria', icon: ClipboardList },
  { id: 'projetos', label: '5. Projetos', icon: Lightbulb },
];

const UTILITY_COMPANIES = [
  "CEEE Equatorial (RS)", "RGE - Rio Grande Energia (RS)", "RGE Sul (RS)", "Coprel (RS)", "Certel (RS)", "Certaja (RS)", "Ceriluz (RS)", "Cerisul (RS)", "Celetro (RS)", "Cooperluz (RS)", "Creral (RS)", "Creluz (RS)", "Cerfox (RS)", "Demei (RS)", "Hidropan (RS)", "Eletrocar (RS)", "Muxfeldt (RS)", "Nova Palma (RS)", "CPFL Paulista", "Enel SP", "Cemig", "Copel", "Light"
];

const EFFICIENCY_DATA = [
  { month: 'Jan', production: 420, consumption: 380 },
  { month: 'Fev', production: 390, consumption: 360 },
  { month: 'Mar', production: 450, consumption: 350 },
  { month: 'Abr', production: 480, consumption: 340 },
  { month: 'Mai', production: 410, consumption: 330 },
  { month: 'Jun', production: 360, consumption: 380 },
];

const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  return true;
};
const isValidCNPJ = (cnpj: string) => { cnpj = cnpj.replace(/[^\d]+/g, ''); return cnpj.length === 14; };
const isValidDate = (d: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(d);

const toUTM = (lat: number, lon: number) => {
    if (!lat || !lon) return { zone: 0, band: '', easting: 0, northing: 0 };
    return { zone: 22, band: 'J', easting: 482901.64, northing: 6677358.92 };
};

const FileUploadBox = ({ label, checked }: { label: string, checked: boolean }) => {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const cameraInputRef = useRef<HTMLInputElement>(null);
   const handleCardClick = () => { fileInputRef.current?.click(); };
   const handleInputClick = (e: React.MouseEvent) => { e.stopPropagation(); };
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { console.log(`File: ${label}`, e.target.files[0].name); } }
   return (
     <div className="relative group h-full">
         <input type="file" className="hidden" ref={fileInputRef} accept="image/*,application/pdf" onClick={handleInputClick} onChange={handleFileChange} />
         <input type="file" className="hidden" ref={cameraInputRef} accept="image/*" capture="environment" onClick={handleInputClick} onChange={handleFileChange} />
         <div onClick={handleCardClick} className="border-2 border-dashed border-navy-700 bg-navy-950/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-solar-blue/50 transition-colors cursor-pointer h-40 relative">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-800 text-slate-400 group-hover:text-solar-blue group-hover:bg-solar-blue/10'}`}>
                 {checked ? <CheckCircle size={24} /> : <Upload size={24} />}
             </div>
             <span className="text-sm font-medium text-slate-300 text-center px-2">{label}</span>
             {checked && (<div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full"></div>)}
         </div>
         <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="absolute bottom-3 right-3 p-2.5 rounded-full bg-navy-800 hover:bg-solar-blue text-slate-400 hover:text-white transition-all shadow-lg border border-navy-700 hover:border-solar-blue z-10 group/cam" title="Tirar Foto"><Camera size={16} className="group-hover/cam:scale-110 transition-transform" /></button>
     </div>
   );
};

interface NewClientProps {
  initialData?: Client | null;
  onSave?: (data: ClientFormData) => void;
}

export const NewClient: React.FC<NewClientProps> = ({ initialData, onSave }) => {
  const [activeStep, setActiveStep] = useState('pessoais');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [utmCoords, setUtmCoords] = useState({ zone: 0, band: '', easting: 0, northing: 0 });
  const [mapLoading, setMapLoading] = useState(false);
  const [showUtilitySuggestions, setShowUtilitySuggestions] = useState(false);
  const utilityWrapperRef = useRef<HTMLDivElement>(null);

  const defaultFormData: ClientFormData = {
    name: '', clientStatus: 'Lead', email: '', phone: '', cpfCnpj: '', birthDate: '', idDocType: 'RG', idDocNumber: '', zipCode: '', address: '', number: '', neighborhood: '', city: '', state: '', referencePoint: '', uc: '', utilityCompany: '', mainBreaker: '', availablePower: '', installedPower: '', consumption: 350, connectionType: 'Bifásico', voltage: '220V', docPersonal: false, docAddress: false, docBill: false, docProxy: false, projectStatus: 'Em Análise', observations: '',
  };

  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

  useEffect(() => {
    if (initialData) {
      const addressParts = initialData.installationAddress.split(',');
      const street = addressParts[0] ? addressParts[0].trim() : '';
      const num = addressParts[1] ? addressParts[1].trim() : '';
      setFormData({
        ...defaultFormData,
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        consumption: initialData.avgConsumption,
        clientStatus: initialData.status,
        address: street,
        number: num,
        city: initialData.city,
        state: initialData.state,
        zipCode: initialData.zipCode || '',
        connectionType: initialData.connectionType || 'Bifásico',
        observations: initialData.observations || '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  useEffect(() => { function handleClickOutside(event: MouseEvent) { if (utilityWrapperRef.current && !utilityWrapperRef.current.contains(event.target as Node)) { setShowUtilitySuggestions(false); } } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [utilityWrapperRef]);
  useEffect(() => { if (mapCoordinates) { setUtmCoords(toUTM(mapCoordinates.lat, mapCoordinates.lng)); } }, [mapCoordinates]);
  useEffect(() => { const calculatePower = () => { const voltage = parseInt(formData.voltage.replace(/\D/g, '')) || 0; const breaker = parseInt(formData.mainBreaker.replace(/\D/g, '')) || 0; const type = formData.connectionType; if (!voltage || !breaker) { setFormData(prev => ({ ...prev, availablePower: '' })); return; } let power = 0; if (type === 'Trifásico') { power = (voltage * breaker * 1.73205) / 1000; } else { power = (voltage * breaker) / 1000; } setFormData(prev => ({ ...prev, availablePower: power.toFixed(2) })); }; calculatePower(); }, [formData.voltage, formData.mainBreaker, formData.connectionType]);
  useEffect(() => { const { address, number, neighborhood, city, state, zipCode } = formData; const parts = []; if (number) parts.push(number); if (address) parts.push(address); if (neighborhood) parts.push(neighborhood); if (city) parts.push(city); if (state) parts.push(state); const isValidSearch = parts.length >= 2 || (zipCode && zipCode.length >= 8); if (isValidSearch) { setMapLoading(true); const timer = setTimeout(() => { let searchQuery = ''; if (parts.length > 0) { searchQuery = `${parts.join(', ')}, Brazil`; } else if (zipCode) { searchQuery = `${zipCode}, Brazil`; } if (searchQuery) { fetchCoordinates(searchQuery); } else { setMapLoading(false); } }, 1000); return () => clearTimeout(timer); } else { setMapLoading(false); } }, [formData.address, formData.number, formData.neighborhood, formData.city, formData.state, formData.zipCode]);

  const filteredUtilities = UTILITY_COMPANIES.filter(company => company.toLowerCase().includes((formData.utilityCompany || '').toLowerCase()));
  const maskCPFOrCNPJ = (value: string) => { const v = value.replace(/\D/g, '').slice(0, 14); if (v.length > 11) { return v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '-$1'); } return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); };
  const maskPhone = (value: string) => { const v = value.replace(/\D/g, '').slice(0, 11); if (v.length > 10) { return v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); } return v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2'); };
  const maskDate = (value: string) => { const v = value.replace(/\D/g, '').slice(0, 8); return v.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2'); };
  const maskRG = (value: string) => { const v = value.replace(/[^0-9xX]/g, '').slice(0, 9); return v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})([0-9xX]{1})$/, '$1-$2'); };
  const maskCEP = (value: string) => { return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9); };
  const fetchCoordinates = async (fullAddress: string) => { try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`); const data = await response.json(); if (data && data.length > 0) { setMapCoordinates({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }); } } catch (error) { console.error("Erro ao buscar coordenadas:", error); } finally { setMapLoading(false); } };
  const fetchAddressByCEP = async (cep: string) => { const cleanCep = cep.replace(/\D/g, ''); if (cleanCep.length !== 8) return; setCepLoading(true); try { const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`); const data = await response.json(); if (!data.erro) { setErrors(prev => ({ ...prev, zipCode: undefined })); const newAddressData = { address: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '', }; setFormData(prev => ({ ...prev, ...newAddressData })); } else { setErrors(prev => ({ ...prev, zipCode: 'CEP não encontrado.' })); } } catch (error) { console.error("Erro ao buscar CEP:", error); } finally { setCepLoading(false); } };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value } = e.target; let formattedValue = value; if (errors[name as keyof ClientFormData]) { setErrors(prev => ({ ...prev, [name]: undefined })); } switch (name) { case 'cpfCnpj': formattedValue = maskCPFOrCNPJ(value); break; case 'phone': formattedValue = maskPhone(value); break; case 'birthDate': formattedValue = maskDate(value); break; case 'email': formattedValue = value.toLowerCase(); break; case 'zipCode': formattedValue = maskCEP(value); if (formattedValue.replace(/\D/g, '').length === 8) { fetchAddressByCEP(formattedValue); } break; case 'idDocNumber': if (formData.idDocType === 'CIN') { formattedValue = maskCPFOrCNPJ(value); } else if (formData.idDocType === 'RG') { formattedValue = maskRG(value); } else { formattedValue = value.toUpperCase(); } break; default: break; } setFormData(prev => ({ ...prev, [name]: formattedValue })); };
  const handleSelectUtility = (utility: string) => { setFormData(prev => ({ ...prev, utilityCompany: utility })); setShowUtilitySuggestions(false); if (errors.utilityCompany) setErrors(prev => ({ ...prev, utilityCompany: undefined })); };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};
    let isValid = true;
    if (!formData.name.trim()) { newErrors.name = 'Nome obrigatório.'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleGenerateProposal = async () => { const clientName = formData.name || "Cliente"; const clientConsumption = Number(formData.consumption) || 0; const clientCity = formData.city || "Não informada"; setLoading(true); const proposal = await generateSolarProposalText(clientName, clientConsumption, clientCity); setGeneratedProposal(proposal); setLoading(false); };

  const handleSave = () => {
    const isValid = validateForm();
    
    if (!isValid) {
        setSavedMessage('Verifique os erros.');
        setTimeout(() => setSavedMessage(''), 3000);
        return;
    }

    if (onSave) {
      onSave(formData);
    }

    console.log("Dados salvos:", formData);
    setSavedMessage('Dados salvos com sucesso!');
    
    if (!initialData) {
        setTimeout(() => {
            setFormData(defaultFormData);
            setSavedMessage('');
            setActiveStep('pessoais');
        }, 2000);
    } else {
        setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const inputClass = (fieldName: keyof ClientFormData) => `w-full bg-navy-950 border rounded-xl py-2.5 px-4 text-white outline-none transition-colors ${errors[fieldName] ? 'border-red-500 focus:border-red-500' : 'border-navy-700 focus:border-solar-blue'}`;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-navy-800 bg-navy-950/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="bg-solar-blue p-2 rounded-lg">
              <User className="text-white" size={24} />
            </div>
            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
        </div>
        
        {/* Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide bg-navy-900 border-b border-navy-800">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button key={step.id} onClick={() => setActiveStep(step.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative ${isActive ? 'text-white bg-navy-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-navy-800/30'}`}>
                <Icon size={18} className={isActive ? 'text-solar-blue' : ''} />
                {step.label}
                {isActive && (<div className="absolute bottom-0 left-0 w-full h-0.5 bg-solar-blue shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {/* Step 1: Personal Data */}
          {activeStep === 'pessoais' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass('name')} />
                      {errors.name && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.name}</span>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Status do Cliente</label>
                      <select name="clientStatus" value={formData.clientStatus} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none">
                        <option value="Lead">Lead</option><option value="Proposta Enviada">Proposta Enviada</option><option value="Fechado">Fechado</option><option value="Cliente Ativo">Cliente Ativo</option><option value="Inativo">Inativo</option>
                      </select>
                    </div>
                 </div>
                 {/* ... Other inputs ... */}
                 <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-1"><label className="block text-sm text-slate-400 mb-1">Tipo Doc.</label><select name="idDocType" value={formData.idDocType} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"><option value="RG">RG</option><option value="CIN">CIN</option><option value="RP">RP</option></select></div>
                   <div className="col-span-2"><label className="block text-sm text-slate-400 mb-1">Número Documento</label><input type="text" name="idDocNumber" value={formData.idDocNumber} onChange={handleInputChange} placeholder="Número" className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-slate-400 mb-1">CPF / CNPJ</label><input type="text" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleInputChange} className={inputClass('cpfCnpj')} /></div>
                    <div><label className="block text-sm text-slate-400 mb-1">Data Nascimento</label><input type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className={inputClass('birthDate')} /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-slate-400 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass('email')} /></div>
                    <div><label className="block text-sm text-slate-400 mb-1">Telefone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass('phone')} /></div>
                 </div>
                 {/* Observations Field */}
                 <div>
                    <label className="block text-sm text-slate-400 mb-1">Observações</label>
                    <textarea name="observations" value={formData.observations} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none min-h-[80px] resize-y" placeholder="Anotações sobre o cliente..." />
                 </div>
              </div>
              {/* Chart placeholder */}
              <div className="bg-navy-950 rounded-xl border border-navy-800 p-6 flex flex-col relative overflow-hidden min-h-[380px]">
                <div className="flex items-start justify-between mb-6 z-10"><div><h3 className="text-lg font-semibold text-white flex items-center gap-2"><Zap className="text-solar-yellow" size={20} fill="#f59e0b" /> Potencial</h3><p className="text-sm text-slate-500 mt-1">Simulação padrão</p></div></div>
                <div className="flex-1 w-full h-full min-h-[250px] z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={EFFICIENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient><linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                      <Area type="monotone" dataKey="production" stroke="#f59e0b" fill="url(#colorProd)" /><Area type="monotone" dataKey="consumption" stroke="#2563eb" fill="url(#colorCons)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Installation */}
          {activeStep === 'instalacao' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 relative"><label className="block text-sm text-slate-400 mb-1">CEP</label><input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="000.000.000" className={inputClass('zipCode')} />{cepLoading && <div className="absolute right-3 top-[2.2rem] animate-spin text-solar-blue"><Loader2 size={16}/></div>}</div>
                  <div className="col-span-2"><label className="block text-sm text-slate-400 mb-1">Endereço</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className={inputClass('address')} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm text-slate-400 mb-1">Número</label><input type="text" name="number" value={formData.number} onChange={handleInputChange} className={inputClass('number')} /></div>
                  <div className="col-span-2"><label className="block text-sm text-slate-400 mb-1">Bairro</label><input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm text-slate-400 mb-1">Cidade</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className={inputClass('city')} /></div>
                  <div><label className="block text-sm text-slate-400 mb-1">Estado</label><input type="text" name="state" value={formData.state} onChange={handleInputChange} className={inputClass('state')} /></div>
                </div>
                {/* ... Utility, Technical, Power ... */}
                <div><label className="block text-sm text-slate-400 mb-1">Ponto de Referência</label><input type="text" name="referencePoint" list="refPoints" value={formData.referencePoint || ''} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none" /><datalist id="refPoints"><option value="Próximo à escola" /></datalist></div>
                <div className="h-px bg-navy-800 my-2"></div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="relative" ref={utilityWrapperRef}>
                     <label className="block text-sm text-slate-400 mb-1">Concessionária</label>
                     <div className="relative">
                       <input type="text" name="utilityCompany" value={formData.utilityCompany} onChange={(e) => { handleInputChange(e); setShowUtilitySuggestions(true); }} onFocus={() => setShowUtilitySuggestions(true)} className={inputClass('utilityCompany')} autoComplete="off" />
                       <div className="absolute right-3 top-3 pointer-events-none text-slate-500"><ChevronDown size={16} /></div>
                     </div>
                     {showUtilitySuggestions && (
                       <div className="absolute z-50 w-full mt-1 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                         {filteredUtilities.map((company, idx) => (
                           <button key={idx} onClick={() => handleSelectUtility(company)} className="w-full text-left px-4 py-2.5 hover:bg-navy-800 text-sm text-slate-300 hover:text-white transition-colors border-b border-navy-800/50 last:border-0">{company}</button>
                         ))}
                       </div>
                     )}
                   </div>
                   <div><label className="block text-sm text-slate-400 mb-1">UC</label><input type="text" name="uc" value={formData.uc} onChange={handleInputChange} className={inputClass('uc')} /></div>
                   <div><label className="block text-sm text-slate-400 mb-1">Disjuntor</label><select name="mainBreaker" value={formData.mainBreaker} onChange={handleInputChange} className={inputClass('mainBreaker')}><option value="">Selecione</option><option value="30A">30A</option><option value="40A">40A</option><option value="50A">50A</option><option value="63A">63A</option><option value="70A">70A</option><option value="80A">80A</option><option value="100A">100A</option></select></div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                   <div><label className="block text-sm text-slate-400 mb-1">Conexão</label><select name="connectionType" value={formData.connectionType} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white outline-none"><option>Monofásico</option><option>Bifásico</option><option>Trifásico</option></select></div>
                   <div><label className="block text-sm text-slate-400 mb-1">Tensão</label><select name="voltage" value={formData.voltage} onChange={handleInputChange} className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white outline-none"><option>127V</option><option>220V</option><option>380V</option></select></div>
                   <div><label className="block text-sm text-slate-400 mb-1">Consumo</label><input type="number" name="consumption" value={formData.consumption} onChange={handleInputChange} className={inputClass('consumption')} /></div>
                   <div><label className="block text-sm text-solar-green mb-1 flex items-center gap-1"><Calculator size={14} /> Disp.</label><div className="w-full bg-navy-900/50 border border-solar-green/30 rounded-xl py-2.5 px-4 text-solar-green font-mono font-bold flex items-center justify-between"><span>{formData.availablePower || '0.00'}</span><span className="text-xs opacity-70">kW</span></div></div>
                   <div><label className="block text-sm text-solar-yellow mb-1 flex items-center gap-1"><Zap size={14} /> Inst.</label><input type="number" name="installedPower" value={formData.installedPower || ''} onChange={handleInputChange} className={`${inputClass('installedPower')} font-bold text-white`} /></div>
                </div>
              </div>
              {/* Map */}
              <div className="bg-navy-950 rounded-xl border border-navy-800 overflow-hidden flex flex-col relative min-h-[350px]">
                  {mapCoordinates ? (
                      <>
                       <iframe title="Location" width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoordinates.lng - 0.005},${mapCoordinates.lat - 0.005},${mapCoordinates.lng + 0.005},${mapCoordinates.lat + 0.005}&layer=mapnik&marker=${mapCoordinates.lat},${mapCoordinates.lng}`} className="flex-1 opacity-90 hover:opacity-100 transition-opacity"></iframe>
                       <div className="absolute bottom-4 left-4 bg-navy-900/95 backdrop-blur-md border border-navy-700 p-4 rounded-xl shadow-2xl z-10 text-xs font-mono min-w-[280px]"><div className="flex items-center gap-2 mb-3 text-solar-blue font-bold uppercase tracking-wider border-b border-navy-700 pb-2"><Crosshair size={14} /> UTM</div><div className="space-y-2"><div className="flex justify-between"><span className="text-slate-400">Zona:</span><span className="text-white">{utmCoords.zone} {utmCoords.band}</span></div><div className="flex justify-between"><span className="text-slate-400">Easting:</span><span className="text-white">{utmCoords.easting.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-slate-400">Northing:</span><span className="text-white">{utmCoords.northing.toFixed(2)}</span></div></div></div>
                       <div className="absolute top-4 right-4 z-10"><div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"><Globe size={12} /> <span className="font-mono text-xs">{mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}</span></div></div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4"><MapPin size={48} className="opacity-20" /><p>O mapa aparecerá aqui.</p></div>
                  )}
              </div>
            </div>
          )}

          {/* Other Steps */}
          {(activeStep === 'doc_iniciais' || activeStep === 'doc_concessionaria') && (
            <div className="animate-fade-in"><h3 className="text-lg font-semibold text-white mb-4">Documentação</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><FileUploadBox label="Documento 1" checked={true} /><FileUploadBox label="Documento 2" checked={false} /><FileUploadBox label="Outros" checked={false} /></div></div>
          )}

          {activeStep === 'projetos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in h-full">
                <div className="flex flex-col gap-6">
                    <div className="bg-navy-950 border border-navy-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4"><HardDrive size={20} className="inline mr-2 text-solar-blue"/> Dados do Projeto</h3>
                        <button onClick={handleGenerateProposal} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold mt-4">{loading ? 'Gerando...' : 'Gerar Proposta IA'}</button>
                    </div>
                    <button onClick={handleSave} className={`w-full py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${savedMessage ? 'bg-emerald-500 text-white' : 'bg-solar-blue hover:bg-blue-500 text-white'}`}>
                        {savedMessage ? (<><CheckCircle size={20} /> {savedMessage}</>) : (<><Save size={20} /> Salvar Todos os Dados</>)}
                    </button>
                </div>
                <div className="bg-navy-950 border border-navy-800 rounded-xl p-4 min-h-[400px]">
                    <h3 className="font-semibold text-white mb-4">Proposta Gerada</h3>
                    <div className="prose prose-invert text-sm text-slate-300 whitespace-pre-wrap">{generatedProposal || 'Aguardando geração...'}</div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};