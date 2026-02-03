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
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [showManualBookingForm, setShowManualBookingForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [manualDates, setManualDates] = useState({ start: '', end: '' });
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showCloseTripForm, setShowCloseTripForm] = useState(false);
    const [availableIds, setAvailableIds] = useState<number[] | null>(null);
    const [editingBooking, setEditingBooking] = useState<any>(null);
    const [pricingFields, setPricingFields] = useState({
        baseRent: 0,
        mountainRent: 0,
        driverBatta: 0,
        permitCost: 0,
        tollCost: 0,
        otherExpenses: 0,
        discount: 0
    });

    useEffect(() => {
        if (editingBooking) {
            setPricingFields({
                baseRent: editingBooking.baseRentAmount || 0,
                mountainRent: editingBooking.mountainRent || 0,
                driverBatta: editingBooking.driverBatta || 0,
                permitCost: editingBooking.permitCost || 0,
                tollCost: editingBooking.tollCost || 0,
                otherExpenses: editingBooking.otherExpenses || 0,
                discount: editingBooking.discountAmount || 0
            });
            setManualDates({
                start: editingBooking.travelDate ? new Date(editingBooking.travelDate).toISOString().split('T')[0] : '',
                end: editingBooking.endDate ? new Date(editingBooking.endDate).toISOString().split('T')[0] : ''
            });
        } else {
            setPricingFields({
                baseRent: 0,
                mountainRent: 0,
                driverBatta: 0,
                permitCost: 0,
                tollCost: 0,
                otherExpenses: 0,
                discount: 0
            });
            setManualDates({ start: '', end: '' });
        }
    }, [editingBooking]);

    const calculateTotal = () => {
        const { baseRent, mountainRent, driverBatta, permitCost, tollCost, otherExpenses, discount } = pricingFields;
        return (Number(baseRent) || 0) + (Number(mountainRent) || 0) + (Number(driverBatta) || 0) +
            (Number(permitCost) || 0) + (Number(tollCost) || 0) + (Number(otherExpenses) || 0) - (Number(discount) || 0);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPricingFields(prev => ({ ...prev, [name]: Number(value) }));
    };

    const API_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

    // ... logic ...

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
                collectedBy: partnerName
            })
        });

        if (res.ok) {
            setShowPaymentForm(false);
            window.location.reload();
        } else {
            const err = await res.text();
            alert("Failed to record payment: " + err);
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
            url = `${API_URL}/partners/fuel-log`;
            body = {
                bookingId: selectedBooking.id,
                place: f.get('description'), // Using description field for place
                liters: Number(f.get('liters')),
                costPerLiter: Number(f.get('costPerLiter')), // You might need to add this input
                odometerReading: Number(f.get('odometer')), // Add this input
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

    const handleCloseTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = new FormData(e.target as HTMLFormElement);
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/partners/bookings/${selectedBooking.id}/close`, {
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
        } else {
            const err = await res.text();
            alert("Failed to close trip: " + err);
        }
    };

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

    const handleDeleteVehicle = async (id: number) => {
        if (!confirm("Are you sure you want to remove this vehicle? This action is reversible only by support.")) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/partners/my-fleet/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setFleet(fleet.filter(v => v.id !== id));
        } else {
            alert("Failed to delete vehicle");
        }
    };

    const handleToggleStatus = async (vehicle: any) => {
        const newStatus = vehicle.status === 'Active' ? 'Inactive' : 'Active';
        const token = localStorage.getItem('token');

        // Optimistic update
        setFleet(fleet.map(v => v.id === vehicle.id ? { ...v, status: newStatus } : v));

        await fetch(`${API_URL}/partners/my-fleet/${vehicle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...vehicle, status: newStatus })
        });
    };

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformFee = totalRevenue * 0.15;
    const currentBalance = totalRevenue - platformFee;

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

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
                        {['dashboard', 'fleet', 'reports', 'schedule', 'whatsapp'].map((tab) => (
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
                                <h3 className="text-5xl font-bold text-primary italic">₹{(totalRevenue || 0).toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-primary/20 text-center bg-primary/5">
                                <p className="text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">Ledger Balance</p>
                                <h3 className="text-5xl font-bold text-white">₹{(currentBalance || 0).toLocaleString()}</h3>
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
                                                {book.vehicleId ? (
                                                    <p className="text-[9px] text-primary font-bold mt-1">🚐 {fleet.find(v => v.id === book.vehicleId)?.name || 'Vehicle Assigned'}</p>
                                                ) : (
                                                    <p className="text-[9px] text-yellow-500 font-bold mt-1">⚠️ No Vehicle Assigned</p>
                                                )}
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
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handlePrintAgreement(book)}
                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white hover:text-black rounded-lg text-lg transition-all"
                                                    title="View Agreement"
                                                >
                                                    📄
                                                </button>
                                                <button
                                                    onClick={() => handleShareAgreement(book)}
                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-green-500 hover:text-black rounded-lg text-lg transition-all"
                                                    title="One-Click Share"
                                                >
                                                    📱
                                                </button>
                                                {!book.vehicleId && (
                                                    <button
                                                        onClick={() => { setEditingBooking(book); setShowManualBookingForm(true); }}
                                                        className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500 hover:text-black rounded-lg text-[9px] uppercase font-bold transition-all border border-yellow-500/30"
                                                    >
                                                        Assign
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setEditingBooking(book); setShowManualBookingForm(true); }}
                                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-blue-500 hover:text-white rounded-lg text-[9px] uppercase font-bold transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedBooking(book); setShowPaymentForm(true); }}
                                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-green-500 hover:text-black rounded-lg text-[9px] uppercase font-bold transition-all"
                                                >
                                                    Pay
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedBooking(book); setShowExpenseForm(true); }}
                                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-orange-500 hover:text-white rounded-lg text-[9px] uppercase font-bold transition-all"
                                                >
                                                    Exp
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedBooking(book); setShowCloseTripForm(true); }}
                                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-purple-500 hover:text-white rounded-lg text-[9px] uppercase font-bold transition-all"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Cancel this Heritage Trip?")) {
                                                            const res = await fetch(`${API_URL}/partners/bookings/${book.id}/cancel`, {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                                            });
                                                            if (res.ok) window.location.reload();
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white/10 hover:bg-red-500 hover:text-white rounded-lg text-[9px] uppercase font-bold transition-all"
                                                >
                                                    Kill
                                                </button>
                                            </div>
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
                            <div key={vehicle.id} className={`glass-dark p-8 rounded-[32px] border ${vehicle.status === 'Active' ? 'border-white/5' : 'border-red-500/20 bg-red-500/5'} hover:border-primary/30 transition-all relative group`}>
                                <div className="absolute top-8 right-8 flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleStatus(vehicle)}
                                        className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase border transition-all ${vehicle.status === 'Active'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-red-500/10 hover:text-red-500'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-green-500/10 hover:text-green-500'
                                            }`}
                                    >
                                        {vehicle.status}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteVehicle(vehicle.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500 text-white/40 hover:text-white transition-all"
                                        title="Delete Vehicle"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <h3 className="text-2xl font-bold text-white italic mb-2 tracking-tight">{vehicle.name}</h3>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-8">{vehicle.number}</p>
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Capacity</span><span className="text-white">{vehicle.capacity} Seats</span></div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Pricing</span><span className="text-primary italic">₹{vehicle.pricePerKm}/KM</span></div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold"><span className="text-white/20 tracking-widest">Mileage</span><span className="text-primary italic">{vehicle.mileage} KM/L</span></div>
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
                                <h3 className="text-4xl font-bold text-white">₹{(reportData.totalRevenue || 0).toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Total Diesel (Calc)</p>
                                <h3 className="text-4xl font-bold text-red-500/60">₹{(reportData.totalFuelCost || 0).toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-white/5">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Total Other Exp</p>
                                <h3 className="text-4xl font-bold text-red-500/80">₹{(reportData.totalExpenses || 0).toLocaleString()}</h3>
                            </div>
                            <div className="glass-dark p-8 rounded-[32px] border border-primary/20 bg-primary/5">
                                <p className="text-[10px] uppercase tracking-widest text-primary mb-2 font-bold">Net Profit</p>
                                <h3 className="text-4xl font-bold text-primary italic">₹{(reportData.totalNetProfit || 0).toLocaleString()}</h3>
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
                                                <p className="text-white text-sm font-bold">₹{(trip.revenue || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Fuel (Est)</p>
                                                <p className="text-red-500/60 text-sm font-bold">₹{(trip.fuelCost || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase text-white/20 font-bold mb-1">Other Exp</p>
                                                <p className="text-red-500/80 text-sm font-bold">₹{(trip.otherExpenses || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="xl:pl-8 xl:border-l xl:border-white/5 text-right flex flex-col justify-center">
                                            <p className="text-[9px] uppercase text-primary font-bold tracking-tighter mb-1">Net Earnings</p>
                                            <p className={`text-2xl font-bold italic ${(trip.netProfit || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                ₹{(trip.netProfit || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <button onClick={() => {
                                    if (viewMonth === 0) {
                                        setViewMonth(11);
                                        setViewYear(viewYear - 1);
                                    } else {
                                        setViewMonth(viewMonth - 1);
                                    }
                                }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">◀</button>
                                <h3 className="text-xl font-serif font-bold text-white italic min-w-[150px] text-center">
                                    {new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button onClick={() => {
                                    if (viewMonth === 11) {
                                        setViewMonth(0);
                                        setViewYear(viewYear + 1);
                                    } else {
                                        setViewMonth(viewMonth + 1);
                                    }
                                }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">▶</button>
                            </div>
                            <button onClick={() => {
                                setViewMonth(new Date().getMonth());
                                setViewYear(new Date().getFullYear());
                            }} className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-all">Go to Today</button>
                        </div>

                        <div className="glass-dark p-8 rounded-[32px] border border-white/5 overflow-x-auto">
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[150px_repeat(31,1fr)] gap-1">
                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest p-2">Vehicle</div>
                                    {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }, (_, i) => (
                                        <div key={i} className="text-[10px] font-bold text-white/30 text-center p-2">{i + 1}</div>
                                    ))}

                                    {fleet.map(vehicle => (
                                        <div key={vehicle.id} className="contents">
                                            <div className="text-white text-xs font-bold p-3 border-b border-white/5 truncate">{vehicle.name}</div>
                                            {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }, (_, i) => {
                                                const dayDate = new Date(viewYear, viewMonth, i + 1);
                                                const booking = bookings.find(b => {
                                                    const start = new Date(b.travelDate);
                                                    const end = b.endDate ? new Date(b.endDate) : start;
                                                    start.setHours(0, 0, 0, 0);
                                                    end.setHours(23, 59, 59, 999);
                                                    return b.vehicleId === vehicle.id &&
                                                        dayDate >= start && dayDate <= end &&
                                                        b.status !== 'Cancelled';
                                                });
                                                return (
                                                    <div key={`cell-${vehicle.id}-${i}`} className={`border-b border-white/5 h-10 ${booking ? 'bg-primary/20 mx-0.5 rounded-sm relative group cursor-pointer' : ''}`}>
                                                        {booking && (
                                                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-black/95 text-white text-[9px] rounded-xl whitespace-nowrap z-[60] border border-white/20 shadow-2xl">
                                                                <p className="font-bold text-primary mb-1 uppercase tracking-widest">{booking.customerName}</p>
                                                                <p className="text-white/40">{booking.pickupFrom} ➜ {booking.destinationTo}</p>
                                                                <p className="text-white/40 mt-1 italic">{new Date(booking.travelDate).toLocaleDateString()} - {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'Single Day'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
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
                        <div className="glass-dark w-full max-w-4xl p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in max-h-[95vh] overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-white/5 pb-6">
                                <div>
                                    <h3 className="text-3xl font-serif font-bold text-white italic">
                                        {editingBooking ? `Edit Journey #${editingBooking.id}` : 'Create Heritage Journey'}
                                    </h3>
                                    <p className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em] mt-1">Manual Entry Protocol</p>
                                </div>
                                <button onClick={() => { setShowManualBookingForm(false); setEditingBooking(null); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all text-xl">✕</button>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.target as HTMLFormElement);
                                const token = localStorage.getItem('token');
                                const total = calculateTotal();

                                const res = await fetch(editingBooking ? `${API_URL}/partners/bookings/${editingBooking.id}` : `${API_URL}/partners/manual-booking`, {
                                    method: editingBooking ? 'PUT' : 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({
                                        vehicleId: Number(f.get('vehicleId') || 0),
                                        customerName: f.get('customerName'),
                                        customerPhone: f.get('customerPhone'),
                                        customerEmail: f.get('customerEmail'),
                                        customerAddress: f.get('customerAddress'),
                                        pickupFrom: f.get('from'),
                                        destinationTo: f.get('to'),
                                        places: f.get('places'),
                                        travelDate: f.get('startDate'),
                                        endDate: f.get('endDate') || f.get('startDate'),
                                        numDays: Number(f.get('numDays')),
                                        numPassengers: 1,
                                        baseRentAmount: pricingFields.baseRent,
                                        mountainRent: pricingFields.mountainRent,
                                        driverBatta: pricingFields.driverBatta,
                                        permitCost: pricingFields.permitCost,
                                        tollCost: pricingFields.tollCost,
                                        otherExpenses: pricingFields.otherExpenses,
                                        discountAmount: pricingFields.discount,
                                        totalAmount: total,
                                        advancePaid: Number(f.get('advance') || 0),
                                        paymentMethod: f.get('paymentMethod') || "Cash",
                                        balanceStatus: "Pending",
                                        inclusions: Array.from(f.getAll('inclusions')).join(', '),
                                        notes: f.get('notes')
                                    })
                                });
                                if (res.ok) {
                                    setShowManualBookingForm(false);
                                    window.location.reload();
                                } else {
                                    const err = await res.text();
                                    alert("Sub v4 Failed: " + err);
                                }
                            }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                                {/* LEFT COLUMN: CONTACT & ROUTE */}
                                <div className="space-y-8">
                                    <section className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 text-primary">
                                            <span className="text-xl">👤</span>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Client Credentials</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Guest Name</label>
                                                <input name="customerName" required defaultValue={editingBooking?.customerName || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:bg-white/10 outline-none transition-all" placeholder="Aditya Roy" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Phone Number</label>
                                                <input name="customerPhone" required defaultValue={editingBooking?.customerPhone || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:bg-white/10 outline-none transition-all" placeholder="+91..." />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Email Address</label>
                                                <input name="customerEmail" type="email" defaultValue={editingBooking?.customerEmail || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="guest@example.com" />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Full Address</label>
                                                <input name="customerAddress" defaultValue={editingBooking?.customerAddress || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Location details..." />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 text-primary">
                                            <span className="text-xl">📍</span>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Itinerary Details</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Original Point</label>
                                                <input name="from" required defaultValue={editingBooking?.pickupFrom || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Chennai" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Destination</label>
                                                <input name="to" required defaultValue={editingBooking?.destinationTo || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Madurai" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Start Date</label>
                                                <input name="startDate" type="date" required value={manualDates.start} onChange={(e) => setManualDates({ ...manualDates, start: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">End Date</label>
                                                <input name="endDate" type="date" required value={manualDates.end} onChange={(e) => setManualDates({ ...manualDates, end: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Heritage Landmarks</label>
                                                <input name="places" required defaultValue={editingBooking?.places || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Temple, Forts, Waterfalls..." />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* RIGHT COLUMN: PRICING & VEHICLE */}
                                <div className="space-y-8">
                                    <section className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 text-primary">
                                            <span className="text-xl">🚐</span>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Asset Assignment</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Available Fleet</label>
                                                <select name="vehicleId" defaultValue={editingBooking?.vehicleId || ""} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[11px] font-bold uppercase outline-none cursor-pointer appearance-none">
                                                    <option value="" className="bg-bg-dark">-- Assign Later --</option>
                                                    {fleet
                                                        .filter(v => availableIds === null || availableIds.includes(v.id) || v.id === editingBooking?.vehicleId)
                                                        .map(v => (
                                                            <option key={v.id} value={v.id} className="bg-bg-dark">{v.name} ({v.number})</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                            <div className="space-y-2 sm:col-span-1">
                                                <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Days Count</label>
                                                <input name="numDays" type="number" required defaultValue={editingBooking?.numDays || 1} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" />
                                            </div>
                                        </div>
                                    </section>

                                    <section className="p-8 bg-primary/5 rounded-[32px] border border-primary/20 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">🏦</div>
                                        <div className="flex items-center gap-3 text-primary">
                                            <span className="text-xl">💰</span>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Financial Ledger</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Total Base Rent</label>
                                                <input name="baseRent" type="number" value={pricingFields.baseRent} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none group-hover:bg-white/10 transition-all font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Mountain Surcharge</label>
                                                <input name="mountainRent" type="number" value={pricingFields.mountainRent} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Driver Batta</label>
                                                <input name="driverBatta" type="number" value={pricingFields.driverBatta} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Permit / State Tax</label>
                                                <input name="permitCost" type="number" value={pricingFields.permitCost} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Toll & Parking</label>
                                                <input name="tollCost" type="number" value={pricingFields.tollCost} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-white/30 font-bold uppercase ml-1 tracking-[0.1em]">Miscellaneous</label>
                                                <input name="otherExpenses" type="number" value={pricingFields.otherExpenses} onChange={handlePriceChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-primary outline-none font-mono" />
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <label className="text-[8px] text-red-500/50 font-bold uppercase ml-1 tracking-[0.1em]">Loyalty Discount (-)</label>
                                                <input name="discount" type="number" value={pricingFields.discount} onChange={handlePriceChange} className="w-full bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm focus:border-red-500 outline-none font-mono text-center font-bold" />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 mt-6 bg-black/40 -mx-8 px-8 py-6 rounded-b-[32px]">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Net Payable Amount</span>
                                                    <p className="text-3xl text-primary font-serif font-bold italic drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">₹ {calculateTotal().toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="inline-block px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                                        <span className="text-[9px] text-primary font-bold uppercase animate-pulse">Live Calculation Active</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {!editingBooking && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Advance Paid</label>
                                                        <input name="advance" type="number" required defaultValue={0} className="w-full bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-green-500 text-sm focus:border-green-500 outline-none font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-white/40 font-bold uppercase ml-2">Payment Mode</label>
                                                        <select name="paymentMethod" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none">
                                                            <option value="Cash">Cash</option>
                                                            <option value="Online">Online / UPI</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="lg:col-span-2 space-y-4 border-t border-white/5 pt-8">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest">Heritage Inclusions</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {['Driver', 'Fastag', 'Toll', 'Permit', 'Others'].map(inc => (
                                            <label key={inc} className="flex items-center gap-3 cursor-pointer group bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-primary/40 transition-all">
                                                <input type="checkbox" name="inclusions" value={inc} defaultChecked={editingBooking?.inclusions?.includes(inc)} className="hidden peer" />
                                                <div className="w-5 h-5 rounded-lg border border-white/20 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center text-[10px] text-black">✓</div>
                                                <span className="text-[10px] text-white/60 group-hover:text-white transition-colors">{inc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="lg:col-span-2 py-6 bg-primary text-black rounded-[24px] text-[14px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-all shadow-2xl shadow-primary/20 mt-4 active:scale-95 duration-200">
                                    {editingBooking ? '💾 Update Heritage Ledger' : '🏛️ Execute Heritage Booking'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
                }

                {
                    showPaymentForm && selectedBooking && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                            <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-white italic">Record Payment</h3>
                                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1">Booking #{selectedBooking.id}</p>
                                    </div>
                                    <button onClick={() => setShowPaymentForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                                </div>
                                <form onSubmit={handleAddPayment} className="space-y-6">
                                    {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest border-b border-white/10 pb-2">Previous Advances</p>
                                            <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                                                {selectedBooking.payments.map((p: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-white/60">{new Date(p.paymentDate).toLocaleDateString()}</span>
                                                        <span className="text-white font-bold">₹{p.amount.toLocaleString()} ({p.paymentMode})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Amount Received (₹)</label>
                                        <input name="amount" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="5000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Payment Mode</label>
                                        <select name="paymentMode" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                            <option value="Cash" className="bg-bg-dark">Cash</option>
                                            <option value="Online" className="bg-bg-dark">Online Transfer</option>
                                            <option value="Check" className="bg-bg-dark">Check / DD</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Notes / Reference ID</label>
                                        <textarea name="notes" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none h-24" placeholder="UPI Ref: 1234567890" />
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-green-500 text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-green-500/20">Confirm Payment</button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {
                    showExpenseForm && selectedBooking && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                            <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-white italic">Record Operation Cost</h3>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Booking #{selectedBooking.id}</p>
                                    </div>
                                    <button onClick={() => setShowExpenseForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                                </div>
                                <form onSubmit={handleAddExpenseOrFuel} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Expense Category</label>
                                        <select
                                            name="type"
                                            id="expenseType"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const fuelInputs = document.getElementById('fuelInputs');
                                                const regularInputs = document.getElementById('regularInputs');
                                                if (val === 'Fuel') {
                                                    if (fuelInputs) fuelInputs.style.display = 'block';
                                                    if (regularInputs) regularInputs.style.display = 'none';
                                                } else {
                                                    if (fuelInputs) fuelInputs.style.display = 'none';
                                                    if (regularInputs) regularInputs.style.display = 'block';
                                                }
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer"
                                        >
                                            <option value="Fuel" className="bg-bg-dark">Heritage Diesel (Detailed Log)</option>
                                            <option value="Toll" className="bg-bg-dark">Toll / Fastag</option>
                                            <option value="Permit" className="bg-bg-dark">State Permit</option>
                                            <option value="Bata" className="bg-bg-dark">Driver Bata</option>
                                            <option value="Maintenance" className="bg-bg-dark">Miscellaneous</option>
                                        </select>
                                    </div>

                                    {/* Fuel Inputs */}
                                    <div id="fuelInputs" className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Liters</label>
                                                <input name="liters" type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="50.5" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Cost / Liter</label>
                                                <input name="costPerLiter" type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="95.40" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Odometer Reading</label>
                                            <input name="odometer" type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="10500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Station / Location</label>
                                            <input name="description" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="Shell Station, Madurai Bypass" />
                                        </div>
                                    </div>

                                    {/* Regular Inputs */}
                                    <div id="regularInputs" className="space-y-4 hidden">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Amount (₹)</label>
                                            <input name="amount" type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="2500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Description</label>
                                            <textarea name="description" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none h-24" placeholder="Brief details about the expense..." />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20">Authorize Expense</button>
                                </form>
                            </div>
                        </div>
                    )
                }
                {
                    showCloseTripForm && selectedBooking && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
                            <div className="glass-dark w-full max-w-lg p-10 rounded-[40px] border border-white/10 space-y-8 animate-scale-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-serif font-bold text-white italic">Heritage Trip Completion</h3>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Booking #{selectedBooking.id}</p>
                                    </div>
                                    <button onClick={() => setShowCloseTripForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                                </div>
                                <form onSubmit={handleCloseTrip} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Start Odometer (KM)</label>
                                            <input name="startKms" type="number" required defaultValue={selectedBooking.startKms || 0} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="10200" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">End Odometer (KM)</label>
                                            <input name="endKms" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary outline-none" placeholder="10500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Start Time</label>
                                            <input name="startTime" type="datetime-local" required defaultValue={new Date(selectedBooking.travelDate).toISOString().slice(0, 16)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">End Time</label>
                                            <input name="endTime" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20">
                                        <p className="text-[9px] text-primary font-bold uppercase tracking-widest leading-relaxed">
                                            Closing this trip will mark it as 'Completed' and fix the total distance for mileage calculations. Ensure all diesel logs and expenses are recorded before closing.
                                        </p>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-primary text-black rounded-2xl text-[12px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20">Finalize & Close Trip</button>
                                </form>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
