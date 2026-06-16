'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { Icons } from '../ui/Icons';
import { fmtDate } from '../../lib/marksUtils';

const getTabIcon = (tabId) => {
    switch (tabId) {
        case 'bio': return <Icons.User size={14} style={{ marginRight: '6px' }} />;
        case 'quals': return <Icons.Academic size={14} style={{ marginRight: '6px' }} />;
        case 'docs': return <Icons.Document size={14} style={{ marginRight: '6px' }} />;
        case 'payroll': return <Icons.Fee size={14} style={{ marginRight: '6px' }} />;
        case 'allocations': return <Icons.Clipboard size={14} style={{ marginRight: '6px' }} />;
        case 'leaves': return <Icons.Clock size={14} style={{ marginRight: '6px' }} />;
        case 'achievements': return <Icons.Trophy size={14} style={{ marginRight: '6px' }} />;
        case 'timeline': return <Icons.Clock size={14} style={{ marginRight: '6px' }} />;
        case 'exit': return <Icons.Close size={14} style={{ marginRight: '6px' }} />;
        default: return null;
    }
};

// Centralized strings dictionary for JSX internationalization
const strings = {
    loadingStaffDirectory: 'Loading staff directory...',
    totalStaff: 'Total Staff',
    activeStaff: 'Active Staff',
    monthlyPayroll: 'Monthly Payroll',
    teacherStaffDirectory: 'Teacher & Staff Directory',
    addTeacher: 'Add Teacher',
    editTeacherDetails: 'Edit Teacher Details',
    onboardTeacher: 'Onboard Teacher',
    fullName: 'Full Name *',
    emailAddress: 'Email Address *',
    mobileNumber: 'Mobile Number *',
    qualification: 'Qualification *',
    joiningDate: 'Date of Joining',
    monthlySalary: 'Monthly Salary (INR)',
    status: 'Status',
    assignClassTeacher: 'Assign Class Teacher',
    noClassAssigned: 'No Class Assigned',
    cancel: 'Cancel',
    saveTeacherInfo: 'Save Teacher Info',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    noTeacherOnboard: 'Koi teacher onboard nahi hai',
    name: 'Name',
    qualificationLabel: 'Qualification',
    phone: 'Phone',
    classTeacher: 'Class Teacher',
    salary: 'Salary',
    action: 'Action',
    editBtn: 'Edit & Hub',
    department: 'Department',
    designation: 'Designation',
    employmentType: 'Employment Type',
    teacherCode: 'Teacher Code',
    employeeId: 'Employee ID',
    gender: 'Gender',
    dateOfBirth: 'Date of Birth',
    bloodGroup: 'Blood Group',
    maritalStatus: 'Marital Status',
    aadhaarPan: 'Aadhaar / PAN Number',
    permanentAddress: 'Permanent Address',
    currentAddress: 'Current Address',
    emergencyContact: 'Emergency Contact',
    graduation: 'Graduation Degree',
    postGraduation: 'Post Graduation Degree',
    bedMed: 'B.Ed / M.Ed Details',
    certifications: 'Professional Certifications',
    experienceDetails: 'Experience Details (History)',
    documentCategory: 'Document Category',
    chooseFile: 'Choose File',
    uploadFile: 'Upload File',
    documentName: 'Document Name',
    fileNameReference: 'File Name Reference',
    dateUploaded: 'Date Uploaded',
    fileSize: 'File Size',
    options: 'Options',
    lockerIsEmpty: 'Locker is empty. Upload essential certificates above.',
    basicSalary: 'Basic Salary (₹) *',
    allowances: 'HRA & Allowances (₹)',
    bonus: 'Bonus / Incentives (₹)',
    deductions: 'PF & Deductions (₹)',
    generatePayslip: 'Generate Payslip',
    payslipMonth: 'Payslip Month',
    payslipBasic: 'Basic',
    payslipAllowances: 'Allowances',
    payslipDeductions: 'Deductions',
    payslipNet: 'Net Salary',
    noPayslips: 'No monthly payslips generated yet.',
    leaveType: 'Leave Type',
    leaveFrom: 'From Date',
    leaveTo: 'To Date',
    leaveReason: 'Reason',
    workflowApproval: 'Workflow Approval Action',
    approveBtn: 'Approve Leave',
    rejectBtn: 'Reject Leave',
    noLeaveRequests: 'No pending HOD/Principal leave requests.',
    awardName: 'Award / Workshop Name',
    achievementDetails: 'Achievement Details',
    logAchievement: 'Log Achievement',
    noAchievements: 'No achievements logged in portfolio.',
    resignationReason: 'Resignation Reason',
    noticePeriod: 'Notice Period',
    clearanceStatus: 'Clearance Status',
    processSettlement: 'Process Final Settlement',
    experienceCert: 'Generate Experience Cert',
    noResignations: 'No resignation or exit clearance requests.',
    datePassed: 'Date Passed',
    actionPassed: 'Action Taken',
    detailsPassed: 'Details',
    selectSubject: 'Select Subject',
    periodSchedule: 'Period Schedule',
    classroomAllocation: 'Classroom Allocation',
    assignSubjectBtn: 'Assign Class & Subject',
    noAssignments: 'No subjects or classes assigned.'
};

