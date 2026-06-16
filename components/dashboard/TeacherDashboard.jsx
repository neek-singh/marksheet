'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Noticeboard from '../notices/Noticeboard';
import { fmtDate, getGrade, getGradeBadge } from '../../lib/marksUtils';

import Icons from '../ui/Icons';

// Centralized strings dictionary for JSX internationalization
const strings = {
    teachingAssistantTitle: 'Vidya Portal Teaching Assistant',
    greetingText: 'नमस्ते, ',
    welcomeBody: 'Welcome to your Vidya Portal teaching assistant. Manage your classes, roll out marks, and record daily attendance efficiently.',
    todayClasses: "Today's Schedule",
    attendanceRate: 'Staff Attendance',
    pendingHw: 'Pending Homeworks',
    classesLabel: 'My Classes Workload',
    classroomAlloc: 'Room Assignment',
    periodsSchedule: 'Class Period Timetable',
    weeklyScheduleTitle: 'Weekly Period Workload & Schedules',
    classLabel: 'Class',
    secLabel: 'Sec',
    subjectLabel: 'Subject',
    periodLabel: 'Period',
    roomLabel: 'Room',
    noTimetable: 'No period workload assigned to timetable.',
    attendanceSheetTitle: 'Student Attendance Register Sheet',
    studentName: 'Student Name',
    attStatus: 'Attendance Status',
    attRemarks: 'Remarks',
    present: 'PRESENT',
    absent: 'ABSENT',
    leave: 'APPROVED LEAVE',
    late: 'LATE ENTRY',
    saveRegisterBtn: 'Submit Attendance Register',
    noStudents: 'No students found in assigned class.',
    marksEntryTitle: 'Subject-wise Academic Marks Entry',
    selectSubject: 'Select Subject',
    enterMarksBtn: 'Record Academic Marks',
    marksObtd: 'Marks Obtained',
    maxMarks: 'Max Marks',
    homeworkNotesTitle: 'Assigned Homework & Lecture Notes Locker',
    hwTitleLabel: 'Homework Topic Title *',
    hwClassLabel: 'Target Class *',
    hwDateLabel: 'Submission Due Date *',
    createHwBtn: 'Post Homework Assignment',
    notesTitleLabel: 'Lecture Notes Title *',
    notesFileLabel: 'Choose Reference PDF *',
    createNotesBtn: 'Upload Lecture Notes',
    postedHwTitle: 'Posted Homeworks History',
    postedNotesTitle: 'Uploaded Notes History',
    leaveTitle: 'Submit Staff Leave Application',
    leaveType: 'Leave Category *',
    fromDate: 'From Date *',
    toDate: 'To Date *',
    leaveReason: 'Reason for Leave *',
    submitLeaveBtn: 'Dispatch Leave Request',
    leaveBalanceTitle: 'Staff Leave Account Balances',
    casualBalance: 'Casual Leave (CL)',
    sickBalance: 'Sick Leave (SL)',
    earnedBalance: 'Earned Leave (EL)',
    maternityBalance: 'Maternity Leave (ML)',
    payslipsTitle: 'My Salary Payslips Ledger',
    salaryMonth: 'Payslip Month',
    salaryBasic: 'Basic Salary',
    salaryNet: 'Net Disbursed',
    payslipBtn: 'Download Payslip',
    noPayslips: 'No monthly payslips generated.',
    portfolioTitle: 'My achievements & Awards Portfolio',
    awardTitle: 'Achievement Title *',
    awardDetails: 'Description details',
    submitAwardBtn: 'Log Achievement',
    loggedAwardsTitle: 'Logged achievements portfolio',
    noAwards: 'No portfolio achievements recorded.',
    resignTitle: 'exit Resignation & Notice Period Clearance',
    resignReason: 'Resignation Reason *',
    noticePeriod: 'Notice Period',
    submitResignBtn: 'Submit Resignation Request',
    clearanceStatusTitle: '📑 Clearance Checklist Status',
    exitTimelineTitle: 'Staff timeline Activity logs',
    aiAssistantTitle: 'AI Teacher Assistant Playground (Vidyut AI)',
    aiLessonPlan: 'Lesson Plan Generator',
    aiQuestionPaper: 'Question Paper Generator',
    aiQuiz: 'Quiz Generator',
    aiRemarks: 'Student Remarks Analyst',
    aiTopicInput: 'Enter Topic / Subject *',
    aiClassInput: 'Target Class *',
    aiPromptBtn: 'Generate AI Structure',
    aiGenerating: 'Vidyut AI is compiling structures...',
    aiResultsTitle: 'Vidyut AI Generation Output',
    studentRemarksHelp: 'Select Student to analyze grades & generate progress card remarks:',
    targetClassLabel: 'Target Class',
    class1st: 'Class 1st',
    class2nd: 'Class 2nd',
    class3rd: 'Class 3rd',
    class4th: 'Class 4th',
    class5th: 'Class 5th',
    class6th: 'Class 6th',
    class7th: 'Class 7th',
    class8th: 'Class 8th',
    rollHeader: 'Roll',
    nameHeader: 'Name',
    fatherNameHeader: "Father's Name",
    casteHeader: 'Caste',
    marksPctHeader: 'Marks %',
    gradeHeader: 'Grade',
    dayHeader: 'Day',
    classText: 'Class ',
    takingClassRegister: 'Taking Class Register',
    rollNoHeader: 'Roll No',
    classLabelInput: 'Class',
    subMath: 'Mathematics',
    subSci: 'Science',
    subEng: 'English',
    subComp: 'Computers',
    subHindi: 'Hindi',
    subSocialSci: 'Social Science',
    subSanskrit: 'Sanskrit',
    annObtdMarks: 'Annual Obtd Marks (100)',
    secLabelInput: 'Sec',
    secA: 'Sec A',
    secB: 'Sec B',
    noHwYet: 'No homework posted yet.',
    classColon: 'Class: ',
    noNotesUploaded: 'No study notes uploaded.',
    leaveCL: 'Casual Leave (CL)',
    leaveSL: 'Sick Leave (SL)',
    leaveEL: 'Earned Leave (EL)',
    leaveML: 'Maternity Leave (ML)',
    noLeavesLogged: 'No leaves logged.',
    immWithdrawal: 'Immediate Withdrawal',
    exitDateLogged: 'Exit Date logged: ',
    clearanceNoticeLabel: 'Clearance notice: ',
    checklistStateLabel: 'Checklist State: ',
    clearanceInactive: 'Clearance list inactive. No resignations submitted.',
    selectStudentLabel: 'Select Student',
    aiConfigHelp: 'Configure filters and execute prompts to dispatch AI generations.'
};

