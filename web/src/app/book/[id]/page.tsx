'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchJson } from '@/lib/api';
import {
    User, Phone, Mail, MapPin, Truck, Calendar,
    Coins, Banknote, ShieldCheck, Ticket, Info, Wallet
} from 'lucide-react';

export default function BookingPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [mode, setMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Vehicle info (for display)
    const [vehicleInfo, setVehicleInfo] = useState({ type: 'Bus', number: 'Unknown' });

    // Form State
    const [formData, setFormData] = useState({
        id: '', // For Edit
        customerName: '',
        phone: '',
        email: '',
        address: '',

        busType: '',
        daysCount: 1,

        origin: '',
        destination: '',
        fromDate: '',
        toDate: '',
        landmarks: '',

        perDayRent: 0,
        mountainRent: 0,
        driverBatta: 0,
        permitTax: 0,
        tollParking: 0,
        miscellaneous: 0,
        loyaltyDiscount: 0,
        advancePaid: 0,
        paymentMode: 'CASH',
        inclusions: [] as string[],

        notes: ''
    });

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                // 1. Try fetching as Agreement (Edit Mode)
                const agreement = await fetchJson(`/agreements/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);

                if (agreement) {
                    setMode('EDIT');

                    // Parse Notes for extra fields if structured 'key: val'
                    const noteMap: any = {};
                    if (agreement.notes) {
                        agreement.notes.split(',').forEach((p: string) => {
                            const [k, v] = p.split(':').map(s => s.trim());
                            if (k && v) noteMap[k] = v;
                        });
                    }

                    setFormData({
                        id: agreement.id,
                        customerName: agreement.customerName,
                        phone: agreement.phone,
                        email: noteMap['Email'] || '',
                        address: noteMap['Address'] || '',
                        busType: agreement.busType,
                        daysCount: 1, // Recalc from dates
                        origin: agreement.placesToCover?.split('->')[0]?.trim() || '',
                        destination: agreement.placesToCover?.split('->')[1]?.split('.')[0]?.trim() || '',
                        fromDate: parseDateToInput(agreement.fromDate),
                        toDate: parseDateToInput(agreement.toDate),
                        landmarks: agreement.placesToCover?.split('Landmarks:')[1]?.trim() || '',

                        perDayRent: parseFloat(agreement.perDayRent || 0),
                        mountainRent: parseFloat(agreement.mountainRent || 0),
                        driverBatta: parseFloat(noteMap['Batta'] || 0),
                        permitTax: parseFloat(noteMap['Tax'] || 0),
                        tollParking: parseFloat(noteMap['Toll'] || 0),
                        miscellaneous: parseFloat(noteMap['Misc'] || 0),
                        loyaltyDiscount: parseFloat(noteMap['Disc'] || 0),
                        advancePaid: parseFloat(agreement.advancePaid || 0),
                        paymentMode: 'CASH', // Default or from notes
                        inclusions: noteMap['Inclusions'] ? noteMap['Inclusions'].split('|') : [],
                        notes: agreement.notes
                    });

                    setVehicleInfo({ type: agreement.busType, number: 'Assigned' });

                } else {
                    // 2. Try fetching as Bus (Create Mode)
                    const bus = await fetchJson(`/buses/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null);

                    if (bus) {
                        setMode('CREATE');
                        setVehicleInfo({ type: bus.type, number: bus.vehicleNumber });
                        setFormData(prev => ({
                            ...prev,
                            busType: bus.type,
                            perDayRent: parseFloat(bus.pricePerDay || 0)
                        }));
                    } else {
                        setMode('CREATE'); // Allow empty create or handle error
                    }
                }
                setLoading(false);

            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        loadData();
    }, [id, router]);

    // Recalculate days
    useEffect(() => {
        if (formData.fromDate && formData.toDate) {
            const start = new Date(formData.fromDate);
            const end = new Date(formData.toDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setFormData(prev => ({ ...prev, daysCount: diffDays }));
            }
        }
    }, [formData.fromDate, formData.toDate]);

    const parseDateToInput = (dStr: string) => {
        if (!dStr) return '';
        if (dStr.includes('/')) {
            const [d, m, y] = dStr.split('/');
            return `${y}-${m}-${d}`;
        }
        try { return dStr.split('T')[0]; } catch { return ''; }
    }

    const formatDateForApi = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const calculateTotal = () => {
        return (
            (formData.perDayRent || 0) +
            (formData.mountainRent || 0) +
            (formData.driverBatta || 0) +
            (formData.permitTax || 0) +
            (formData.tollParking || 0) +
            (formData.miscellaneous || 0)
        ) - (formData.loyaltyDiscount || 0);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const total = calculateTotal();

            const extraNotes = [
                `Email: ${formData.email}`,
                `Address: ${formData.address}`,
                `Batta: ${formData.driverBatta}`,
                `Tax: ${formData.permitTax}`,
                `Toll: ${formData.tollParking}`,
                `Misc: ${formData.miscellaneous}`,
                `Disc: ${formData.loyaltyDiscount}`,
                `Inclusions: ${formData.inclusions.join('|')}`
            ].join(', ');

            const payload = {
                customerName: formData.customerName,
                phone: formData.phone,
                fromDate: formatDateForApi(formData.fromDate),
                toDate: formatDateForApi(formData.toDate),
                busType: formData.busType,
                busCount: '1',
                passengers: '1',
                placesToCover: `${formData.origin} -> ${formData.destination}. Landmarks: ${formData.landmarks}`,
                perDayRent: formData.perDayRent.toString(),
                includeMountainRent: formData.mountainRent > 0,
                mountainRent: formData.mountainRent.toString(),
                totalAmount: total.toString(),
                advancePaid: formData.advancePaid.toString(),
                notes: extraNotes
            };

            let res;
            if (mode === 'EDIT') {
                res = await fetchJson(`/agreements/${formData.id}`, {
                    method: 'PUT', body: JSON.stringify(payload), headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                res = await fetchJson('/agreements', {
                    method: 'POST', body: JSON.stringify(payload), headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (res) {
                alert(mode === 'EDIT' ? 'Booking Updated!' : 'Booking Created!');
                router.push('/dashboard');
            }
        } catch (e) {
            console.error(e);
            alert('Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Loading Booking Console...</div>;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* LEFT COLUMN */}
                <div style={styles.col}>
                    {/* CLIENT CREDENTIALS */}
                    <div style={styles.panel}>
                        <div style={styles.header}>
                            <User size={16} color="#C5A059" />
                            <span style={styles.headerText}>Client Credentials</span>
                        </div>
                        <div style={styles.grid2}>
                            <InputGroup label="Guest Name" value={formData.customerName} onChange={v => setFormData({ ...formData, customerName: v })} />
                            <InputGroup label="Phone Number" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} />
                        </div>
                        <InputGroup label="Email Address" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                        <InputGroup label="Full Address" value={formData.address} onChange={v => setFormData({ ...formData, address: v })} />
                    </div>

                    {/* ITINERARY */}
                    <div style={styles.panel}>
                        <div style={styles.header}>
                            <MapPin size={16} color="#E11D48" />
                            <span style={{ ...styles.headerText, color: '#E5E5E5' }}>Itinerary Details</span>
                        </div>
                        <div style={styles.grid2}>
                            <InputGroup label="Original Point" value={formData.origin} onChange={v => setFormData({ ...formData, origin: v })} />
                            <InputGroup label="Destination" value={formData.destination} onChange={v => setFormData({ ...formData, destination: v })} />
                        </div>
                        <div style={styles.grid2}>
                            <InputGroup label="Start Date" type="date" value={formData.fromDate} onChange={v => setFormData({ ...formData, fromDate: v })} />
                            <InputGroup label="End Date" type="date" value={formData.toDate} onChange={v => setFormData({ ...formData, toDate: v })} />
                        </div>
                        <InputGroup label="Heritage Landmarks" value={formData.landmarks} onChange={v => setFormData({ ...formData, landmarks: v })} />
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={styles.col}>
                    {/* ASSET ASSIGNMENT */}
                    <div style={styles.panel}>
                        <div style={styles.header}>
                            <Truck size={16} color="#4ADE80" />
                            <span style={styles.headerText}>Asset Assignment</span>
                        </div>
                        <div style={styles.grid2}>
                            <div style={styles.inputWrapper}>
                                <label style={styles.label}>Fleet Type</label>
                                <div style={{ ...styles.input, fontSize: '12px', display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                                    {vehicleInfo.type} ({vehicleInfo.number})
                                </div>
                            </div>
                            <InputGroup label="Days Count" value={formData.daysCount} readOnly />
                        </div>
                    </div>

                    {/* FINANCIAL LEDGER */}
                    <div style={{ ...styles.panel, border: '1px solid rgba(197, 160, 89, 0.2)' }}>
                        <div style={styles.header}>
                            <Coins size={16} color="#C5A059" />
                            <span style={{ ...styles.headerText, color: '#C5A059' }}>Financial Ledger</span>
                            <Banknote size={40} color="#C5A059" style={{ opacity: 0.1, position: 'absolute', right: 20, top: 20 }} />
                        </div>

                        <div style={styles.grid2}>
                            <InputGroup label="Total Base Rent" value={formData.perDayRent} onChange={v => setFormData({ ...formData, perDayRent: parseFloat(v) || 0 })} type="number" />
                            <InputGroup label="Mountain Surcharge" value={formData.mountainRent} onChange={v => setFormData({ ...formData, mountainRent: parseFloat(v) || 0 })} type="number" />
                        </div>
                        <div style={styles.grid2}>
                            <InputGroup label="Driver Batta" value={formData.driverBatta} onChange={v => setFormData({ ...formData, driverBatta: parseFloat(v) || 0 })} type="number" />
                            <InputGroup label="Permit / State Tax" value={formData.permitTax} onChange={v => setFormData({ ...formData, permitTax: parseFloat(v) || 0 })} type="number" />
                        </div>
                        <div style={styles.grid2}>
                            <InputGroup label="Toll & Parking" value={formData.tollParking} onChange={v => setFormData({ ...formData, tollParking: parseFloat(v) || 0 })} type="number" />
                            <InputGroup label="Miscellaneous" value={formData.miscellaneous} onChange={v => setFormData({ ...formData, miscellaneous: parseFloat(v) || 0 })} type="number" />
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ ...styles.label, color: '#E11D48' }}>Loyalty Discount (-)</label>
                            <input
                                type="number"
                                value={formData.loyaltyDiscount}
                                onChange={e => setFormData({ ...formData, loyaltyDiscount: parseFloat(e.target.value) || 0 })}
                                style={{
                                    ...styles.input,
                                    borderColor: 'rgba(225, 29, 72, 0.3)',
                                    backgroundColor: 'rgba(225, 29, 72, 0.05)',
                                    color: '#E11D48',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}
                            />
                        </div>

                        {/* NET PAYABLE */}
                        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(197, 160, 89, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: '4px' }}>Net Payable Amount</div>
                                    <div style={{ fontSize: '32px', fontFamily: 'serif', color: '#C5A059', fontWeight: 'bold' }}>
                                        ₹ {calculateTotal().toLocaleString()}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 16px', backgroundColor: 'rgba(197, 160, 89, 0.1)', border: '1px solid #C5A059', color: '#C5A059',
                                    borderRadius: '50px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase'
                                }}>
                                    Live Calculation Active
                                </div>
                            </div>

                            <div style={styles.grid2}>
                                <div>
                                    <label style={styles.label}>Advance Paid</label>
                                    <input
                                        type="number"
                                        value={formData.advancePaid}
                                        onChange={e => setFormData({ ...formData, advancePaid: parseFloat(e.target.value) || 0 })}
                                        style={{ ...styles.input, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ADE80', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Payment Mode</label>
                                    <select
                                        value={formData.paymentMode}
                                        onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                        style={styles.input}
                                    >
                                        <option value="CASH">CASH</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">CARD</option>
                                        <option value="TRANSFER">BANK TRANSFER</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ width: '100%', maxWidth: '1200px', marginTop: '40px' }}>
                <h3 style={{ ...styles.headerText, marginBottom: '16px', color: '#E5E5E5' }}>Heritage Inclusions</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    {['Driver', 'Fastag', 'Toll', 'Permit', 'Others'].map(inc => (
                        <div key={inc}
                            onClick={() => {
                                const newInclusions = formData.inclusions.includes(inc)
                                    ? formData.inclusions.filter(i => i !== inc)
                                    : [...formData.inclusions, inc];
                                setFormData({ ...formData, inclusions: newInclusions });
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: formData.inclusions.includes(inc) ? '#222' : '#111',
                                border: formData.inclusions.includes(inc) ? '1px solid #666' : '1px solid #222'
                            }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: formData.inclusions.includes(inc) ? '#C5A059' : 'transparent'
                            }}>
                                {formData.inclusions.includes(inc) && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'black' }} />}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.inclusions.includes(inc) ? 'white' : '#666' }}>{inc}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit} disabled={submitting}
                    style={{
                        width: '100%', padding: '24px', backgroundColor: '#C5A059', color: 'black', borderRadius: '24px',
                        border: 'none', fontSize: '14px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', cursor: 'pointer',
                        boxShadow: '0 10px 40px rgba(197, 160, 89, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                        opacity: submitting ? 0.7 : 1
                    }}>
                    <Banknote size={20} />
                    {mode === 'EDIT' ? 'UPDATE HERITAGE BOOKING' : 'EXECUTE HERITAGE BOOKING'}
                </button>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS & STYLES ---

interface InputGroupProps {
    label: string;
    value: string | number;
    onChange?: (val: string) => void;
    type?: string;
    readOnly?: boolean;
}

function InputGroup({ label, value, onChange, type = 'text', readOnly = false }: InputGroupProps) {
    return (
        <div style={styles.inputWrapper}>
            <label style={styles.label}>{label}</label>
            <input
                type={type}
                value={value}
                onChange={readOnly ? undefined : (e) => onChange && onChange(e.target.value)}
                readOnly={readOnly}
                style={styles.input}
            />
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#000',
        padding: '40px 20px', // Added horizontal padding for small screens
        display: 'flex',
        flexDirection: 'column' as const, // Changed to column to stack bottom section
        alignItems: 'center',
        paddingTop: '60px' // Ensure space at top
    },
    container: {
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', // Responsive grid: Stack on small screens
        gap: '24px'
    },
    col: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '24px'
    },
    panel: {
        backgroundColor: '#0F0F0F', // Slightly lighter for contrast
        borderRadius: '24px',
        padding: '32px',
        position: 'relative' as const,
        border: '1px solid rgba(255,255,255,0.08)', // Higher contrast border
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)' // Add shadow for depth
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '32px'
    },
    headerText: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        letterSpacing: '2px',
        fontWeight: 'bold',
        color: '#C5A059'
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
    },
    inputWrapper: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px'
    },
    label: {
        fontSize: '10px',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        color: '#888', // Brighter label
        fontWeight: 'bold'
    },
    input: {
        width: '100%',
        backgroundColor: '#1A1A1A', // More visible input bg
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px',
        color: '#FFF',
        fontSize: '14px',
        fontWeight: 'bold',
        outline: 'none',
        height: '52px',
        transition: 'border-color 0.2s, background-color 0.2s'
    }
};
