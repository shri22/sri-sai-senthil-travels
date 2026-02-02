"use client";
import { useState, useEffect } from "react";
import Link from 'next/link';
import Navbar from "@/components/Navbar";
import S3TLogo from "@/components/S3TLogo";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('partners');
    const [config, setConfig] = useState<any>({ defaultAdvancePercentage: 30, rateRules: { commissionPercentage: 15, driverBataPerDay: 500, tollFastagDefault: 200, permitDefault: 500 }, cashPaymentsEnabled: true });
    const [partners, setPartners] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [fleet, setFleet] = useState<any[]>([]);
    const [configItems, setConfigItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>({ totalRevenue: 0, totalFuelCost: 0, totalExpenses: 0, totalNetProfit: 0, trips: [] });
    const [reviews, setReviews] = useState<any[]>([]);

    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [showManualBookingForm, setShowManualBookingForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showCloseTripForm, setShowCloseTripForm] = useState(false);

    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [editingBooking, setEditingBooking] = useState<any>(null);
    const [manualDates, setManualDates] = useState({ start: '', end: '' });
    const [availableIds, setAvailableIds] = useState<number[] | null>(null);
    const [filterPartner, setFilterPartner] = useState<string>('All');

    const API_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

    const handlePrintAgreement = (booking: any) => {
        window.open(`${API_URL}/bookings/${booking.id}/agreement`, '_blank');
    };

    const handleShareAgreement = (booking: any) => {
        const url = `${window.location.origin}${API_URL}/bookings/${booking.id}/agreement`;
        if (navigator.share) {
            navigator.share({
                title: 'S3T Heritage Booking Agreement',
                text: `Booking Agreement for Heritage Trip #${booking.id}`,
                url: url
            });
        } else {
            window.open(`https://wa.me/${booking.customerPhone}?text=${encodeURIComponent(`Greetings from S3T Travels! Your Agreement: ${url}`)}`, '_blank');
        }
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const [partRes, bookRes, fleetRes, configsRes, reportRes, reviewsRes] = await Promise.all([
                    fetch(`${API_URL}/admin/partners`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/fleet`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/config`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/reports/profit-loss`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/reviews`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (partRes.ok) setPartners(await partRes.json());
                if (bookRes.ok) setBookings(await bookRes.json());
                if (fleetRes.ok) setFleet(await fleetRes.json());
                if (configsRes.ok) setConfigItems(await configsRes.json());
                if (reportRes.ok) setReportData(await reportRes.json());
                if (reviewsRes.ok) setReviews(await reviewsRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, [router]);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/bookings/${selectedBooking.id}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                amount: Number(f.get('amount')),
                paymentMode: f.get('paymentMode'),
                notes: f.get('notes'),
                collectedBy: 'Admin'
            })
        });

        if (res.ok) {
            setShowPaymentForm(false);
            window.location.reload();
        }
    };

    const handleAddExpenseOrFuel = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const token = localStorage.getItem('token');
        const type = f.get('type') as string;

        let url = `${API_URL}/bookings/${selectedBooking.id}/expenses`;
        let body: any = {
            type: type,
            amount: Number(f.get('amount')),
            description: f.get('description')
        };

        if (type === 'Fuel') {
            url = `${API_URL}/admin/fuel-log`;
            body = {
                bookingId: selectedBooking.id,
                place: f.get('description'),
                liters: Number(f.get('liters')),
                costPerLiter: Number(f.get('costPerLiter')),
                odometerReading: Number(f.get('odometer')),
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            setShowExpenseForm(false);
            window.location.reload();
        }
    };

    const handleCloseTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/admin/bookings/${selectedBooking.id}/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                startKms: Number(f.get('startKms')),
                endKms: Number(f.get('endKms')),
                startTime: f.get('startTime'),
                endTime: f.get('endTime')
            })
        });

        if (res.ok) {
            setShowCloseTripForm(false);
            window.location.reload();
        }
    };

    const handleCancelBooking = async (booking: any) => {
        if (!confirm("Are you sure you want to cancel this heritage trip?")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/bookings/${booking.id}/cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) window.location.reload();
    };

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

    const handleStatusUpdate = async (id: number, status: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/partners/${id}/status?status=${status}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setPartners(partners.map(p => p.id === id ? { ...p, status } : p));
        }
    };

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const vehicleData = {
            name: f.get('name'),
            number: f.get('number'),
            type: f.get('type') as string,
            hasAc: f.get('hasAc') === 'true',
            capacity: Number(f.get('capacity')),
            basePrice: Number(f.get('basePrice')),
            pricePerKm: Number(f.get('pricePerKm')),
            terrain: "all",
            company: 'Sri Sai Senthil Travels',
            status: 'Active'
        };
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/fleet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vehicleData)
        });
        if (res.ok) {
            setShowAddVehicleForm(false);
            const fleetRes = await fetch(`${API_URL}/admin/fleet`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (fleetRes.ok) setFleet(await fleetRes.json());
        }
    };

    const internalFleet = fleet.filter(v => v.company === "Sri Sai Senthil Travels");
    const globalFleet = fleet.filter(v => v.company !== "Sri Sai Senthil Travels");

    const tabs = ['partners', 'bookings', 'global-fleet', 'own-fleet', 'reports', 'reviews', 'settings'];

    return (
        <div className="min-h-screen bg-bg-dark flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-bg-card p-8 flex flex-col justify-between hidden lg:flex h-screen sticky top-0">
                <div className="space-y-12">
                    <div className="flex flex-col items-start gap-4">
                        <S3TLogo className="w-20 h-auto" />
                        <div>
                            <span className="font-serif text-2xl font-bold text-white block">S3T CONTROL</span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Heritage HQ Console</span>
                        </div>
                    </div>

                    <nav className="space-y-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-3 text-sm w-full text-left transition-all capitalize ${activeTab === tab ? 'text-primary font-bold' : 'text-white/40 hover:text-white'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${activeTab === tab ? 'bg-primary' : 'border border-white/20'}`} /> {tab.replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
                <header className="mb-8 md:mb-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white capitalize leading-tight">{activeTab.replace('-', ' ')}</h1>
                            <p className="text-text-muted mt-1 uppercase tracking-widest font-bold text-[8px] md:text-[10px]">Dual Capability: System Oversight & Internal Operations.</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            {activeTab === 'bookings' && (
                                <button onClick={() => setShowManualBookingForm(true)} className="flex-1 md:flex-none px-6 py-3 bg-white/5 text-primary border border-primary/20 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-primary hover:text-black transition-all">
                                    Manual Entry
                                </button>
                            )}
                            {activeTab === 'own-fleet' && (
                                <button onClick={() => setShowAddVehicleForm(true)} className="flex-1 md:flex-none px-6 py-3 bg-primary text-black rounded-xl text-[10px] uppercase tracking-widest font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                                    Add Heritage Vehicle
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <div className="animate-fade-in">
                        {activeTab === 'partners' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-6 md:p-10">
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-8">Partner Management</h2>
                                <div className="space-y-4">
                                    {partners.map(p => (
                                        <div key={p.id} className="p-4 md:p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">P</div>
                                                <div>
                                                    <h4 className="font-bold text-white">{p.name}</h4>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{p.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                {p.status === 'Pending' ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleStatusUpdate(p.id, 'Approved')} className="px-6 py-2 bg-green-500 text-black rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-white transition-all">Approve</button>
                                                        <button onClick={() => handleStatusUpdate(p.id, 'Rejected')} className="px-6 py-2 bg-red-500/10 text-red-500 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Reject</button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-bold border ${p.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                        {p.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-6 md:p-10">
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-8">Global Booking Ledger</h2>
                                <div className="space-y-4">
                                    {bookings.map(b => (
                                        <div key={b.id} className="p-4 md:p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                                            <div className="flex gap-4 items-center flex-1">
                                                <div className="text-left sm:text-center w-24">
                                                    <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Travel Date</p>
                                                    <p className="text-white font-bold text-sm">{new Date(b.travelDate).toLocaleDateString()}</p>
                                                </div>
                                                <div className="hidden sm:block h-10 w-[1px] bg-white/10" />
                                                <div>
                                                    <h4 className="font-bold text-white">{b.customerName}</h4>
                                                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">
                                                        {b.vehicleName} <span className="text-white/20 mx-2">|</span> {b.partnerCompany}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Value</p>
                                                    <p className="text-xl font-bold text-white italic">₹{b.totalAmount?.toLocaleString()}</p>
                                                    <span className="text-[9px] text-green-500 font-bold uppercase">{b.status}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handlePrintAgreement(b)} className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white hover:text-black rounded-lg text-lg transition-all" title="View Agreement">📄</button>
                                                    <button onClick={() => handleShareAgreement(b)} className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-green-500 hover:text-black rounded-lg text-lg transition-all" title="Share Agreement">📲</button>
                                                    <button onClick={() => { setEditingBooking(b); setShowManualBookingForm(true); }} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/10 hover:bg-blue-500 hover:text-white rounded-lg text-[8px] uppercase font-bold transition-all">Edit</button>
                                                    <button onClick={() => { setSelectedBooking(b); setShowPaymentForm(true); }} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/10 hover:bg-green-500 hover:text-black rounded-lg text-[8px] uppercase font-bold transition-all">Pay</button>
                                                    <button onClick={() => { setSelectedBooking(b); setShowExpenseForm(true); }} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/10 hover:bg-orange-500 hover:text-white rounded-lg text-[8px] uppercase font-bold transition-all">Exp</button>
                                                    <button onClick={() => { setSelectedBooking(b); setShowCloseTripForm(true); }} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/10 hover:bg-purple-500 hover:text-white rounded-lg text-[8px] uppercase font-bold transition-all">Close</button>
                                                    <button onClick={() => handleCancelBooking(b)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/10 hover:bg-red-500 hover:text-white rounded-lg text-[8px] uppercase font-bold transition-all">Kill</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'global-fleet' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-6 md:p-10">
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-8">Global Partner Fleet</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {globalFleet.map(v => (
                                        <div key={v.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 flex gap-6 items-center">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl">🚌</div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white italic text-lg">{v.name}</h4>
                                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{v.number}</p>
                                                <p className="text-[10px] text-primary uppercase font-bold mt-1">{v.company}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-[8px] uppercase font-bold ${v.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>Active</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'own-fleet' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-6 md:p-10">
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-8">Internal Heritage Fleet (S3T)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {internalFleet.map(v => (
                                        <div key={v.id} className="p-6 bg-white/5 rounded-3xl border border-primary/10 flex gap-6 items-center">
                                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-3xl border border-primary/20">🛡️</div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white italic text-lg">{v.name}</h4>
                                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{v.number}</p>
                                                <p className="text-[10px] text-primary uppercase font-bold mt-1">{v.type} {v.hasAc ? '(AC)' : ''}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-3xl font-serif font-bold text-white italic">Heritage Analytics</h2>
                                    <select
                                        value={filterPartner}
                                        onChange={(e) => setFilterPartner(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:border-primary transition-all"
                                    >
                                        <option value="All" className="bg-bg-dark">Global Enterprise</option>
                                        <option value="Sri Sai Senthil Travels" className="bg-bg-dark">S3T (Internal)</option>
                                        {[...new Set(reportData.trips.map((t: any) => t.partner))].filter(p => p !== 'Sri Sai Senthil Travels' && p !== 'S3T').map(p => (
                                            <option key={String(p)} value={String(p)} className="bg-bg-dark">{String(p)}</option>
                                        ))}
                                    </select>
                                </div>

                                {(() => {
                                    const filteredTrips = filterPartner === 'All'
                                        ? reportData.trips
                                        : reportData.trips.filter((t: any) => t.partner === filterPartner || (filterPartner === 'Sri Sai Senthil Travels' && t.partner === 'S3T'));

                                    const totals = {
                                        revenue: filteredTrips.reduce((s: number, t: any) => s + (t.revenue || 0), 0),
                                        fuel: filteredTrips.reduce((s: number, t: any) => s + (t.fuelCost || 0), 0),
                                        other: filteredTrips.reduce((s: number, t: any) => s + (t.otherExpenses || 0), 0),
                                        net: filteredTrips.reduce((s: number, t: any) => s + (t.netProfit || 0), 0)
                                    };

                                    return (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Gross Heritage Revenue</p>
                                                    <h3 className="text-4xl font-bold text-white italic">₹{totals.revenue.toLocaleString()}</h3>
                                                </div>
                                                <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Diesel Expenditure</p>
                                                    <h3 className="text-4xl font-bold text-red-500/60">₹{totals.fuel.toLocaleString()}</h3>
                                                </div>
                                                <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Operating Expenses</p>
                                                    <h3 className="text-4xl font-bold text-red-500/80">₹{totals.other.toLocaleString()}</h3>
                                                </div>
                                                <div className="glass-dark p-8 rounded-[32px] border border-primary/20 bg-primary/5">
                                                    <p className="text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">{filterPartner === 'All' ? 'System Net Profit' : 'Aggregate Net'}</p>
                                                    <h3 className="text-4xl font-bold text-primary italic">₹{totals.net.toLocaleString()}</h3>
                                                </div>
                                            </div>

                                            <div className="glass-dark rounded-[32px] border border-white/5 p-8 md:p-12">
                                                <h2 className="text-3xl font-serif font-bold text-white mb-10 italic">Journey Profit & Loss Ledger</h2>
                                                <div className="space-y-6">
                                                    {filteredTrips.map((trip: any) => (
                                                        <div key={trip.bookingId} className="flex flex-col xl:flex-row justify-between p-8 bg-white/5 rounded-3xl border border-white/5 gap-8 hover:bg-white/[0.08] transition-all">
                                                            <div className="min-w-[200px]">
                                                                <p className="text-[9px] text-primary uppercase font-bold tracking-widest mb-1">Journey #{trip.bookingId} - {trip.partner}</p>
                                                                <h4 className="text-white font-bold text-xl">{trip.customer}</h4>
                                                                <p className="text-xs text-white/40 font-bold mt-1">{new Date(trip.date).toLocaleDateString()}</p>
                                                            </div>

                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Metrics</p>
                                                                    <p className="text-white text-sm font-bold">{trip.distanceKm} KM / {trip.days} Days</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Revenue</p>
                                                                    <p className="text-white text-sm font-bold">₹{(trip.revenue || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Total Exp</p>
                                                                    <p className="text-red-500/60 text-sm font-bold">₹{(trip.fuelCost + trip.otherExpenses || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Net</p>
                                                                    <p className={`text-sm font-bold ${(trip.netProfit || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>₹{(trip.netProfit || 0).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-10">
                                <h2 className="text-2xl font-serif font-bold text-white mb-8">Customer Feedback Hall</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {reviews.map(r => (
                                        <div key={r.id} className="p-8 bg-white/5 rounded-[32px] border border-white/10 space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-bold">{r.customerName}</h4>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Journey Quality</p>
                                                </div>
                                                <div className="flex text-primary">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-white/60 leading-relaxed italic">"{r.comment}"</p>
                                            <p className="text-[9px] text-primary/60 font-bold uppercase">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="glass-dark rounded-[32px] border border-white/5 p-6 md:p-10">
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-8">System Configuration</h2>
                                <div className="space-y-8">
                                    {configItems.map((item) => (
                                        <div key={item.key} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white/5 rounded-2xl border border-white/5 gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white uppercase text-[10px] tracking-widest text-primary mb-1">{item.key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                <p className="text-xs text-white/40">{item.description}</p>
                                            </div>
                                            <div className="flex gap-4 items-center w-full md:w-auto">
                                                <input
                                                    type="text"
                                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-primary outline-none min-w-[120px]"
                                                    value={item.value}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setConfigItems(configItems.map(c => c.key === item.key ? { ...c, value: newVal } : c));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch(`${API_URL}/admin/config`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify(configItems)
                                            });
                                            if (res.ok) alert("Heritage Configuration Saved.");
                                        }}
                                        className="w-full py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20"
                                    >
                                        Seal Configurations
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Vehicle Modal */}
                {showAddVehicleForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                        <div className="glass-dark w-full max-w-xl p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic">Register Own Fleet Asset</h3>
                                <button onClick={() => setShowAddVehicleForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={handleAddVehicle} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Asset Name</label>
                                    <input name="name" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition-all" placeholder="S3T Heritage Volvo" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Bus Number</label>
                                    <input name="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition-all" placeholder="TN 01 AB 1234" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Capacity</label>
                                    <input name="capacity" required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Comfort (AC)</label>
                                    <select name="hasAc" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white uppercase text-[10px] font-bold outline-none cursor-pointer">
                                        <option value="true" className="bg-bg-dark">Air Conditioned</option>
                                        <option value="false" className="bg-bg-dark">Non-AC</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Category</label>
                                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white uppercase text-[10px] font-bold outline-none cursor-pointer">
                                        <option value="Car" className="bg-bg-dark">Car / SUV</option>
                                        <option value="Van" className="bg-bg-dark">Luxury Van</option>
                                        <option value="Mini Bus" className="bg-bg-dark">Mini Bus</option>
                                        <option value="Bus" className="bg-bg-dark">Large Heritage Coach</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Base Price (₹)</label>
                                    <input name="basePrice" required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Price / KM (₹)</label>
                                    <input name="pricePerKm" required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Mileage (KM/L)</label>
                                    <input name="mileage" type="number" step="0.1" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="12.5" />
                                </div>
                                <button type="submit" className="sm:col-span-2 py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all mt-4">Confirm Internal Registration</button>
                            </form>
                        </div>
                    </div>
                )}

                {showManualBookingForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                        <div className="glass-dark w-full max-w-2xl p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic capitalize">{editingBooking ? 'Edit Heritage Entry' : 'Manual Heritage Entry'}</h3>
                                <button onClick={() => { setShowManualBookingForm(false); setEditingBooking(null); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.target as HTMLFormElement);
                                const token = localStorage.getItem('token');
                                const url = editingBooking ? `${API_URL}/admin/bookings/${editingBooking.id}` : `${API_URL}/admin/manual-booking`;
                                const method = editingBooking ? 'PUT' : 'POST';

                                const res = await fetch(url, {
                                    method: method,
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                        id: editingBooking?.id,
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
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Select Vehicle (Optional)</label>
                                    <select name="vehicleId" defaultValue={editingBooking?.vehicleId} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none appearance-none cursor-pointer">
                                        <option value="" className="bg-bg-dark">-- Assign Later --</option>
                                        {fleet.map(v => (
                                            <option key={v.id} value={v.id} className="bg-bg-dark">
                                                {v.name} ({v.number}) - {v.company}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Customer Name</label>
                                    <input name="customerName" required defaultValue={editingBooking?.customerName} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Aditya Roy" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Phone Number</label>
                                    <input name="customerPhone" required defaultValue={editingBooking?.customerPhone} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="+91 98765 43210" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Pickup From</label>
                                    <input name="from" required defaultValue={editingBooking?.pickupFrom} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Chennai" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Destination To</label>
                                    <input name="to" required defaultValue={editingBooking?.destinationTo} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Madurai" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Start Date</label>
                                    <input name="startDate" type="date" required defaultValue={editingBooking ? new Date(editingBooking.travelDate).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">End Date</label>
                                    <input name="endDate" type="date" required defaultValue={editingBooking?.endDate ? new Date(editingBooking.endDate).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Total Days</label>
                                    <input name="numDays" type="number" required defaultValue={editingBooking?.numDays} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Total Amount (₹)</label>
                                    <input name="amount" type="number" required defaultValue={editingBooking?.totalAmount} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Advance Received (₹)</label>
                                    <input name="advance" type="number" required defaultValue={editingBooking?.advancePaid} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Payment Via</label>
                                    <select name="paymentMethod" defaultValue={editingBooking?.paymentMethod} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="Cash" className="bg-bg-dark">Cash Payment</option>
                                        <option value="Online" className="bg-bg-dark">Online Transfer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Balance Logic</label>
                                    <select name="balanceStatus" defaultValue={editingBooking?.balanceStatus} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="Pending" className="bg-bg-dark">Pending / Not Set</option>
                                        <option value="Cash on Tour Date" className="bg-bg-dark">Cash on Tour Date</option>
                                        <option value="Paid" className="bg-bg-dark">Already Paid Fully</option>
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Places to Visit</label>
                                    <input name="places" required defaultValue={editingBooking?.places} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-4 sm:col-span-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Heritage Inclusions</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {['Driver', 'Fastag', 'Toll', 'Permit', 'Others'].map(inc => (
                                            <label key={inc} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" name="inclusions" value={inc} defaultChecked={editingBooking?.inclusions?.includes(inc)} className="hidden peer" />
                                                <div className="w-4 h-4 rounded border border-white/20 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center text-[10px] text-black">✓</div>
                                                <span className="text-[10px] text-white/40 group-hover:text-white transition-colors">{inc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="sm:col-span-2 py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20 mt-4">{editingBooking ? 'Update Heritage Journey' : 'Record Heritage Trip'}</button>
                            </form>
                        </div>
                    </div>
                )}

                {showPaymentForm && selectedBooking && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic">Record Advance Payment</h3>
                                <button onClick={() => setShowPaymentForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={handleAddPayment} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Amount (₹)</label>
                                    <input name="amount" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-black rounded-2xl font-bold uppercase tracking-widest">Seal Payment</button>
                            </form>
                        </div>
                    </div>
                )}

                {showExpenseForm && selectedBooking && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic">Log Operational Cost</h3>
                                <button onClick={() => setShowExpenseForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={handleAddExpenseOrFuel} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Category</label>
                                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none">
                                        <option value="Fuel">⛽ Diesel / Fuel</option>
                                        <option value="Bata">👨‍✈️ Driver Bata</option>
                                        <option value="Toll">🛣️ Toll/Fastag</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Amount (₹)</label>
                                    <input name="amount" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary" />
                                </div>
                                <button type="submit" className="w-full py-5 bg-orange-500 text-white rounded-2xl font-bold uppercase tracking-widest">Commit Expense</button>
                            </form>
                        </div>
                    </div>
                )}

                {showCloseTripForm && selectedBooking && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl">
                        <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-bold text-white italic">Heritage Trip Completion</h3>
                                <button onClick={() => setShowCloseTripForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={handleCloseTrip} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Start KM</label>
                                        <input name="startKms" type="number" required defaultValue={selectedBooking.startKms} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest">End KM</label>
                                        <input name="endKms" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-black rounded-2xl font-bold uppercase tracking-widest">Finalize Journey</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
