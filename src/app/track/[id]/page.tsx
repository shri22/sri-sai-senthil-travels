"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TrackingMap from '@/components/TrackingMap';

export default function TrackingPage() {
    const params = useParams();
    const [trackingData, setTrackingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await fetch(`${API_URL}/bookings/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrackingData({
                        active: data.status === 'Started' || data.status === 'InProgress',
                        location: data.currentLat ? { lat: data.currentLat, lng: data.currentLng } : null,
                        vehicleName: "Heritage Fleet", // Ideally fetch from vehicleId
                        status: data.status,
                        message: data.status === 'Confirmed' ? "Journey scheduled. Tracking starts once the vehicle departs." : "Tracking offline."
                    });
                }
            } catch (err) {
                console.error("Tracking fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTracking();
        const interval = setInterval(fetchTracking, 15000);
        return () => clearInterval(interval);
    }, [params.id, API_URL]);

    return (
        <main className="min-h-screen bg-bg-dark text-text-main pb-20">
            <Navbar />
            <div className="pt-24 md:pt-32 max-w-[1200px] mx-auto px-6 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">Live <span className="text-primary italic">Tracking</span></h1>
                            {trackingData?.active && (
                                <span className="flex items-center gap-2 text-[9px] md:text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Status Active
                                </span>
                            )}
                        </div>

                        <div className="aspect-[4/3] sm:aspect-video rounded-[32px] md:rounded-[40px] overflow-hidden border border-white/10 glass-dark">
                            {trackingData?.active ? (
                                <TrackingMap center={trackingData.location} />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 md:p-10 space-y-4">
                                    <div className="text-5xl md:text-6xl">🔒</div>
                                    <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest">Tracking Locked</h3>
                                    <p className="text-white/40 text-sm max-w-sm font-bold uppercase tracking-widest">{trackingData?.message || 'Tracking will be available once your heritage journey commences.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                        <div className="glass-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/5 space-y-6 md:space-y-8">
                            <h3 className="text-xl font-serif font-bold text-white italic">Journey Intelligence</h3>

                            <div className="space-y-5 md:space-y-6">
                                <div>
                                    <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Assigned Vehicle</p>
                                    <p className="text-base md:text-lg text-white font-bold">{trackingData?.vehicleName || 'Fetching...'}</p>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div>
                                    <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Current Status</p>
                                    <p className="text-base md:text-lg text-primary font-bold italic">{trackingData?.status || 'Waiting for system...'}</p>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div>
                                    <p className="text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Trip Reliability</p>
                                    <p className="text-base md:text-lg text-white font-bold uppercase">99.8% System Uptime</p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all text-white">
                                Contact Driver Support
                            </button>
                        </div>

                        <div className="p-6 md:p-8 bg-primary/5 rounded-[32px] md:rounded-[40px] border border-primary/20">
                            <p className="text-[9px] md:text-[10px] text-primary font-bold uppercase tracking-widest mb-3 md:mb-4">Heritage Security Note</p>
                            <p className="text-xs text-white/60 leading-relaxed italic">Your safety is our priority. Tracking is monitored 24/7 by the Sri Sai Senthil Operations Team.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
