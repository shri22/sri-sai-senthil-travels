"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function BookingForm() {
    const [terrain, setTerrain] = useState('plain');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [numDays, setNumDays] = useState(1);
    const [places, setPlaces] = useState('');

    const calculateEndDate = () => {
        if (!date) return '';
        const d = new Date(date);
        d.setDate(d.getDate() + (Number(numDays) - 1));
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="glass-dark p-6 md:p-8 rounded-[32px] mt-8 md:mt-12 w-full max-w-6xl animate-fade-in shadow-2xl border border-white/10 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="flex flex-col gap-2 text-left md:col-span-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Pick-up From</label>
                    <input
                        type="text"
                        placeholder="Starting Point"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/20"
                    />
                </div>

                <div className="flex flex-col gap-2 text-left md:col-span-3">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Destination To</label>
                    <input
                        type="text"
                        placeholder="Where to?"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/20"
                    />
                </div>

                <div className="flex flex-col gap-2 text-left md:col-span-2">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Travel Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                </div>

                <div className="flex flex-col gap-2 text-left md:col-span-1">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Days</label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={numDays}
                        onChange={(e) => setNumDays(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-primary transition-all"
                    />
                </div>

                <div className="flex flex-col gap-2 text-left md:col-span-2">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Terrain Type</label>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setTerrain('plain')}
                            className={`flex-1 py-3 text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg transition-all ${terrain === 'plain' ? 'bg-primary text-black font-bold' : 'text-white/60 hover:text-white'}`}
                        >
                            Plain
                        </button>
                        <button
                            onClick={() => setTerrain('hills')}
                            className={`flex-1 py-3 text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg transition-all ${terrain === 'hills' ? 'bg-primary text-black font-bold' : 'text-white/60 hover:text-white'}`}
                        >
                            Hills
                        </button>
                    </div>
                </div>

                <div className="flex items-end md:col-span-2">
                    <Link
                        href={`/search?from=${from}&to=${to}&date=${date}&endDate=${calculateEndDate()}&terrain=${terrain}&places=${places}`}
                        className="w-full bg-primary text-black font-bold py-3 md:py-4 rounded-xl hover:bg-white transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px] md:text-xs text-center flex items-center justify-center"
                    >
                        Search Fleet
                    </Link>
                </div>

                <div className="md:col-span-12 flex flex-col gap-2 text-left">
                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Places to Visit (Short Description)</label>
                    <input
                        type="text"
                        placeholder="e.g. Madurai Temple, Kodaikanal Lake, etc."
                        value={places}
                        onChange={(e) => setPlaces(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/20"
                    />
                </div>
            </div>
        </div>
    );
}
