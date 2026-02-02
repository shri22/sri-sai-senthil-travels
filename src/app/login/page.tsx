"use client";
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import S3TLogo from '@/components/S3TLogo';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email')?.toString();
        const password = formData.get('password')?.toString();

        try {
            const res = await fetch(`${API_URL}/account/login`, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);

                const userRole = data.user.role?.toLowerCase();
                if (userRole === 'admin') {
                    router.push('/admin');
                } else if (userRole === 'partner') {
                    router.push('/dashboard');
                } else {
                    router.push('/');
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-bg-dark flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center space-y-4">
                        <S3TLogo className="w-20 md:w-24 h-auto mx-auto mb-6 md:mb-8" />
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white uppercase tracking-tight">Heritage <span className="text-primary italic">Portal</span></h1>
                        <p className="text-text-muted text-[10px] md:text-sm uppercase tracking-widest font-bold">Secure access for members, partners & S3T</p>
                    </div>

                    <form onSubmit={handleLogin} className="glass-dark p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-white/10 space-y-6 shadow-2xl">
                        <div className="space-y-2">
                            <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Email Address</label>
                            <input
                                required
                                name="email"
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-white/10"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold">Password</label>
                            <input
                                required
                                name="password"
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white text-sm focus:border-primary focus:outline-none transition-all placeholder:text-white/10"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-red-400 text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-center">{error}</p>}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[11px] md:text-[12px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold hover:bg-white transition-all disabled:opacity-50 flex justify-center items-center shadow-lg shadow-primary/10"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : "Authorize Entrance"}
                        </button>

                        <div className="text-center pt-2">
                            <a href="/register" className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/30 hover:text-primary transition-all font-bold">Apply for Partnership</a>
                        </div>
                    </form>
                </div>
            </div>

            <footer className="p-8 text-center text-[8px] uppercase tracking-[0.4em] text-white/20 font-bold">
                SRI SAI SENTHIL TRAVELS &copy; {new Date().getFullYear()} • ENCRYPTED PARTNER PORTAL
            </footer>
        </main>
    );
}
