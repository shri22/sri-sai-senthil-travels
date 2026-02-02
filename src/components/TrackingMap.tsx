"use client";
import { useState, useEffect } from 'react';

export default function TrackingMap({ vehicleId, center }: { vehicleId?: string, center?: { lat: number, lng: number } }) {
    const [pos, setPos] = useState({ x: 45, y: 30 });
    const [history, setHistory] = useState<{ x: number, y: number }[]>([]);

    useEffect(() => {
        if (center) {
            // Map lat/lng to hypothetical 0-100 x/y grid for the svg
            // Chennai area is roughly 13.0, 80.2. We'll just use the decimals for movement
            const nextX = 50 + (center.lng - 80.2707) * 500;
            const nextY = 50 + (center.lat - 13.0827) * 500;

            const constrainedX = Math.max(5, Math.min(95, nextX));
            const constrainedY = Math.max(5, Math.min(95, nextY));

            setPos({ x: constrainedX, y: constrainedY });
            setHistory(h => [...h.slice(-20), { x: constrainedX, y: constrainedY }]);
        }
    }, [center]);

    return (
        <div className="relative w-full aspect-video bg-[#0f0f0f] rounded-[40px] border border-white/5 overflow-hidden shadow-inner">
            {/* Heritage Map Grid Background */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #c5a059 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Mock Map Features */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
                <path d="M0,50 Q25,45 50,50 T100,50" fill="none" stroke="#c5a059" strokeWidth="0.5" strokeDasharray="2,2" />
                <path d="M50,0 Q55,25 50,50 T50,100" fill="none" stroke="#c5a059" strokeWidth="0.5" strokeDasharray="2,2" />
                <circle cx="50" cy="50" r="1" fill="#c5a059" />
            </svg>

            {/* Path History */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <polyline
                    points={history.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#c5a059"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Live Vehicle Marker */}
            <div
                className="absolute w-6 h-6 -ml-3 -mt-3 transition-all duration-3000 ease-linear"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="absolute inset-1 bg-primary rounded-full shadow-[0_0_15px_rgba(197,160,89,0.8)] border-2 border-white/20 flex items-center justify-center">
                    <span className="text-[8px] text-black font-bold">V</span>
                </div>

                {/* Label */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-md border border-primary/30 whitespace-nowrap shadow-xl">
                    <p className="text-[8px] text-white font-bold tracking-widest uppercase">Urban Van #01</p>
                    <p className="text-[6px] text-primary font-bold uppercase tracking-widest">Active • 42 km/h</p>
                </div>
            </div>

            {/* Map UI Overlay */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-2">
                <div className="glass-dark px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">GPRS: LIVE RECEPTION</span>
                </div>
            </div>

            <div className="absolute top-6 right-6">
                <div className="glass-dark px-4 py-2 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest text-primary font-bold">
                    LAT: {pos.x.toFixed(4)}° / LONG: {pos.y.toFixed(4)}°
                </div>
            </div>
        </div>
    );
}
