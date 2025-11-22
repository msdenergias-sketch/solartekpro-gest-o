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

// Lista de Concessionárias Priorizando RS
const UTILITY_COMPANIES = [
  // --- Rio Grande do Sul (Prioridade) ---
  "CEEE Equatorial (RS)",
  "RGE - Rio Grande Energia (RS)",
  "RGE Sul (RS)",
  "Coprel (RS)",
  "Certel (RS)",
  "Certaja (RS)",
  "Ceriluz (RS)",
  "Cerisul (RS)",
  "Celetro (RS)",
  "Cooperluz (RS)",
  "Creral (RS)",
  "Creluz (RS)",
  "Cerfox (RS)",
  "Demei (Ijuí - RS)",
  "Hidropan (Panambi - RS)",
  "Eletrocar (Carazinho - RS)",
  "Muxfeldt / Muxenergia (RS)",
  "Nova Palma Energia (RS)",
  
  // --- Principais do Brasil ---
  "CPFL Paulista (SP)",
  "CPFL Piratininga (SP)",
  "CPFL Santa Cruz",
  "Enel Distribuição SP",
  "Enel Distribuição RJ",
  "Enel Distribuição CE",
  "Enel Distribuição GO",
  "Cemig (MG)",
  "Copel (PR)",
  "Celesc (SC)",
  "Light (RJ)",
  "Neoenergia Coelba (BA)",
  "Neoenergia Pernambuco (PE)",
  "Neoenergia Cosern (RN)",
  "Neoenergia Elektro (SP/MS)",
  "Energisa (Vários Estados)",
  "Equatorial (MA, PA, PI, AL)",
  "EDP (ES, SP)",
  "Roraima Energia",
  "Amazonas Energia"
];

// Mock Data for Efficiency Chart
const EFFICIENCY_DATA = [
  { month: 'Jan', production: 420, consumption: 380 },
  { month: 'Fev', production: 390, consumption: 360 },
  { month: 'Mar', production: 450, consumption: 350 },
  { month: 'Abr', production: 480, consumption: 340 },
  { month: 'Mai', production: 410, consumption: 330 },
  { month: 'Jun', production: 360, consumption: 380 },
];

// --- ALGORITMO WGS84 PARA UTM (Engenharia) ---
const toUTM = (lat: number, lon: number) => {
  if (!lat || !lon) return { zone: 0, band: '', easting: 0, northing: 0 };

  const a = 6378137; // WGS84 major axis
  const f = 1 / 298.257223563; // WGS84 flattening
  const k0 = 0.9996; // scale factor

  const phi = lat * (Math.PI / 180);
  const lambda = lon * (Math.PI / 180);

  // Cálculo da Zona
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lambda0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const e2 = 2 * f - f * f;
  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
  const T = Math.tan(phi) * Math.tan(phi);
  const C = (e2 / (1 - e2)) * Math.cos(phi) * Math.cos(phi);
  const A = (lambda - lambda0) * Math.cos(phi);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi)
  );

  const easting = 500000 + k0 * N * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A * A * A * A * A / 120);
  
  let northing = k0 * (M + N * Math.tan(phi) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A * A * A * A * A * A / 720));
  
  if (lat < 0) {
    northing += 10000000; // False northing for Southern Hemisphere
  }

  // Cálculo da Banda de Latitude (C até X, omitindo I e O)
  // Bandas de 8 graus iniciando em 80S
  const letters = "CDEFGHJKLMNPQRSTUVWXX"; 
  const idx = Math.floor((lat + 80) / 8);
  const band = letters[Math.max(0, Math.min(letters.length - 1, idx))] || 'X';

  return {
    zone,
    band,
    easting,
    northing
  };
};

