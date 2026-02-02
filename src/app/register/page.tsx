"use client";
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import S3TLogo from '@/components/S3TLogo';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const registerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            company: formData.get('agency'),
            role: "Partner"
        };

        try {
            const res = await fetch(`${API_URL}/account/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            });

            if (res.ok) {
                setStep(3);
            } else {
                const data = await res.json();
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-bg-dark flex flex-col relative overflow-hidden">
            <Navbar />

            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/3" />

            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-2xl space-y-8 md:space-y-12">
                    {step < 3 && (
                        <div className="text-center space-y-3 md:space-y-4">
                            <S3TLogo className="w-16 md:w-20 h-auto mx-auto mb-4 md:mb-6" />
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight uppercase">Join the <span className="text-primary italic">Legacy</span></h1>
                            <p className="text-text-muted text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] font-bold">Partner Network Registration</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="glass-dark p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-white/10 space-y-6 md:space-y-8 animate-fade-in mx-auto">
                            <h2 className="text-xl md:text-2xl font-serif text-white">Why partner with us?</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <div className="text-primary text-lg md:text-xl font-bold">01.</div>
                                    <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">Heritage Branding</h3>
                                    <p className="text-[10px] md:text-xs text-text-muted">Leverage 35+ years of customer trust.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-primary text-lg md:text-xl font-bold">02.</div>
                                    <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">Smart Fleet</h3>
                                    <p className="text-[10px] md:text-xs text-text-muted">Advanced SaaS dashboard for full control.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[11px] md:text-[12px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold hover:bg-white transition-all shadow-xl shadow-primary/20"
                            >
                                Initiate Application
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleRegister} className="glass-dark p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-white/10 space-y-4 md:space-y-6 animate-fade-in shadow-2xl mx-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Your Name</label>
                                    <input required name="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all" placeholder="Enter Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Agency Name</label>
                                    <input required name="agency" type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all" placeholder="Enter Agency" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Work Email</label>
                                <input required name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all" placeholder="agency@example.com" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Password</label>
                                <input required name="password" type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all" placeholder="••••••••" />
                            </div>

                            {error && <p className="text-red-400 text-xs text-center uppercase tracking-widest font-bold">{error}</p>}

                            <div className="pt-4 md:pt-6">
                                <button disabled={loading} type="submit" className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[11px] md:text-[12px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold hover:bg-white transition-all flex justify-center items-center shadow-lg shadow-primary/10">
                                    {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Submit for Verification"}
                                </button>
                                <button onClick={() => setStep(1)} type="button" className="w-full py-3 md:py-4 text-white/30 text-[9px] md:text-[10px] uppercase tracking-widest font-bold hover:text-white transition-all">Back</button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="glass-dark p-10 md:p-16 rounded-[40px] md:rounded-[50px] border border-white/10 text-center space-y-6 md:space-y-8 animate-fade-in shadow-2xl relative mx-auto">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary mx-auto">
                                <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                <h2 className="text-3xl md:text-4xl font-serif text-white leading-tight">Application <br className="md:hidden" /><span className="text-primary italic">Received</span></h2>
                                <p className="text-text-muted text-sm max-w-sm mx-auto">Our heritage board will review your credentials. You will receive an invitation code via email within 24 hours.</p>
                            </div>
                            <div className="pt-6 md:pt-8 text-center">
                                <Link href="/" className="inline-block px-10 md:px-12 py-4 md:py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white transition-all">Back to Home</Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
