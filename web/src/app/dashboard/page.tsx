'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api';
import Link from 'next/link';
import { generateAgreementPDF } from '@/lib/pdfGenerator';
import {
    LayoutDashboard, Truck, FileText, Calendar, MessageCircle, LogOut,
    ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Fuel, IndianRupee,
    FileCheck, Share2, Wallet
} from 'lucide-react';

// --- STYLES (Inline to ensure correct rendering without Tailwind) ---
const styles = {
    pageContainer: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#e5e5e5',
        fontFamily: 'var(--font-outfit), sans-serif',
    },
    sidebar: {
        width: '260px',
        position: 'fixed' as 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#0A0A0A',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column' as 'column',
        zIndex: 100,
        padding: '30px'
    },
    main: {
        flex: 1,
        marginLeft: '260px',
        padding: '40px 60px',
        backgroundColor: '#050505',
        minHeight: '100vh',
        position: 'relative' as 'relative'
    },
    brand: {
        marginBottom: '40px'
    },
    brandTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        letterSpacing: '0.1em'
    },
    brandSubtitle: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '0.2em',
        marginTop: '4px'
    },
    navItem: (active: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? '#C5A059' : 'rgba(255,255,255,0.4)'
    }),
    navLabel: {
        fontSize: '12px',
        fontWeight: 'bold' as 'bold',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '0.1em'
    },
    header: {
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    pageTitle: {
        fontSize: '32px',
        fontFamily: 'var(--font-playfair), serif',
        color: 'white',
        marginBottom: '8px'
    },
    headerSubtitle: {
        fontSize: '10px',
        color: '#C5A059',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '0.25em'
    },
    grid3: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        marginBottom: '40px'
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '30px',
        position: 'relative' as 'relative',
        overflow: 'hidden' as 'hidden'
    },
    kpiLabel: {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: '16px'
    },
    kpiValue: (highlight?: boolean, isExpense?: boolean) => ({
        fontSize: '36px',
        fontFamily: 'var(--font-playfair), serif',
        color: highlight ? '#C5A059' : (isExpense ? '#f87171' : 'white'),
        lineHeight: 1
    }),
    glassPanel: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '30px'
    },
    sectionTitle: {
        fontFamily: 'var(--font-playfair), serif',
        fontSize: '24px',
        color: 'white',
        marginBottom: '24px',
        fontStyle: 'italic'
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '8px',
        marginBottom: '12px'
    },
    actionBtn: {
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        marginLeft: '8px'
    },
    input: {
        width: '100%',
        backgroundColor: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '12px',
        color: 'white',
        outline: 'none',
        fontSize: '14px'
    },
    label: {
        display: 'block',
        fontSize: '10px',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '1px',
        color: '#888',
        marginBottom: '8px',
        fontWeight: 'bold' as 'bold'
    }
};

interface DashboardData {
    agreements: any[];
    buses: any[];
    accounts: any[];
    schedule: any;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'reports' | 'schedule' | 'whatsapp'>('dashboard');
    const [loading, setLoading] = useState(true);

    // Data State
    const [data, setData] = useState<DashboardData>({
        agreements: [], buses: [], accounts: [], schedule: null
    });

    const [assignModal, setAssignModal] = useState<{ open: boolean, agreementId: string | null }>({ open: false, agreementId: null });
    const [expenseModal, setExpenseModal] = useState<{ open: boolean, agreement: any | null }>({ open: false, agreement: null });
    const [paymentModal, setPaymentModal] = useState<{ open: boolean, agreement: any | null }>({ open: false, agreement: null });

