'use client';
import React, { useState, useEffect } from 'react';

// Centralized strings dictionary for JSX internationalization (i18n & SonarQube compliant)
const strings = {
    // Top Bar
    topEmail: 'info@shrihansschool.edu',
    topHours: 'Mon - Sat: 09:00 AM - 03:00 PM',
    topNews: '📢 Session 2026-27 Admissions Open for Nursery to Class 8th!',
    topCart: 'Cart: 0 items - $0.00',

    // Nav Header
    schoolLogoTitle: 'SHRI HANS',
    schoolLogoSub: 'VIDYA NIKETAN',
    navHome: 'Home',
    navAbout: 'About',
    navContact: 'Contact',
    enterPortalBtn: 'ENTER PORTAL',

    // Hero Section
    heroBadge: 'THE BEST',
    heroTitle: 'LEARNING',
    heroSubTitle: 'NURSERY TO CLASS 8th',
    heroContactBtn: 'EXPLORE',
    heroQuoteBtn: 'CONTACT NOW',
    heroCircleBadge: "NEW '26",

    // Welcome Section
    welcomeSub: 'Modern Education System',
    welcomeTitle: 'Welcome to Shri Hans Vidya Niketan School',
    welcomePara1: 'Shri Hans Vidya Niketan School provides high-quality education and support for children to explore, learn, and grow. From pre-primary foundational play up to middle school academic excellence, we nurture the potential of every single child.',
    welcomePara2: 'We run a comprehensive curriculum that balances academic rigor, science exploration, languages, sports, and value education to ensure all-round student development.',
    welcomeMoreInfo: 'MORE INFO',
    thumbSports: 'SPORT ACTIVITY',
    thumbArt: 'WATERCOLOR',
    thumbScience: 'SCIENCE LAB',
    thumbSwimming: 'SWIMMING',

    // Classes Offered Section
    classesTitle: 'Classes Offered (Nursery to Class 8th)',
    classesSub: 'Our Academic Offerings',
    classesDesc: 'Shri Hans Vidya Niketan School offers premium education with a well-structured curriculum from early childhood foundation stages up to middle school standard.',
    classCategoryFoundation: 'Foundation & Pre-Primary',
    classCategoryFoundationDesc: 'Setting the base of learning with interactive and play-based learning activities.',
    classCategoryPrimary: 'Primary Education',
    classCategoryPrimaryDesc: 'Focusing on core subjects like English, Hindi, Mathematics, and Environmental Studies.',
    classCategoryMiddle: 'Middle School',
    classCategoryMiddleDesc: 'Advanced courses including Science, Social Science, and Sanskrit to prepare students for higher studies.',

    // Grid Section
    grid1Sub: 'SPORTS & ATHLETICS',
    grid1Title: 'Physical Education & Sports',
    grid1Desc: 'Developing physical fitness, teamwork, and leadership qualities through structured sports, gymnastics, and athletic programs.',
    grid1Price: '$ 45,20',

    grid2Sub: 'LABORATORY',
    grid2Title: 'Watercolor & Life Drawing Course',
    grid2Desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit phasellus.',
    grid2Price: '$ 32,60',

    grid3Sub: 'SCIENCE',
    grid3Title: 'Chemistry Laboratory & Microscope',
    grid3Desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit phasellus.',
    grid3Price: '$ 39,24',

    grid4Sub: 'ECOLOGY',
    grid4Title: 'Botanical Study & Gardening',
    grid4Desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit phasellus.',
    grid4Price: '$ 28,55',

    // Footer
    footerContact: 'Emergency Hotline: +91 96693-46044 | Email: contact@shrihansschool.edu',
    footerText: '© 2026 Shri Hans Vidya Niketan School. All rights reserved. Powered by Vidya Portal V2.2.'
};

