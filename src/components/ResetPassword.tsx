import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AlertCircle, Hexagon, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from './ui/Toast';

interface ResetPasswordProps {
  oobCode: string;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ oobCode, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Le password non corrispondono.');
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await confirmPasswordReset(auth, oobCode, password);
      
      setSuccess(true);
      addToast("Password aggiornata con successo.", "success");
      
      // Aspetta un momento prima di reindirizzare
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err: any) {
      const msg = err.message || 'Errore durante l\'aggiornamento della password.';
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
                    Sicurezza <span className="text-cyan">Account.</span>
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                    Reimposta la tua password per accedere nuovamente alla piattaforma.
                </p>
            </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500 mt-12">
            © {new Date().getFullYear()} OpenCPQ.
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center space-y-2">
                <div className="lg:hidden flex justify-center mb-4">
                    <div className="bg-midnight p-3 rounded-xl">
                        <Hexagon className="text-cyan fill-cyan/20" size={32} />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Nuova Password</h2>
                <p className="text-gray-500">Inserisci la tua nuova password qui sotto.</p>
            </div>

            {success ? (
              <div className="space-y-6 mt-8 animate-fade-in">
                <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-green-800 font-medium mb-1">Password Aggiornata!</h3>
                    <p className="text-green-600 text-sm">
                      La tua password è stata modificata con successo. Stai per essere reindirizzato all'applicazione...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6 mt-8 animate-fade-in">
                  {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                          <AlertCircle size={18} className="mt-0.5 shrink-0" />
                          <div className="flex-1">{error}</div>
                      </div>
                  )}
              
                  <div className="space-y-5">
                      <Input 
                          label="Nuova Password" 
                          type="password" 
                          placeholder="••••••••"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                          fullWidth
                          autoComplete="new-password"
                      />
                      
                      <Input 
                          label="Conferma Password" 
                          type="password" 
                          placeholder="••••••••"
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          required 
                          fullWidth
                          autoComplete="new-password"
                      />
                  </div>
              
                  <Button 
                      type="submit" 
                      fullWidth 
                      size="lg" 
                      isLoading={loading}
                      className="group relative overflow-hidden"
                  >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                          Aggiorna Password <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                      </span>
                  </Button>
              </form>
            )}
        </div>
        
        <div className="mt-8 text-center lg:hidden">
             <p className="text-xs text-gray-400">© {new Date().getFullYear()} OpenCPQ</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
