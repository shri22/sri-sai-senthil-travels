'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { fetchJson } from '@/lib/api';

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPartner = searchParams.get('role') === 'partner';

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        companyName: '',
        companyAddress: '',
        companyPhone: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isPartner) {
            if (!formData.companyName || !formData.companyPhone) {
                setError("Company Name and Phone are required for partners.");
                return;
            }
        }

        setLoading(true);

        try {
            const data = await fetchJson('/Auth/register', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            if (data) {
                // Login automatically
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                router.push('/dashboard');
            }

        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputStyle = {
        width: '100%',
        padding: '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white',
        outline: 'none',
        marginBottom: '20px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        marginBottom: '8px',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 'bold',
        letterSpacing: '1px'
    };

    return (
        <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>
                    {isPartner ? 'Partner Registration' : 'Create Account'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    {isPartner
                        ? 'Join our network and grow your travel business'
                        : 'Join our community for exclusive benefits'}
                </p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    color: '#ef4444',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '32px',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Left Column - Login Details */}
                    <div>
                        <h3 style={{ fontSize: '18px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            Account Details
                        </h3>

                        <label style={labelStyle}>Username *</label>
                        <input
                            name="username"
                            type="text"
                            required
                            style={inputStyle}
                            value={formData.username}
                            onChange={handleChange}
                        />

                        <label style={labelStyle}>Password *</label>
                        <input
                            name="password"
                            type="password"
                            required
                            style={inputStyle}
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <label style={labelStyle}>Email Address</label>
                        <input
                            name="email"
                            type="email"
                            style={inputStyle}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Right Column - Empty if not partner, fields if partner */}
                    {isPartner ? (
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                Company Details
                            </h3>

                            <label style={labelStyle}>Company Name *</label>
                            <input
                                name="companyName"
                                type="text"
                                required
                                style={inputStyle}
                                value={formData.companyName}
                                onChange={handleChange}
                            />

                            <label style={labelStyle}>Contact Phone *</label>
                            <input
                                name="companyPhone"
                                type="tel"
                                required
                                style={inputStyle}
                                value={formData.companyPhone}
                                onChange={handleChange}
                            />

                            <label style={labelStyle}>Address</label>
                            <textarea
                                name="companyAddress"
                                rows={3}
                                style={{ ...inputStyle, fontFamily: 'inherit' }}
                                value={formData.companyAddress}
                                onChange={handleChange}
                            />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '32px' }}>
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                <p style={{ fontSize: '14px', marginBottom: '16px' }}>Benefits of joining:</p>
                                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                                    <li style={{ marginBottom: '8px' }}>✓ Faster Bookings</li>
                                    <li style={{ marginBottom: '8px' }}>✓ Exclusive Discounts</li>
                                    <li>✓ Booking History</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '40px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Creating Account...' : (isPartner ? 'Register as Partner' : 'Sign Up')}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    Sign In
                </Link>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: 'var(--background)'
        }}>
            <Suspense fallback={<div>Loading...</div>}>
                <SignupForm />
            </Suspense>
        </div>
    );
}
