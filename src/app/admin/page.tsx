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

    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [showManualBookingForm, setShowManualBookingForm] = useState(false);
    const [manualDates, setManualDates] = useState({ start: '', end: '' });
    const [availableIds, setAvailableIds] = useState<number[] | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchAdminData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const [partRes, bookRes, fleetRes, configsRes] = await Promise.all([
                    fetch(`${API_URL}/admin/partners`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/fleet`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/config`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (partRes.ok) setPartners(await partRes.json());
                if (bookRes.ok) setBookings(await bookRes.json());
                if (fleetRes.ok) setFleet(await fleetRes.json());
                if (configsRes.ok) setConfigItems(await configsRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
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

    const tabs = ['partners', 'bookings', 'global-fleet', 'own-fleet', 'settings'];

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
                                        <div key={b.id} className="p-4 md:p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                                            <div className="text-right">
                                                <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Booking Value</p>
                                                <p className="text-xl font-bold text-white italic">₹{b.totalAmount?.toLocaleString()}</p>
                                                <span className="text-[9px] text-green-500 font-bold uppercase">{b.status}</span>
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
                                <h3 className="text-2xl font-serif font-bold text-white italic capitalize">Manual Heritage Entry</h3>
                                <button onClick={() => setShowManualBookingForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all">✕</button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const f = new FormData(e.target as HTMLFormElement);
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${API_URL}/admin/manual-booking`, {
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
                                                    {v.name} ({v.number}) - {v.company}
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
                                    <select name="paymentMethod" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
                                        <option value="Cash" className="bg-bg-dark">Cash Payment</option>
                                        <option value="Online" className="bg-bg-dark">Online Transfer</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-primary font-bold uppercase tracking-widest leading-loose">Balance Logic</label>
                                    <select name="balanceStatus" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none cursor-pointer">
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
            </main>
        </div>
    );
}
