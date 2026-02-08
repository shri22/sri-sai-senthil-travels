import Link from 'next/link';
import { ArrowRight, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        {/* Background - Extracted URL */}
        <div
          className="hero-bg"
          style={{
            backgroundImage: 'url("https://srisaisenthiltravels.cloud/images/hero.png")',
          }}
        />

        <div className="container hero-content">
          <div className="badge">
            <span className="badge-dot"></span>
            <span className="badge-text">
              Premium Transport Since 1987
            </span>
          </div>

          <h1 className="hero-title">
            Journeys that <br />
            <span className="text-gold italic">Define Heritage</span>
          </h1>

          <p className="hero-subtitle">
            Experience the trust of nearly four decades. From luxury buses to premium vans,
            we provide the perfect companion for your travels.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/search" className="btn btn-primary">
              Search Fleet
            </Link>
            <Link href="/signup?role=partner" className="btn btn-outline">
              Partner with Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div className="stats-grid">
            <div>
              <h2 className="section-title">
                A Legacy of Trust, <br />
                <span className="text-gold italic">Spanning Generations.</span>
              </h2>
              <p className="section-desc">
                Started in 1987, Sri Sai Senthil Travels has been at the forefront of the travel industry. We believe that every journey is a story waiting to be told.
              </p>

              <div className="flex gap-4">
                <div className="stat-item">
                  <div className="stat-number">35+</div>
                  <div className="stat-label">Years of Excellence</div>
                </div>
                <div style={{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.1)', margin: '0 32px' }} className="hidden-mobile"></div>
                <div className="stat-item">
                  <div className="stat-number">5000+</div>
                  <div className="stat-label">Happy Tourists</div>
                </div>
              </div>
            </div>

            <div>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '60px', position: 'relative', textAlign: 'center' }}>
                  <blockquote style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontStyle: 'italic', marginBottom: '24px' }}>
                    "Excellence is not an act, but a habit. We strive for perfection in every mile we cover."
                  </blockquote>
                  <footer style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)' }}>
                    — Founder's Vision
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Curated for Every Occasion</h2>
            <p className="section-desc" style={{ margin: '0 auto 60px' }}>We don't just provide transport; we craft experiences for your most important moments.</p>
          </div>

          <div className="card-grid">
            {/* Card 1 */}
            <div className="glass-card">
              <div className="card-icon">
                <Star size={24} />
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Grand Weddings</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Transport your guests in regal style. Logistics managed by experts so you can enjoy the celebration.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card">
              <div className="card-icon">
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Corporate Convoys</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Punctual, professional fleets for your business delegates. Seamless coordination for large events.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card">
              <div className="card-icon">
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Spiritual Pilgrimages</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Serene journeys to sacred destinations with comfort. Experienced drivers who know the routes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Preview Section */}
      <section id="fleet" className="section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div className="flex justify-between items-center" style={{ marginBottom: '60px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 className="section-title">Experience <span className="text-gold italic">True Comfort</span></h2>
              <p className="section-desc" style={{ marginBottom: 0 }}>
                Our fleet is rigorously maintained and equipped with modern amenities.
              </p>
            </div>
            <Link href="/search" className="btn btn-outline" style={{ borderRadius: '50px', padding: '12px 24px' }}>
              View Full Fleet <ArrowRight size={16} style={{ marginLeft: '8px' }} />
            </Link>
          </div>

          <div className="card-grid">
            {/* Vehicle Card 1 */}
            <div className="fleet-card">
              <div className="fleet-image">
                <img
                  src="https://srisaisenthiltravels.cloud/premium_heritage_van_v12_1769924009117.png"
                  alt="S3T Heritage Force Traveller"
                />
              </div>
              <div className="fleet-content">
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Heritage Force Traveller</h3>
                <div className="fleet-price">
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>From</span>
                  <span style={{ fontSize: '24px', color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'var(--font-playfair)' }}>₹4,500</span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>/ Day</span>
                </div>
                <Link href="/search" className="btn btn-primary" style={{ width: '100%' }}>
                  Book This Vehicle
                </Link>
              </div>
            </div>

            {/* Vehicle Card 2 */}
            <div className="fleet-card">
              <div className="fleet-image">
                <img
                  src="https://srisaisenthiltravels.cloud/luxury_volvo_coach_1769923988107.png"
                  alt="Luxury Volvo B11R"
                />
              </div>
              <div className="fleet-content">
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Luxury Volvo B11R</h3>
                <div className="fleet-price">
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>From</span>
                  <span style={{ fontSize: '24px', color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'var(--font-playfair)' }}>₹25,000</span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>/ Day</span>
                </div>
                <Link href="/search" className="btn btn-primary" style={{ width: '100%' }}>
                  Book This Vehicle
                </Link>
              </div>
            </div>

            {/* Vehicle Card 3 */}
            <div className="fleet-card">
              <div className="fleet-image">
                <img
                  src="https://srisaisenthiltravels.cloud/modern_minibus_heritage_edition_1769924031275.png"
                  alt="Beta Mini Bus"
                />
              </div>
              <div className="fleet-content">
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Beta Mini Bus</h3>
                <div className="fleet-price">
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>From</span>
                  <span style={{ fontSize: '24px', color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'var(--font-playfair)' }}>₹12,000</span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>/ Day</span>
                </div>
                <Link href="/search" className="btn btn-primary" style={{ width: '100%' }}>
                  Book This Vehicle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(197, 160, 89, 0.05)', transform: 'skewY(3deg) scale(1.1)', zIndex: -1 }}></div>
        <div className="container text-center">
          <h2 className="section-title">
            Powering the Future of <br /> Travel Management
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 40px' }}>
            Are you a travel business owner? Join the ecosystem.
            Manage your fleet, bookings, and payments all in one place.
          </p>
          <Link href="/signup?role=partner" className="btn btn-primary" style={{ padding: '16px 48px' }}>
            Partner Registration
          </Link>
        </div>
      </section>
    </>
  );
}
