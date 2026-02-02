"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from 'next/link';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await fetch(`${API_URL}/account/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const session = await res.json();
                    setUser(session);

                    // Fetch customer's specific bookings
                    const bookRes = await fetch(`${API_URL}/bookings/my-bookings`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (bookRes.ok) setBookings(await bookRes.json());
                } else {
                    router.push('/login');
                }
            } catch (err) {
                console.error("Auth error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [router]);

    const handleCancel = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this heritage journey? A 10% processing fee may apply.")) return;

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/bookings/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            setBookings(bookings.filter(b => b.id !== id));
            alert("Reservation Cancelled Successfully.");
        }
    };

    if (loading) return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-primary italic">Decrypting your profile...</div>;

    return (
        <main className="min-h-screen bg-bg-dark text-white">
            <Navbar />

            <div className="pt-24 md:pt-32 max-w-[1000px] mx-auto px-6 md:px-8 space-y-8 md:space-y-12">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-8 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold italic leading-tight">Your <span className="text-primary underline decoration-primary/20">Heritage Ledger</span></h1>
                        <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold mt-2">Member since {new Date(user?.joinedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto p-4 sm:p-0 bg-white/5 sm:bg-transparent rounded-2xl border border-white/5 sm:border-0">
                        <p className="text-sm font-bold text-white">{user?.name}</p>
                        <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">{user?.email}</p>
                    </div>
                </header>

                <section className="space-y-6 md:space-y-8">
                    <h2 className="text-lg md:text-xl font-serif font-bold text-white/60">Active Reservations</h2>

                    {bookings.length === 0 ? (
                        <div className="p-12 md:p-20 glass-dark rounded-[32px] md:rounded-[40px] border border-white/5 text-center">
                            <p className="text-white/30 italic text-sm md:text-base">No bookings found in your ledger.</p>
                            <Link href="/search" className="text-primary text-[10px] uppercase tracking-widest font-bold mt-4 inline-block hover:underline italic">Begin a New Journey →</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map(b => (
                                <div key={b.id} className="glass-dark p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-primary/20 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-8">
                                    <div className="flex gap-4 md:gap-6 items-center w-full lg:w-auto">
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-primary text-xl md:text-2xl italic font-serif">S</div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-base md:text-lg text-white font-serif">{b.vehicleName}</h4>
                                            <p className="text-[9px] md:text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Travel Date: {b.date}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full lg:w-auto px-0 lg:px-8 grid grid-cols-2 gap-4 md:gap-8 border-y lg:border-0 border-white/5 py-6 lg:py-0">
                                        <div className="text-left">
                                            <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Destination</p>
                                            <p className="text-[11px] md:text-xs font-bold text-white leading-tight">{b.destination}</p>
                                        </div>
                                        <div className="text-right lg:text-left">
                                            <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Status</p>
                                            <p className="text-[9px] md:text-[10px] text-primary font-bold uppercase">{b.status}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">Paid (Advance)</p>
                                            <p className="text-lg md:text-xl font-bold text-primary italic">₹{b.advancePaid?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/track/${b.id}`} className="px-5 md:px-6 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all text-center">Track Live</Link>
                                            <button onClick={() => handleCancel(b.id)} className="px-5 md:px-6 py-2 bg-white/5 text-red-500/60 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-red-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
