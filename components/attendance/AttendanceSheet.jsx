'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';

// ─── Shimmer CSS ───────────────────────────────────────────────────────────────
const SHIMMER_CSS = `
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes att-fade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
`;

const SK = { background: 'linear-gradient(90deg,var(--cream) 25%,#f0e8d4 50%,var(--cream) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', borderRadius: '6px' };

const Sk = ({ w = '80%', h = '13px', style = {} }) => <div style={{ width: w, height: h, ...SK, ...style }} />;

const SkStatCard = () => (
  <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, ...SK }} />
    <div style={{ flex: 1 }}><Sk w="50px" h="26px" style={{ marginBottom: '8px' }} /><Sk w="90px" h="10px" /></div>
  </div>
);

const SkRegisterRow = () => (
  <tr>
    <td><Sk w="40px" /></td>
    <td><Sk w="120px" /></td>
    <td><div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}><Sk w="70px" h="28px" /><Sk w="70px" h="28px" /><Sk w="60px" h="28px" /></div></td>
  </tr>
);

const SkGridRow = ({ days }) => (
  <tr>
    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 9 }}><Sk w="110px" h="13px" style={{ marginBottom: '4px' }} /><Sk w="60px" h="10px" /></td>
    {days.map(d => <td key={d} style={{ padding: '4px', border: '1px solid var(--border)', textAlign: 'center' }}><Sk w="18px" h="18px" style={{ borderRadius: '50%', margin: '0 auto' }} /></td>)}
    <td><Sk w="22px" /></td><td><Sk w="22px" /></td><td><Sk w="22px" /></td><td><Sk w="30px" /></td>
  </tr>
);

const SkAnalyticsRow = () => (
  <tr>
    <td><Sk w="40px" /></td>
    <td><Sk w="110px" /></td>
    <td style={{ textAlign: 'center' }}><Sk w="30px" style={{ margin: '0 auto' }} /></td>
    <td style={{ textAlign: 'center' }}><Sk w="30px" style={{ margin: '0 auto' }} /></td>
    <td style={{ textAlign: 'center' }}><Sk w="30px" style={{ margin: '0 auto' }} /></td>
    <td style={{ textAlign: 'center' }}><Sk w="30px" style={{ margin: '0 auto' }} /></td>
    <td style={{ textAlign: 'center' }}><Sk w="55px" h="24px" style={{ borderRadius: '12px', margin: '0 auto' }} /></td>
  </tr>
);

const SkPersonalRow = () => (
  <tr>
    <td><Sk w="90px" /></td>
    <td><Sk w="70px" /></td>
    <td style={{ textAlign: 'center' }}><Sk w="80px" h="24px" style={{ borderRadius: '12px', margin: '0 auto' }} /></td>
  </tr>
);

