'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../../app/context/AppContext';
import { db } from '../../lib/supabase';
import { getStudentStatus, gClass } from '../../lib/marksUtils';
import { Icons } from '../ui/Icons';

// ─── Skeleton Components ───────────────────────────────────────────────────────
const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--cream) 25%, #f0e8d4 50%, var(--cream) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s ease-in-out infinite',
    borderRadius: '6px',
};

const SkeletonBox = ({ w = '80%', h = '13px', style = {} }) => (
    <div style={{ width: w, height: h, ...shimmerStyle, ...style }} />
);

const SkeletonStatCard = () => (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '12px', ...shimmerStyle, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
            <SkeletonBox w="60px" h="28px" style={{ marginBottom: '8px' }} />
            <SkeletonBox w="100px" h="10px" />
        </div>
    </div>
);

const SkeletonClassRow = () => (
    <tr>
        <td><SkeletonBox w="80px" /></td>
        <td><SkeletonBox w="30px" /></td>
        <td><SkeletonBox w="30px" /></td>
        <td><SkeletonBox w="30px" /></td>
        <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', ...shimmerStyle }} />
                <SkeletonBox w="30px" h="10px" />
            </div>
        </td>
        <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <SkeletonBox w="90px" h="26px" />
                <SkeletonBox w="80px" h="26px" />
            </div>
        </td>
    </tr>
);

const SkeletonStudentRow = () => (
    <tr>
        <td><SkeletonBox w="20px" /></td>
        <td>
            <SkeletonBox w="110px" h="13px" style={{ marginBottom: '5px' }} />
            <SkeletonBox w="75px" h="10px" />
        </td>
        <td><SkeletonBox w="60px" /></td>
        <td><SkeletonBox w="40px" /></td>
        <td><SkeletonBox w="55px" /></td>
        <td><SkeletonBox w="45px" /></td>
        <td><SkeletonBox w="30px" h="20px" style={{ borderRadius: '10px' }} /></td>
        <td><SkeletonBox w="80px" h="22px" style={{ borderRadius: '12px' }} /></td>
        <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                <SkeletonBox w="26px" h="26px" />
                <SkeletonBox w="55px" h="26px" />
                <SkeletonBox w="40px" h="26px" />
            </div>
        </td>
    </tr>
);

const PAGE_SIZE = 20;

