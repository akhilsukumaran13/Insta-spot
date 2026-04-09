import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { Search, MapPin, Navigation, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLots();
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    // Request location immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc); // Center map on initial load
      },
      (error) => {
          console.error('Error getting location:', error);
          if (error.code === 1) { // PERMISSION_DENIED
              alert("Please allow location access to find parking spots near you.");
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
              alert("Location information is unavailable. Please check if your GPS is turned on.");
          }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch for updates
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error('Location watch error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleLocateMe = () => {
      if (!navigator.geolocation) return alert("Geolocation is not supported by your browser");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
            const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
            setUserLocation(newLoc);
            setMapCenter(newLoc); // Force center map
        },
        (error) => {
            alert(`Unable to retrieve your location. Error: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  };

  const fetchLots = async () => {
    try {
      const res = await apiRequest('/api/lots');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLots(data);
      }
    } catch (e) {
      console.error("Failed to fetch lots", e);
    }
  };

  const filteredLots = lots.filter((lot: any) => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lot.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = showAvailableOnly ? lot.available_slots > 0 : true;
    return matchesSearch && matchesAvailability;
  });

  const [showBookings, setShowBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const res = await apiRequest(`/api/bookings/user/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMyBookings(data);
        setShowBookings(true);
      }
    } catch (e) {
      console.error("Failed to fetch bookings", e);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
      // Removed confirm for mobile compatibility
      // if (!confirm("Are you sure you want to cancel this booking?")) return;
      
      try {
          console.log("Cancelling booking:", bookingId);
          const res = await apiRequest(`/api/bookings/${bookingId}/cancel`, {
              method: 'PATCH'
          });
          if (res.ok) {
              // alert("Booking cancelled successfully"); // Removed alert to prevent blocking
              fetchBookings(); // Refresh list
          } else {
              console.error("Failed to cancel booking");
              // alert("Failed to cancel booking");
          }
      } catch (e) {
          console.error(e);
          // alert("Error cancelling booking");
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row relative">
      {/* Sidebar / List View */}
      <div className={`w-full md:w-[400px] bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-60px)] md:h-screen z-10 ${mobileView === 'map' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 pt-12 md:pt-6 border-b border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              InstaSpot
            </h1>
            <div className="flex gap-3">
                <button onClick={fetchLots} className="text-xs text-emerald-400 hover:text-emerald-300">Refresh</button>
                <button onClick={fetchBookings} className="text-xs text-indigo-400 hover:text-indigo-300">My Bookings</button>
                <button onClick={logout} className="text-xs text-slate-500 hover:text-white">Logout</button>
            </div>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search location..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="availableOnly" 
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
              />
              <label htmlFor="availableOnly" className="text-sm text-slate-400 cursor-pointer select-none">
                  Show Available Only
              </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 md:pb-4">
          {filteredLots.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <p>No parking lots found.</p>
            </div>
          ) : (
            filteredLots.map((lot: any) => (
              <div 
                key={lot.id}
                onClick={() => {
                    setSelectedLot(lot);
                    setMobileView('map'); // Switch to map on selection
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedLot?.id === lot.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-900/20' 
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{lot.name}</h3>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full font-medium">
                    ₹{lot.price_per_hour}/hr
                  </span>
                </div>
                <p className="text-slate-400 text-sm flex items-center gap-1 mb-3">
                  <MapPin size={14} /> {lot.address}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Navigation size={12} /> 1.2 km
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${lot.available_slots > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Clock size={12} /> {lot.available_slots} / {lot.total_slots} Slots
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className={`
        md:flex-1 md:relative bg-slate-800 
        ${mobileView === 'map' ? 'fixed inset-0 bottom-[60px] z-20' : 'hidden md:block h-screen'}
      `}>
        <MapView 
            key={mobileView} // Keep key to force re-render if needed, though ResizeObserver handles size
            lots={filteredLots} 
            center={mapCenter || [28.6139, 77.2090]} 
            userLocation={userLocation}
            selectedLot={selectedLot}
            onLotClick={(lot: any) => {
                setSelectedLot(lot);
                setShowDirections(false);
            }}
            destination={showDirections ? selectedLot : null}
        />

        {/* Locate Me Button */}
        <button
            onClick={handleLocateMe}
            className="absolute top-4 right-4 bg-white text-slate-900 p-3 rounded-full shadow-lg z-[1000] hover:bg-slate-100 transition-colors"
            title="Update My Location"
        >
            <Navigation size={20} className="fill-current" />
        </button>
        
        {/* Lot Details Overlay - Mobile Floating Card */}
        <AnimatePresence>
          {selectedLot && (
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-[80px] left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-5 rounded-2xl md:hidden z-[1050] shadow-2xl shadow-black/50"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedLot.name}</h2>
                  <p className="text-slate-400 text-xs">{selectedLot.address}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLot(null);
                  }}
                  className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex gap-4 mb-4 text-sm">
                  <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-500 text-xs block">Price</span>
                    <span className="font-bold text-emerald-400">₹{selectedLot.price_per_hour}/hr</span>
                  </div>
                  <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                    <span className="text-slate-500 text-xs block">Available</span>
                    <span className={`font-bold ${selectedLot.available_slots > 0 ? 'text-white' : 'text-red-400'}`}>
                        {selectedLot.available_slots} slots
                    </span>
                  </div>
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!userLocation) return alert("Please enable location services");
                        setShowDirections(true);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold border border-slate-600 text-indigo-400 text-sm transition-colors"
                  >
                    Get Directions
                  </button>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lot/${selectedLot.id}`);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 text-white text-sm transition-colors"
                  >
                    View Slots
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Floating Card */}
        {selectedLot && (
            <div className="hidden md:block absolute top-6 right-6 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl z-[1000]">
                <div className="flex justify-between items-start mb-1">
                    <h2 className="text-2xl font-bold">{selectedLot.name}</h2>
                    <button onClick={() => setSelectedLot(null)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <p className="text-slate-400 text-sm mb-4">{selectedLot.address}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <span className="text-slate-500 text-xs block">Price</span>
                        <span className="text-xl font-bold text-emerald-400">₹{selectedLot.price_per_hour}</span>
                        <span className="text-xs text-slate-500">/hour</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <span className="text-slate-500 text-xs block">Total Slots</span>
                        <span className="text-xl font-bold text-white">{selectedLot.total_slots}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => {
                            if (!userLocation) return alert("Please enable location services");
                            setShowDirections(true);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all border border-slate-600 flex items-center justify-center gap-2 text-indigo-400"
                    >
                        <Navigation size={18} />
                        Get Directions
                    </button>
                    <button 
                        onClick={() => navigate(`/lot/${selectedLot.id}`)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        <CreditCard size={18} />
                        Book Slot
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-[1100]">
          <button 
            onClick={() => setMobileView('list')}
            className={`flex flex-col items-center gap-1 ${mobileView === 'list' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <div className={`p-1 rounded-lg ${mobileView === 'list' ? 'bg-indigo-500/20' : ''}`}>
                <Search size={20} />
              </div>
              <span className="text-[10px] font-bold">List</span>
          </button>
          <button 
            onClick={() => setMobileView('map')}
            className={`flex flex-col items-center gap-1 ${mobileView === 'map' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <div className={`p-1 rounded-lg ${mobileView === 'map' ? 'bg-indigo-500/20' : ''}`}>
                <MapPin size={20} />
              </div>
              <span className="text-[10px] font-bold">Map</span>
          </button>
      </div>

      {/* My Bookings Modal */}
      {showBookings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold">My Bookings</h2>
                    <button onClick={() => setShowBookings(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {myBookings.length === 0 ? (
                        <p className="text-slate-500 text-center">No bookings found.</p>
                    ) : (
                        myBookings.map((booking: any) => (
                            <div key={booking.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{booking.lot_name}</h3>
                                    <p className="text-slate-400 text-sm">{booking.address}</p>
                                    <div className="flex gap-4 mt-2 text-sm">
                                        <span className="text-indigo-400">Slot {booking.slot_number}</span>
                                        <span className="text-slate-500">
                                            {new Date(booking.start_time).toLocaleDateString()} {new Date(booking.start_time).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-emerald-400">₹{booking.total_price}</div>
                                    <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                                        booking.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {booking.status.toUpperCase()}
                                    </div>
                                    {booking.status === 'active' && (
                                        <button 
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="block mt-2 text-xs text-red-400 hover:text-red-300 underline"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}
