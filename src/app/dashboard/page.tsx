"use client";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import S3TLogo from "@/components/S3TLogo";

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [bookings, setBookings] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [fleet, setFleet] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [partnerName, setPartnerName] = useState('');
    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [showManualBookingForm, setShowManualBookingForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [manualDates, setManualDates] = useState({ start: '', end: '' });
    const [availableIds, setAvailableIds] = useState<number[] | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchAll = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch User Info
                const meRes = await fetch(`${API_URL}/account/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!meRes.ok) {
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }
                const meData = await meRes.json();
                setPartnerName(meData.name);

                // Fetch Partner Data
                const [bookRes, fleetRes, reportRes] = await Promise.all([
                    fetch(`${API_URL}/partners/my-bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/partners/my-fleet`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/partners/reports/profit-loss`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (bookRes.ok) setBookings(await bookRes.json());
                if (fleetRes.ok) setFleet(await fleetRes.json());
                if (reportRes.ok) setReportData(await reportRes.json());

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [router]);

    useEffect(() => {
        if (!manualDates.start) {
            setAvailableIds(null);
            return;
        }
        const checkAvailability = async () => {
            const res = await fetch(`${API_URL}/bookings?travelDate=${manualDates.start}&endDate=${manualDates.end || manualDates.start}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableIds(data.map((v: any) => v.id));
            }
        };
        checkAvailability();
    }, [manualDates]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const vehicleData = {
            name: f.get('name'),
            number: f.get('number'),
            type: f.get('type'),
            hasAc: f.get('hasAc') === 'true',
            capacity: Number(f.get('capacity')),
            basePrice: Number(f.get('basePrice')),
            pricePerKm: Number(f.get('pricePerKm')),
            mileage: Number(f.get('mileage')), // Added mileage
            status: 'Active'
        };

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/partners/my-fleet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(vehicleData),
        });

        if (res.ok) {
            setShowAddVehicleForm(false);
            window.location.reload();
        }
    };

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformFee = totalRevenue * 0.15;
    const currentBalance = totalRevenue - platformFee;

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-bg-dark flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-bg-card p-8 flex flex-col justify-between hidden lg:flex h-screen sticky top-0">
                <div className="space-y-12">
                    <div className="flex flex-col items-start gap-4">
                        <S3TLogo className="w-20 h-auto" />
                        <div>
                            <span className="font-serif text-2xl font-bold text-white block uppercase tracking-tight">S3T Partner</span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Heritage Operator</span>
                        </div>
                    </div>

                    <nav className="space-y-4">
                        {['dashboard', 'fleet', 'reports', 'whatsapp'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-3 text-sm w-full text-left transition-all capitalize ${activeTab === tab ? 'text-primary font-bold' : 'text-white/40 hover:text-white'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-primary shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'border border-white/20'}`} /> {tab}
                            </button>
                        ))}
                        <button onClick={handleLogout} className="flex items-center gap-3 text-sm w-full text-left text-red-500/60 hover:text-red-500 pt-8 transition-colors">
                            <span className="w-2 h-2 rounded-full border border-red-500/20" /> Logout Security
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto relative w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-white capitalize leading-tight">
                            {activeTab === 'dashboard' ? `Welcome, ${partnerName.split(' ')[0]}` : activeTab.replace('-', ' ')}
                        </h1>
                        <p className="text-white/30 mt-1 uppercase tracking-widest font-bold text-[10px]">Operational HQ Console</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        {activeTab === 'fleet' && (
                            <button onClick={() => setShowAddVehicleForm(true)} className="flex-1 md:flex-none px-6 py-3 bg-primary text-black rounded-xl text-[10px] uppercase font-bold tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all">Add Vehicle</button>
                        )}
                        {activeTab === 'dashboard' && (
                            <button onClick={() => setShowManualBookingForm(true)} className="flex-1 md:flex-none px-6 py-3 bg-primary text-black rounded-xl text-[10px] uppercase font-bold tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all">Manual Entry</button>
                        )}
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="animate-fade-in space-y-12">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Bookings</p>
                                <h3 className="text-5xl font-bold text-white">{bookings.length}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Gross Result</p>
                                <h3 className="text-5xl font-bold text-primary italic">₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-primary/20 text-center bg-primary/5">
                                <p className="text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">Ledger Balance</p>
                                <h3 className="text-5xl font-bold text-white">₹{currentBalance.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="glass-dark rounded-[32px] border border-white/5 p-8">
                            <h2 className="text-2xl font-serif font-bold text-white mb-8 italic">Recent Heritage Activity</h2>
                            <div className="space-y-4">
                                {bookings.map(book => (
                                    <div key={book.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/[0.07] transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl">🛡️</div>
                                            <div>
                                                <h4 className="font-bold text-white">ID: {book.id}</h4>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{new Date(book.travelDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Customer</p>
                                            <p className="text-white font-bold">{book.customerName}</p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Revenue</p>
                                                <p className="text-xl text-primary font-bold italic">₹{book.totalAmount?.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedBooking(book); setShowExpenseForm(true); }}
                                                className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-primary hover:text-black rounded-lg text-[9px] uppercase font-bold transition-all"
                                            >
                                                Add Expense
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'fleet' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                        {fleet.map(vehicle => (
                            <div key={vehicle.id} className="glass-dark p-8 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all relative">
                                <div className="absolute top-8 right-8 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-bold uppercase border border-green-500/20">Active</div>
                                <h3 className="text-2xl font-bold text-white italic mb-2 tracking-tight">{vehicle.name}</h3>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-8">{vehicle.number}</p>
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Capacity</span><span className="text-white">{vehicle.capacity} Seats</span></div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Pricing</span><span className="text-primary italic">₹{vehicle.pricePerKm}/KM</span></div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Category</span><span className="text-white">{vehicle.type}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'reports' && reportData && (
                    <div className="animate-fade-in space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Total Revenue</p>
                                <h3 className="text-4xl font-bold text-white">₹{reportData.totalRevenue.toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Total Diesel (Calc)</p>
                                <h3 className="text-4xl font-bold text-red-500/60">₹{reportData.totalCalculatedFuelCost.toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Total Other Exp</p>
                                <h3 className="text-4xl font-bold text-red-500/80">₹{reportData.totalExpenses.toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-primary/20 bg-primary/5">
                                <p className="text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">Net Profit</p>
                                <h3 className="text-4xl font-bold text-primary italic">₹{reportData.totalNetProfit.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div className="glass-dark rounded-[32px] border border-white/5 p-8 md:p-12">
                            <h2 className="text-3xl font-serif font-bold text-white mb-10 italic">Heritage Profit & Loss Ledger</h2>
                            <div className="space-y-6">
                                {reportData.trips.map((trip: any) => (
                                    <div key={trip.bookingId} className="flex flex-col xl:flex-row justify-between p-8 bg-white/5 rounded-3xl border border-white/5 gap-8 hover:bg-white/[0.08] transition-all">
                                        <div className="min-w-[200px]">
                                            <p className="text-[9px] text-primary uppercase font-bold tracking-widest mb-1">Journey #{trip.bookingId} ({trip.status})</p>
                                            <h4 className="text-white font-bold text-xl">{trip.customer}</h4>
                                            <p className="text-xs text-white/40 font-bold mt-1">{new Date(trip.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wide">{trip.places}</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Metrics</p>
                                                <p className="text-white text-sm font-bold">{trip.distanceKm} KM / {trip.days} Days</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Revenue</p>
                                                <p className="text-white text-sm font-bold">₹{trip.revenue.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Fuel (Est)</p>
                                                <p className="text-red-500/60 text-sm font-bold">₹{trip.calculatedFuelCost.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Other Exp</p>
                                                <p className="text-red-500/80 text-sm font-bold">₹{trip.actualExpenses.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="xl:pl-8 xl:border-l xl:border-white/5 text-right flex flex-col justify-center">
                                            <p className="text-[9px] uppercase text-primary font-bold tracking-tighter mb-1">Net Earnings</p>
                                            <p className={`text-2xl font-bold italic ${trip.netProfit >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                ₹{trip.netProfit.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'whatsapp' && (
                    <div className="animate-fade-in max-w-4xl space-y-8">
                        <div className="glass-dark p-10 rounded-[40px] border border-white/5 space-y-8">
                            <div className="flex gap-8 items-start">
                                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl">💬</div>
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-white">WhatsApp Operating Center</h2>
                                    <p className="text-white/40 mt-1 uppercase tracking-widest font-bold text-[10px]">Automated Heritage Communications</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                                    <h4 className="text-lg font-bold text-white">Daily Operational Report</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Send a high-level briefing of today's journeys, customer details, and vehicle assignments directly to your registered phone.</p>
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_URL}/partners/whatsapp/daily-report`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) alert("Daily Report triggered successfully.");
                                        }}
                                        className="w-full py-4 bg-green-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                                    >
                                        Trigger Daily Report
                                    </button>
                                </div>

                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6 opacity-60">
                                    <h4 className="text-lg font-bold text-white">Booking Notifications</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Automatically sends confirmation templates to customers and vehicle assignment alerts to drivers.</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-6 bg-primary/20 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div></div>
                                        <span className="text-[10px] text-primary uppercase font-bold">Always On</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODALS */}
                {showAddVehicleForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-xl p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic">Register Heritage Asset</h3>
                                <button onClick={() => setShowAddVehicleForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Asset Name</label>
                                    <input name="name" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Heritage Luxury Coach" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Plate Number</label>
                                    <input name="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="TN 01 AB 1234" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Capacity</label>
                                    <input name="capacity" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Category</label>
                                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="Car" className="bg-bg-dark">Car / SUV</option>
                                        <option value="Van" className="bg-bg-dark">Luxury Van</option>
                                        <option value="Mini Bus" className="bg-bg-dark">Mini Bus</option>
                                        <option value="Bus" className="bg-bg-dark">Heritage Coach</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">AC / Non-AC</label>
                                    <select name="hasAc" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="true" className="bg-bg-dark">Air Conditioned</option>
                                        <option value="false" className="bg-bg-dark">Non-AC</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Base Price (₹)</label>
                                    <input name="basePrice" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Price / KM (₹)</label>
                                    <input name="pricePerKm" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Mileage (KM/L)</label>
                                    <input name="mileage" type="number" step="0.1" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="12.5" />
                                </div>
                                <button type="submit" className="sm:col-span-2 py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20 mt-4">Confirm Registration</button>
                            </form>
                        </div>
                    </div>
                )}

                {showManualBookingForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-2xl p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic capitalize">Manual Heritage Entry</h3>
                                <button onClick={() => setShowManualBookingForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.target as HTMLFormElement);
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${API_URL}/partners/manual-booking`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                        vehicleId: Number(f.get('vehicleId')),
                                        customerName: f.get('customerName'),
                                        customerPhone: f.get('customerPhone'),
                                        pickupFrom: f.get('from'),
                                        destinationTo: f.get('to'),
                                        places: f.get('places'),
                                        travelDate: f.get('startDate'),
                                        endDate: f.get('endDate'),
                                        numDays: Number(f.get('numDays')),
                                        totalAmount: Number(f.get('amount')),
                                        advancePaid: Number(f.get('advance')),
                                        paymentMethod: f.get('paymentMethod'),
                                        balanceStatus: f.get('balanceStatus'),
                                        inclusions: Array.from(f.getAll('inclusions')).join(', ')
                                    })
                                });
                                if (res.ok) {
                                    setShowManualBookingForm(false);
                                    window.location.reload();
                                }
                            }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Select Vehicle</label>
                                    <select name="vehicleId" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none appearance-none cursor-pointer">
                                        <option value="" className="bg-bg-dark">-- Choose Available Asset --</option>
                                        {fleet
                                            .filter(v => availableIds === null || availableIds.includes(v.id))
                                            .map(v => (
                                                <option key={v.id} value={v.id} className="bg-bg-dark">
                                                    {v.name} ({v.number})
                                                </option>
                                            ))
                                        }
                                    </select>
                                    {!manualDates.start && <p className="text-[8px] text-white/20 uppercase font-bold mt-1 italic">Enter dates first to see available vehicles.</p>}
                                    {manualDates.start && availableIds?.length === 0 && <p className="text-[8px] text-red-500 uppercase font-bold mt-1 italic">No vehicles available for these dates.</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Customer Name</label>
                                    <input name="customerName" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Aditya Roy" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Phone Number</label>
                                    <input name="customerPhone" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="+91 98765 43210" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Pickup From</label>
                                    <input name="from" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Chennai" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Destination To</label>
                                    <input name="to" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Madurai" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Start Date</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        required
                                        onChange={(e) => setManualDates({ ...manualDates, start: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">End Date</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        required
                                        onChange={(e) => setManualDates({ ...manualDates, end: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Total Days</label>
                                    <input name="numDays" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="3" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Total Amount (₹)</label>
                                    <input name="amount" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="15000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Advance Received (₹)</label>
                                    <input name="advance" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="4500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Payment Via</label>
                                    <select name="paymentMethod" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none">
                                        <option value="Cash" className="bg-bg-dark">Cash Payment</option>
                                        <option value="Online" className="bg-bg-dark">Online Transfer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Balance Logic</label>
                                    <select name="balanceStatus" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none">
                                        <option value="Pending" className="bg-bg-dark">Pending / Not Set</option>
                                        <option value="Cash on Tour Date" className="bg-bg-dark">Cash on Tour Date</option>
                                        <option value="Paid" className="bg-bg-dark">Already Paid Fully</option>
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Places to Visit</label>
                                    <input name="places" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Meenakshi Temple, Palani, Kodaikanal" />
                                </div>
                                <div className="space-y-4 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Heritage Inclusions</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {['Driver', 'Fastag', 'Toll', 'Permit', 'Others'].map(inc => (
                                            <label key={inc} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" name="inclusions" value={inc} defaultChecked className="hidden peer" />
                                                <div className="w-4 h-4 rounded border border-white/20 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center text-[10px] text-black">✓</div>
                                                <span className="text-[10px] text-white/40 group-hover:text-white transition-colors">{inc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="sm:col-span-2 py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20 mt-4">Record Heritage Trip</button>
                            </form>
                        </div>
                    </div>
                )}

                {showExpenseForm && selectedBooking && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-serif font-bold text-white italic">Record Operation Cost</h3>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Booking #{selectedBooking.id}</p>
                                </div>
                                <button onClick={() => setShowExpenseForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.target as HTMLFormElement);
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${API_URL}/bookings/${selectedBooking.id}/expenses`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                        type: f.get('type'),
                                        amount: Number(f.get('amount')),
                                        description: f.get('description')
                                    })
                                });
                                if (res.ok) {
                                    setShowExpenseForm(false);
                                    window.location.reload();
                                }
                            }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Expense Category</label>
                                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="Fuel" className="bg-bg-dark">Heritage Diesel</option>
                                        <option value="Toll" className="bg-bg-dark">Toll / Fastag</option>
                                        <option value="Permit" className="bg-bg-dark">State Permit</option>
                                        <option value="Bata" className="bg-bg-dark">Driver Bata</option>
                                        <option value="Maintenance" className="bg-bg-dark">Miscellaneous</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Amount (₹)</label>
                                    <input name="amount" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="2500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Description</label>
                                    <textarea name="description" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none h-24" placeholder="Fuel refill at Shell Station..." />
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20">Authorize Expense</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
