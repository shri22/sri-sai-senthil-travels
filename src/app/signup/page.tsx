"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Navbar from "@/components/Navbar";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialRole = searchParams?.get('role') || 'Customer';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        companyName: '',
        address: ''
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_URL}/account/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: initialRole,
                    companyName: formData.companyName,
                    address: formData.address
                }),
            });

            if (res.ok) {
                if (initialRole === 'Partner') {
                    alert("Application Submitted. S3T Admin will review your registration.");
                }
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Navbar />

            {/* Background Aesthetics */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />

            <div className="w-full max-w-md relative z-10 glass-dark p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-white/10 space-y-6 md:space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-white italic">
                        {initialRole === 'Partner' ? 'Operator' : 'Heritage'} <span className="text-primary">{initialRole === 'Partner' ? 'Onboarding' : 'Journey'}</span>
                    </h1>
                    <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40 font-bold">
                        {initialRole === 'Partner' ? 'Join the S3T Global Transport Network' : 'Create your personal member profile'}
                    </p>
                </div>

                {error && <p className="text-red-400 text-[10px] text-center font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">
                            {initialRole === 'Partner' ? 'Contact Person Name' : 'Full Name'}
                        </label>
                        <input
                            type="text" required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            placeholder={initialRole === 'Partner' ? "Aditya Verma" : "Aditya Verma"}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {initialRole === 'Partner' && (
                        <>
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">
                                    Travel Agency / Company Name
                                </label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                                    placeholder="Heritage Travels Pvt Ltd"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">
                                    Office Address
                                </label>
                                <input
                                    type="text" required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                                    placeholder="123, Temple St, Madurai"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">Work Email Address</label>
                        <input
                            type="email" required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            placeholder="agency@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">Phone Number</label>
                        <input
                            type="tel" required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            placeholder="+91 94438 56913"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[9px] md:text-[10px] text-primary font-bold uppercase ml-2 tracking-widest">Portal Password</label>
                        <input
                            type="password" required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary focus:outline-none transition-all"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[11px] md:text-[12px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-primary/20 mt-4 md:mt-6"
                    >
                        {loading ? 'Processing...' : (initialRole === 'Partner' ? 'Submit Application' : 'Authorize Registration')}
                    </button>
                </form>

                <p className="text-center text-[9px] md:text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    Already an initiate? <Link href="/login" className="text-primary hover:underline italic">Login to Portal</Link>
                </p>
            </div>
        </div>
    );
}
