"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import S3TLogo from './S3TLogo';

export default function Navbar() {
    const [user, setUser] = useState<any>(null);

    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/account/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => data && setUser(data));
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Services', href: '/#services' },
        { name: 'Fleet', href: '/#fleet' },
        { name: 'Contact', href: '/#contact' },
    ];

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled || isMenuOpen ? 'glass-dark h-20 border-white/10' : 'bg-transparent h-28 border-transparent'}`}>
            <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex justify-between items-center h-full">
                <Link href="/" className="flex items-center gap-3 md:gap-6 group">
                    <S3TLogo className="w-10 md:w-16 h-auto transition-transform group-hover:scale-105" />
                    <div className="flex flex-col border-l border-white/20 pl-4 md:pl-6 h-8 md:h-12 justify-center">
                        <span className="font-serif text-sm md:text-xl font-bold tracking-tight text-primary leading-none uppercase">SRI SAI SENTHIL</span>
                        <span className="text-[7px] md:text-[9px] uppercase tracking-[0.5em] text-primary/60 font-bold mt-1 md:mt-2">SINCE 1987</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    {navLinks.map(link => (
                        <Link key={link.name} href={link.href} className="hover:text-primary transition-colors">{link.name}</Link>
                    ))}
                </div>

                <div className="flex gap-4 items-center">
                    <div className="hidden sm:flex gap-4 items-center">
                        {user ? (
                            <div className="flex gap-4 md:gap-6 items-center">
                                <Link href={user.role?.toLowerCase() === 'admin' ? '/admin' : user.role?.toLowerCase() === 'partner' ? '/dashboard' : '/profile'} className="text-[9px] md:text-[10px] uppercase tracking-widest text-primary font-bold hover:underline italic">
                                    Welcome, {user.name.split(' ')[0]}
                                </Link>
                                <button onClick={logout} className="text-[8px] uppercase tracking-widest text-white/30 hover:text-red-500 font-bold">Sign Out</button>
                            </div>
                        ) : (
                            <Link href="/login" className="px-5 py-2 border border-white/20 rounded-full text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all font-bold text-white">
                                Member
                            </Link>
                        )}
                    </div>

                    <Link href="/search" className="hidden xs:flex px-4 md:px-6 py-2 bg-primary text-black rounded-full text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all font-bold shadow-lg shadow-primary/20">
                        Book Now
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none"
                    >
                        <div className={`w-6 h-[2px] bg-primary transition-all ${isMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`} />
                        <div className={`w-6 h-[2px] bg-primary transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
                        <div className={`w-6 h-[2px] bg-primary transition-all ${isMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`lg:hidden fixed inset-0 top-20 bg-bg-dark/95 backdrop-blur-2xl transition-all duration-500 z-40 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="text-2xl font-serif font-bold text-white hover:text-primary transition-colors italic"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="w-12 h-[1px] bg-white/10 my-4" />
                    {user ? (
                        <>
                            <Link
                                href={user.role?.toLowerCase() === 'admin' ? '/admin' : user.role?.toLowerCase() === 'partner' ? '/dashboard' : '/profile'}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-primary text-sm font-bold uppercase tracking-widest"
                            >
                                Dashboard
                            </Link>
                            <button onClick={logout} className="text-white/40 text-xs font-bold uppercase tracking-widest">Sign Out</button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="px-12 py-4 border border-white/20 rounded-full text-sm uppercase tracking-widest font-bold text-white"
                        >
                            Member Area
                        </Link>
                    )}
                    <Link
                        href="/search"
                        onClick={() => setIsMenuOpen(false)}
                        className="px-12 py-4 bg-primary text-black rounded-full text-sm uppercase tracking-widest font-bold shadow-xl shadow-primary/20"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </nav>
    );
}
