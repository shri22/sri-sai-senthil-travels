"use client";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";

export default function BookNowPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [bus, setBus] = useState<any>(null);
    const [bookingStep, setBookingStep] = useState(1); // 1: Info, 2: Payment, 3: Success, 4: Processing
    const [userData, setUserData] = useState({ name: '', phone: '', email: '', pickup: '' });
    const [loading, setLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('upi');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const vehicleRes = await fetch(`${API_URL}/bookings`);
                if (vehicleRes.ok) {
                    const vehicles = await vehicleRes.json();
                    const selected = vehicles.find((v: any) => v.id === Number(params.id));
                    setBus(selected);
                }
            } catch (err) {
                console.error("Fetch vehicle error:", err);
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/account/me`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.ok ? res.json() : null)
                .then(data => data && setUserData(prev => ({ ...prev, name: data.name, email: data.email })));
        }

        fetchVehicle();
    }, [params.id, API_URL]);

    if (!bus) return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-primary italic px-6">Summoning heritage fleet...</div>;

    const terrain = searchParams.get('terrain') || 'plain';
    const priceMultiplier = terrain === 'hills' ? 1.25 : 1;
    const finalPrice = Math.round(bus.basePrice * priceMultiplier);
    const advanceAmount = Math.round(finalPrice * 0.3);

    const handleBooking = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingStep(2);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Booking (Pending Payment)
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicleId: bus.id,
                    customerName: userData.name,
                    customerEmail: userData.email,
                    customerPhone: userData.phone,
                    pickupFrom: userData.pickup,
                    destinationTo: searchParams.get('to') || 'Legacy Destination',
                    travelDate: searchParams.get('date') || new Date().toISOString(),
                    distanceKm: 100,
                    totalAmount: finalPrice,
                    advancePaid: advanceAmount
                }),
            });

            if (response.ok) {
                const booking = await response.json();

                // 2. Initiate Real Razorpay Order
                const initRes = await fetch(`${API_URL}/payments/initiate/${booking.id}`);
                if (initRes.ok) {
                    const orderData = await initRes.json();

                    const options = {
                        key: orderData.key,
                        amount: orderData.amount,
                        currency: orderData.currency,
                        name: "Sri Sai Senthil Travels",
                        description: "Heritage Fleet Reservation",
                        order_id: orderData.orderId,
                        handler: async function (response: any) {
                            setBookingStep(4); // Processing UI

                            const confirmRes = await fetch(`${API_URL}/payments/confirm`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    bookingId: booking.id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature
                                })
                            });

                            if (confirmRes.ok) {
                                setBookingStep(3); // Success
                            } else {
                                alert("Signature verification failed.");
                                setBookingStep(2);
                            }
                        },
                        prefill: {
                            name: userData.name,
                            email: userData.email,
                            contact: userData.phone
                        },
                        theme: {
                            color: "#EAB308"
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.open();
                }
            } else {
                alert("Failed to initiate booking.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-bg-dark">
            <Navbar />

            <div className="pt-32 pb-20 container max-w-4xl mx-auto px-6">
                {bookingStep === 1 && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-1 w-12 bg-primary"></div>
                            <h1 className="text-3xl md:text-5xl font-serif font-bold italic text-white leading-tight">Confirm <span className="text-primary">Journey</span></h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="md:col-span-2 space-y-8">
                                <form onSubmit={handleBooking} className="glass-dark p-8 rounded-[32px] border border-white/10 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Full Name</label>
                                            <input required placeholder="Your Name" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none transition-all" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Phone Number</label>
                                            <input required placeholder="+91 00000 00000" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none transition-all" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Pickup Location</label>
                                        <input required placeholder="Hotel or Landmark" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none transition-all" value={userData.pickup} onChange={e => setUserData({ ...userData, pickup: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Email Address</label>
                                        <input required type="email" placeholder="email@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none transition-all" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} />
                                    </div>
                                    <button type="submit" className="w-full bg-primary text-black font-bold py-5 rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20">
                                        Continue to Payment
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-dark p-6 rounded-3xl border border-primary/20">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-4">Fare Summary</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/60">Base Fare ({bus.type})</span>
                                            <span className="text-sm font-bold text-white">₹{bus.basePrice}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                            <span className="text-sm text-white/60">Terrain ({terrain})</span>
                                            <span className="text-sm font-bold text-primary">{terrain === 'hills' ? '+25%' : '+0%'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-bold text-white">Total Pay</span>
                                            <span className="text-2xl font-bold text-primary italic">₹{finalPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {bookingStep === 2 && (
                    <div className="animate-fade-in max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-serif font-bold text-white italic mb-2">Secure <span className="text-primary">Payment Portal</span></h2>
                            <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Complete your booking for {bus.name}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="glass-dark p-8 rounded-[40px] border border-white/10 space-y-8">
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-white/60">Select Payment Method</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'upi', label: 'UPI Payment', desc: 'GPay, PhonePe, Paytm', icon: '📱' },
                                            { id: 'card', label: 'Cards', desc: 'Credit / Debit Cards', icon: '💳' },
                                            { id: 'net', label: 'Net Banking', desc: 'All Major Indian Banks', icon: '🏦' },
                                            { id: 'wallet', label: 'Wallets', desc: 'Amazon Pay, Mobikwik', icon: '👛' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedPaymentMethod(m.id)}
                                                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${selectedPaymentMethod === m.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <span className="text-2xl">{m.icon}</span>
                                                <div>
                                                    <p className={`text-xs font-bold uppercase tracking-widest ${selectedPaymentMethod === m.id ? 'text-primary' : 'text-white'}`}>{m.label}</p>
                                                    <p className="text-[9px] text-white/40 uppercase font-bold mt-0.5">{m.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {selectedPaymentMethod === 'card' && (
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 animate-fade-in">
                                            <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="Card Number" defaultValue="4242 4242 4242 4242" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="MM/YY" defaultValue="12/28" />
                                                <input className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="CVV" defaultValue="***" />
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={handlePayment} disabled={loading} className="w-full bg-primary text-black font-bold py-5 rounded-2xl hover:bg-white transition-all uppercase tracking-[0.3em] text-sm shadow-xl shadow-primary/20">
                                        {loading ? 'Finalizing...' : `Pay Securely (₹${advanceAmount.toLocaleString()})`}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-dark p-8 rounded-[40px] border border-primary/20 space-y-6">
                                    <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold">Booking Details</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Vehicle</p>
                                            <p className="text-sm font-bold text-white">{bus.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Total Trip Value</p>
                                            <p className="text-sm font-bold text-white">₹{finalPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Advance to Pay Now</p>
                                            <p className="text-2xl font-serif font-bold text-primary italic">₹{advanceAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
                                    <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-bold text-center leading-relaxed">Your data is secured with SSL Encryption.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {bookingStep === 4 && (
                    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🛡️</div>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white mt-8 mb-4 italic">Verifying Payment</h2>
                        <p className="text-text-muted max-w-sm uppercase tracking-widest text-[10px] font-bold">Waiting for your bank's confirmation...</p>
                        <p className="text-white/20 text-[9px] mt-12 font-bold uppercase tracking-widest">Do not refresh this page.</p>
                    </div>
                )}

                {bookingStep === 3 && (
                    <div className="animate-fade-in flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mb-10 border border-green-500/30">
                            <span className="text-4xl text-green-500">✓</span>
                        </div>
                        <h2 className="text-5xl font-serif font-bold text-white mb-4 italic">Booking Confirmed!</h2>
                        <p className="text-text-muted max-w-md mb-12">Thank you, <span className="text-white font-bold">{userData.name}</span>. A notification has been sent to Sri Sai Senthil Travels. We will contact you at <span className="text-white font-bold">{userData.phone}</span> shortly.</p>

                        <button onClick={() => router.push('/')} className="px-12 py-5 bg-primary text-black font-bold rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-sm">
                            Return Home
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
