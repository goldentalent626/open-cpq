
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuoteBuilder from './components/QuoteBuilder';
import QuoteArchive from './components/QuoteArchive';
import ResourceManager from './components/ResourceManager';
import BackofficeHub from './components/BackofficeHub';
import Settings from './components/Settings';
import OnboardingModal from './components/OnboardingModal';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import { Quote } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { saveQuote } from './services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from './components/ui/Toast';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  
  // Auth State
  const [session, setSession] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // Ascolta cambiamenti (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user);
      setAuthLoading(false);
    });

    // Controlla se c'è un parametro nell'URL che indica un recupero password
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const code = urlParams.get('oobCode');
    
    if (mode === 'resetPassword' && code) {
      setIsPasswordRecovery(true);
      setOobCode(code);
    }

    return () => unsubscribe();
  }, []);

  const handleSaveQuote = async (newQuote: Quote) => {
    try {
        await saveQuote(newQuote);
        addToast("Preventivo salvato con successo", "success");
        setCurrentPage('quotes');
    } catch (e) {
        addToast("Errore durante il salvataggio del preventivo", "error");
    }
  };

  const handleNewQuoteClick = (quote: Quote | null = null) => {
      setCurrentQuote(quote);
      setCurrentPage('create-quote');
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      
      case 'create-quote':
        return <QuoteBuilder initialQuote={currentQuote} onSave={handleSaveQuote} onCancel={() => setCurrentPage('dashboard')} />;
      
      case 'quotes':
        return (
            <QuoteArchive 
                onEdit={handleNewQuoteClick}
            />
        );

      case 'pricelist':
        return <ResourceManager />;

      case 'backoffice':
        return <BackofficeHub />;

      case 'settings':
        return <Settings />;
        
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // --- RENDERING ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-midnight" size={48} />
      </div>
    );
  }

  if (isPasswordRecovery && oobCode) {
    return <ResetPassword oobCode={oobCode} onSuccess={() => {
      setIsPasswordRecovery(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }} />;
  }

  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OnboardingModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      
      <Sidebar 
        currentPage={currentPage} 
        setPage={setCurrentPage} 
        onOpenTutorial={() => setShowTutorial(true)}
      />
      
      <main className={`ml-64 flex-1 ${currentPage === 'settings' ? '' : 'p-8 overflow-y-auto'} h-screen`}>
        <div className={`h-full ${currentPage === 'settings' ? '' : 'max-w-7xl mx-auto'}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
