'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_FLEET, Vehicle } from '@/lib/mockData';

export default function SearchPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_FLEET);
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        date: '',
        passengers: ''
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock filtering logic
        let filtered = [...MOCK_FLEET];

        if (filters.passengers) {
            const p = parseInt(filters.passengers);
            filtered = filtered.filter(v => v.seats >= p);
        }

        // Basic "type" search from 'from' field just for demo if they type "bus" or "van"
        if (filters.from && (filters.from.toLowerCase().includes('bus') || filters.from.toLowerCase().includes('van'))) {
            // Just a playful demo logic, normally this filters by route availability
        }

        setVehicles(filtered);
    };

    const handleBook = (vehicleId: string) => {
        router.push(`/book/${vehicleId}`);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '80px', paddingTop: '80px' }}>
            {/* Search Header */}
            <div style={{ background: '#151515', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '60px 0' }}>
                <div className="container">
                    <h1 className="section-title text-center" style={{ fontSize: '36px', marginBottom: '40px' }}>Find Your Perfect Ride</h1>

                    <form onSubmit={handleSearch} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                        alignItems: 'end',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>From / Type</label>
                            <input
                                type="text"
                                placeholder="City or Vehicle Type"
                                value={filters.from}
                                onChange={e => setFilters({ ...filters, from: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', color: '#000' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>To</label>
                            <input
                                type="text"
                                placeholder="Destination"
                                value={filters.to}
                                onChange={e => setFilters({ ...filters, to: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', color: '#000' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>Date</label>
                            <input
                                type="date"
                                value={filters.date}
                                onChange={e => setFilters({ ...filters, date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', color: '#000' }}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                            <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>Pax</label>
                            <input
                                type="number"
                                placeholder="Seats"
                                value={filters.passengers}
                                onChange={e => setFilters({ ...filters, passengers: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', color: '#000' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '48px', padding: '0 32px' }}>
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* Results */}
            <div className="container" style={{ marginTop: '60px' }}>
                <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '32px' }}>Available Vehicles</h2>

                <div className="card-grid">
                    {vehicles.map(v => (
                        <div key={v.id} className="fleet-card">
                            <div className="fleet-image" style={{ height: '250px' }}>
                                <img
                                    src={v.image}
                                    alt={v.name}
                                    style={{ maxHeight: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="fleet-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{v.name}</h3>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>{v.type} • {v.seats} Seats</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '24px', color: 'var(--primary)', fontFamily: 'var(--font-playfair)', fontWeight: 'bold' }}>₹{v.pricePerDay.toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Per Day</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {v.features.map(f => (
                                        <span key={f} style={{
                                            fontSize: '10px',
                                            padding: '6px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '4px',
                                            color: 'rgba(255,255,255,0.7)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {f}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleBook(v.id)}
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {vehicles.length === 0 && (
                    <div className="text-center" style={{ padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}>
                        No vehicles found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