// File Upload Component Extracted to Fix Event Bubbling
const FileUploadBox = ({ label, checked }: { label: string, checked: boolean }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        console.log(`Arquivo selecionado para ${label}:`, e.target.files[0].name);
    }
  }

  return (
    <div className="relative group h-full">
        <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*,application/pdf"
            onClick={handleInputClick}
            onChange={handleFileChange}
        />
        <input 
            type="file" 
            className="hidden" 
            ref={cameraInputRef} 
            accept="image/*"
            capture="environment"
            onClick={handleInputClick}
            onChange={handleFileChange}
        />

        <div 
            onClick={handleCardClick}
            className="border-2 border-dashed border-navy-700 bg-navy-950/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-solar-blue/50 transition-colors cursor-pointer h-40 relative"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-navy-800 text-slate-400 group-hover:text-solar-blue group-hover:bg-solar-blue/10'}`}>
                {checked ? <CheckCircle size={24} /> : <Upload size={24} />}
            </div>
            <span className="text-sm font-medium text-slate-300 text-center px-2">{label}</span>
            
            {checked && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
        </div>

        <button 
            onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
            }}
            className="absolute bottom-3 right-3 p-2.5 rounded-full bg-navy-800 hover:bg-solar-blue text-slate-400 hover:text-white transition-all shadow-lg border border-navy-700 hover:border-solar-blue z-10 group/cam"
            title="Tirar Foto"
        >
            <Camera size={16} className="group-hover/cam:scale-110 transition-transform" />
        </button>
    </div>
  );
};

interface NewClientProps {
  initialData?: Client | null;
}

