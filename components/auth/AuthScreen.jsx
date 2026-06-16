'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';

// Centralized strings dictionary for JSX internationalization and ESLint/SonarQube compliance
const strings = {
    backToWebsite: '← Back',
    schoolName: 'Shri Hans Vidya Niketan School',
    schoolLocation: 'Sonpur, Post - Masga, Block - Pratappur (C.G.) - 497223',
    
    // Portal Selection Title
    portalSelectTitle: 'School Digital Portals',
    portalSelectSub: 'Select the appropriate portal to access your dashboard.',

    // Portal Selection Cards
    cardSchoolTitle: 'School Portal',
    cardSchoolDesc: 'For Administrative Officers, Directors, and Office Assistants.',
    cardTeacherTitle: 'Teacher Portal',
    cardTeacherDesc: 'For Faculty members, HODs, and Classroom Instructors.',
    cardParentTitle: 'Parent Portal',
    cardParentDesc: 'For Parents and Guardians to monitor fees and academic progress.',
    cardStudentTitle: 'Student Hub',
    cardStudentDesc: 'For Students to view report cards, attendance, and ID cards.',

    // Form Navigation
    backToPortals: '← Choose Another Portal',
    
    // Tab Toggles
    tabSignIn: '🔑 Sign In',
    tabPortalReg: '🎓 Register Access',
    tabStaffSignUp: '🧑‍🏫 Staff Sign Up',
    
    // Labels & Tips
    fullName: 'Full Name',
    placeholderFullName: 'Ex: Rahul Sharma',
    studentAdmissionNo: 'Student Admission Number',
    placeholderAdmissionNo: 'Ex: 1024',
    admissionNoTip: 'Enter the admission number exactly as registered in the school records.',
    
    labelUniqueIdEmail: 'Unique ID / Email Address',
    labelStaffEmail: 'Staff Email Address',
    labelTeacherEmail: 'Teacher Email Address',
    
    placeholderLoginId: 'Ex: 1024 or P-1024 or staff@vidya.com',
    placeholderStaffEmail: 'staff@vidya.com',
    placeholderTeacherEmail: 'teacher@vidya.com',
    
    loginTipStudent: 'Login with your Admission Number (e.g. 1024) or email.',
    loginTipParent: 'Login with your Parent ID (e.g. P-1024) or email.',
    loginTipStaff: 'Login with your registered staff email.',
    loginTipTeacher: 'Login with your registered teacher email.',
    
    labelPassword: 'Password',
    placeholderPassword: '••••••••',
    
    btnSignIn: '🔑 Sign In',
    btnRegisterPortal: '🎉 Register Portal',
    btnCreateStaffAccount: '📝 Create Staff Account',
    
    staffInvitesRemaining: '⚠️ Only {count} staff invites remaining',
    uniqueIdHintStudent: 'Your Unique ID is your school Admission Number (e.g. 1024).',
    uniqueIdHintParent: 'Your Unique ID starts with "P-" followed by the Admission Number (e.g. P-1024).'
};