export default function TeacherList({ currentUser, showToast }) {
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Active Admin Tab
    const [activeAdminTab, setActiveAdminTab] = useState('bio');

    // Onboarding Panel state
    const [onboarding, setOnboarding] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);

    // FORM BINDINGS (Basic & Onboarding)
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [qualification, setQualification] = useState('');
    const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
    const [salary, setSalary] = useState(0);
    const [status, setStatus] = useState('ACTIVE');
    const [assignedClass, setAssignedClass] = useState(''); // Class teacher allocation
    
    const [employeeId, setEmployeeId] = useState('');
    const [teacherCode, setTeacherCode] = useState('');
    const [employmentType, setEmploymentType] = useState('Full-Time');
    const [department, setDepartment] = useState('Science');
    const [designation, setDesignation] = useState('Assistant Teacher');

    // 1. BIO & PERSONAL STATES
    const [editGender, setEditGender] = useState('MALE');
    const [editDob, setEditDob] = useState('');
    const [editBloodGroup, setEditBloodGroup] = useState('A+');
    const [editMarital, setEditMarital] = useState('SINGLE');
    const [editAadhaar, setEditAadhaar] = useState('');
    const [editPermAddr, setEditPermAddr] = useState('');
    const [editCurrAddr, setEditCurrAddr] = useState('');
    const [editEmerg, setEditEmerg] = useState('');

    // 2. QUALIFICATION & EXPERIENCE STATES
    const [qualGrad, setQualGrad] = useState('');
    const [qualPostGrad, setQualPostGrad] = useState('');
    const [qualBed, setQualBed] = useState('');
    const [qualCerts, setQualCerts] = useState('');
    const [expHistory, setExpHistory] = useState('');

    // 3. DOCUMENT MANAGEMENT STATES
    const [uploadDocCategory, setUploadDocCategory] = useState('Aadhaar Card');
    const [docUploading, setDocUploading] = useState(false);

    // 4. PAYROLL LEDGER STATES
    const [payrollMonth, setPayrollMonth] = useState('2026-06');
    const [payrollBasic, setPayrollBasic] = useState('25000');
    const [payrollAllow, setPayrollAllow] = useState('5000');
    const [payrollBonus, setPayrollBonus] = useState('0');
    const [payrollDeduct, setPayrollDeduct] = useState('2000');
    const [generatedPayslips, setGeneratedPayslips] = useState([]);

    // 5. SUBJECT & CLASS ASSIGNMENT STATES
    const [assignClass, setAssignClass] = useState('1st');
    const [assignSec, setAssignSec] = useState('A');
    const [assignSub, setAssignSub] = useState('Mathematics');
    const [assignRoom, setAssignRoom] = useState('Room 101');
    const [assignPeriod, setAssignPeriod] = useState('Period 1 (08:30 AM)');

    // 6. LEAVES WORKFLOW STATES
    const [leavesList, setLeavesList] = useState([]);

    // 7. ACHIEVEMENTS STATES
    const [achTitle, setAchTitle] = useState('');
    const [achDetails, setAchDetails] = useState('');

    // 8. EXIT MANAGEMENT STATES
    const [exitReason, setExitReason] = useState('');
    const [exitNotice, setExitNotice] = useState('30 Days');
    const [exitClearance, setExitClearance] = useState('In Progress');

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (editingTeacher) {
            setFullName(editingTeacher.full_name || '');
            setEmail(editingTeacher.email || '');
            setPhone(editingTeacher.phone || '');
            setQualification(editingTeacher.qualification || '');
            setJoiningDate(editingTeacher.joining_date || '');
            setSalary(editingTeacher.salary || 0);
            setStatus(editingTeacher.status || 'ACTIVE');

            // Set Extended Values
            setEmployeeId(editingTeacher.employee_id || '');
            setTeacherCode(editingTeacher.teacher_code || '');
            setEmploymentType(editingTeacher.employment_type || 'Full-Time');
            setDepartment(editingTeacher.department || 'Science');
            setDesignation(editingTeacher.designation || 'Assistant Teacher');

            const ext = editingTeacher.extended_info || {};
            setEditGender(ext.gender || 'MALE');
            setEditDob(ext.dob || '');
            setEditBloodGroup(ext.blood_group || 'A+');
            setEditMarital(ext.marital_status || 'SINGLE');
            setEditAadhaar(ext.aadhaar || '');
            setEditPermAddr(ext.permanent_address || '');
            setEditCurrAddr(ext.current_address || '');
            setEditEmerg(ext.emergency_contact || '');

            // Quals
            const q = ext.qualifications || {};
            setQualGrad(q.graduation || '');
            setQualPostGrad(q.post_graduation || '');
            setQualBed(q.bed_med || '');
            setQualCerts(q.certifications || '');
            setExpHistory(ext.experience_history || '');

            // Sub systems lists
            setGeneratedPayslips(ext.payslips || []);
            setLeavesList(ext.leaves || []);

            // Check assigned class
            const cls = classes.find(c => c.class_teacher_id === editingTeacher.id);
            setAssignedClass(cls ? cls.class_name : '');
        }
    }, [editingTeacher]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: teacherData, error: tErr } = await db
                .from('teachers')
                .select('*')
                .order('full_name');
            if (tErr) throw tErr;

            const { data: classData, error: cErr } = await db
                .from('classes')
                .select('*')
                .order('class_name');
            if (cErr) throw cErr;

            setTeachers(teacherData || []);
            setClasses(classData || []);
        } catch (e) {
            console.error('Error loading teacher directory:', e);
            showToast('Load Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTeacher = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) {
            showToast('Full Name required!', 'error');
            return;
        }

        setFormLoading(true);
        
        let finalEmpId = employeeId.trim();
        if (!finalEmpId) {
            finalEmpId = `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        let finalCode = teacherCode.trim();
        if (!finalCode) {
            finalCode = `TCH-${Math.floor(100 + Math.random() * 899)}`;
        }

        const existingExt = editingTeacher?.extended_info || {};
        const extPayload = {
            ...existingExt,
            gender: editGender,
            dob: editDob,
            blood_group: editBloodGroup,
            marital_status: editMarital,
            aadhaar: editAadhaar,
            permanent_address: editPermAddr,
            current_address: editCurrAddr,
            emergency_contact: editEmerg,
            qualifications: existingExt.qualifications || {
                graduation: qualGrad,
                post_graduation: qualPostGrad,
                bed_med: qualBed,
                certifications: qualCerts
            },
            experience_history: expHistory,
            documents: existingExt.documents || [],
            payslips: existingExt.payslips || [],
            leaves: existingExt.leaves || [
                { id: '1', type: 'Casual Leave', from: '2026-05-10', to: '2026-05-11', reason: 'Personal work', status: 'Approved' }
            ],
            assigned_classes: existingExt.assigned_classes || [
                { id: '1', class: '1st', section: 'A', subject: 'Mathematics', room: 'Room 101', period: 'Period 1 (08:30 AM)' }
            ],
            timetable: existingExt.timetable || [
                { day: 'Monday', period: 'Period 1', class: '1st', section: 'A', subject: 'Mathematics', room: 'Room 101' },
                { day: 'Wednesday', period: 'Period 3', class: '2nd', section: 'B', subject: 'English', room: 'Room 103' }
            ],
            achievements: existingExt.achievements || [],
            timeline: existingExt.timeline || [
                { action: 'Teacher Onboarded', date: new Date().toISOString().split('T')[0], details: `Staff profile generated with Employee ID: ${finalEmpId}` }
            ],
            exit_clearance: existingExt.exit_clearance || null
        };

        const payload = {
            full_name: fullName.trim().toUpperCase(),
            email: email.trim().toLowerCase() || null,
            phone: phone.trim() || null,
            qualification: qualification.trim().toUpperCase() || null,
            joining_date: joiningDate || null,
            salary: Number(salary) || 0,
            status: status,
            employee_id: finalEmpId,
            teacher_code: finalCode,
            employment_type: employmentType,
            department: department,
            designation: designation,
            extended_info: extPayload
        };

        try {
            let teacherId = editingTeacher?.id;

            if (editingTeacher) {
                const { error } = await db
                    .from('teachers')
                    .update(payload)
                    .eq('id', editingTeacher.id);
                if (error) throw error;
                showToast('Teacher details updated!', 'success');
            } else {
                const { data, error } = await db
                    .from('teachers')
                    .insert([payload])
                    .select();
                if (error) throw error;
                teacherId = data[0].id;
                showToast('New Teacher onboarded!', 'success');
            }

            // Handle Class Teacher Assignment
            if (isHighAccess) {
                await db
                    .from('classes')
                    .update({ class_teacher_id: null })
                    .eq('class_teacher_id', teacherId);

                if (assignedClass) {
                    await db
                        .from('classes')
                        .update({ class_teacher_id: teacherId })
                        .eq('class_name', assignedClass);
                }
            }

            clearForm();
            loadData();
        } catch (e) {
            console.error('Save teacher error:', e);
            showToast('Save Error: ' + e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    // UPDATE DYNAMIC SUB-TABS ON REAL-TIME
    const handleUpdateTeacherField = async (updatedFields, extFields = null, timelineAction = null) => {
        try {
            let payload = { ...updatedFields };
            const currentExt = editingTeacher.extended_info || {};
            let newExt = { ...currentExt };
            
            if (extFields) {
                newExt = { ...newExt, ...extFields };
            }
            
            if (timelineAction) {
                const timeline = newExt.timeline || [];
                timeline.push({
                    action: timelineAction.action,
                    date: new Date().toISOString().split('T')[0],
                    details: timelineAction.details
                });
                newExt.timeline = timeline;
            }

            payload.extended_info = newExt;

            const { data, error } = await db
                .from('teachers')
                .update(payload)
                .eq('id', editingTeacher.id)
                .select()
                .single();

            if (error) throw error;
            setEditingTeacher(data);
            showToast('Record changes saved!', 'success');
            loadData();
        } catch (e) {
            console.error(e);
            showToast('Update failed: ' + e.message, 'error');
        }
    };

    // DOCUMENT UPLOAD SIMULATION
    const handleUploadDoc = (e) => {
        e.preventDefault();
        setDocUploading(true);
        setTimeout(() => {
            const docs = editingTeacher.extended_info?.documents || [];
            docs.push({
                name: uploadDocCategory,
                fileName: `${uploadDocCategory.toLowerCase().replace(/ /g, '_')}_${editingTeacher.employee_id.toLowerCase()}.pdf`,
                uploadedAt: new Date().toISOString().split('T')[0],
                size: '1.8 MB'
            });
            handleUpdateTeacherField({}, { documents: docs }, {
                action: 'Document Uploaded',
                details: `New professional document added: ${uploadDocCategory}`
            });
            setDocUploading(false);
            showToast('Document uploaded successfully!', 'success');
        }, 1500);
    };

    // PAYROLL SLIP GENERATION
    const handleGeneratePayslip = (e) => {
        e.preventDefault();
        const slips = [...generatedPayslips];
        
        const basic = Number(payrollBasic) || 0;
        const allow = Number(payrollAllow) || 0;
        const bonus = Number(payrollBonus) || 0;
        const deduct = Number(payrollDeduct) || 0;
        const net = basic + allow + bonus - deduct;

        const newSlip = {
            id: `PAY-${Math.floor(1000 + Math.random()*9000)}`,
            month: payrollMonth,
            basic,
            allow,
            bonus,
            deduct,
            net,
            generatedAt: new Date().toLocaleDateString()
        };

        slips.push(newSlip);
        handleUpdateTeacherField({}, { payslips: slips }, {
            action: 'Salary Generated',
            details: `Monthly Salary Slip generated for Month: ${payrollMonth} (Net Pay: ₹${net})`
        });
        setGeneratedPayslips(slips);
        showToast('Salary slips created successfully!', 'success');
    };

    // LEAVE WORKFLOW APPROVALS
    const handleProcessLeave = (leaveId, approve) => {
        const list = leavesList.map(l => {
            if (l.id === leaveId) {
                return { ...l, status: approve ? 'Approved' : 'Rejected' };
            }
            return l;
        });
        handleUpdateTeacherField({}, { leaves: list }, {
            action: 'Leave Approved',
            details: `Leave request ${approve ? 'Approved' : 'Rejected'} by Administrative HOD`
        });
        setLeavesList(list);
    };

    // ADD SUBJECT ASSIGNMENT
    const handleAddAssignment = (e) => {
        e.preventDefault();
        const classesList = editingTeacher.extended_info?.assigned_classes || [];
        
        const newAssign = {
            id: `${Math.floor(10 + Math.random()*89)}`,
            class: assignClass,
            section: assignSec,
            subject: assignSub,
            room: assignRoom,
            period: assignPeriod
        };
        classesList.push(newAssign);

        handleUpdateTeacherField({}, { assigned_classes: classesList }, {
            action: 'Class Changed',
            details: `Assigned new Class workload: ${assignClass} - ${assignSec} for Subject: ${assignSub}`
        });
    };

    // LOG PORTFOLIO ACHIEVEMENTS
    const handleLogAchievement = (e) => {
        e.preventDefault();
        if (!achTitle.trim()) return;

        const currentAch = editingTeacher.extended_info?.achievements || [];
        currentAch.push({
            title: achTitle.trim(),
            details: achDetails.trim(),
            date: new Date().toISOString().split('T')[0]
        });

        handleUpdateTeacherField({}, { achievements: currentAch });
        setAchTitle('');
        setAchDetails('');
        showToast('Achievement added to teacher portfolio!', 'success');
    };

    // RESIGNATION CLEARANCE
    const handleResignExit = (e) => {
        e.preventDefault();
        const exitObj = {
            resignation_date: new Date().toISOString().split('T')[0],
            reason: exitReason.trim(),
            notice_period: exitNotice,
            clearance: exitClearance,
            settlement_amount: salary * 2 // Gratuity mock
        };

        handleUpdateTeacherField({}, { exit_clearance: exitObj }, {
            action: 'Resignation Submitted',
            details: `Resignation submitted under notice period: ${exitNotice}. Reason: ${exitReason}`
        });
        showToast('Resignation recorded! Exit clearance in progress.', 'success');
    };

    const handleDelete = async (id) => {
        if (!isHighAccess) return;
        if (!confirm('Kya aap sach mein is teacher profile ko delete karna chahte hain?')) return;

        setLoading(true);
        try {
            const { error } = await db.from('teachers').delete().eq('id', id);
            if (error) throw error;
            showToast('Teacher profile removed!', 'success');
            loadData();
        } catch (e) {
            console.error('Delete teacher error:', e);
            showToast('Delete Failed: ' + e.message, 'error');
            setLoading(false);
        }
    };

    const clearForm = () => {
        setEditingTeacher(null);
        setFullName('');
        setEmail('');
        setPhone('');
        setQualification('');
        setJoiningDate(new Date().toISOString().split('T')[0]);
        setSalary(0);
        setStatus('ACTIVE');
        setAssignedClass('');
        setOnboarding(false);
    };

    // Stats
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter(t => t.status === 'ACTIVE').length;
    const payrollTotal = teachers.reduce((sum, t) => sum + (t.salary || 0), 0);

    const getClassTeacherLabel = (teacherId) => {
        const cls = classes.find(c => c.class_teacher_id === teacherId);
        return cls ? `Class ${cls.class_name}` : '—';
    };

    return (
        <div>
            {/* Stats Header */}
            <div className="stats-row" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="number">{totalTeachers}</div>
                    <div className="label">{strings.totalStaff}</div>
                </div>
                <div className="stat-card">
                    <div className="number" style={{ color: 'var(--green)' }}>{activeTeachers}</div>
                    <div className="label">{strings.activeStaff}</div>
                </div>
                <div className="stat-card">
                    <div className="number" style={{ color: 'var(--gold)' }}>₹{payrollTotal}</div>
                    <div className="label">{strings.monthlyPayroll}</div>
                </div>
            </div>

            {/* Hub Dashboard Tab view when editing/viewing staff */}
            {editingTeacher ? (
                <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '25px' }}>
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #104e8b 0%, rgba(20,20,20,0.9) 100%)',
                            padding: '20px 25px',
                            color: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            borderBottom: '3px solid #1e90ff'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icons.Teacher size={32} color="#fff" />
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '800' }}>{editingTeacher.full_name}</h2>
                                <p style={{ margin: '0', fontSize: '13px', opacity: 0.85 }}>
                                    Employee ID: <strong>{editingTeacher.employee_id}</strong> | Code: <strong>{editingTeacher.teacher_code}</strong> | Type: <strong>{editingTeacher.employment_type}</strong>
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.User size={12} /> {editingTeacher.designation}
                            </span>
                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: 'var(--green)' }}>
                                {editingTeacher.status}
                            </span>
                        </div>
                    </div>

                    {/* Admin Staff Navigation Tabs */}
                    <div style={{ display: 'flex', background: '#f8f9fa', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                        {[
                            { id: 'bio', label: 'Biography Info' },
                            { id: 'quals', label: 'Qualifications & Exp' },
                            { id: 'docs', label: 'Document Locker' },
                            { id: 'payroll', label: 'Payroll Ledger' },
                            { id: 'allocations', label: 'Assignments' },
                            { id: 'leaves', label: 'Leave Workflow' },
                            { id: 'achievements', label: 'Achievements' },
                            { id: 'timeline', label: 'Activity Log' },
                            { id: 'exit', label: 'Exit Clearance' }
                        ].map(t => (
                            <button
                                key={t.id}
                                style={{
                                    padding: '12px 18px',
                                    border: 'none',
                                    background: activeAdminTab === t.id ? '#fff' : 'transparent',
                                    borderBottom: activeAdminTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeAdminTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: activeAdminTab === t.id ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                }}
                                onClick={() => setActiveAdminTab(t.id)}
                            >
                                {getTabIcon(t.id)}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB CONTENT */}
                    <div style={{ padding: '25px' }}>
                        
                        {/* TAB 1: BIO */}
                        {activeAdminTab === 'bio' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.User size={16} /> Personal Biography Info & Contact
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateTeacherField({}, {
                                        gender: editGender,
                                        dob: editDob,
                                        blood_group: editBloodGroup,
                                        marital_status: editMarital,
                                        aadhaar: editAadhaar,
                                        permanent_address: editPermAddr,
                                        current_address: editCurrAddr,
                                        emergency_contact: editEmerg
                                    });
                                }}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>{strings.gender}</label>
                                            <select value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.dateOfBirth}</label>
                                            <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.bloodGroup}</label>
                                            <select value={editBloodGroup} onChange={(e) => setEditBloodGroup(e.target.value)}>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="AB+">AB+</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.maritalStatus}</label>
                                            <select value={editMarital} onChange={(e) => setEditMarital(e.target.value)}>
                                                <option value="SINGLE">Single</option>
                                                <option value="MARRIED">Married</option>
                                                <option value="DIVORCED">Divorced</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.aadhaarPan}</label>
                                            <input type="text" value={editAadhaar} onChange={(e) => setEditAadhaar(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.emergencyContact}</label>
                                            <input type="text" placeholder="Name & contact phone" value={editEmerg} onChange={(e) => setEditEmerg(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>{strings.permanentAddress}</label>
                                            <input type="text" value={editPermAddr} onChange={(e) => setEditPermAddr(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>{strings.currentAddress}</label>
                                            <input type="text" value={editCurrAddr} onChange={(e) => setEditCurrAddr(e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Icons.Save size={14} /> Save Biography Profile
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 2: QUALIFICATIONS */}
                        {activeAdminTab === 'quals' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Academic size={16} /> Academic Qualifications & Experience
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateTeacherField({}, {
                                        qualifications: {
                                            graduation: qualGrad,
                                            post_graduation: qualPostGrad,
                                            bed_med: qualBed,
                                            certifications: qualCerts
                                        },
                                        experience_history: expHistory
                                    });
                                }}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>{strings.graduation}</label>
                                            <input type="text" placeholder="e.g. B.Sc (Physics) - DU" value={qualGrad} onChange={(e) => setQualGrad(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.postGraduation}</label>
                                            <input type="text" placeholder="e.g. M.Sc (Physics) - JNU" value={qualPostGrad} onChange={(e) => setQualPostGrad(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.bedMed}</label>
                                            <input type="text" placeholder="B.Ed / M.Ed certifications" value={qualBed} onChange={(e) => setQualBed(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.certifications}</label>
                                            <input type="text" placeholder="e.g. CTET Passed, IELTS" value={qualCerts} onChange={(e) => setQualCerts(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                            <label>{strings.experienceDetails}</label>
                                            <textarea rows="3" placeholder="Description of past institutions served and tenure" value={expHistory} onChange={(e) => setExpHistory(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}></textarea>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Icons.Save size={14} /> Save Qualifications & Qualifications
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB 3: DOCUMENTS VAULT */}
                        {activeAdminTab === 'docs' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Document size={16} /> Staff Credentials Document Locker
                                </div>
                                <form onSubmit={handleUploadDoc} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: '1', minWidth: '180px' }}>
                                            <label>{strings.documentCategory}</label>
                                            <select value={uploadDocCategory} onChange={(e) => setUploadDocCategory(e.target.value)}>
                                                <option value="Aadhaar Card">Aadhaar Card</option>
                                                <option value="PAN Card">PAN Card</option>
                                                <option value="Qualification Cert">Qualifications Certificate</option>
                                                <option value="Past Experience Cert">Experience Verification Cert</option>
                                                <option value="Latest Resume">Resume / CV Document</option>
                                                <option value="Appointment Letter">Appointment Letter</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: '1', minWidth: '180px' }}>
                                            <label>{strings.chooseFile}</label>
                                            <input type="file" disabled={docUploading} />
                                        </div>
                                        <button type="submit" className={`btn btn-primary ${docUploading ? 'btn-loading' : ''}`} disabled={docUploading} style={{ height: '38px' }}>
                                            {docUploading ? '' : strings.uploadFile}
                                        </button>
                                    </div>
                                </form>

                                <div className="table-scroll">
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>{strings.documentName}</th>
                                                <th>{strings.fileNameReference}</th>
                                                <th>{strings.dateUploaded}</th>
                                                <th>{strings.fileSize}</th>
                                                <th>{strings.options}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(editingTeacher.extended_info?.documents || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.lockerIsEmpty}</td>
                                                </tr>
                                            ) : (
                                                (editingTeacher.extended_info?.documents || []).map((doc, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{doc.name}</strong></td>
                                                        <td style={{ fontFamily: 'monospace' }}>{doc.fileName}</td>
                                                        <td>{doc.uploadedAt}</td>
                                                        <td>{doc.size}</td>
                                                        <td>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Opening document: ${doc.name}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <Icons.Download size={12} /> Download
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

                        {/* TAB 4: PAYROLL & SALARY */}
                        {activeAdminTab === 'payroll' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Fee size={16} /> Payroll setups & Monthly Slip Generator
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                                    
                                    {/* Generator Form */}
                                    <form onSubmit={handleGeneratePayslip} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '15px' }}>
                                            <Icons.Fee size={14} /> Generate Monthly Salary Slip
                                        </strong>
                                        <div className="form-group">
                                            <label>{strings.payslipMonth}</label>
                                            <input type="month" value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)} required />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.basicSalary}</label>
                                            <input type="number" value={payrollBasic} onChange={(e) => setPayrollBasic(e.target.value)} required />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.allowances}</label>
                                            <input type="number" value={payrollAllow} onChange={(e) => setPayrollAllow(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.bonus}</label>
                                            <input type="number" value={payrollBonus} onChange={(e) => setPayrollBonus(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginTop: '10px' }}>
                                            <label>{strings.deductions}</label>
                                            <input type="number" value={payrollDeduct} onChange={(e) => setPayrollDeduct(e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                            <Icons.Card size={14} /> Generate & Record Payslip
                                        </button>
                                    </form>

                                    {/* Payslips history ledger */}
                                    <div>
                                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '10px' }}>
                                            <Icons.Document size={14} /> Generated Salary Slips History
                                        </strong>
                                        <div style={{ maxHeight: '310px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {generatedPayslips.length === 0 ? (
                                                <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '20px', fontSize: '12px', textAlign: 'center' }}>{strings.noPayslips}</div>
                                            ) : (
                                                generatedPayslips.map(slip => (
                                                    <div key={slip.id} style={{ border: '1px solid #eee', background: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                            <span>Month: {slip.month}</span>
                                                            <span style={{ color: 'var(--green)' }}>Net: ₹{slip.net}</span>
                                                        </div>
                                                        <div style={{ color: 'var(--muted)', marginTop: '4px', fontSize: '10px' }}>
                                                            {strings.payslipBasic}: ₹{slip.basic} | {strings.payslipAllowances}: ₹{slip.allow} | {strings.payslipDeductions}: ₹{slip.deduct}
                                                        </div>
                                                        <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => alert(`Printing payslip invoice: ${slip.id}`)} style={{ padding: '2px 6px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <Icons.Download size={10} /> Payslip PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: ALLOCATIONS */}
                        {activeAdminTab === 'allocations' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Clipboard size={16} /> Assigned Subject Classes & Workload
                                </div>
                                
                                {/* Assign Class Form */}
                                <form onSubmit={handleAddAssignment} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
                                            <label>Class</label>
                                            <select value={assignClass} onChange={(e) => setAssignClass(e.target.value)}>
                                                <option value="1st">Class 1st</option>
                                                <option value="2nd">Class 2nd</option>
                                                <option value="3rd">Class 3rd</option>
                                                <option value="4th">Class 4th</option>
                                                <option value="5th">Class 5th</option>
                                                <option value="6th">Class 6th</option>
                                                <option value="7th">Class 7th</option>
                                                <option value="8th">Class 8th</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: '1', minWidth: '100px' }}>
                                            <label>Section</label>
                                            <select value={assignSec} onChange={(e) => setAssignSec(e.target.value)}>
                                                <option value="A">Sec A</option>
                                                <option value="B">Sec B</option>
                                                <option value="C">Sec C</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: '1', minWidth: '130px' }}>
                                            <label>{strings.selectSubject}</label>
                                            <select value={assignSub} onChange={(e) => setAssignSub(e.target.value)}>
                                                <option value="Mathematics">Mathematics</option>
                                                <option value="Science">Science</option>
                                                <option value="English">English</option>
                                                <option value="Computers">Computers</option>
                                                <option value="Hindi">Hindi</option>
                                                <option value="Social Science">Social Science</option>
                                                <option value="Sanskrit">Sanskrit</option>
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
                                            <label>{strings.classroomAllocation}</label>
                                            <input type="text" value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                            <label>{strings.periodSchedule}</label>
                                            <select value={assignPeriod} onChange={(e) => setAssignPeriod(e.target.value)}>
                                                <option value="Period 1 (08:30 AM)">Period 1 (08:30 AM)</option>
                                                <option value="Period 2 (09:15 AM)">Period 2 (09:15 AM)</option>
                                                <option value="Period 3 (10:00 AM)">Period 3 (10:00 AM)</option>
                                                <option value="Period 4 (11:15 AM)">Period 4 (11:15 AM)</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>{strings.assignSubjectBtn}</button>
                                    </div>
                                </form>

                                {/* Workloads list */}
                                <div className="table-scroll">
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Class & Sec</th>
                                                <th>Subject</th>
                                                <th>Classroom</th>
                                                <th>Schedule Period</th>
                                                <th>Options</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(editingTeacher.extended_info?.assigned_classes || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.noAssignments}</td>
                                                </tr>
                                            ) : (
                                                (editingTeacher.extended_info?.assigned_classes || []).map((asg, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>Class {asg.class} - {asg.section}</strong></td>
                                                        <td>{asg.subject}</td>
                                                        <td>{asg.room}</td>
                                                        <td>{asg.period}</td>
                                                        <td>
                                                            <button className="btn btn-danger btn-sm" onClick={() => {
                                                                const list = (editingTeacher.extended_info?.assigned_classes || []).filter(c => c.id !== asg.id);
                                                                handleUpdateTeacherField({}, { assigned_classes: list });
                                                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <Icons.Trash size={12} /> Remove
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

                        {/* TAB 6: LEAVES WORKFLOW */}
                        {activeAdminTab === 'leaves' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Clock size={16} /> Teacher Leave Requests Workflow & approvals
                                </div>
                                <div className="table-scroll">
                                    <table className="results-table" style={{ width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>{strings.leaveType}</th>
                                                <th>{strings.leaveFrom}</th>
                                                <th>{strings.leaveTo}</th>
                                                <th>{strings.leaveReason}</th>
                                                <th>Status</th>
                                                <th>{strings.workflowApproval}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leavesList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>{strings.noLeaveRequests}</td>
                                                </tr>
                                            ) : (
                                                leavesList.map(item => (
                                                    <tr key={item.id}>
                                                        <td><strong>{item.type}</strong></td>
                                                        <td>{fmtDate(item.from)}</td>
                                                        <td>{fmtDate(item.to)}</td>
                                                        <td>{item.reason}</td>
                                                        <td>
                                                            <span style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                background: item.status === 'Approved' ? '#e2f0d9' : item.status === 'Pending' ? '#fff2cc' : '#fce4d6',
                                                                color: item.status === 'Approved' ? 'var(--green)' : item.status === 'Pending' ? 'var(--gold)' : 'var(--red)'
                                                            }}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {item.status === 'Pending' ? (
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button className="btn btn-success btn-sm" onClick={() => handleProcessLeave(item.id, true)}>{strings.approveBtn}</button>
                                                                    <button className="btn btn-danger btn-sm" onClick={() => handleProcessLeave(item.id, false)}>{strings.rejectBtn}</button>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Logs Complete</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: ACHIEVEMENTS PORTFOLIO */}
                        {activeAdminTab === 'achievements' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Trophy size={16} /> Track Achievements & Workshops Portfolio
                                </div>
                                <form onSubmit={handleLogAchievement} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: '1', minWidth: '220px' }}>
                                            <label>{strings.awardName}</label>
                                            <input type="text" placeholder="e.g. Best Teacher Award 2025" value={achTitle} onChange={(e) => setAchTitle(e.target.value)} required />
                                        </div>
                                        <div className="form-group" style={{ flex: '2', minWidth: '300px' }}>
                                            <label>{strings.achievementDetails}</label>
                                            <input type="text" placeholder="Description of award/workshop credentials" value={achDetails} onChange={(e) => setAchDetails(e.target.value)} />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>{strings.logAchievement}</button>
                                    </div>
                                </form>

                                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '15px', background: '#fcfcfc', maxHeight: '200px', overflowY: 'auto' }}>
                                    {(editingTeacher.extended_info?.achievements || []).length === 0 ? (
                                        <div style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>{strings.noAchievements}</div>
                                    ) : (
                                        (editingTeacher.extended_info?.achievements || []).map((ach, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                    <span style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Icons.Trophy size={13} /> {ach.title}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(ach.date)}</span>
                                                </div>
                                                <div style={{ color: '#555', marginTop: '4px' }}>{ach.details}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 8: TIMELINE LOGS */}
                        {activeAdminTab === 'timeline' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Clock size={16} /> Real-time Staff timeline Activity log
                                </div>
                                <div style={{ position: 'relative', paddingLeft: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ position: 'absolute', left: '9px', top: '5px', bottom: '5px', width: '2px', background: '#ccc' }}></div>
                                    {(editingTeacher.extended_info?.timeline || []).map((tl, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '-26px', top: '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#104e8b', border: '2px solid #fff' }}></div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>{fmtDate(tl.date)}</div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', margin: '3px 0' }}>{tl.action}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tl.details}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 9: EXIT & CLEARANCES */}
                        {activeAdminTab === 'exit' && (
                            <div>
                                <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icons.Close size={16} /> Exit Resignation & Clearance Settlements
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    
                                    {/* Resign Submit */}
                                    <div style={{ background: '#fff9f9', border: '1px solid rgba(139,26,26,0.15)', borderRadius: '8px', padding: '15px' }}>
                                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '12px', color: 'var(--red)' }}>
                                            <Icons.Document size={14} /> Log Resignation Exit
                                        </strong>
                                        <form onSubmit={handleResignExit}>
                                            <div className="form-group">
                                                <label>{strings.resignationReason} *</label>
                                                <input type="text" placeholder="e.g. Relocating family" value={exitReason} onChange={(e) => setExitReason(e.target.value)} required />
                                            </div>
                                            <div className="form-group" style={{ marginTop: '10px' }}>
                                                <label>{strings.noticePeriod}</label>
                                                <select value={exitNotice} onChange={(e) => setExitNotice(e.target.value)}>
                                                    <option value="30 Days">30 Days Standard</option>
                                                    <option value="15 Days">15 Days Short Notice</option>
                                                    <option value="None (Immediate)">Immediate Exit</option>
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginTop: '10px' }}>
                                                <label>{strings.clearanceStatus}</label>
                                                <select value={exitClearance} onChange={(e) => setExitClearance(e.target.value)}>
                                                    <option value="In Progress">Clearance In Progress</option>
                                                    <option value="Approved">Cleared & Finalized</option>
                                                </select>
                                            </div>
                                            <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                                <Icons.Trash size={14} /> Record Exit Details
                                            </button>
                                        </form>
                                    </div>

                                    {/* Clearances checklist */}
                                    <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '10px' }}>
                                            <Icons.Clipboard size={14} /> Exit clearance checklist Status
                                        </strong>
                                        {editingTeacher.extended_info?.exit_clearance ? (
                                            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                                <div>Resigned: <strong>{editingTeacher.extended_info.exit_clearance.resignation_date}</strong></div>
                                                <div>Notice: <strong>{editingTeacher.extended_info.exit_clearance.notice_period}</strong></div>
                                                <div>Clearance: <strong style={{ color: editingTeacher.extended_info.exit_clearance.clearance === 'Approved' ? 'var(--green)' : 'var(--gold)' }}>{editingTeacher.extended_info.exit_clearance.clearance}</strong></div>
                                                <div>Settlement Gratuity: <strong>₹{editingTeacher.extended_info.exit_clearance.settlement_amount}</strong></div>
                                                <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => alert('Generating verified experience certificate PDF...')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Icons.Document size={12} /> Experience Cert
                                                    </button>
                                                    <button className="btn btn-primary btn-sm" onClick={() => alert('Processing secure bank transfer settlement...')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Icons.Card size={12} /> Settle Account
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '12px' }}>{strings.noResignations}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="btn-row" style={{ borderTop: '1px solid var(--border)', padding: '15px 25px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={clearForm} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.ArrowLeft size={14} /> Back to Teacher Directory
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Icons.Document size={14} /> Print Employee ID
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Teacher size={18} /> {strings.teacherStaffDirectory}
                        </span>
                        {isHighAccess && (
                            <button className="btn btn-primary btn-sm" onClick={() => setOnboarding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Plus size={12} /> Add Staff
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading">{strings.loadingStaffDirectory}</div>
                    ) : teachers.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">
                                <Icons.Teacher size={48} />
                            </div>
                            <p>{strings.noTeacherOnboard}</p>
                        </div>
                    ) : (
                        <div className="results-table-wrap" style={{ display: 'block' }}>
                            <div className="table-scroll" style={{ display: 'block' }}>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>{strings.name}</th>
                                            <th>{strings.qualificationLabel}</th>
                                            <th>{strings.phone}</th>
                                            <th>{strings.classTeacher}</th>
                                            <th>{strings.salary}</th>
                                            <th>{strings.status}</th>
                                            <th>{strings.action}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.map(t => (
                                            <tr key={t.id}>
                                                <td>
                                                    <strong>{t.full_name}</strong>
                                                    <br />
                                                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>{t.email || 'No email'}</small>
                                                </td>
                                                <td>{t.qualification || '—'}</td>
                                                <td>{t.phone || '—'}</td>
                                                <td>
                                                    <span className="session-badge" style={{ display: 'inline-block' }}>
                                                        {getClassTeacherLabel(t.id)}
                                                    </span>
                                                </td>
                                                <td><strong>₹{t.salary}</strong></td>
                                                <td>
                                                    <span style={{ color: t.status === 'ACTIVE' ? 'var(--green)' : 'var(--red)', fontWeight: '600', fontSize: '12px' }}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="btn btn-info btn-sm"
                                                            onClick={() => setEditingTeacher(t)}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Icons.Edit size={12} /> {strings.editBtn}
                                                        </button>
                                                        {isHighAccess && (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDelete(t.id)}
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Icons.Trash size={12} />
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

            {/* ONBOARDING DIALOG CONTAINER */}
            {onboarding && !editingTeacher && (
                <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '999' }}>
                    <div className="card" style={{ width: '600px', margin: '20px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="card-title" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Teacher size={18} /> Onboard Teacher & Staff
                        </div>
                        <form onSubmit={handleSaveTeacher}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{strings.fullName}</label>
                                    <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>{strings.emailAddress}</label>
                                    <input type="email" placeholder="teacher@school.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>{strings.mobileNumber}</label>
                                    <input type="text" placeholder="Primary phone mobile" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>{strings.qualification}</label>
                                    <input type="text" placeholder="Ex: M.Sc B.Ed" value={qualification} onChange={(e) => setQualification(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>{strings.joiningDate}</label>
                                    <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>{strings.monthlySalary}</label>
                                    <input type="number" placeholder="Salary" value={salary} onChange={(e) => setSalary(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>{strings.employmentType}</label>
                                    <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
                                        <option value="Full-Time">Full-Time Staff</option>
                                        <option value="Part-Time">Part-Time Faculty</option>
                                        <option value="Guest Faculty">Guest Faculty</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{strings.department}</label>
                                    <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                                        <option value="Science">Science Dept</option>
                                        <option value="Mathematics">Mathematics Dept</option>
                                        <option value="English">English Dept</option>
                                        <option value="Computers">Computer Science</option>
                                        <option value="Hindi">Hindi Dept</option>
                                        <option value="Social Science">Social Science Dept</option>
                                        <option value="Sanskrit">Sanskrit Dept</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{strings.designation}</label>
                                    <select value={designation} onChange={(e) => setDesignation(e.target.value)}>
                                        <option value="Assistant Teacher">Assistant Teacher</option>
                                        <option value="TGT Teacher">TGT Teacher</option>
                                        <option value="PGT Teacher">PGT Teacher</option>
                                        <option value="Head of Dept (HOD)">HOD Designation</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{strings.status}</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="ACTIVE">{strings.active}</option>
                                        <option value="INACTIVE">{strings.inactive}</option>
                                    </select>
                                </div>
                                {isHighAccess && (
                                    <div className="form-group">
                                        <label>{strings.assignClassTeacher}</label>
                                        <select value={assignedClass} onChange={(e) => setAssignedClass(e.target.value)}>
                                            <option value="">{strings.noClassAssigned}</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.class_name}>
                                                    Class {c.class_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setOnboarding(false)} style={{ flex: '1' }}>{strings.cancel}</button>
                                <button type="submit" className={`btn btn-primary ${formLoading ? 'btn-loading' : ''}`} disabled={formLoading} style={{ flex: '1' }}>
                                    {formLoading ? '' : strings.saveTeacherInfo}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