export const NewClient: React.FC<NewClientProps> = ({ initialData }) => {
  const [activeStep, setActiveStep] = useState('pessoais');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  
  // Coordinates & Map State
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [utmCoords, setUtmCoords] = useState({ zone: 0, band: '', easting: 0, northing: 0 });
  const [mapLoading, setMapLoading] = useState(false);

  // Utility Dropdown State
  const [showUtilitySuggestions, setShowUtilitySuggestions] = useState(false);
  const utilityWrapperRef = useRef<HTMLDivElement>(null);

  const defaultFormData: ClientFormData = {
    name: '',
    clientStatus: 'Lead',
    email: '',
    phone: '',
    cpfCnpj: '',
    birthDate: '',
    idDocType: 'RG',
    idDocNumber: '',
    zipCode: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    referencePoint: '',
    uc: '',
    utilityCompany: '',
    mainBreaker: '',
    availablePower: '',
    installedPower: '',
    consumption: 350,
    connectionType: 'Bifásico',
    voltage: '220V',
    docPersonal: false,
    docAddress: false,
    docBill: false,
    docProxy: false,
    projectStatus: 'Em Análise',
  };

  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);

  // Populate form if initialData provided (Editing Mode)
  useEffect(() => {
    if (initialData) {
      // Split address to try and extract street and number if formatted like "Street, Number"
      // This is a basic heuristic for the mock data
      const addressParts = initialData.installationAddress.split(',');
      const street = addressParts[0] ? addressParts[0].trim() : '';
      const num = addressParts[1] ? addressParts[1].trim() : '';

      setFormData({
        ...defaultFormData,
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        consumption: initialData.avgConsumption,
        clientStatus: initialData.status, // Assuming status matches dropdown values
        address: street,
        number: num,
        city: initialData.city,
        state: initialData.state,
        zipCode: initialData.zipCode || '',
        connectionType: initialData.connectionType || 'Bifásico',
        // Other fields would remain defaults or empty as they aren't in the simple Client list view model
      });
      
      // If we have enough address info, trigger map update (via existing effect dependence on formData)
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (utilityWrapperRef.current && !utilityWrapperRef.current.contains(event.target as Node)) {
        setShowUtilitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [utilityWrapperRef]);

  // Update UTM when coordinates change
  useEffect(() => {
    if (mapCoordinates) {
      setUtmCoords(toUTM(mapCoordinates.lat, mapCoordinates.lng));
    }
  }, [mapCoordinates]);

  // --- CALCULO DE POTÊNCIA DISPONIBILIZADA ---
  useEffect(() => {
    const calculatePower = () => {
      const voltage = parseInt(formData.voltage.replace(/\D/g, '')) || 0;
      const breaker = parseInt(formData.mainBreaker.replace(/\D/g, '')) || 0;
      const type = formData.connectionType;

      if (!voltage || !breaker) {
        setFormData(prev => ({ ...prev, availablePower: '' }));
        return;
      }

      let power = 0;

      if (type === 'Trifásico') {
        // P = V * I * 1.732 / 1000 (kW)
        power = (voltage * breaker * 1.73205) / 1000;
      } else {
        // Monofásico ou Bifásico: P = V * I / 1000 (kW)
        power = (voltage * breaker) / 1000;
      }

      setFormData(prev => ({ ...prev, availablePower: power.toFixed(2) }));
    };

    calculatePower();
  }, [formData.voltage, formData.mainBreaker, formData.connectionType]);

  // Filter utility companies based on input
  const filteredUtilities = UTILITY_COMPANIES.filter(company => 
    company.toLowerCase().includes((formData.utilityCompany || '').toLowerCase())
  );

  // --- MASKING FUNCTIONS ---

  const maskCPFOrCNPJ = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 14);
    if (v.length > 11) {
      return v
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '-$1');
    }
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const maskPhone = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) {
        return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const maskDate = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    return v
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2');
  };

  const maskRG = (value: string) => {
    const v = value.replace(/[^0-9xX]/g, '').slice(0, 9);
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})([0-9xX]{1})$/, '$1-$2');
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const fetchCoordinates = async (fullAddress: string) => {
    try {
      // Using OpenStreetMap Nominatim API
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setMapCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
    } finally {
      setMapLoading(false);
    }
  };

  // Auto-update map when address fields change (Debounced)
  useEffect(() => {
    const { address, number, neighborhood, city, state, zipCode } = formData;
    
    // Filter out empty fields to build a robust query
    const parts = [];
    if (number) parts.push(number);
    if (address) parts.push(address);
    if (neighborhood) parts.push(neighborhood);
    if (city) parts.push(city);
    if (state) parts.push(state);

    // Need at least City+State or Address to search, or a valid Zip
    const isValidSearch = parts.length >= 2 || (zipCode && zipCode.length >= 8);

    if (isValidSearch) {
      // Set loading immediately to show feedback
      setMapLoading(true);

      const timer = setTimeout(() => {
        // Construct search string. Adding 'Brazil' helps restrict context.
        // If we have a specific address, prioritized it over just city/state
        let searchQuery = '';
        if (parts.length > 0) {
          searchQuery = `${parts.join(', ')}, Brazil`;
        } else if (zipCode) {
          searchQuery = `${zipCode}, Brazil`;
        }

        if (searchQuery) {
          fetchCoordinates(searchQuery);
        } else {
          setMapLoading(false);
        }
      }, 1000); // 1 second debounce for smoother typing

      return () => clearTimeout(timer);
    } else {
      setMapLoading(false);
    }
  }, [formData.address, formData.number, formData.neighborhood, formData.city, formData.state, formData.zipCode]);

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        const newAddressData = {
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        };
        
        setFormData(prev => ({
          ...prev,
          ...newAddressData
        }));
        // The useEffect above will catch these changes and update the map automatically
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setCepLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Clear error on change
    if (errors[name as keyof ClientFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    switch (name) {
      case 'cpfCnpj':
        formattedValue = maskCPFOrCNPJ(value);
        break;
      case 'phone':
        formattedValue = maskPhone(value);
        break;
      case 'birthDate':
        formattedValue = maskDate(value);
        break;
      case 'email':
        formattedValue = value.toLowerCase();
        break;
      case 'zipCode':
        formattedValue = maskCEP(value);
        if (formattedValue.replace(/\D/g, '').length === 8) {
          fetchAddressByCEP(formattedValue);
        }
        break;
      case 'idDocNumber':
        if (formData.idDocType === 'CIN') {
          formattedValue = maskCPFOrCNPJ(value);
        } else if (formData.idDocType === 'RG') {
          formattedValue = maskRG(value);
        } else {
           formattedValue = value.toUpperCase();
        }
        break;
      default:
        break;
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSelectUtility = (utility: string) => {
    setFormData(prev => ({ ...prev, utilityCompany: utility }));
    setShowUtilitySuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};
    let isValid = true;

    // Name is fundamental
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do cliente é obrigatório.';
      isValid = false;
    }

    // Email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido.';
      isValid = false;
    }

    // CPF/CNPJ length
    const cleanCpf = formData.cpfCnpj.replace(/\D/g, '');
    if (formData.cpfCnpj && cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      newErrors.cpfCnpj = 'CPF/CNPJ incompleto.';
      isValid = false;
    }

    // Phone length
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (formData.phone && cleanPhone.length < 10) {
      newErrors.phone = 'Telefone incompleto.';
      isValid = false;
    }

    // BirthDate length
    if (formData.birthDate && formData.birthDate.length !== 10) {
      newErrors.birthDate = 'Data inválida.';
      isValid = false;
    }

    // ZipCode length
    const cleanCep = formData.zipCode.replace(/\D/g, '');
    if (formData.zipCode && cleanCep.length !== 8) {
      newErrors.zipCode = 'CEP incompleto.';
      isValid = false;
    }

    // Consumption numeric
    if (formData.consumption && isNaN(Number(formData.consumption))) {
      newErrors.consumption = 'Valor inválido.';
      isValid = false;
    }

    // Installed Power numeric
    if (formData.installedPower && isNaN(Number(formData.installedPower))) {
      newErrors.installedPower = 'Valor inválido.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGenerateProposal = async () => {
    const clientName = formData.name || "Cliente";
    const clientConsumption = Number(formData.consumption) || 0;
    const clientCity = formData.city || "Não informada";

    setLoading(true);
    const proposal = await generateSolarProposalText(clientName, clientConsumption, clientCity);
    setGeneratedProposal(proposal);
    setLoading(false);
  };

  const handleSave = () => {
    const isValid = validateForm();
    
    if (!isValid) {
        // Auto-navigate to the tab with errors
        setSavedMessage('Verifique os erros destacados.');
        
        // Simple heuristic to switch tabs based on fields
        const errorKeys = Object.keys(validateForm() ? {} : errors); // We need to re-run logic or use state after update? 
        // Since setErrors is async, let's re-evaluate locally for navigation
        const tempErrors: any = {};
        if (!formData.name.trim()) tempErrors.name = true;
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) tempErrors.email = true;
        
        // Priority to Personal Data
        if (tempErrors.name || tempErrors.email || (formData.cpfCnpj && formData.cpfCnpj.length < 11)) {
            setActiveStep('pessoais');
        } else if ((formData.zipCode && formData.zipCode.length < 9) || (formData.consumption && isNaN(Number(formData.consumption)))) {
            setActiveStep('instalacao');
        }

        setTimeout(() => setSavedMessage(''), 3000);
        return;
    }

    console.log("Dados salvos:", formData);
    setSavedMessage('Dados salvos com sucesso!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Helper for input classes with error state
  const inputClass = (fieldName: keyof ClientFormData) => `
    w-full bg-navy-950 border rounded-xl py-2.5 px-4 text-white outline-none transition-colors
    ${errors[fieldName] 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-navy-700 focus:border-solar-blue'}
  `;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Main Header with Navigation Tabs */}
      <div className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-navy-800 bg-navy-950/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="bg-solar-blue p-2 rounded-lg">
              <User className="text-white" size={24} />
            </div>
            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
        </div>
        
        {/* Step Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide bg-navy-900 border-b border-navy-800">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative
                  ${isActive ? 'text-white bg-navy-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-navy-800/30'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-solar-blue' : ''} />
                {step.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-solar-blue shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[400px]">
          
          {/* 1. Dados Pessoais */}
          {activeStep === 'pessoais' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                      <input 
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        className={inputClass('name')}
                      />
                      {errors.name && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.name}</span>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Status do Cliente</label>
                      <select 
                        name="clientStatus" 
                        value={formData.clientStatus} 
                        onChange={handleInputChange}
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                      >
                        <option value="Lead">Lead</option>
                        <option value="Proposta Enviada">Proposta Enviada</option>
                        <option value="Fechado">Fechado</option>
                        <option value="Cliente Ativo">Cliente Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                 </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-1">
                    <label className="block text-sm text-slate-400 mb-1">Tipo Doc.</label>
                    <select 
                      name="idDocType" value={formData.idDocType} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    >
                      <option value="RG">RG</option>
                      <option value="CIN">CIN</option>
                      <option value="RP">RP</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-400 mb-1">Número Documento</label>
                    <input 
                      type="text" name="idDocNumber" value={formData.idDocNumber} onChange={handleInputChange}
                      placeholder={formData.idDocType === 'RG' ? 'Ex: 12.345.678-9' : 'Digite o número'}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">CPF / CNPJ</label>
                    <input 
                      type="text" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      className={inputClass('cpfCnpj')}
                    />
                    {errors.cpfCnpj && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.cpfCnpj}</span>}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Data Nascimento</label>
                    <input 
                      type="text" name="birthDate" value={formData.birthDate} onChange={handleInputChange}
                      placeholder="DD/MM/AAAA" maxLength={10}
                      className={inputClass('birthDate')}
                    />
                    {errors.birthDate && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.birthDate}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email</label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleInputChange}
                      placeholder="exemplo@email.com"
                      className={inputClass('email')}
                    />
                    {errors.email && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.email}</span>}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Telefone</label>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      className={inputClass('phone')}
                    />
                    {errors.phone && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.phone}</span>}
                  </div>
                </div>
              </div>
              
              {/* Energy Efficiency Chart Panel */}
              <div className="bg-navy-950 rounded-xl border border-navy-800 p-6 flex flex-col relative overflow-hidden min-h-[380px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-solar-blue/5 rounded-bl-full z-0 pointer-events-none"></div>
                
                <div className="flex items-start justify-between mb-6 z-10">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap className="text-solar-yellow" size={20} fill="#f59e0b" />
                      Potencial de Eficiência
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Simulação baseada em perfil padrão</p>
                  </div>
                  <div className="bg-navy-900 px-3 py-1 rounded-lg border border-navy-700 text-xs font-medium text-solar-green flex items-center gap-1">
                    <Sparkles size={12} /> 
                    Estimativa IA
                  </div>
                </div>

                <div className="flex-1 w-full h-full min-h-[250px] z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={EFFICIENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="production" name="Geração (kWh)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
                      <Area type="monotone" dataKey="consumption" name="Consumo (kWh)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-solar-yellow"></div>
                    <span>Geração Solar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-solar-blue"></div>
                    <span>Consumo da Rede</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Instalação */}
          {activeStep === 'instalacao' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 relative">
                    <label className="block text-sm text-slate-400 mb-1">CEP</label>
                    <input 
                      type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange}
                      placeholder="000.000.000"
                      className={inputClass('zipCode')}
                    />
                    {errors.zipCode && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.zipCode}</span>}
                    {cepLoading && (
                      <div className="absolute right-3 top-[2.2rem] animate-spin text-solar-blue">
                        <Loader2 size={16} />
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-400 mb-1">Endereço</label>
                    <input 
                      type="text" name="address" value={formData.address} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Número</label>
                    <input 
                      type="text" name="number" value={formData.number} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-400 mb-1">Bairro</label>
                    <input 
                      type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Cidade</label>
                    <input 
                      type="text" name="city" value={formData.city} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Estado</label>
                    <input 
                      type="text" name="state" value={formData.state} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                </div>

                {/* Reference Point with Datalist */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Ponto de Referência</label>
                    <input 
                      type="text" 
                      name="referencePoint" 
                      list="refPoints"
                      value={formData.referencePoint || ''} 
                      onChange={handleInputChange}
                      placeholder="Ex: Próximo ao mercado..."
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                    <datalist id="refPoints">
                        <option value="Próximo à escola municipal" />
                        <option value="Frente ao mercado principal" />
                        <option value="Ao lado do posto de saúde" />
                        <option value="Esquina com rua principal" />
                        <option value="Condomínio Fechado" />
                    </datalist>
                </div>
                
                <div className="h-px bg-navy-800 my-2"></div>

                {/* --- NEW FIELDS ROW --- */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative" ref={utilityWrapperRef}>
                    <label className="block text-sm text-slate-400 mb-1">Concessionária</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="utilityCompany" 
                        value={formData.utilityCompany} 
                        onChange={(e) => {
                          handleInputChange(e);
                          setShowUtilitySuggestions(true);
                        }}
                        onFocus={() => setShowUtilitySuggestions(true)}
                        placeholder="Ex: CEEE, RGE, CPFL"
                        className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                        autoComplete="off"
                      />
                      <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    
                    {/* Custom Autocomplete Dropdown */}
                    {showUtilitySuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-navy-900 border border-navy-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredUtilities.length > 0 ? (
                          filteredUtilities.map((company, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectUtility(company)}
                              className="w-full text-left px-4 py-2.5 hover:bg-navy-800 text-sm text-slate-300 hover:text-white transition-colors border-b border-navy-800/50 last:border-0"
                            >
                              {company}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 italic">
                            Nenhuma concessionária encontrada. Pressione Enter para usar "{formData.utilityCompany}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">UC (Unidade Consumidora)</label>
                    <input 
                      type="text" 
                      name="uc" 
                      value={formData.uc} 
                      onChange={handleInputChange}
                      placeholder="Nº da Instalação"
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Disjuntor do Padrão</label>
                    <select 
                      name="mainBreaker" 
                      value={formData.mainBreaker} 
                      onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    >
                      <option value="">Selecione</option>
                      <option value="30A">30A</option>
                      <option value="40A">40A</option>
                      <option value="50A">50A</option>
                      <option value="63A">63A</option>
                      <option value="70A">70A</option>
                      <option value="80A">80A</option>
                      <option value="100A">100A</option>
                      <option value="125A">125A</option>
                      <option value="150A">150A</option>
                      <option value="200A">200A</option>
                    </select>
                  </div>
                </div>
                
                {/* --- TECHNICAL SPECS ROW (With Auto Calculation) --- */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Conexão</label>
                    <select 
                      name="connectionType" value={formData.connectionType} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    >
                      <option>Monofásico</option>
                      <option>Bifásico</option>
                      <option>Trifásico</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm text-slate-400 mb-1">Tensão</label>
                    <select 
                      name="voltage" value={formData.voltage} onChange={handleInputChange}
                      className="w-full bg-navy-950 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                    >
                      <option>127V</option>
                      <option>220V</option>
                      <option>380V</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Consumo (kWh)</label>
                    <input 
                      type="number" name="consumption" value={formData.consumption} onChange={handleInputChange}
                      className={inputClass('consumption')}
                    />
                    {errors.consumption && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.consumption}</span>}
                  </div>
                  
                  {/* Calculated Field */}
                  <div>
                    <label className="block text-sm text-solar-green mb-1 flex items-center gap-1">
                      <Calculator size={14} /> Pot. Disponibilizada
                    </label>
                    <div className="w-full bg-navy-900/50 border border-solar-green/30 rounded-xl py-2.5 px-4 text-solar-green font-mono font-bold flex items-center justify-between">
                      <span>{formData.availablePower || '0.00'}</span>
                      <span className="text-xs opacity-70">kW</span>
                    </div>
                  </div>

                  {/* Installed Power Field */}
                  <div>
                    <label className="block text-sm text-solar-yellow mb-1 flex items-center gap-1">
                      <Zap size={14} /> Pot. Instalada (kWp)
                    </label>
                    <input
                      type="number"
                      name="installedPower"
                      value={formData.installedPower || ''}
                      onChange={handleInputChange}
                      className={`${inputClass('installedPower')} font-bold text-white`}
                    />
                    {errors.installedPower && <span className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.installedPower}</span>}
                  </div>
                </div>
              </div>

              {/* MAP VIEW & COORDINATES */}
              <div className="bg-navy-950 rounded-xl border border-navy-800 overflow-hidden flex flex-col relative min-h-[350px] transition-all">
                 {mapCoordinates ? (
                    <>
                        <iframe 
                            title="Location Map"
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            // Allow interactive map but suppress default heavy scroll hijacking if needed
                            className={`flex-1 transition-opacity duration-300 ${mapLoading ? 'opacity-40' : 'opacity-90 hover:opacity-100'}`}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoordinates.lng - 0.005},${mapCoordinates.lat - 0.005},${mapCoordinates.lng + 0.005},${mapCoordinates.lat + 0.005}&layer=mapnik&marker=${mapCoordinates.lat},${mapCoordinates.lng}`}
                        ></iframe>
                        
                        {/* Loading Overlay */}
                        {mapLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-navy-950/50 backdrop-blur-sm animate-fade-in">
                            <div className="bg-navy-900/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-solar-blue border border-solar-blue/30">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-xs font-medium uppercase tracking-wider">Atualizando Localização...</span>
                            </div>
                          </div>
                        )}

                        {/* Google Coordinates Badge - Top Right */}
                        <div className="absolute top-4 right-4 z-10">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:bg-white/20 cursor-pointer group" title="Copiar para Google Maps">
                                <div className="bg-blue-500 p-1 rounded-full">
                                     <Globe size={12} className="text-white" />
                                </div>
                                <span className="font-mono font-medium text-xs">
                                    {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Technical HUD Overlay for UTM */}
                        <div className="absolute bottom-4 left-4 bg-navy-900/95 backdrop-blur-md border border-navy-700 p-4 rounded-xl shadow-2xl z-10 text-xs font-mono min-w-[280px]">
                            <div className="flex items-center gap-2 mb-3 text-solar-blue font-bold uppercase tracking-wider border-b border-navy-700 pb-2">
                                <Crosshair size={14} /> COORDENADAS UTM
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 w-24">Zona:</span>
                                    <div className="bg-navy-950 border border-navy-800 rounded px-2 py-1 text-white font-medium flex-1 text-right">
                                        {utmCoords.zone} {utmCoords.band}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 w-24">Longitude UTM:</span>
                                    <div className="bg-navy-950 border border-navy-800 rounded px-2 py-1 text-white font-medium flex-1 text-right">
                                        {utmCoords.easting.toFixed(2)} m E
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 w-24">Latitude UTM:</span>
                                    <div className="bg-navy-950 border border-navy-800 rounded px-2 py-1 text-white font-medium flex-1 text-right">
                                        {utmCoords.northing.toFixed(2)} m {mapCoordinates?.lat < 0 ? 'S' : 'N'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-6">
                        {mapLoading ? (
                             <div className="flex flex-col items-center gap-3 animate-pulse">
                                <Loader2 size={48} className="text-solar-blue animate-spin" />
                                <p>Buscando localização...</p>
                             </div>
                        ) : (
                            <>
                              <MapPin size={48} className="opacity-20" />
                              <p className="text-center max-w-xs">
                                  O mapa se ajustará automaticamente ao endereço inserido.
                              </p>
                              <div className="text-xs font-mono bg-navy-900 px-3 py-1 rounded text-slate-600">
                                  Aguardando dados...
                              </div>
                            </>
                        )}
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* 3. Documentos Iniciais */}
          {activeStep === 'doc_iniciais' && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4">Documentação do Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FileUploadBox label="RG ou CNH (Frente)" checked={true} />
                <FileUploadBox label="RG ou CNH (Verso)" checked={true} />
                <FileUploadBox label="Comprovante Residência" checked={false} />
                <FileUploadBox label="Cartão CNPJ (se PJ)" checked={false} />
                <FileUploadBox label="Contrato Social (se PJ)" checked={false} />
                <FileUploadBox label="Outros Documentos" checked={false} />
              </div>
            </div>
          )}

          {/* 4. Documentos Concessionária */}
          {activeStep === 'doc_concessionaria' && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-4">Homologação na Concessionária</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <FileUploadBox label="Conta de Energia (Recente)" checked={true} />
                <FileUploadBox label="Procuração Assinada" checked={false} />
                <FileUploadBox label="Formulário de Solicitação" checked={false} />
                <FileUploadBox label="Diagrama Unifilar" checked={false} />
                <FileUploadBox label="ART / TRT" checked={false} />
                <FileUploadBox label="Fotos do Padrão" checked={false} />
                <FileUploadBox label="Outros Documentos" checked={false} />
              </div>
            </div>
          )}

          {/* 5. Projetos & Proposta */}
          {activeStep === 'projetos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in h-full">
              <div className="flex flex-col gap-6">
                <div className="bg-navy-950 border border-navy-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <HardDrive size={20} className="text-solar-blue" /> Dados do Projeto
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Status do Projeto</label>
                      <select 
                        name="projectStatus" value={formData.projectStatus} onChange={handleInputChange}
                        className="w-full bg-navy-900 border border-navy-700 rounded-xl py-2.5 px-4 text-white focus:border-solar-blue outline-none"
                      >
                        <option>Lead / Contato Inicial</option>
                        <option>Vistoria Técnica Agendada</option>
                        <option>Em Análise de Viabilidade</option>
                        <option>Proposta Gerada</option>
                        <option>Aguardando Assinatura</option>
                        <option>Projeto em Execução</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-navy-900 rounded-lg border border-navy-700">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Resumo Técnico</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-slate-500">Consumo:</span>
                        <span className="text-white text-right">{formData.consumption || 0} kWh</span>
                        <span className="text-slate-500">Cidade:</span>
                        <span className="text-white text-right">{formData.city || '-'}</span>
                        <span className="text-slate-500">Tipo:</span>
                        <span className="text-white text-right">{formData.connectionType}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateProposal}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <span className="animate-pulse">Gerando Inteligência...</span>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Gerar Proposta com IA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className={`w-full py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                    savedMessage 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-solar-blue hover:bg-blue-500 text-white'
                  }`}
                >
                  {savedMessage ? (
                    <>
                      <CheckCircle size={20} />
                      {savedMessage}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Salvar Todos os Dados
                    </>
                  )}
                </button>
              </div>

              {/* AI Preview Column */}
              <div className="bg-navy-950 border border-navy-800 rounded-xl p-1 flex flex-col h-full min-h-[500px]">
                <div className="p-4 border-b border-navy-800 flex justify-between items-center">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="text-purple-500" size={18} /> 
                    Proposta Gerada
                  </h3>
                  {generatedProposal && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Gerado via Gemini</span>
                  )}
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-navy-900/50 rounded-b-xl">
                  {generatedProposal ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed">
                        {generatedProposal}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 p-8 text-center">
                      <Sparkles size={48} className="mb-4 animate-pulse" />
                      <p className="font-medium mb-2">Assistente de Vendas IA</p>
                      <p className="text-sm">Clique em "Gerar Proposta" para criar um documento comercial personalizado. Nenhum campo é obrigatório.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};