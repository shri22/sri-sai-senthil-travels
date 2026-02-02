"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import S3TLogo from '@/components/S3TLogo';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-bg-dark flex items-center justify-center text-primary">Loading Heritage Discovery...</div>}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState<'selection' | 'details' | 'payment' | 'payment_processing' | 'success'>('selection');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [tempBookingData, setTempBookingData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [config, setConfig] = useState<any>({ defaultAdvancePercentage: 30 }); // Default
    const [distance, setDistance] = useState(100);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('upi');

    // Advanced Filters
    const [vehicleType, setVehicleType] = useState<string>('');
    const [hasAc, setHasAc] = useState<boolean | null>(null);
    const [sortBy, setSortBy] = useState<string>('price_asc');

    // Search params
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const date = searchParams.get('date') || '';
    const endDateParam = searchParams.get('endDate') || '';
    const terrain = searchParams.get('terrain') || 'all';
    const places = searchParams.get('places') || '';

    // Date Filter State
    const [travelDateOverride, setTravelDateOverride] = useState('');
    const travelDate = travelDateOverride || date || '';

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchVehicles = async () => {
        setLoading(true);
        let url = `${API_URL}/bookings?`;
        if (travelDate) url += `travelDate=${travelDate}&`;
        if (endDateParam) url += `endDate=${endDateParam}&`;
        if (terrain) url += `terrain=${terrain}&`;
        if (vehicleType) url += `vehicleType=${vehicleType}&`;
        if (hasAc !== null) url += `hasAc=${hasAc}&`;
        if (sortBy) url += `sortBy=${sortBy}&`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            setVehicles(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();

        // Fetch Settings
        fetch(`${API_URL}/bookings/settings`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setConfig({
                    defaultAdvancePercentage: Number(data.CustomerAdvancePercentage || 30),
                    driverBataPerDay: Number(data.DriverBataPerDay || 500)
                });
            });

        // Auth check (Optional for now)
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/account/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => data && setUser(data));
        }
    }, [travelDate, vehicleType, hasAc, sortBy]);

    const handleBookNow = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setBookingStep('details');
    };

    const startPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name')?.toString();
        const email = formData.get('email')?.toString();
        const phone = formData.get('phone')?.toString();

        const perKmRate = selectedVehicle.pricePerKm || 45;
        const basePrice = selectedVehicle.basePrice || 15000;

        const start = new Date(travelDate);
        const end = endDateParam ? new Date(endDateParam) : start;
        const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        const distanceCost = perKmRate * distance;
        const driverBata = (config?.driverBataPerDay || 500) * numDays;
        const totalAmount = (basePrice * numDays) + distanceCost + driverBata;
        const advanceRequired = totalAmount * (config?.defaultAdvancePercentage / 100 || 0.3);

        const bookingData = {
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            pickupFrom: from,
            destinationTo: to,
            travelDate: travelDate,
            endDate: endDateParam,
            distanceKm: distance,
            vehicleId: selectedVehicle.id,
            totalAmount: totalAmount,
            advancePaid: advanceRequired,
            status: 'PendingPayment'
        };

        setTempBookingData(bookingData);
        setBookingStep('payment');
    };

    const handlePaymentComplete = async () => {
        setLoading(true);
        try {
            // 1. Create Booking (Status: PendingPayment)
            const res = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempBookingData),
            });

            if (res.ok) {
                const booking = await res.json();
                setTempBookingData({ ...tempBookingData, id: booking.id });

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
                            setBookingStep('payment_processing');

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
                                setBookingStep('success');
                            } else {
                                alert("Signature verification failed.");
                                setBookingStep('payment');
                            }
                        },
                        prefill: {
                            name: user?.name,
                            email: user?.email
                        },
                        theme: {
                            color: "#EAB308"
                        }
                    };

                    const rzp = new (window as any).Razorpay(options);
                    rzp.open();
                } else {
                    const err = await initRes.json();
                    alert(err.error || "Payment initiation failed.");
                }
            } else {
                const err = await res.json();
                alert(err.error || "Booking failed.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-bg-dark text-text-main pb-20">
            <Navbar />

            <div className="pt-24 md:pt-32 max-w-[1200px] mx-auto px-6 md:px-8">
                {bookingStep === 'selection' && (
                    <div className="space-y-12">
                        <div className="text-center space-y-6">
                            <div className="space-y-4">
                                <h1 className="text-3xl md:text-6xl font-serif font-bold text-white leading-tight">Heritage <span className="text-primary italic">Companion</span></h1>

                                {/* Search Summary Card */}
                                <div className="inline-flex flex-wrap items-center justify-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/60">
                                    <div className="flex items-center gap-2"><span className="text-primary">FROM:</span> {from || 'ANY'}</div>
                                    <div className="hidden md:block w-[1px] h-4 bg-white/10"></div>
                                    <div className="flex items-center gap-2"><span className="text-primary">TO:</span> {to || 'ANY'}</div>
                                    <div className="hidden md:block w-[1px] h-4 bg-white/10"></div>
                                    <div className="flex items-center gap-2"><span className="text-primary">DATES:</span> {travelDate} {endDateParam ? `- ${endDateParam}` : ''}</div>
                                    {endDateParam && (
                                        <>
                                            <div className="hidden md:block w-[1px] h-4 bg-white/10"></div>
                                            <div className="flex items-center gap-2"><span className="text-primary">DURATION:</span> {Math.max(1, Math.ceil((new Date(endDateParam).getTime() - new Date(travelDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} DAYS</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Filters UI */}
                            <div className="glass-dark p-6 rounded-[32px] border border-white/10 max-w-5xl mx-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2 text-left">
                                        <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Vehicle Type</label>
                                        <select
                                            value={vehicleType}
                                            onChange={(e) => setVehicleType(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-primary appearance-none"
                                        >
                                            <option value="" className="bg-bg-dark">All Categories</option>
                                            <option value="Car" className="bg-bg-dark">Cars / SUVs</option>
                                            <option value="Van" className="bg-bg-dark">Luxury Vans</option>
                                            <option value="Mini Bus" className="bg-bg-dark">Mini Buses</option>
                                            <option value="Bus" className="bg-bg-dark">Large Buses</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 text-left">
                                        <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Comfort</label>
                                        <select
                                            value={hasAc === null ? '' : hasAc.toString()}
                                            onChange={(e) => setHasAc(e.target.value === '' ? null : e.target.value === 'true')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-primary appearance-none"
                                        >
                                            <option value="" className="bg-bg-dark">Any (AC/Non-AC)</option>
                                            <option value="true" className="bg-bg-dark">Air Conditioned (A/C)</option>
                                            <option value="false" className="bg-bg-dark">Non Air Conditioned</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 text-left">
                                        <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Sort By</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-primary appearance-none"
                                        >
                                            <option value="price_asc" className="bg-bg-dark">Price: Low to High</option>
                                            <option value="rating_desc" className="bg-bg-dark">Best Rated Agency</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 text-left">
                                        <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Travel Date</label>
                                        <input
                                            type="date"
                                            value={travelDate}
                                            onChange={(e) => setTravelDateOverride(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-primary focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {vehicles.map((v) => (
                                    <div key={v.id} className="group glass-dark rounded-[32px] overflow-hidden border border-white/5 hover:border-primary/30 transition-all hover:scale-[1.02]">
                                        <div className="h-48 md:h-56 bg-white/5 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                            <img
                                                src={v.type === 'Van' ? '/premium_heritage_van_v12_1769924009117.png' :
                                                    v.type === 'Bus' ? '/luxury_volvo_coach_1769923988107.png' :
                                                        v.type === 'Car' ? '/images/hero.png' :
                                                            '/modern_minibus_heritage_edition_1769924031275.png'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt={v.name}
                                            />
                                            <div className="absolute top-4 right-4 z-20">
                                                <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-bold text-primary border border-primary/20">
                                                    ★ {v.averageRating.toFixed(1)}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-6 z-20 flex gap-2">
                                                <span className="px-3 py-1 bg-primary text-black text-[9px] md:text-[10px] uppercase tracking-widest font-bold rounded-full">
                                                    {v.type}
                                                </span>
                                                {v.hasAc && (
                                                    <span className="px-3 py-1 bg-white/10 text-white text-[9px] md:text-[10px] uppercase tracking-widest font-bold rounded-full border border-white/10">
                                                        A/C
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-6 md:p-8 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-serif font-bold text-white leading-tight">{v.name}</h3>
                                                    <p className="text-primary/60 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold mt-1">BY {v.company}</p>
                                                    <p className="text-white/30 text-[8px] uppercase font-bold mt-1">{v.capacity} SEATS</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-primary font-bold text-lg md:text-xl">₹{v.pricePerKm}</p>
                                                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Per KM</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleBookNow(v)}
                                                className="w-full py-4 bg-white/5 hover:bg-primary hover:text-black border border-white/10 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all"
                                            >
                                                Reserve Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {vehicles.length === 0 && !loading && (
                            <div className="text-center py-20 space-y-4">
                                <p className="text-5xl">🚐</p>
                                <p className="text-white/40 font-serif italic text-xl">No vehicles found.</p>
                                <button onClick={() => { setVehicleType(''); setHasAc(null); }} className="text-primary hover:underline text-sm uppercase tracking-widest font-bold">Clear All Filters</button>
                            </div>
                        )}
                    </div>
                )}

                {bookingStep === 'details' && (
                    <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 pb-12">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">Finalize <span className="text-primary italic">Reservation</span></h1>
                            <p className="text-text-muted text-sm md:text-base px-6">You are booking the {selectedVehicle.name}</p>
                        </div>

                        <form onSubmit={startPayment} className="glass-dark p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-white/10 space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Full Name</label>
                                    <input name="name" required type="text" defaultValue={user?.name || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-white/10" placeholder="Enter name" />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Phone Number</label>
                                    <input name="phone" required type="tel" defaultValue={user?.phone || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-white/10" placeholder="94438 56913" />
                                </div>
                                <div className="space-y-2 text-left md:col-span-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Email Address</label>
                                    <input name="email" required type="email" defaultValue={user?.email || ''} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-white/10" placeholder="email@example.com" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 text-left">
                                <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold flex justify-between">
                                    <span>Estimated Trip Distance</span>
                                    <span className="text-white italic">{distance} KM</span>
                                </label>
                                <input
                                    type="range" min="50" max="1000" step="50"
                                    value={distance}
                                    onChange={(e) => setDistance(Number(e.target.value))}
                                    className="w-full accent-primary bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <button type="submit" className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[11px] md:text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all">
                                Proceed to Payment
                            </button>
                        </form>
                    </div>
                )}

                {bookingStep === 'payment' && (
                    <div className="max-w-xl mx-auto space-y-8 animate-fade-in pb-20 px-6">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-serif font-bold text-white">Heritage <span className="text-primary italic">Secure Checkout</span></h2>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Encrypted via S3T Legacy Protocol</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-6">
                                <div className="glass-dark p-6 md:p-8 rounded-[32px] border border-white/10 space-y-6">
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-white/60">Choose Payment Method</h3>

                                    <div className="space-y-3">
                                        {[
                                            { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: '📱' },
                                            { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                                            { id: 'netbanking', label: 'Net Banking', icon: '🏦' }
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedPaymentMethod(method.id)}
                                                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedPaymentMethod === method.id
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl">{method.icon}</span>
                                                    <span className="text-sm font-bold uppercase tracking-widest">{method.label}</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method.id ? 'border-primary' : 'border-white/20'}`}>
                                                    {selectedPaymentMethod === method.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {selectedPaymentMethod === 'card' && (
                                        <div className="space-y-4 pt-4 animate-fade-in">
                                            <input className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="Card Number" defaultValue="4242 4242 4242 4242" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="MM/YY" defaultValue="12/28" />
                                                <input className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary focus:outline-none" placeholder="CVV" defaultValue="***" />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePaymentComplete}
                                        className="w-full py-5 bg-primary text-black rounded-2xl text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all mt-6 shadow-xl shadow-primary/20"
                                    >
                                        Authorize Secure Payment
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-dark p-6 rounded-[32px] border border-primary/20">
                                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-4">Fare Breakdown</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Advance Payment</span>
                                            <span className="text-white font-bold">₹{tempBookingData.advancePaid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-white/40">Taxes (GST)</span>
                                            <span className="text-white font-bold">Included</span>
                                        </div>
                                        <div className="h-[1px] bg-white/10 my-2" />
                                        <div className="flex justify-between text-base">
                                            <span className="text-white font-serif italic">Total Payable</span>
                                            <span className="text-primary font-bold">₹{tempBookingData.advancePaid.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold text-center px-4 leading-relaxed">
                                    By clicking authorize, you agree to our heritage travel terms and cancellation policy.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {bookingStep === 'payment_processing' && (
                    <div className="max-w-md mx-auto space-y-8 py-20 text-center">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">🔒</div>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white italic">Verifying Payment</h2>
                        <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Communicating with Banking Gateway...</p>
                        <div className="pt-4 flex justify-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}

                {bookingStep === 'success' && (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
                        <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary animate-pulse">
                            <S3TLogo className="w-16 h-auto" />
                        </div>
                        <h1 className="text-5xl font-serif font-bold text-white">Journey <span className="text-primary italic">Confirmed!</span></h1>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => window.open(`${API_URL}/bookings/${tempBookingData?.id || 'latest'}/invoice`)}
                                className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold uppercase tracking-widest transition-all"
                            >
                                Download Receipt
                            </button>
                            <Link href="/" className="px-10 py-4 bg-primary text-black rounded-full font-bold uppercase tracking-widest hover:bg-white transition-all">Return Home</Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
