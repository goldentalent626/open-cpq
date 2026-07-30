import React, { useState } from 'react';
import { signIn, sendPasswordResetEmail } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Loader2, AlertCircle, Hexagon, CheckCircle2, ArrowRight, LayoutDashboard, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { useToast } from './ui/Toast';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signIn(email, password);
      addToast("Bentornato! Accesso effettuato.", "success");
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message || 'Credenziali non valide. Riprova.';
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Inserisci il tuo indirizzo email per recuperare la password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(email);
      setResetSent(true);
      addToast("Email di recupero inviata con successo.", "success");
    } catch (err: any) {
      const msg = err.message || 'Errore durante l\'invio dell\'email di recupero.';
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* Left Panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-midnight text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600 blur-[100px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                    <Hexagon className="text-cyan fill-cyan/20" size={32} strokeWidth={1.5} />
                </div>
                <span className="text-2xl font-bold tracking-tight">OpenCPQ</span>
            </div>
            
            <div className="space-y-6 max-w-md mt-20">
                <h1 className="text-5xl font-bold leading-tight">
                    Configura, Prezza, <span className="text-cyan">Vendi.</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                    La piattaforma all-in-one per gestire preventivi complessi, listini dinamici e configurazioni tecniche con semplicità.
                </p>
            </div>
        </div>

        {/* Features List */}
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <div className="bg-cyan/20 p-1.5 rounded-full text-cyan"><LayoutDashboard size={16}/></div>
                <span>Dashboard Analitica in Tempo Reale</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <div className="bg-purple-500/20 p-1.5 rounded-full text-purple-400"><Zap size={16}/></div>
                <span>Generazione Offerte Istantanea</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <div className="bg-green-500/20 p-1.5 rounded-full text-green-400"><ShieldCheck size={16}/></div>
                <span>Workflow di Approvazione Sicuro</span>
            </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500 mt-12">
            © {new Date().getFullYear()} OpenCPQ.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center space-y-2">
                <div className="lg:hidden flex justify-center mb-4">
                    <div className="bg-midnight p-3 rounded-xl">
                        <Hexagon className="text-cyan fill-cyan/20" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {isForgotPassword ? 'Recupera Password' : 'Bentornato'}
                </h2>
                <p className="text-gray-500">
                  {isForgotPassword 
                    ? 'Inserisci la tua email e ti invieremo un link per reimpostare la password.' 
                    : 'Inserisci le tue credenziali per accedere all\'area riservata.'}
                </p>
            </div>

            {isForgotPassword ? (
              resetSent ? (
                <div className="space-y-6 mt-8 animate-fade-in">
                  <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-green-800 font-medium mb-1">Email inviata!</h3>
                      <p className="text-green-600 text-sm">
                        Abbiamo inviato le istruzioni per il recupero della password a <strong>{email}</strong>. Controlla la tua casella di posta.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSent(false);
                      setError('');
                    }}
                  >
                    Torna al Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6 mt-8 animate-fade-in">
                  {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                          <AlertCircle size={18} className="mt-0.5 shrink-0" />
                          <div className="flex-1">{error}</div>
                      </div>
                  )}
                  
                  <div className="space-y-5">
                      <Input 
                          label="Email Aziendale" 
                          type="email" 
                          placeholder="nome.cognome@azienda.com"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                          fullWidth
                          autoComplete="username"
                      />
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                        type="submit" 
                        fullWidth 
                        size="lg" 
                        isLoading={loading}
                    >
                        Invia Link di Recupero
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        fullWidth 
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError('');
                        }}
                        className="text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft size={16} className="mr-2" /> Torna al Login
                    </Button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleLogin} className="space-y-6 mt-8 animate-fade-in">
                  {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                          <AlertCircle size={18} className="mt-0.5 shrink-0" />
                          <div className="flex-1">{error}</div>
                      </div>
                  )}
              
                  <div className="space-y-5">
                      <Input 
                          label="Email Aziendale" 
                          type="email" 
                          placeholder="nome.cognome@azienda.com"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                          fullWidth
                          autoComplete="username"
                          className="transition-all"
                      />
                      
                      <div className="space-y-1">
                          <div className="flex justify-between items-center">
                              <label className="block text-sm font-medium text-gray-700">Password</label>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setIsForgotPassword(true);
                                  setError('');
                                }} 
                                className="text-xs font-medium text-cyan hover:text-cyan/80 hover:underline"
                              >
                                  Password dimenticata?
                              </button>
                          </div>
                          <Input 
                              type="password" 
                              placeholder="••••••••"
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              required 
                              fullWidth
                              autoComplete="current-password"
                          />
                      </div>
                  </div>
              
                  <Button 
                      type="submit" 
                      fullWidth 
                      size="lg" 
                      isLoading={loading}
                      className="group relative overflow-hidden"
                  >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                          Accedi alla Piattaforma <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                      </span>
                  </Button>
              </form>
            )}

            <div className="pt-6 text-center">
                <p className="text-xs text-gray-400">
                    Non hai un account? <a href="#" className="text-midnight font-semibold hover:underline">Contatta l'amministratore IT</a>
                </p>
            </div>
        </div>
        
        <div className="mt-8 text-center lg:hidden">
             <p className="text-xs text-gray-400">© {new Date().getFullYear()} OpenCPQ</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
