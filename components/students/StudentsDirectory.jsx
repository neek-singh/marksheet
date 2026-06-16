'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../app/context/AppContext';
import { db } from '../../lib/supabase';
import Icons from '../ui/Icons';

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonCell = ({ width = '80%', height = '13px' }) => (
    <div style={{
        height,
        width,
        borderRadius: '6px',
        background: 'linear-gradient(90deg, var(--cream) 25%, #f0e8d4 50%, var(--cream) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
    }} />
);

const SkeletonRow = () => (
    <tr>
        <td><SkeletonCell width="24px" /></td>
        <td><SkeletonCell width="90px" /></td>
        <td><SkeletonCell width="50px" /></td>
        <td>
            <SkeletonCell width="110px" height="13px" />
            <div style={{ marginTop: '5px' }}><SkeletonCell width="75px" height="10px" /></div>
        </td>
        <td><SkeletonCell width="60px" /></td>
        <td><SkeletonCell width="55px" /></td>
        <td><SkeletonCell width="65px" /></td>
        <td style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <SkeletonCell width="28px" height="26px" />
                <SkeletonCell width="52px" height="26px" />
            </div>
        </td>
    </tr>
);

// ─── Mobile Skeleton Card ──────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <SkeletonCell width="120px" height="15px" />
            <SkeletonCell width="80px" height="12px" />
        </div>
        <SkeletonCell width="70%" height="11px" />
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonCell width="55px" height="22px" />
            <SkeletonCell width="80px" height="22px" />
        </div>
    </div>
);

const PAGE_SIZE = 20;

