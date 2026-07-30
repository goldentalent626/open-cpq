import React, { useState, useEffect } from 'react';
import { Quote, QuoteStatus } from '../types';
import { fetchQuotes, saveQuote } from '../services/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ConfirmModal } from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import { useSettings } from '../contexts/SettingsContext';
import { CheckCircle, Truck, FileText, ArrowRight, Loader2, AlertTriangle, Package } from 'lucide-react';

const BackofficeHub: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { settings } = useSettings();
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const mounted = React.useRef(true);

  useEffect(() => {
    loadData();
    return () => {
        mounted.current = false;
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchQuotes();
    if (!mounted.current) return;
    // Filter for Backoffice relevant statuses
    const relevant = data.filter(q => 
        q.status === QuoteStatus.WON || 
        q.status === QuoteStatus.READY_FOR_BACKOFFICE ||
        q.status === QuoteStatus.ORDERED
    );
    setQuotes(relevant);
    setLoading(false);
  };

  const handleProcessOrder = (quote: Quote) => {
      if ((quote.marginPercent || 0) < 0) {
          addToast("Impossibile processare un ordine in perdita (margine negativo).", "error");
          return;
      }
      
      setConfirmModal({
          isOpen: true,
          title: "Conferma Ordine",
          message: `Confermare l'ordine per "${quote.customerName}"? Questo invierà i dati all'ERP.`,
          onConfirm: async () => {
              try {
                  // Simulate ERP Sync
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  if (!mounted.current) return;
                  
                  await saveQuote({ ...quote, status: QuoteStatus.ORDERED });
                  addToast("Ordine creato con successo e inviato all'ERP!", "success");
                  loadData();
              } catch (e) {
                  if (mounted.current) addToast("Errore durante l'elaborazione dell'ordine", "error");
              }
          }
      });
  };

  const getStatusBadge = (status: QuoteStatus) => {
      switch (status) {
          case QuoteStatus.WON: return <Badge variant="success">Vinto - Da Processare</Badge>;
          case QuoteStatus.READY_FOR_BACKOFFICE: return <Badge variant="info">Pronto per Backoffice</Badge>;
          case QuoteStatus.ORDERED: return <Badge variant="brand">Ordine Confermato</Badge>;
          default: return <Badge variant="neutral">{status}</Badge>;
      }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-midnight"/></div>;

  const toProcess = quotes.filter(q => q.status !== QuoteStatus.ORDERED);
  const processed = quotes.filter(q => q.status === QuoteStatus.ORDERED);

  return (
    <div className="space-y-8 animate-fade-in">
        <ConfirmModal 
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal({...confirmModal, isOpen: false})}
        />
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-midnight">Hub Backoffice</h2>
                <p className="text-gray-500">Gestione ordini e sincronizzazione ERP</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex gap-4">
                <div className="text-center px-4 border-r border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-bold">Da Processare</p>
                    <p className="text-2xl font-bold text-orange-500">{toProcess.length}</p>
                </div>
                <div className="text-center px-4">
                    <p className="text-xs text-gray-400 uppercase font-bold">Ordini Mese</p>
                    <p className="text-2xl font-bold text-green-600">{processed.length}</p>
                </div>
            </div>
        </div>

        {/* To Process Section */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20}/>
                Offerte in Attesa di Conferma Ordine
            </h3>
            
            {toProcess.length === 0 ? (
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200 text-center py-8">
                    <p className="text-gray-400">Nessuna offerta in attesa di elaborazione.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {toProcess.map(q => (
                        <Card key={q.id} className="hover:shadow-md transition-shadow border-l-4 border-orange-400">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-lg text-midnight">{q.customerName}</h4>
                                        {getStatusBadge(q.status)}
                                    </div>
                                    <p className="text-sm text-gray-600">{q.title}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500 font-mono">
                                        <span>ID: {q.id}</span>
                                        <span>Data: {q.createdAt && !isNaN(new Date(q.createdAt).getTime()) ? new Date(q.createdAt).toLocaleDateString() : '-'}</span>
                                        <span className="font-bold text-gray-700">Totale: € {(q.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-4 hidden md:block">
                                        <p className="text-xs text-gray-400">Margine</p>
                                        <p className={`font-bold ${(q.marginPercent || 0) < settings.marginThresholdDanger ? 'text-red-500' : 'text-green-600'}`}>
                                            {(q.marginPercent || 0).toFixed(1)}%
                                        </p>
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        icon={Package}
                                        onClick={() => handleProcessOrder(q)}
                                    >
                                        Genera Ordine
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>

        {/* Processed History */}
        <div className="space-y-4 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20}/>
                Storico Ordini Elaborati
            </h3>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Riferimento</th>
                            <th className="p-3 text-right">Importo</th>
                            <th className="p-3 text-center">Stato ERP</th>
                            <th className="p-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {processed.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="p-3 font-medium text-midnight">{q.customerName}</td>
                                <td className="p-3 text-gray-600">{q.id}</td>
                                <td className="p-3 text-right font-mono">€ {(q.totalPrice || 0).toFixed(2)}</td>
                                <td className="p-3 text-center">
                                    <Badge variant="brand">Sincronizzato</Badge>
                                </td>
                                <td className="p-3 text-right">
                                    <button className="text-blue-600 hover:underline text-xs flex items-center justify-end gap-1">
                                        <FileText size={12}/> Vedi Ordine
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {processed.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nessun ordine completato di recente.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default BackofficeHub;