export default function AuthScreen({ onAuthSuccess, showToast, onBackToWebsite, initialPortal }) {
    const [selectedPortal, setSelectedPortal] = useState(initialPortal || null); // null, 'school', 'teacher', 'parent', 'student'
    
    const [loginId, setLoginId] = useState(''); // Unique ID or Email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', or 'portal-signup'
    const [loading, setLoading] = useState(false);
    const [remainingInvites, setRemainingInvites] = useState(null);
    const [registrationClosed, setRegistrationClosed] = useState(false);

    // Student/Parent registration states
    const [portalRole, setPortalRole] = useState(initialPortal === 'parent' ? 'parent' : 'student'); // 'student' or 'parent'
    const [admissionNo, setAdmissionNo] = useState('');

    useEffect(() => {
        checkRegistrationStatus();
    }, []);

    useEffect(() => {
        if (initialPortal) {
            selectPortal(initialPortal);
        } else {
            setSelectedPortal(null);
        }
    }, [initialPortal]);

    const checkRegistrationStatus = async () => {
        try {
            const { count, error } = await db.from('profiles').select('*', { count: 'exact', head: true });
            if (error) {
                if (error.code === '42P01') {
                    showToast('⚠️ profiles table missing. Please run database SQL setup.', 'error');
                } else if (error.message && (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                    showToast('⚠️ Database connection failed. Please check if the database is active or if you are offline.', 'error');
                } else {
                    console.error('Error status check:', error.message);
                }
                return;
            }

            // We only count staff profiles for registration limits
            const { count: staffCount } = await db
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .not('role', 'in', '("student","parent")');

            if (staffCount >= 6) {
                setRegistrationClosed(true);
            } else {
                setRegistrationClosed(false);
                setRemainingInvites(6 - staffCount);
            }
        } catch (e) {
            console.error('Auth check error:', e);
        }
    };

    const selectPortal = (portal) => {
        setSelectedPortal(portal);
        setLoginId('');
        setPassword('');
        setShowPassword(false);
        setName('');
        setAdmissionNo('');
        
        if (portal === 'student') {
            setPortalRole('student');
            setAuthMode('login');
        } else if (portal === 'parent') {
            setPortalRole('parent');
            setAuthMode('login');
        } else {
            setAuthMode('login');
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (authMode === 'login') {
                if (!loginId.trim() || !password) {
                    showToast('Unique ID / Email & Password required!', 'error');
                    setLoading(false);
                    return;
                }

                let targetEmail = loginId.trim();

                // Check if it is a Unique ID (no @ sign)
                if (!targetEmail.includes('@')) {
                    const cleanId = targetEmail.toUpperCase();
                    if (cleanId.startsWith('P-')) {
                        // Parent Login
                        targetEmail = `${cleanId}@shrihans.com`;
                    } else {
                        // Student Login
                        targetEmail = `${cleanId}@shrihans.com`;
                    }
                }

                const { data, error } = await db.auth.signInWithPassword({
                    email: targetEmail.toLowerCase(),
                    password: password
                });
                if (error) throw error;
                showToast('Welcome back!', 'success');
            } 
            else if (authMode === 'signup') {
                // Staff Sign Up (Only allowed from School Portal admin section)
                if (!loginId.trim() || !password || !name.trim()) {
                    showToast('All fields are required for Staff Registration!', 'error');
                    setLoading(false);
                    return;
                }

                const { data, error } = await db.auth.signUp({
                    email: loginId.trim().toLowerCase(),
                    password: password,
                    options: {
                        data: {
                            full_name: name.trim()
                        }
                    }
                });

                if (error) {
                    if (error.status === 429) {
                        throw new Error('Too many attempts! Please wait 10-15 minutes.');
                    }
                    throw error;
                }

                if (data?.user && data?.user?.identities?.length === 0) {
                    throw new Error('This email is already registered. Try logging in.');
                }

                showToast('Staff Registration successful! Please login.', 'success');
                setAuthMode('login');
                checkRegistrationStatus();
            } 
            else if (authMode === 'portal-signup') {
                // Student/Parent Portal Registration
                if (!admissionNo.trim() || !password) {
                    showToast('Admission Number & Password required!', 'error');
                    setLoading(false);
                    return;
                }

                const cleanAdmissionNo = admissionNo.trim().toUpperCase();

                // 1. Verify if the student exists in the database
                const { data: students, error: findError } = await db
                    .from('students')
                    .select('*')
                    .eq('admission_no', cleanAdmissionNo);

                if (findError) throw findError;

                if (!students || students.length === 0) {
                    throw new Error('Admission Number not found in school records. Please contact school office.');
                }

                const student = students[0];
                let targetEmail = '';
                let targetFullName = '';

                if (portalRole === 'student') {
                    targetEmail = `${cleanAdmissionNo}@shrihans.com`.toLowerCase();
                    targetFullName = student.name;
                } else {
                    targetEmail = `P-${cleanAdmissionNo}@shrihans.com`.toLowerCase();
                    targetFullName = `Parent of ${student.name}`;
                }

                // 2. Perform Supabase Sign Up
                const { data: signUpData, error: signUpError } = await db.auth.signUp({
                    email: targetEmail,
                    password: password,
                    options: {
                        data: {
                            full_name: targetFullName
                        }
                    }
                });

                if (signUpError) {
                    if (signUpError.status === 429) {
                        throw new Error('Too many attempts! Please wait 10-15 minutes.');
                    }
                    throw signUpError;
                }

                if (signUpData?.user && signUpData?.user?.identities?.length === 0) {
                    throw new Error('This Portal Unique ID is already registered. Try logging in.');
                }

                // 3. Update the newly created profile's role to 'student' or 'parent'
                if (signUpData?.user) {
                    const { error: profileError } = await db
                        .from('profiles')
                        .update({
                            role: portalRole,
                            full_name: targetFullName,
                            email: targetEmail
                        })
                        .eq('id', signUpData.user.id);

                    if (profileError) {
                        console.error('Profile role update error:', profileError.message);
                    }
                }

                // Log out immediately so the user can log in with their credentials, 
                // since Supabase auto-logs in the newly signed up user.
                await db.auth.signOut();

                showToast(`🎉 Portal Access registered successfully for ${portalRole.toUpperCase()}!`, 'success');
                
                // Set the Login ID to the registered Unique ID and switch to Login Tab
                setLoginId(portalRole === 'parent' ? `P-${cleanAdmissionNo}` : cleanAdmissionNo);
                setAuthMode('login');
            }
        } catch (e) {
            console.error('Auth error:', e);
            showToast(e.message || 'Authentication failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="auth-screen" className={`theme-${selectedPortal || 'selection'}`} style={{
            height: '100vh',
            background: selectedPortal === 'school' ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' :
                        selectedPortal === 'teacher' ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' :
                        selectedPortal === 'parent' ? 'linear-gradient(135deg, #78350f 0%, #451a03 100%)' :
                        selectedPortal === 'student' ? 'linear-gradient(135deg, #164e63 0%, #083344 100%)' :
                        'linear-gradient(135deg, #090d16 0%, #111827 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            transition: 'background 0.5s ease',
            color: '#cbd5e1',
            fontFamily: "'Poppins', sans-serif"
        }}>
            
            {/* STYLES FOR INTUITIVE USER PORTAL CARDS */}
            <style dangerouslySetInnerHTML={{ __html: `
                .portal-selection-container {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    width: 100%;
                    max-width: 1000px;
                    margin: 40px auto;
                }
                @media (max-width: 992px) {
                    .portal-selection-container {
                        grid-template-columns: repeat(2, 1fr);
                        padding: 0 10px;
                    }
                }
                @media (max-width: 550px) {
                    .portal-selection-container {
                        grid-template-columns: 1fr;
                    }
                }
                .portal-card {
                    background: rgba(30, 41, 59, 0.45);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 30px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                }
                .portal-card:hover {
                    transform: translateY(-8px);
                    background: rgba(30, 41, 59, 0.6);
                }
                .portal-card.school:hover {
                    border-color: #6366f1;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
                }
                .portal-card.teacher:hover {
                    border-color: #10b981;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.25);
                }
                .portal-card.parent:hover {
                    border-color: #f59e0b;
                    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.25);
                }
                .portal-card.student:hover {
                    border-color: #06b6d4;
                    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.25);
                }
                .portal-icon {
                    font-size: 32px;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.04);
                    transition: all 0.3s ease;
                }
                .portal-card.school .portal-icon { color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.2); }
                .portal-card.teacher .portal-icon { color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
                .portal-card.parent .portal-icon { color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
                .portal-card.student .portal-icon { color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); }

                .portal-card:hover .portal-icon {
                    transform: scale(1.1) rotate(5deg);
                    background: rgba(255, 255, 255, 0.08);
                }
                .portal-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #ffffff;
                }
                .portal-desc {
                    font-size: 11px;
                    color: #94a3b8;
                    line-height: 1.5;
                }
                .auth-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #cbd5e1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    margin-bottom: 20px;
                }
                .auth-back-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateX(-2px);
                }
                
                .portal-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    outline: none;
                }
                .portal-input:focus {
                    background: rgba(15, 23, 42, 0.8);
                }
                .theme-school input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
                .theme-teacher input:focus { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
                .theme-parent input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); }
                .theme-student input:focus { border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }

                .portal-submit-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 700;
                    color: #ffffff;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
                .theme-school .portal-submit-btn { background: #6366f1; box-shadow: 0 4px 10px rgba(99,102,241,0.2); }
                .theme-teacher .portal-submit-btn { background: #10b981; box-shadow: 0 4px 10px rgba(16,185,129,0.2); }
                .theme-parent .portal-submit-btn { background: #f59e0b; box-shadow: 0 4px 10px rgba(245,158,11,0.2); }
                .theme-student .portal-submit-btn { background: #06b6d4; box-shadow: 0 4px 10px rgba(6,182,212,0.2); }
                
                .portal-submit-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                .portal-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Layout optimization for short screens / mobile viewports */
                @media (max-height: 720px), (max-width: 500px) {
                    .portal-selection-container {
                        margin: 15px auto !important;
                        gap: 12px !important;
                    }
                    .portal-card {
                        padding: 16px 12px !important;
                        gap: 10px !important;
                    }
                    .portal-icon {
                        font-size: 24px !important;
                        width: 48px !important;
                        height: 48px !important;
                    }
                    .portal-title {
                        font-size: 13px !important;
                    }
                    .portal-desc {
                        display: none !important; /* Hide description on mobile/short screens to fit viewport */
                    }
                    .auth-card {
                        padding: 20px !important;
                    }
                    .form-group {
                        margin-bottom: 12px !important;
                    }
                    .portal-input {
                        padding: 10px 14px !important;
                        font-size: 13px !important;
                    }
                    .portal-submit-btn {
                        padding: 11px !important;
                        font-size: 13px !important;
                    }
                    .auth-footer {
                        margin-top: 15px !important;
                    }
                    .auth-back-btn {
                        margin-bottom: 12px !important;
                    }
                }
                @media (max-width: 768px) {
                    .portal-selection-container {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            ` }} />

            {/* BACK TO PUBLIC WEBSITE BUTTON (Top-Left) */}
            {onBackToWebsite && (
                <button 
                    onClick={onBackToWebsite}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    {strings.backToWebsite}
                </button>
            )}

            {/* BRANDING LOGO & NAME (Visible only in selection mode) */}
            {selectedPortal === null && (
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <img 
                        src="/logo.png" 
                        alt="School Logo" 
                        style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 10px' }} 
                    />
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 5px 0' }}>
                        {strings.schoolName}
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                        {strings.schoolLocation}
                    </p>
                </div>
            )}

            {/* CASE 1: PORTAL SELECTION SCREEN */}
            {selectedPortal === null ? (
                <div style={{ textAlign: 'center', width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginTop: '20px', marginBottom: '8px' }}>
                        {strings.portalSelectTitle}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                        {strings.portalSelectSub}
                    </p>

                    <div className="portal-selection-container">
                        {/* School Admin Portal */}
                        <div className="portal-card school" onClick={() => selectPortal('school')}>
                            <div className="portal-icon">🏫</div>
                            <h3 className="portal-title">{strings.cardSchoolTitle}</h3>
                            <p className="portal-desc">{strings.cardSchoolDesc}</p>
                        </div>

                        {/* Teacher Portal */}
                        <div className="portal-card teacher" onClick={() => selectPortal('teacher')}>
                            <div className="portal-icon">🧑‍🏫</div>
                            <h3 className="portal-title">{strings.cardTeacherTitle}</h3>
                            <p className="portal-desc">{strings.cardTeacherDesc}</p>
                        </div>

                        {/* Parent Portal */}
                        <div className="portal-card parent" onClick={() => selectPortal('parent')}>
                            <div className="portal-icon">👨‍👩‍👦</div>
                            <h3 className="portal-title">{strings.cardParentTitle}</h3>
                            <p className="portal-desc">{strings.cardParentDesc}</p>
                        </div>

                        {/* Student Hub */}
                        <div className="portal-card student" onClick={() => selectPortal('student')}>
                            <div className="portal-icon">🧑‍🎓</div>
                            <h3 className="portal-title">{strings.cardStudentTitle}</h3>
                            <p className="portal-desc">{strings.cardStudentDesc}</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* CASE 2: PORTAL LOGIN / REGISTRATION FORMS */
                <div style={{ width: '100%', maxWidth: '440px' }}>
                    <div className="auth-card" style={{ 
                        padding: '30px', 
                        borderRadius: '16px', 
                        background: 'rgba(30, 41, 59, 0.45)', 
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {/* Compact Branding Header for Form Mode */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                        </div>

                        {/* Portal Form Title */}
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: '20px' }}>
                            {selectedPortal === 'school' && `🏫 ${strings.cardSchoolTitle}`}
                            {selectedPortal === 'teacher' && `🧑‍🏫 ${strings.cardTeacherTitle}`}
                            {selectedPortal === 'parent' && `👨‍👩‍👦 ${strings.cardParentTitle}`}
                            {selectedPortal === 'student' && `🧑‍🎓 ${strings.cardStudentTitle}`}
                        </h2>

                        {/* Form Header / Indicator */}
                        <div id="auth-tabs" style={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            padding: '4px', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '8px', 
                            marginBottom: '24px', 
                            border: '1px solid rgba(255,255,255,0.05)' 
                        }}>
                            <span
                                style={{ 
                                    fontSize: '12px', 
                                    padding: '8px 24px', 
                                    textAlign: 'center', 
                                    borderRadius: '6px', 
                                    fontWeight: '600',
                                    flex: 'none',
                                    color: selectedPortal === 'school' ? '#818cf8' :
                                           selectedPortal === 'teacher' ? '#34d399' :
                                           selectedPortal === 'parent' ? '#fbbf24' :
                                           '#22d3ee',
                                    textShadow: selectedPortal === 'school' ? '0 0 8px rgba(129, 140, 248, 0.4)' :
                                                selectedPortal === 'teacher' ? '0 0 8px rgba(52, 211, 153, 0.4)' :
                                                selectedPortal === 'parent' ? '0 0 8px rgba(251, 191, 36, 0.4)' :
                                                '0 0 8px rgba(34, 211, 238, 0.4)'
                                }}
                            >
                                {strings.tabSignIn}
                            </span>
                        </div>

                        <form onSubmit={handleAuth} id="auth-form-wrap">
                            {/* Input: Full Name (Staff Sign Up only) */}
                            {authMode === 'signup' && (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                                        {strings.fullName}
                                    </label>
                                    <input
                                        type="text"
                                        className="portal-input"
                                        placeholder={strings.placeholderFullName}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={authMode === 'signup'}
                                    />
                                </div>
                            )}

                            {/* Input: Admission Number (Portal Registration only) */}
                            {authMode === 'portal-signup' ? (
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                                        {strings.studentAdmissionNo}
                                    </label>
                                    <input
                                        type="text"
                                        className="portal-input"
                                        placeholder={strings.placeholderAdmissionNo}
                                        value={admissionNo}
                                        onChange={(e) => setAdmissionNo(e.target.value)}
                                        required={authMode === 'portal-signup'}
                                    />
                                    <small style={{ color: '#94a3b8', fontSize: '10px', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
                                        {strings.admissionNoTip}
                                    </small>
                                </div>
                            ) : (
                                /* Input: Email / Unique ID (Standard Logins) */
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                                        {selectedPortal === 'school' && strings.labelStaffEmail}
                                        {selectedPortal === 'teacher' && strings.labelTeacherEmail}
                                        {(selectedPortal === 'student' || selectedPortal === 'parent') && strings.labelUniqueIdEmail}
                                    </label>
                                    <input
                                        type="text"
                                        className="portal-input"
                                        placeholder={
                                            selectedPortal === 'school' ? strings.placeholderStaffEmail :
                                            selectedPortal === 'teacher' ? strings.placeholderTeacherEmail :
                                            strings.placeholderLoginId
                                        }
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        required
                                    />
                                    {authMode === 'login' && (
                                        <small style={{ color: '#94a3b8', fontSize: '10px', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
                                            {selectedPortal === 'student' && strings.loginTipStudent}
                                            {selectedPortal === 'parent' && strings.loginTipParent}
                                            {selectedPortal === 'school' && strings.loginTipStaff}
                                            {selectedPortal === 'teacher' && strings.loginTipTeacher}
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Input: Password */}
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                                    {strings.labelPassword}
                                </label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="portal-input"
                                        placeholder={strings.placeholderPassword}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ paddingRight: '46px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                            transition: 'color 0.2s ease',
                                            outline: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = '#94a3b8';
                                        }}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="portal-submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 
                                 authMode === 'login' ? strings.btnSignIn : 
                                 authMode === 'portal-signup' ? strings.btnRegisterPortal : 
                                 strings.btnCreateStaffAccount}
                            </button>
                        </form>

                        {/* Footer limits & tips */}
                        <div className="auth-footer" id="auth-limit-note" style={{ marginTop: '24px', fontSize: '11px', textAlign: 'center', lineHeight: '1.5' }}>
                            {selectedPortal === 'school' && authMode === 'signup' && remainingInvites !== null && (
                                <span style={{ color: '#fbbf24', fontWeight: '500' }}>
                                    {strings.staffInvitesRemaining.replace('{count}', remainingInvites)}
                                </span>
                            )}
                            {selectedPortal === 'student' && authMode === 'portal-signup' && (
                                <span style={{ color: '#94a3b8' }}>
                                    {strings.uniqueIdHintStudent}
                                </span>
                            )}
                            {selectedPortal === 'parent' && authMode === 'portal-signup' && (
                                <span style={{ color: '#94a3b8' }}>
                                    {strings.uniqueIdHintParent}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
