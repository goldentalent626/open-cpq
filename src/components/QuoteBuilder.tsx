
import React, { useState, useEffect } from 'react';
import { Quote, QuoteType, QuoteStatus, LineItem, PriceListItem, CompositeComponent, SoftwareAsset, BaseResource, DealOrigin } from '../types';
import { fetchResources, fetchComponents, fetchSoftwareAssets, fetchPricelistItems } from '../services/api';
import { Trash2, Plus, Save, Search, Box, Code, Disc, FileText, Hammer, Loader2, AlignLeft, Truck, ShieldCheck, Briefcase, RefreshCw, Cloud, Zap, Layers, Server, Settings, CheckCircle2, Lightbulb, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useSettings } from '../contexts/SettingsContext';

interface QuoteBuilderProps {
  initialQuote?: Quote | null;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ initialQuote, onSave, onCancel }) => {
  const [quoteType, setQuoteType] = useState<QuoteType>(initialQuote?.type || QuoteType.PRICELIST);
  const [origin, setOrigin] = useState<DealOrigin>(initialQuote?.origin || 'push');
  const [customer, setCustomer] = useState(initialQuote?.customerName || '');
  const { settings } = useSettings();
  const [title, setTitle] = useState(initialQuote?.title || '');
  const [deliveryDate, setDeliveryDate] = useState(initialQuote?.deliveryDate || '');
  const [paymentTerms, setPaymentTerms] = useState(initialQuote?.paymentTerms || '');
  const [items, setItems] = useState<LineItem[]>(initialQuote?.items || []);
  const [searchTerm, setSearchTerm] = useState('');

  // --- NEW DEV ITEM STATE ---
  const [devItemTitle, setDevItemTitle] = useState('');
  const [devItemDesc, setDevItemDesc] = useState('');
  const [devItemHours, setDevItemHours] = useState<number>(0);
  const [devItemRate, setDevItemRate] = useState<number>(50); 

  // --- COMPONENTS MODE STATE ---
  const [selectedLaborId, setSelectedLaborId] = useState('');
  const [selectedTravelId, setSelectedTravelId] = useState('');

  // --- SOFTWARE / XaaS CONFIGURATOR STATE ---
  const [selectedAsset, setSelectedAsset] = useState<SoftwareAsset | null>(null);
  const [saleModel, setSaleModel] = useState<'perpetual' | 'saas' | 'xaas'>('perpetual');
  const [billingFreq, setBillingFreq] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual'>('annual');
  const [includeMaintenance, setIncludeMaintenance] = useState(true);
  const [maintenancePercent, setMaintenancePercent] = useState(18); // Default 18%
  const [xaasExtraServices, setXaasExtraServices] = useState('');

  // Data Loading State
  const [loadingData, setLoadingData] = useState(false);
  const [resources, setResources] = useState<BaseResource[]>([]);
  const [pricelistItems, setPricelistItems] = useState<PriceListItem[]>([]);
  const [components, setComponents] = useState<CompositeComponent[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);

  // Fetch Data on Mount
  useEffect(() => {
    const initData = async () => {
        setLoadingData(true);
        try {
            const [res, pl, comps, soft] = await Promise.all([
                fetchResources(),
                fetchPricelistItems(),
                fetchComponents(),
                fetchSoftwareAssets()
            ]);
            setResources(res);
            setPricelistItems(pl);
            setComponents(comps);
            setSoftwareAssets(soft);
        } catch (e) {
            console.error("Failed to load builder data", e);
        } finally {
            setLoadingData(false);
        }
    };
    initData();
  }, []);

  // Reset items when type changes
  useEffect(() => {
    setSearchTerm('');
    setSelectedAsset(null);
  }, [quoteType]);

  // Real-time calculations
  const totalCost = items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  
  // Calculate Totals by Frequency
  const itemsOneOff = items.filter(i => i.billingFrequency === 'one-off' || !i.billingFrequency);
  const itemsMonthly = items.filter(i => i.billingFrequency === 'monthly');
  const itemsQuarterly = items.filter(i => i.billingFrequency === 'quarterly');
  const itemsSemi = items.filter(i => i.billingFrequency === 'semiannual');
  const itemsAnnual = items.filter(i => i.billingFrequency === 'annual');

  const sumTotal = (list: LineItem[]) => list.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

  const totalPriceOneOff = sumTotal(itemsOneOff);
  const totalMonthly = sumTotal(itemsMonthly);
  const totalQuarterly = sumTotal(itemsQuarterly);
  const totalSemi = sumTotal(itemsSemi);
  const totalAnnual = sumTotal(itemsAnnual);
  
  // Normalized Total Price for Margin Calculation (OneOff + 1 Year of Recurring)
  const normalizedTotalPrice = totalPriceOneOff + 
                               (totalMonthly * 12) + 
                               (totalQuarterly * 4) + 
                               (totalSemi * 2) + 
                               totalAnnual;

  const totalRecurring = (totalMonthly * 12) + (totalQuarterly * 4) + (totalSemi * 2) + totalAnnual;

  const margin = normalizedTotalPrice !== 0 ? ((normalizedTotalPrice - totalCost) / normalizedTotalPrice) * 100 : 0;

  // Filtered Resources Helpers
  const laborResources = resources.filter(r => r.category === 'Manodopera');
  const travelResources = resources.filter(r => r.category === 'Trasferta');

  // --- LOGIC: ADDERS ---

  const addPriceListItem = (pItem: PriceListItem) => {
     const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: pItem.name,
      category: pItem.category as LineItem['category'],
      unitCost: pItem.cost,
      unitPrice: pItem.suggestedPrice, 
      quantity: 1,
      isFixedPrice: true,
      billingFrequency: 'one-off'
    };
    setItems([...items, newItem]);
  };

  const addComponentItem = (comp: CompositeComponent) => {
    const baseCost = comp.subItems.reduce((acc, sub) => {
        const res = resources.find(r => r.id === sub.resourceId);
        return acc + (res ? res.unitCost * sub.quantity : 0);
    }, 0);

    const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: comp.name,
      category: 'Materiale',
      unitCost: baseCost,
      markupPercent: comp.markupPercent,
      unitPrice: baseCost * (1 + comp.markupPercent / 100),
      quantity: 1,
      description: comp.description,
      billingFrequency: 'one-off'
    };
    setItems([...items, newItem]);
  };

  const addResourceItem = (resourceId: string) => {
      const res = resources.find(r => r.id === resourceId);
      if (!res) return;
      const defaultMarkup = 30; 

      const newItem: LineItem = {
          id: crypto.randomUUID(),
          name: res.name,
          category: res.category,
          unitCost: res.unitCost,
          markupPercent: defaultMarkup,
          unitPrice: res.unitCost * (1 + defaultMarkup / 100),
          quantity: 1,
          description: `Unità: ${res.unitMeasure}`,
          billingFrequency: 'one-off'
      };
      setItems([...items, newItem]);
  };

  const addSafetyCharges = () => {
      const newItem: LineItem = {
          id: crypto.randomUUID(),
          name: 'Oneri di Sicurezza',
          category: 'Servizio',
          unitCost: 0, 
          unitPrice: 150, 
          quantity: 1,
          description: 'Oneri per l\'attuazione dei piani di sicurezza (non soggetti a ribasso)',
          markupPercent: 0,
          billingFrequency: 'one-off'
      };
      setItems([...items, newItem]);
  };

  // --- SOFTWARE / XaaS LOGIC (NEW) ---

  const handleAddSoftwareConfig = () => {
      if (!selectedAsset) return;

      const newItems: LineItem[] = [];

      // 1. Core Asset
      if (saleModel === 'perpetual') {
          // -- PERPETUAL LICENSE --
          newItems.push({
              id: crypto.randomUUID(),
              name: `Licenza d'uso: ${selectedAsset.name}`,
              category: 'Licenza',
              unitCost: selectedAsset.licenseCost * 0.7, // Costo simulato
              unitPrice: selectedAsset.licenseCost,
              quantity: 1,
              billingFrequency: 'one-off',
              description: 'Licenza Perpetua On-Premise / Private Cloud'
          });

          // Maintenance (Calculated % of License)
          if (includeMaintenance) {
             const maintPrice = selectedAsset.licenseCost * (maintenancePercent / 100);
             newItems.push({
                  id: crypto.randomUUID(),
                  name: `Canone Manutenzione Software: ${selectedAsset.name}`,
                  category: 'Manutenzione',
                  unitCost: maintPrice * 0.5,
                  unitPrice: maintPrice,
                  quantity: 1,
                  billingFrequency: 'annual', // Maintenance is usually annual
                  description: `Aggiornamenti e bugfix (${maintenancePercent}% del valore licenza)`
             });
          }

      } else {
          // -- SAAS / XAAS --
          // Base Price: Se DB ha prezzo annuo/mensile usiamo quello, altrimenti stimiamo da licenza / X
          let baseRecurringPrice = selectedAsset.licenseCost; 
          // Logica semplificata: se il DB ha "Una Tantum", dividiamo per 24 mesi per trovare un canone mensile teorico
          if (selectedAsset.licenseType === 'Una Tantum') baseRecurringPrice = selectedAsset.licenseCost / 24;
          
          // Adjust for Billing Frequency
          let adjustedPrice = baseRecurringPrice; // Assumiamo base = mensile
          if (billingFreq === 'quarterly') adjustedPrice *= 3;
          if (billingFreq === 'semiannual') adjustedPrice *= 6;
          if (billingFreq === 'annual') adjustedPrice *= 12;

          // XaaS Multiplier (Managed Service wrapper)
          let description = `Abbonamento ${billingFreq === 'monthly' ? 'Mensile' : billingFreq === 'annual' ? 'Annuale' : billingFreq}`;
          let category: LineItem['category'] = 'Licenza';
          
          if (saleModel === 'xaas') {
              adjustedPrice = adjustedPrice * 1.5; // XaaS premium
              category = 'Canone XaaS';
              description += ' - Include: Gestione infrastruttura, update, supporto prioritario.';
              if (xaasExtraServices) description += ` Note: ${xaasExtraServices}`;
          }

          newItems.push({
              id: crypto.randomUUID(),
              name: `${saleModel === 'xaas' ? 'XaaS Bundle' : 'SaaS Subscription'}: ${selectedAsset.name}`,
              category: category,
              unitCost: adjustedPrice * 0.4, 
              unitPrice: adjustedPrice,
              quantity: 1,
              billingFrequency: billingFreq,
              description: description
          });
      }

      // 2. Setup Services (Always One-Off)
      if (selectedAsset.setupHours > 0) {
          newItems.push({
            id: crypto.randomUUID(),
            name: `Setup & Onboarding: ${selectedAsset.name}`,
            category: 'Servizio',
            unitCost: selectedAsset.setupHours * 40,
            unitPrice: selectedAsset.setupHours * 80,
            quantity: 1,
            billingFrequency: 'one-off',
            description: `Include installazione, configurazione e ${selectedAsset.trainingHours}h formazione.`
          });
      }

      setItems([...items, ...newItems]);
      setSelectedAsset(null); // Reset selection
      setXaasExtraServices('');
  };

  const addCustomDevItem = () => {
      if (!devItemTitle || devItemHours <= 0) return;
      const cost = devItemHours * devItemRate;
      const defaultMarkup = 40;
      const newItem: LineItem = {
          id: crypto.randomUUID(),
          name: devItemTitle,
          description: devItemDesc,
          category: 'Fase Progetto',
          unitCost: cost, 
          unitPrice: cost * (1 + defaultMarkup / 100),
          quantity: 1, 
          hours: devItemHours,
          markupPercent: defaultMarkup,
          billingFrequency: 'one-off'
      };
      setItems([...items, newItem]);
      setDevItemTitle(''); setDevItemDesc(''); setDevItemHours(0);
  };

  // --- UPDATERS ---

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(i => {
        if (i.id !== id) return i;
        let updatedItem = { ...i, [field]: value };

        if (field === 'markupPercent' && typeof value === 'number') {
            updatedItem.unitPrice = updatedItem.unitCost * (1 + value / 100);
        }
        if (field === 'hours' && typeof value === 'number') {
            const oldHours = i.hours || 1;
            const rate = oldHours > 0 ? i.unitCost / oldHours : 0; 
            updatedItem.unitCost = value * rate;
            const markup = updatedItem.markupPercent || 0;
            updatedItem.unitPrice = updatedItem.unitCost * (1 + markup / 100);
        }
        return updatedItem;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = () => {
    const newQuote: Quote = {
      id: initialQuote?.id || `Q-${Date.now()}`,
      title, 
      customerName: customer, 
      type: quoteType, 
      status: initialQuote?.status || QuoteStatus.DRAFT,
      origin,
      items, 
      totalCost, 
      totalPrice: normalizedTotalPrice, 
      totalRecurring,
      marginPercent: margin, 
      createdAt: initialQuote?.createdAt || new Date().toISOString(),
      description: initialQuote?.description || '', 
      version: initialQuote ? initialQuote.version + 1 : 1,
      parentQuoteId: initialQuote?.parentQuoteId,
      deliveryDate,
      paymentTerms
    };
    onSave(newQuote);
  };

  // --- RENDERERS ---

  const renderPricelistSelector = () => {
      // Filter logic:
      // 1. Search term matches code or name
      // 2. AND (Item has NO customer specific name OR Item customer matches current customer input)
      const filteredItems = pricelistItems.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCustomer = !p.customerName || (customer && p.customerName.toLowerCase().includes(customer.toLowerCase()));
          return matchesSearch && matchesCustomer;
      });

      return (
      <div className="space-y-4 animate-fade-in">
          {customer && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600"/>
                  <span className="text-sm text-blue-800">Filtrando listino per cliente: <strong>{customer}</strong></span>
              </div>
          )}
          <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                  type="text" 
                  placeholder="Cerca per codice o descrizione..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-cyan/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="p-3">Codice</th>
                          <th className="p-3">Descrizione</th>
                          <th className="p-3 text-right">Prezzo</th>
                          <th className="p-3 text-center">Azioni</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredItems.map(p => (
                          <tr key={p.id} className={`hover:bg-blue-50/50 ${p.customerName ? 'bg-blue-50/30' : ''}`}>
                              <td className="p-3 font-mono text-xs text-gray-500">
                                  {p.code}
                                  {p.customerName && <div className="mt-1"><Badge variant="info">{p.customerName}</Badge></div>}
                              </td>
                              <td className="p-3 font-medium text-gray-800">{p.name}</td>
                              <td className="p-3 text-right font-bold text-midnight">€ {p.suggestedPrice}</td>
                              <td className="p-3 text-center">
                                  <Button size="sm" variant="ghost" icon={Plus} onClick={() => addPriceListItem(p)} />
                              </td>
                          </tr>
                      ))}
                      {filteredItems.length === 0 && (
                          <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nessuna voce trovata per questo cliente.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      );
  };

  const renderComponentBuilder = () => (
      <div className="space-y-6 animate-fade-in pb-10">
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-midnight flex items-center gap-2">
                <Box size={18} className="text-cyan"/> Libreria Kit & Materiali
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map(comp => (
                    <div key={comp.id} 
                        className="border border-gray-200 rounded-xl p-3 hover:border-cyan hover:shadow-md cursor-pointer transition-all bg-white"
                        onClick={() => addComponentItem(comp)}>
                        <div className="flex justify-between items-start mb-1">
                            <Badge variant="info">Kit</Badge>
                            <span className="text-xs font-mono text-gray-400">Markup: {comp.markupPercent}%</span>
                        </div>
                        <h4 className="font-bold text-midnight text-sm">{comp.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{comp.description}</p>
                        <div className="mt-2 text-xs font-semibold text-cyan flex items-center gap-1">
                            <Plus size={12} /> Aggiungi
                        </div>
                    </div>
                ))}
            </div>
          </div>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                  <h4 className="text-sm font-bold text-midnight flex items-center gap-2">
                    <Briefcase size={18} className="text-blue-500"/> Manodopera
                  </h4>
                  <div className="flex gap-2">
                      <Select fullWidth value={selectedLaborId} onChange={(e) => setSelectedLaborId(e.target.value)} className="text-sm">
                          <option value="">Seleziona Profilo...</option>
                          {laborResources.map(r => (
                              <option key={r.id} value={r.id}>{r.name} (€{r.unitCost}/{r.unitMeasure})</option>
                          ))}
                      </Select>
                      <Button disabled={!selectedLaborId} onClick={() => { addResourceItem(selectedLaborId); setSelectedLaborId(''); }} icon={Plus} size="sm"/>
                  </div>
              </div>
              <div className="space-y-3">
                  <h4 className="text-sm font-bold text-midnight flex items-center gap-2">
                    <Truck size={18} className="text-orange-500"/> Trasferta
                  </h4>
                  <div className="flex gap-2">
                      <Select fullWidth value={selectedTravelId} onChange={(e) => setSelectedTravelId(e.target.value)} className="text-sm">
                          <option value="">Seleziona Zona...</option>
                          {travelResources.map(r => (
                              <option key={r.id} value={r.id}>{r.name} (€{r.unitCost}/{r.unitMeasure})</option>
                          ))}
                      </Select>
                      <Button disabled={!selectedTravelId} onClick={() => { addResourceItem(selectedTravelId); setSelectedTravelId(''); }} icon={Plus} size="sm"/>
                  </div>
              </div>
          </div>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-midnight flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600"/> Oneri Accessori
            </h4>
            <div className="flex gap-3">
                <Button variant="outline" className="w-full justify-start border-dashed border-gray-400 hover:border-green-500 hover:text-green-600 hover:bg-green-50" icon={Plus} onClick={addSafetyCharges}>
                    Aggiungi Oneri di Sicurezza
                </Button>
            </div>
          </div>
      </div>
  );

  const renderSoftwareConfigurator = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full animate-fade-in">
          
          {/* Column 1: Asset Selection */}
          <div className="space-y-4 overflow-y-auto pr-2">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Cloud size={18} className="text-cyan"/> 1. Seleziona Software
              </h4>
              <div className="space-y-3">
                {softwareAssets.map(sw => (
                    <div 
                        key={sw.id} 
                        onClick={() => setSelectedAsset(sw)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                            selectedAsset?.id === sw.id 
                            ? 'bg-cyan/5 border-cyan shadow-md' 
                            : 'bg-white border-gray-200 hover:border-cyan/50'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                             <h4 className={`font-bold ${selectedAsset?.id === sw.id ? 'text-cyan' : 'text-gray-800'}`}>
                                {sw.name}
                             </h4>
                             {selectedAsset?.id === sw.id && <CheckCircle2 size={18} className="text-cyan"/>}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Base: € {sw.licenseCost}</p>
                        <div className="flex gap-2">
                            <Badge variant="neutral">{sw.licenseType}</Badge>
                        </div>
                    </div>
                ))}
              </div>
          </div>

          {/* Column 2: Configuration Panel */}
          <div className="border-l border-gray-200 pl-6 h-full flex flex-col">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                  <Settings size={18} className="text-orange-500"/> 2. Configura Modello Vendita
              </h4>

              {selectedAsset ? (
                  <Card noPadding className="flex-1 flex flex-col bg-gray-50/50">
                      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                          
                          {/* Modello Vendita */}
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Modello di Distribuzione</label>
                              <div className="grid grid-cols-1 gap-2">
                                  <button 
                                    onClick={() => setSaleModel('perpetual')}
                                    className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-3 ${saleModel === 'perpetual' ? 'bg-white border-cyan text-cyan ring-1 ring-cyan' : 'bg-white border-gray-200 text-gray-600'}`}
                                  >
                                      <Server size={18}/>
                                      <div>
                                        <span className="font-bold block">Licenza On-Premise (Perpetual)</span>
                                        <span className="text-xs opacity-70">Vendita una tantum + Manutenzione opzionale</span>
                                      </div>
                                  </button>
                                  <button 
                                    onClick={() => setSaleModel('saas')}
                                    className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-3 ${saleModel === 'saas' ? 'bg-white border-purple-500 text-purple-600 ring-1 ring-purple-500' : 'bg-white border-gray-200 text-gray-600'}`}
                                  >
                                      <Cloud size={18}/>
                                      <div>
                                        <span className="font-bold block">SaaS / Cloud Subscription</span>
                                        <span className="text-xs opacity-70">Accesso ricorrente alla piattaforma</span>
                                      </div>
                                  </button>
                                  <button 
                                    onClick={() => setSaleModel('xaas')}
                                    className={`p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-3 ${saleModel === 'xaas' ? 'bg-white border-orange-500 text-orange-600 ring-1 ring-orange-500' : 'bg-white border-gray-200 text-gray-600'}`}
                                  >
                                      <Layers size={18}/>
                                      <div>
                                        <span className="font-bold block">XaaS (Managed Service)</span>
                                        <span className="text-xs opacity-70">Software + Servizi Gestiti inclusi</span>
                                      </div>
                                  </button>
                              </div>
                          </div>

                          {/* Parametri in base al modello */}
                          {saleModel === 'perpetual' ? (
                              <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium">Includi Manutenzione?</label>
                                      <input 
                                        type="checkbox" 
                                        checked={includeMaintenance} 
                                        onChange={(e) => setIncludeMaintenance(e.target.checked)}
                                        className="h-5 w-5 text-cyan rounded focus:ring-cyan"
                                      />
                                  </div>
                                  {includeMaintenance && (
                                      <div className="flex items-center gap-2">
                                          <Input 
                                            label="% Costo Licenza" 
                                            type="number" 
                                            className="w-24"
                                            value={maintenancePercent}
                                            onChange={(e) => setMaintenancePercent(parseFloat(e.target.value))}
                                          />
                                          <p className="text-xs text-gray-500 mt-6">Canone annuo calcolato automaticamente.</p>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                                  <Select 
                                    label="Frequenza Fatturazione" 
                                    value={billingFreq} 
                                    onChange={(e) => setBillingFreq(e.target.value as any)}
                                  >
                                      <option value="monthly">Mensile</option>
                                      <option value="quarterly">Trimestrale (x3)</option>
                                      <option value="semiannual">Semestrale (x6)</option>
                                      <option value="annual">Annuale (x12)</option>
                                  </Select>

                                  {saleModel === 'xaas' && (
                                      <Input 
                                        label="Descrizione Servizi Gestiti Extra"
                                        placeholder="Es. Monitoraggio proattivo, 10h supporto..."
                                        value={xaasExtraServices}
                                        onChange={(e) => setXaasExtraServices(e.target.value)}
                                      />
                                  )}
                              </div>
                          )}

                          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                              Nota: Verrà aggiunta automaticamente una voce "Una Tantum" per il Setup ({selectedAsset.setupHours}h).
                          </div>
                      </div>
                      
                      <div className="p-4 border-t border-gray-100 bg-white">
                          <Button fullWidth onClick={handleAddSoftwareConfig} icon={Plus}>
                              Aggiungi al Preventivo
                          </Button>
                      </div>
                  </Card>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                      <Cloud size={40} className="mb-3 opacity-20"/>
                      <p className="text-sm text-center px-6">Seleziona un software dalla lista a sinistra per configurarne l'offerta.</p>
                  </div>
              )}
          </div>
      </div>
  );

  const renderProjectEstimator = () => {
    return (
      <div className="space-y-4 animate-fade-in">
          <Card className="border-cyan/30 shadow-sm" title="Nuova Funzionalità / Task">
              <div className="space-y-4">
                  <Input 
                    label="Titolo Attività" 
                    placeholder="Es. Sviluppo Modulo Integrazione API"
                    value={devItemTitle}
                    onChange={(e) => setDevItemTitle(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        <AlignLeft size={16}/> Descrizione Tecnica (Rich Text)
                    </label>
                    <textarea 
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan/20 outline-none resize-none"
                        placeholder="Inserisci i dettagli tecnici..."
                        value={devItemDesc}
                        onChange={(e) => setDevItemDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Ore Stimate" type="number" min="0" value={devItemHours} onChange={(e) => setDevItemHours(parseFloat(e.target.value) || 0)} />
                      <Input label="Tariffa Oraria (€/h)" type="number" value={devItemRate} onChange={(e) => setDevItemRate(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="pt-2">
                    <Button onClick={addCustomDevItem} fullWidth disabled={!devItemTitle || devItemHours <= 0} icon={Plus}>Aggiungi al Preventivo</Button>
                  </div>
              </div>
          </Card>
      </div>
    );
  };

  const renderSummaryRow = (item: LineItem) => {
    const iconMap = {
        'Materiale': <Box size={16} className="text-orange-500" />,
        'Manodopera': <Hammer size={16} className="text-blue-500" />,
        'Licenza': <Cloud size={16} className="text-purple-500" />,
        'Canone XaaS': <RefreshCw size={16} className="text-cyan" />,
        'Manutenzione': <RefreshCw size={16} className="text-gray-500" />,
        'Servizio': <ShieldCheck size={16} className="text-green-600" />,
        'Fase Progetto': <Code size={16} className="text-teal-500" />,
        'Trasferta': <Truck size={16} className="text-gray-500" />
    };

    const freqLabels = {
        'one-off': 'Una Tantum',
        'monthly': '/ Mese',
        'quarterly': '/ Trimestre',
        'semiannual': '/ Semestre',
        'annual': '/ Anno'
    };

    return (
        <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 group transition-all hover:border-cyan/50">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {iconMap[item.category] || <FileText size={16} />}
                    <input 
                        className="font-semibold text-sm text-gray-800 bg-transparent border-b border-transparent focus:border-cyan outline-none w-48"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    />
                    {item.billingFrequency && item.billingFrequency !== 'one-off' && (
                        <Badge variant="brand" className="text-[10px]">
                            {freqLabels[item.billingFrequency]}
                        </Badge>
                    )}
                </div>
                <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                </button>
            </div>
            {item.description && (
                <div className="mb-3 pl-6">
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap leading-relaxed">
                        {item.description}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-12 gap-4 items-center mt-2">
                <div className="col-span-3">
                    <label className="text-[10px] text-gray-400 block uppercase tracking-wide">
                        {item.hours !== undefined ? 'Ore' : 'Q.tà'}
                    </label>
                    <input 
                        type="number" 
                        min="0"
                        className="w-full text-sm font-medium border border-gray-200 rounded p-1 focus:ring-1 focus:ring-cyan"
                        value={item.hours !== undefined ? item.hours : item.quantity}
                        onChange={(e) => updateItem(item.id, item.hours !== undefined ? 'hours' : 'quantity', parseFloat(e.target.value))}
                    />
                </div>
                <div className="col-span-4">
                    {item.isFixedPrice ? (
                        <div className="opacity-70">
                            <label className="text-[10px] text-gray-400 block uppercase">Prezzo Listino</label>
                            <span className="text-sm font-medium text-gray-600">€ {item.unitPrice.toFixed(2)}</span>
                        </div>
                    ) : item.markupPercent !== undefined ? (
                        <div>
                            <label className="text-[10px] text-teal block uppercase font-bold">Markup %</label>
                            <input 
                                type="number" 
                                className="w-full text-sm font-bold text-teal border border-teal/20 bg-teal/5 rounded p-1 focus:ring-1 focus:ring-teal"
                                value={item.markupPercent}
                                onChange={(e) => updateItem(item.id, 'markupPercent', parseFloat(e.target.value))}
                            />
                        </div>
                    ) : (
                        <div className="opacity-50">
                            <label className="text-[10px] text-gray-400 block uppercase">Costo Base</label>
                             <span className="text-sm">€ {item.unitCost.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                <div className="col-span-5 text-right">
                    <label className="text-[10px] text-gray-400 block uppercase">Totale Riga</label>
                    <span className="text-base font-bold text-midnight">
                        € {(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <div className="text-[10px] text-gray-400">
                        {item.billingFrequency ? freqLabels[item.billingFrequency] : 'Una Tantum'}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <Card 
      className="h-[calc(100vh-100px)] flex flex-col" 
      noPadding 
      title="Wizard Creazione Offerta"
      subtitle={`Modalità: ${quoteType}`}
      action={
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} size="sm">Annulla</Button>
            <Button variant="primary" icon={Save} onClick={handleSave} size="sm">Salva Offerta</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full overflow-hidden">
        <div className="lg:col-span-7 overflow-y-auto p-6 space-y-6 border-r border-gray-200 bg-gray-50/50">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                {/* Origin Selector */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div 
                        onClick={() => setOrigin('push')}
                        className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all ${origin === 'push' ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'bg-white border-gray-200 hover:border-orange-300'}`}
                    >
                        <div className={`p-2 rounded-full ${origin === 'push' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Lightbulb size={20} />
                        </div>
                        <div>
                            <span className={`block text-sm font-bold ${origin === 'push' ? 'text-orange-900' : 'text-gray-600'}`}>Proattivo (Push)</span>
                            <span className="text-xs text-gray-500">Proposta commerciale, idea, bozza veloce.</span>
                        </div>
                    </div>
                    <div 
                        onClick={() => setOrigin('pull')}
                        className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all ${origin === 'pull' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                    >
                        <div className={`p-2 rounded-full ${origin === 'pull' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Mail size={20} />
                        </div>
                        <div>
                            <span className={`block text-sm font-bold ${origin === 'pull' ? 'text-blue-900' : 'text-gray-600'}`}>Richiesta (Pull)</span>
                            <span className="text-xs text-gray-500">Risposta a RFI/RFP, preventivo formale.</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Cliente" placeholder="Nome Azienda" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                    <Input label="Titolo Progetto" placeholder="Es. Migrazione Cloud" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="date" label="Data di Consegna Richiesta" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    <Input label="Termini di Pagamento" placeholder="Es. Bonifico 30gg, Anticipo 50%" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia Offerta (Cambia l'interfaccia)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.values(QuoteType).map((t) => (
                            <button
                                key={t}
                                onClick={() => setQuoteType(t)}
                                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                                    quoteType === t ? 'bg-midnight text-white border-midnight shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan hover:text-cyan'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loadingData ? (
                 <div className="p-10 flex flex-col items-center text-gray-400">
                    <Loader2 className="animate-spin mb-2" />
                    Caricamento dati...
                 </div>
            ) : (
                <div className="animate-fade-in h-full">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {quoteType === QuoteType.PRICELIST && <FileText size={16}/>}
                        {quoteType === QuoteType.COMPONENTS && <Box size={16}/>}
                        {quoteType === QuoteType.ASSET_SOFTWARE && <Disc size={16}/>}
                        {quoteType === QuoteType.NEW_DEV && <Code size={16}/>}
                        Configuratore: {quoteType}
                    </h3>
                    {quoteType === QuoteType.PRICELIST && renderPricelistSelector()}
                    {quoteType === QuoteType.COMPONENTS && renderComponentBuilder()}
                    {quoteType === QuoteType.ASSET_SOFTWARE && renderSoftwareConfigurator()}
                    {quoteType === QuoteType.NEW_DEV && renderProjectEstimator()}
                </div>
            )}
        </div>

        <div className="lg:col-span-5 bg-gray-100 p-6 flex flex-col h-full overflow-hidden">
            <h3 className="text-lg font-bold text-midnight mb-4 flex justify-between items-center">
                Riepilogo Offerta
                <span className="text-xs font-normal bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{items.length} voci</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {items.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl">
                        Nessuna voce inserita.<br/>Usa il pannello a sinistra per iniziare.
                    </div>
                ) : (
                    items.map(item => renderSummaryRow(item))
                )}
            </div>

            <div className="bg-midnight text-white rounded-xl p-6 shadow-xl mt-auto">
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>Costi Industriali (Stima)</span>
                        <span>€ {totalCost.toFixed(2)}</span>
                    </div>
                    
                    <div className="h-px bg-gray-700 my-2"></div>

                    {totalPriceOneOff > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Totale Una Tantum</span>
                            <span className="font-bold">€ {totalPriceOneOff.toFixed(2)}</span>
                        </div>
                    )}
                    
                    {/* Recurring Summary */}
                    {(totalMonthly > 0 || totalQuarterly > 0 || totalSemi > 0 || totalAnnual > 0) && (
                         <div className="flex flex-col gap-1 text-cyan border-t border-gray-700 pt-2 mt-2">
                            <span className="font-semibold text-sm mb-1">Canoni Ricorrenti:</span>
                            {totalMonthly > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Mensile (MRR)</span>
                                    <span className="font-bold">€ {totalMonthly.toFixed(2)}</span>
                                </div>
                            )}
                            {totalQuarterly > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Trimestrale</span>
                                    <span className="font-bold">€ {totalQuarterly.toFixed(2)}</span>
                                </div>
                            )}
                            {totalSemi > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Semestrale</span>
                                    <span className="font-bold">€ {totalSemi.toFixed(2)}</span>
                                </div>
                            )}
                            {totalAnnual > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Annuale (ARR)</span>
                                    <span className="font-bold">€ {totalAnnual.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="h-px bg-gray-700 my-3"></div>
                    
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="block text-gray-400 text-xs uppercase tracking-wider">Margine (1° Anno)</span>
                            <span className={`text-3xl font-bold ${margin < settings.marginThresholdDanger ? 'text-red-400' : margin < settings.marginThresholdWarning ? 'text-orange-400' : 'text-teal'}`}>
                                {margin.toFixed(1)}%
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-gray-400 text-xs uppercase tracking-wider">Valore Totale 1° Anno</span>
                            <span className="text-xl font-bold text-white">€ {normalizedTotalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default QuoteBuilder;
