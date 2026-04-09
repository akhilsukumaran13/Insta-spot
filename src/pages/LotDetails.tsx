import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LotViewer from '../components/LotViewer';
import { apiRequest } from '../lib/api';

export default function LotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lot, setLot] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [duration, setDuration] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  const [showMobileBookingSheet, setShowMobileBookingSheet] = useState(false);

  useEffect(() => {
    const fetchLot = () => {
        apiRequest(`/api/lots/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        })
        .then(data => {
            if (!data || !data.id) return; // Invalid data
            setLot((prev: any) => {
                // If we have a previous state, check if selected slot is still valid
                if (prev && selectedSlot && data.bookedSlots && data.bookedSlots.includes(selectedSlot)) {
                    setSelectedSlot(null);
                    setShowMobileBookingSheet(false);
                    alert("The slot you selected has just been booked by someone else.");
                }
                return data;
            });
        })
        .catch(err => console.error("Polling error:", err));
    };

    fetchLot();
    const interval = setInterval(fetchLot, 5000);
    return () => clearInterval(interval);
  }, [id, selectedSlot]);

  if (!lot) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const handleBack = () => {
    // Navigate to dashboard instead of -1 to ensure we go back to the map
    navigate('/dashboard');
  };

  if (!lot) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  // Safe accessors for lot data
  const pricePerHour = Number(lot.price_per_hour) || 0;
  const totalSlots = Number(lot.total_slots) || 0;
  const address = lot.address || 'Unknown Address';
  const lotName = lot.name || 'Unnamed Lot';

  const handleSlotClick = (slotNum: number) => {
    if (lot.bookedSlots && lot.bookedSlots.includes(slotNum)) return;
    setSelectedSlot(slotNum);
  };

  const handlePayment = async () => {
    if (!vehicleNumber.trim()) {
        alert("Please enter your vehicle number");
        return;
    }

    setIsProcessing(true);
    
    // Simulate Razorpay delay
    setTimeout(async () => {
      try {
        const res = await apiRequest('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id,
            lot_id: lot.id,
            slot_number: selectedSlot,
            duration_hours: duration,
            payment_id: `pay_${Math.random().toString(36).substring(7)}`, // Mock payment ID
            vehicle_number: vehicleNumber
          })
        });
        
        if (res.ok) {
          alert('Booking Successful! Payment Processed via Razorpay (Mock).');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 md:pb-6">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
        <button onClick={handleBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
          <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-lg font-bold leading-tight">{lotName}</h1>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{address}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Desktop Header */}
        <button onClick={handleBack} className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft size={20} /> Back to Map
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Slots Grid */}
          <div className="md:col-span-2">
            <div className="hidden md:flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{lotName}</h1>
                    <p className="text-slate-400 text-sm md:text-base">{address}</p>
                </div>
                <div className="text-right">
                    <span className="block text-emerald-400 font-bold text-xl">₹{pricePerHour}</span>
                    <span className="text-slate-500 text-xs">per hour</span>
                </div>
            </div>

            <div className="bg-slate-900 p-4 md:p-8 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
              <div className="flex justify-between items-center mb-6 text-xs md:text-sm text-slate-400 bg-slate-800/50 p-3 rounded-xl">
                <div className="flex items-center gap-2"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Available</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div> Booked</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div> Selected</div>
              </div>

              <div className="max-h-[60vh] overflow-auto md:max-h-none">
                {lot.layout && lot.layout.length > 0 ? (
                    <LotViewer 
                        layout={lot.layout} 
                        bookedSlots={(lot.bookedSlots || []).map(String)} 
                        selectedSlot={selectedSlot ? selectedSlot.toString() : null} 
                        onSelectSlot={(label) => setSelectedSlot(parseInt(label))} 
                    />
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 md:gap-4">
                        {Array.from({ length: totalSlots || 20 }).map((_, i) => {
                        const slotNum = i + 1;
                        const isBooked = lot.bookedSlots && lot.bookedSlots.includes(slotNum);
                        const isSelected = selectedSlot === slotNum;

                        return (
                            <motion.button
                            key={slotNum}
                            whileHover={{ scale: isBooked ? 1 : 1.05 }}
                            whileTap={{ scale: isBooked ? 1 : 0.95 }}
                            onClick={() => handleSlotClick(slotNum)}
                            disabled={isBooked}
                            className={`
                                aspect-[3/4] rounded-t-xl rounded-b-lg border-2 flex flex-col items-center justify-center relative
                                ${isBooked 
                                ? 'bg-red-500/10 border-red-500/30 text-red-500 cursor-not-allowed' 
                                : isSelected
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/40'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer'
                                }
                            `}
                            >
                            <span className="text-lg font-bold">{slotNum}</span>
                            <span className="text-[10px] uppercase mt-1">
                                {isBooked ? 'Parked' : 'Open'}
                            </span>
                            </motion.button>
                        );
                        })}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Booking Sidebar */}
          <div className="hidden md:block md:col-span-1">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 sticky top-6">
              <BookingFormContent 
                selectedSlot={selectedSlot}
                pricePerHour={pricePerHour}
                duration={duration}
                setDuration={setDuration}
                vehicleNumber={vehicleNumber}
                setVehicleNumber={setVehicleNumber}
                isProcessing={isProcessing}
                onProceed={() => setShowPayment(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <AnimatePresence>
        {selectedSlot && !showMobileBookingSheet && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 z-50 md:hidden rounded-2xl shadow-2xl shadow-black/50"
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Selected Slot</p>
                            <p className="text-2xl font-bold text-white">#{selectedSlot}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowMobileBookingSheet(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
                    >
                        Book Now
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Booking Bottom Sheet */}
      <AnimatePresence>
        {showMobileBookingSheet && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileBookingSheet(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                />
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 z-[70] md:hidden pb-10 max-h-[85vh] overflow-y-auto"
                >
                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6"></div>
                    <BookingFormContent 
                        selectedSlot={selectedSlot}
                        pricePerHour={pricePerHour}
                        duration={duration}
                        setDuration={setDuration}
                        vehicleNumber={vehicleNumber}
                        setVehicleNumber={setVehicleNumber}
                        isProcessing={isProcessing}
                        onProceed={() => {
                            setShowMobileBookingSheet(false);
                            setShowPayment(true);
                        }}
                    />
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Mock Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-slate-900 w-full max-w-md rounded-2xl overflow-hidden"
          >
            <div className="bg-[#2b83ea] p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl">Razorpay Trusted Business</h3>
              <div className="bg-white/20 px-2 py-1 rounded text-xs">Test Mode</div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-slate-500 text-sm">Amount to Pay</p>
                  <p className="text-3xl font-bold text-slate-800">₹{(pricePerHour * duration).toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <CreditCard className="text-slate-600" />
                </div>
              </div>

              <p className="text-slate-500 text-sm mb-4">Select Payment Method</p>
              <div className="space-y-3 mb-8">
                <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`border p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-50 ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {paymentMethod === 'card' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="font-medium">Card (**** 4242)</span>
                </div>
                <div 
                    onClick={() => setPaymentMethod('upi')}
                    className={`border p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-50 ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                        {paymentMethod === 'upi' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className="font-medium">UPI / QR</span>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                  <div className="mb-8 text-center">
                      <div className="bg-white p-4 border border-slate-200 rounded-xl inline-block mb-2">
                          {/* Placeholder QR Code */}
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=merchant@upi&pn=InstaSpot&am=100" alt="UPI QR" className="w-32 h-32" />
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Scan with any UPI App</p>
                      <div className="flex gap-2">
                          <input type="text" placeholder="Enter UPI ID" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
                          <button className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">Verify</button>
                      </div>
                  </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePayment}
                  className="flex-1 py-3 bg-[#2b83ea] text-white rounded-lg font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function BookingFormContent({ selectedSlot, pricePerHour, duration, setDuration, vehicleNumber, setVehicleNumber, isProcessing, onProceed }: any) {
    return (
        <>
            <h3 className="text-xl font-bold mb-6">Booking Summary</h3>
              
            <div className="space-y-4 mb-8">
            <div className="flex justify-between">
                <span className="text-slate-400">Slot Number</span>
                <span className="font-mono font-bold">{selectedSlot || '-'}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-400">Price per Hour</span>
                <span className="font-mono">₹{pricePerHour}</span>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
                <label className="block text-sm text-slate-400 mb-2">Duration (Hours)</label>
                <div className="flex items-center gap-4 bg-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => setDuration(Math.max(1, duration - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded"
                >-</button>
                <span className="flex-1 text-center font-bold">{duration}h</span>
                <button 
                    onClick={() => setDuration(duration + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded"
                >+</button>
                </div>
            </div>

            <div className="pt-4">
                <label className="block text-sm text-slate-400 mb-2">Vehicle Number</label>
                <input 
                    type="text"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                    placeholder="ABC-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800 text-lg font-bold text-emerald-400">
                <span>Total</span>
                <span>₹{(pricePerHour * duration).toFixed(2)}</span>
            </div>
            </div>

            <button
            disabled={!selectedSlot || isProcessing || !vehicleNumber}
            onClick={onProceed}
            className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                ${!selectedSlot || !vehicleNumber
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
                }
            `}
            >
            {isProcessing ? 'Processing...' : 'Proceed to Pay'}
            </button>
        </>
    );
}