export default function TeacherDashboard({
    stats,
    pendingStudents,
    currentUser,
    onEnterMarks,
    onEditInfo,
    onChangePage,
    onDownloadClassPDF,
    showToast
}) {
    // Active Tab in Teacher Portal
    const [activeTeacherTab, setActiveTeacherTab] = useState('overview');

    // 1. TIMETABLE WORKLOADS STATE
    const [timetableList, setTimetableList] = useState([]);

    // 2. DAILY STUDENT ATTENDANCE STATES
    const [studentClass, setStudentClass] = useState('');
    const [studentsList, setStudentsList] = useState([]);
    const [attendanceReg, setAttendanceReg] = useState({}); // { studentId: { status, remarks } }
    const [takingAttendance, setTakingAttendance] = useState(false);

    // 3. ACADEMIC MARKS STATES
    const [marksClass, setMarksClass] = useState('');
    const [marksSub, setMarksSub] = useState('Mathematics');
    const [marksList, setMarksList] = useState({}); // { studentId: { hy_obtained, an_obtained } }

    // 4. HOMEWORK / NOTES STATES
    const [hwTitle, setHwTitle] = useState('');
    const [hwClass, setHwClass] = useState('1st');
    const [hwSec, setHwSec] = useState('A');
    const [hwDate, setHwDate] = useState('');
    const [postedHws, setPostedHws] = useState([]);

    const [notesTitle, setNotesTitle] = useState('');
    const [notesClass, setNotesClass] = useState('1st');
    const [notesSec, setNotesSec] = useState('A');
    const [uploadedNotes, setUploadedNotes] = useState([]);

    // 5. LEAVES STATES
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [leaveFromVal, setLeaveFromVal] = useState('');
    const [leaveToVal, setLeaveToVal] = useState('');
    const [leaveReasonVal, setLeaveReasonVal] = useState('');
    const [leavesHistory, setLeavesHistory] = useState([]);
    const [leaveSubmitted, setLeaveSubmitted] = useState(false);

    // 6. PORTFOLIO STATES
    const [awardTitleVal, setAwardTitleVal] = useState('');
    const [awardDetailsVal, setAwardDetailsVal] = useState('');
    const [portfolioAwards, setPortfolioAwards] = useState([]);

    // 7. EXIT RESIGN STATES
    const [exitReasonVal, setExitReasonVal] = useState('');
    const [exitNoticeVal, setExitNoticeVal] = useState('30 Days');
    const [resignSubmitted, setResignSubmitted] = useState(false);

    // 8. AI ASSISTANT STATES
    const [aiActiveTool, setAiActiveTool] = useState('lesson');
    const [aiTopic, setAiTopic] = useState('');
    const [aiClass, setAiClass] = useState('1st');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiResult, setAiResult] = useState('');
    
    // AI Remarks states
    const [aiSelectedStudent, setAiSelectedStudent] = useState('');

    // Teacher record linked in database
    const [teacherRecord, setTeacherRecord] = useState(null);

    const generatedPayslips = teacherRecord?.extended_info?.payslips || [];

    useEffect(() => {
        if (currentUser) {
            loadTeacherData();
        }
    }, [currentUser]);

    const loadTeacherData = async () => {
        try {
            // Find teacher profile linked by email
            const { data, error } = await db
                .from('teachers')
                .select('*')
                .eq('email', currentUser.email)
                .single();

            if (!error && data) {
                setTeacherRecord(data);
                
                // Populate sub systems lists from extended_info JSONB
                const ext = data.extended_info || {};
                setTimetableList(ext.timetable || []);
                setPostedHws(ext.homeworks || []);
                setUploadedNotes(ext.notes || []);
                setLeavesHistory(ext.leaves || []);
                setPortfolioAwards(ext.achievements || []);
                
                // default class for taking attendance
                const classesList = ext.assigned_classes || [];
                if (classesList.length > 0) {
                    setStudentClass(classesList[0].class || '1st');
                    setMarksClass(classesList[0].class || '1st');
                }
            }
        } catch (e) {
            console.error('Error loading teacher record:', e);
        }
    };

    // LOAD STUDENTS FOR ATTENDANCE / MARKS GRID
    useEffect(() => {
        if (studentClass) {
            loadClassStudents();
        }
    }, [studentClass]);

    const loadClassStudents = async () => {
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('class', studentClass)
                .order('name');
            
            if (!error && data) {
                setStudentsList(data);
                
                // Initialize registers maps
                const attMap = {};
                const marksMap = {};
                data.forEach(s => {
                    Reflect.set(attMap, s.id, { status: 'PRESENT', remarks: 'Regular Day' });
                    
                    const m = s.marks || [];
                    const foundSub = m.find(sub => sub.subject === marksSub) || {};
                    Reflect.set(marksMap, s.id, {
                        hy_obtained: foundSub.hy_obtained || '0',
                        an_obtained: foundSub.an_obtained || '0'
                    });
                });
                setAttendanceReg(attMap);
                setMarksList(marksMap);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // UPDATE MASTER EXTENDED METADATA
    const handleUpdateTeacherInfo = async (extFields, timelineAction = null) => {
        if (!teacherRecord) return;
        try {
            const currentExt = teacherRecord.extended_info || {};
            let newExt = { ...currentExt, ...extFields };

            if (timelineAction) {
                const timeline = newExt.timeline || [];
                timeline.push({
                    action: timelineAction.action,
                    date: new Date().toISOString().split('T')[0],
                    details: timelineAction.details
                });
                newExt.timeline = timeline;
            }

            const { error } = await db
                .from('teachers')
                .update({ extended_info: newExt })
                .eq('id', teacherRecord.id);
            if (error) throw error;
            loadTeacherData();
        } catch (e) {
            console.error(e);
        }
    };

    // SAVE STUDENT ATTENDANCE REGISTER
    const handleSaveAttendanceRegister = async (e) => {
        e.preventDefault();
        setTakingAttendance(true);
        try {
            const keys = Object.keys(attendanceReg);
            const date = new Date().toISOString().split('T')[0];

            for (const studentId of keys) {
                const item = Reflect.get(attendanceReg, studentId);
                const payload = {
                    student_id: studentId,
                    date,
                    status: item.status,
                    remarks: item.remarks
                };

                // check existing
                const { data: existing } = await db
                    .from('attendance')
                    .select('id')
                    .eq('student_id', studentId)
                    .eq('date', date);

                if (existing && existing.length > 0) {
                    await db.from('attendance').update(payload).eq('id', existing[0].id);
                } else {
                    await db.from('attendance').insert([payload]);
                }
            }

            alert('✅ Class Attendance Register submitted successfully!');
            handleUpdateTeacherInfo({}, {
                action: 'Attendance Updated',
                details: `Daily attendance register recorded for Class: ${studentClass} (Date: ${date})`
            });
        } catch (e) {
            alert('Attendance Save Failed: ' + e.message);
        } finally {
            setTakingAttendance(false);
        }
    };

    // SAVE ACADEMIC MARKS ENTRIES IN BULK
    const handleSaveAcademicMarks = async (e) => {
        e.preventDefault();
        try {
            const keys = Object.keys(marksList);

            for (const studentId of keys) {
                const obtdMarks = Reflect.get(marksList, studentId);
                
                // Get existing student marks list
                const { data: student } = await db.from('students').select('marks').eq('id', studentId).single();
                let currentMarks = student?.marks || [];
                
                // update specific subject
                currentMarks = currentMarks.filter(m => m.subject !== marksSub);
                currentMarks.push({
                    subject: marksSub,
                    hy_obtained: Number(obtdMarks.hy_obtained),
                    hy_total: 100,
                    an_obtained: Number(obtdMarks.an_obtained),
                    an_total: 100
                });

                // compute aggregate
                let totalObtd = 0;
                let totalMax = 0;
                currentMarks.forEach(m => {
                    totalObtd += (m.hy_obtained || 0) + (m.an_obtained || 0);
                    totalMax += (m.hy_total || 100) + (m.an_total || 100);
                });
                const percentage = totalMax > 0 ? Math.round((totalObtd / totalMax) * 100) : 0;
                const grade = getGrade(percentage.toFixed(1));

                await db
                    .from('students')
                    .update({
                        marks: currentMarks,
                        grand_total_obtained: totalObtd,
                        grand_total_marks: totalMax,
                        percentage,
                        grade
                    })
                    .eq('id', studentId);
            }

            alert(`✅ Academic Marks saved for Subject: ${marksSub}!`);
            handleUpdateTeacherInfo({}, {
                action: 'Exam Result Published',
                details: `Subject Marks entered for: ${marksSub} (Class: ${marksClass})`
            });
        } catch (e) {
            alert('Marks Save Failed: ' + e.message);
        }
    };

    // SUBMIT MOCK LEAVE
    const handlePostLeave = (e) => {
        e.preventDefault();
        const list = [...leavesHistory];
        
        const newLeave = {
            id: `LVE-${Math.floor(100 + Math.random()*899)}`,
            type: leaveType,
            from: leaveFromVal,
            to: leaveToVal,
            reason: leaveReasonVal.trim(),
            status: 'Pending'
        };

        list.push(newLeave);
        handleUpdateTeacherInfo({ leaves: list }, {
            action: 'Leave Request Submitted',
            details: `Staff requested ${leaveType} leave from ${leaveFromVal} to ${leaveToVal}`
        });
        setLeaveSubmitted(true);
        setLeaveFromVal('');
        setLeaveToVal('');
        setLeaveReasonVal('');
    };

    // POST HOMEWORK
    const handlePostHw = (e) => {
        e.preventDefault();
        const list = [...postedHws];
        list.push({
            title: hwTitle.trim(),
            class: hwClass,
            section: hwSec,
            dueDate: hwDate,
            postedAt: new Date().toISOString().split('T')[0]
        });

        handleUpdateTeacherInfo({ homeworks: list }, {
            action: 'Homework Created',
            details: `Created new Homework task for Class ${hwClass}-${hwSec}: ${hwTitle}`
        });
        setHwTitle('');
        setHwDate('');
        showToast('✅ Homework assignment posted successfully!', 'success');
    };

    // POST NOTES
    const handlePostNotes = (e) => {
        e.preventDefault();
        const list = [...uploadedNotes];
        list.push({
            title: notesTitle.trim(),
            class: notesClass,
            section: notesSec,
            fileName: `${notesTitle.trim().toLowerCase().replace(/ /g, '_')}_ref.pdf`,
            uploadedAt: new Date().toISOString().split('T')[0]
        });

        handleUpdateTeacherInfo({ notes: list }, {
            action: 'Documents Uploaded',
            details: `Uploaded new lecture study notes: ${notesTitle}`
        });
        setNotesTitle('');
        showToast('✅ Lecture notes reference uploaded!', 'success');
    };

    // LOG ACHIEVEMENTS
    const handlePostAward = (e) => {
        e.preventDefault();
        const list = [...portfolioAwards];
        list.push({
            title: awardTitleVal.trim(),
            details: awardDetailsVal.trim(),
            date: new Date().toISOString().split('T')[0]
        });

        handleUpdateTeacherInfo({ achievements: list });
        setAwardTitleVal('');
        setAwardDetailsVal('');
        showToast('🏆 Achievement saved in professional portfolio!', 'success');
    };

    // SUBMIT RESIGNATION
    const handlePostResign = (e) => {
        e.preventDefault();
        const clearance = {
            resignation_date: new Date().toISOString().split('T')[0],
            reason: exitReasonVal.trim(),
            notice_period: exitNoticeVal,
            clearance: 'In Progress',
            settlement_amount: teacherRecord?.salary ? teacherRecord.salary * 2 : 50000
        };

        handleUpdateTeacherInfo({ exit_clearance: clearance }, {
            action: 'Resignation Submitted',
            details: `Resignation notice submitted Standard Exit: ${exitNoticeVal}`
        });
        setResignSubmitted(true);
        setExitReasonVal('');
    };

    // GENERATE AI TEXTS
    const handleTriggerAI = (e) => {
        e.preventDefault();
        if (aiActiveTool === 'remarks' && !aiSelectedStudent) {
            alert('Please select a student first!');
            return;
        }

        setAiGenerating(true);
        setTimeout(() => {
            let output = '';
            if (aiActiveTool === 'lesson') {
                output = `📚 **AI STRUCTURED LESSON PLAN (Vidyut AI)**
- **Topic Topic**: ${aiTopic || 'Thermodynamics Principles'} (Class: ${aiClass})
- **Instructional Objectives**: Understand basic principles, apply formula metrics, identify systems limits.
- **Pedagogy Method**: Constructivist interactive learning, quiz checks, interactive bar loops.
- **Assessment Schema**: Quiz board evaluation, daily homework worksheet.
- **Reference Materials**: Class PDF Notes, digital simulations.`;
            } else if (aiActiveTool === 'quiz') {
                output = `🧠 **AI REVISION QUIZ GENERATOR**
- **Topic Topic**: ${aiTopic || 'Algebra Formulas'} (Class: ${aiClass})
- **Q1**: What is the formula of (a+b)²? (Ans: a² + b² + 2ab)
- **Q2**: Define an expression vs equation. (Ans: Equation has =)
- **Q3**: Factorize x² - 9. (Ans: (x-3)(x+3))
- **Q4**: Find roots of x² - 5x + 6 = 0. (Ans: x=2, x=3)`;
            } else if (aiActiveTool === 'paper') {
                output = `📝 **AI MOCK EXAM PAPER GENERATION**
- **Syllabus Topic**: ${aiTopic || 'Force & Laws of Motion'} (Class: ${aiClass})
- **Section A (1 Mark each)**: Define inertia. State Newton's Second Law of Motion.
- **Section B (3 Marks each)**: State and explain Law of Conservation of Momentum.
- **Section C (5 Marks each)**: Derive mathematically F = ma. A car of mass 1000kg accelerates from rest to 20m/s in 5s; find Force.`;
            } else {
                // remarks
                const chosen = studentsList.find(s => s.id === aiSelectedStudent);
                const name = chosen ? chosen.name : 'Student';
                const grade = chosen ? chosen.grade : 'B';
                const pct = chosen ? chosen.percentage : 78;
                output = `🤖 **AI REPORT CARD REMARKS ANALYST**
- **Student Profile**: ${name} (Grade: ${grade} | Aggregate: ${pct}%)
- **Draft Remarks**: "${name} is a highly participative and motivated learner. With an aggregate score of ${pct}%, they demonstrate solid comprehension of subject matters. Advise focusing more on numerical evaluations in Mathematics to further push towards A+ grade next term. Outstanding discipline."`;
            }
            setAiResult(output);
            setAiGenerating(false);
            showToast('🤖 AI Generation complete!', 'success');
        }, 1500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Greeting Header */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,78,139,0.08) 0%, rgba(20,20,20,0.6) 100%)', border: '1px solid rgba(16,78,139,0.2)', marginBottom: '0' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {strings.greetingText}{currentUser?.full_name || 'शिक्षक'}!
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: '14px' }}>
                    {strings.welcomeBody}
                </p>
            </div>

            {/* Portal Tab Headers */}
            <div
                style={{
                    display: 'flex',
                    background: '#fff',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    border: '1px solid var(--border)'
                }}
            >
                {[
                    { id: 'overview', label: 'Dashboard', icon: <Icons.Dashboard size={14} /> },
                    { id: 'classes', label: 'My Class Lists', icon: <Icons.Student size={14} /> },
                    { id: 'timetable', label: 'My Timetable', icon: <Icons.Calendar size={14} /> },
                    { id: 'attendance', label: 'Take Attendance', icon: <Icons.Clipboard size={14} /> },
                    { id: 'marks', label: 'Marks Entry', icon: <Icons.Document size={14} /> },
                    { id: 'homework', label: 'Homework Locker', icon: <Icons.Book size={14} /> },
                    { id: 'leaves', label: 'Leave Application', icon: <Icons.Clock size={14} /> },
                    { id: 'payroll', label: 'My Payslips', icon: <Icons.Fee size={14} /> },
                    { id: 'achievements', label: 'My achievements', icon: <Icons.Trophy size={14} /> },
                    { id: 'resign', label: 'exit & Exit', icon: <Icons.Close size={14} /> },
                    { id: 'ai', label: 'Vidyut AI Assistant', icon: <Icons.Cpu size={14} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        style={{
                            padding: '14px 20px',
                            border: 'none',
                            background: activeTeacherTab === t.id ? 'var(--cream)' : 'transparent',
                            borderBottom: activeTeacherTab === t.id ? '3px solid var(--primary)' : '3px solid transparent',
                            color: activeTeacherTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: activeTeacherTab === t.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        onClick={() => setActiveTeacherTab(t.id)}
                    >
                        {t.icon}
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* PORTAL TAB CONTENT */}
            <div className="card" style={{ marginTop: '0' }}>
                
                {/* TAB 1: OVERVIEW */}
                {activeTeacherTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Stats Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                            <div style={{ background: '#f9f9f9', border: '1px solid var(--border)', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.todayClasses}</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{timetableList.length} Classes</div>
                            </div>
                            <div style={{ background: '#f9f9f9', border: '1px solid var(--border)', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.attendanceRate}</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green)' }}>98% Rate</div>
                            </div>
                            <div style={{ background: '#f9f9f9', border: '1px solid var(--border)', padding: '15px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.pendingHw}</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gold)' }}>{postedHws.length} Pending</div>
                            </div>
                        </div>

                        {/* notices noticeboard component */}
                        <Noticeboard currentUser={currentUser} showToast={() => {}} />
                    </div>
                )}

                {/* TAB 2: MY CLASSES */}
                {activeTeacherTab === 'classes' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Student size={18} />
                            <span>My Assigned Class Lists & Student Directories</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div className="form-group" style={{ flex: '1', maxWidth: '200px' }}>
                                <label>{strings.targetClassLabel}</label>
                                <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
                                    <option value="1st">{strings.class1st}</option>
                                    <option value="2nd">{strings.class2nd}</option>
                                    <option value="3rd">{strings.class3rd}</option>
                                    <option value="4th">{strings.class4th}</option>
                                    <option value="5th">{strings.class5th}</option>
                                    <option value="6th">{strings.class6th}</option>
                                    <option value="7th">{strings.class7th}</option>
                                    <option value="8th">{strings.class8th}</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-scroll">
                            <table className="results-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>{strings.rollHeader}</th>
                                        <th>{strings.nameHeader}</th>
                                        <th>{strings.fatherNameHeader}</th>
                                        <th>{strings.casteHeader}</th>
                                        <th>{strings.marksPctHeader}</th>
                                        <th>{strings.gradeHeader}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)' }}>{strings.noStudents}</td>
                                        </tr>
                                    ) : (
                                        studentsList.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.roll_number || '—'}</strong></td>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.father_name || '—'}</td>
                                                <td>{item.category || 'GENERAL'}</td>
                                                <td><strong>{item.percentage || 0}%</strong></td>
                                                <td>{getGradeBadge(item.grade)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: WEEKLY TIMETABLE */}
                {activeTeacherTab === 'timetable' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.weeklyScheduleTitle}</div>
                        <div className="table-scroll">
                            <table className="results-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>{strings.dayHeader}</th>
                                        <th>{strings.periodLabel}</th>
                                        <th>{strings.classLabel} & {strings.secLabel}</th>
                                        <th>{strings.subjectLabel}</th>
                                        <th>{strings.roomLabel}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetableList.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)' }}>{strings.noTimetable}</td>
                                        </tr>
                                    ) : (
                                        timetableList.map((t, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{t.day}</strong></td>
                                                <td>{t.period}</td>
                                                <td><strong>{strings.classText}{t.class} - {t.section}</strong></td>
                                                <td>{t.subject}</td>
                                                <td><span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eaeaea', fontSize: '11px', fontWeight: 'bold' }}>{t.room}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: STUDENT ATTENDANCE REGISTER */}
                {activeTeacherTab === 'attendance' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.attendanceSheetTitle}</div>
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                            <div className="form-group" style={{ flex: '1', maxWidth: '200px' }}>
                                <label>{strings.takingClassRegister}</label>
                                <select value={studentClass} onChange={(e) => setStudentClass(e.target.value)}>
                                    <option value="1st">{strings.class1st}</option>
                                    <option value="2nd">{strings.class2nd}</option>
                                    <option value="3rd">{strings.class3rd}</option>
                                    <option value="4th">{strings.class4th}</option>
                                    <option value="5th">{strings.class5th}</option>
                                    <option value="6th">{strings.class6th}</option>
                                </select>
                            </div>
                        </div>

                        <form onSubmit={handleSaveAttendanceRegister}>
                            <div className="table-scroll" style={{ maxHeight: '300px', marginBottom: '20px' }}>
                                <table className="results-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.rollNoHeader}</th>
                                            <th>{strings.studentName}</th>
                                            <th>{strings.attStatus}</th>
                                            <th>{strings.attRemarks}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsList.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>{strings.noStudents}</td>
                                            </tr>
                                        ) : (
                                            studentsList.map(s => {
                                                const current = Reflect.get(attendanceReg, s.id) || { status: 'PRESENT', remarks: 'Regular Day' };
                                                return (
                                                    <tr key={s.id}>
                                                        <td><strong>{s.roll_number || '—'}</strong></td>
                                                        <td><strong>{s.name}</strong></td>
                                                        <td>
                                                            <select
                                                                value={current.status}
                                                                onChange={(e) => {
                                                                    const nextAtt = { ...attendanceReg };
                                                                    Reflect.set(nextAtt, s.id, { ...current, status: e.target.value });
                                                                    setAttendanceReg(nextAtt);
                                                                }}
                                                                style={{ padding: '4px', fontSize: '12px' }}
                                                            >
                                                                <option value="PRESENT">{strings.present}</option>
                                                                <option value="ABSENT">{strings.absent}</option>
                                                                <option value="LEAVE">{strings.leave}</option>
                                                                <option value="LATE">{strings.late}</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={current.remarks}
                                                                onChange={(e) => {
                                                                    const nextAtt = { ...attendanceReg };
                                                                    Reflect.set(nextAtt, s.id, { ...current, remarks: e.target.value });
                                                                    setAttendanceReg(nextAtt);
                                                                }}
                                                                style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {studentsList.length > 0 && (
                                <button type="submit" className={`btn btn-primary ${takingAttendance ? 'btn-loading' : ''}`} disabled={takingAttendance}>
                                    {takingAttendance ? '' : strings.saveRegisterBtn}
                                </button>
                            )}
                        </form>
                    </div>
                )}

                {/* TAB 5: ACADEMIC MARKS ENTRY */}
                {activeTeacherTab === 'marks' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.marksEntryTitle}</div>
                        
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <div className="form-group" style={{ flex: '1', maxWidth: '180px' }}>
                                <label>{strings.classLabelInput}</label>
                                <select value={marksClass} onChange={(e) => setMarksClass(e.target.value)}>
                                    <option value="1st">{strings.class1st}</option>
                                    <option value="2nd">{strings.class2nd}</option>
                                    <option value="3rd">{strings.class3rd}</option>
                                    <option value="4th">{strings.class4th}</option>
                                    <option value="5th">{strings.class5th}</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: '1', maxWidth: '180px' }}>
                                <label>{strings.selectSubject}</label>
                                <select value={marksSub} onChange={(e) => setMarksSub(e.target.value)}>
                                    <option value="Mathematics">{strings.subMath}</option>
                                    <option value="Science">{strings.subSci}</option>
                                    <option value="English">{strings.subEng}</option>
                                    <option value="Computers">{strings.subComp}</option>
                                    <option value="Hindi">{strings.subHindi}</option>
                                    <option value="Social Science">{strings.subSocialSci}</option>
                                    <option value="Sanskrit">{strings.subSanskrit}</option>
                                </select>
                            </div>
                        </div>

                        <form onSubmit={handleSaveAcademicMarks}>
                            <div className="table-scroll" style={{ maxHeight: '300px', marginBottom: '20px' }}>
                                <table className="results-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.rollNoHeader}</th>
                                            <th>{strings.studentName}</th>
                                            <th>{strings.marksObtd} (100)</th>
                                            <th>{strings.annObtdMarks}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsList.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)' }}>{strings.noStudents}</td>
                                            </tr>
                                        ) : (
                                            studentsList.map(s => {
                                                const current = Reflect.get(marksList, s.id) || { hy_obtained: '0', an_obtained: '0' };
                                                return (
                                                    <tr key={s.id}>
                                                        <td><strong>{s.roll_number || '—'}</strong></td>
                                                        <td><strong>{s.name}</strong></td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={current.hy_obtained}
                                                                onChange={(e) => {
                                                                    const nextMarks = { ...marksList };
                                                                    Reflect.set(nextMarks, s.id, { ...current, hy_obtained: e.target.value });
                                                                    setMarksList(nextMarks);
                                                                }}
                                                                style={{ padding: '4px', width: '80px' }}
                                                                max="100"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={current.an_obtained}
                                                                onChange={(e) => {
                                                                    const nextMarks = { ...marksList };
                                                                    Reflect.set(nextMarks, s.id, { ...current, an_obtained: e.target.value });
                                                                    setMarksList(nextMarks);
                                                                }}
                                                                style={{ padding: '4px', width: '80px' }}
                                                                max="100"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {studentsList.length > 0 && (
                                <button type="submit" className="btn btn-primary">{strings.enterMarksBtn}</button>
                            )}
                        </form>
                    </div>
                )}

                {/* TAB 6: HOMEWORK & NOTES */}
                {activeTeacherTab === 'homework' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.homeworkNotesTitle}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>
                            
                            {/* Homework form */}
                            <form onSubmit={handlePostHw} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '15px' }}>
                                    <Icons.Clipboard size={14} /> Post Homework Tasks
                                </strong>
                                <div className="form-group">
                                    <label>{strings.hwTitleLabel}</label>
                                    <input type="text" placeholder="e.g. Chapter 4 Algebra Revision" value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} required />
                                </div>
                                <div className="form-grid" style={{ marginTop: '10px' }}>
                                    <div className="form-group">
                                        <label>{strings.hwClassLabel}</label>
                                        <select value={hwClass} onChange={(e) => setHwClass(e.target.value)}>
                                            <option value="1st">{strings.class1st}</option>
                                            <option value="2nd">{strings.class2nd}</option>
                                            <option value="3rd">{strings.class3rd}</option>
                                            <option value="4th">{strings.class4th}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.secLabelInput}</label>
                                        <select value={hwSec} onChange={(e) => setHwSec(e.target.value)}>
                                            <option value="A">{strings.secA}</option>
                                            <option value="B">{strings.secB}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>{strings.hwDateLabel}</label>
                                    <input type="date" value={hwDate} onChange={(e) => setHwDate(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>{strings.createHwBtn}</button>
                            </form>

                            {/* Study notes form */}
                            <form onSubmit={handlePostNotes} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '15px' }}>
                                    <Icons.Book size={14} /> Upload Lecture Reference Notes
                                </strong>
                                <div className="form-group">
                                    <label>{strings.notesTitleLabel}</label>
                                    <input type="text" placeholder="e.g. Plant cell diagrams study guide" value={notesTitle} onChange={(e) => setNotesTitle(e.target.value)} required />
                                </div>
                                <div className="form-grid" style={{ marginTop: '10px' }}>
                                    <div className="form-group">
                                        <label>{strings.classLabelInput}</label>
                                        <select value={notesClass} onChange={(e) => setNotesClass(e.target.value)}>
                                            <option value="1st">{strings.class1st}</option>
                                            <option value="2nd">{strings.class2nd}</option>
                                            <option value="3rd">{strings.class3rd}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.secLabelInput}</label>
                                        <select value={notesSec} onChange={(e) => setNotesSec(e.target.value)}>
                                            <option value="A">{strings.secA}</option>
                                            <option value="B">{strings.secB}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>{strings.notesFileLabel}</label>
                                    <input type="file" required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>{strings.createNotesBtn}</button>
                            </form>
                        </div>

                        {/* List grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>{strings.postedHwTitle}</strong>
                                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: '#fcfcfc', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {postedHws.length === 0 ? (
                                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>{strings.noHwYet}</div>
                                    ) : (
                                        postedHws.map((hw, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                                                <strong>{hw.title}</strong>
                                                <div style={{ color: 'var(--muted)', marginTop: '4px' }}>{strings.classColon}{hw.class} | Due: {fmtDate(hw.dueDate)}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>{strings.postedNotesTitle}</strong>
                                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: '#fcfcfc', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {uploadedNotes.length === 0 ? (
                                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>{strings.noNotesUploaded}</div>
                                    ) : (
                                        uploadedNotes.map((n, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                                                <strong>{n.title}</strong>
                                                <div style={{ color: 'monospace', color: 'var(--green)', fontSize: '11px', marginTop: '4px' }}>{n.fileName}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 7: LEAVE APPLICATION */}
                {activeTeacherTab === 'leaves' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>⏳ Teacher Leave request applications</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>
                            
                            {/* request Form */}
                            <form onSubmit={handlePostLeave} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '15px', color: 'var(--primary)' }}>{strings.leaveTitle}</strong>
                                {leaveSubmitted ? (
                                    <div style={{ background: '#e2f0d9', border: '1px solid #a9d18e', color: 'var(--green)', padding: '12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                                        ✅ Leave dispatch submitted successfully! Track approval status in ledger on right.
                                    </div>
                                ) : null}
                                <div className="form-group">
                                    <label>{strings.leaveType}</label>
                                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                        <option value="Casual Leave">{strings.leaveCL}</option>
                                        <option value="Sick Leave">{strings.leaveSL}</option>
                                        <option value="Earned Leave">{strings.leaveEL}</option>
                                        <option value="Maternity Leave">{strings.leaveML}</option>
                                    </select>
                                </div>
                                <div className="form-grid" style={{ marginTop: '10px' }}>
                                    <div className="form-group">
                                        <label>{strings.fromDate}</label>
                                        <input type="date" value={leaveFromVal} onChange={(e) => setLeaveFromVal(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.toDate}</label>
                                        <input type="date" value={leaveToVal} onChange={(e) => setLeaveToVal(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>{strings.leaveReason}</label>
                                    <textarea rows="3" value={leaveReasonVal} onChange={(e) => setLeaveReasonVal(e.target.value)} required style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>{strings.submitLeaveBtn}</button>
                            </form>

                            {/* Leaves Balance grids */}
                            <div>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '10px' }}>{strings.leaveBalanceTitle}</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>12 / 15</div>
                                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{strings.casualBalance}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>6 / 10</div>
                                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{strings.sickBalance}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>20 / 20</div>
                                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{strings.earnedBalance}</div>
                                    </div>
                                    <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>90 / 90</div>
                                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{strings.maternityBalance}</div>
                                    </div>
                                </div>

                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>📜 leave applications History</strong>
                                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: '#fcfcfc', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {leavesHistory.length === 0 ? (
                                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>{strings.noLeavesLogged}</div>
                                    ) : (
                                        leavesHistory.map(l => (
                                            <div key={l.id} style={{ background: '#fff', border: '1px solid #eee', padding: '6px', borderRadius: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong>{l.type}</strong> ({fmtDate(l.from)} - {fmtDate(l.to)})
                                                </div>
                                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: l.status === 'Approved' ? 'var(--green)' : 'var(--gold)' }}>{l.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 8: SALARY PAYSLIPS */}
                {activeTeacherTab === 'payroll' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.payslipsTitle}</div>
                        <div className="table-scroll">
                            <table className="results-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>{strings.salaryMonth}</th>
                                        <th>{strings.salaryBasic}</th>
                                        <th>{strings.salaryNet}</th>
                                        <th>{strings.action}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedPayslips.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.noPayslips}</td>
                                        </tr>
                                    ) : (
                                        generatedPayslips.map(slip => (
                                            <tr key={slip.id}>
                                                <td><strong>{slip.month}</strong></td>
                                                <td>₹{slip.basic}</td>
                                                <td><strong style={{ color: 'var(--green)' }}>₹{slip.net}</strong></td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => alert(`Downloading Payslip invoice reference: ${slip.id}`)}>{strings.payslipBtn}</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 9: PORTFOLIO ACHIEVEMENTS */}
                {activeTeacherTab === 'achievements' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>{strings.portfolioTitle}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                            {/* Add portfolio form */}
                            <form onSubmit={handlePostAward} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div className="form-group">
                                    <label>{strings.awardTitle}</label>
                                    <input type="text" placeholder="e.g. Best Teacher in Math 2026" value={awardTitleVal} onChange={(e) => setAwardTitleVal(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>{strings.awardDetails}</label>
                                    <textarea rows="3" placeholder="Write description detail workshops or publications" value={awardDetailsVal} onChange={(e) => setAwardDetailsVal(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>{strings.submitAwardBtn}</button>
                            </form>

                            {/* Portfolio listings */}
                            <div>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '10px' }}>{strings.loggedAwardsTitle}</strong>
                                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {portfolioAwards.length === 0 ? (
                                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '12px', textAlign: 'center', padding: '20px' }}>{strings.noAwards}</div>
                                    ) : (
                                        portfolioAwards.map((item, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                    <span style={{ color: 'var(--primary)' }}>🏆 {item.title}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{fmtDate(item.date)}</span>
                                                </div>
                                                <div style={{ color: '#444', marginTop: '4px' }}>{item.details}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 10: RESIGNATION & EXIT */}
                {activeTeacherTab === 'resign' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px' }}>🚪 exit Clearance Resignations & notice Tracker</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                            
                            {/* Request form */}
                            <form onSubmit={handlePostResign} style={{ background: '#fff9f9', border: '1px solid rgba(139,26,26,0.15)', padding: '20px', borderRadius: '8px' }}>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '15px', color: 'var(--red)' }}>{strings.resignTitle}</strong>
                                {resignSubmitted ? (
                                    <div style={{ background: '#fce4d6', border: '1px solid #f4b183', color: 'var(--red)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                                        ✅ Resignation notice submitted. Clearance processes are active.
                                    </div>
                                ) : null}
                                <div className="form-group">
                                    <label>{strings.resignReason}</label>
                                    <input type="text" placeholder="Write reason for exit..." value={exitReasonVal} onChange={(e) => setExitReasonVal(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>{strings.noticePeriod}</label>
                                    <select value={exitNoticeVal} onChange={(e) => setExitNoticeVal(e.target.value)}>
                                        <option value="30 Days">30 Days Standard</option>
                                        <option value="15 Days">15 Days Short notice</option>
                                        <option value="None">{strings.immWithdrawal}</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '15px' }}>{strings.submitResignBtn}</button>
                            </form>

                            {/* Status tracker */}
                            <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px' }}>
                                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '12px' }}>{strings.clearanceStatusTitle}</strong>
                                {teacherRecord?.extended_info?.exit_clearance ? (
                                    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                        <div>{strings.exitDateLogged}<strong>{teacherRecord.extended_info.exit_clearance.resignation_date}</strong></div>
                                        <div>{strings.clearanceNoticeLabel}<strong>{teacherRecord.extended_info.exit_clearance.notice_period}</strong></div>
                                        <div>{strings.checklistStateLabel}<strong style={{ color: 'var(--gold)' }}>{teacherRecord.extended_info.exit_clearance.clearance}</strong></div>
                                        <div style={{ marginTop: '15px', padding: '10px', borderRadius: '6px', background: '#eaeaea', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                                            ⏳ exit process clearance is currently active at Accounts and Library desk registrar.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '12px' }}>{strings.clearanceInactive}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 11: AI TEACHER ASSISTANT PLAYGROUND */}
                {activeTeacherTab === 'ai' && (
                    <div>
                        <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icons.Cpu size={20} color="var(--primary)" />
                            <span>Vidyut AI Assistant - Intelligent Teaching Playground</span>
                        </div>
                        
                        {/* Selector Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px', overflowX: 'auto' }}>
                            {[
                                { id: 'lesson', label: 'Lesson Planner', desc: strings.aiLessonPlan, icon: <Icons.Book size={14} /> },
                                { id: 'quiz', label: 'Quiz Maker', desc: strings.aiQuiz, icon: <Icons.Clipboard size={14} /> },
                                { id: 'paper', label: 'Question Paper', desc: strings.aiQuestionPaper, icon: <Icons.Document size={14} /> },
                                { id: 'remarks', label: 'Report remarks', desc: strings.aiRemarks, icon: <Icons.Edit size={14} /> }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)',
                                        background: aiActiveTool === t.id ? 'var(--primary)' : 'transparent',
                                        color: aiActiveTool === t.id ? '#fff' : 'var(--text-secondary)',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                    onClick={() => { setAiActiveTool(t.id); setAiResult(''); }}
                                >
                                    {t.icon}
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                            {/* Generator Prompt Box */}
                            <form onSubmit={handleTriggerAI} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)' }}>
                                    <Icons.Cpu size={14} /> Config Generator Prompts
                                </strong>
                                
                                {aiActiveTool === 'remarks' ? (
                                    <div className="form-group">
                                        <label>{strings.studentRemarksHelp}</label>
                                        <select value={aiSelectedStudent} onChange={(e) => setAiSelectedStudent(e.target.value)} required>
                                            <option value="">{strings.selectStudentLabel}</option>
                                            {studentsList.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} (Grade: {s.grade || 'B'})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>{strings.aiTopicInput}</label>
                                            <input type="text" placeholder="e.g. Gravity and Motion, Quadratic Equations" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.aiClassInput}</label>
                                            <select value={aiClass} onChange={(e) => setAiClass(e.target.value)}>
                                                <option value="1st">{strings.class1st}</option>
                                                <option value="2nd">{strings.class2nd}</option>
                                                <option value="3rd">{strings.class3rd}</option>
                                                <option value="4th">{strings.class4th}</option>
                                                <option value="5th">{strings.class5th}</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <button type="submit" className={`btn btn-primary ${aiGenerating ? 'btn-loading' : ''}`} disabled={aiGenerating} style={{ marginTop: '10px' }}>
                                    {aiGenerating ? '' : strings.aiPromptBtn}
                                </button>
                            </form>

                            {/* Generator result console */}
                            <div style={{ background: '#222', color: '#a9d18e', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                                <div style={{ borderBottom: '1px solid #444', paddingBottom: '6px', color: '#fff', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{strings.aiResultsTitle}</span>
                                    <span style={{ color: 'var(--gold)' }}>● Vidyut AI V2.1</span>
                                </div>
                                {aiGenerating ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: '1', fontStyle: 'italic' }}>
                                        {strings.aiGenerating}
                                    </div>
                                ) : aiResult ? (
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{aiResult}</div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: '1', color: '#666', fontStyle: 'italic' }}>
                                        {strings.aiConfigHelp}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}
