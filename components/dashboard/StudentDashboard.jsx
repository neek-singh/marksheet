'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Noticeboard from '../notices/Noticeboard';
import { getGradeBadge, getGrade, fmtDate } from '../../lib/marksUtils';
import Icons from '../ui/Icons';

// Centralized strings dictionary for JSX internationalization
const strings = {
    profileLinkageFailed: 'Student profile linkage checking failed. Please contact school admin to register your admission record.',
    overallGrade: 'Overall Grade: ',
    evaluationsComplete: 'Evaluations complete for the current term',
    presentLabel: 'Present: ',
    payOnline: 'Pay Online',
    schoolName: 'SHRI HANS VIDYA NIKETAN SCHOOL',
    classLabel: 'Class: ',
    rollNoLabel: 'Roll No: ',
    admNoLabel: 'Adm No: ',
    sessionLabel: 'Session: ',
    studentPassport: 'STUDENT PASSPORT',
    emergencyInfo: 'Emergency Information',
    fatherLabel: 'Father: ',
    emergencyContactLabel: 'Emergency Contact: ',
    bloodGroupLabel: 'Blood Group: ',
    allergiesLabel: 'Allergies: ',
    digitalSmartCard: 'Digital Smart ID Card',
    studentAadhaarNumber: 'Student Aadhaar Number',
    gender: 'Gender',
    instructionMedium: 'Instruction Medium',
    casteCategory: 'Caste Category',
    mothersName: "Mother's Name",
    guardianMobile: 'Guardian Mobile',
    guardianEmail: 'Guardian Email',
    residentialAddress: 'Residential Address',
    previousSchoolPassed: 'Previous School Passed',
    date: 'Date',
    status: 'Status',
    remarks: 'Remarks',
    noAttendanceRecords: 'No attendance records published.',
    fromDateLabel: 'From Date *',
    toDateLabel: 'To Date *',
    reasonForLeaveLabel: 'Reason for Leave *',
    resultsNotCompiled: 'Results not compiled yet.',
    aggregateAcademicScore: 'Aggregate Academic Score',
    overallClassGrade: 'Overall Class Grade: ',
    subjectName: 'Subject Name',
    halfYearlyObtained: 'Half-Yearly Obtained',
    annualObtained: 'Annual Obtained',
    totalCombined: 'Total Combined',
    subjectGrade: 'Subject Grade',
    noAcademicResults: 'No academic results declared.',
    subjectLabel: 'Subject: ',
    annualFeeTarget: 'Annual Fee Target:',
    totalDuesSettled: 'Total Dues Settled:',
    remainingBalance: 'Remaining balance:',
    processSecureCard: 'Process secure card/UPI transactions to instantly clear outstanding dues',
    datePassed: 'Date Passed',
    subCategory: 'Sub-Category',
    method: 'Method',
    paidAmount: 'Paid Amount',
    action: 'Action',
    noPaymentsRecord: 'No payments recorded.',
    certificatesHelpText: 'Students and parents can download verified digital study certificates below. For custom character or transfer certificate validations, contact registrar.',
    outstandingFeeType: 'Outstanding Fee Type',
    tuitionFee: 'Tuition Fee',
    admissionFee: 'Admission Fee',
    examFee: 'Exam Fee',
    fineLateCharge: 'Fine / Late Charge',
    amountToPay: 'Amount to pay (₹) *',
    securedSslText: 'Secured via 256-bit SSL school processing net. UPI/Debit/Credit card accepted.',
    cancel: 'Cancel'
};