export default function MarksheetHub({
    onEnterMarks,
    onEditInfo,
    onPreviewStudent,
    activeClassFilter = 'all'
}) {
    const {
        currentUser,
        activeSession,
        dashboardStats,
        classSummaryData,
        dashboardLoading,
        handleDownloadPDF,
        handleDownloadClassPDF,
        handleDeleteStudent,
        showToast,
    } = useAppContext();

    const [activeTab, setActiveTab] = useState('class-summary');
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState(activeClassFilter);
    const [statusFilter, setStatusFilter] = useState('all');

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const statusList = ['all', 'Complete', 'Marks Pending', 'Info Missing'];

    // ── Lazy-loaded student list state ─────────────────────────────────────────
    const [students, setStudents] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(null);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);
    const loaderRef = useRef(null);

    const hasMore = totalCount !== null && students.length < totalCount;

    // Keep refs for async callbacks
    const classFilterRef = useRef(classFilter);
    const statusFilterRef = useRef(statusFilter);
    const activeSessionRef = useRef(activeSession);

    useEffect(() => { classFilterRef.current = classFilter; }, [classFilter]);
    useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
    useEffect(() => { activeSessionRef.current = activeSession; }, [activeSession]);

    // ── Load one page ──────────────────────────────────────────────────────────
    const loadPage = useCallback(async (pageNum = 0, replace = false, opts = {}) => {
        if (loadingStudents) return;
        setLoadingStudents(true);
        const sess = opts.session ?? activeSessionRef.current;
        const cls = opts.class ?? classFilterRef.current;
        const stat = opts.status ?? statusFilterRef.current;
        try {
            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = db
                .from('students')
                .select('*', { count: 'exact' })
                .eq('session', sess)
                .order('class')
                .order('roll_number')
                .range(from, to);

            if (cls !== 'all') query = query.eq('class', cls);

            const { data, error, count } = await query;
            if (error) throw error;

            let rows = data || [];

            // Apply status filter client-side (computed field)
            if (stat !== 'all') {
                rows = rows.filter(s => getStudentStatus(s).label === stat);
            }

            if (count !== null) setTotalCount(count);
            setStudents(prev => replace ? rows : [...prev, ...rows]);
            setPage(pageNum);
            setInitialLoaded(true);
        } catch (e) {
            console.error('Error loading students:', e);
            if (showToast) showToast('Students load failed: ' + e.message, 'error');
        } finally {
            setLoadingStudents(false);
        }
    }, [loadingStudents]);

    const resetAndLoad = useCallback((opts = {}) => {
        setStudents([]);
        setInitialLoaded(false);
        setPage(0);
        setTotalCount(null);
        loadPage(0, true, {
            session: opts.session ?? activeSessionRef.current,
            class: opts.class ?? classFilterRef.current,
            status: opts.status ?? statusFilterRef.current,
        });
    }, []);

    // Reload when filters/session change
    useEffect(() => {
        if (activeTab === 'student-registry') resetAndLoad({ class: classFilter });
    }, [classFilter]);

    useEffect(() => {
        if (activeTab === 'student-registry') resetAndLoad({ status: statusFilter });
    }, [statusFilter]);

    useEffect(() => {
        if (activeTab === 'student-registry') {
            resetAndLoad({ session: activeSession });
        } else {
            setInitialLoaded(false);
            setStudents([]);
        }
    }, [activeSession]);

    // Load on tab switch
    useEffect(() => {
        if (activeTab === 'student-registry' && !initialLoaded) {
            loadPage(0, true);
        }
    }, [activeTab, initialLoaded]);

    // IntersectionObserver
    useEffect(() => {
        if (activeTab !== 'student-registry') return;
        const sentinel = loaderRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingStudents) {
                loadPage(page + 1);
            }
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingStudents, page, loadPage, activeTab]);

    // Client-side search on loaded rows
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.roll_number?.toLowerCase().includes(q) ||
            s.father_name?.toLowerCase().includes(q)
        );
    }, [students, searchQuery]);

    const getGradeBadge = (grade) => {
        if (!grade) return <span className="grade-badge grade-E">—</span>;
        return <span className={`grade-badge ${gClass(grade)}`}>{grade}</span>;
    };

    const totalStudents = dashboardStats.total || 0;
    const completedStudents = dashboardStats.complete || 0;
    const pendingStudents = totalStudents - completedStudents;
    const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
    const pendingRate = totalStudents > 0 ? Math.round((pendingStudents / totalStudents) * 100) : 0;

    const classOrder = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const sortedClasses = Object.keys(classSummaryData).sort((a, b) => {
        const ia = classOrder.indexOf(a), ib = classOrder.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1; if (ib === -1) return -1;
        return ia - ib;
    });

    const shimmerCSS = `
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    `;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{shimmerCSS}</style>

            {/* ── Stats Panel ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {dashboardLoading ? (
                    <>{[1,2,3].map(i => <SkeletonStatCard key={i} />)}</>
                ) : (
                    <>
                        {/* Total */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
                            <div style={{ background: 'var(--cream)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icons.Student size={24} color="var(--primary)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>{totalStudents}</div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Total Students</div>
                            </div>
                        </div>

                        {/* Completed */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
                            <div style={{ background: 'rgba(34,197,94,0.08)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icons.Check size={24} color="var(--green)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--green)', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>{completedStudents}</div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', marginBottom: '4px' }}>Completed ({completionRate}%)</div>
                                <div style={{ width: '100%', height: '4px', background: 'var(--cream)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--green)', transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.015)' }}>
                            <div style={{ background: 'rgba(245,158,11,0.08)', width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icons.Clock size={24} color="#f59e0b" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>{pendingStudents}</div>
                                <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', marginBottom: '4px' }}>Pending ({pendingRate}%)</div>
                                <div style={{ width: '100%', height: '4px', background: 'var(--cream)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pendingRate}%`, height: '100%', background: '#f59e0b', transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Tab Navigation ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '20px', paddingBottom: '2px' }}>
                {[
                    { key: 'class-summary', icon: <Icons.School size={14} />, label: 'Class-wise Progress' },
                    { key: 'student-registry', icon: <Icons.Clipboard size={14} />, label: 'Student Mark Registry' },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                        padding: '10px 16px', background: 'none', border: 'none',
                        borderBottom: activeTab === t.key ? '3px solid var(--gold)' : '3px solid transparent',
                        color: activeTab === t.key ? 'var(--charcoal)' : 'var(--muted)',
                        fontWeight: '700', cursor: 'pointer', fontSize: '14px',
                        transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px'
                    }}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab 1: Class Summary ── */}
            {activeTab === 'class-summary' && (
                <div className="card" style={{ padding: '24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        <Icons.School size={16} style={{ marginRight: '6px' }} /> कक्षा-वार प्रगति स्थिति (Class-wise Status)
                    </div>

                    {dashboardLoading ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr><th>Class</th><th>Total Students</th><th>Complete</th><th>Pending</th><th>Completion Rate</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 8 }).map((_, i) => <SkeletonClassRow key={i} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : sortedClasses.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon"><Icons.Inbox size={48} /></div>
                            <p>Koi class data nahi mila. Students register karein aur marks add karein.</p>
                        </div>
                    ) : (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr><th>Class</th><th>Total Students</th><th>Complete</th><th>Pending</th><th>Completion Rate</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {sortedClasses.map(c => {
                                            const cs = classSummaryData[c] || { total: 0, complete: 0, pending: 0 };
                                            const pct = cs.total > 0 ? Math.round((cs.complete / cs.total) * 100) : 0;
                                            return (
                                                <tr key={c} style={{ animation: 'fadeIn 0.3s ease' }}>
                                                    <td><strong>Class {c}</strong></td>
                                                    <td>{cs.total}</td>
                                                    <td style={{ color: 'var(--green)', fontWeight: '600' }}>{cs.complete}</td>
                                                    <td style={{ color: cs.pending > 0 ? '#ffa000' : 'var(--muted)', fontWeight: '600' }}>{cs.pending}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ flex: 1, height: '6px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden', minWidth: '80px' }}>
                                                                <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--gold)', transition: 'width 0.5s' }} />
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 'bold' }}>{pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                onClick={() => { setClassFilter(c); setActiveTab('student-registry'); }}>
                                                                <Icons.Eye size={12} style={{ marginRight: '4px' }} /> View Students
                                                            </button>
                                                            {isHighAccess && (
                                                                <button className="btn btn-success btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                    onClick={() => handleDownloadClassPDF(c)}>
                                                                    <Icons.Download size={12} style={{ marginRight: '4px' }} /> Batch PDF
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab 2: Student Mark Registry ── */}
            {activeTab === 'student-registry' && (
                <div className="card" style={{ padding: '24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            <Icons.Clipboard size={16} style={{ marginRight: '6px' }} /> अंक प्रविष्टि सूची (Student Mark Registry)
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600', fontStyle: 'italic' }}>
                            {totalCount !== null ? `${filteredStudents.length}${searchQuery ? ' mila' : ''} / ${totalCount} students` : ''}
                            {totalCount !== null && students.length < totalCount ? ` · ${students.length} loaded` : ''}
                        </span>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '6px', display: 'block' }}>Search Student</label>
                            <input
                                type="text"
                                placeholder="Naam, Father's Name ya Roll No se dhundho..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                            />
                        </div>

                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Filter by Class:</span>
                            <div className="filter-chips" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                {classesList.map(cls => (
                                    <div key={cls} className={`chip ${classFilter === cls ? 'active' : ''}`}
                                        onClick={() => setClassFilter(cls)}
                                        style={{ padding: '5px 12px', fontSize: '12.5px', borderRadius: '15px' }}>
                                        {cls === 'all' ? 'All Classes' : `Class ${cls}`}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Filter by Status:</span>
                            <div className="filter-chips" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                {statusList.map(st => (
                                    <div key={st} className={`chip ${statusFilter === st ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(st)}
                                        style={{ padding: '5px 12px', fontSize: '12.5px', borderRadius: '15px' }}>
                                        {st === 'all' ? 'All Status' : st}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── First-load Skeleton ── */}
                    {!initialLoaded && loadingStudents ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr><th>#</th><th>Name</th><th>Class</th><th>Roll No</th><th>Obtained</th><th>%</th><th>Grade</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 10 }).map((_, i) => <SkeletonStudentRow key={i} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    ) : filteredStudents.length === 0 && !loadingStudents ? (
                        /* Empty state */
                        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '10px', border: '2px dashed rgba(200,169,110,0.35)', background: 'rgba(184,134,11,0.03)' }}>
                            <Icons.Search size={44} color="var(--gold)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '8px' }}>
                                {searchQuery ? `"${searchQuery}" se koi student nahi mila` : 'Is filter mein koi student nahi hai'}
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                                {searchQuery ? 'Naam, Roll No ya Father Name dobara check karein.' : 'Class ya Status filter badlein.'}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {searchQuery && (
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setSearchQuery('')}>
                                        <Icons.Close size={12} /> Search Clear
                                    </button>
                                )}
                                {classFilter !== 'all' && (
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setClassFilter('all')}>
                                        <Icons.ArrowLeft size={12} /> All Classes
                                    </button>
                                )}
                            </div>
                        </div>

                    ) : (
                        /* Table with data */
                        <div>
                            {/* Desktop Table */}
                            <div className="results-table-wrap">
                                <div className="table-scroll">
                                    <table className="results-table">
                                        <thead>
                                            <tr><th>#</th><th>Name</th><th>Class</th><th>Roll No</th><th>Obtained</th><th>%</th><th>Grade</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map((s, idx) => {
                                                const status = getStudentStatus(s);
                                                const isComplete = status.label === 'Complete';
                                                return (
                                                    <tr key={s.id} style={{ animation: 'fadeIn 0.25s ease' }}>
                                                        <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{idx + 1}</td>
                                                        <td>
                                                            <strong>{s.name}</strong><br />
                                                            <small style={{ color: 'var(--muted)' }}>{s.father_name || ''}</small>
                                                        </td>
                                                        <td>Class {s.class}</td>
                                                        <td>{s.roll_number || '—'}</td>
                                                        <td>{s.grand_total_obtained || 0}/{s.grand_total_marks || 0}</td>
                                                        <td><strong>{s.percentage || 0}%</strong></td>
                                                        <td>{getGradeBadge(s.grade)}</td>
                                                        <td>
                                                            <span style={{
                                                                background: isComplete ? 'rgba(34,197,94,0.08)' : status.label === 'Marks Pending' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                                                                color: isComplete ? 'var(--green)' : status.label === 'Marks Pending' ? '#ffa000' : 'var(--red)',
                                                                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                            }}>
                                                                {isComplete ? <Icons.Check size={12} /> : status.label === 'Marks Pending' ? <Icons.Clock size={12} /> : <Icons.Warning size={12} />}
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                                <button className="btn btn-info btn-sm" title="Preview" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onPreviewStudent(s.id)}><Icons.Eye size={12} /></button>
                                                                <button className="btn btn-primary btn-sm" title="Enter Marks" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onEnterMarks(s)}>
                                                                    <Icons.Clipboard size={12} style={{ marginRight: '4px' }} /> Marks
                                                                </button>
                                                                {isHighAccess && (
                                                                    <button className="btn btn-success btn-sm" title="Download PDF" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDownloadPDF(s.id)}>
                                                                        <Icons.Download size={12} style={{ marginRight: '4px' }} /> PDF
                                                                    </button>
                                                                )}
                                                                <button className="btn btn-secondary btn-sm" title="Edit Info" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onEditInfo(s.id)}>
                                                                    <Icons.Edit size={12} style={{ marginRight: '4px' }} /> Info
                                                                </button>
                                                                {isHighAccess && (
                                                                    <button className="btn btn-danger btn-sm" title="Delete" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDeleteStudent(s.id)}>
                                                                        <Icons.Trash size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Loading-more skeleton rows */}
                                            {loadingStudents && Array.from({ length: 5 }).map((_, i) => <SkeletonStudentRow key={`sk-${i}`} />)}
                                        </tbody>
                                    </table>

                                    {/* Sentinel for IntersectionObserver */}
                                    <div ref={loaderRef} style={{ height: '1px' }} />
                                </div>
                            </div>

                            {/* Load more / end */}
                            {hasMore && !loadingStudents && (
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => loadPage(page + 1)}>
                                    <Icons.ArrowRight size={13} /> Load More ({students.length}/{totalCount})
                                </button>
                            )}
                            {!hasMore && initialLoaded && students.length > 0 && (
                                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '10px 0', fontStyle: 'italic' }}>
                                    — Saare {totalCount} students load ho gaye —
                                </div>
                            )}

                            {/* Mobile Cards */}
                            <div className="student-cards" style={{ flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                {filteredStudents.map(s => {
                                    const status = getStudentStatus(s);
                                    const isComplete = status.label === 'Complete';
                                    return (
                                        <div className="student-card" key={s.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.name}</div>
                                                {getGradeBadge(s.grade)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                                                Class {s.class} | Roll: {s.roll_number || '—'} | F: {s.father_name || ''}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{
                                                    background: isComplete ? 'rgba(34,197,94,0.08)' : status.label === 'Marks Pending' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                                                    color: isComplete ? 'var(--green)' : status.label === 'Marks Pending' ? '#ffa000' : 'var(--red)',
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    {isComplete ? <Icons.Check size={12} /> : status.label === 'Marks Pending' ? <Icons.Clock size={12} /> : <Icons.Warning size={12} />}
                                                    {status.label}
                                                </span>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold' }}>
                                                    {s.percentage || 0}%
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '10px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-info btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onPreviewStudent(s.id)}><Icons.Eye size={12} style={{ marginRight: '4px' }} /> View</button>
                                                <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onEnterMarks(s)}><Icons.Clipboard size={12} style={{ marginRight: '4px' }} /> Marks</button>
                                                {isHighAccess && <button className="btn btn-success btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDownloadPDF(s.id)}><Icons.Download size={12} style={{ marginRight: '4px' }} /> PDF</button>}
                                                <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onEditInfo(s.id)}><Icons.Edit size={12} style={{ marginRight: '4px' }} /> Info</button>
                                                {isHighAccess && <button className="btn btn-danger btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDeleteStudent(s.id)}><Icons.Trash size={12} /></button>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {loadingStudents && Array.from({ length: 3 }).map((_, i) => (
                                    <div key={`msk-${i}`} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <SkeletonBox w="120px" h="15px" />
                                            <SkeletonBox w="30px" h="20px" />
                                        </div>
                                        <SkeletonBox w="70%" h="11px" style={{ marginBottom: '10px' }} />
                                        <SkeletonBox w="100%" h="30px" style={{ borderRadius: '8px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
