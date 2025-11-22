export enum Tab {
  NEW_CLIENT = 'NEW_CLIENT',
  CLIENT_LIST = 'CLIENT_LIST',
  FINANCIAL = 'FINANCIAL',
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj?: string;
  avgConsumption: number; // kWh
  status: 'Lead' | 'Proposta Enviada' | 'Fechado';
  installationAddress: string;
  city: string;
  state: string;
  zipCode?: string;
  connectionType?: 'Monofásico' | 'Bifásico' | 'Trifásico';
}

export interface FinancialRecord {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProposalData {
  systemSize: number; // kWp
  panels: number;
  estimatedSavings: number; // R$ per year
  co2Saved: number; // tons
  paybackPeriod: string;
}

export interface ClientFormData {
  // Pessoais
  name: string;
  clientStatus: string; // NOVA
  email: string;
  phone: string;
  cpfCnpj: string;
  birthDate: string;
  idDocType: string;
  idDocNumber: string;
  
  // Instalação
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  referencePoint?: string; // Made optional to match usage
  
  // Dados Técnicos Instalação
  uc: string;
  utilityCompany: string;
  mainBreaker: string;
  availablePower?: string;
  installedPower?: string;
  
  consumption: number | string; 
  connectionType: string;
  voltage: string;

  // Docs (Tracking status for UI mostly)
  docPersonal: boolean;
  docAddress: boolean;
  docBill: boolean;
  docProxy: boolean;
  
  // Projeto
  projectStatus: string;
}