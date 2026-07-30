
import React, { useState, useMemo, useEffect } from 'react';
import { Quote, QuoteStatus, QuoteType, DealOrigin } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Select } from './ui/Input';
import { fetchQuotes, saveQuote } from '../services/api'; 
import { ConfirmModal } from './ui/ConfirmModal';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ui/Toast';
import { 
  Search, Filter, Copy, GitBranch, Download, FileText, 
  ChevronRight, AlertCircle, RefreshCw, Loader2, Lightbulb, Mail, Printer, Truck
} from 'lucide-react';
import QuotePreviewModal from './QuotePreviewModal';

interface QuoteArchiveProps {
  onEdit: (quote: Quote | null) => void;
}

const QuoteArchive: React.FC<QuoteArchiveProps> = ({ onEdit }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const { addToast } = useToast();
  const { settings } = useSettings();
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const [filters, setFilters] = useState({
    status: '' as QuoteStatus | '',
    type: '' as QuoteType | '',
    origin: '' as DealOrigin | '',
    dateFrom: '',
    dateTo: ''
  });

  // --- EFFECT: Load Data ---
  useEffect(() => {
    const loadQuotes = async () => {
        setIsLoading(true);
        const data = await fetchQuotes();
        setQuotes(data);
        setIsLoading(false);
    };
    loadQuotes();
  }, []);

  // --- Business Logic ---
  const handleDuplicate = (quote: Quote) => {
      setConfirmModal({
          isOpen: true,
          title: "Duplica Offerta",
          message: `Vuoi duplicare l'offerta "${quote.title}"?`,
          onConfirm: async () => {
              const newQuote: Quote = {
                  ...quote,
                  id: `Q-${Date.now()}`,
                  title: `${quote.title} (Copia)`,
                  status: QuoteStatus.DRAFT,
                  createdAt: new Date().toISOString(),
                  version: 1,
                  parentQuoteId: undefined
              };

              try {
                  await saveQuote(newQuote);
                  const data = await fetchQuotes();
                  setQuotes(data);
                  addToast("Offerta duplicata con successo", "success");
              } catch (e) {
                  addToast("Errore durante la duplicazione", "error");
              }
          }
      });
  };

  const handleRevision = (quote: Quote) => {
      setConfirmModal({
          isOpen: true,
          title: "Crea Revisione",
          message: `Creare una revisione per "${quote.title}"?`,
          onConfirm: async () => {
              const newQuote: Quote = {
                  ...quote,
                  id: `Q-${Date.now()}`,
                  version: quote.version + 1,
                  parentQuoteId: quote.id,
                  status: QuoteStatus.DRAFT,
                  createdAt: new Date().toISOString(),
                  title: `${quote.title} (Rev. ${quote.version + 1})`
              };

              try {
                  await saveQuote(newQuote);
                  const data = await fetchQuotes();
                  setQuotes(data);
                  addToast("Revisione creata con successo", "success");
              } catch (e) {
                  addToast("Errore creazione revisione", "error");
              }
          }
      });
  };

  // --- Helpers ---
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getTypeIcon = (type: QuoteType) => {
    switch (type) {
      case QuoteType.PRICELIST: return <FileText size={16} className="text-blue-500" />;
      case QuoteType.COMPONENTS: return <RefreshCw size={16} className="text-orange-500" />;
      case QuoteType.ASSET_SOFTWARE: return <Download size={16} className="text-purple-500" />;
      case QuoteType.NEW_DEV: return <GitBranch size={16} className="text-teal-500" />;
      default: return <FileText size={16} />;
    }
  };

  const isExpiringSoon = (dateString?: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      const days = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return days > 0 && days <= 5;
  };

  // --- Filtering Logic ---
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = 
        (q.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) || 
        (q.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (q.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesStatus = filters.status ? q.status === filters.status : true;
      const matchesType = filters.type ? q.type === filters.type : true;
      const matchesOrigin = filters.origin ? q.origin === filters.origin : true;
      
      const qDate = typeof q.createdAt === 'string' ? q.createdAt.substring(0, 10) : '';
      const matchesDateFrom = filters.dateFrom ? qDate >= filters.dateFrom : true;
      const matchesDateTo = filters.dateTo ? qDate <= filters.dateTo : true;

      return matchesSearch && matchesStatus && matchesType && matchesOrigin && matchesDateFrom && matchesDateTo;
    });
  }, [quotes, searchTerm, filters]);

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({...confirmModal, isOpen: false})}
      />
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-midnight">Archivio Offerte</h2>
          <p className="text-gray-500 text-sm">Gestione storica, revisioni e duplicazione rapida</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cerca per cliente, ID o titolo..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan focus:border-cyan outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={() => onEdit(null)} icon={FileText}>
                Nuova Offerta
            </Button>
        </div>
      </div>

      {/* Quick Filters for Sales Manager */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
          <button 
              onClick={() => setFilters({...filters, status: QuoteStatus.DRAFT})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.status === QuoteStatus.DRAFT ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
          >
              Bozze
          </button>
          <button 
              onClick={() => setFilters({...filters, status: QuoteStatus.SENT})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.status === QuoteStatus.SENT ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
          >
              Inviate
          </button>
          <button 
              onClick={() => setFilters({...filters, status: QuoteStatus.WON})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.status === QuoteStatus.WON ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
          >
              Vinte
          </button>
          <button 
              onClick={() => setFilters({...filters, status: QuoteStatus.LOST})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.status === QuoteStatus.LOST ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'}`}
          >
              Perse
          </button>
          {(filters.status || filters.type || filters.origin || filters.dateFrom) && (
              <button 
                  onClick={() => setFilters({ status: '', type: '', origin: '', dateFrom: '', dateTo: '' })}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto"
              >
                  Resetta Filtri
              </button>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        
        {/* Sidebar Filtri */}
        <Card className="w-full lg:w-72 bg-gray-50 h-fit" title="Filtri Avanzati" action={<Filter size={16} className="text-gray-400"/>}>
            <div className="space-y-4">
                <Select 
                    label="Stato Offerta" 
                    value={filters.status} 
                    onChange={(e) => setFilters({...filters, status: e.target.value as QuoteStatus})}
                >
                    <option value="">Tutti gli stati</option>
                    {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>

                <Select 
                    label="Tipologia" 
                    value={filters.type} 
                    onChange={(e) => setFilters({...filters, type: e.target.value as QuoteType})}
                >
                    <option value="">Tutte le tipologie</option>
                    {Object.values(QuoteType).map(t => <option key={t} value={t}>{t}</option>)}
                </Select>

                <Select 
                    label="Origine Deal" 
                    value={filters.origin} 
                    onChange={(e) => setFilters({...filters, origin: e.target.value as DealOrigin})}
                >
                    <option value="">Tutte le origini</option>
                    <option value="push">Push (Proattivo)</option>
                    <option value="pull">Pull (Richiesta)</option>
                </Select>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">Data Creazione</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="date" 
                            className="w-full border p-1.5 rounded text-sm text-gray-600"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        />
                        <input 
                            type="date" 
                            className="w-full border p-1.5 rounded text-sm text-gray-600"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                    <button 
                        onClick={() => setFilters({ status: '', type: '', origin: '', dateFrom: '', dateTo: '' })}
                        className="text-xs text-red-500 hover:text-red-700 w-full text-center"
                    >
                        Resetta Filtri
                    </button>
                </div>
            </div>
        </Card>

        {/* Data Grid */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                     <Loader2 className="animate-spin mb-2" size={32} />
                     <p>Caricamento archivio...</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-midnight text-white sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Stato</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Origine</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Data / ID</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Cliente</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Oggetto</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Totale</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider">Margine</th>
                            <th className="p-4 text-xs font-semibold uppercase tracking-wider text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredQuotes.map((q) => (
                            <tr key={q.id} className="hover:bg-blue-50/50 transition-colors group">
                                
                                {/* Stato */}
                                <td className="p-4 whitespace-nowrap">
                                    <select 
                                        value={q.status}
                                        onChange={(e) => {
                                            const newStatus = e.target.value as QuoteStatus;
                                            if (Object.values(QuoteStatus).includes(newStatus)) {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: "Cambio Stato",
                                                    message: `Cambiare stato in ${newStatus}?`,
                                                    onConfirm: async () => {
                                                        try {
                                                            await saveQuote({ ...q, status: newStatus });
                                                            const data = await fetchQuotes();
                                                            setQuotes(data);
                                                            addToast("Stato aggiornato con successo", "success");
                                                        } catch (err) {
                                                            addToast("Errore aggiornamento stato", "error");
                                                        }
                                                    }
                                                });
                                            }
                                        }}
                                        className={`text-xs font-medium px-2 py-1 rounded border-none focus:ring-2 focus:ring-cyan cursor-pointer appearance-none ${
                                            q.status === QuoteStatus.WON ? 'bg-green-100 text-green-800' :
                                            q.status === QuoteStatus.LOST ? 'bg-red-100 text-red-800' :
                                            q.status === QuoteStatus.SENT ? 'bg-blue-100 text-blue-800' :
                                            q.status === QuoteStatus.DRAFT ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {Object.values(QuoteStatus).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* Origine */}
                                <td className="p-4 whitespace-nowrap">
                                    {q.origin === 'push' ? (
                                        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium w-fit">
                                            <Lightbulb size={12} /> Push
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium w-fit">
                                            <Mail size={12} /> Pull
                                        </div>
                                    )}
                                </td>

                                {/* Data e ID (Priorità alla Data) */}
                                <td className="p-4">
                                    <div className="font-bold text-midnight text-sm">
                                        {formatDate(q.createdAt)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5" title={q.id}>
                                        {q.id ? (q.id.length > 8 ? q.id.substring(0,8) + '...' : q.id) : 'N/A'} (v.{q.version || 1})
                                    </div>
                                </td>

                                {/* Cliente & Tipo */}
                                <td className="p-4">
                                    <div className="font-semibold text-gray-900">{q.customerName}</div>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                                        {getTypeIcon(q.type)}
                                        <span>{q.type}</span>
                                    </div>
                                </td>

                                {/* Oggetto & Scadenza */}
                                <td className="p-4 max-w-xs">
                                    <div className="text-sm text-gray-700 truncate font-medium">{q.title}</div>
                                    <div className="flex flex-col gap-1 mt-1">
                                        {isExpiringSoon(q.validUntil) && (
                                            <div className="flex items-center gap-1 text-xs text-red-600 font-semibold animate-pulse">
                                                <AlertCircle size={10} /> Scade a breve
                                            </div>
                                        )}
                                        {q.deliveryDate && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Truck size={10} /> Consegna: {new Date(q.deliveryDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Totale */}
                                <td className="p-4 whitespace-nowrap">
                                    <span className="font-bold text-midnight text-base">{formatCurrency(q.totalPrice || 0)}</span>
                                </td>

                                {/* Margine */}
                                <td className="p-4 whitespace-nowrap">
                                    <div className={`font-bold ${(q.marginPercent || 0) < settings.marginThresholdDanger ? 'text-red-500' : 'text-teal'}`}>
                                        {(q.marginPercent || 0).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-400">Utile: {formatCurrency((q.totalPrice || 0) - (q.totalCost || 0))}</div>
                                </td>

                                {/* Azioni Rapide */}
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleDuplicate(q)}
                                            className="p-1.5 hover:bg-cyan/10 hover:text-cyan rounded text-gray-500" 
                                            title="Duplica Offerta"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleRevision(q)}
                                            className="p-1.5 hover:bg-purple-50 hover:text-purple-600 rounded text-gray-500" 
                                            title="Crea Revisione"
                                        >
                                            <GitBranch size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setPreviewQuote(q)}
                                            className="p-1.5 hover:bg-gray-100 hover:text-midnight rounded text-gray-500"
                                            title="Stampa / Anteprima"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onEdit(q)}
                                            className="p-1.5 hover:bg-gray-100 hover:text-midnight rounded text-gray-500"
                                            title="Vedi Dettaglio"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredQuotes.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-10 text-center text-gray-400">
                                    Nessun preventivo trovato con i filtri attuali.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
      </div>
      
      <QuotePreviewModal quote={previewQuote} onClose={() => setPreviewQuote(null)} />
    </div>
  );
};

export default QuoteArchive;
