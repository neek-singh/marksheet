'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../../lib/supabase';
import { useAppContext } from '../../app/context/AppContext';
import { getStudentStatus, gClass } from '../../lib/marksUtils';

// ─── Skeleton Components ──────────────────────────────────────────────────────
const SK_STYLE = {
    background: 'linear-gradient(90deg, var(--cream) 25%, #f0e8d4 50%, var(--cream) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s ease-in-out infinite',
    borderRadius: '6px',
};

const Sk = ({ w = '80%', h = '13px', style = {} }) => (
    <div style={{ width: w, height: h, ...SK_STYLE, ...style }} />
);

const SkeletonRow = ({ cols = 6 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i}>
                <Sk
                    w={i === 0 ? '40%' : i === 1 ? '70%' : i === cols - 1 ? '50%' : '85%'}
                    style={{ marginLeft: i === 0 ? 'auto' : undefined }}
                />
            </td>
        ))}
    </tr>
);

const skeletonStyle = `
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
`;


export default function PromotionHub() {
    const { currentUser, showToast, loadDashboardData } = useAppContext();
    const [sourceSession, setSourceSession] = useState('2025-26');
    const [sourceClass, setSourceClass] = useState('');
    
    const [targetSession, setTargetSession] = useState('2026-27');
    const [targetClass, setTargetClass] = useState('');
    
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal for confirmation details
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const classesList = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const sessionsList = ['2019-20', '2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

    // Auto-calculate targets when source values change
    useEffect(() => {
        if (sourceClass) {
            const currentIndex = classesList.indexOf(sourceClass);
            if (currentIndex !== -1 && currentIndex < classesList.length - 1) {
                setTargetClass(classesList[currentIndex + 1]);
            } else {
                setTargetClass(sourceClass); // Default to same if already 8th or custom
            }
        } else {
            setTargetClass('');
        }
    }, [sourceClass]);

    useEffect(() => {
        if (sourceSession) {
            const currentParts = sourceSession.split('-');
            if (currentParts.length === 2) {
                const year1 = parseInt(currentParts[0]);
                const year2 = parseInt(currentParts[1]);
                if (!isNaN(year1) && !isNaN(year2)) {
                    const nextSession = `${year1 + 1}-${String(year2 + 1).padStart(2, '0')}`;
                    if (sessionsList.includes(nextSession)) {
                        setTargetSession(nextSession);
                    } else {
                        setTargetSession(sourceSession);
                    }
                }
            }
        }
    }, [sourceSession]);

    // Paginated lazy loading setup
    const PAGE_SIZE = 15;
    const [studentPage, setStudentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [totalStudentCount, setTotalStudentCount] = useState(0);
    const loaderRef = useRef(null);

    const fetchStudents = useCallback(async (page = 0, replace = false) => {
        if (!sourceClass || !sourceSession) return;
        setStudentsLoading(true);
        if (replace) {
            setLoading(true);
            setSelectedIds([]);
        }
        
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // 1. Get total count for pagination
            const countRes = await db
                .from('students')
                .select('id', { count: 'exact', head: true })
                .eq('class', sourceClass)
                .eq('session', sourceSession);

            const total = countRes.count || 0;
            setTotalStudentCount(total);

            // 2. Fetch page data
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('class', sourceClass)
                .eq('session', sourceSession)
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;
            
            const fetched = data || [];
            if (replace) {
                setStudents(fetched);
            } else {
                setStudents(prev => {
                    const existingIds = new Set(prev.map(s => s.id));
                    const newItems = fetched.filter(item => !existingIds.has(item.id));
                    return [...prev, ...newItems];
                });
            }

            setStudentPage(page);
            setHasMore((from + fetched.length) < total);
        } catch (e) {
            console.error('Error fetching students for promotion:', e);
            showToast('Students loading failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
            setStudentsLoading(false);
        }
    }, [sourceClass, sourceSession, showToast]);

    useEffect(() => {
        if (!currentUser) return;
        setStudentPage(0);
        setHasMore(true);
        fetchStudents(0, true);
    }, [sourceClass, sourceSession, fetchStudents, currentUser]);

    // ── IntersectionObserver — auto-load next page when sentinel is visible ───
    useEffect(() => {
        if (!hasMore || studentsLoading) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchStudents(studentPage + 1);
            }
        }, { threshold: 0.1 });
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, studentsLoading, studentPage, fetchStudents]);

    // Checkbox helper functions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // Filter students by search bar
    const filteredStudents = students.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) ||
            s.admission_no?.toLowerCase().includes(q) ||
            s.father_name?.toLowerCase().includes(q)
        );
    });

    const isAllSelected = filteredStudents.length > 0 && selectedIds.length === filteredStudents.length;

    // Promotion Action Execution
    const executeBulkPromotion = async () => {
        if (selectedIds.length === 0) return;
        setPromoting(true);
        setShowConfirmModal(false);

        try {
            const studentsToPromote = students.filter(s => selectedIds.includes(s.id));
            
            // Loop through selected students individually to preserve their extended_info details safely
            const updatePromises = studentsToPromote.map(student => {
                const currentExt = student.extended_info || {};
                const timeline = currentExt.timeline || [];
                timeline.push({
                    action: 'Class Changed',
                    date: new Date().toISOString().split('T')[0],
                    details: `Bulk promoted from Class ${student.class} (${student.session}) to Class ${targetClass} (${targetSession})`
                });

                const newExt = {
                    ...currentExt,
                    timeline
                };

                return db
                    .from('students')
                    .update({
                        class: targetClass,
                        session: targetSession,
                        roll_number: '', // Reset roll number
                        marks: null, // Clear marks array
                        grand_total_obtained: null, // Clear grand totals
                        grand_total_marks: null,
                        percentage: null,
                        grade: null,
                        extended_info: newExt
                    })
                    .eq('id', student.id);
            });

            const results = await Promise.all(updatePromises);
            
            // Check if any errors occurred
            const failed = results.filter(r => r.error);
            if (failed.length > 0) {
                console.error('Some promotions failed:', failed);
                throw new Error(`${failed.length} students could not be promoted due to database error.`);
            }

            showToast(`🚀 Successfully promoted ${selectedIds.length} students to Class ${targetClass} (${targetSession})!`, 'success');
            
            // Sync dashboard context
            await loadDashboardData();
            
            // Refresh local roster
            await fetchStudents(0, true);
        } catch (e) {
            console.error('Promotion failed:', e);
            showToast('Promotion failed: ' + e.message, 'error');
        } finally {
            setPromoting(false);
        }
    };

    return (
        <div className="promotion-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{skeletonStyle}</style>
            
            {/* Selection Panels */}
            <div className="promotion-grid">
                
                {/* Source parameters Card */}
                <div className="card student-dir-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="var(--gold)" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                        </svg>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750 }}>Source Roster Details (वर्तमान विवरण)</h3>
                    </div>
                    
                    <div className="promotion-controls-grid">
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)' }}>Select Class</label>
                            <select 
                                value={sourceClass} 
                                onChange={(e) => setSourceClass(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                <option value="">Select Class</option>
                                {classesList.map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)' }}>Select Session</label>
                            <select 
                                value={sourceSession} 
                                onChange={(e) => setSourceSession(e.target.value)}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                {sessionsList.map(s => (
                                    <option key={s} value={s}>Session {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Target parameters Card */}
                <div className="card student-dir-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="var(--gold)" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                        </svg>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750 }}>Target Promotion Target (प्रोन्नत लक्ष्य)</h3>
                    </div>

                    <div className="promotion-controls-grid">
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)' }}>Target Class</label>
                            <select 
                                value={targetClass} 
                                onChange={(e) => setTargetClass(e.target.value)}
                                disabled={!sourceClass}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                <option value="">Select Target Class</option>
                                {classesList.map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                                <option value="Graduated">Graduated / TC Issued</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)' }}>Target Session</label>
                            <select 
                                value={targetSession} 
                                onChange={(e) => setTargetSession(e.target.value)}
                                disabled={!sourceSession}
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            >
                                {sessionsList.map(s => (
                                    <option key={s} value={s}>Session {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

            </div>

            {/* Students Table Section */}
            {sourceClass && (
                <div className="card student-dir-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750 }}>
                                Class Roster List ({totalStudentCount} Student{totalStudentCount !== 1 && 's'})
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                                Choose the students you want to promote to the target class & session. {students.length < totalStudentCount && `(Loaded ${students.length} of ${totalStudentCount})`}
                            </p>
                        </div>
                        
                        {/* Search bar inside the roster list */}
                        {students.length > 0 && (
                            <div className="promotion-search-wrap">
                                <input
                                    type="text"
                                    placeholder="Search student in this class..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}
                                />
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px', textAlign: 'center' }}>
                                                <input type="checkbox" disabled style={{ transform: 'scale(1.2)' }} />
                                            </th>
                                            <th>Student Name</th>
                                            <th>Admission No</th>
                                            <th>Roll No</th>
                                            <th>Current Marks status</th>
                                            <th>Overall Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                            <div style={{ marginBottom: '12px', color: 'var(--muted)', display: 'flex', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '36px', height: '36px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                                </svg>
                            </div>
                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--charcoal)' }}>No students found</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                                There are no students registered in Class {sourceClass} for Session {sourceSession}.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="results-table-wrap">
                                <div className="table-scroll" style={{ display: 'block', maxHeight: '380px', overflowY: 'auto' }}>
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px', textAlign: 'center' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAll}
                                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                    />
                                                </th>
                                                <th>Student Name</th>
                                                <th>Admission No</th>
                                                <th>Roll No</th>
                                                <th>Current Marks status</th>
                                                <th>Overall Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(student => {
                                                const status = getStudentStatus(student);
                                                const isSelected = selectedIds.includes(student.id);
                                                
                                                return (
                                                    <tr 
                                                        key={student.id} 
                                                        style={{ background: isSelected ? 'rgba(184, 134, 11, 0.04)' : 'transparent', transition: 'background-color 0.2s' }}
                                                    >
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => handleSelectOne(student.id)}
                                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 700 }}>{student.name}</span>
                                                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Father: {student.father_name || '—'}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>{student.admission_no || '—'}</td>
                                                        <td>{student.roll_number || '—'}</td>
                                                        <td>
                                                            <span style={{ 
                                                                background: status.label === 'Complete' ? 'rgba(34,197,94,0.08)' : status.label === 'Marks Pending' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                                                                color: status.label === 'Complete' ? 'var(--green)' : status.label === 'Marks Pending' ? '#ffa000' : 'var(--red)',
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: '700'
                                                            }}>
                                                                {status.icon} {status.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {student.grade ? (
                                                                <span className={`grade-badge ${gClass(student.grade)}`}>{student.grade}</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--muted)' }}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {studentsLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={`sk-${i}`} cols={6} />)}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Intersection Observer Sentinel */}
                                <div ref={loaderRef} style={{ height: '1px' }} />
                            </div>

                            {/* Manual Load More button (fallback) & Info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    {hasMore && !studentsLoading && (
                                        <button 
                                            className="btn btn-secondary btn-sm" 
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} 
                                            onClick={() => fetchStudents(studentPage + 1)}
                                        >
                                            Load More Students ({students.length}/{totalStudentCount})
                                        </button>
                                    )}
                                </div>
                                {!hasMore && students.length > 0 && (
                                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontStyle: 'italic', marginLeft: 'auto' }}>
                                        — Saare {totalStudentCount} students load ho gaye —
                                    </div>
                                )}
                            </div>

                            {/* Batch Action Footer Bar */}
                            <div className="promotion-footer-bar">
                                <div style={{ fontSize: '13.5px', color: 'var(--charcoal)', fontWeight: '650' }}>
                                    Selected <span style={{ color: 'var(--gold)', fontWeight: '800' }}>{selectedIds.length}</span> of {filteredStudents.length} student{filteredStudents.length !== 1 && 's'}
                                </div>
                                <button
                                    className="btn btn-primary"
                                    disabled={selectedIds.length === 0 || !targetClass || !targetSession || promoting}
                                    onClick={() => setShowConfirmModal(true)}
                                    style={{
                                        background: 'linear-gradient(to right, #1e3a8a, #3b82f6)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '10px 20px',
                                        fontSize: '13.5px',
                                        fontWeight: '700',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                                    }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {!promoting && (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.64 4.57a14.99 14.99 0 0 0-6.16 12.12A14.98 14.98 0 0 0 15.59 14.37Zm0 0-5.84 2.58m5.84-2.58-1.56-1.56m-4.28 4.14-1.56-1.56M6 16.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                            </svg>
                                        )}
                                        {promoting ? 'Promoting Students...' : `Promote Selected Students to Class ${targetClass || '?'}`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONFIRMATION DIALOG MODAL */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="card student-dir-card" style={{
                        maxWidth: '520px',
                        width: '90%',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--red)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '32px', height: '32px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </span>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 850, color: 'var(--charcoal)' }}>Confirm Bulk Student Promotion</h3>
                        </div>

                        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.5' }}>
                            Aap Class <strong>{sourceClass}</strong> ({sourceSession}) ke <strong>{selectedIds.length} selected students</strong> ko promote karne ja rhe hain:
                        </p>

                        <div style={{ 
                            background: '#f8f9fa', 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            marginBottom: '20px',
                            fontSize: '13px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                                <span><strong>Target Class:</strong> Class {targetClass}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                                <span><strong>Target Session:</strong> Session {targetSession}</span>
                            </div>
                            <div style={{ color: 'var(--red)', fontWeight: '650', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <span>Reset warning: Unka current roll number delete ho jayega, and unke report card ke marks empty ho jayenge taaki naye session ke naye marks enter kiye ja sakein.</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowConfirmModal(false)}
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                                Cancel (रद्द करें)
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={executeBulkPromotion}
                                style={{ 
                                    padding: '8px 16px', 
                                    fontSize: '13px',
                                    background: 'var(--red)',
                                    borderColor: 'var(--red)',
                                    color: '#ffffff'
                                }}
                            >
                                Yes, Promote (हाँ, प्रोन्नत करें)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
