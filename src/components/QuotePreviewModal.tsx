import React from 'react';
import { Quote, LineItem } from '../types';
import { X, Printer, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface QuotePreviewModalProps {
  quote: Quote | null;
  onClose: () => void;
}

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ quote, onClose }) => {
  if (!quote) return null;

  const handlePrint = async () => {
    try {
      await document.fonts.ready;
      window.print();
    } catch (e) {
      window.print(); // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Header Actions (Hidden in Print) */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 print:hidden">
            <h3 className="font-bold text-gray-700">Anteprima Preventivo</h3>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Stampa / PDF</Button>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
            
            {/* Letterhead */}
            <div className="flex justify-between items-start mb-12 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-midnight mb-1">OPENCPQ DEMO</h1>
                    <p className="text-sm text-gray-500">Configure, price and quote</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                    <p>Example Company</p>
                    <p>company@example.com</p>
                </div>
            </div>

            {/* Quote Info */}
            <div className="flex justify-between mb-12">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Cliente</p>
                    <h2 className="text-xl font-bold text-gray-900">{quote.customerName}</h2>
                    <p className="text-sm text-gray-600">Alla c.a. Responsabile Acquisti</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Riferimenti Offerta</p>
                    <p className="text-sm font-medium"><span className="text-gray-500">Numero:</span> {quote.id}</p>
                    <p className="text-sm font-medium"><span className="text-gray-500">Data:</span> {quote.createdAt && !isNaN(new Date(quote.createdAt).getTime()) ? new Date(quote.createdAt).toLocaleDateString() : '-'}</p>
                    <p className="text-sm font-medium"><span className="text-gray-500">Validità:</span> 30 gg</p>
                    {quote.deliveryDate && <p className="text-sm font-medium"><span className="text-gray-500">Consegna:</span> {new Date(quote.deliveryDate).toLocaleDateString()}</p>}
                    {quote.paymentTerms && <p className="text-sm font-medium"><span className="text-gray-500">Pagamento:</span> {quote.paymentTerms}</p>}
                </div>
            </div>

            <h2 className="text-2xl font-bold text-midnight mb-6">{quote.title}</h2>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead className="border-b-2 border-gray-100">
                    <tr>
                        <th className="text-left py-3 text-sm font-bold text-gray-600 uppercase tracking-wide">Descrizione</th>
                        <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase tracking-wide w-24">Q.tà</th>
                        <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase tracking-wide w-32">Prezzo Unit.</th>
                        <th className="text-right py-3 text-sm font-bold text-gray-600 uppercase tracking-wide w-32">Totale</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {(quote.items || []).map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-4 pr-4">
                                <p className="font-bold text-gray-800">{item.name}</p>
                                {item.description && <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{item.description}</p>}
                            </td>
                            <td className="py-4 text-right text-gray-700 align-top">{item.quantity}</td>
                            <td className="py-4 text-right text-gray-700 align-top">€ {item.unitPrice.toFixed(2)}</td>
                            <td className="py-4 text-right font-bold text-gray-900 align-top">€ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end border-t border-gray-200 pt-6">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Imponibile</span>
                        <span>€ {(quote.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>IVA (22%)</span>
                        <span>€ {((quote.totalPrice || 0) * 0.22).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-midnight pt-3 border-t border-gray-200">
                        <span>Totale</span>
                        <span>€ {((quote.totalPrice || 0) * 1.22).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
                <p>Condizioni di pagamento: 30 gg D.F.F.M. | Tempi di consegna: da concordare</p>
                <p className="mt-1">OpenCPQ Demo - Documento generato digitalmente</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default QuotePreviewModal;