export default function StudentsDirectory() {
    const router = useRouter();
    const { currentUser, activeSession, handleDeleteStudent, showToast: ctxToast } = useAppContext();

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    // ── Filters ────────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedMedium, setSelectedMedium] = useState('all');
    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const mediumsList = ['all', 'HINDI', 'ENGLISH'];

    // ── Pagination state ───────────────────────────────────────────────────────
    const [students, setStudents] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const loaderRef = useRef(null);
    const activeSessionRef = useRef(activeSession);
    const selectedClassRef = useRef(selectedClass);
    const selectedMediumRef = useRef(selectedMedium);

    const hasMore = totalCount !== null && students.length < totalCount;

    // ── Load one page from DB ──────────────────────────────────────────────────
    const loadPage = useCallback(async (pageNum = 0, replace = false, opts = {}) => {
        if (loading) return;
        setLoading(true);
        const sess = opts.session ?? activeSessionRef.current;
        const cls = opts.class ?? selectedClassRef.current;
        const med = opts.medium ?? selectedMediumRef.current;
        try {
            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = db
                .from('students')
                .select('id, name, father_name, class, roll_number, admission_no, medium, session', { count: 'exact' })
                .eq('session', sess)
                .order('class')
                .order('roll_number')
                .range(from, to);

            if (cls !== 'all') query = query.eq('class', cls);
            if (med !== 'all') query = query.ilike('medium', med);

            const { data, error, count } = await query;
            if (error) throw error;

            if (count !== null) setTotalCount(count);
            setStudents(prev => replace ? (data || []) : [...prev, ...(data || [])]);
            setPage(pageNum);
            setInitialLoaded(true);
        } catch (e) {
            console.error('Error loading students:', e);
            if (ctxToast) ctxToast('Students load failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // ── Reload when session/class/medium changes ───────────────────────────────
    const resetAndLoad = useCallback((opts = {}) => {
        const sess = opts.session ?? activeSessionRef.current;
        const cls = opts.class ?? selectedClassRef.current;
        const med = opts.medium ?? selectedMediumRef.current;
        setStudents([]);
        setInitialLoaded(false);
        setPage(0);
        setTotalCount(null);
        loadPage(0, true, { session: sess, class: cls, medium: med });
    }, []);

    // Sync refs
    useEffect(() => { activeSessionRef.current = activeSession; resetAndLoad({ session: activeSession }); }, [activeSession]);
    useEffect(() => { selectedClassRef.current = selectedClass; resetAndLoad({ class: selectedClass }); }, [selectedClass]);
    useEffect(() => { selectedMediumRef.current = selectedMedium; resetAndLoad({ medium: selectedMedium }); }, [selectedMedium]);

    // Initial load
    useEffect(() => {
        if (currentUser && !initialLoaded) loadPage(0, true);
    }, [currentUser]);

    // ── IntersectionObserver — auto-load next page ─────────────────────────────
    useEffect(() => {
        const sentinel = loaderRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadPage(page + 1);
            }
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, page, loadPage]);

    // ── Client-side search filter (on loaded rows) ────────────────────────────
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s =>
            s.name?.toLowerCase().includes(q) ||
            s.roll_number?.toLowerCase().includes(q) ||
            s.admission_no?.toLowerCase().includes(q) ||
            s.father_name?.toLowerCase().includes(q)
        );
    }, [students, searchQuery]);

    const shimmerCSS = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;

    const handleDelete = (id) => {
        handleDeleteStudent(id, () => resetAndLoad());
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{shimmerCSS}</style>

            <div className="card" style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Student size={18} />
                            <span>Students List</span>
                        </div>
                        <span style={{ background: 'var(--cream)', color: '#8b6508', fontSize: '11.5px', fontWeight: '700', padding: '5px 12px', borderRadius: '15px' }}>
                            {totalCount !== null
                                ? `${filteredStudents.length}${searchQuery ? ` mila` : ''} / ${totalCount} Students`
                                : loading ? 'Loading...' : '0 Students'}
                        </span>
                        {totalCount !== null && students.length < totalCount && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                                ({students.length}/{totalCount} loaded)
                            </span>
                        )}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/students/admission')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Icons.Plus size={14} /> Add New Student
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {/* Search */}
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginBottom: '6px', display: 'block' }}>Search Student</label>
                        <input
                            type="text"
                            placeholder="Name, Father's Name, Roll No, ya Admission No se dhundho..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                        />
                    </div>

                    {/* Class chips */}
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Filter by Class:</span>
                        <div className="filter-chips" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            {classesList.map(cls => (
                                <div
                                    key={cls}
                                    className={`chip ${selectedClass === cls ? 'active' : ''}`}
                                    onClick={() => setSelectedClass(cls)}
                                    style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '15px' }}
                                >
                                    {cls === 'all' ? 'All Classes' : `Class ${cls}`}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medium chips */}
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Filter by Medium:</span>
                        <div className="filter-chips" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            {mediumsList.map(med => (
                                <div
                                    key={med}
                                    className={`chip ${selectedMedium === med ? 'active' : ''}`}
                                    onClick={() => setSelectedMedium(med)}
                                    style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '15px' }}
                                >
                                    {med === 'all' ? 'All Mediums' : med}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Table / Skeleton / Empty State ── */}
                {!initialLoaded && loading ? (
                    /* First-load skeleton */
                    <div className="results-table-wrap">
                        <div className="table-scroll">
                            <table className="results-table">
                                <thead>
                                    <tr>
                                        <th>#</th><th>Admission No</th><th>Roll No</th><th>Student Name</th>
                                        <th>Class</th><th>Medium</th><th>Session</th><th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : filteredStudents.length === 0 && !loading ? (
                    /* Empty state */
                    <div style={{
                        padding: '40px 20px', textAlign: 'center', borderRadius: '10px',
                        border: '2px dashed rgba(200,169,110,0.35)', background: 'rgba(184,134,11,0.03)'
                    }}>
                        <Icons.Student size={44} color="var(--gold)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '8px' }}>
                            {searchQuery
                                ? `"${searchQuery}" se koi student nahi mila`
                                : selectedClass !== 'all' || selectedMedium !== 'all'
                                ? 'Is filter mein koi student nahi hai'
                                : `Session ${activeSession} mein koi student nahi mila`}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                            {searchQuery
                                ? 'Naam, Roll No, Admission No ya Father Name dobara check karein.'
                                : selectedClass !== 'all' || selectedMedium !== 'all'
                                ? 'Filter badlein ya "All" select karein.'
                                : 'Topbar mein session change karein ya naaye students add karein.'}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {searchQuery && (
                                <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setSearchQuery('')}>
                                    <Icons.Close size={12} /> Search Clear Karein
                                </button>
                            )}
                            {(selectedClass !== 'all' || selectedMedium !== 'all') && (
                                <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => { setSelectedClass('all'); setSelectedMedium('all'); }}>
                                    <Icons.ArrowLeft size={12} /> Filters Reset Karein
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table */}
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>Admission No</th><th>Roll No</th><th>Student Name</th>
                                            <th>Class</th><th>Medium</th><th>Session</th><th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((s, index) => (
                                            <tr key={s.id} style={{ animation: 'fadeIn 0.3s ease' }}>
                                                <td style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{index + 1}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600' }}>{s.admission_no}</td>
                                                <td>{s.roll_number || '—'}</td>
                                                <td>
                                                    <strong>{s.name}</strong>
                                                    <br />
                                                    <small style={{ color: 'var(--muted)' }}>F: {s.father_name || ''}</small>
                                                </td>
                                                <td>Class {s.class}</td>
                                                <td>
                                                    <span style={{
                                                        background: (s.medium || 'HINDI').toUpperCase() === 'ENGLISH' ? 'rgba(184,134,11,0.08)' : 'rgba(15,118,110,0.08)',
                                                        color: (s.medium || 'HINDI').toUpperCase() === 'ENGLISH' ? 'var(--gold)' : '#0f766e',
                                                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700'
                                                    }}>
                                                        {s.medium || 'HINDI'}
                                                    </span>
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>{s.session || '2025-26'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                        <button
                                                            className="btn btn-info btn-sm"
                                                            title="View Student Profile"
                                                            onClick={() => router.push(`/search?preview=${s.id}`)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                        >
                                                            <Icons.Eye size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            title="Edit Details"
                                                            onClick={() => router.push(`/students/admission?edit=${s.id}`)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px' }}
                                                        >
                                                            <Icons.Edit size={12} /> Edit
                                                        </button>
                                                        {isHighAccess && (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                title="Delete Student"
                                                                onClick={() => handleDelete(s.id)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                            >
                                                                <Icons.Trash size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Inline skeleton rows while loading more */}
                                        {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`sk-${i}`} />)}
                                    </tbody>
                                </table>

                                {/* IntersectionObserver sentinel */}
                                <div ref={loaderRef} style={{ height: '1px' }} />
                            </div>
                        </div>

                        {/* Load more / end indicators */}
                        {hasMore && !loading && (
                            <button
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => loadPage(page + 1)}
                            >
                                <Icons.ArrowRight size={13} /> Load More Students ({students.length}/{totalCount})
                            </button>
                        )}
                        {!hasMore && initialLoaded && students.length > 0 && (
                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '10px 0', fontStyle: 'italic' }}>
                                — Saare {totalCount} students load ho gaye —
                            </div>
                        )}

                        {/* Mobile Cards */}
                        <div className="student-cards" style={{ flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                            {filteredStudents.map(s => (
                                <div className="student-card" key={s.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.name}</div>
                                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                                            Adm: {s.admission_no}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                                        Class {s.class} | Roll: {s.roll_number || '—'} | F: {s.father_name || ''}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                        <span style={{
                                            background: (s.medium || 'HINDI').toUpperCase() === 'ENGLISH' ? 'rgba(184,134,11,0.08)' : 'rgba(15,118,110,0.08)',
                                            color: (s.medium || 'HINDI').toUpperCase() === 'ENGLISH' ? 'var(--gold)' : '#0f766e',
                                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700'
                                        }}>
                                            {s.medium || 'HINDI'}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
                                            Session: {s.session || '2025-26'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-info btn-sm" onClick={() => router.push(`/search?preview=${s.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Icons.Eye size={12} /> View
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/students/admission?edit=${s.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Icons.Edit size={12} /> Edit
                                        </button>
                                        {isHighAccess && (
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                                                <Icons.Trash size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* Mobile skeleton cards while loading more */}
                            {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`msk-${i}`} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