    // Need simpler date parsing for Schedule
    const [scheduleDate, setScheduleDate] = useState(new Date());

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
        refreshAllData();
    }, [router]);

    const refreshAllData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const [agrimentsRes, busesRes, scheduleRes, statsRes] = await Promise.all([
                fetchJson('/agreements', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => []),
                fetchJson('/buses', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => []),
                fetchJson('/schedule', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ agreements: [] })),
                fetchJson('/api/accounts/stats', { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ revenue: 0, active: 0 }))
            ]);

            setData({
                agreements: agrimentsRes || [],
                buses: busesRes || [],
                schedule: scheduleRes || { agreements: [] },
                stats: statsRes || { revenue: 0, activeTrips: 0, pending: 0, completed: 0 },
                accounts: []
            } as any);
            setLoading(false);
        } catch (e) {
            console.error("Dashboard Load Failed", e);
            setLoading(false);
        }
    };

    const handleAssignBus = async (busId: string) => {
        const token = localStorage.getItem('token');
        if (!token || !assignModal.agreementId) return;

        try {
            await fetchJson(`/agreements/${assignModal.agreementId}`, {
                method: 'PUT',
                body: JSON.stringify({ assignedBusIds: [busId], status: 'ASSIGNED' }),
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Bus Assigned Successfully');
            setAssignModal({ open: false, agreementId: null });
            refreshAllData();
        } catch (e) {
            console.error(e);
            alert('Failed to assign bus');
        }
    };

    const handleUnassignBus = async () => {
        if (!assignModal.agreementId) return;
        const token = localStorage.getItem('token');
        if (!confirm('Are you sure you want to Unassign the vehicle?')) return;

        try {
            await fetchJson(`/agreements/${assignModal.agreementId}`, {
                method: 'PUT',
                body: JSON.stringify({ assignedBusIds: [], status: 'CONFIRMED' }),
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Bus Unassigned Successfully');
            setAssignModal({ open: false, agreementId: null });
            refreshAllData();
        } catch (e) {
            console.error(e);
            alert('Failed to unassign bus');
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        if (!confirm(`Are you sure you want to mark this trip as ${status}?`)) return;
        const token = localStorage.getItem('token');
        try {
            await fetchJson(`/agreements/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
                headers: { 'Authorization': `Bearer ${token}` }
            });
            refreshAllData();
        } catch (e) {
            console.error(e);
            alert('Status Update Failed');
        }
    };

    // Calculations
    const totalBookings = data.agreements.length;
    // Use stats from backend or fallback
    const stats = (data as any).stats || { revenue: 0, expenses: 0 };
    const grossRevenue = stats.revenue || 0;
    const totalExpenses = stats.expenses || 0;
    const ledgerBalance = grossRevenue - totalExpenses;

    return (
        <div style={styles.pageContainer}>
            {/* SIDEBAR */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <div style={{ color: '#C5A059', fontFamily: 'serif', fontSize: '24px', fontWeight: 'bold' }}>S3T</div>
                    <div style={styles.brandTitle}>S3T PARTNER</div>
                    <div style={styles.brandSubtitle}>Heritage Operator</div>
                </div>

                <nav style={{ flex: 1 }}>
                    <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <NavItem icon={<Truck size={18} />} label="Fleet" active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} />
                    <NavItem icon={<FileText size={18} />} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                    <NavItem icon={<Calendar size={18} />} label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                    <NavItem icon={<MessageCircle size={18} />} label="Whatsapp" active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} />
                </nav>

                <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} style={{ ...styles.navItem(false), color: '#ef4444' }}>
                        <LogOut size={16} /> <span style={styles.navLabel}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.pageTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                        <p style={styles.headerSubtitle}>Operational HQ Console</p>
                    </div>
                    {/* Optional Right Header Content */}
                </header>

                {loading ? <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading Console...</div> : (
                    <>
                        {/* DASHBOARD */}
                        {activeTab === 'dashboard' && (
                            <div>
                                <div style={styles.grid3}>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Bookings</div>
                                        <div style={styles.kpiValue(false)}>{totalBookings}</div>
                                    </div>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Gross Result</div>
                                        <div style={styles.kpiValue(true)}>₹{grossRevenue.toLocaleString()}</div>
                                    </div>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Ledger Balance</div>
                                        <div style={styles.kpiValue(false)}>₹{ledgerBalance.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div style={styles.glassPanel}>
                                    <h2 style={styles.sectionTitle}>Recent Heritage Activity</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            .activity-row { position: relative; overflow: hidden; }
                                            .activity-actions { 
                                                display: none; 
                                                position: absolute; 
                                                right: 16px; 
                                                top: 50%; 
                                                transform: translateY(-50%); 
                                                gap: 8px;
                                                align-items: center;
                                                background: #0A0A0A; /* Cover background to hide revenue if needed, or just overlay */
                                                padding-left: 20px;
                                            }
                                            .activity-row:hover .activity-actions { display: flex; }
                                            .activity-row:hover .activity-revenue { opacity: 0; }
                                            
                                            .btn-action-icon {
                                                width: 32px; height: 32px;
                                                background: rgba(255,255,255,0.1);
                                                border-radius: 4px;
                                                display: flex; alignItems: center; justifyContent: center;
                                                color: #ccc; cursor: pointer; border: none;
                                            }
                                            .btn-action-pill {
                                                padding: 6px 16px;
                                                background: rgba(255,255,255,0.1);
                                                border-radius: 4px;
                                                color: #ccc;
                                                font-size: 10px; font-weight: bold; text-transform: uppercase;
                                                border: none; cursor: pointer;
                                            }
                                            .btn-action-pill:hover, .btn-action-icon:hover {
                                                background: white; color: black;
                                            }
                                            .btn-assign {
                                                background: rgba(197, 160, 89, 0.2);
                                                color: #C5A059;
                                            }
                                            .btn-assign:hover {
                                                background: #C5A059; color: black;
                                            }
                                        `}} />

                                        {data.agreements.slice(0, 10).map(a => (
                                            <div key={a.id} className="activity-row" style={styles.row}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: '#C5A059' }}>
                                                        <Truck size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>ID: {a.id.slice(0, 4)} • {a.fromDate}</div>
                                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{a.customerName}</div>
                                                        {!a.assignedBuses?.length ? (
                                                            <div style={{ fontSize: '10px', color: '#eab308', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                                <AlertCircle size={10} /> No Vehicle Assigned
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '10px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                                <Truck size={10} /> Vehicle Assigned
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="activity-revenue" style={{ textAlign: 'right', transition: 'opacity 0.2s' }}>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>Revenue</div>
                                                    <div style={{ color: '#C5A059', fontFamily: 'serif', fontWeight: 'bold', fontSize: '16px' }}>₹{a.totalAmount.toLocaleString()}</div>
                                                </div>

                                                {/* SMART ACTIONS TOOLBAR */}
                                                <div className="activity-actions">
                                                    <button className="btn-action-icon" onClick={() => generateAgreementPDF(a, user)} title="Agreement"><FileText size={14} /></button>
                                                    <button className="btn-action-icon" title="Share"><Share2 size={14} /></button>

                                                    {/* ASSIGN */}
                                                    <button className="btn-action-pill btn-assign" onClick={() => setAssignModal({ open: true, agreementId: a.id })}>
                                                        {a.assignedBuses?.length ? 'REASSIGN' : 'ASSIGN'}
                                                    </button>

                                                    <button className="btn-action-pill" onClick={() => router.push(`/book/${a.id}`)}>EDIT</button>
                                                    <button className="btn-action-pill" onClick={() => setPaymentModal({ open: true, agreement: a })}>PAY</button>
                                                    <button className="btn-action-pill" onClick={() => setExpenseModal({ open: true, agreement: a })}>EXP</button>
                                                    <button className="btn-action-pill" onClick={() => handleStatusUpdate(a.id, 'COMPLETED')}>CLOSE</button>
                                                    <button className="btn-action-pill" onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}>KILL</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FLEET */}
                        {activeTab === 'fleet' && (
                            <div>
                                <div style={styles.grid3}>
                                    {data.buses.map(bus => (
                                        <div key={bus.id} style={{
                                            ...styles.card,
                                            padding: '24px',
                                            opacity: bus.isActive ? 1 : 0.6
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                <div style={{ fontFamily: 'serif', fontSize: '20px', fontStyle: 'italic' }}>Bus</div>
                                                <div style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                                                    backgroundColor: bus.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: bus.isActive ? '#4ade80' : '#f87171'
                                                }}>{bus.isActive ? 'Active' : 'Inactive'}</div>
                                            </div>
                                            <div style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{bus.vehicleNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* REPORTS */}
                        {activeTab === 'reports' && (
                            <div>
                                <div style={styles.grid3}>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Total Revenue</div>
                                        <div style={styles.kpiValue(false)}>₹{grossRevenue.toLocaleString()}</div>
                                    </div>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Expenses</div>
                                        <div style={styles.kpiValue(false, true)}>₹{totalExpenses.toLocaleString()}</div>
                                    </div>
                                    <div style={styles.card}>
                                        <div style={styles.kpiLabel}>Net Profit</div>
                                        <div style={styles.kpiValue(true)}>₹{ledgerBalance.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div style={styles.glassPanel}>
                                    <h2 style={styles.sectionTitle}>Profit & Loss Ledger</h2>
                                    {data.accounts.length === 0 ? <div style={{ color: 'rgba(255,255,255,0.3)' }}>No completed trips yet.</div> : null}
                                    {data.accounts.map((acc: any) => (
                                        <div key={acc.agreementId} style={styles.row}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{acc.customerName}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{acc.fromDate}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '10px', color: '#888' }}>PROFIT</div>
                                                <div style={{ color: '#C5A059', fontWeight: 'bold' }}>₹{(acc.incomeTotalAmount - acc.totalExpenses).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SCHEDULE */}
                        {activeTab === 'schedule' && (
                            <div style={{ ...styles.glassPanel, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingRight: '20px' }}>
                                    <h2 style={styles.sectionTitle}>Fleet Schedule</h2>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                                            <div style={{ width: '12px', height: '12px', background: '#C5A059', borderRadius: '2px' }}></div> Booked
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                                            <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', border: '1px dashed #444', borderRadius: '2px' }}></div> Available
                                        </div>
                                    </div>
                                </div>

                                {/* GANTT CONTAINER */}
                                <div style={{ flex: 1, overflow: 'auto', position: 'relative', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>

                                    {/* HEADERS (Dates) */}
                                    <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ minWidth: '150px', padding: '12px', borderRight: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '12px', color: '#888', position: 'sticky', left: 0, background: '#0A0A0A', zIndex: 20 }}>Vehicle</div>
                                        {Array.from({ length: 31 }, (_, i) => {
                                            const d = new Date(); d.setDate(d.getDate() + i);
                                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                            return (
                                                <div key={i} style={{ minWidth: '40px', padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '10px', backgroundColor: isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                                    <div style={{ opacity: 0.5 }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                                                    <div style={{ fontWeight: 'bold', color: isWeekend ? '#f87171' : 'white' }}>{d.getDate()}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* ROWS (Buses) */}
                                    {data.buses.map(bus => (
                                        <div key={bus.id} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', height: '50px', position: 'relative' }}>
                                            {/* Bus Name (Sticky Left) */}
                                            <div style={{
                                                minWidth: '150px', padding: '0 12px', borderRight: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                                position: 'sticky', left: 0, background: '#0A0A0A', zIndex: 10
                                            }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: bus.isActive ? 'white' : '#666' }}>{bus.vehicleNumber}</div>
                                                <div style={{ fontSize: '10px', color: '#666' }}>{bus.type}</div>
                                            </div>

                                            {/* Timeline Cells placeholder grid */}
                                            {Array.from({ length: 31 }, (_, i) => (
                                                <div key={i} style={{ minWidth: '40px', borderRight: '1px solid rgba(255,255,255,0.02)', height: '100%' }}></div>
                                            ))}

                                            {/* BARS (Absolute Positioned) */}
                                            {data.schedule?.agreements?.filter((a: any) => a.assignedBusIds?.includes(bus.id)).map((a: any) => {
                                                // Calculate Position
                                                // Assuming API returns YYYY-MM-DD or similar. Needs strict parsing.
                                                // My mock uses '2026-02-03'. 
                                                // I need to parse a.fromDate and a.toDate and compare to today.

                                                // Helper to parse "dd/mm/yyyy" OR "yyyy-mm-dd" based on what backend returns.
                                                // Earlier I saw "04/02/2026" in the dashboard list.
                                                const parseD = (str: string) => {
                                                    if (!str) return new Date();
                                                    if (str.includes('/')) {
                                                        const [d, m, y] = str.split('/');
                                                        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                                                    }
                                                    return new Date(str);
                                                };

                                                const start = parseD(a.fromDate);
                                                const end = parseD(a.toDate);
                                                const today = new Date(); today.setHours(0, 0, 0, 0);

                                                // Calculate offsets relative to TODAY
                                                const diffStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                                // Only render if visible in next 31 days
                                                if (diffStart + duration < 0 || diffStart > 30) return null;

                                                // Cap at 0 (if started in past) and 30 (if ends in future)
                                                const visualStart = Math.max(0, diffStart);
                                                const visualDuration = Math.min(duration - (visualStart - diffStart), 31 - visualStart);

                                                return (
                                                    <div key={a.id}
                                                        title={`${a.customerName} (${a.fromDate} - ${a.toDate})`}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${150 + (visualStart * 40)}px`, // 150 offset + 40px per day
                                                            width: `${visualDuration * 40}px`,
                                                            top: '8px', bottom: '8px',
                                                            backgroundColor: '#C5A059',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                            display: 'flex', alignItems: 'center', paddingLeft: '8px',
                                                            fontSize: '10px', color: 'black', fontWeight: 'bold',
                                                            overflow: 'hidden', whiteSpace: 'nowrap',
                                                            cursor: 'pointer', zIndex: 5,
                                                            opacity: 0.9,
                                                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                                                        }}>
                                                        {a.customerName}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </>
                )}
            </main>

            {/* ASSIGN MODAL */}
            {assignModal.open && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
                        <h3 style={{ marginBottom: '20px', fontFamily: 'serif', fontSize: '20px' }}>Assign Bus</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            {data.buses.filter(b => b.isActive).map(b => (
                                <button key={b.id} onClick={() => handleAssignBus(b.id)}
                                    style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }}>
                                    {b.vehicleNumber}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button onClick={handleUnassignBus} style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', cursor: 'pointer' }}>Unassign</button>
                            <button onClick={() => setAssignModal({ open: false, agreementId: null })} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            {/* EXPENSE MODAL */}
            {expenseModal.open && expenseModal.agreement && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '400px' }}>
                        <h3 style={{ marginBottom: '20px', fontFamily: 'serif', fontSize: '20px', color: '#f87171' }}>Log Trip Expense</h3>
                        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#888' }}>
                            For Trip ID: <span style={{ color: 'white' }}>{expenseModal.agreement.id.slice(0, 6)}</span> ({expenseModal.agreement.customerName})
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const amount = formData.get('amount');
                            const type = formData.get('type');
                            // Logic to save expense would go here
                            console.log('Saving expense:', { agreementId: expenseModal.agreement.id, amount, type });
                            alert('Expense Logged (Mock)');
                            setExpenseModal({ open: false, agreement: null });
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={styles.label}>Expense Type</label>
                                <select name="type" style={styles.input}>
                                    <option value="FUEL">Fuel / Diesel</option>
                                    <option value="TOLL">Toll & Parking</option>
                                    <option value="DRIVER_BATTA">Driver Batta / Food</option>
                                    <option value="REPAIR">Repair / Maintenance</option>
                                    <option value="RTO">Police / RTO / Challan</option>
                                    <option value="MISC">Miscellaneous</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={styles.label}>Amount (₹)</label>
                                <input name="amount" type="number" required placeholder="0.00" style={styles.input} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setExpenseModal({ open: false, agreement: null })}
                                    style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ flex: 1, padding: '12px', backgroundColor: '#f87171', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
                                    Log Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* PAYMENT MODAL */}
            {paymentModal.open && paymentModal.agreement && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '400px' }}>
                        <h3 style={{ marginBottom: '20px', fontFamily: 'serif', fontSize: '20px', color: '#4ADE80' }}>Record Payment</h3>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            alert('Payment Recorded (Mock)');
                            setPaymentModal({ open: false, agreement: null });
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={styles.label}>Payment Mode</label>
                                <select name="mode" style={styles.input}>
                                    <option value="CASH">CASH</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">CARD</option>
                                    <option value="TRANSFER">BANK TRANSFER</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={styles.label}>Amount Received (₹)</label>
                                <input name="amount" type="number" required placeholder="0.00" style={{ ...styles.input, color: '#4ADE80', fontWeight: 'bold' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setPaymentModal({ open: false, agreement: null })}
                                    style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit"
                                    style={{ flex: 1, padding: '12px', backgroundColor: '#4ADE80', border: 'none', color: 'black', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
                                    Verify Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <div onClick={onClick} style={styles.navItem(active)}>
            <div style={{ color: active ? '#C5A059' : 'inherit' }}>{icon}</div>
            <div style={styles.navLabel}>{label}</div>
        </div>
    );
}

// Utils
const formatDateForApi = (d: Date) => d.toISOString().split('T')[0];
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
