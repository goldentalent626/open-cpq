import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Badge } from './ui/Badge';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './ui/Toast';
import { ConfirmModal } from './ui/ConfirmModal';
import { BaseResource, CompositeComponent, PriceListItem } from '../types';
import { 
    fetchResources, createResource, updateResource, deleteResource,
    fetchComponents, createCompositeComponent, deleteCompositeComponent,
    fetchPricelistItems, createPricelistItem, updatePricelistItem, deletePricelistItem
} from '../services/api';
import { Plus, Trash2, Edit2, Box, Hammer, Truck, Save, X, Loader2, Tag, ShoppingCart } from 'lucide-react';

const ResourceManager: React.FC = () => {
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  const [activeTab, setActiveTab] = useState<'resources' | 'components' | 'pricelist'>('resources');
  const [loading, setLoading] = useState(false);
  
  // Resources State
  const [resources, setResources] = useState<BaseResource[]>([]);
  const [editingResource, setEditingResource] = useState<Partial<BaseResource> | null>(null);
  const [isNewResource, setIsNewResource] = useState(false);

  // Components State
  const [components, setComponents] = useState<CompositeComponent[]>([]);
  const [isCreatingKit, setIsCreatingKit] = useState(false);
  const [newKit, setNewKit] = useState<Partial<CompositeComponent>>({
      name: '',
      description: '',
      markupPercent: 20,
      subItems: []
  });
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Pricelist State
  const [pricelistItems, setPricelistItems] = useState<PriceListItem[]>([]);
  const [editingPricelistItem, setEditingPricelistItem] = useState<Partial<PriceListItem> | null>(null);
  const [pricelistCustomerFilter, setPricelistCustomerFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [res, comps, pl] = await Promise.all([
            fetchResources(), 
            fetchComponents(),
            fetchPricelistItems()
        ]);
        setResources(res);
        setComponents(comps);
        setPricelistItems(pl);
    } catch (e) {
        console.error("Error loading data", e);
    } finally {
        setLoading(false);
    }
  };

  // --- RESOURCE HANDLERS ---

  const handleSaveResource = async () => {
      if (!editingResource || !editingResource.name || !editingResource.unitCost) return;
      
      try {
          if (isNewResource) {
              await createResource(editingResource as Omit<BaseResource, 'id'>);
          } else {
              await updateResource(editingResource.id!, editingResource);
          }
          setEditingResource(null);
          loadData();
          addToast("Risorsa salvata con successo", "success");
      } catch (e) {
          addToast("Errore salvataggio risorsa", "error");
      }
  };

  const handleDeleteResource = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: "Elimina Risorsa",
          message: "Eliminare questa risorsa?",
          onConfirm: async () => {
              try {
                  await deleteResource(id);
                  loadData();
                  addToast("Risorsa eliminata con successo", "success");
              } catch (e) {
                  addToast("Errore eliminazione", "error");
              }
          }
      });
  };

  // --- COMPONENT HANDLERS ---

  const handleDeleteComponent = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: "Elimina Kit",
          message: "Eliminare questo kit?",
          onConfirm: async () => {
              try {
                  await deleteCompositeComponent(id);
                  loadData();
                  addToast("Kit eliminato con successo", "success");
              } catch (e) {
                  addToast("Errore eliminazione kit", "error");
              }
          }
      });
  };

  const handleAddSubItem = () => {
      if (!selectedResourceId || selectedQuantity <= 0) return;
      
      const existing = newKit.subItems?.find(i => i.resourceId === selectedResourceId);
      if (existing) {
          setNewKit({
              ...newKit,
              subItems: newKit.subItems?.map(i => i.resourceId === selectedResourceId ? { ...i, quantity: i.quantity + selectedQuantity } : i)
          });
      } else {
          setNewKit({
              ...newKit,
              subItems: [...(newKit.subItems || []), { resourceId: selectedResourceId, quantity: selectedQuantity }]
          });
      }
      setSelectedResourceId('');
      setSelectedQuantity(1);
  };

  const handleRemoveSubItem = (resId: string) => {
      setNewKit({
          ...newKit,
          subItems: newKit.subItems?.filter(i => i.resourceId !== resId)
      });
  };

  const handleSaveKit = async () => {
      if (!newKit.name || !newKit.subItems || newKit.subItems.length === 0) {
          addToast("Inserire nome e almeno un componente", "error");
          return;
      }

      try {
          await createCompositeComponent(newKit as Omit<CompositeComponent, 'id'>);
          setIsCreatingKit(false);
          setNewKit({ name: '', description: '', markupPercent: 20, subItems: [] });
          loadData();
          addToast("Kit salvato con successo", "success");
      } catch (e) {
          addToast("Errore salvataggio kit", "error");
      }
  };

  // --- PRICELIST HANDLERS ---

  const handleSavePricelistItem = async () => {
      if (!editingPricelistItem || !editingPricelistItem.name || !editingPricelistItem.suggestedPrice) return;
      if (!editingPricelistItem.sourceId) {
          addToast("Devi selezionare una Risorsa Base o un Kit di origine.", "error");
          return;
      }

      try {
          if (editingPricelistItem.id) {
              await updatePricelistItem(editingPricelistItem as PriceListItem);
          } else {
              await createPricelistItem(editingPricelistItem as Omit<PriceListItem, 'id'>);
          }
          setEditingPricelistItem(null);
          loadData();
          addToast("Articolo salvato con successo", "success");
      } catch (e) {
          addToast("Errore salvataggio articolo", "error");
      }
  };

  const handleDeletePricelistItem = (id: string) => {
      setConfirmModal({
          isOpen: true,
          title: "Elimina Articolo",
          message: "Eliminare questo articolo dal listino?",
          onConfirm: async () => {
              try {
                  await deletePricelistItem(id);
                  loadData();
                  addToast("Articolo eliminato con successo", "success");
              } catch (e) {
                  addToast("Errore eliminazione articolo", "error");
              }
          }
      });
  };

  // --- RENDERERS ---

  const renderResourcesTab = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Elenco Risorse Base</h3>
              <Button size="sm" icon={Plus} onClick={() => {
                  setEditingResource({ category: 'Materiale', unitCost: 0, unitMeasure: 'pz' });
                  setIsNewResource(true);
              }}>Nuova Risorsa</Button>
          </div>

          {editingResource && (
              <Card className="bg-blue-50 border-blue-200 mb-4">
                  <h4 className="font-bold text-blue-900 mb-3">{isNewResource ? 'Nuova Risorsa' : 'Modifica Risorsa'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="col-span-1">
                          <Input label="Codice (ID)" value={editingResource.idStr || ''} onChange={e => setEditingResource({...editingResource, idStr: e.target.value})} placeholder="Es. MAN-01" />
                      </div>
                      <div className="col-span-2">
                          <Input label="Nome" value={editingResource.name || ''} onChange={e => setEditingResource({...editingResource, name: e.target.value})} placeholder="Es. Tecnico Senior" />
                      </div>
                      <div className="col-span-1">
                          <Select label="Categoria" value={editingResource.category} onChange={e => setEditingResource({...editingResource, category: e.target.value as any})}>
                              <option value="Manodopera">Manodopera</option>
                              <option value="Materiale">Materiale</option>
                              <option value="Trasferta">Trasferta</option>
                          </Select>
                      </div>
                      <div className="col-span-1 flex gap-2">
                          <Input label="Costo Unitario (€)" type="number" value={editingResource.unitCost || 0} onChange={e => setEditingResource({...editingResource, unitCost: parseFloat(e.target.value)})} />
                          <Select label="Unità" className="w-24" value={editingResource.unitMeasure || 'pz'} onChange={e => setEditingResource({...editingResource, unitMeasure: e.target.value})}>
                              <option value="pz">pz</option>
                              <option value="h">h</option>
                              <option value="km">km</option>
                              <option value="giorni">giorni</option>
                          </Select>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingResource(null)}>Annulla</Button>
                      <Button variant="primary" size="sm" icon={Save} onClick={handleSaveResource}>Salva</Button>
                  </div>
              </Card>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                          <th className="p-3">Codice</th>
                          <th className="p-3">Nome</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3 text-right">Costo Unit. (€)</th>
                          <th className="p-3 text-right">Ultimo Agg.</th>
                          <th className="p-3 text-center">Azioni</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {resources.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                              <td className="p-3 font-mono text-xs text-gray-400">{r.idStr}</td>
                              <td className="p-3 font-medium text-gray-800">{r.name}</td>
                              <td className="p-3">
                                  <Badge variant={r.category === 'Manodopera' ? 'brand' : r.category === 'Materiale' ? 'warning' : 'neutral'}>
                                      {r.category}
                                  </Badge>
                              </td>
                              <td className="p-3 text-right font-mono">€ {r.unitCost.toFixed(2)} / {r.unitMeasure}</td>
                              <td className="p-3 text-right text-xs text-gray-500">
                                  {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('it-IT') : '-'}
                              </td>
                              <td className="p-3 text-center flex justify-center gap-2">
                                  <button onClick={() => { setEditingResource(r); setIsNewResource(false); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDeleteResource(r.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderComponentsTab = () => (
      <div className="space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Libreria Kit & Assemblati</h3>
              {!isCreatingKit && (
                  <Button size="sm" icon={Plus} onClick={() => setIsCreatingKit(true)}>Nuovo Kit</Button>
              )}
          </div>

          {isCreatingKit && (
              <Card className="bg-orange-50 border-orange-200 mb-4">
                  <h4 className="font-bold text-orange-900 mb-3">Nuovo Kit Assemblato</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="col-span-1">
                          <Input label="Nome Kit" value={newKit.name} onChange={e => setNewKit({...newKit, name: e.target.value})} placeholder="Es. Quadro Elettrico 12 moduli" />
                      </div>
                      <div className="col-span-1">
                          <Input label="Descrizione" value={newKit.description} onChange={e => setNewKit({...newKit, description: e.target.value})} placeholder="Descrizione breve..." />
                      </div>
                      <div className="col-span-1">
                          <Input label="Markup (%)" type="number" value={newKit.markupPercent} onChange={e => setNewKit({...newKit, markupPercent: parseFloat(e.target.value)})} />
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-orange-100 mb-4">
                      <h5 className="text-sm font-bold text-gray-700 mb-2">Componenti (BOM)</h5>
                      
                      <div className="flex gap-2 mb-3 items-end">
                          <div className="flex-1">
                              <Select label="Aggiungi Risorsa" value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)}>
                                  <option value="">Seleziona risorsa...</option>
                                  <optgroup label="Risorse Base">
                                      {resources.map(r => (
                                          <option key={r.id} value={r.id}>{r.name} ({r.idStr}) - €{r.unitCost}</option>
                                      ))}
                                  </optgroup>
                              </Select>
                          </div>
                          <div className="w-24">
                              <Input label="Q.tà" type="number" value={selectedQuantity} onChange={e => setSelectedQuantity(parseFloat(e.target.value))} />
                          </div>
                          <Button onClick={handleAddSubItem} disabled={!selectedResourceId}>Aggiungi</Button>
                      </div>

                      <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 font-medium">Oppure importa da un Kit esistente:</p>
                          <div className="flex gap-2">
                              <Select 
                                  value="" 
                                  onChange={(e) => {
                                      const kitId = e.target.value;
                                      if (!kitId) return;
                                      const kit = components.find(c => c.id === kitId);
                                      if (kit) {
                                          const newSubItems = [...(newKit.subItems || [])];
                                          kit.subItems.forEach(sub => {
                                              const existing = newSubItems.find(i => i.resourceId === sub.resourceId);
                                              if (existing) {
                                                  existing.quantity += sub.quantity;
                                              } else {
                                                  newSubItems.push({ ...sub });
                                              }
                                          });
                                          setNewKit({ ...newKit, subItems: newSubItems });
                                      }
                                  }}
                              >
                                  <option value="">Seleziona Kit da importare...</option>
                                  {components.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                              </Select>
                          </div>
                      </div>

                      {newKit.subItems && newKit.subItems.length > 0 ? (
                          <table className="w-full text-sm">
                              <thead className="text-gray-500 text-xs border-b">
                                  <tr>
                                      <th className="text-left py-1">Risorsa</th>
                                      <th className="text-right py-1">Q.tà</th>
                                      <th className="text-right py-1">Costo Unit. (€)</th>
                                      <th className="text-right py-1">Totale (€)</th>
                                      <th className="w-8"></th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {newKit.subItems.map((item, idx) => {
                                      const res = resources.find(r => r.id === item.resourceId);
                                      return (
                                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                                              <td className="py-2">{res?.name}</td>
                                              <td className="text-right py-2">{item.quantity} {res?.unitMeasure}</td>
                                              <td className="text-right py-2">€ {res?.unitCost}</td>
                                              <td className="text-right py-2 font-medium">€ {(res?.unitCost || 0) * item.quantity}</td>
                                              <td className="text-right">
                                                  <button onClick={() => handleRemoveSubItem(item.resourceId)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                              </td>
                                          </tr>
                                      );
                                  })}
                                  <tr className="bg-orange-50 font-bold text-orange-900">
                                      <td colSpan={3} className="py-2 text-right">Costo Totale Kit (€):</td>
                                      <td className="py-2 text-right">
                                          € {newKit.subItems.reduce((acc, item) => {
                                              const res = resources.find(r => r.id === item.resourceId);
                                              return acc + ((res?.unitCost || 0) * item.quantity);
                                          }, 0).toFixed(2)}
                                      </td>
                                      <td></td>
                                  </tr>
                              </tbody>
                          </table>
                      ) : (
                          <p className="text-sm text-gray-400 italic text-center py-2">Nessun componente aggiunto</p>
                      )}
                  </div>

                  <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setIsCreatingKit(false)}>Annulla</Button>
                      <Button variant="primary" icon={Save} onClick={handleSaveKit}>Salva Kit</Button>
                  </div>
              </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map(comp => (
                  <div key={comp.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                              <Box size={20} className="text-orange-500"/>
                              <div>
                                  <h4 className="font-bold text-midnight">{comp.name}</h4>
                                  {comp.updatedAt && (
                                      <p className="text-[10px] text-gray-400">Aggiornato: {new Date(comp.updatedAt).toLocaleDateString('it-IT')}</p>
                                  )}
                              </div>
                          </div>
                          <Badge variant="warning">Markup: {comp.markupPercent}%</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{comp.description}</p>
                      
                      <div className="bg-gray-50 rounded p-2 text-xs space-y-1 mb-3">
                          <p className="font-semibold text-gray-400 uppercase text-[10px]">Distinta Base (BOM)</p>
                          {comp.subItems.map((sub, idx) => {
                              const res = resources.find(r => r.id === sub.resourceId);
                              return (
                                  <div key={idx} className="flex justify-between">
                                      <span>{res?.name || 'Risorsa sconosciuta'}</span>
                                      <span className="font-mono text-gray-500">x{sub.quantity}</span>
                                  </div>
                              );
                          })}
                          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
                              <span>Costo Totale:</span>
                              <span>€ {comp.subItems.reduce((acc, item) => {
                                  const res = resources.find(r => r.id === item.resourceId);
                                  return acc + ((res?.unitCost || 0) * item.quantity);
                              }, 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-midnight">
                              <span>Prezzo Suggerito:</span>
                              <span>€ {(comp.subItems.reduce((acc, item) => {
                                  const res = resources.find(r => r.id === item.resourceId);
                                  return acc + ((res?.unitCost || 0) * item.quantity);
                              }, 0) * (1 + comp.markupPercent / 100)).toFixed(2)}</span>
                          </div>
                      </div>
                      
                      <div className="flex justify-end pt-2 border-t border-gray-100">
                          <button onClick={() => handleDeleteComponent(comp.id)} className="text-red-500 text-xs hover:underline flex items-center gap-1">
                              <Trash2 size={12}/> Elimina
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPricelistTab = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Listino Prodotti Finiti</h3>
              <div className="flex gap-4 items-center">
                  <Input 
                      placeholder="Filtra per cliente..." 
                      value={pricelistCustomerFilter} 
                      onChange={(e) => setPricelistCustomerFilter(e.target.value)}
                      className="w-64"
                  />
                  <Button size="sm" icon={Plus} onClick={() => setEditingPricelistItem({ category: 'Hardware', cost: 0, suggestedPrice: 0 })}>Nuovo Articolo</Button>
              </div>
          </div>

          {editingPricelistItem && (
              <Card className="bg-green-50 border-green-200 mb-4">
                  <h4 className="font-bold text-green-900 mb-3">Nuovo Articolo Listino</h4>
                  
                  <div className="mb-4">
                      <Select 
                          label="Origine (Risorsa Base o Kit) *" 
                          value={editingPricelistItem.sourceId ? `${editingPricelistItem.sourceType}:${editingPricelistItem.sourceId}` : ''}
                          onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                  setEditingPricelistItem({...editingPricelistItem, sourceId: undefined, sourceType: undefined});
                                  return;
                              }
                              const [type, id] = val.split(':');
                              if (type === 'resource') {
                                  const res = resources.find(r => r.id === id);
                                  if (res) {
                                      setEditingPricelistItem({
                                          ...editingPricelistItem,
                                          sourceId: id,
                                          sourceType: 'resource',
                                          name: res.name,
                                          cost: res.unitCost,
                                          suggestedPrice: res.unitCost * 1.3,
                                          category: res.category
                                      });
                                  }
                              } else if (type === 'kit') {
                                  const kit = components.find(c => c.id === id);
                                  if (kit) {
                                      const kitCost = kit.subItems.reduce((acc, item) => {
                                          const r = resources.find(r => r.id === item.resourceId);
                                          return acc + ((r?.unitCost || 0) * item.quantity);
                                      }, 0);
                                      const kitPrice = kitCost * (1 + kit.markupPercent / 100);
                                      setEditingPricelistItem({
                                          ...editingPricelistItem,
                                          sourceId: id,
                                          sourceType: 'kit',
                                          name: kit.name,
                                          cost: kitCost,
                                          suggestedPrice: kitPrice,
                                          category: 'Hardware'
                                      });
                                  }
                              }
                          }}
                      >
                          <option value="">-- Seleziona Risorsa o Kit di partenza --</option>
                          <optgroup label="Risorse Base">
                              {resources.map(r => <option key={`resource:${r.id}`} value={`resource:${r.id}`}>{r.name} (€{r.unitCost})</option>)}
                          </optgroup>
                          <optgroup label="Kit Assemblati">
                              {components.map(c => <option key={`kit:${c.id}`} value={`kit:${c.id}`}>{c.name}</option>)}
                          </optgroup>
                      </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="col-span-1">
                          <Input label="Codice" value={editingPricelistItem.code || ''} onChange={e => setEditingPricelistItem({...editingPricelistItem, code: e.target.value})} placeholder="Es. SW-LIC-01" />
                      </div>
                      <div className="col-span-2">
                          <Input label="Nome Prodotto" value={editingPricelistItem.name || ''} onChange={e => setEditingPricelistItem({...editingPricelistItem, name: e.target.value})} placeholder="Es. Licenza Windows Server" />
                      </div>
                      <div className="col-span-1">
                          <Input label="Cliente (Opzionale)" value={editingPricelistItem.customerName || ''} onChange={e => setEditingPricelistItem({...editingPricelistItem, customerName: e.target.value})} placeholder="Solo per..." />
                      </div>
                      <div className="col-span-1">
                          <Input label="Costo Acquisto (€)" type="number" value={editingPricelistItem.cost || 0} onChange={e => setEditingPricelistItem({...editingPricelistItem, cost: parseFloat(e.target.value)})} />
                      </div>
                      <div className="col-span-1">
                          <Input label="Prezzo Vendita (€)" type="number" value={editingPricelistItem.suggestedPrice || 0} onChange={e => setEditingPricelistItem({...editingPricelistItem, suggestedPrice: parseFloat(e.target.value)})} />
                      </div>
                      <div className="col-span-1">
                          <Select label="Categoria" value={editingPricelistItem.category} onChange={e => setEditingPricelistItem({...editingPricelistItem, category: e.target.value})}>
                              <option value="Hardware">Hardware</option>
                              <option value="Software">Software</option>
                              <option value="Servizio">Servizio</option>
                              <option value="Canone">Canone</option>
                          </Select>
                      </div>
                  </div>

                  {/* Customer Prices Section */}
                  <div className="mt-6 border-t border-green-200 pt-4">
                      <h5 className="font-semibold text-green-800 mb-2 text-sm">Prezzi Specifici per Cliente (Opzionale)</h5>
                      <div className="space-y-2">
                          {(editingPricelistItem.customerPrices || []).map((cp, idx) => (
                              <div key={idx} className="flex gap-2 items-end bg-white p-2 rounded border border-green-100">
                                  <div className="flex-1">
                                      <Input 
                                          label="Nome Cliente" 
                                          value={cp.customerName} 
                                          onChange={e => {
                                              const newPrices = [...(editingPricelistItem.customerPrices || [])];
                                              newPrices[idx].customerName = e.target.value;
                                              setEditingPricelistItem({...editingPricelistItem, customerPrices: newPrices});
                                          }}
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <Input 
                                          label="Codice Cliente (Opzionale)" 
                                          value={cp.customerCode || ''} 
                                          onChange={e => {
                                              const newPrices = [...(editingPricelistItem.customerPrices || [])];
                                              newPrices[idx].customerCode = e.target.value;
                                              setEditingPricelistItem({...editingPricelistItem, customerPrices: newPrices});
                                          }}
                                      />
                                  </div>
                                  <div className="w-32">
                                      <Input 
                                          label="Prezzo (€)" 
                                          type="number" 
                                          value={cp.price} 
                                          onChange={e => {
                                              const newPrices = [...(editingPricelistItem.customerPrices || [])];
                                              newPrices[idx].price = parseFloat(e.target.value) || 0;
                                              setEditingPricelistItem({...editingPricelistItem, customerPrices: newPrices});
                                          }}
                                      />
                                  </div>
                                  <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => {
                                          const newPrices = (editingPricelistItem.customerPrices || []).filter((_, i) => i !== idx);
                                          setEditingPricelistItem({...editingPricelistItem, customerPrices: newPrices});
                                      }}
                                  >
                                      <Trash2 size={16} className="text-red-500" />
                                  </Button>
                              </div>
                          ))}
                          <Button 
                              variant="outline" 
                              size="sm" 
                              icon={Plus}
                              onClick={() => {
                                  const newPrices = [...(editingPricelistItem.customerPrices || []), { customerId: `temp_${Date.now()}`, customerName: '', price: editingPricelistItem.suggestedPrice || 0 }];
                                  setEditingPricelistItem({...editingPricelistItem, customerPrices: newPrices});
                              }}
                          >
                              Aggiungi Prezzo Cliente
                          </Button>
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPricelistItem(null)}>Annulla</Button>
                      <Button variant="primary" size="sm" icon={Save} onClick={handleSavePricelistItem}>Salva Articolo</Button>
                  </div>
              </Card>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                      <tr>
                          <th className="p-3">Codice</th>
                          <th className="p-3">Prodotto</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3 text-right">Costo (€)</th>
                          <th className="p-3 text-right">Prezzo (€)</th>
                          <th className="p-3 text-right">Margine</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {pricelistItems
                          .filter(p => {
                              if (!pricelistCustomerFilter) return true;
                              const filter = pricelistCustomerFilter.toLowerCase();
                              const matchLegacy = p.customerName && p.customerName.toLowerCase().includes(filter);
                              const matchPrices = p.customerPrices && p.customerPrices.some(cp => cp.customerName.toLowerCase().includes(filter));
                              return matchLegacy || matchPrices;
                          })
                          .map(p => {
                          const margin = p.suggestedPrice > 0 ? ((p.suggestedPrice - p.cost) / p.suggestedPrice) * 100 : 0;
                          return (
                              <tr key={p.id} className="hover:bg-gray-50">
                                  <td className="p-3 font-mono text-xs text-gray-400">{p.code}</td>
                                  <td className="p-3 font-medium text-gray-800">
                                      <div className="flex items-center gap-2">
                                          {p.name}
                                          {p.sourceType === 'kit' && <Badge variant="warning">Da Kit</Badge>}
                                          {p.sourceType === 'resource' && <Badge variant="brand">Da Risorsa</Badge>}
                                      </div>
                                      {p.customerName && <div className="mt-1"><Badge variant="info">Cliente: {p.customerName}</Badge></div>}
                                      {p.customerPrices && p.customerPrices.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                              {p.customerPrices.map((cp, idx) => (
                                                  <div key={idx} className="text-xs flex items-center gap-2 text-gray-600 bg-gray-50 p-1 rounded">
                                                      <span className="font-semibold">{cp.customerName}:</span>
                                                      {cp.customerCode && <span className="font-mono text-gray-400">[{cp.customerCode}]</span>}
                                                      <span>€ {cp.price.toFixed(2)}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </td>
                                  <td className="p-3"><Badge variant="neutral">{p.category}</Badge></td>
                                  <td className="p-3 text-right text-gray-500">€ {p.cost.toFixed(2)}</td>
                                  <td className="p-3 text-right font-bold text-midnight">€ {p.suggestedPrice.toFixed(2)}</td>
                                  <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                      <span className={`text-xs font-bold ${margin >= settings.marginThresholdWarning ? 'text-green-600' : margin >= settings.marginThresholdDanger ? 'text-orange-500' : 'text-red-500'}`}>
                                              {margin.toFixed(1)}%
                                          </span>
                                          <button onClick={() => setEditingPricelistItem(p)} className="text-gray-400 hover:text-brand p-1">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                          </button>
                                          <button onClick={() => handleDeletePricelistItem(p.id)} className="text-red-400 hover:text-red-600 p-1">
                                              <Trash2 size={14} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
        <ConfirmModal 
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal({...confirmModal, isOpen: false})}
        />
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-midnight">Gestione Risorse</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('resources')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'resources' ? 'bg-white text-midnight shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Risorse Base
                </button>
                <button 
                    onClick={() => setActiveTab('components')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'components' ? 'bg-white text-midnight shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kit Assemblati
                </button>
                <button 
                    onClick={() => setActiveTab('pricelist')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pricelist' ? 'bg-white text-midnight shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Listino Prodotti
                </button>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>
        ) : (
            <>
                {activeTab === 'resources' && renderResourcesTab()}
                {activeTab === 'components' && renderComponentsTab()}
                {activeTab === 'pricelist' && renderPricelistTab()}
            </>
        )}
    </div>
  );
};

export default ResourceManager;
