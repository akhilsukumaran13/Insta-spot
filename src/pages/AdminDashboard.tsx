import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import LotDesigner from '../components/LotDesigner';
import { Plus, Clock, MapPin, Sparkles, Layout, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { apiRequest } from '../lib/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [lots, setLots] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLotLocation, setNewLotLocation] = useState<[number, number] | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Layout
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price_per_hour: '',
    total_slots: '',
    description: ''
  });
  const [layout, setLayout] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState([]);
  const [viewMode, setViewMode] = useState<'lots' | 'bookings'>('lots');
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'map'>('dashboard');

  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  useEffect(() => {
    fetchLots();
    fetchBookings();
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    // Get admin location for map center
    navigator.geolocation.getCurrentPosition(
        (pos) => setNewLotLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
            console.error(err);
            if (err.code === 1) { // PERMISSION_DENIED
                alert("Please allow location access to use map features.");
            }
        },
        { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
      if (viewMode === 'bookings') {
          fetchBookings();
      }
  }, [viewMode]);

  const fetchLots = async () => {
    try {
      const res = await apiRequest('/api/lots');
      const data = await res.json();
      if (Array.isArray(data)) setLots(data);
    } catch (e) {
      console.error("Failed to fetch lots", e);
    }
  };

  const handleDeleteLot = async (id: number) => {
    // Removed confirm for debugging purposes on mobile
    // if (!confirm("Are you sure you want to delete this parking lot?")) return;
    
    try {
        console.log("Deleting lot:", id);
        const res = await apiRequest(`/api/lots/${id}`, { method: 'DELETE' });
        if (res.ok) {
            console.log("Lot deleted successfully");
            fetchLots();
        } else {
            console.error("Failed to delete lot");
            alert("Failed to delete lot");
        }
    } catch (e) {
        console.error("Error deleting lot", e);
        alert("Error deleting lot");
    }
  };

  const handleResetData = () => {
      if (confirm("Reset all data to default? This will clear all lots and bookings.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const fetchBookings = async () => {
    try {
      const res = await apiRequest('/api/bookings/all');
      const data = await res.json();
      if (Array.isArray(data)) setAllBookings(data);
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setNewLotLocation([lat, lng]);
    
    // Reverse Geocoding
    setIsFetchingAddress(true);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
            setFormData(prev => ({ ...prev, address: data.display_name }));
        }
    } catch (e) {
        console.error("Reverse geocoding failed", e);
    } finally {
        setIsFetchingAddress(false);
    }

    // Get AI analysis for this location
    try {
        const res = await apiRequest('/api/ai/analyze-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        });
        const data = await res.json();
        setAiSuggestion(data);
    } catch (e) {
        console.error("AI Analysis failed", e);
    }
  };

  const handleCreateLot = async () => {
    if (!newLotLocation) return alert('Please select a location on the map');

    // If total slots is not set, use layout count
    const slotsFromLayout = layout.filter(e => e.type === 'slot').length;
    const finalTotalSlots = slotsFromLayout > 0 ? slotsFromLayout : formData.total_slots;

    const res = await apiRequest('/api/lots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        total_slots: finalTotalSlots,
        latitude: newLotLocation[0],
        longitude: newLotLocation[1],
        created_by: user?.id,
        layout: layout
      })
    });

    if (res.ok) {
      setShowCreateModal(false);
      setStep(1);
      setLayout([]);
      fetchLots();
      setFormData({ name: '', address: '', price_per_hour: '', total_slots: '', description: '' });
    }
  };

  const getPriceSuggestion = async () => {
    if (!formData.address) return alert('Please enter an address first');
    
    const res = await apiRequest('/api/ai/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: formData.address, description: formData.description })
    });
    const data = await res.json();
    if (data.price) {
        setFormData({ ...formData, price_per_hour: data.price.toString() });
        alert(`AI Suggestion: ₹${data.price}/hr\nReason: ${data.reasoning}`);
    }
  };

  const handleLocateMe = () => {
      if (!navigator.geolocation) return alert("Geolocation is not supported");
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            setNewLotLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
            console.error(err);
            alert("Could not fetch location");
        },
        { enableHighAccuracy: true }
      );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <div className={`w-full md:w-[350px] bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden z-10 ${mobileTab === 'map' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pt-12 md:pt-6 border-b border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-indigo-400">Admin Panel</h1>
            <button onClick={logout} className="text-xs text-slate-500 hover:text-white">Logout</button>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} /> Create New Lot
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
          <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setViewMode('lots')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${viewMode === 'lots' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
                Lots
            </button>
            <button 
                onClick={() => setViewMode('bookings')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${viewMode === 'bookings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
                Bookings
            </button>
          </div>

          {viewMode === 'lots' ? (
              <>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Your Lots</h3>
                {lots.map((lot: any) => (
                    <div key={lot.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 relative group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold">{lot.name}</h4>
                            <p className="text-slate-400 text-sm mb-2">{lot.address}</p>
                        </div>
                        <button 
                            onClick={() => handleDeleteLot(lot.id)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                            title="Delete Lot"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">₹{lot.price_per_hour}/hr</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {lot.total_slots} Slots</span>
                    </div>
                    </div>
                ))}
              </>
          ) : (
              <>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Recent Bookings</h3>
                {allBookings.map((booking: any) => (
                    <div key={booking.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between mb-1">
                            <h4 className="font-bold text-sm">{booking.user_name}</h4>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 
                                    booking.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                                    'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                    {booking.status || 'active'}
                                </span>
                                <span className="text-emerald-400 text-xs font-bold">₹{booking.total_price}</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-xs mb-1">{booking.lot_name}</p>
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Slot {booking.slot_number}</span>
                            <span className="uppercase">{booking.vehicle_number || 'N/A'}</span>
                        </div>
                    </div>
                ))}
              </>
          )}
        </div>
      </div>

      {/* Main Content (Map for picking location) */}
      <div className={`
        md:flex-1 md:relative bg-slate-800 
        ${mobileTab === 'map' ? 'fixed inset-0 bottom-[60px] z-20' : 'hidden md:block h-screen'}
      `}>
        <MapView 
            key={mobileTab}
            selectable={true} 
            onLocationSelect={handleLocationSelect} 
            center={newLotLocation || [28.6139, 77.2090]}
        />
        
        {/* Locate Me Button */}
        <button
            onClick={handleLocateMe}
            className="absolute top-4 right-4 bg-white text-slate-900 p-3 rounded-full shadow-lg z-[1000] hover:bg-slate-100 transition-colors"
            title="Use My Location"
        >
            <MapPin size={20} className="fill-current" />
        </button>
        
        {/* AI Insight Overlay */}
        {aiSuggestion && (
            <div className="absolute top-6 left-6 max-w-sm bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-indigo-500/30 shadow-2xl z-[1000] hidden md:block">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Sparkles size={16} />
                    <span className="font-bold text-sm">AI Location Analysis</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {aiSuggestion.analysis}
                </p>
            </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-[1100]">
          <button 
            onClick={() => setMobileTab('dashboard')}
            className={`flex flex-col items-center gap-1 ${mobileTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <Layout size={20} />
              <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button 
            onClick={() => setMobileTab('map')}
            className={`flex flex-col items-center gap-1 ${mobileTab === 'map' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <MapPin size={20} />
              <span className="text-[10px] font-bold">Map</span>
          </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-0 md:p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-slate-900 w-full md:rounded-2xl border-none md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[100dvh] ${step === 2 ? 'md:h-[90vh] max-w-6xl' : 'md:h-auto max-w-lg'}`}
          >
            <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-20 shrink-0">
              <h2 className="text-lg md:text-xl font-bold">
                {step === 1 ? 'Step 1/2: Lot Details' : 'Step 2/2: Design Layout'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white p-2">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
            {step === 1 ? (
                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="p-4 md:p-6 space-y-4">
                {/* ... existing form fields ... */}
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Lot Name</label>
                    <input 
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Address</label>
                    <div className="flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <input 
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            placeholder={isFetchingAddress ? "Fetching address..." : "e.g. 123 Main St"}
                            disabled={isFetchingAddress}
                            />
                            {isFetchingAddress && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (newLotLocation) {
                                        handleLocationSelect(newLotLocation[0], newLotLocation[1]);
                                    } else {
                                        alert("Please click on the map to select a location first.");
                                    }
                                }}
                                className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                title="Use the selected map location address"
                            >
                                <MapPin size={14} /> Set from Map
                            </button>
                            <button 
                                type="button"
                                onClick={getPriceSuggestion}
                                className="bg-indigo-600/20 text-indigo-400 px-3 py-2 rounded-lg hover:bg-indigo-600/30 transition-colors text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                                <Sparkles size={14} /> Suggest Price
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Price (₹/hr)</label>
                        <input 
                        type="number"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.price_per_hour}
                        onChange={e => setFormData({...formData, price_per_hour: e.target.value})}
                        />
                    </div>
                    {/* Total slots will be calculated from layout, but keep as fallback */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Est. Total Slots</label>
                        <input 
                        type="number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.total_slots}
                        onChange={e => setFormData({...formData, total_slots: e.target.value})}
                        placeholder="Auto-calculated if empty"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <textarea 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="pt-4 pb-20 md:pb-0">
                    <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                    Next: Design Layout <Layout size={18} />
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-3">
                        Location: {newLotLocation ? `${newLotLocation[0].toFixed(4)}, ${newLotLocation[1].toFixed(4)}` : 'Not selected (Click on map)'}
                    </p>
                </div>
                </form>
            ) : (
                <div className="flex-1 p-0 md:p-6 flex flex-col h-full overflow-hidden">
                    <div className="px-4 pt-4 mb-2 text-sm text-slate-400 md:hidden shrink-0">
                        Drag elements. Scroll to pan.
                    </div>
                    <div className="flex-1 overflow-hidden border-t md:border border-slate-700 md:rounded-xl relative bg-slate-950">
                        <LotDesigner 
                            layout={layout}
                            onChange={setLayout}
                        />
                    </div>
                    <div className="p-4 flex gap-4 bg-slate-900 border-t border-slate-800 shrink-0">
                        <button 
                            onClick={() => setStep(1)}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleCreateLot}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20"
                        >
                            Finish & Publish
                        </button>
                    </div>
                </div>
            )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