export default function AttendanceSheet({ currentUser, showToast }) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isStudentOrParent = role === 'student' || role === 'parent';

    // Global selected filters for Admins/Teachers
    const [selectedClass, setSelectedClass] = useState('1st');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('take-attendance'); // 'take-attendance', 'monthly-grid', 'analytics'
    
    // Monthly Grid parameters
    const today = new Date();
    const [gridMonth, setGridMonth] = useState(today.getMonth() + 1); // 1-12
    const [gridYear, setGridYear] = useState(today.getFullYear());
    const [gridData, setGridData] = useState({}); // { student_id: { day: status } }
    const [gridLoading, setGridLoading] = useState(false);

    // Roster and daily register states
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({}); // { student_id: status }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Summary stats for current class & date selection
    const [classStats, setClassStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        leave: 0,
        percent: 0
    });

    // Analytics data
    const [studentRates, setStudentRates] = useState([]); // Array of { id, name, roll_number, present, absent, leave, percent }
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Student / Parent specific states
    const [personalHistory, setPersonalHistory] = useState([]);
    const [personalStats, setPersonalStats] = useState({ total: 0, present: 0, absent: 0, leave: 0, percent: 100 });
    const [personalLoading, setPersonalLoading] = useState(false);

    const classesList = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const monthsList = [
        { val: 1, name: 'January (जनवरी)' },
        { val: 2, name: 'February (फरवरी)' },
        { val: 3, name: 'March (मार्च)' },
        { val: 4, name: 'April (अप्रैल)' },
        { val: 5, name: 'May (मई)' },
        { val: 6, name: 'June (जून)' },
        { val: 7, name: 'July (जुलाई)' },
        { val: 8, name: 'August (अगस्त)' },
        { val: 9, name: 'September (सितंबर)' },
        { val: 10, name: 'October (अक्टूबर)' },
        { val: 11, name: 'November (नवंबर)' },
        { val: 12, name: 'December (दिसंबर)' }
    ];

    // Trigger loads based on active tabs and filter changes
    useEffect(() => {
        if (isStudentOrParent) {
            loadPersonalAttendance();
        } else {
            if (activeTab === 'take-attendance') {
                loadAttendanceRegister();
            } else if (activeTab === 'monthly-grid') {
                loadMonthlyGrid();
            } else if (activeTab === 'analytics') {
                loadClassAnalytics();
            }
        }
    }, [selectedClass, selectedDate, gridMonth, gridYear, activeTab, currentUser]);

    // Recalculate daily stats when marking changes
    useEffect(() => {
        if (!isStudentOrParent && activeTab === 'take-attendance') {
            calculateRegisterStats();
        }
    }, [attendanceMap, students]);

    // --- FETCH DATA FOR TEACHERS/ADMINS ---
    
    // Load daily register roster
    const loadAttendanceRegister = async () => {
        setLoading(true);
        try {
            const { data: studentList, error: sErr } = await db
                .from('students')
                .select('id, name, roll_number')
                .eq('class', selectedClass)
                .order('name');
            if (sErr) throw sErr;

            const studentIds = (studentList || []).map(s => s.id);
            let recordedMap = {};

            if (studentIds.length > 0) {
                const { data: attendanceList, error: aErr } = await db
                    .from('attendance')
                    .select('*')
                    .eq('date', selectedDate)
                    .in('student_id', studentIds);
                if (aErr) throw aErr;

                attendanceList?.forEach(record => {
                    recordedMap[record.student_id] = record.status;
                });
            }

            const initialMap = {};
            studentList?.forEach(s => {
                initialMap[s.id] = recordedMap[s.id] || 'PRESENT';
            });

            setStudents(studentList || []);
            setAttendanceMap(initialMap);
        } catch (e) {
            console.error('Error loading attendance register:', e);
            showToast('Fetch Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Load monthly matrix data
    const loadMonthlyGrid = async () => {
        if (!selectedClass) return;
        setGridLoading(true);
        try {
            // Get student roster first
            const { data: studentList, error: sErr } = await db
                .from('students')
                .select('id, name, roll_number')
                .eq('class', selectedClass)
                .order('name');
            if (sErr) throw sErr;

            setStudents(studentList || []);
            const studentIds = (studentList || []).map(s => s.id);
            const initialGrid = {};
            studentList?.forEach(s => { initialGrid[s.id] = {}; });

            if (studentIds.length > 0) {
                const daysInMonth = new Date(gridYear, gridMonth, 0).getDate();
                const startDate = `${gridYear}-${String(gridMonth).padStart(2, '0')}-01`;
                const endDate = `${gridYear}-${String(gridMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

                const { data: records, error: rErr } = await db
                    .from('attendance')
                    .select('*')
                    .in('student_id', studentIds)
                    .gte('date', startDate)
                    .lte('date', endDate);
                
                if (rErr) throw rErr;

                records?.forEach(r => {
                    const dayNum = parseInt(r.date.split('-')[2], 10);
                    if (initialGrid[r.student_id]) {
                        initialGrid[r.student_id][dayNum] = r.status;
                    }
                });
            }

            setGridData(initialGrid);
        } catch (e) {
            console.error('Error loading monthly grid:', e);
            showToast('Grid Load Error: ' + e.message, 'error');
        } finally {
            setGridLoading(false);
        }
    };

    // Load overall class analytics & defaulters list
    const loadClassAnalytics = async () => {
        if (!selectedClass) return;
        setAnalyticsLoading(true);
        try {
            const { data: studentList, error: sErr } = await db
                .from('students')
                .select('id, name, roll_number')
                .eq('class', selectedClass)
                .order('name');
            if (sErr) throw sErr;

            const studentIds = (studentList || []).map(s => s.id);
            const rates = [];

            if (studentIds.length > 0) {
                const { data: records, error: rErr } = await db
                    .from('attendance')
                    .select('*')
                    .in('student_id', studentIds);
                if (rErr) throw rErr;

                studentList.forEach(student => {
                    const studentRecords = records.filter(r => r.student_id === student.id);
                    let present = 0, absent = 0, leave = 0;
                    
                    studentRecords.forEach(r => {
                        if (r.status === 'PRESENT') present++;
                        else if (r.status === 'ABSENT') absent++;
                        else if (r.status === 'LEAVE') leave++;
                    });

                    const total = studentRecords.length;
                    const percent = total > 0 ? Math.round((present / total) * 100) : 100;

                    rates.push({
                        ...student,
                        present,
                        absent,
                        leave,
                        total,
                        percent
                    });
                });
            }

            setStudentRates(rates);
        } catch (e) {
            console.error('Error loading class analytics:', e);
            showToast('Analytics Failed: ' + e.message, 'error');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Calculate statistical summaries
    const calculateRegisterStats = () => {
        const total = students.length;
        if (total === 0) {
            setClassStats({ total: 0, present: 0, absent: 0, leave: 0, percent: 0 });
            return;
        }

        let present = 0, absent = 0, leave = 0;
        Object.keys(attendanceMap).forEach(id => {
            const status = attendanceMap[id];
            if (status === 'PRESENT') present++;
            else if (status === 'ABSENT') absent++;
            else if (status === 'LEAVE') leave++;
        });

        const percent = Math.round((present / total) * 100);
        setClassStats({ total, present, absent, leave, percent });
    };

    // Change status for specific student in register map
    const handleStatusChange = (studentId, status) => {
        setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
    };

    // Save/Upsert Daily Register records
    const handleSaveRegister = async () => {
        setSaving(true);
        const upsertData = Object.keys(attendanceMap).map(id => ({
            student_id: id,
            date: selectedDate,
            status: attendanceMap[id],
            marked_by: currentUser.id
        }));

        try {
            const { error } = await db
                .from('attendance')
                .upsert(upsertData, { onConflict: 'student_id, date' });
            if (error) throw error;

            showToast(`✅ Class ${selectedClass} attendance registered successfully!`, 'success');
            loadAttendanceRegister();
        } catch (e) {
            console.error('Error saving register:', e);
            showToast('Save Failed: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Utility to mark all students present/absent at once
    const handleMarkAll = (status) => {
        const updatedMap = {};
        students.forEach(s => { updatedMap[s.id] = status; });
        setAttendanceMap(updatedMap);
        showToast(`Marked all students as ${status}`, 'success');
    };

    // --- STUDENT/PARENT RENDER VIEW ---
    const loadPersonalAttendance = async () => {
        setPersonalLoading(true);
        try {
            const email = currentUser?.email || '';
            const admissionNo = email.split('@')[0].replace('P-', '').replace('p-', '').toUpperCase();
            
            const { data: studentList, error: sErr } = await db
                .from('students')
                .select('id, name, class')
                .eq('admission_no', admissionNo);
            
            if (sErr) throw sErr;
            
            if (studentList && studentList.length > 0) {
                const sId = studentList[0].id;
                const { data: records, error: rErr } = await db
                    .from('attendance')
                    .select('*')
                    .eq('student_id', sId)
                    .order('date', { ascending: false });
                
                if (rErr) throw rErr;
                
                let present = 0, absent = 0, leave = 0;
                records?.forEach(r => {
                    if (r.status === 'PRESENT') present++;
                    else if (r.status === 'ABSENT') absent++;
                    else if (r.status === 'LEAVE') leave++;
                });
                
                const total = records?.length || 0;
                const percent = total > 0 ? Math.round((present / total) * 100) : 100;
                
                setPersonalHistory(records || []);
                setPersonalStats({ total, present, absent, leave, percent });
            }
        } catch (e) {
            console.error('Error loading personal attendance history:', e);
        } finally {
            setPersonalLoading(false);
        }
    };

    if (isStudentOrParent) {
        return (
            <div>
                {/* Personal Summary Stats */}
                <div className="stats-row" style={{ marginBottom: '20px' }}>
                    <div className="stat-card">
                        <div className="number">{personalStats.percent}%</div>
                        <div className="label">Attendance Rate</div>
                    </div>
                    <div className="stat-card">
                        <div className="number" style={{ color: 'var(--green)' }}>{personalStats.present}</div>
                        <div className="label">Days Present</div>
                    </div>
                    <div className="stat-card">
                        <div className="number" style={{ color: 'var(--red)' }}>{personalStats.absent}</div>
                        <div className="label">Days Absent</div>
                    </div>
                    <div className="stat-card">
                        <div className="number" style={{ color: 'var(--gold)' }}>{personalStats.leave}</div>
                        <div className="label">Leaves Taken</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--gold)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <span>My Attendance Record</span>
                    </div>
                    
                    {personalLoading ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead><tr><th>Date</th><th>Day</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
                                    <tbody>{Array.from({ length: 8 }).map((_, i) => <SkPersonalRow key={i} />)}</tbody>
                                </table>
                            </div>
                        </div>
                    ) : personalHistory.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '48px', height: '48px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                            </div>
                            <p>Abhi tak koi attendance register record nahi mila hai.</p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                                Class: <strong>{currentUser.role === 'parent' ? "Child's Class" : "My Class"}</strong> | Checked on {new Date().toLocaleDateString('en-IN')}
                            </p>
                            <div className="results-table-wrap">
                                <div className="table-scroll">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Day</th>
                                                <th style={{ textAlign: 'center' }}>Attendance Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {personalHistory.map(record => {
                                                const dt = new Date(record.date);
                                                const dayName = dt.toLocaleDateString('en-IN', { weekday: 'long' });
                                                const status = record.status;
                                                const badgeClass = status === 'PRESENT' ? 'grade-A' : status === 'ABSENT' ? 'grade-E' : 'grade-C';
                                                
                                                return (
                                                    <tr key={record.id}>
                                                        <td style={{ fontWeight: '600' }}>
                                                            {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td>{dayName}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <span className={`grade-badge ${badgeClass}`} style={{ minWidth: '90px', padding: '6px 12px', fontSize: '11px', display: 'inline-block' }}>
                                                                {status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- TEACHER / ADMIN DASHBOARD VIEW ---

    // Calendar helper variables for Month view
    const daysInMonthCount = new Date(gridYear, gridMonth, 0).getDate();
    const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

    // Compute which dates are Sundays for selected month/year
    const sundaySet = new Set(
        daysArray.filter(d => new Date(gridYear, gridMonth - 1, d).getDay() === 0)
    );

    // Filter students for Daily Register search query
    const filteredStudents = students.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q);
    });

    // Compute metrics for analytics
    const defaultersList = studentRates.filter(s => s.percent < 75);
    const excellentList = studentRates.filter(s => s.percent >= 95);
    
    const classAvgPct = studentRates.length > 0 
        ? Math.round(studentRates.reduce((acc, curr) => acc + curr.percent, 0) / studentRates.length)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{SHIMMER_CSS}</style>

            {/* Class Stats Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {loading && students.length === 0 ? (
                    <>{[1,2,3,4].map(i => <SkStatCard key={i} />)}</>
                ) : (
                    <>
                        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'att-fade 0.3s ease' }}>
                            <div style={{ background: 'var(--cream)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--charcoal)" style={{ width: '22px', height: '22px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766v-.109A4.125 4.125 0 0 1 9.75 16.63a4.124 4.124 0 0 1 4.464 2.498ZM15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--charcoal)', lineHeight: '1.2' }}>{classStats.total}</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Class Strength</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'att-fade 0.3s ease' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.08)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--green)" style={{ width: '22px', height: '22px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)', lineHeight: '1.2' }}>{classStats.present}</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Present Today</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'att-fade 0.3s ease' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--red)" style={{ width: '22px', height: '22px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--red)', lineHeight: '1.2' }}>{classStats.absent}</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Absent Today</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'att-fade 0.3s ease' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.08)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="var(--gold)" style={{ width: '22px', height: '22px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold)', lineHeight: '1.2' }}>{classStats.percent}%</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Daily Rate</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tab Navigation Menu */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '20px', paddingBottom: '2px' }}>
                <button
                    onClick={() => setActiveTab('take-attendance')}
                    style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'take-attendance' ? '3px solid var(--gold)' : '3px solid transparent',
                        color: activeTab === 'take-attendance' ? 'var(--charcoal)' : 'var(--muted)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    <span>Take Attendance (उपस्थिति)</span>
                </button>
                <button
                    onClick={() => setActiveTab('monthly-grid')}
                    style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'monthly-grid' ? '3px solid var(--gold)' : '3px solid transparent',
                        color: activeTab === 'monthly-grid' ? 'var(--charcoal)' : 'var(--muted)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span>Monthly Log Grid (मासिक ग्रिड)</span>
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'analytics' ? '3px solid var(--gold)' : '3px solid transparent',
                        color: activeTab === 'analytics' ? 'var(--charcoal)' : 'var(--muted)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 18.375v-5.25ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-9.75ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    <span>Insights & Reports (विश्लेषण)</span>
                </button>
            </div>

            {/* TAB 1: DAILY TAKE ATTENDANCE */}
            {activeTab === 'take-attendance' && (
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--gold)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                            <span>Attendance Register / उपस्थिति प्रविष्टि</span>
                        </h3>
                    </div>

                    {/* Filter controls panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '12px' }}>Select Class</label>
                            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                {classesList.map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '12px' }}>Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', justifyContent: 'flex-start' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '12.5px' }} onClick={() => handleMarkAll('PRESENT')}>
                                Mark All Present
                            </button>
                            <button type="button" className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '12.5px' }} onClick={() => handleMarkAll('ABSENT')}>
                                Mark All Absent
                            </button>
                        </div>
                    </div>

                    {/* Search bar */}
                    {students.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                placeholder="Search student by name or roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13.5px' }}
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead><tr><th style={{ width: '80px' }}>Roll No</th><th>Student Name</th><th style={{ textAlign: 'center', width: '220px' }}>Attendance Status</th></tr></thead>
                                    <tbody>{Array.from({ length: 10 }).map((_, i) => <SkRegisterRow key={i} />)}</tbody>
                                </table>
                            </div>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '40px', height: '40px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                                </svg>
                            </div>
                            <p style={{ margin: 0 }}>No students found matching filters.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="results-table-wrap">
                                <div className="table-scroll">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '80px' }}>Roll No</th>
                                                <th>Student Name</th>
                                                <th style={{ textAlign: 'center', width: '220px' }}>Attendance Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(s => {
                                                const status = attendanceMap[s.id] || 'PRESENT';
                                                return (
                                                    <tr key={s.id}>
                                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                                                            {s.roll_number || '—'}
                                                        </td>
                                                        <td><strong>{s.name}</strong></td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(s.id, 'PRESENT')}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '6px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        border: '1px solid #22c55e',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        background: status === 'PRESENT' ? '#22c55e' : 'transparent',
                                                                        color: status === 'PRESENT' ? '#ffffff' : '#22c55e',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    Present
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(s.id, 'ABSENT')}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '6px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        border: '1px solid #ef4444',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        background: status === 'ABSENT' ? '#ef4444' : 'transparent',
                                                                        color: status === 'ABSENT' ? '#ffffff' : '#ef4444',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    Absent
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStatusChange(s.id, 'LEAVE')}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '6px 12px',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold',
                                                                        border: '1px solid #f59e0b',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        background: status === 'LEAVE' ? '#f59e0b' : 'transparent',
                                                                        color: status === 'LEAVE' ? '#ffffff' : '#f59e0b',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    Leave
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSaveRegister}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        fontWeight: '700',
                                        background: 'linear-gradient(to right, #1e3a8a, #3b82f6)',
                                        color: '#ffffff',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                                    }}
                                    disabled={saving}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                        {saving ? (
                                            'Saving...'
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                                </svg>
                                                <span>Save Attendance Register</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: MONTHLY ATTENDANCE GRID */}
            {activeTab === 'monthly-grid' && (
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px', color: 'var(--gold)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                            <span>Monthly Calendar Matrix / मासिक उपस्थिति चार्ट</span>
                        </h3>
                    </div>

                    {/* Filter controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '12px' }}>Class</label>
                            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                {classesList.map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '12px' }}>Select Month</label>
                            <select value={gridMonth} onChange={(e) => setGridMonth(parseInt(e.target.value, 10))}>
                                {monthsList.map(m => (
                                    <option key={m.val} value={m.val}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: '700', color: 'var(--muted)', fontSize: '12px' }}>Select Year</label>
                            <select value={gridYear} onChange={(e) => setGridYear(parseInt(e.target.value, 10))}>
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                                <option value={2023}>2023</option>
                            </select>
                        </div>
                    </div>

                    {gridLoading ? (
                        <div className="results-table-wrap">
                            <div className="table-scroll" style={{ overflowX: 'auto' }}>
                                <table className="results-table" style={{ borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                    <thead><tr><th style={{ position: 'sticky', left: 0, background: '#f8f9fa', zIndex: 10, minWidth: '150px' }}>Student Name</th>{daysArray.map(d => <th key={d} style={{ textAlign: 'center', padding: '6px', minWidth: '28px', border: '1px solid var(--border)' }}>{d}</th>)}<th>P</th><th>A</th><th>L</th><th>%</th></tr></thead>
                                    <tbody>{Array.from({ length: 8 }).map((_, i) => <SkGridRow key={i} days={daysArray} />)}</tbody>
                                </table>
                            </div>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="icon">📭</div>
                            <p style={{ margin: 0 }}>Is class mein koi student registered nahi mila</p>
                        </div>
                    ) : (
                        <div className="results-table-wrap">
                            <div className="table-scroll" style={{ overflowX: 'auto' }}>
                                <table className="results-table" style={{ borderCollapse: 'collapse', fontSize: '12.5px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ position: 'sticky', left: 0, background: '#f8f9fa', zIndex: 10, minWidth: '150px' }}>Student Name</th>
                                            {daysArray.map(day => {
                                                const isSunday = sundaySet.has(day);
                                                return (
                                                    <th key={day} style={{
                                                        textAlign: 'center',
                                                        padding: '4px 2px',
                                                        minWidth: '28px',
                                                        border: '1px solid var(--border)',
                                                        background: isSunday ? 'rgba(239,68,68,0.08)' : 'transparent',
                                                        color: isSunday ? 'var(--red)' : 'inherit',
                                                        fontWeight: isSunday ? '800' : '700',
                                                    }}>
                                                        <div>{day}</div>
                                                        {isSunday && <div style={{ fontSize: '8px', color: 'var(--red)', fontWeight: '700', marginTop: '1px', opacity: 0.75 }}>Su</div>}
                                                    </th>
                                                );
                                            })}
                                            <th style={{ textAlign: 'center', padding: '6px', minWidth: '35px', background: 'rgba(34,197,94,0.05)', color: 'var(--green)', border: '1px solid var(--border)' }}>P</th>
                                            <th style={{ textAlign: 'center', padding: '6px', minWidth: '35px', background: 'rgba(239,68,68,0.05)', color: 'var(--red)', border: '1px solid var(--border)' }}>A</th>
                                            <th style={{ textAlign: 'center', padding: '6px', minWidth: '35px', background: 'rgba(245,158,11,0.05)', color: 'var(--gold)', border: '1px solid var(--border)' }}>L</th>
                                            <th style={{ textAlign: 'center', padding: '6px', minWidth: '45px', background: 'var(--cream)', fontWeight: 'bold', border: '1px solid var(--border)' }}>%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => {
                                            const records = gridData[student.id] || {};
                                            let present = 0, absent = 0, leave = 0;
                                            
                                            daysArray.forEach(d => {
                                                const status = records[d];
                                                if (status === 'PRESENT') present++;
                                                else if (status === 'ABSENT') absent++;
                                                else if (status === 'LEAVE') leave++;
                                            });

                                            const totalRecords = present + absent + leave;
                                            const pct = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 100;
                                            const pctColor = pct < 75 ? 'var(--red)' : pct >= 90 ? 'var(--green)' : 'var(--gold)';

                                            return (
                                                <tr key={student.id}>
                                                    <td style={{ position: 'sticky', left: 0, background: '#ffffff', zIndex: 9, minWidth: '150px', borderRight: '2px solid var(--border)' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                                                        {student.roll_number && <small style={{ color: 'var(--muted)' }}>Roll: {student.roll_number}</small>}
                                                    </td>
                                                    {daysArray.map(day => {
                                                        const status = records[day];
                                                        const isSunday = sundaySet.has(day);
                                                        let char = '—';
                                                        let bg = isSunday ? 'rgba(239,68,68,0.06)' : 'transparent';
                                                        let color = isSunday ? 'rgba(239,68,68,0.4)' : 'var(--muted)';

                                                        if (status === 'PRESENT') { char = 'P'; bg = '#22c55e'; color = '#ffffff'; }
                                                        else if (status === 'ABSENT') { char = 'A'; bg = '#ef4444'; color = '#ffffff'; }
                                                        else if (status === 'LEAVE') { char = 'L'; bg = '#f59e0b'; color = '#ffffff'; }

                                                        return (
                                                            <td key={day} style={{
                                                                textAlign: 'center',
                                                                padding: '4px',
                                                                border: '1px solid var(--border)',
                                                                background: isSunday && !status ? 'rgba(239,68,68,0.04)' : 'transparent'
                                                            }}>
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    fontSize: '9px',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: '50%',
                                                                    background: bg,
                                                                    color: color,
                                                                    opacity: status ? 1 : (isSunday ? 0.5 : 0.4)
                                                                }}>
                                                                    {isSunday && !status ? 'S' : char}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--green)', border: '1px solid var(--border)', background: 'rgba(34,197,94,0.02)' }}>{present}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--red)', border: '1px solid var(--border)', background: 'rgba(239,68,68,0.02)' }}>{absent}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--gold)', border: '1px solid var(--border)', background: 'rgba(245,158,11,0.02)' }}>{leave}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: '800', color: pctColor, border: '1px solid var(--border)', background: 'var(--cream)' }}>{pct}%</td>
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

            {/* TAB 3: INSIGHTS & REPORTS */}
            {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Analytics Header stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Class Average Attendance</div>
                            <div style={{ fontSize: '28px', fontWeight: '850', color: classAvgPct < 75 ? 'var(--red)' : classAvgPct >= 90 ? 'var(--green)' : 'var(--gold)' }}>
                                {classAvgPct}%
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${classAvgPct}%`, height: '100%', background: classAvgPct < 75 ? 'var(--red)' : classAvgPct >= 90 ? 'var(--green)' : 'var(--gold)' }}></div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Defaulters List (&lt;75%)</div>
                            <div style={{ fontSize: '28px', fontWeight: '850', color: defaultersList.length > 0 ? 'var(--red)' : 'var(--green)' }}>
                                {defaultersList.length} Student{defaultersList.length !== 1 && 's'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Requires immediate warning notifications.
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Excellent Attendance (&gt;=95%)</div>
                            <div style={{ fontSize: '28px', fontWeight: '850', color: 'var(--green)' }}>
                                {excellentList.length} Student{excellentList.length !== 1 && 's'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Performing exceptionally in consistency.
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <span>Attendance Defaulters / 75% से कम उपस्थिति वाले छात्र</span>
                            </h3>
                            <div className="form-group" style={{ margin: 0, width: '180px' }}>
                                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                                    {classesList.map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {analyticsLoading ? (
                            <div className="results-table-wrap">
                                <div className="table-scroll">
                                    <table className="results-table">
                                        <thead><tr><th>Roll No</th><th>Name</th><th style={{textAlign:'center'}}>Present</th><th style={{textAlign:'center'}}>Absent</th><th style={{textAlign:'center'}}>Leave</th><th style={{textAlign:'center'}}>Total</th><th style={{textAlign:'center'}}>%</th></tr></thead>
                                        <tbody>{Array.from({ length: 8 }).map((_, i) => <SkAnalyticsRow key={i} />)}</tbody>
                                    </table>
                                </div>
                            </div>
                        ) : defaultersList.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--green)', borderRadius: '12px', background: 'rgba(34,197,94,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--green)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '40px', height: '40px' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.75 3.75 0 0 1 21 12Z" />
                                    </svg>
                                </div>
                                <p style={{ margin: 0, fontWeight: '700', color: 'var(--green)' }}>Excellent Performance!</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--muted)' }}>
                                    There are no students with critical attendance rates under 75% in Class {selectedClass}.
                                </p>
                            </div>
                        ) : (
                            <div className="results-table-wrap">
                                <div className="table-scroll">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                <th>Roll No</th>
                                                <th>Name</th>
                                                <th style={{ textAlign: 'center' }}>Present Days</th>
                                                <th style={{ textAlign: 'center' }}>Absent Days</th>
                                                <th style={{ textAlign: 'center' }}>Leave Days</th>
                                                <th style={{ textAlign: 'center' }}>Total Logs</th>
                                                <th style={{ textAlign: 'center' }}>Attendance Pct</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {defaultersList.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{s.roll_number || '—'}</td>
                                                    <td><strong>{s.name}</strong></td>
                                                    <td style={{ textAlign: 'center', color: 'var(--green)', fontWeight: '700' }}>{s.present}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--red)', fontWeight: '700' }}>{s.absent}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--gold)', fontWeight: '700' }}>{s.leave}</td>
                                                    <td style={{ textAlign: 'center' }}>{s.total}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            background: 'rgba(239,68,68,0.08)',
                                                            color: 'var(--red)',
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            fontWeight: '800',
                                                            fontSize: '12px'
                                                        }}>
                                                            {s.percent}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
