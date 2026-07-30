import React from 'react';
import { X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
            <X size={20} />
        </button>
        
        <div className="p-8">
            <h2 className="text-2xl font-bold text-midnight mb-4">Benvenuto in OpenCPQ</h2>
            <p className="text-gray-600 mb-6">
                Questo strumento ti permette di creare preventivi complessi in pochi minuti.
            </p>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan text-white flex items-center justify-center font-bold shrink-0">1</div>
                    <div>
                        <h4 className="font-bold text-gray-900">Scegli la modalità</h4>
                        <p className="text-sm text-gray-500">Puoi partire da un listino, configurare un kit o stimare un progetto software.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan text-white flex items-center justify-center font-bold shrink-0">2</div>
                    <div>
                        <h4 className="font-bold text-gray-900">Aggiungi le voci</h4>
                        <p className="text-sm text-gray-500">Seleziona materiali, manodopera e servizi. Il sistema calcola margini e totali in tempo reale.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan text-white flex items-center justify-center font-bold shrink-0">3</div>
                    <div>
                        <h4 className="font-bold text-gray-900">Salva e Invia</h4>
                        <p className="text-sm text-gray-500">Genera il preventivo e traccia lo stato di avanzamento dalla dashboard.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-midnight text-white rounded-lg font-medium hover:bg-midnight/90 transition-colors"
                >
                    Inizia Subito
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
