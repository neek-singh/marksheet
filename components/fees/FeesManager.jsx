'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db } from '../../lib/supabase';
import { genFeeReceipt } from '../../lib/receiptGenerator';
import { Icons } from '../ui/Icons';

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
                    w={i === 0 ? '70%' : i === cols - 1 ? '50%' : '85%'}
                    style={{ marginLeft: i === cols - 1 ? 'auto' : undefined }}
                />
            </td>
        ))}
    </tr>
);

const SkeletonStatCard = () => (
    <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
        <Sk w="50px" h="28px" style={{ marginBottom: '8px' }} />
        <Sk w="90px" h="11px" />
    </div>
);

// ─── CSV Download Utility ─────────────────────────────────────────────────────
const downloadCSV = (rows, filename) => {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const header = keys.join(',');
    const body = rows.map(r =>
        keys.map(k => {
            const val = r[k] ?? '';
            return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',')
    ).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

const PAGE_SIZE = 20;

export default function FeesManager({ currentUser, showToast }) {
    const [tab, setTab] = useState('collect');
    const [classFilter, setClassFilter] = useState('all');
    const [sessionFilter, setSessionFilter] = useState('all');   // session-wise filter
    const [sessions, setSessions] = useState([]);                // unique sessions from DB
    const [searchQuery, setSearchQuery] = useState('');
    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    // ── Student lazy-load state ───────────────────────────────────────────────
    const [allStudents, setAllStudents] = useState([]);          // cumulative loaded list
    const [studentPage, setStudentPage] = useState(0);           // which page was last loaded
    const [totalStudentCount, setTotalStudentCount] = useState(null);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const sessionFilterRef = useRef('all');                      // ref for latest sessionFilter in callbacks
    const loaderRef = useRef(null);                              // sentinel for IntersectionObserver

    // ── Payment list state ────────────────────────────────────────────────────
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    // ── Fee structure state ───────────────────────────────────────────────────
    const [feesStructure, setFeesStructure] = useState([]);
    const [structureLoading, setStructureLoading] = useState(false);

    // ── Student selection state ───────────────────────────────────────────────
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);

    // ── Payment form state ────────────────────────────────────────────────────
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [remarks, setRemarks] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // ── Fee config editing state ──────────────────────────────────────────────
    const [editingConfig, setEditingConfig] = useState(null);
    const [addingConfig, setAddingConfig] = useState(false);
    const [newClassName, setNewClassName] = useState('Nursery');
    const [admFee, setAdmFee] = useState(0);
    const [tuitionFee, setTuitionFee] = useState(0);
    const [examFee, setExamFee] = useState(0);
    const [otherFee, setOtherFee] = useState(0);
    const [configLoading, setConfigLoading] = useState(false);

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';
    const isStudentOrParent = role === 'student' || role === 'parent';

    // ── Client-side filter on already loaded students ─────────────────────────
    const filteredStudents = useMemo(() => {
        return allStudents.filter(s => {
            if (classFilter !== 'all' && s.class !== classFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    s.name?.toLowerCase().includes(q) ||
                    s.roll_number?.toLowerCase().includes(q) ||
                    s.admission_no?.toLowerCase().includes(q) ||
                    s.father_name?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [allStudents, classFilter, searchQuery]);

    const hasMore = totalStudentCount !== null && allStudents.length < totalStudentCount;

    // ── Load one page of students from DB (server-side session filter) ────────
    const loadStudentPage = useCallback(async (page = 0, replace = false, forSession = null) => {
        if (studentsLoading) return;
        setStudentsLoading(true);
        // Use the passed session arg OR the ref (which is always current)
        const sess = forSession !== null ? forSession : sessionFilterRef.current;
        try {
            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = db
                .from('students')
                .select('id, name, class, roll_number, admission_no, father_name, session', { count: 'exact' })
                .order('class')
                .order('roll_number')
                .range(from, to);

            if (sess !== 'all') query = query.eq('session', sess);

            const { data, error, count } = await query;
            if (error) throw error;

            if (count !== null) setTotalStudentCount(count);
            setAllStudents(prev => {
                const incoming = data || [];
                if (replace) return incoming;
                // Deduplicate by id to prevent duplicate key errors
                const existingIds = new Set(prev.map(s => s.id));
                const unique = incoming.filter(s => !existingIds.has(s.id));
                return [...prev, ...unique];
            });
            setStudentPage(page);
            setStudentsLoaded(true);
        } catch (e) {
            console.error('Error loading students:', e);
            showToast('Students load failed: ' + e.message, 'error');
        } finally {
            setStudentsLoading(false);
        }
    }, [studentsLoading]);

    // ── Reload students when sessionFilter changes ─────────────────────────────
    useEffect(() => {
        if (!currentUser || isStudentOrParent) return;
        sessionFilterRef.current = sessionFilter;   // keep ref in sync
        setAllStudents([]);
        setStudentsLoaded(false);
        setStudentPage(0);
        setTotalStudentCount(null);
        loadStudentPage(0, true, sessionFilter);
    }, [sessionFilter, currentUser]);

    // ── IntersectionObserver — auto-load next page when sentinel is visible ───
    useEffect(() => {
        if (isStudentOrParent) return;
        const sentinel = loaderRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !studentsLoading) {
                loadStudentPage(studentPage + 1);
            }
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, studentsLoading, studentPage, loadStudentPage, isStudentOrParent]);

    // ── Load distinct sessions from DB ────────────────────────────────────────
    const loadSessions = async () => {
        try {
            const { data } = await db
                .from('students')
                .select('session')
                .not('session', 'is', null)
                .order('session');
            if (data) {
                const unique = [...new Set(data.map(r => r.session).filter(Boolean))].sort();
                setSessions(unique);
            }
        } catch (e) {
            console.error('Error loading sessions:', e);
        }
    };

    // ── Initial data load ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentUser) return;
        
        if (isStudentOrParent) {
            loadPersonalFees();
        } else {
            if (tab === 'collect') {
                loadPayments();
                loadSessions();
                if (!studentsLoaded) loadStudentPage(0, false, 'all');
            } else if (tab === 'structure') {
                loadStructure();
            }
        }
    }, [tab, currentUser]);

    // ── When class filter changes and we're filtering server-side ────────────
    // (client-side filter is fine since we load all; skip extra DB call)

    // ── Personal fees (student/parent view) ───────────────────────────────────
    const loadPersonalFees = async () => {
        setPaymentsLoading(true);
        try {
            const email = currentUser?.email || '';
            const admissionNo = email.split('@')[0].replace(/[Pp]-/g, '').toUpperCase();
            const { data: studentList, error: sErr } = await db
                .from('students').select('*').eq('admission_no', admissionNo);
            if (sErr) throw sErr;
            if (studentList && studentList.length > 0) {
                const student = studentList[0];
                const { data: structure } = await db.from('fees_structure').select('*');
                const { data: studentPayments } = await db
                    .from('fees_payments').select('*')
                    .eq('student_id', student.id)
                    .order('payment_date', { ascending: false });
                const totalDues = calculateStudentDues(student, structure || []);
                const totalPaid = (studentPayments || []).reduce((s, p) => s + (p.amount_paid || 0), 0);
                setSelectedStudent({ ...student, payments: studentPayments || [], totalDues, totalPaid, balance: totalDues - totalPaid });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPaymentsLoading(false);
        }
    };

    const loadPayments = async () => {
        setPaymentsLoading(true);
        try {
            const { data, error } = await db
                .from('fees_payments')
                .select('*, students(name, class)')
                .order('payment_date', { ascending: false })
                .limit(100);
            if (error) throw error;
            setPayments(data || []);
        } catch (e) {
            showToast('Payments load error: ' + e.message, 'error');
        } finally {
            setPaymentsLoading(false);
        }
    };

    const loadStructure = async () => {
        setStructureLoading(true);
        try {
            const { data, error } = await db.from('fees_structure').select('*').order('class_name');
            if (error) throw error;
            setFeesStructure(data || []);
        } catch (e) {
            showToast('Load Error: ' + e.message, 'error');
        } finally {
            setStructureLoading(false);
        }
    };

    const calculateStudentDues = (studentObj, structureList) => {
        if (!studentObj) return 0;
        const config = structureList.find(f => f.class_name === studentObj.class);
        if (!config) return 1000;
        return (Number(config.admission_fee) || 0) +
            (Number(config.tuition_fee_monthly) || 0) * 12 +
            (Number(config.exam_fee_annual) || 0) +
            (Number(config.other_charges) || 0);
    };

    const loadStudentPayments = async (student) => {
        setLoadingStudentDetails(true);
        try {
            let activeStructure = feesStructure;
            if (!activeStructure.length) {
                const { data } = await db.from('fees_structure').select('*');
                activeStructure = data || [];
                setFeesStructure(activeStructure);
            }
            const { data: studentPayments, error } = await db
                .from('fees_payments').select('*')
                .eq('student_id', student.id)
                .order('payment_date', { ascending: false });
            if (error) throw error;
            const totalDues = calculateStudentDues(student, activeStructure);
            const totalPaid = (studentPayments || []).reduce((s, p) => s + (p.amount_paid || 0), 0);
            setSelectedStudent({ ...student, payments: studentPayments || [], totalDues, totalPaid, balance: totalDues - totalPaid });
        } catch (e) {
            showToast('Details Fetch Error: ' + e.message, 'error');
        } finally {
            setLoadingStudentDetails(false);
        }
    };

    const handleCollectPayment = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !amountPaid || Number(amountPaid) <= 0) {
            showToast('Valid amount enter karein!', 'error'); return;
        }
        setFormLoading(true);
        const payload = {
            student_id: selectedStudent.id,
            amount_paid: Number(amountPaid),
            payment_mode: paymentMode,
            payment_date: new Date().toISOString().split('T')[0],
            remarks: remarks.trim() || null
        };
        try {
            const { data, error } = await db.from('fees_payments').insert([payload]).select();
            if (error) throw error;
            showToast('Fee payment successfully recorded!', 'success');
            const updatedTotalPaid = selectedStudent.totalPaid + Number(amountPaid);
            await genFeeReceipt(selectedStudent, data[0], updatedTotalPaid, selectedStudent.totalDues);
            setAmountPaid(''); setRemarks('');
            loadStudentPayments(selectedStudent);
            loadPayments();
        } catch (e) {
            showToast('Error recording payment: ' + e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDownloadReceipt = async (payment) => {
        try {
            showToast('Generating receipt...', 'info');
            const { data: student } = await db.from('students').select('*').eq('id', payment.student_id).single();
            const { data: structure } = await db.from('fees_structure').select('*');
            const { data: allP } = await db.from('fees_payments').select('*').eq('student_id', payment.student_id);
            const totalDues = calculateStudentDues(student, structure || []);
            const totalPaid = (allP || []).reduce((s, p) => s + (p.amount_paid || 0), 0);
            await genFeeReceipt(student, payment, totalPaid, totalDues);
            showToast('Receipt downloaded!', 'success');
        } catch (e) {
            showToast('Receipt generation failed: ' + e.message, 'error');
        }
    };

    const handleDeletePayment = async (payment) => {
        const confirmMsg = `Kya aap sach mein HN-F-${payment.receipt_no || payment.id.slice(0, 8).toUpperCase()} ka payment record (Amount: ₹${payment.amount_paid}) delete karna chahte hain?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            showToast('⏳ Deleting payment record...');
            const { error } = await db
                .from('fees_payments')
                .delete()
                .eq('id', payment.id);

            if (error) throw error;

            showToast('🗑 Payment record deleted successfully!', 'success');
            
            // Reload recent payments list
            loadPayments();
            
            // Reload active student details to refresh balance and ledger
            if (selectedStudent) {
                loadStudentPayments(selectedStudent);
            }
        } catch (e) {
            console.error('Error deleting payment:', e);
            showToast('Delete Failed: ' + e.message, 'error');
        }
    };

    // ── CSV Download: payments report ──────────────────────────────────────────
    const handleDownloadCSV = () => {
        if (!payments.length) { showToast('Koi payment record nahi hai download karne ke liye', 'info'); return; }
        const rows = payments.map(p => ({
            Date: p.payment_date,
            Receipt_No: p.receipt_no || '',
            Student_Name: p.students?.name || '',
            Class: p.students?.class || '',
            Amount_Paid: p.amount_paid,
            Payment_Mode: p.payment_mode,
            Remarks: p.remarks || ''
        }));
        downloadCSV(rows, `fee-collection-${new Date().toISOString().split('T')[0]}.csv`);
        showToast('Fee report CSV download ho gaya!', 'success');
    };

    // ── Fee structure edit handlers ───────────────────────────────────────────
    const handleEditConfig = (config) => {
        setEditingConfig(config);
        setAdmFee(config.admission_fee || 0);
        setTuitionFee(config.tuition_fee_monthly || 0);
        setExamFee(config.exam_fee_annual || 0);
        setOtherFee(config.other_charges || 0);
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        if (!editingConfig) return;
        setConfigLoading(true);
        try {
            const { error } = await db.from('fees_structure')
                .update({ admission_fee: Number(admFee) || 0, tuition_fee_monthly: Number(tuitionFee) || 0, exam_fee_annual: Number(examFee) || 0, other_charges: Number(otherFee) || 0 })
                .eq('id', editingConfig.id);
            if (error) throw error;
            showToast(`Class ${editingConfig.class_name} fee config updated!`, 'success');
            setEditingConfig(null);
            loadStructure();
        } catch (e) {
            showToast('Config Update Failed: ' + e.message, 'error');
        } finally {
            setConfigLoading(false);
        }
    };

    const handleAddConfig = async (e) => {
        e.preventDefault();
        if (feesStructure.some(f => f.class_name === newClassName)) {
            showToast(`Class ${newClassName} ka config already exists!`, 'error'); return;
        }
        setConfigLoading(true);
        try {
            const { data: existing } = await db.from('fees_structure').select('id').eq('class_name', newClassName);
            if (existing && existing.length > 0) throw new Error(`Class ${newClassName} already exists in database!`);
            const { error } = await db.from('fees_structure').insert([{
                class_name: newClassName,
                admission_fee: Number(admFee) || 0,
                tuition_fee_monthly: Number(tuitionFee) || 0,
                exam_fee_annual: Number(examFee) || 0,
                other_charges: Number(otherFee) || 0
            }]);
            if (error) throw error;
            showToast(`Class ${newClassName} fee config added!`, 'success');
            setAddingConfig(false);
            setAdmFee(0); setTuitionFee(0); setExamFee(0); setOtherFee(0);
            loadStructure();
        } catch (e) {
            showToast('Failed to add config: ' + e.message, 'error');
        } finally {
            setConfigLoading(false);
        }
    };

    const totalCollected = payments.reduce((s, p) => s + (p.amount_paid || 0), 0);
    const cashTotal = payments.filter(p => p.payment_mode === 'CASH').reduce((s, p) => s + (p.amount_paid || 0), 0);
    const onlineTotal = payments.filter(p => p.payment_mode === 'ONLINE').reduce((s, p) => s + (p.amount_paid || 0), 0);

    // ── CSS for skeleton animation ──────────────────────────────────────────────
    const skeletonStyle = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes fee-fade {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: none; }
        }
    `;

    // ══════════════════════════════════════════════════════════════════
    // STUDENT / PARENT VIEW
    // ══════════════════════════════════════════════════════════════════
    if (isStudentOrParent) {
        return (
            <div className="fees-section">
                <style>{skeletonStyle}</style>
                {paymentsLoading ? (
                    <div className="card student-dir-card">
                        <div style={{ padding: '20px' }}>
                            {[1,2,3].map(i => (
                                <div key={i} style={{ height: '18px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--cream) 25%, #f0e8d4 50%, var(--cream) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', marginBottom: '14px', width: i === 1 ? '60%' : i === 2 ? '80%' : '40%' }} />
                            ))}
                        </div>
                    </div>
                ) : selectedStudent ? (
                    <div>
                        <div className="stats-row" style={{ marginBottom: '20px' }}>
                            <div className="stat-card">
                                <div className="number" style={{ color: 'var(--gold)' }}>₹{selectedStudent.totalDues}</div>
                                <div className="label">Annual Dues Target</div>
                            </div>
                            <div className="stat-card">
                                <div className="number" style={{ color: 'var(--green)' }}>₹{selectedStudent.totalPaid}</div>
                                <div className="label">Total Paid</div>
                            </div>
                            <div className="stat-card">
                                <div className="number" style={{ color: selectedStudent.balance > 0 ? 'var(--red)' : 'var(--green)' }}>₹{selectedStudent.balance}</div>
                                <div className="label">Balance Due</div>
                            </div>
                        </div>
                        <div className="card student-dir-card">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                <Icons.Document size={16} style={{ marginRight: '6px' }} /> Fees Ledger &amp; Payment History
                            </div>
                            <p style={{ fontSize: '13px', marginBottom: '20px' }}>
                                Student: <strong>{selectedStudent.name}</strong> | Class: <strong>{selectedStudent.class}</strong> | Roll No: <strong>{selectedStudent.roll_number || '—'}</strong>
                            </p>
                            {selectedStudent.payments.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon"><Icons.Document size={48} /></div>
                                    <p>Abhi tak koi payment transaction recorded nahi hai.</p>
                                </div>
                            ) : (
                                <div className="table-scroll" style={{ display: 'block' }}>
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Date</th><th>Receipt No</th><th>Amount</th><th>Mode</th><th>Remarks</th><th>Receipt PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudent.payments.map(p => (
                                                <tr key={p.id}>
                                                    <td style={{ fontWeight: '600' }}>{p.payment_date}</td>
                                                    <td>#{p.receipt_no}</td>
                                                    <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>₹{p.amount_paid}</td>
                                                    <td><span className="badge">{p.payment_mode}</span></td>
                                                    <td>{p.remarks || '—'}</td>
                                                    <td>
                                                        <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => genFeeReceipt(selectedStudent, p, selectedStudent.totalPaid, selectedStudent.totalDues)}>
                                                            <Icons.Download size={12} style={{ marginRight: '4px' }} /> Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <div className="icon"><Icons.Search size={48} /></div>
                            <p>Student profile linkage check failed. Please contact school admin.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // ADMIN / CLERK VIEW
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="fees-section">
            <style>{skeletonStyle}</style>

            {/* ── Nav Tabs ── */}
            <div className="filter-chips" style={{ marginBottom: '20px', borderBottom: '1px solid rgba(200, 169, 110, 0.3)', paddingBottom: '10px' }}>
                <div className={`chip ${tab === 'collect' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setTab('collect')}>
                    <Icons.Fee size={14} style={{ marginRight: '6px' }} /> Fee Collection
                </div>
                {isHighAccess && (
                    <div className={`chip ${tab === 'structure' ? 'active' : ''}`} style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => { setTab('structure'); loadStructure(); }}>
                        <Icons.Settings size={14} style={{ marginRight: '6px' }} /> Fee Configurations
                    </div>
                )}
            </div>

            {/* ══════════════════ FEE COLLECTION TAB ══════════════════ */}
            {tab === 'collect' && (
                <div>
                    {/* Stats */}
                    <div className="stats-row" style={{ marginBottom: '20px' }}>
                        {paymentsLoading ? (
                            <>{[1,2,3].map(i => <SkeletonStatCard key={i} />)}</>
                        ) : (
                            <>
                                <div className="stat-card" style={{ animation: 'fee-fade 0.3s ease' }}>
                                    <div className="number" style={{ color: 'var(--green)' }}>₹{totalCollected}</div>
                                    <div className="label">Total Collected</div>
                                </div>
                                <div className="stat-card" style={{ animation: 'fee-fade 0.3s ease' }}>
                                    <div className="number" style={{ color: 'var(--gold)' }}>₹{cashTotal}</div>
                                    <div className="label">Cash Collection</div>
                                </div>
                                <div className="stat-card" style={{ animation: 'fee-fade 0.3s ease' }}>
                                    <div className="number" style={{ color: '#0f766e' }}>₹{onlineTotal}</div>
                                    <div className="label">Online / Bank</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Student Search Card */}
                    <div className="card student-dir-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                <Icons.Search size={16} style={{ marginRight: '6px' }} /> Student Dhundho — Fee Jodo
                            </div>
                            {totalStudentCount !== null && (
                                <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>
                                    {filteredStudents.length} dikh rahe hain &nbsp;·&nbsp; {allStudents.length}/{totalStudentCount} loaded
                                    {sessionFilter !== 'all' && (
                                        <strong style={{ color: 'var(--gold)', marginLeft: '6px' }}>({sessionFilter})</strong>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

                            {/* Session Filter Chips */}
                            <div style={{ background: 'rgba(184,134,11,0.06)', border: '1px solid rgba(200,169,110,0.22)', borderRadius: '8px', padding: '10px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                                    <Icons.Calendar size={12} style={{ marginRight: '4px' }} /> Session Filter
                                </span>
                                <div className="filter-chips" style={{ gap: '7px', marginBottom: 0 }}>
                                    <div
                                        onClick={() => setSessionFilter('all')}
                                        style={{
                                            padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer',
                                            fontWeight: sessionFilter === 'all' ? '700' : '500',
                                            background: sessionFilter === 'all' ? 'var(--gold)' : 'rgba(184,134,11,0.10)',
                                            color: sessionFilter === 'all' ? '#fff' : 'var(--gold)',
                                            border: `1px solid ${sessionFilter === 'all' ? 'var(--gold)' : 'rgba(184,134,11,0.3)'}`,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        All Sessions
                                    </div>
                                    {sessions.map(sess => (
                                        <div
                                            key={sess}
                                            onClick={() => setSessionFilter(sess)}
                                            style={{
                                                padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer',
                                                fontWeight: sessionFilter === sess ? '700' : '500',
                                                background: sessionFilter === sess ? 'var(--gold)' : 'rgba(184,134,11,0.10)',
                                                color: sessionFilter === sess ? '#fff' : 'var(--gold)',
                                                border: `1px solid ${sessionFilter === sess ? 'var(--gold)' : 'rgba(184,134,11,0.3)'}`,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {sess}
                                        </div>
                                    ))}
                                    {sessions.length === 0 && (
                                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>Sessions load ho rahi hain...</span>
                                    )}
                                </div>
                            </div>

                            {/* Search input */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '6px', display: 'block' }}>
                                    Search Student
                                </label>
                                <input
                                    type="text"
                                    placeholder="Name, Roll No, Admission No, ya Father Name se dhundho..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                                />
                            </div>

                            {/* Class Filter Chips */}
                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '8px', display: 'block' }}>Class Filter:</span>
                                <div className="filter-chips" style={{ gap: '8px', marginBottom: 0 }}>
                                    {classesList.map(cls => (
                                        <div
                                            key={cls}
                                            className={`chip ${classFilter === cls ? 'active' : ''}`}
                                            onClick={() => setClassFilter(cls)}
                                            style={{ padding: '5px 12px', fontSize: '12.5px', borderRadius: '15px', cursor: 'pointer' }}
                                        >
                                            {cls === 'all' ? 'All Classes' : `Class ${cls}`}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Student List — lazy loaded with skeleton */}
                        {!selectedStudent && (
                            <div>
                                {/* Loading skeleton on first load */}
                                {!studentsLoaded && studentsLoading && (
                                    <div className="table-scroll" style={{ display: 'block' }}>
                                        <table className="results-table">
                                            <thead>
                                                <tr><th>Name</th><th>Father's Name</th><th>Class</th><th>Roll No</th><th>Session</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {studentsLoaded && filteredStudents.length === 0 && (
                                    <div style={{
                                        margin: '8px 0',
                                        padding: '28px 20px',
                                        textAlign: 'center',
                                        borderRadius: '10px',
                                        border: '2px dashed rgba(200,169,110,0.35)',
                                        background: 'rgba(184,134,11,0.04)'
                                    }}>
                                        <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.55 }}>
                                            <Icons.Student size={40} color="var(--gold)" />
                                        </div>
                                        {allStudents.length === 0 ? (
                                            <>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '6px' }}>
                                                    {sessionFilter !== 'all'
                                                        ? `Session "${sessionFilter}" mein koi student nahi mila`
                                                        : 'Database mein koi student record nahi hai'}
                                                </div>
                                                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                                                    {sessionFilter !== 'all'
                                                        ? <>Is session mein abhi koi student add nahi hua hai.<br />"All Sessions" select karein ya doosra session try karein.</>
                                                        : <>Students tab mein jaake pehle students add karein,<br />phir yahaan fees collect ki ja sakti hai.</>
                                                    }
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {sessionFilter !== 'all' && (
                                                        <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setSessionFilter('all')}>
                                                            <Icons.ArrowLeft size={12} style={{ marginRight: '4px' }} /> All Sessions Dekhein
                                                        </button>
                                                    )}
                                                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => loadStudentPage(0, true, sessionFilter)}>
                                                        <Icons.ArrowRight size={12} style={{ marginRight: '4px' }} /> Dobara Try Karein
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '6px' }}>
                                                    Koi student nahi mila
                                                </div>
                                                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                                                    {searchQuery.trim() && classFilter !== 'all'
                                                        ? <>"<strong>{searchQuery}</strong>" naam se Class <strong>{classFilter}</strong> mein koi student nahi hai.<br />Search ya class filter badlein.</>
                                                        : searchQuery.trim()
                                                        ? <>"<strong>{searchQuery}</strong>" se koi student match nahi kiya.<br />Naam, Roll No, Admission No ya Father Name try karein.</>
                                                        : <>Class <strong>{classFilter}</strong> mein koi student registered nahi hai.<br />Doosri class select karein.</>
                                                    }
                                                </p>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {searchQuery.trim() && (
                                                        <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setSearchQuery('')}>
                                                            <Icons.Close size={12} style={{ marginRight: '4px' }} /> Search Clear Karein
                                                        </button>
                                                    )}
                                                    {classFilter !== 'all' && (
                                                        <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setClassFilter('all')}>
                                                            <Icons.ArrowLeft size={12} style={{ marginRight: '4px' }} /> All Classes Dekhein
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {studentsLoaded && filteredStudents.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontStyle: 'italic' }}>
                                            {filteredStudents.length} student(s) filter mein — sabhi sessions included
                                        </div>
                                        <div className="table-scroll" style={{ display: 'block', maxHeight: '320px', overflowY: 'auto' }}>
                                            <table className="results-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Father's Name</th>
                                                        <th>Class</th>
                                                        <th>Roll No</th>
                                                        <th>Session</th>
                                                        <th style={{ textAlign: 'right' }}>Fee Collect</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map(s => (
                                                        <tr key={s.id} style={{ animation: 'fee-fade 0.25s ease' }}>
                                                            <td><strong>{s.name}</strong></td>
                                                            <td>{s.father_name || '—'}</td>
                                                            <td>Class {s.class}</td>
                                                            <td>{s.roll_number || '—'}</td>
                                                            <td>
                                                                <span style={{ background: 'rgba(184,134,11,0.12)', color: 'var(--gold)', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(184,134,11,0.3)', whiteSpace: 'nowrap' }}>
                                                                    {s.session || '—'}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => loadStudentPayments(s)}>
                                                                    <Icons.Fee size={12} style={{ marginRight: '4px' }} /> Fees Jodo
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {/* Skeleton rows while loading more pages */}
                                                    {studentsLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={`sk-${i}`} cols={6} />)}
                                                </tbody>
                                            </table>

                                            {/* Intersection Observer Sentinel */}
                                            <div ref={loaderRef} style={{ height: '1px' }} />
                                        </div>

                                        {/* Manual Load More button (fallback) */}
                                        {hasMore && !studentsLoading && (
                                            <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => loadStudentPage(studentPage + 1)}>
                                                <Icons.ArrowRight size={13} /> Load More Students ({allStudents.length}/{totalStudentCount})
                                            </button>
                                        )}
                                        {!hasMore && studentsLoaded && allStudents.length > 0 && (
                                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '8px 0', fontStyle: 'italic' }}>
                                                — Saare {totalStudentCount} students load ho gaye —
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Student Detail + Payment Form */}
                    {loadingStudentDetails ? (
                        <div className="card" style={{ marginTop: '20px' }}>
                            <div style={{ padding: '16px' }}>
                                {[1,2,3,4].map(i => (
                                    <div key={i} style={{ height: '16px', borderRadius: '6px', background: 'linear-gradient(90deg, var(--cream) 25%, #f0e8d4 50%, var(--cream) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', marginBottom: '12px', width: ['55%','80%','40%','70%'][i-1] }} />
                                ))}
                            </div>
                        </div>
                    ) : selectedStudent && (
                        <div className="fees-grid" style={{ marginTop: '20px' }}>
                            {/* Dues Statement */}
                            <div className="card student-dir-card">
                                <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                        <Icons.Document size={16} style={{ marginRight: '6px' }} /> Dues Statement
                                    </span>
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setSelectedStudent(null)}>
                                        <Icons.Close size={12} style={{ marginRight: '4px' }} /> Clear
                                    </button>
                                </div>
                                <div style={{ fontSize: '13px', lineHeight: '1.9' }}>
                                    <p><strong>Student:</strong> {selectedStudent.name}</p>
                                    <p><strong>Class:</strong> {selectedStudent.class} &nbsp;|&nbsp; <strong>Roll:</strong> {selectedStudent.roll_number || '—'}</p>
                                    <p><strong>Session:</strong> {selectedStudent.session || '—'}</p>
                                    <hr style={{ border: '0', borderBottom: '1px solid var(--cream)', margin: '10px 0' }} />
                                    <p><strong>Annual Target:</strong> ₹{selectedStudent.totalDues}</p>
                                    <p style={{ color: 'var(--green)' }}><strong>Total Paid:</strong> ₹{selectedStudent.totalPaid}</p>
                                    <p style={{ color: selectedStudent.balance > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 'bold', fontSize: '15px' }}>
                                        <strong>Balance Due:</strong> ₹{selectedStudent.balance}
                                    </p>
                                </div>
                                {/* Payment history ledger */}
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Payment History</div>
                                    {selectedStudent.payments.length === 0 ? (
                                        <div style={{
                                            padding: '16px 14px',
                                            borderRadius: '8px',
                                            background: 'rgba(139,26,26,0.04)',
                                            border: '1px dashed rgba(139,26,26,0.2)',
                                            textAlign: 'center'
                                        }}>
                                            <Icons.Alert size={20} color="var(--red)" style={{ marginBottom: '6px', opacity: 0.7 }} />
                                            <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--red)', marginBottom: '4px' }}>
                                                Koi fee payment record nahi hai
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>
                                                {selectedStudent.name} ka abhi tak koi fee payment<br />
                                                registered nahi hua hai is session mein.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="table-scroll" style={{ display: 'block', maxHeight: '160px' }}>
                                            <table className="results-table" style={{ fontSize: '11px' }}>
                                                <thead>
                                                    <tr><th>Date</th><th>Receipt</th><th>Amount</th><th>Mode</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                                </thead>
                                                <tbody>
                                                    {selectedStudent.payments.map(p => (
                                                        <tr key={p.id}>
                                                            <td>{p.payment_date}</td>
                                                            <td>#{p.receipt_no}</td>
                                                            <td><strong>₹{p.amount_paid}</strong></td>
                                                            <td>{p.payment_mode}</td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <div style={{ display: 'inline-flex', gap: '5px' }}>
                                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadReceipt(p)} style={{ display: 'inline-flex', padding: '3px 7.5px' }}>
                                                                        <Icons.Download size={11} style={{ marginRight: '3px' }} /> PDF
                                                                    </button>
                                                                    {isHighAccess && (
                                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeletePayment(p)} style={{ display: 'inline-flex', padding: '3px 7.5px' }}>
                                                                            <Icons.Trash size={11} style={{ marginRight: '3px' }} /> Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Collect Payment Form */}
                            <div className="card student-dir-card">
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Icons.Fee size={16} style={{ marginRight: '6px' }} /> Collect Fee Payment
                                </div>
                                <form onSubmit={handleCollectPayment}>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label>Amount Received (INR)</label>
                                        <input type="number" placeholder="Ex: 1500" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} required />
                                        {selectedStudent.balance > 0 && (
                                            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Balance Due: ₹{selectedStudent.balance}</small>
                                        )}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label>Payment Mode</label>
                                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                                            <option value="CASH">CASH</option>
                                            <option value="ONLINE">ONLINE / BANK TRANSFER</option>
                                            <option value="CHEQUE">CHEQUE</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '18px' }}>
                                        <label>Remarks</label>
                                        <input type="text" placeholder="Ex: Quarter 1 Fees paid" value={remarks} onChange={e => setRemarks(e.target.value)} />
                                    </div>
                                    <button type="submit" className={`btn btn-primary ${formLoading ? 'btn-loading' : ''}`} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} disabled={formLoading}>
                                        {formLoading ? '' : <><Icons.Check size={14} style={{ marginRight: '6px' }} /> Record Payment &amp; Print Receipt</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Recent Payments Table with CSV Download */}
                    {!selectedStudent && (
                        <div className="card student-dir-card" style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                    <Icons.Document size={16} style={{ marginRight: '6px' }} /> Recent Fee Payments History
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={loadPayments}>
                                        <Icons.ArrowRight size={12} style={{ marginRight: '4px' }} /> Refresh
                                    </button>
                                    <button className="btn btn-success btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={handleDownloadCSV}>
                                        <Icons.Download size={12} style={{ marginRight: '4px' }} /> CSV Download
                                    </button>
                                </div>
                            </div>

                            {paymentsLoading ? (
                                <div className="table-scroll" style={{ display: 'block' }}>
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Class</th><th>Amount</th><th>Mode</th><th>Remarks</th><th>Action</th></tr></thead>
                                        <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}</tbody>
                                    </table>
                                </div>
                            ) : payments.length === 0 ? (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    borderRadius: '10px',
                                    border: '2px dashed rgba(200,169,110,0.3)',
                                    background: 'rgba(184,134,11,0.04)'
                                }}>
                                    <Icons.Document size={44} color="var(--gold)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '8px' }}>
                                        Abhi tak koi fee payment record nahi hai
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                                        Jab bhi koi student ki fee collect ki jaegi,<br />
                                        uski history yahaan automatically dikh jaegi.<br />
                                        <strong style={{ color: 'var(--gold)' }}>Upar se student dhundho aur "Fees Jodo" click karein.</strong>
                                    </p>
                                    <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={loadPayments}>
                                        <Icons.ArrowRight size={12} style={{ marginRight: '4px' }} /> Dobara Check Karein
                                    </button>
                                </div>
                            ) : (
                                <div className="results-table-wrap" style={{ display: 'block' }}>
                                    <div className="table-scroll" style={{ display: 'block', maxHeight: '380px' }}>
                                        <table className="results-table" style={{ width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th><th>Receipt No</th><th>Student Name</th><th>Class</th>
                                                    <th>Amount Paid</th><th>Mode</th><th>Remarks</th><th style={{ textAlign: 'right' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map(p => (
                                                    <tr key={p.id}>
                                                        <td style={{ fontWeight: '600' }}>{p.payment_date}</td>
                                                        <td>HN-F-{p.receipt_no || p.id.slice(0, 8).toUpperCase()}</td>
                                                        <td><strong>{p.students?.name || '—'}</strong></td>
                                                        <td>Class {p.students?.class || '—'}</td>
                                                        <td style={{ color: 'var(--green)', fontWeight: 'bold' }}>₹{p.amount_paid}</td>
                                                        <td><span className="badge" style={{ background: p.payment_mode === 'CASH' ? 'rgba(26,92,42,0.12)' : 'rgba(15,118,110,0.12)', color: p.payment_mode === 'CASH' ? 'var(--green)' : '#0f766e' }}>{p.payment_mode}</span></td>
                                                        <td>{p.remarks || '—'}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', gap: '5px' }}>
                                                                <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDownloadReceipt(p)}>
                                                                    <Icons.Download size={12} style={{ marginRight: '4px' }} /> PDF
                                                                </button>
                                                                {isHighAccess && (
                                                                    <button className="btn btn-danger btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleDeletePayment(p)}>
                                                                        <Icons.Trash size={12} style={{ marginRight: '4px' }} /> Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════ FEE STRUCTURE TAB ══════════════════ */}
            {tab === 'structure' && isHighAccess && (
                <div>
                    {editingConfig ? (
                        <div className="card student-dir-card">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                <Icons.Edit size={16} style={{ marginRight: '6px' }} /> Edit Fee Config: Class {editingConfig.class_name}
                            </div>
                            <form onSubmit={handleSaveConfig}>
                                <div className="form-grid">
                                    <div className="form-group"><label>Admission Dues (Annual)</label><input type="number" value={admFee} onChange={e => setAdmFee(e.target.value)} /></div>
                                    <div className="form-group"><label>Monthly Tuition Fee</label><input type="number" value={tuitionFee} onChange={e => setTuitionFee(e.target.value)} /></div>
                                    <div className="form-group"><label>Annual Exam Fee</label><input type="number" value={examFee} onChange={e => setExamFee(e.target.value)} /></div>
                                    <div className="form-group"><label>Other Charges</label><input type="number" value={otherFee} onChange={e => setOtherFee(e.target.value)} /></div>
                                </div>
                                <div className="btn-row">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingConfig(null)}>Cancel</button>
                                    <button type="submit" className={`btn btn-primary ${configLoading ? 'btn-loading' : ''}`} style={{ display: 'inline-flex', alignItems: 'center' }} disabled={configLoading}>
                                        {configLoading ? '' : <><Icons.Check size={14} style={{ marginRight: '6px' }} /> Update Config</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : addingConfig ? (
                        <div className="card student-dir-card">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                <Icons.Plus size={16} style={{ marginRight: '6px' }} /> Add Fee Config
                            </div>
                            {['Nursery','KG-I','KG-II','1st','2nd','3rd','4th','5th','6th','7th','8th'].filter(c => !feesStructure.some(f => f.class_name === c)).length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Sabhi classes configure ho gayi hain. Existing config edit karein.</p>
                                    <button className="btn btn-secondary" onClick={() => setAddingConfig(false)}>Go Back</button>
                                </div>
                            ) : (
                                <form onSubmit={handleAddConfig}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Class Name</label>
                                            <select value={newClassName} onChange={e => setNewClassName(e.target.value)}>
                                                {['Nursery','KG-I','KG-II','1st','2nd','3rd','4th','5th','6th','7th','8th'].filter(c => !feesStructure.some(f => f.class_name === c)).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group"><label>Admission Dues</label><input type="number" value={admFee} onChange={e => setAdmFee(e.target.value)} /></div>
                                        <div className="form-group"><label>Monthly Tuition</label><input type="number" value={tuitionFee} onChange={e => setTuitionFee(e.target.value)} /></div>
                                        <div className="form-group"><label>Annual Exam Fee</label><input type="number" value={examFee} onChange={e => setExamFee(e.target.value)} /></div>
                                        <div className="form-group"><label>Other Charges</label><input type="number" value={otherFee} onChange={e => setOtherFee(e.target.value)} /></div>
                                    </div>
                                    <div className="btn-row">
                                        <button type="button" className="btn btn-secondary" onClick={() => setAddingConfig(false)}>Cancel</button>
                                        <button type="submit" className={`btn btn-primary ${configLoading ? 'btn-loading' : ''}`} style={{ display: 'inline-flex', alignItems: 'center' }} disabled={configLoading}>
                                            {configLoading ? '' : <><Icons.Check size={14} style={{ marginRight: '6px' }} /> Save Config</>}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="card student-dir-card">
                            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <Icons.Settings size={16} style={{ marginRight: '6px' }} /> School Fee Configurations
                                </span>
                                <button className="btn btn-primary btn-sm" onClick={() => {
                                    const available = ['Nursery','KG-I','KG-II','1st','2nd','3rd','4th','5th','6th','7th','8th'].filter(c => !feesStructure.some(f => f.class_name === c));
                                    if (!available.length) { showToast('All classes configured!', 'info'); return; }
                                    setAddingConfig(true); setNewClassName(available[0]);
                                    setAdmFee(0); setTuitionFee(0); setExamFee(0); setOtherFee(0);
                                }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Plus size={12} /> Add Config
                                </button>
                            </div>
                            {structureLoading ? (
                                <div className="table-scroll" style={{ display: 'block' }}>
                                    <table className="results-table">
                                        <thead><tr><th>Class</th><th>Admission</th><th>Tuition/mo</th><th>Exam</th><th>Other</th><th>Annual Total</th><th>Action</th></tr></thead>
                                        <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="results-table-wrap" style={{ display: 'block' }}>
                                    <div className="table-scroll" style={{ display: 'block' }}>
                                        <table className="results-table">
                                            <thead>
                                                <tr>
                                                    <th>Class</th><th>Admission</th><th>Tuition/mo</th><th>Exam</th><th>Other</th><th>Annual Total</th><th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {feesStructure.map(f => {
                                                    const annual = (Number(f.admission_fee)||0) + (Number(f.tuition_fee_monthly)||0)*12 + (Number(f.exam_fee_annual)||0) + (Number(f.other_charges)||0);
                                                    return (
                                                        <tr key={f.id}>
                                                            <td><strong>Class {f.class_name}</strong></td>
                                                            <td>₹{f.admission_fee}</td>
                                                            <td>₹{f.tuition_fee_monthly} <small style={{ color: 'var(--muted)' }}>(₹{f.tuition_fee_monthly*12}/yr)</small></td>
                                                            <td>₹{f.exam_fee_annual}</td>
                                                            <td>₹{f.other_charges}</td>
                                                            <td><strong>₹{annual}</strong></td>
                                                            <td>
                                                                <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => handleEditConfig(f)}>
                                                                    <Icons.Edit size={12} style={{ marginRight: '4px' }} /> Edit
                                                                </button>
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
                </div>
            )}
        </div>
    );
}