export default function StudentDashboard({
    personalStudent,
    currentUser,
    onDownloadPDF
}) {
    // Active Tab in Student Portal
    const [activePortalTab, setActivePortalTab] = useState('overview');

    // Stats
    const [attendanceStats, setAttendanceStats] = useState({
        percent: 0,
        present: 0,
        absent: 0,
        leave: 0,
        loading: true,
        records: []
    });

    const [feeStats, setFeeStats] = useState({
        totalDues: 0,
        totalPaid: 0,
        balance: 0,
        loading: true,
        payments: []
    });

    // ID Flip State
    const [flipIdCard, setFlipIdCard] = useState(false);

    // Leave request simulator state
    const [leaveFrom, setLeaveFrom] = useState('');
    const [leaveTo, setLeaveTo] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveSubmitted, setLeaveSubmitted] = useState(false);

    // Secure Payment Modal/Simulation
    const [showPayModal, setShowPayModal] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payType, setPayType] = useState('Tuition Fee');
    const [paying, setPaying] = useState(false);

    const role = currentUser?.role?.toLowerCase() || 'student';

    useEffect(() => {
        if (personalStudent) {
            loadAttendanceData();
            loadFeeData();
        }
    }, [personalStudent]);

    const loadAttendanceData = async () => {
        try {
            const { data: records, error } = await db
                .from('attendance')
                .select('*')
                .eq('student_id', personalStudent.id)
                .order('date', { ascending: false });

            if (error) throw error;

            let present = 0, absent = 0, leave = 0;
            records?.forEach(r => {
                if (r.status === 'PRESENT') present++;
                else if (r.status === 'ABSENT') absent++;
                else if (r.status === 'LEAVE') leave++;
            });

            const total = records?.length || 0;
            const percent = total > 0 ? Math.round((present / total) * 100) : 100;

            setAttendanceStats({
                percent,
                present,
                absent,
                leave,
                records: records || [],
                loading: false
            });
        } catch (e) {
            console.error('Error loading attendance stats:', e);
            setAttendanceStats(prev => ({ ...prev, loading: false }));
        }
    };

    const loadFeeData = async () => {
        try {
            // 1. Fetch fees structure config
            const { data: structure } = await db
                .from('fees_structure')
                .select('*')
                .eq('class_name', personalStudent.class)
                .single();

            let totalDues = 1000; // default backup
            if (structure) {
                const tuitionTotal = (structure.tuition_fee_monthly || 0) * 12;
                totalDues = (structure.admission_fee || 0) + tuitionTotal + (structure.exam_fee_annual || 0) + (structure.other_charges || 0);
            }

            // 2. Fetch payments
            const { data: payments, error: payErr } = await db
                .from('fees_payments')
                .select('*')
                .eq('student_id', personalStudent.id)
                .order('payment_date', { ascending: false });

            if (payErr) throw payErr;

            const totalPaid = payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

            setFeeStats({
                totalDues,
                totalPaid,
                balance: totalDues - totalPaid,
                payments: payments || [],
                loading: false
            });
        } catch (e) {
            console.error('Error loading fee stats:', e);
            setFeeStats(prev => ({ ...prev, loading: false }));
        }
    };

    // Submitting Fee Payment
    const handlePayDues = async (e) => {
        e.preventDefault();
        if (!payAmount || Number(payAmount) <= 0) return;

        setPaying(true);
        try {
            const payload = {
                student_id: personalStudent.id,
                amount_paid: Number(payAmount),
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'UPI / Online',
                fee_type: payType
            };

            const { error } = await db.from('fees_payments').insert([payload]);
            if (error) throw error;

            // Log activity to timeline
            const currentExt = personalStudent.extended_info || {};
            const timeline = currentExt.timeline || [];
            timeline.push({
                action: 'Fee Paid',
                date: new Date().toISOString().split('T')[0],
                details: `Online Fee Payment of ₹${payAmount} processed for: ${payType}`
            });

            await db
                .from('students')
                .update({ extended_info: { ...currentExt, timeline } })
                .eq('id', personalStudent.id);

            alert(`💳 Receipt Generated! Successfully Paid ₹${payAmount} online.`);
            setShowPayModal(false);
            setPayAmount('');
            loadFeeData();
        } catch (e) {
            alert('Online Payment Failed: ' + e.message);
        } finally {
            setPaying(false);
        }
    };

    if (!personalStudent) {
        return (
            <div className="card">
                <div className="empty-state">
                    <div className="icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <Icons.Search size={48} color="var(--muted)" />
                    </div>
                    <p>{strings.profileLinkageFailed}</p>
                </div>
            </div>
        );
    }

    const s = personalStudent;
    const ext = s.extended_info || {};
    const marks = s.marks || [];
    const attendancePct = attendanceStats.percent;

    // Dynamic House Banner Colors - Safe lookup avoiding bracket notation warning
    const getHouseStyle = (house) => {
        switch (house) {
            case 'BLUE':
                return { bg: '#104e8b', border: '#1e90ff', text: '#fff' };
            case 'GREEN':
                return { bg: '#1a5c2e', border: '#2e8b57', text: '#fff' };
            case 'YELLOW':
                return { bg: '#b8860b', border: '#ffd700', text: '#fff' };
            case 'RED':
            default:
                return { bg: '#8b1a1a', border: '#b22222', text: '#fff' };
        }
    };
    const currentHouseStyle = getHouseStyle(s.house);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Welcome banner */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${currentHouseStyle.bg} 0%, rgba(20,20,20,0.85) 100%)`,
                    padding: '25px',
                    color: '#fff',
                    borderRadius: '12px',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    borderLeft: `5px solid ${currentHouseStyle.border}`
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            नमस्ते, {currentUser.full_name}!
                        </h2>
                        <p style={{ margin: '0', fontSize: '14px', opacity: 0.85 }}>
                            {role === 'parent' ? "Welcome to your child's student portal." : "Welcome to your Hans Vidya Niketan student portal."}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <Icons.School size={12} /> CLASS {s.class} - {s.section || 'A'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <Icons.Pin size={12} /> {s.house || 'RED'} HOUSE
                        </span>
                    </div>
                </div>
            </div>

            {/* Portal Navigation Tabs */}
            <div
                style={{
                    display: 'flex',
                    background: 'var(--card-bg, #fff)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    border: '1px solid var(--border)'
                }}
            >
                {[
                    { id: 'overview', label: 'Dashboard Overview', icon: <Icons.Dashboard size={14} /> },
                    { id: 'profile', label: 'Profile & Digital ID', icon: <Icons.User size={14} /> },
                    { id: 'attendance', label: 'Attendance logs', icon: <Icons.Calendar size={14} /> },
                    { id: 'academics', label: 'Results & Analytics', icon: <Icons.TrendUp size={14} /> },
                    { id: 'homework', label: 'Homework & Study Locker', icon: <Icons.Book size={14} /> },
                    { id: 'fees', label: 'Dues & Online Payment', icon: <Icons.Fee size={14} /> },
                    { id: 'certificates', label: 'Study Certificates', icon: <Icons.Clipboard size={14} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            background: activePortalTab === t.id ? 'var(--cream)' : 'transparent',
                            borderBottom: activePortalTab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
                            color: activePortalTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activePortalTab === t.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onClick={() => setActivePortalTab(t.id)}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="card" style={{ marginTop: '0' }}>
                
                {/* TAB 1: OVERVIEW */}
                {activePortalTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {/* Highlights Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {/* Academic Performance */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Book size={16} /> Academic Placement
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--gold)' }}>
                                        {s.percentage !== null && s.percentage !== undefined ? `${s.percentage}%` : '—'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {strings.overallGrade}<span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{s.grade || 'Pending'}</span>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{strings.evaluationsComplete}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Circle */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                                    <svg width="60" height="60" viewBox="0 0 60 60">
                                        <circle cx="30" cy="30" r="26" fill="transparent" stroke="#eee" strokeWidth="4" />
                                        <circle
                                            cx="30"
                                            cy="30"
                                            r="26"
                                            fill="transparent"
                                            stroke={attendancePct >= 75 ? 'var(--green)' : 'var(--red)'}
                                            strokeWidth="4"
                                            strokeDasharray={163}
                                            strokeDashoffset={163 - (163 * attendancePct) / 100}
                                            transform="rotate(-90 30 30)"
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--gold)' }}>
                                        {attendancePct}%
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Icons.Calendar size={14} /> Attendance Registry
                                    </strong>
                                    <div>{strings.presentLabel}{attendanceStats.present} Days | Absent: {attendanceStats.absent}</div>
                                </div>
                            </div>

                            {/* Outstanding Fees */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '10px' }}>{strings.remainingBalance}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: feeStats.balance > 0 ? 'var(--red)' : 'var(--green)' }}>
                                        ₹{feeStats.balance}
                                    </span>
                                    <button className="btn btn-primary btn-sm" onClick={() => setActivePortalTab('fees')}>{strings.payOnline}</button>
                                </div>
                            </div>
                        </div>

                        {/* Noticeboard Announcements */}
                        <Noticeboard currentUser={currentUser} showToast={() => {}} />
                    </div>
                )}

                {/* TAB 2: PROFILE & ID CARD */}
                {activePortalTab === 'profile' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.User size={18} />
                            <span>Student Biography & Digital Identity Card</span>
                        </div>
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            
                            {/* Double Sided flips ID Card */}
                            <div 
                                style={{ width: '300px', height: '188px', perspective: '1000px' }}
                                onClick={() => setFlipIdCard(!flipIdCard)}
                                title="Click card to flip side"
                            >
                                <div 
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        transition: 'transform 0.6s',
                                        transformStyle: 'preserve-3d',
                                        transform: flipIdCard ? 'rotateY(180deg)' : 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Front Side */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            border: `4px solid ${currentHouseStyle.bg}`,
                                            borderRadius: '12px',
                                            background: '#fff',
                                            padding: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                                            <strong style={{ fontSize: '11px', color: 'var(--primary)' }}>{strings.schoolName}</strong>
                                            <span style={{ fontSize: '8px', fontWeight: 'bold', color: currentHouseStyle.bg }}>{s.house} HOUSE</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left', margin: '8px 0' }}>
                                            <div style={{ width: '55px', height: '55px', border: '1px solid #ccc', borderRadius: '4px', background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icons.User size={28} color="var(--primary)" />
                                            </div>
                                            <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111' }}>{s.name}</div>
                                                <div>{strings.classLabel}<strong>{s.class} - {s.section || 'A'}</strong></div>
                                                <div>{strings.rollNoLabel}<strong>{s.roll_number || '—'}</strong></div>
                                                <div>{strings.admNoLabel}<strong>{s.admission_no}</strong></div>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid #eee', paddingTop: '4px', fontSize: '8px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{strings.sessionLabel}{s.session}</span>
                                            <span style={{ fontWeight: 'bold', color: currentHouseStyle.bg }}>{strings.studentPassport}</span>
                                        </div>
                                    </div>

                                    {/* Back Side */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)',
                                            border: `4px solid ${currentHouseStyle.bg}`,
                                            borderRadius: '12px',
                                            background: '#1a1a1a',
                                            color: '#fff',
                                            padding: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px', fontSize: '10px', textAlign: 'left' }}>
                                            <strong>{strings.emergencyInfo}</strong>
                                        </div>
                                        <div style={{ fontSize: '9px', textAlign: 'left', lineHeight: '1.4', margin: '5px 0' }}>
                                            <div>{strings.fatherLabel}<strong>{s.father_name || '—'}</strong></div>
                                            <div>{strings.emergencyContactLabel}<strong>{ext.mobile || '—'}</strong></div>
                                            <div>{strings.bloodGroupLabel}<strong>{ext.blood_group || 'A+'}</strong></div>
                                            <div>{strings.allergiesLabel}{ext.medical_info?.allergies || 'None'}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                                            <span style={{ fontSize: '8px', color: '#999' }}>{strings.digitalSmartCard}</span>
                                            
                                            {/* Simulated Barcode */}
                                            <div style={{ background: '#fff', padding: '1px', borderRadius: '1px' }}>
                                                <svg width="20" height="20" viewBox="0 0 20 20">
                                                    <rect x="0" y="0" width="5" height="5" fill="#000" />
                                                    <rect x="15" y="0" width="5" height="5" fill="#000" />
                                                    <rect x="0" y="15" width="5" height="5" fill="#000" />
                                                    <rect x="7" y="7" width="5" height="5" fill="#000" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Information Grid */}
                            <div style={{ flex: '1', minWidth: '300px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '13px' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.studentAadhaarNumber}</span>
                                        <strong>{ext.aadhaar || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>APAR ID</span>
                                        <strong>{ext.apar_id || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.gender}</span>
                                        <strong>{ext.gender || 'MALE'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.instructionMedium}</span>
                                        <strong>{s.medium || 'HINDI'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.casteCategory}</span>
                                        <strong>{s.category || 'GENERAL'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.mothersName}</span>
                                        <strong>{s.mother_name || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.guardianMobile}</span>
                                        <strong>{ext.mobile || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.guardianEmail}</span>
                                        <strong>{ext.email || 'N/A'}</strong>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.residentialAddress}</span>
                                        <strong>{s.address || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{strings.previousSchoolPassed}</span>
                                        <strong>{ext.previous_school || 'None'}</strong>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <button className="btn btn-secondary" onClick={() => window.print()}>Print Digital Identity Card</button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* TAB 3: ATTENDANCE */}
                {activePortalTab === 'attendance' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Calendar size={18} />
                            <span>Detailed Daily Attendance Records & Leaves</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                            
                            {/* Logs List */}
                            <div>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '10px' }}>
                                    <Icons.Clipboard size={14} /> Attendance Logs
                                </strong>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>{strings.date}</th>
                                                <th>{strings.status}</th>
                                                <th>{strings.remarks}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceStats.records.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>
                                                        {strings.noAttendanceRecords}
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceStats.records.map(r => (
                                                    <tr key={r.id}>
                                                        <td><strong>{fmtDate(r.date)}</strong></td>
                                                        <td>
                                                            <span style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                background: r.status === 'PRESENT' ? '#e2f0d9' : r.status === 'ABSENT' ? '#fce4d6' : '#fff2cc',
                                                                color: r.status === 'PRESENT' ? 'var(--green)' : r.status === 'ABSENT' ? 'var(--red)' : 'var(--gold)'
                                                            }}>
                                                                {r.status}
                                                            </span>
                                                        </td>
                                                        <td>{r.remarks || 'Regular Day'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Submit Leave request */}
                            <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '15px', color: 'var(--primary)' }}>
                                    <Icons.Clock size={14} /> Submit Leave Application Form
                                </strong>
                                {leaveSubmitted ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2f0d9', border: '1px solid #a9d18e', color: 'var(--green)', padding: '12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>
                                        <Icons.Check size={16} /> Leave Application submitted successfully to School Registrar office for approval tracking.
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); setLeaveSubmitted(true); }}>
                                        <div className="form-group">
                                            <label>{strings.fromDateLabel}</label>
                                            <input type="date" required value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.toDateLabel}</label>
                                            <input type="date" required value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.reasonForLeaveLabel}</label>
                                            <textarea rows="3" required placeholder="Write description (e.g. sick leave passing report)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>Dispatch Leave Application</button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 4: ACADEMICS & ANALYTICS */}
                {activePortalTab === 'academics' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Book size={18} />
                            <span>Academic Performance Marks & Performance Analytics</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>
                            {/* Visual analytics chart */}
                            <div style={{ background: '#fafafa', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>
                                    <Icons.TrendUp size={14} /> Marks Progression Analysis
                                </strong>
                                {marks.length === 0 ? (
                                    <div style={{ fontStyle: 'italic', color: 'var(--muted)' }}>{strings.resultsNotCompiled}</div>
                                ) : (
                                    <svg width="100%" height="150" style={{ maxWidth: '400px' }}>
                                        <line x1="40" y1="10" x2="350" y2="10" stroke="#eee" />
                                        <line x1="40" y1="60" x2="350" y2="60" stroke="#eee" strokeDasharray="4" />
                                        <line x1="40" y1="110" x2="350" y2="110" stroke="#ccc" strokeWidth="2" />
                                        <text x="10" y="15" fontSize="9" fill="#999">100%</text>
                                        <text x="15" y="65" fontSize="9" fill="#999">50%</text>

                                        {marks.map((m, idx) => {
                                            const totalObtd = (Number(m.hy_obtained) || 0) + (Number(m.an_obtained) || 0);
                                            const totalMax = (Number(m.hy_total) || 100) + (Number(m.an_total) || 100);
                                            const pct = totalMax > 0 ? (totalObtd / totalMax) * 100 : 0;

                                            const width = 25;
                                            const gap = (310 - (marks.length * width)) / (marks.length + 1);
                                            const x = 40 + gap + idx * (width + gap);

                                            const height = (pct / 100) * 100;
                                            const y = 110 - height;

                                            return (
                                                <g key={m.subject}>
                                                    <rect x={x} y={y} width={width} height={height} rx="2" fill="var(--primary)" opacity="0.8" />
                                                    <text x={x + width/2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--gold)">{pct.toFixed(0)}%</text>
                                                    <text x={x + width/2} y="125" textAnchor="middle" fontSize="9" fill="#666">{m.subject.substring(0, 4)}</text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                )}
                            </div>

                            {/* Summary card */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ border: '1px solid rgba(184,134,11,0.2)', background: 'var(--cream)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.aggregateAcademicScore}</div>
                                    <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'monospace' }}>
                                        {s.percentage !== null && s.percentage !== undefined ? `${s.percentage}%` : '—'}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '5px' }}>{strings.overallClassGrade}{getGradeBadge(s.grade || '—')}</div>
                                </div>
                                {s.percentage !== null && (
                                    <button className="btn btn-primary" onClick={() => onDownloadPDF(s.id)} style={{ width: '100%', marginTop: '15px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Icons.Document size={16} /> Download Term Report Card (PDF)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Marks table */}
                        <div className="table-scroll">
                            <table className="results-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>{strings.subjectName}</th>
                                        <th>{strings.halfYearlyObtained}</th>
                                        <th>{strings.annualObtained}</th>
                                        <th>{strings.totalCombined}</th>
                                        <th>{strings.subjectGrade}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marks.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.noAcademicResults}</td>
                                        </tr>
                                    ) : (
                                        marks.map(m => {
                                            const totalObtd = (Number(m.hy_obtained) || 0) + (Number(m.an_obtained) || 0);
                                            const totalMax = (Number(m.hy_total) || 100) + (Number(m.an_total) || 100);
                                            const pct = totalMax > 0 ? ((totalObtd / totalMax) * 100).toFixed(1) : '0.0';

                                            return (
                                                <tr key={m.subject}>
                                                    <td style={{ fontWeight: 'bold' }}>{m.subject}</td>
                                                    <td>{m.hy_obtained} / {m.hy_total || 100}</td>
                                                    <td>{m.an_obtained} / {m.an_total || 100}</td>
                                                    <td><strong>{totalObtd} / {totalMax}</strong> ({pct}%)</td>
                                                    <td>{getGradeBadge(getGrade(pct))}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}

                {/* TAB 5: HOMEWORK & STUDY locker */}
                {activePortalTab === 'homework' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Book size={18} />
                            <span>Homework Assignments & Digital Study Materials</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {/* Homework */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: 'var(--primary)' }}>
                                    <Icons.Clipboard size={14} /> Assigned Homework
                                </strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { title: 'Mathematics homework: Algebra formulas passed', date: 'Due: 2026-06-05', file: 'math_hw_algebra.pdf' },
                                        { title: 'Science assignment: Plant cells structure', date: 'Due: 2026-06-08', file: 'science_cell_biology.pdf' },
                                        { title: 'Social science: Indian Independence timeline passing', date: 'Due: 2026-06-10', file: 'sst_history_indian.pdf' }
                                    ].map((hw, idx) => (
                                        <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                                            <strong>{hw.title}</strong>
                                            <div style={{ color: 'var(--red)', margin: '3px 0' }}>{hw.date}</div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading homework file: ${hw.file}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}>
                                                <Icons.Download size={10} /> Download Sheet
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Study Material */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: 'var(--primary)' }}>
                                    <Icons.Book size={14} /> Study Materials & Notes
                                </strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { title: 'English Grammar Workbook: Active & Passive Voice', subject: 'English', file: 'english_grammar_voice.pdf' },
                                        { title: 'Hindi Chapter 4 Kavita (Madhuban)', subject: 'Hindi', file: 'hindi_chapter_4.pdf' },
                                        { title: 'Computer Science: Basics of JavaScript loops', subject: 'Computers', file: 'comp_js_loops.pdf' }
                                    ].map((mat, idx) => (
                                        <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                                            <strong>{mat.title}</strong>
                                            <div style={{ color: 'var(--green)', margin: '3px 0' }}>{strings.subjectLabel}{mat.subject}</div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading note: ${mat.file}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}>
                                                <Icons.Download size={10} /> Download notes
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 6: FEES ACCOUNT */}
                {activePortalTab === 'fees' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Fee size={18} />
                            <span>Fee Account Statement & Receipt Downloads</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ border: '1px solid var(--border)', padding: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
                                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{strings.annualFeeTarget}</div>
                                <strong style={{ fontSize: '20px' }}>₹{feeStats.totalDues}</strong>
                            </div>
                            <div style={{ border: '1px solid #a9d18e', padding: '15px', borderRadius: '8px', background: 'rgba(26,92,42,0.02)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--green)' }}>{strings.totalDuesSettled}</div>
                                <strong style={{ fontSize: '20px', color: 'var(--green)' }}>₹{feeStats.totalPaid}</strong>
                            </div>
                            <div style={{ border: feeStats.balance > 0 ? '1px solid #f4b183' : '1px solid #a9d18e', padding: '15px', borderRadius: '8px', background: feeStats.balance > 0 ? 'rgba(139,26,26,0.02)' : 'rgba(26,92,42,0.02)' }}>
                                <div style={{ fontSize: '11px', color: feeStats.balance > 0 ? 'var(--red)' : 'var(--green)' }}>{strings.remainingBalance}</div>
                                <strong style={{ fontSize: '20px', color: feeStats.balance > 0 ? 'var(--red)' : 'var(--green)' }}>₹{feeStats.balance}</strong>
                            </div>
                        </div>

                        {/* Pay online dues button */}
                        {feeStats.balance > 0 && (
                            <div style={{ background: 'rgba(184,134,11,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(184,134,11,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--primary)' }}>
                                        <Icons.Card size={16} /> Instant Online Fee Payment Gateway
                                    </strong>
                                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{strings.processSecureCard}</span>
                                </div>
                                <button className="btn btn-primary" onClick={() => { setPayAmount(`${feeStats.balance}`); setShowPayModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Card size={14} /> Settle Outstanding Dues
                                </button>
                            </div>
                        )}

                        {/* Transaction history */}
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '10px' }}>
                            <Icons.Clipboard size={14} /> Payment Transaction Receipts
                        </strong>
                        <div className="table-scroll">
                            <table className="results-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>{strings.datePassed}</th>
                                        <th>{strings.subCategory}</th>
                                        <th>{strings.method}</th>
                                        <th>{strings.paidAmount}</th>
                                        <th>{strings.action}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStats.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.noPaymentsRecord}</td>
                                        </tr>
                                    ) : (
                                        feeStats.payments.map(pay => (
                                            <tr key={pay.id}>
                                                <td><strong>{fmtDate(pay.payment_date)}</strong></td>
                                                <td>{pay.fee_type || 'Tuition Fee'}</td>
                                                <td>{pay.payment_method || 'Cash'}</td>
                                                <td><strong style={{ color: 'var(--green)' }}>₹{pay.amount_paid}</strong></td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading payment receipt for date: ${pay.payment_date}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
                                                        <Icons.Download size={12} /> Receipt
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                )}

                {/* TAB 7: CERTIFICATES */}
                {activePortalTab === 'certificates' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Clipboard size={18} />
                            <span>Digital Certificates Vault & Verification</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                            {strings.certificatesHelpText}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '15px' }}>
                            {[
                                { title: 'Verified Study Certificate', type: 'Active Enrollment Proof', file: 'study_enrollment_cert.pdf' },
                                { title: 'Half-Yearly Marksheet Certificate', type: 'Progress Report Card', file: 'half_yearly_marksheet.pdf' },
                                { title: 'Character Certificate', type: 'Conduct Verification Cert', file: 'conduct_character_cert.pdf' }
                            ].map((mat, idx) => (
                                <div key={idx} style={{ background: '#fcfcfc', border: '1px solid var(--border)', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '120px' }}>
                                    <div>
                                        <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>{mat.title}</strong>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{mat.type}</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading verified certificate: ${mat.file}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', fontSize: '11px', marginTop: '10px' }}>
                                        <Icons.Download size={12} /> Download Certificate
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* ONLINE SECURE PAYMENT MODAL */}
            {showPayModal && (
                <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '9999' }}>
                    <div className="card" style={{ width: '400px', margin: '20px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid transparent', borderBottomColor: '#eee', paddingBottom: '10px', margin: '0' }}>
                            <Icons.Card size={18} color="var(--primary)" />
                            <span>Secure Online Payment Gateway</span>
                        </div>
                        <form onSubmit={handlePayDues} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="form-group">
                                <label>{strings.outstandingFeeType}</label>
                                <select value={payType} onChange={(e) => setPayType(e.target.value)}>
                                    <option value="Tuition Fee">{strings.tuitionFee}</option>
                                    <option value="Admission Fee">{strings.admissionFee}</option>
                                    <option value="Exam Fee">{strings.examFee}</option>
                                    <option value="Fine / Late Charge">{strings.fineLateCharge}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{strings.amountToPay}</label>
                                <input type="number" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} max={feeStats.balance} />
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', padding: '5px 0' }}>
                                {strings.securedSslText}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)} style={{ flex: '1' }}>{strings.cancel}</button>
                                <button type="submit" className={`btn btn-primary ${paying ? 'btn-loading' : ''}`} disabled={paying} style={{ flex: '1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    {paying ? '' : (
                                        <>
                                            <Icons.Card size={14} />
                                            <span>Confirm Pay</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