const galleryImages = [
    { src: '/gallery/g1.jpg', alt: 'Vasant Panchami Celebration', title: 'Saraswati Puja', desc: 'Students and staff gather to pay devotion and seek blessings from Goddess Saraswati.' },
    { src: '/gallery/g2.jpg', alt: 'Devotional Ceremony', title: 'Saraswati Puja Prayers', desc: 'Traditional prayers, floral offerings, and rituals celebrating Vasant Panchami.' },
    { src: '/gallery/g3.jpg', alt: 'Cultural Worship', title: 'Saraswati Puja Aarti', desc: 'Traditional devotional aarti and hymns performed by the students.' },
    { src: '/gallery/g4.jpg', alt: 'Festival of Colors', title: 'Holi Celebration', desc: 'Students and faculty sharing joy and dynamic colors during the Holi festival.' },
    { src: '/gallery/g5.jpg', alt: 'Morning Assembly', title: 'School Assembly', desc: 'Students gathering in disciplined queues for morning prayers and standard moral guidelines.' },
    { src: '/gallery/g6.jpg', alt: 'Student Presentations', title: 'School Assembly Pledges', desc: 'Group pledges, thought of the day, and academic announcements during assembly.' }
];

export default function LandingPage({ onEnterPortal }) {
    const [activeTab, setActiveTab] = useState('home');
    const [activeSlide, setActiveSlide] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const heroImages = [
        '/hero/hero1.jpg',
        '/hero/hero2.jpg'
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            else if (e.key === 'ArrowRight') {
                setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    const handleScroll = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div id="home_top" style={{
            background: '#ffffff',
            color: '#333333',
            minHeight: '100vh',
            fontFamily: "'Poppins', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden'
        }}>
            
            {/* INJECT PACIFICO & UTILITY CLASSES */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
                
                .topbar-hide-mobile {
                    display: flex;
                }
                @media (max-width: 768px) {
                    .topbar-hide-mobile {
                        display: none !important;
                    }
                }
                
                .nav-links-container {
                    display: flex;
                    gap: 24px;
                }
                @media (max-width: 992px) {
                    .nav-links-container {
                        display: none !important;
                    }
                }
                
                .welcome-section {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 40px;
                    padding: 80px 8%;
                    background: #ffffff;
                }
                @media (max-width: 992px) {
                    .welcome-section {
                        grid-template-columns: 1fr;
                        padding: 60px 5%;
                    }
                }
                
                .activity-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    width: 100%;
                }
                @media (max-width: 1024px) {
                    .activity-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 600px) {
                    .activity-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .grid-image-box {
                    position: relative;
                    width: 100%;
                    padding-bottom: 100%; /* 1:1 Aspect Ratio */
                    background-size: cover;
                    background-position: center;
                    overflow: hidden;
                }
                
                .grid-color-card {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 40px 30px;
                    color: #ffffff;
                    text-align: center;
                    aspect-ratio: 1 / 1;
                }
                
                .btn-hover-effect {
                    transition: all 0.3s ease;
                }
                .btn-hover-effect:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
                
                .thumb-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                .thumb-item:hover {
                    transform: scale(1.05);
                }
                
                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 40px;
                    text-align: left;
                }
                @media (max-width: 992px) {
                    .footer-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 600px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .footer-link {
                    color: #bbbbbb;
                    text-decoration: none;
                    font-size: 13px;
                    transition: color 0.3s ease;
                    cursor: pointer;
                    display: block;
                    margin-bottom: 10px;
                }
                .footer-link:hover {
                    color: #E06B65;
                }
                .social-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #222222;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    font-size: 14px;
                }
                .social-icon:hover {
                    background: #E06B65;
                    transform: translateY(-2px);
                }
                .class-card-hover {
                    transition: all 0.3s ease !important;
                }
                .class-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05) !important;
                }
                .slider-arrow-btn:hover {
                    background: rgba(255, 255, 255, 0.3) !important;
                    transform: translateY(-50%) scale(1.08) !important;
                }

                /* Hero Section Styles */
                .hero-container {
                    position: relative;
                    height: 540px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    color: #ffffff;
                    padding: 0 20px;
                    overflow: hidden;
                }
                .hero-slide-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    transition: opacity 1.2s ease-in-out;
                    z-index: 1;
                }
                .hero-title {
                    font-size: 72px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    margin: 0 0 10px 0;
                    line-height: 1.1;
                    text-shadow: 2px 2px 10px rgba(0,0,0,0.35);
                }
                .hero-subtitle {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 6px;
                    text-transform: uppercase;
                    color: #dddddd;
                    margin-bottom: 35px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                    padding-bottom: 10px;
                    display: inline-block;
                }
                .hero-buttons-container {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .hero-btn {
                    border: none;
                    padding: 14px 32px;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    letter-spacing: 1px;
                }
                .slider-arrow-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 3;
                    transition: all 0.3s ease;
                }
                .slider-arrow-btn.prev-btn {
                    left: 20px;
                }
                .slider-arrow-btn.next-btn {
                    right: 20px;
                }

                /* Mobile Responsive Hero Overrides */
                @media (max-width: 768px) {
                    .hero-container {
                        height: 460px !important;
                        padding: 0 15px !important;
                    }
                    .hero-title {
                        font-size: 44px !important;
                        letter-spacing: 2px !important;
                        margin: 0 0 8px 0 !important;
                    }
                    .hero-subtitle {
                        font-size: 10px !important;
                        letter-spacing: 3px !important;
                        margin-bottom: 25px !important;
                        padding-bottom: 6px !important;
                    }
                    .hero-buttons-container {
                        gap: 10px !important;
                    }
                    .hero-btn {
                        padding: 10px 22px !important;
                        font-size: 12px !important;
                    }
                    .slider-arrow-btn {
                        width: 32px !important;
                        height: 32px !important;
                        background: rgba(0, 0, 0, 0.25) !important;
                    }
                    .slider-arrow-btn.prev-btn {
                        left: 8px !important;
                    }
                    .slider-arrow-btn.next-btn {
                        right: 8px !important;
                    }
                    .slider-arrow-btn svg {
                        width: 14px !important;
                        height: 14px !important;
                    }
                }
                @media (max-width: 480px) {
                    .hero-container {
                        height: 420px !important;
                    }
                    .hero-title {
                        font-size: 36px !important;
                    }
                    .hero-btn {
                        padding: 9px 18px !important;
                        font-size: 11px !important;
                    }
                }

                @keyframes slideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @media (max-width: 992px) {
                    .mobile-menu-toggle {
                        display: flex !important;
                    }
                }

                /* Gallery Section Styles */
                .gallery-section {
                    padding: 80px 8%;
                    background: #f8fafc;
                    text-align: center;
                }
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-top: 40px;
                }
                .gallery-item {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    aspect-ratio: 4 / 3;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    cursor: pointer;
                    background: #e2e8f0;
                }
                .gallery-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease;
                }
                .gallery-item:hover .gallery-img {
                    transform: scale(1.08);
                }
                .gallery-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.15));
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: flex-start;
                    padding: 20px;
                    color: #ffffff;
                    text-align: left;
                    z-index: 2;
                }
                .gallery-item:hover .gallery-overlay {
                    opacity: 1;
                }
                .gallery-zoom-icon {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }
                .gallery-item:hover .gallery-zoom-icon {
                    transform: scale(1.1);
                }

                /* Responsive Gallery Overrides */
                @media (max-width: 992px) {
                    .gallery-section {
                        padding: 60px 5%;
                    }
                    .gallery-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin-top: 30px;
                    }
                }
                @media (max-width: 600px) {
                    .gallery-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            ` }} />

            {/* 1. TOP BAR */}
            <div style={{
                background: '#151515',
                color: '#bbbbbb',
                fontSize: '12px',
                padding: '10px 8%',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #222222',
                zIndex: 1001
            }} className="topbar-hide-mobile">
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>✉️ {strings.topEmail}</span>
                    <span>🕒 {strings.topHours}</span>
                </div>
                <div style={{ color: '#ECC152', fontWeight: 'bold' }}>
                    {strings.topNews}
                </div>

            </div>

            {/* 2. MAIN HEADER */}
            <header style={{
                position: 'sticky',
                top: 0,
                background: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                padding: '15px 8%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000
            }}>
                {/* Logo & School Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                        src="/logo.png" 
                        alt="Shri Hans Vidya Niketan School Logo" 
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#111111', lineHeight: '1.1', letterSpacing: '0.5px' }}>
                            {strings.schoolLogoTitle}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#62C3E5', letterSpacing: '2px' }}>
                            {strings.schoolLogoSub}
                        </span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="nav-links-container">
                    {[
                        { label: strings.navHome, id: 'home_top', active: activeTab === 'home' },
                        { label: strings.navAbout, id: 'about_section', active: activeTab === 'about' },
                        { label: 'Gallery', id: 'gallery_section', active: activeTab === 'gallery' },
                        { label: strings.navContact, id: 'contact_section', active: activeTab === 'contact' }
                    ].map((link, idx) => (
                        <span
                            key={idx}
                            style={{
                                color: link.active ? '#E06B65' : '#555555',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.target.style.color = '#E06B65'; }}
                            onMouseLeave={(e) => { e.target.style.color = link.active ? '#E06B65' : '#555555'; }}
                            onClick={() => {
                                setActiveTab(link.id.split('_')[0]);
                                handleScroll(link.id);
                            }}
                        >
                            {link.label}
                        </span>
                    ))}
                </nav>

                {/* Mobile Menu Toggle Hamburger */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="mobile-menu-toggle"
                    aria-label="Toggle Menu"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#333333'
                    }}
                >
                    {mobileMenuOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    )}
                </button>

                {/* Mobile Dropdown Menu Panel */}
                {mobileMenuOpen && (
                    <div
                        className="mobile-nav-menu"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                            borderBottom: '1px solid #f0f0f0',
                            zIndex: 999,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '15px 8%',
                            gap: '5px',
                            animation: 'slideDown 0.3s ease'
                        }}
                    >
                        {[
                            { label: strings.navHome, id: 'home_top', active: activeTab === 'home' },
                            { label: strings.navAbout, id: 'about_section', active: activeTab === 'about' },
                            { label: 'Gallery', id: 'gallery_section', active: activeTab === 'gallery' },
                            { label: strings.navContact, id: 'contact_section', active: activeTab === 'contact' }
                        ].map((link, idx) => (
                            <span
                                key={idx}
                                style={{
                                    color: link.active ? '#E06B65' : '#555555',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    padding: '12px 0',
                                    borderBottom: '1px solid #f5f5f5',
                                    transition: 'color 0.2s ease'
                                }}
                                onClick={() => {
                                    setActiveTab(link.id.split('_')[0]);
                                    setMobileMenuOpen(false);
                                    handleScroll(link.id);
                                }}
                            >
                                {link.label}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* 3. HERO SECTION */}
            <section className="hero-container">
                {/* Background Carousel Slides */}
                {heroImages.map((img, idx) => (
                    <div
                        key={img}
                        className="hero-slide-bg"
                        style={{
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.45)), url("${img}")`,
                            opacity: activeSlide === idx ? 1 : 0,
                        }}
                    />
                ))}

                {/* Content Overlay */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '100%'
                }}>
                    {/* Badge "THE BEST" */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.6)' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>
                            {strings.heroBadge}
                        </span>
                        <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.6)' }}></div>
                    </div>

                    {/* Main Heading "LEARNING" */}
                    <h1 className="hero-title">
                        {strings.heroTitle}
                    </h1>

                    {/* Subtitle "LESSONS | COURSES" */}
                    <div className="hero-subtitle">
                        {strings.heroSubTitle}
                    </div>

                    {/* Buttons */}
                    <div className="hero-buttons-container">
                        <button
                            onClick={() => {
                                setActiveTab('about');
                                handleScroll('about_section');
                            }}
                            className="btn-hover-effect hero-btn"
                            style={{
                                background: '#62C3E5',
                                color: '#ffffff',
                            }}
                        >
                            {strings.heroContactBtn}
                        </button>
                        <button
                            onClick={onEnterPortal}
                            className="btn-hover-effect hero-btn"
                            style={{
                                background: '#ECC152',
                                color: '#ffffff',
                            }}
                        >
                            {strings.heroQuoteBtn}
                        </button>
                    </div>
                </div>

                {/* Manual Navigation Arrows */}
                <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
                    className="slider-arrow-btn prev-btn"
                    aria-label="Previous Slide"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % heroImages.length)}
                    className="slider-arrow-btn next-btn"
                    aria-label="Next Slide"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>

                {/* Dot Indicators */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    display: 'flex',
                    gap: '10px',
                    zIndex: 3
                }}>
                    {heroImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            style={{
                                width: activeSlide === idx ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: activeSlide === idx ? '#62C3E5' : 'rgba(255, 255, 255, 0.4)',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* 4. WELCOME TO SCHOOL SECTION */}
            <section id="about_section" className="welcome-section">
                {/* Left Content Column */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Cursive Subtitle */}
                    <div style={{
                        fontFamily: "'Pacifico', cursive",
                        color: '#62C3E5',
                        fontSize: '26px',
                        marginBottom: '8px'
                    }}>
                        {strings.welcomeSub}
                    </div>

                    {/* Main Section Heading */}
                    <h2 style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#1e293b',
                        margin: '0 0 25px 0',
                        lineHeight: '1.2'
                    }}>
                        {strings.welcomeTitle}
                    </h2>

                    {/* Two Paragraph Columns */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '24px',
                        color: '#555555',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        marginBottom: '35px'
                    }}>
                        <div>{strings.welcomePara1}</div>
                        <div>{strings.welcomePara2}</div>
                    </div>

                    {/* MORE INFO Button */}
                    <div style={{ marginBottom: '45px' }}>
                        <button
                            onClick={onEnterPortal}
                            className="btn-hover-effect"
                            style={{
                                background: '#69C6A0',
                                color: '#ffffff',
                                border: 'none',
                                padding: '12px 28px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                letterSpacing: '1px'
                            }}
                        >
                            {strings.welcomeMoreInfo}
                        </button>
                    </div>

                    {/* 3 Activity Thumbnails */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '15px',
                        borderTop: '1px solid #eeeeee',
                        paddingTop: '30px'
                    }}>
                        {[
                            { name: strings.thumbSports, color: '#E06B65', icon: '⚽' },
                            { name: strings.thumbArt, color: '#ECC152', icon: '🎨' },
                            { name: strings.thumbScience, color: '#69C6A0', icon: '🔬' }
                        ].map((thumb, idx) => (
                            <div key={idx} className="thumb-item" onClick={onEnterPortal}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '8px',
                                    background: `${thumb.color}15`,
                                    border: `1px solid ${thumb.color}35`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px'
                                }}>
                                    {thumb.icon}
                                </div>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#555555',
                                    textAlign: 'center',
                                    letterSpacing: '0.5px'
                                }}>
                                    {thumb.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Image Column */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '380px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                    }}>
                        <img
                            src="/about_main.png"
                            alt="Child writing/coloring"
                            style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* CLASSES OFFERED SECTION */}
            <section style={{
                background: '#f8fafc',
                padding: '80px 8%',
                textAlign: 'center',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{
                    fontFamily: "'Pacifico', cursive",
                    color: '#62C3E5',
                    fontSize: '24px',
                    marginBottom: '8px'
                }}>
                    {strings.classesSub}
                </div>
                <h2 style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#1e293b',
                    margin: '0 0 15px 0'
                }}>
                    {strings.classesTitle}
                </h2>
                <p style={{
                    fontSize: '15px',
                    color: '#64748b',
                    maxWidth: '600px',
                    margin: '0 auto 50px auto',
                    lineHeight: '1.6'
                }}>
                    {strings.classesDesc}
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* Primary/Pre-Primary */}
                    <div style={{
                        background: '#ffffff',
                        padding: '30px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left'
                    }} className="class-card-hover">
                        <div style={{ fontSize: '36px', marginBottom: '15px' }}>🐣</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>{strings.classCategoryFoundation}</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '15px' }}>
                            {strings.classCategoryFoundationDesc}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['Nursery', 'KG-I', 'KG-II'].map(c => (
                                <span key={c} style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px' }}>{c}</span>
                            ))}
                        </div>
                    </div>

                    {/* Lower Primary */}
                    <div style={{
                        background: '#ffffff',
                        padding: '30px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left'
                    }} className="class-card-hover">
                        <div style={{ fontSize: '36px', marginBottom: '15px' }}>📚</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>{strings.classCategoryPrimary}</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '15px' }}>
                            {strings.classCategoryPrimaryDesc}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['1st', '2nd', '3rd', '4th', '5th'].map(c => (
                                <span key={c} style={{ background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px' }}>{c}</span>
                            ))}
                        </div>
                    </div>

                    {/* Middle School */}
                    <div style={{
                        background: '#ffffff',
                        padding: '30px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left'
                    }} className="class-card-hover">
                        <div style={{ fontSize: '36px', marginBottom: '15px' }}>🔬</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px' }}>{strings.classCategoryMiddle}</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '15px' }}>
                            {strings.classCategoryMiddleDesc}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['6th', '7th', '8th'].map(c => (
                                <span key={c} style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px' }}>{c}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. COLORFUL ACTIVITY GRID (8 Blocks, Alternating) */}
            <section className="activity-grid">
                
                {/* Block 1: Image (Sports) */}
                <div className="grid-image-box" style={{ backgroundImage: 'url("/sports_grid.png")' }}></div>

                {/* Block 2: Coral Card */}
                <div className="grid-color-card" style={{ background: '#E06B65' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '500', opacity: '0.8', marginBottom: '10px' }}>
                        {strings.grid1Sub}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.3' }}>
                        {strings.grid1Title}
                    </h3>
                    <p style={{ fontSize: '13px', opacity: '0.9', lineHeight: '1.6', marginBottom: '20px' }}>
                        {strings.grid1Desc}
                    </p>
                </div>

                {/* Block 3: Image (Art) */}
                <div className="grid-image-box" style={{ backgroundImage: 'url("/art_grid.png")' }}></div>

                {/* Block 4: Gold Card */}
                <div className="grid-color-card" style={{ background: '#ECC152' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '500', opacity: '0.8', marginBottom: '10px' }}>
                        {strings.grid2Sub}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.3' }}>
                        {strings.grid2Title}
                    </h3>
                    <p style={{ fontSize: '13px', opacity: '0.9', lineHeight: '1.6', marginBottom: '20px' }}>
                        {strings.grid2Desc}
                    </p>
                </div>

                {/* Block 5: Purple Card */}
                <div className="grid-color-card" style={{ background: '#9F75C5' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '500', opacity: '0.8', marginBottom: '10px' }}>
                        {strings.grid3Sub}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.3' }}>
                        {strings.grid3Title}
                    </h3>
                    <p style={{ fontSize: '13px', opacity: '0.9', lineHeight: '1.6', marginBottom: '20px' }}>
                        {strings.grid3Desc}
                    </p>
                </div>

                {/* Block 6: Image (Science) */}
                <div className="grid-image-box" style={{ backgroundImage: 'url("/science_grid.png")' }}></div>

                {/* Block 7: Cyan Card */}
                <div className="grid-color-card" style={{ background: '#62C3E5' }}>
                    <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: '500', opacity: '0.8', marginBottom: '10px' }}>
                        {strings.grid4Sub}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.3' }}>
                        {strings.grid4Title}
                    </h3>
                    <p style={{ fontSize: '13px', opacity: '0.9', lineHeight: '1.6', marginBottom: '20px' }}>
                        {strings.grid4Desc}
                    </p>
                </div>

                {/* Block 8: Image (Gardening) */}
                <div className="grid-image-box" style={{ backgroundImage: 'url("/gardening_grid.png")' }}></div>

            </section>

            {/* Gallery Section */}
            <section id="gallery_section" className="gallery-section">
                <div style={{
                    fontFamily: "'Pacifico', cursive",
                    color: '#62C3E5',
                    fontSize: '26px',
                    marginBottom: '8px'
                }}>
                    Sweet Memories
                </div>
                <h2 style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#1e293b',
                    margin: '0 0 10px 0',
                    letterSpacing: '-0.5px'
                }}>
                    Our Campus Gallery
                </h2>
                <div style={{
                    width: '60px',
                    height: '4px',
                    background: '#ECC152',
                    margin: '0 auto 20px auto',
                    borderRadius: '2px'
                }}></div>
                <p style={{
                    fontSize: '15px',
                    color: '#64748b',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: '1.6'
                }}>
                    Explore our vibrant school life, state-of-the-art facilities, sports tournaments, and creative academic endeavors through our visual directory.
                </p>

                <div className="gallery-grid">
                    {galleryImages.map((item, idx) => (
                        <div
                            key={idx}
                            className="gallery-item"
                            onClick={() => setLightboxIndex(idx)}
                        >
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="gallery-img"
                                loading="lazy"
                            />
                            <div className="gallery-overlay">
                                <div className="gallery-zoom-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        <line x1="11" y1="8" x2="11" y2="14"></line>
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    </svg>
                                </div>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: '#ffffff' }}>
                                    {item.title}
                                </h4>
                                <p style={{ fontSize: '12px', margin: '0', opacity: 0.85, color: '#f1f5f9', lineHeight: '1.4' }}>
                                    {item.alt}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setLightboxIndex(null)}
                >
                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(null);
                        }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '20px',
                            transition: 'all 0.3s ease',
                            zIndex: 10000
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                    >
                        ✕
                    </button>

                    {/* Image Area with navigation */}
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '900px',
                            width: '100%',
                            height: '70vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Prev Button */}
                        <button
                            onClick={() => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                            style={{
                                position: 'absolute',
                                left: '-10px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10001,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>

                        {/* Centered Image */}
                        <img
                            src={galleryImages[lightboxIndex].src}
                            alt={galleryImages[lightboxIndex].alt}
                            style={{
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                animation: 'fadeIn 0.3s ease'
                            }}
                        />

                        {/* Next Button */}
                        <button
                            onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryImages.length)}
                            style={{
                                position: 'absolute',
                                right: '-10px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#ffffff',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10001,
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>

                    {/* Image Info / Captions */}
                    <div
                        style={{
                            marginTop: '25px',
                            textAlign: 'center',
                            maxWidth: '600px',
                            color: '#ffffff',
                            animation: 'fadeIn 0.3s ease'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ECC152', margin: '0 0 8px 0' }}>
                            {galleryImages[lightboxIndex].title}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                            {galleryImages[lightboxIndex].desc}
                        </p>
                        <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '12px', color: '#94a3b8' }}>
                            Image {lightboxIndex + 1} of {galleryImages.length}
                        </span>
                    </div>
                </div>
            )}

            {/* 6. FOOTER */}
            <footer id="contact_section" style={{
                background: '#151515',
                color: '#dddddd',
                padding: '60px 8% 30px 8%',
                borderTop: '5px solid #E06B65',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px'
            }}>
                <div className="footer-grid">
                    {/* Column 1: About */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/logo.png" alt="Shri Hans Vidya Niketan School Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', lineHeight: '1.1', letterSpacing: '0.5px' }}>
                                    {strings.schoolLogoTitle}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: '600', color: '#62C3E5', letterSpacing: '1.5px' }}>
                                    {strings.schoolLogoSub}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#aaaaaa', lineHeight: '1.6', margin: '0' }}>
                            Shri Hans Vidya Niketan School is committed to nurturing young minds, fostering creativity, and building a foundation for academic excellence and lifelong learning.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <div className="social-icon">🔵</div>
                            <div className="social-icon">📸</div>
                            <div className="social-icon">🐦</div>
                            <div className="social-icon">📺</div>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700', borderBottom: '2px solid #E06B65', paddingBottom: '8px', width: 'fit-content', margin: '0' }}>
                            Quick Links
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="footer-link" onClick={() => handleScroll('home_top')}>🏠 Home</span>
                            <span className="footer-link" onClick={() => handleScroll('about_section')}>📖 About School</span>
                            <span className="footer-link" onClick={() => handleScroll('contact_section')}>✉️ Contact</span>
                        </div>
                    </div>

                    {/* Column 3: Portals & Hubs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700', borderBottom: '2px solid #62C3E5', paddingBottom: '8px', width: 'fit-content', margin: '0' }}>
                            Portals & Hubs
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="footer-link" onClick={() => onEnterPortal('school')}>🏫 School Portal</span>
                            <span className="footer-link" onClick={() => onEnterPortal('teacher')}>🧑‍🏫 Teacher Portal</span>
                            <span className="footer-link" onClick={() => onEnterPortal('parent')}>👨‍👩‍👦 Parent Portal</span>
                            <span className="footer-link" onClick={() => onEnterPortal('student')}>🧑‍🎓 Student Hub</span>
                        </div>
                    </div>

                    {/* Column 4: Contact info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700', borderBottom: '2px solid #69C6A0', paddingBottom: '8px', width: 'fit-content', margin: '0' }}>
                            Contact Us
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#aaaaaa' }}>
                            <div>📍 Sonpur, Post - Masga, Block - Pratappur (C.G.) - 497223</div>
                            <div>📞 +91 96693-46044</div>
                            <div>✉️ contact@shrihansschool.edu</div>
                            <div>🕒 Timing: Mon - Sat (9:00 AM - 3:00 PM)</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid #222222',
                    paddingTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '15px',
                    fontSize: '11px',
                    color: '#888888'
                }}>
                    <div>{strings.footerText}</div>
                    <div>{strings.footerContact}</div>
                </div>
            </footer>

        </div>
    );
}
