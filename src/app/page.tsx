import Navbar from "@/components/Navbar";
import BookingForm from "@/components/BookingForm";
import Link from 'next/link';
import S3TLogo from "@/components/S3TLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-dark text-text-main">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[100svh] min-h-[600px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Hero Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] scale-110 hover:scale-100"
          style={{
            backgroundImage: "url('/images/hero.png')",
          }}
        />

        {/* Multiple Gradient Overlays for Depth */}
        <div className="absolute inset-0 z-[1] bg-black/60 md:bg-black/50" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-bg-dark via-transparent to-black/30" />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 space-y-6 md:space-y-8 max-w-5xl animate-fade-in pt-12 md:pt-20">
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-4">
            <div className="h-[1px] w-8 md:w-12 bg-primary"></div>
            <span className="text-primary text-[8px] md:text-sm uppercase tracking-[0.3em] md:tracking-[0.5em] font-bold">ESTABLISHED 1987</span>
            <div className="h-[1px] w-8 md:w-12 bg-primary"></div>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-8xl font-serif font-bold leading-[1.1] tracking-tight text-white drop-shadow-2xl">
            Journeys that <br className="hidden sm:block" />
            <span className="text-primary italic">Define Heritage</span>
          </h1>

          <p className="text-sm md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed drop-shadow px-4 md:px-0">
            Experience the trust of nearly four decades. From luxury buses to premium vans, we provide the perfect companion for your travels.
          </p>

          <div className="mt-4 w-full">
            <BookingForm />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.3em] text-primary/60 font-bold">Scroll Down</span>
          <div className="w-[1px] h-8 md:h-12 bg-gradient-to-b from-primary to-transparent animate-pulse"></div>
        </div>
      </section>

      {/* Legacy Section */}
      <section id="legacy" className="py-20 md:py-32 max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="h-1 w-20 bg-primary mx-auto lg:mx-0"></div>
            <h2 className="text-3xl md:text-6xl font-serif font-bold leading-tight text-white">
              A Legacy of Trust, <br className="hidden md:block" />
              <span className="text-primary">Spanning Generations.</span>
            </h2>
            <p className="text-text-muted text-base md:text-lg leading-relaxed">
              Started in 1987, Sri Sai Senthil Travels has been at the forefront of the travel industry. We believe that every journey is a story.
            </p>
            <div className="grid grid-cols-2 gap-8 md:gap-12 pt-8">
              <div className="group">
                <h3 className="text-3xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform origin-left lg:origin-left">35+</h3>
                <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest mt-2 font-bold">Years of Excellence</p>
              </div>
              <div className="group">
                <h3 className="text-3xl md:text-5xl font-bold text-primary group-hover:scale-110 transition-transform lg:origin-left">5000+</h3>
                <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest mt-2 font-bold">Happy Tourists</p>
              </div>
            </div>
          </div>
          <div className="relative group mt-12 lg:mt-0">
            <div className="aspect-[4/5] sm:aspect-video lg:aspect-[4/5] rounded-3xl md:rounded-[40px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl relative">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                style={{ backgroundImage: "url('/images/hero.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-4 md:-bottom-8 md:-left-8 bg-black/90 backdrop-blur-xl p-6 md:p-8 rounded-2xl md:rounded-3xl border border-primary/30 shadow-2xl transform transition-transform group-hover:-translate-y-2 max-w-[250px] md:max-w-none">
              <p className="font-serif text-lg md:text-2xl italic text-primary">"Excellence is not an act, but a habit."</p>
              <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40 mt-2 font-bold">— Founder's Vision</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 md:py-32 bg-white/5 border-y border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern.png')] opacity-5 mix-blend-overlay"></div>
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative z-10">
          <div className="text-center space-y-4 mb-12 md:mb-20">
            <span className="text-primary text-[10px] uppercase tracking-[0.5em] font-bold">BESPOKE SERVICES</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">Curated for Every <span className="text-primary italic">Occasion</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "Grand Weddings", icon: "💍", desc: "Transport your guests in regal style. Logistics managed by experts." },
              { title: "Corporate Convoys", icon: "bmw", desc: "Punctual, professional fleets for your business delegates." },
              { title: "Spiritual Pilgrimages", icon: "temple", desc: "Serene journeys to sacred destinations with comfort." }
            ].map((s, i) => (
              <div key={i} className="group p-6 md:p-8 rounded-[32px] border border-white/10 hover:border-primary/50 bg-black/20 hover:bg-black/40 transition-all cursor-pointer">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl md:text-2xl mb-6 group-hover:scale-110 transition-transform text-white">
                  {i === 1 ? '👔' : i === 2 ? '🛕' : s.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-4">{s.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{s.desc}</p>
                <div className="mt-8">
                  <span className="text-[8px] uppercase tracking-widest text-primary font-bold group-hover:underline">Learn More</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section id="fleet" className="py-20 md:py-32 max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8 mb-16 md:mb-20">
          <div className="space-y-4">
            <span className="text-primary text-[10px] uppercase tracking-[0.5em] font-bold">THE ROYAL GARAGE</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">Experience <span className="text-primary italic">True Comfort</span></h2>
          </div>
          <Link href="/search" className="px-8 py-3 ring-1 ring-white/20 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all font-bold text-white">
            View Full Fleet
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { name: "Urbania Luxury", type: "12 Seater", image: "/images/van.png", price: "4500" },
            { name: "Volvo B11R Multi-Axle", type: "50 Seater", image: "/images/bus.png", price: "25000" },
            { name: "Mercedes Benz Glider", type: "45 Seater", image: "/images/bus2.png", price: "18000" }
          ].map((v, i) => (
            <div key={i} className="group rounded-[32px] md:rounded-[40px] overflow-hidden border border-white/10 bg-white/5 hover:border-primary/30 transition-all relative">
              <div className="h-48 md:h-64 bg-black/50 relative">
                <div className="absolute inset-0 flex items-center justify-center text-white/10 font-serif text-3xl md:text-4xl italic font-bold">
                  {v.name.split(' ')[0]}
                </div>
                <div className="absolute bottom-4 left-6">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] uppercase tracking-widest text-white border border-white/10 font-bold">{v.type}</span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-white w-2/3">{v.name}</h3>
                  <div className="text-right">
                    <p className="text-primary font-bold text-base md:text-lg">Starts ₹{v.price}</p>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Per Day</p>
                  </div>
                </div>
                <Link href="/search" className="block w-full py-4 text-center rounded-2xl bg-white/5 hover:bg-primary hover:text-black transition-all text-[10px] uppercase tracking-[0.2em] font-bold border border-white/10">
                  Book This Vehicle
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SaaS Promotional Section */}
      <section className="py-20 md:py-32 bg-[#0f0f0f] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-primary/5 blur-[80px] md:blur-[120px] rounded-full" />
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 text-center space-y-12 relative z-10">
          <span className="text-primary text-[10px] uppercase tracking-[0.5em] font-bold">SaaS PRODUCT</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white max-w-3xl mx-auto">Powering the Future of Travel Management</h2>
          <p className="text-text-muted max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Are you a travel business owner? Join the Sri Sai Senthil Travels ecosystem. Manage your fleet, bookings, and payments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 pt-4 md:pt-8">
            <Link href="/signup?role=partner" className="px-8 md:px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all text-white flex items-center justify-center">
              Partner Registration
            </Link>
            <button className="px-8 md:px-10 py-4 bg-primary text-black rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all hover:bg-white hover:scale-105">
              Explore Platform
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32 max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <span className="text-primary text-[10px] uppercase tracking-[0.5em] font-bold block">CONTACT US</span>
            <h2 className="text-3xl md:text-6xl font-serif font-bold text-white">Let’s Plan Your <br /><span className="text-primary italic">Next Story.</span></h2>
            <p className="text-text-muted text-base md:text-lg">Our experts are available 24/7 to assist with your travel requirements.</p>

            <div className="space-y-6 pt-8 max-w-sm mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary text-xl flex-shrink-0">📍</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Headquarters</p>
                  <p className="text-white font-bold text-sm md:text-base">123 Heritage Lane, Chennai, TN</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary text-xl flex-shrink-0">📞</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Direct Line</p>
                  <p className="text-white font-bold text-sm md:text-base">+91 94438 56913</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-dark p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-white/10">
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Your Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/10" placeholder="Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Email</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/10" placeholder="Email" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Message</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white focus:border-primary focus:outline-none transition-all h-32 placeholder:text-white/10" placeholder="Tell us about your trip"></textarea>
              </div>
              <button className="w-full py-4 md:py-5 bg-primary text-black rounded-2xl text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-12">
            <div className="text-left">
              <S3TLogo className="w-16 md:w-24 h-auto mb-6 md:mb-8" />
              <div className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4 leading-tight">SRI SAI <br /> SENTHIL TRAVELS</div>
              <p className="text-text-muted text-sm max-w-xs leading-relaxed">Premium transport solutions since 1987. Redefining luxury travel across India.</p>
            </div>
            <div className="flex flex-col lg:items-end gap-6 md:gap-8">
              <div className="flex flex-wrap gap-6 md:gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-white">
                <a href="#" className="hover:text-primary transition-colors">Instagram</a>
                <a href="#" className="hover:text-primary transition-colors">Facebook</a>
                <a href="#" className="hover:text-primary transition-colors">Twitter</a>
              </div>
              <div className="h-[1px] w-full lg:w-64 bg-white/10"></div>
              <p className="text-[8px] text-text-muted uppercase tracking-[0.3em] text-left lg:text-right leading-relaxed italic opacity-50">
                &copy; {new Date().getFullYear()} Sri Sai Senthil Travels. <br className="hidden sm:block" />
                ALL RIGHTS RESERVED.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
