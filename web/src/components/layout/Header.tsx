'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User } from 'lucide-react';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Services', href: '/#services' },
        { name: 'Fleet', href: '/#fleet' },
        { name: 'Contact', href: '/#contact' },
    ];

    // Check auth state on mount and path change
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, [pathname]);

    return (
        <header className="main-header">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        Sri Sai Senthil
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', letterSpacing: '4px', fontFamily: 'var(--font-playfair)' }}>
                        TRAVELS
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="nav-desktop hidden-mobile">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="nav-link"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link
                        href={isLoggedIn ? "/dashboard" : "/login"}
                        className="nav-link"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <User size={16} />
                        {isLoggedIn ? 'Dashboard' : 'Member'}
                    </Link>
                    <Link
                        href="/search"
                        className="btn btn-primary"
                        style={{ padding: '10px 24px', fontSize: '10px' }}
                    >
                        Book Now
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="visible-mobile"
                    style={{ color: 'white', background: 'none', border: 'none', display: 'none' }}
                    // Note: 'display: none' is override by @media in css if I added it. 
                    // Actually I need to add .hidden-mobile and .visible-mobile to globals.css to handle this properly.
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    zIndex: 999
                }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase' }}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        style={{ fontSize: '18px', display: 'flex', gap: '12px', color: 'white' }}
                    >
                        <User size={24} />
                        Member Area
                    </Link>
                    <Link
                        href="/search"
                        onClick={() => setIsOpen(false)}
                        className="btn btn-primary"
                    >
                        Book Now
                    </Link>
                </div>
            )}

            <style jsx>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .visible-mobile { display: block !important; }
                }
            `}</style>
        </header>
    );
}
