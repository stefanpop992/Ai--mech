'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef   = useRef<HTMLDivElement>(null);
  const navRef    = useRef<HTMLElement>(null);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring   = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener('mousemove', onMove);

    let raf: number;
    function animCursor() {
      cursor!.style.left = mx + 'px';
      cursor!.style.top  = my + 'px';
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring!.style.left = rx + 'px';
      ring!.style.top  = ry + 'px';
      raf = requestAnimationFrame(animCursor);
    }
    animCursor();

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll-reveal
  useEffect(() => {
    const reveals  = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting)
          setTimeout(() => entry.target.classList.add('visible'), i * 100);
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Nav scroll shrink
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.style.background = window.scrollY > 80 ? 'rgba(8,8,8,0.97)' : '';
      nav.style.padding    = window.scrollY > 80 ? '16px 60px' : '';
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        :root {
          --black: #080808;
          --carbon: #111111;
          --steel: #1a1a1a;
          --border: #2a2a2a;
          --dim: #444;
          --muted: #888;
          --silver: #c0c0c0;
          --white: #f0f0f0;
          --red: #e03030;
          --red-glow: rgba(224,48,48,0.25);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--black); color: var(--white);
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          overflow-x: hidden; cursor: none;
        }
        .cursor {
          position: fixed; width: 10px; height: 10px;
          background: var(--red); border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transform: translate(-50%, -50%);
        }
        .cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1px solid rgba(224,48,48,0.5); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transform: translate(-50%, -50%);
        }
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 60px;
          background: linear-gradient(to bottom, rgba(8,8,8,0.95), transparent);
          backdrop-filter: blur(4px); transition: padding 0.3s, background 0.3s;
        }
        .nav-logo {
          font-family: 'Bebas Neue', sans-serif; font-size: 26px;
          letter-spacing: 4px; color: var(--white); text-decoration: none;
        }
        .nav-logo span { color: var(--red); }
        .nav-links { display: flex; gap: 40px; list-style: none; }
        .nav-links a {
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--white); }
        .nav-cta {
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--white); background: transparent;
          border: 1px solid var(--red); padding: 10px 24px;
          cursor: none; transition: background 0.2s, box-shadow 0.2s; text-decoration: none;
        }
        .nav-cta:hover { background: var(--red); box-shadow: 0 0 24px var(--red-glow); }

        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          justify-content: flex-end; padding: 0 60px 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 40%, rgba(224,48,48,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 80%, rgba(224,48,48,0.04) 0%, transparent 50%);
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 80px 80px;
          animation: gridScroll 20s linear infinite;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%);
        }
        @keyframes gridScroll { from { background-position: 0 0; } to { background-position: 80px 80px; } }
        .hero-bg-text {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(120px, 22vw, 340px); letter-spacing: -4px;
          color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.04);
          white-space: nowrap; user-select: none; animation: fadeInSlow 2s ease forwards;
        }
        @keyframes fadeInSlow { from { opacity: 0; } to { opacity: 1; } }
        .hero-tag {
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 4px; text-transform: uppercase;
          color: var(--red); margin-bottom: 24px;
          opacity: 0; animation: slideUp 0.8s 0.3s ease forwards;
        }
        .hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(64px, 10vw, 140px);
          line-height: 0.9; letter-spacing: 2px; color: var(--white);
          opacity: 0; animation: slideUp 0.8s 0.5s ease forwards;
        }
        .hero-title em { font-style: normal; color: transparent; -webkit-text-stroke: 2px var(--white); }
        .hero-sub {
          max-width: 520px; margin-top: 28px; font-size: 16px;
          font-weight: 300; line-height: 1.7; color: var(--muted);
          opacity: 0; animation: slideUp 0.8s 0.7s ease forwards;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 32px; margin-top: 48px;
          opacity: 0; animation: slideUp 0.8s 0.9s ease forwards;
        }
        .btn-primary {
          font-family: 'DM Mono', monospace; font-size: 12px;
          letter-spacing: 3px; text-transform: uppercase;
          color: var(--white); background: var(--red); border: none;
          padding: 18px 44px; cursor: none; text-decoration: none;
          transition: box-shadow 0.3s, transform 0.2s;
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
        }
        .btn-primary:hover { box-shadow: 0 0 40px var(--red-glow), 0 0 80px rgba(224,48,48,0.1); transform: translateY(-2px); }
        .btn-ghost {
          font-family: 'DM Mono', monospace; font-size: 12px;
          letter-spacing: 3px; text-transform: uppercase;
          color: var(--muted); text-decoration: none;
          display: flex; align-items: center; gap: 10px; transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--white); }
        .btn-ghost::after { content: '→'; transition: transform 0.2s; }
        .btn-ghost:hover::after { transform: translateX(6px); }
        .hero-stats {
          position: absolute; right: 60px; bottom: 80px;
          display: flex; flex-direction: column; gap: 32px;
          opacity: 0; animation: slideUp 0.8s 1.1s ease forwards;
        }
        .stat-item { text-align: right; }
        .stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: var(--white); line-height: 1; }
        .stat-num span { color: var(--red); }
        .stat-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); margin-top: 4px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .scroll-line {
          position: absolute; left: 60px; bottom: 80px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          opacity: 0; animation: slideUp 0.8s 1.3s ease forwards;
        }
        .scroll-line span { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); writing-mode: vertical-rl; }
        .scroll-line::after { content: ''; width: 1px; height: 60px; background: linear-gradient(to bottom, var(--dim), transparent); animation: scrollPulse 2s ease infinite; }
        @keyframes scrollPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

        .ticker-wrap { overflow: hidden; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 16px 0; background: var(--steel); }
        .ticker { display: flex; gap: 60px; animation: ticker 20s linear infinite; width: max-content; }
        .ticker-item { display: flex; align-items: center; gap: 14px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); white-space: nowrap; }
        .ticker-dot { width: 4px; height: 4px; background: var(--red); border-radius: 50%; flex-shrink: 0; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .features { padding: 120px 60px; }
        .section-label { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--red); margin-bottom: 16px; }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(42px, 6vw, 80px); letter-spacing: 2px; line-height: 0.95; color: var(--white); margin-bottom: 80px; }
        .section-title em { font-style: normal; color: transparent; -webkit-text-stroke: 1px var(--white); }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .feature-card {
          background: var(--carbon); padding: 48px 40px;
          border: 1px solid var(--border); position: relative; overflow: hidden;
          transition: border-color 0.3s, background 0.3s;
        }
        .feature-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--red); transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease;
        }
        .feature-card:hover::before { transform: scaleX(1); }
        .feature-card:hover { border-color: var(--dim); background: var(--steel); }
        .feature-num { position: absolute; top: 32px; right: 32px; font-family: 'Bebas Neue', sans-serif; font-size: 64px; color: rgba(255,255,255,0.03); line-height: 1; user-select: none; }
        .feature-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; color: var(--white); margin-bottom: 12px; }
        .feature-desc { font-size: 14px; line-height: 1.7; color: var(--muted); }

        .how { padding: 120px 60px; background: var(--carbon); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .steps { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 80px; border: 1px solid var(--border); }
        .step { padding: 48px 36px; border-right: 1px solid var(--border); position: relative; }
        .step:last-child { border-right: none; }
        .step-num { font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: transparent; -webkit-text-stroke: 1px var(--border); line-height: 1; margin-bottom: 20px; }
        .step-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--white); margin-bottom: 10px; }
        .step-desc { font-size: 13px; line-height: 1.7; color: var(--muted); }
        .step-dot { position: absolute; top: -6px; right: -6px; width: 12px; height: 12px; background: var(--red); border-radius: 50%; box-shadow: 0 0 12px var(--red-glow); }
        .step:last-child .step-dot { display: none; }

        .testimonials { padding: 120px 60px; position: relative; overflow: hidden; }
        .testimonials-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(224,48,48,0.04), transparent); }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 80px; }
        .testimonial-card { background: var(--carbon); border: 1px solid var(--border); padding: 40px; position: relative; transition: border-color 0.3s, transform 0.3s; }
        .testimonial-card:hover { border-color: var(--dim); transform: translateY(-4px); }
        .testimonial-card:nth-child(2) { margin-top: 40px; }
        .quote-mark { font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: var(--red); opacity: 0.3; line-height: 0.8; margin-bottom: 20px; display: block; }
        .testimonial-text { font-size: 15px; line-height: 1.8; color: var(--silver); margin-bottom: 32px; font-style: italic; }
        .testimonial-author { display: flex; align-items: center; gap: 14px; border-top: 1px solid var(--border); padding-top: 20px; }
        .author-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--steel); border: 1px solid var(--dim); display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: var(--red); }
        .author-name { font-size: 13px; font-weight: 500; color: var(--white); }
        .author-car { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--dim); margin-top: 2px; }

        .cta-section { padding: 120px 60px; background: var(--carbon); border-top: 1px solid var(--border); text-align: center; position: relative; overflow: hidden; }
        .cta-section::before { content: 'MYGARAGE'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: 'Bebas Neue', sans-serif; font-size: clamp(80px, 18vw, 260px); color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.03); white-space: nowrap; user-select: none; }
        .cta-section .section-label { display: inline-block; margin-bottom: 20px; }
        .cta-section .section-title { font-size: clamp(48px, 8vw, 96px); margin-bottom: 20px; }
        .cta-sub { font-size: 16px; color: var(--muted); max-width: 480px; margin: 0 auto 48px; line-height: 1.7; }
        .cta-buttons { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }

        footer { padding: 40px 60px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 4px; color: var(--dim); }
        .footer-logo span { color: var(--red); }
        .footer-text { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); }

        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <div className="cursor" ref={cursorRef}></div>
      <div className="cursor-ring" ref={ringRef}></div>

      <nav ref={navRef}>
        <Link href="/" className="nav-logo">MY<span>GARAGE</span></Link>
        <ul className="nav-links">
          <li><a href="#features">Funktioner</a></li>
          <li><a href="#how">Hur det fungerar</a></li>
          <li><a href="#testimonials">Recensioner</a></li>
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/login" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            background: 'transparent',
            border: 'none',
            textDecoration: 'none',
            cursor: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--white)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >Logga in</Link>
          <Link href="/register" className="nav-cta">Registrera dig</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-bg-text">GARAGE</div>
        <div className="scroll-line"><span>scrolla</span></div>
        <p className="hero-tag">// Bilhanteringsplattform</p>
        <h1 className="hero-title">Dina Bilar.<br /><em>Din Kontroll.</em></h1>
        <p className="hero-sub">MyGarage ger dig en komplett digital översikt över alla dina fordon — servicehistorik, dokument, reservdelar och en AI-assistent som kan din bil utan och innan.</p>
        <div className="hero-actions">
          <Link href="/register" className="btn-primary">Kom igång gratis</Link>
          <a href="#how" className="btn-ghost">Se hur det fungerar</a>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">100<span>%</span></div>
            <div className="stat-label">Digitalt &amp; pappersfritt</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">AI<span>+</span></div>
            <div className="stat-label">Driven assistent</div>
          </div>
        </div>
      </section>

      <div className="ticker-wrap">
        <div className="ticker">
          <div className="ticker-item"><div className="ticker-dot"></div>Serviceuppföljning</div>
          <div className="ticker-item"><div className="ticker-dot"></div>OBD Felkoder</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Dokumentlagring</div>
          <div className="ticker-item"><div className="ticker-dot"></div>AI-Chattassistent</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Reservdelshantering</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Besiktningspåminnelser</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Serviceuppföljning</div>
          <div className="ticker-item"><div className="ticker-dot"></div>OBD Felkoder</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Dokumentlagring</div>
          <div className="ticker-item"><div className="ticker-dot"></div>AI-Chattassistent</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Reservdelshantering</div>
          <div className="ticker-item"><div className="ticker-dot"></div>Besiktningspåminnelser</div>
        </div>
      </div>

      <section className="features" id="features">
        <div className="reveal">
          <p className="section-label">// Vad du får</p>
          <h2 className="section-title">Allt Din Bil<br /><em>Behöver</em></h2>
        </div>
        <div className="features-grid reveal">
          <div className="feature-card">
            <span className="feature-num">01</span>
            <div className="feature-title">Teknisk Info</div>
            <p className="feature-desc">Spara alla detaljer — registreringsnummer, motor, bränsletyp, växellåda, miltal och OBD-felkoder på ett ställe.</p>
          </div>
          <div className="feature-card">
            <span className="feature-num">02</span>
            <div className="feature-title">Dokument &amp; Manualer</div>
            <p className="feature-desc">Ladda upp och få tillgång till ägarmanual, servicebok, försäkringspapper och besiktningsprotokoll när som helst.</p>
          </div>
          <div className="feature-card">
            <span className="feature-num">03</span>
            <div className="feature-title">Reservdelslogg</div>
            <p className="feature-desc">Registrera oljebyten, filterbyten, bromsbelägg, kamrem och mer. Glöm aldrig vad som bytts ut på bilen.</p>
          </div>
          <div className="feature-card">
            <span className="feature-num">04</span>
            <div className="feature-title">AI-Assistent</div>
            <p className="feature-desc">Fråga vad som helst om din bil. AI:n känner till märke, modell, servicehistorik och ger personliga svar.</p>
          </div>
          <div className="feature-card">
            <span className="feature-num">05</span>
            <div className="feature-title">Servicepåminnelser</div>
            <p className="feature-desc">Få notiser innan nästa besiktning, försäkringsförnyelse eller planerad service är dags.</p>
          </div>
          <div className="feature-card">
            <span className="feature-num">06</span>
            <div className="feature-title">Flera Bilar</div>
            <p className="feature-desc">Äger du fler än ett fordon? Hantera hela din bilpark från ett enda konto med en inloggning.</p>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="reveal">
          <p className="section-label">// Enkelt att börja</p>
          <h2 className="section-title">Igång På<br /><em>Några Minuter</em></h2>
        </div>
        <div className="steps reveal">
          <div className="step">
            <div className="step-dot"></div>
            <div className="step-num">01</div>
            <div className="step-title">Skapa konto</div>
            <p className="step-desc">Registrera dig gratis på några sekunder. Inget kreditkort krävs.</p>
          </div>
          <div className="step">
            <div className="step-dot"></div>
            <div className="step-num">02</div>
            <div className="step-title">Lägg till bil</div>
            <p className="step-desc">Ange märke, modell, årsmodell och registreringsnummer för att sätta upp ditt garage.</p>
          </div>
          <div className="step">
            <div className="step-dot"></div>
            <div className="step-num">03</div>
            <div className="step-title">Fyll på info</div>
            <p className="step-desc">Ladda upp dokument, logga servicehistorik och registrera dina reservdelar.</p>
          </div>
          <div className="step">
            <div className="step-num">04</div>
            <div className="step-title">Ha full koll</div>
            <p className="step-desc">Få påminnelser, chatta med AI och tappa aldrig kontrollen över din bil igen.</p>
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="testimonials-bg"></div>
        <div className="reveal">
          <p className="section-label">// Riktiga användare</p>
          <h2 className="section-title">Vad Folk<br /><em>Säger</em></h2>
        </div>
        <div className="testimonials-grid reveal">
          <div className="testimonial-card">
            <span className="quote-mark">&ldquo;</span>
            <p className="testimonial-text">Äntligen en app som faktiskt är vettigt utformad för bilägare. Alla dokument och servicehistoriken på ett ställe. AI-chatten är förvånansvärt användbar.</p>
            <div className="testimonial-author">
              <div className="author-avatar">MK</div>
              <div>
                <div className="author-name">Marcus K.</div>
                <div className="author-car">VW Golf GTI · 2019</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <span className="quote-mark">&ldquo;</span>
            <p className="testimonial-text">Förut hade jag allt i en mapp i handskfacket. Nu är allt digitalt, sökbart och jag får påminnelser innan bilen behöver service. Helt fantastiskt.</p>
            <div className="testimonial-author">
              <div className="author-avatar">SR</div>
              <div>
                <div className="author-name">Sara R.</div>
                <div className="author-car">BMW 320d · 2021</div>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <span className="quote-mark">&ldquo;</span>
            <p className="testimonial-text">Hanterar mina tre bilar utan krångel. Reservdelsloggen är guld värd — jag vet exakt när kamremmen senast byttes på varje fordon.</p>
            <div className="testimonial-author">
              <div className="author-avatar">JP</div>
              <div>
                <div className="author-name">Johan P.</div>
                <div className="author-car">Volvo XC60, Audi A4, Mazda MX-5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <p className="section-label">// Redo att börja?</p>
        <h2 className="section-title reveal">Ta Kontrollen<br /><em>Idag</em></h2>
        <p className="cta-sub reveal">Gå med tusentals bilägare som äntligen har full koll på sina fordon. Det är gratis att komma igång.</p>
        <div className="cta-buttons reveal">
          <Link href="/register" className="btn-primary">Skapa gratis konto</Link>
        </div>
      </section>

      <footer>
        <div className="footer-logo">MY<span>GARAGE</span></div>
        <div className="footer-text">© 2025 MyGarage · Skolprojekt</div>
      </footer>
    </>
  );
}
