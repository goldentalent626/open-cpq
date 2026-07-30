import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Quote, QuoteStatus } from '../types';
import { TrendingUp, CheckCircle, Clock, Loader2, Calendar } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { fetchQuotes } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ui/Toast';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { settings } = useSettings();
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
          const data = await fetchQuotes();
          setQuotes(data);
      } catch (e) {
          addToast("Errore caricamento dati dashboard", "error");
      } finally {
          setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredQuotes = quotes.filter(q => {
      if (!q.createdAt) return true;
      const qDate = new Date(q.createdAt).getTime();
      if (isNaN(qDate)) return true;
      const from = dateFrom ? new Date(dateFrom).getTime() : 0;
      const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : Infinity;
      return qDate >= from && qDate <= to;
  });

  const totalRevenue = filteredQuotes.reduce((acc, q) => acc + (q.totalPrice || 0), 0);
  const totalMargin = filteredQuotes.reduce((acc, q) => acc + ((q.totalPrice || 0) - (q.totalCost || 0)), 0);
  const avgMargin = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  
  const pendingCount = filteredQuotes.filter(q => q.status === QuoteStatus.PENDING_COMMERCIAL || q.status === QuoteStatus.PENDING_TECHNICAL).length;
  const wonCount = filteredQuotes.filter(q => q.status === QuoteStatus.WON).length;
  
  // New Metrics
  const pushCount = filteredQuotes.filter(q => q.origin === 'push').length;
  const pullCount = filteredQuotes.filter(q => q.origin === 'pull').length;
  const readyForBackofficeCount = filteredQuotes.filter(q => q.status === QuoteStatus.READY_FOR_BACKOFFICE).length;

  // Data for Charts
  const statusData = [
    { name: 'Vinti', value: wonCount },
    { name: 'In Corso', value: pendingCount },
    { name: 'Backoffice', value: readyForBackofficeCount },
    { name: 'Persi', value: filteredQuotes.filter(q => q.status === QuoteStatus.LOST).length },
    { name: 'Bozze', value: filteredQuotes.filter(q => q.status === QuoteStatus.DRAFT).length },
  ];

  const COLORS = ['#00BFA5', '#00A3E0', '#6366F1', '#EF4444', '#94A3B8'];

  const revenueData = filteredQuotes.map(q => ({
    name: q.customerName ? (q.customerName.length > 10 ? q.customerName.substring(0, 10) + '...' : q.customerName) : 'N/A',
    Fatturato: q.totalPrice || 0,
    Margine: (q.totalPrice || 0) - (q.totalCost || 0)
  })).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-midnight" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-midnight">Overview Commerciale</h2>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <Calendar size={18} className="text-gray-400" />
              <Input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)} 
                  className="text-sm border-none shadow-none focus:ring-0 py-1"
              />
              <span className="text-gray-400">-</span>
              <Input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)} 
                  className="text-sm border-none shadow-none focus:ring-0 py-1"
              />
          </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-midnight" noPadding>
          <div className="p-6 flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pipeline Totale</p>
              <h3 className="text-2xl font-bold text-midnight">€ {totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-midnight">
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-teal" noPadding>
          <div className="p-6 flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Margine Medio</p>
              <h3 className="text-2xl font-bold text-teal">{avgMargin.toFixed(1)}%</h3>
              <p className="text-xs text-gray-400 mt-1">Target &gt;{settings.marginThresholdWarning}%</p>
            </div>
            <div className={`p-2 rounded-lg ${avgMargin >= settings.marginThresholdWarning ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-500'}`}>
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-cyan" noPadding>
          <div className="p-6 flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">In Approvazione</p>
              <h3 className="text-2xl font-bold text-cyan">{pendingCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Richiedono azione</p>
            </div>
            <div className="p-2 bg-cyan/10 rounded-lg text-cyan">
              <Clock size={20} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500" noPadding>
          <div className="p-6 flex justify-between items-start">
             <div>
              <p className="text-sm text-gray-500 mb-1">Offerte Vinte</p>
              <h3 className="text-2xl font-bold text-green-600">{wonCount}</h3>
              <p className="text-xs text-gray-400 mt-1">Ready for Production</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Push vs Pull Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-orange-50 border border-orange-100" noPadding>
              <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                          <TrendingUp size={24} />
                      </div>
                      <div>
                          <p className="text-sm font-bold text-orange-800">Deal Proattivi (Push)</p>
                          <p className="text-xs text-orange-600">Proposte generate dal commerciale</p>
                      </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-900">{pushCount}</div>
              </div>
          </Card>
          <Card className="bg-blue-50 border border-blue-100" noPadding>
              <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                          <Clock size={24} />
                      </div>
                      <div>
                          <p className="text-sm font-bold text-blue-800">Richieste (Pull)</p>
                          <p className="text-xs text-blue-600">Risposte a RFI/RFP clienti</p>
                      </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{pullCount}</div>
              </div>
          </Card>
      </div>

      {readyForBackofficeCount > 0 && (
          <div className="mt-6 animate-pulse">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <CheckCircle className="text-indigo-600" />
                      <div>
                          <h4 className="font-bold text-indigo-900">Pronti per Backoffice</h4>
                          <p className="text-sm text-indigo-700">Ci sono <strong>{readyForBackofficeCount}</strong> preventivi approvati da inserire nel gestionale.</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => onNavigate('quotes')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                      Vai alla lista
                  </button>
              </div>
          </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card title="Fatturato vs Margine (Top 5)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="Fatturato" fill="#003B5C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Margine" fill="#00BFA5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Stato Offerte">
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-4 space-y-2">
                {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;