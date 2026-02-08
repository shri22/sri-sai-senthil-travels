import Link from 'next/link';
import { Facebook, Instagram, Twitter, Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '24px', fontSize: '24px' }}>
                            Sri Sai Senthil Travels
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            Premium transport solutions since 1987. Redefining luxury travel across India.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex' }}>
                                <Instagram size={20} />
                            </Link>
                            <Link href="#" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex' }}>
                                <Facebook size={20} />
                            </Link>
                            <Link href="#" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex' }}>
                                <Twitter size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ marginBottom: '24px', fontSize: '18px' }}>Quick Links</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li><Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link></li>
                            <li><Link href="/search" style={{ color: 'var(--text-muted)' }}>Book a Vehicle</Link></li>
                            <li><Link href="/signup?role=partner" style={{ color: 'var(--text-muted)' }}>Partner Registration</Link></li>
                            <li><Link href="/login" style={{ color: 'var(--text-muted)' }}>Member Login</Link></li>
                        </ul>
                    </div>

                    {/* Fleet */}
                    <div>
                        <h4 style={{ marginBottom: '24px', fontSize: '18px' }}>Our Fleet</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li style={{ color: 'var(--text-muted)' }}>Urbania Luxury Van</li>
                            <li style={{ color: 'var(--text-muted)' }}>Volvo B11R Multi-Axle</li>
                            <li style={{ color: 'var(--text-muted)' }}>Mercedes Benz Glider</li>
                            <li style={{ color: 'var(--text-muted)' }}>Toyota Innova Crysta</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div id="contact">
                        <h4 style={{ marginBottom: '24px', fontSize: '18px' }}>Contact Us</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                                <MapPin className="text-gold" size={20} />
                                <span>123 Heritage Lane, Chennai, TN<br />India</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                                <Phone className="text-gold" size={20} />
                                <span>+91 94438 56913</span>
                            </li>
                            <li style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)' }}>
                                <Mail className="text-gold" size={20} />
                                <span>info@srisaisenthiltravels.cloud</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '32px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: 'var(--text-muted)'
                }}>
                    <p>© {new Date().getFullYear()} Sri Sai Senthil Travels. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
