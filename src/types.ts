
export enum QuoteType {
  PRICELIST = 'Da Prezziario',
  COMPONENTS = 'Componentistica',
  ASSET_SOFTWARE = 'Software & XaaS',
  NEW_DEV = 'Sviluppo Ex-Novo'
}

export enum QuoteStatus {
  DRAFT = 'Bozza',
  PENDING_TECHNICAL = 'Approvazione Tecnica',
  PENDING_COMMERCIAL = 'Approvazione Commerciale',
  READY_FOR_BACKOFFICE = 'Pronto per Backoffice',
  SENT = 'Inviato',
  WON = 'Vinto',
  LOST = 'Perso',
  ORDERED = 'Ordinato'
}

export enum UserRole {
  SALES_MANAGER = 'Responsabile Commerciale',
  PRODUCTION_DIR = 'Direttore Produzione',
  TECH_DIR = 'Direttore Tecnico',
  BACK_OFFICE = 'Back-office'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface LineItem {
  id: string;
  name: string;
  category: 'Materiale' | 'Manodopera' | 'Trasferta' | 'Licenza' | 'Servizio' | 'Fase Progetto' | 'Canone XaaS' | 'Manutenzione';
  unitCost: number;
  unitPrice: number; 
  quantity: number;
  description?: string;
  
  // Dynamic fields for different Quote Types
  markupPercent?: number; // Used in Components & Dev
  hours?: number;        // Used in Dev & Services
  licenseType?: string;  // Used in Software
  isFixedPrice?: boolean; // True for Pricelist items
  
  // New: Recurring Billing Logic
  billingFrequency?: 'one-off' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'; 
}

export type DealOrigin = 'push' | 'pull';

export interface Quote {
  id: string;
  title: string;
  customerName: string;
  origin: DealOrigin; // New field
  type: QuoteType;
  status: QuoteStatus;
  items: LineItem[];
  totalCost: number;
  totalPrice: number;
  totalRecurring?: number;
  marginPercent: number;
  createdAt: string;
  description: string; 
  
  // New Fields for Archive Management
  version: number;
  parentQuoteId?: string;
  validUntil?: string;
  
  // Operational Fields
  deliveryDate?: string;
  paymentTerms?: string;
}

export interface CustomerPrice {
  customerId: string;
  customerName: string;
  price: number;
  customerCode?: string;
}

export interface PriceListItem {
  id: string;
  code: string;
  name: string;
  cost: number;
  suggestedPrice: number;
  category: string;
  customerName?: string; // DEPRECATED: Keep for backwards compatibility, use customerPrices instead
  customerPrices?: CustomerPrice[]; // Array of specific prices for different customers
  sourceId?: string;
  sourceType?: 'resource' | 'kit';
}

// --- RESOURCE MANAGEMENT TYPES ---

export interface BaseResource {
  id: string;
  idStr: string; // Codice visuale (es. MAN-01)
  name: string;
  category: 'Manodopera' | 'Materiale' | 'Trasferta';
  unitCost: number;
  unitMeasure: string; // h, pz, km, body
  updatedAt?: string;
}

export interface ComponentItem {
  resourceId: string;
  quantity: number;
}

export interface CompositeComponent {
  id: string;
  name: string;
  description: string;
  subItems: ComponentItem[]; // References BaseResource
  markupPercent: number;
  updatedAt?: string;
}

export interface SoftwareAsset {
  id: string;
  name: string;
  licenseCost: number; // Costo base riferimento
  licenseType: 'Una Tantum' | 'Annuale' | 'Mensile'; // Default suggestion
  setupHours: number; // Ore stimate setup
  trainingHours: number; // Ore stimate formazione
}

export interface CustomerPricelist {
  id: string;
  customerName: string;
  validFrom: string;
  itemsCount: number;
  lastUpdated: string;
}
