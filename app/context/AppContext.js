'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '../../lib/supabase';
import { getStudentStatus } from '../../lib/marksUtils';
import { genPDF, downloadClassPDF } from '../../lib/pdfGenerator';

import dynamic from 'next/dynamic';

// Components
import Sidebar from '../../components/ui/Sidebar';
import Topbar from '../../components/ui/Topbar';
import BottomNav from '../../components/ui/BottomNav';
import Toast from '../../components/ui/Toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AuthScreen = dynamic(() => import('../../components/auth/AuthScreen'), {
    loading: () => <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>Loading Portal...</div>
});
const LandingPage = dynamic(() => import('../../components/public/LandingPage'), {
    loading: () => <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>Loading Shri Hans Vidya Niketan School...</div>
});

const AppContext = createContext(null);

export function AppContextProvider({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSession, setActiveSession] = useState('2025-26');

    // Toast Notification State
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState('success');

    // Confirmation Modal State
    const [confirmShow, setConfirmShow] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState('');
    const [confirmCallback, setConfirmCallback] = useState(null);

    // Dashboard Data State
    const [dashboardStudents, setDashboardStudents] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        total: 0,
        complete: 0,
        infoPending: 0,
        marksPending: 0,
        aplus: 0,
        avg: 0
    });
    const [pendingStudentsList, setPendingStudentsList] = useState([]);
    const [classSummaryData, setClassSummaryData] = useState({});
    const [dashboardLoading, setDashboardLoading] = useState(false);

    // Student/Parent Specific States
    const [personalStudent, setPersonalStudent] = useState(null);
    const [personalLoading, setPersonalLoading] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToastMsg(msg);
        setToastType(type);
    };

    const triggerConfirm = (msg, callback) => {
        setConfirmMsg(msg);
        setConfirmCallback(() => callback);
        setConfirmShow(true);
    };

    const handleConfirmClose = (confirmed) => {
        setConfirmShow(false);
        if (confirmed && confirmCallback) {
            confirmCallback();
        }
        setConfirmCallback(null);
    };

    const loadPersonalStudentData = async (profile) => {
        if (!profile) return;
        const email = profile.email || '';
        const roleStr = profile.role?.toLowerCase();
        if (roleStr === 'student' || roleStr === 'parent') {
            setPersonalLoading(true);
            try {
                const admissionNo = email.split('@')[0].replace('P-', '').replace('p-', '').toUpperCase();
                const { data, error } = await db
                    .from('students')
                    .select('*')
                    .eq('admission_no', admissionNo);
                
                if (data && data.length > 0) {
                    setPersonalStudent(data[0]);
                }
            } catch (e) {
                console.error('Error loading personal student data:', e);
            } finally {
                setPersonalLoading(false);
            }
        }
    };

    const initAuth = async () => {
        try {
            const { data: { session } } = await db.auth.getSession();
            await handleAuthStateChange(session);

            db.auth.onAuthStateChange(async (_event, session) => {
                await handleAuthStateChange(session);
            });
        } catch (e) {
            console.error('Auth initialization error:', e);
            setAuthLoading(false);
        }
    };

    const handleAuthStateChange = async (session) => {
        if (session) {
            try {
                let { data: profile } = await db
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!profile) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retry = await db
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    profile = retry.data;
                }

                if (!profile) {
                    throw new Error('Database profile not found');
                }

                setCurrentUser(profile);
                await loadPersonalStudentData(profile);
                
                const role = profile.role?.toLowerCase() || 'assistant';
                // If on root page, check default view. In Next.js router, we let the routing happen.
            } catch (e) {
                console.error('Error fetching auth profile details:', e);
                showToast('Auth Details Error: ' + e.message, 'error');
                db.auth.signOut();
            }
        } else {
            setCurrentUser(null);
            setPersonalStudent(null);
            setShowLogin(false);
        }
        setAuthLoading(false);
    };

    const loadDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter students by active session
            const filteredData = (data || []).filter(s => (s.session || '2025-26') === activeSession);

            setDashboardStudents(filteredData);

            let total = 0;
            let newStudents = 0;
            let oldStudents = 0;
            let leftStudents = 0;
            let complete = 0;
            let marksPending = 0;
            let infoPending = 0;
            let aplus = 0;
            let percentSum = 0;

            const classSummary = {};
            const pendingList = [];

            filteredData.forEach(s => {
                const statusVal = s.admission_status || 'Approved';
                if (statusVal === 'Withdrawn') {
                    leftStudents++;
                } else {
                    total++;
                    const timeline = s.extended_info?.timeline || [];
                    const isPromoted = timeline.some(t => 
                        t.action === 'Class Changed' || 
                        t.action === 'Promoted' || 
                        (t.details && (
                            t.details.toLowerCase().includes('promot') || 
                            t.details.toLowerCase().includes('class changed')
                        ))
                    );
                    if (isPromoted) {
                        oldStudents++;
                    } else {
                        newStudents++;
                    }
                }

                const cls = s.class || 'Unknown';
                if (!classSummary[cls]) {
                    classSummary[cls] = { total: 0, complete: 0, pending: 0 };
                }
                classSummary[cls].total++;

                const status = getStudentStatus(s);
                s.statusObj = status;

                if (status.label === 'Complete') {
                    classSummary[cls].complete++;
                    complete++;
                } else {
                    classSummary[cls].pending++;
                    pendingList.push(s);

                    if (status.label === 'Marks Pending') marksPending++;
                    else if (status.label === 'Info Missing') infoPending++;
                }

                if (s.grade === 'A+') aplus++;
                percentSum += s.percentage || 0;
            });

            const avg = total > 0 ? Math.round(percentSum / total) : 0;

            setDashboardStats({
                total,
                newStudents,
                oldStudents,
                leftStudents,
                complete,
                infoPending,
                marksPending,
                aplus,
                avg
            });

            setPendingStudentsList(pendingList);
            setClassSummaryData(classSummary);
        } catch (e) {
            console.error('Error loading dashboard data:', e);
            showToast('Stats Load Error: ' + e.message, 'error');
        } finally {
            setDashboardLoading(false);
        }
    };

    useEffect(() => {
        initAuth();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadDashboardData();
        }
    }, [currentUser, activeSession]);

    const handleLogout = async () => {
        try {
            await db.auth.signOut();
        } catch (e) {
            console.error('Logout signOut error:', e);
        }
        setCurrentUser(null);
        setPersonalStudent(null);
        setShowLogin(false);
        showToast('Logged out successfully!', 'success');
        router.push('/');
    };

    const handleDeleteStudent = async (id, callback) => {
        triggerConfirm('Kya aap sach mein is student data ko delete karna chahte hain?', async () => {
            try {
                showToast('⏳ Deleting student...');
                const { error } = await db.from('students').delete().eq('id', id);
                if (error) throw error;
                showToast('🗑 Student deleted successfully!', 'success');
                loadDashboardData();
                if (callback) callback();
            } catch (e) {
                console.error('Delete failed:', e);
                showToast('Delete Failed: ' + e.message, 'error');
            }
        });
    };

    const handleDownloadPDF = async (id) => {
        try {
            showToast('⏳ Generating PDF...');
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            genPDF(data);
            showToast('📄 Marksheet PDF generated successfully!', 'success');
        } catch (e) {
            console.error('PDF error:', e);
            showToast('PDF Generation Failed: ' + e.message, 'error');
        }
    };

    const handleDownloadClassPDF = async (cls) => {
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('class', cls)
                .eq('session', activeSession)
                .order('roll_number');

            if (error) throw error;
            await downloadClassPDF(cls, data, showToast);
        } catch (e) {
            console.error('Batch PDF generation failed:', e);
            showToast('Batch PDF Failed: ' + e.message, 'error');
        }
    };

    const toggleSidebar = () => {
        if (window.innerWidth > 1100) {
            setSidebarCollapsed(!sidebarCollapsed);
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    // Helper to map route pathnames to currentPage UI key
    const getCurrentPageKey = () => {
        if (pathname === '/') return 'dashboard';
        if (pathname.startsWith('/students/admission')) return 'add-student';
        if (pathname === '/students') return 'students-list';
        if (pathname.startsWith('/marksheet')) return 'marksheet';
        if (pathname.startsWith('/search')) return 'search';
        if (pathname.startsWith('/attendance')) return 'attendance';
        if (pathname.startsWith('/fees')) return 'fees';
        if (pathname.startsWith('/teachers')) return 'teachers';
        if (pathname.startsWith('/notices')) return 'notices';
        if (pathname.startsWith('/promotion')) return 'promotion';
        if (pathname.startsWith('/download')) return 'download';
        return 'dashboard';
    };

    const getPathForPage = (page) => {
        switch (page) {
            case 'dashboard': return '/';
            case 'add-student': return '/students/admission';
            case 'students-list': return '/students';
            case 'marksheet': return '/marksheet';
            case 'search': return '/search';
            case 'attendance': return '/attendance';
            case 'fees': return '/fees';
            case 'teachers': return '/teachers';
            case 'notices': return '/notices';
            case 'promotion': return '/promotion';
            case 'download': return '/download';
            default: return '/';
        }
    };

    const getPageTitleLabel = () => {
        const key = getCurrentPageKey();
        const titles = {
            dashboard: 'Dashboard',
            'add-student': 'Student Admission',
            'students-list': 'All Students Registry',
            marksheet: 'Marksheet Hub',
            search: 'Search & Preview',
            attendance: 'Daily Attendance Register',
            fees: 'Fee Collection & Records',
            teachers: 'Staff Directory',
            notices: 'School Noticeboard',
            promotion: 'Student Promotion Hub',
            download: 'Downloads & Exports Center'
        };
        return titles[key] || 'Vidya Portal';
    };

    // Render Auth or loading screen if not fully authed
    if (authLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                fontFamily: "'Outfit', 'Inter', sans-serif",
                textAlign: 'center',
                padding: '20px'
            }}>
                <style>{`
                    @keyframes pulse-logo {
                        0% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 10px rgba(241, 196, 15, 0.2)); }
                        50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 25px rgba(241, 196, 15, 0.6)); }
                        100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 10px rgba(241, 196, 15, 0.2)); }
                    }
                    @keyframes fade-text {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                    .loader-logo {
                        width: 100px;
                        height: 100px;
                        margin-bottom: 20px;
                        object-fit: contain;
                        animation: pulse-logo 2.5s infinite ease-in-out;
                    }
                    .school-title {
                        font-size: 20px;
                        font-weight: 700;
                        letter-spacing: 2px;
                        margin: 0 0 8px 0;
                        color: #f1c40f;
                        text-transform: uppercase;
                    }
                    .portal-subtitle {
                        font-size: 14px;
                        font-weight: 500;
                        color: #94a3b8;
                        margin-bottom: 25px;
                        letter-spacing: 1px;
                    }
                    .loader-bar-bg {
                        width: 180px;
                        height: 4px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        overflow: hidden;
                        margin-bottom: 12px;
                    }
                    .loader-bar-fill {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, #f1c40f, #f39c12);
                        border-radius: 10px;
                        animation: loading-slide 1.5s infinite ease-in-out;
                        transform-origin: left;
                    }
                    @keyframes loading-slide {
                        0% { transform: scaleX(0) translateX(0); }
                        50% { transform: scaleX(0.5) translateX(50%); }
                        100% { transform: scaleX(0) translateX(200%); }
                    }
                    .loading-text {
                        font-size: 12px;
                        color: #64748b;
                        animation: fade-text 1.5s infinite ease-in-out;
                    }
                `}</style>
                <img src="/logo.png" alt="Shri Hans Vidya Niketan School Logo" className="loader-logo" />
                <h1 className="school-title">Shri Hans Vidya Niketan School</h1>
                <div className="portal-subtitle">Vidya Portal</div>
                
                <div className="loader-bar-bg">
                    <div className="loader-bar-fill"></div>
                </div>
                <div className="loading-text">Initializing Vidya Portal...</div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <>
                {showLogin ? (
                    <AuthScreen 
                        onAuthSuccess={handleAuthStateChange} 
                        showToast={showToast} 
                        onBackToWebsite={() => setShowLogin(false)} 
                        initialPortal={typeof showLogin === 'string' ? showLogin : null}
                    />
                ) : (
                    <LandingPage onEnterPortal={(portal) => setShowLogin(portal || true)} />
                )}
                <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
            </>
        );
    }

    return (
        <AppContext.Provider value={{
            currentUser,
            authLoading,
            sidebarOpen,
            setSidebarOpen,
            sidebarCollapsed,
            setSidebarCollapsed,
            toastMsg,
            toastType,
            showToast,
            triggerConfirm,
            dashboardStudents,
            dashboardStats,
            pendingStudentsList,
            classSummaryData,
            dashboardLoading,
            loadDashboardData,
            personalStudent,
            personalLoading,
            handleLogout,
            handleDeleteStudent,
            handleDownloadPDF,
            handleDownloadClassPDF,
            toggleSidebar,
            getCurrentPageKey,
            getPathForPage,
            activeSession,
            setActiveSession
        }}>
            <div id="app-wrap" style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
                <img id="school-logo" src="/logo.png" style={{ display: 'none' }} alt="School Logo" />
                <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>
                
                <button
                    className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
                        <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <Sidebar
                    currentPage={getCurrentPageKey()}
                    onChangePage={(page) => {
                        setSidebarOpen(false);
                        router.push(getPathForPage(page));
                    }}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    sidebarOpen={sidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                />

                <main className={`main ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <Topbar
                        pageTitle={getPageTitleLabel()}
                        onToggleSidebar={toggleSidebar}
                    />
                    <div className="content">
                        {children}
                    </div>
                </main>

                <BottomNav
                    currentPage={getCurrentPageKey()}
                    onChangePage={(page) => {
                        router.push(getPathForPage(page));
                    }}
                    currentUser={currentUser}
                />

                <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

                <ConfirmModal
                    show={confirmShow}
                    message={confirmMsg}
                    onConfirm={() => handleConfirmClose(true)}
                    onCancel={() => handleConfirmClose(false)}
                />
            </div>
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
}
