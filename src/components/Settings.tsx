import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ui/Toast';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    addToast("Impostazioni salvate con successo", "success");
  };

  return (
    <div className="space-y-6 animate-fade-in p-8">
        <h2 className="text-3xl font-bold text-midnight mb-6">Impostazioni</h2>
        <Card title="Generale">
            <p className="text-gray-500 mb-6">Configurazione applicazione.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input 
                    label="Aliquota IVA (%)" 
                    type="number" 
                    value={localSettings.vatRate} 
                    onChange={(e) => setLocalSettings({...localSettings, vatRate: parseFloat(e.target.value) || 0})} 
                />
                <Input 
                    label="Soglia Margine Attenzione (%)" 
                    type="number" 
                    value={localSettings.marginThresholdWarning} 
                    onChange={(e) => setLocalSettings({...localSettings, marginThresholdWarning: parseFloat(e.target.value) || 0})} 
                />
                <Input 
                    label="Soglia Margine Pericolo (%)" 
                    type="number" 
                    value={localSettings.marginThresholdDanger} 
                    onChange={(e) => setLocalSettings({...localSettings, marginThresholdDanger: parseFloat(e.target.value) || 0})} 
                />
            </div>

            <Button onClick={handleSave}>Salva Impostazioni</Button>
        </Card>
    </div>
  );
};

export default Settings;
