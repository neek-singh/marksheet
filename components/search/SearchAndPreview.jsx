'use client';
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/supabase';
import { getStudentStatus, getGrade, fmtDate } from '../../lib/marksUtils';
import { Icons } from '../ui/Icons';

// Centralized strings dictionary for JSX internationalization
const strings = {
    loadingDetailedProfile: 'Loading detailed profile...',
    admissionNoLabel: 'Admission No: ',
    academicClass: 'Academic Class',
    nursery: 'Nursery',
    sectionPlacement: 'Section Placement',
    sectionA: 'Section A',
    sectionB: 'Section B',
    sectionC: 'Section C',
    sectionD: 'Section D',
    rollNumberAssignment: 'Roll Number Assignment',
    houseAssignment: 'House Assignment',
    redHouse: 'Red House',
    blueHouse: 'Blue House',
    greenHouse: 'Green House',
    yellowHouse: 'Yellow House',
    aadhaarCardNumber: 'Aadhaar Card Number',
    casteCategory: 'Caste Category',
    general: 'GENERAL',
    obc: 'OBC',
    dateOfBirth: 'Date of Birth',
    instructionMedium: 'Instruction Medium',
    hindi: 'HINDI',
    english: 'ENGLISH',
    admissionStatusTracking: 'Admission Status Tracking',
    previousSchoolDetails: 'Historical Previous School Details',
    fathersName: "Father's Name",
    fathersOccupation: "Father's Occupation",
    mothersName: "Mother's Name",
    mothersOccupation: "Mother's Occupation",
    guardianName: 'Guardian/Alternate Name',
    guardianContact: 'Guardian Contact Number',
    guardianEmail: 'Guardian Email Address',
    generateCredentials: "Generate credentials allowing parents to log in using the email '",
    documentCategory: 'Document Category',
    chooseFile: 'Choose File',
    documentName: 'Document Name',
    fileNameReference: 'File Name Reference',
    dateUploaded: 'Date Uploaded',
    fileSize: 'File Size',
    options: 'Options',
    lockerIsEmpty: 'Locker is empty. Upload essential certificates above.',
    presentDays: 'Present Days',
    absentDays: 'Absent Days',
    leaveDays: 'Leave Days',
    attendanceRate: 'Attendance Rate',
    adjustmentDate: 'Adjustment Date',
    attendanceState: 'Attendance State',
    remarksNotes: 'Remarks / Notes',
    date: 'Date',
    attendanceStatus: 'Attendance Status',
    adjustmentRemarks: 'Adjustment Remarks',
    noAttendanceLogs: 'No attendance logs recorded in DB yet.',
    comparingMarks: 'Comparing H.Y. & Annual Obtd Marks vs Max (100)',
    enterMarksHelp: 'Enter academic marks to generate dashboard chart.',
    subject: 'Subject',
    halfYearlyObtd: 'Half Yearly Obtd',
    annualObtd: 'Annual Obtd',
    aggregateScore: 'Aggregate Score',
    gradeBadge: 'Grade Badge',
    marksPendingHelp: 'Marks entries pending evaluation.',
    annualFeeStructure: 'Annual Fee Structure:',
    totalPaymentsRecorded: 'Total Payments Recorded:',
    outstandingLedgerBalance: 'Outstanding Ledger Balance:',
    amountCollected: 'Amount Collected (₹) *',
    feeSubCategory: 'Fee Sub-Category',
    tuitionFee: 'Tuition Fee',
    admissionFee: 'Admission Fee',
    examFee: 'Exam Fee',
    fineLateCharge: 'Fine / Late Charge',
    uniformMaterials: 'Uniform / Materials',
    paymentMethod: 'Payment Method',
    receiptDate: 'Receipt Date',
    feeCategory: 'Fee Category',
    amountReceived: 'Amount Received',
    noPaymentsRegistered: 'No payments registered yet.',
    bloodGroup: 'Blood Group',
    allergies: 'Drug / Food Allergies',
    medicalConditions: 'Active Medical Conditions / History',
    emergencyContactPerson: 'Emergency Contact Person',
    emergencyContactPhone: 'Emergency Contact Phone',
    doctorName: 'Authorized Family Doctor Name',
    doctorPhone: 'Doctor Contact Number',
    schoolName: 'VIDYA PORTAL SCHOOOL',
    classLabel: 'Class: ',
    rollNoLabel: 'Roll No: ',
    admNoLabel: 'Adm No: ',
    sessionLabel: 'Session: ',
    studentIdentity: 'STUDENT IDENTITY',
    guardianContactInfo: 'Guardian Contact & Info',
    fatherLabel: 'Father: ',
    emergCallLabel: 'Emerg Call: ',
    bloodGroupLabel: 'Blood Group: ',
    addressLabel: 'Address: ',
    returnToAdmin: 'If found, return to school admin.',
    targetPromotionClass: 'Target Promotion Class',
    selectPromotion: 'Select Promotion',
    tcDispatchNumber: 'TC Dispatch Number *',
    reasonForWithdrawal: 'Reason for Withdrawal *',
    schoolLeavingDate: 'School Leaving Date *',
    dispatchChannels: 'Dispatch Channels',
    messageContent: 'Message Content',
    dispatchedMessage: 'Dispatched Message',
    noMessagesLogged: 'No messages logged.',
    searchNameLabel: 'Name',
    searchRollLabel: 'Roll No.',
    searchClassLabel: 'Class',
    allClasses: 'All Classes',
    searchSessionLabel: 'Session',
    allSessions: 'All Sessions',
    searching: 'Searching...',
    searchEmptyState: 'Dhundhne ke liye roll, name, ya class select karein',
    status: 'Status',
    actionControls: 'Action Controls',
    classSection: 'Class - Section'
};

const shimmerCSS = `
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    .skeleton-cell {
        height: 14px;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite linear;
        border-radius: 4px;
        display: inline-block;
    }
`;

const SkeletonRow = () => (
    <tr style={{ height: '52px' }}>
        <td>
            <div className="skeleton-cell" style={{ width: '120px', height: '14px', fontWeight: 'bold' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '100px', height: '12px' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '60px', height: '14px' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '40px', height: '12px' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '40px', height: '12px' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '50px', height: '18px', borderRadius: '10px' }} />
        </td>
        <td>
            <div className="skeleton-cell" style={{ width: '60px', height: '18px', borderRadius: '10px' }} />
        </td>
        <td>
            <div style={{ display: 'flex', gap: '6px' }}>
                <div className="skeleton-cell" style={{ width: '45px', height: '24px', borderRadius: '4px' }} />
                <div className="skeleton-cell" style={{ width: '45px', height: '24px', borderRadius: '4px' }} />
                <div className="skeleton-cell" style={{ width: '55px', height: '24px', borderRadius: '4px' }} />
                <div className="skeleton-cell" style={{ width: '45px', height: '24px', borderRadius: '4px' }} />
            </div>
        </td>
    </tr>
);

export default function SearchAndPreview({
    currentUser,
    activeStudentId,
    onClosePreview,
    onDownloadPDF,
    onEnterMarks,
    onEditInfo,
    onDelete,
    showToast
}) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const [searchName, setSearchName] = useState('');
    const [searchRoll, setSearchRoll] = useState('');
    const [searchClass, setSearchClass] = useState('');
    const [searchSession, setSearchSession] = useState('');
    const [students, setStudents] = useState([]);
    const [previewStudent, setPreviewStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(null);
    const PAGE_SIZE = 15;
    const loaderRef = useRef(null);
    const hasMore = totalCount !== null && students.length < totalCount;

    // Active Tab in Admin Student Hub
    const [activeTab, setActiveTab] = useState('profile');

    // 1. BIO & ACADEMICS FORM STATES
    const [editClass, setEditClass] = useState('');
    const [editSection, setEditSection] = useState('A');
    const [editRoll, setEditRoll] = useState('');
    const [editHouse, setEditHouse] = useState('RED');
    const [editStatus, setEditStatus] = useState('Approved');
    const [editAadhaar, setEditAadhaar] = useState('');
    const [editApar, setEditApar] = useState('');
    const [editCaste, setEditCaste] = useState('');
    const [editCategory, setEditCategory] = useState('GENERAL');
    const [editMedium, setEditMedium] = useState('HINDI');
    const [editDob, setEditDob] = useState('');
    const [editPrevSchool, setEditPrevSchool] = useState('');

    // 2. PARENT FORM STATES
    const [fatherOcc, setFatherOcc] = useState('SELF-EMPLOYED');
    const [motherOcc, setMotherOcc] = useState('HOUSEWIFE');
    const [guardName, setGuardName] = useState('');
    const [guardContact, setGuardContact] = useState('');
    const [guardEmail, setGuardEmail] = useState('');
    const [parentLogin, setParentLogin] = useState(false);

    // 3. MEDICAL FORM STATES
    const [medAllergies, setMedAllergies] = useState('None');
    const [medConditions, setMedConditions] = useState('None');
    const [medEmergContact, setMedEmergContact] = useState('');
    const [medEmergPhone, setMedEmergPhone] = useState('');
    const [medDoctor, setMedDoctor] = useState('');
    const [medDoctorPhone, setMedDoctorPhone] = useState('');

    // 4. DOCUMENT SIMULATOR STATES
    const [uploadDocName, setUploadDocName] = useState('Birth Certificate');
    const [uploading, setUploading] = useState(false);

    // 5. ATTENDANCE REGISTRY STATES
    const [newAttDate, setNewAttDate] = useState('');
    const [newAttStatus, setNewAttStatus] = useState('PRESENT');
    const [newAttLate, setNewAttLate] = useState(false);
    const [newAttRemarks, setNewAttRemarks] = useState('');
    const [attendanceList, setAttendanceList] = useState([]);
    
    // 6. MOCK COMMUNICATION STATES
    const [commType, setCommType] = useState('SMS');
    const [commMessage, setCommMessage] = useState('');
    const [commHistory, setCommHistory] = useState([]);

    // 7. FEES LEDGER STATES
    const [payFeeAmount, setPayFeeAmount] = useState('');
    const [payFeeType, setPayFeeType] = useState('Tuition Fee');
    const [payFeeMethod, setPayFeeMethod] = useState('Cash');
    const [paymentsList, setPaymentsList] = useState([]);
    const [feeStructure, setFeeStructure] = useState(null);

    // 8. PROMOTION / TC STATES
    const [promoteClass, setPromoteClass] = useState('');
    const [exitReason, setExitReason] = useState('');
    const [exitDate, setExitDate] = useState('');
    const [exitTCNo, setExitTCNo] = useState('');

    // 9. ID CARD STATE
    const [flipCard, setFlipCard] = useState(false);

    useEffect(() => {
        if (activeStudentId) {
            loadStudentPreview(activeStudentId);
        } else {
            setPreviewStudent(null);
        }
    }, [activeStudentId]);

    useEffect(() => {
        if (previewStudent) {
            // Populate form bindings
            setEditClass(previewStudent.class || '');
            setEditSection(previewStudent.section || 'A');
            setEditRoll(previewStudent.roll_number || '');
            setEditHouse(previewStudent.house || 'RED');
            setEditStatus(previewStudent.admission_status || 'Approved');
            setEditDob(previewStudent.dob || '');

            const ext = previewStudent.extended_info || {};
            setEditAadhaar(ext.aadhaar || '');
            setEditApar(ext.apar_id || '');
            setEditCaste(previewStudent.caste || '');
            setEditCategory(previewStudent.category || 'GENERAL');
            setEditMedium(previewStudent.medium || 'HINDI');
            setEditPrevSchool(ext.previous_school || '');

            // Parent Populate
            const p = ext.parent_details || {};
            setFatherOcc(p.father_occupation || 'SELF-EMPLOYED');
            setMotherOcc(p.mother_occupation || 'HOUSEWIFE');
            setGuardName(p.guardian_name || '');
            setGuardContact(p.guardian_contact || '');
            setGuardEmail(p.guardian_email || '');
            setParentLogin(!!p.parent_login_access);

            // Medical Populate
            const med = ext.medical_info || {};
            setMedAllergies(med.allergies || 'None');
            setMedConditions(med.conditions || 'None');
            setMedEmergContact(med.emergency_contact || '');
            setMedEmergPhone(med.emergency_phone || '');
            setMedDoctor(med.doctor_name || '');
            setMedDoctorPhone(med.doctor_phone || '');

            // Communications list
            setCommHistory(ext.communication_history || []);

            // Loads sub systems
            loadAttendanceRecords(previewStudent.id);
            loadFeeLedger(previewStudent);
        }
    }, [previewStudent]);

    const loadStudentPreview = async (id) => {
        setPreviewLoading(true);
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setPreviewStudent(data);
        } catch (e) {
            console.error('Preview error:', e);
            showToast('Preview Error: ' + e.message, 'error');
        } finally {
            setPreviewLoading(false);
        }
    };

    const loadAttendanceRecords = async (studentId) => {
        try {
            const { data, error } = await db
                .from('attendance')
                .select('*')
                .eq('student_id', studentId)
                .order('date', { ascending: false });
            if (!error && data) {
                setAttendanceList(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadFeeLedger = async (student) => {
        try {
            // Load structure
            const { data: structure } = await db
                .from('fees_structure')
                .select('*')
                .eq('class_name', student.class)
                .single();
            if (structure) {
                setFeeStructure(structure);
            }

            // Load payments
            const { data: payments } = await db
                .from('fees_payments')
                .select('*')
                .eq('student_id', student.id)
                .order('payment_date', { ascending: false });
            if (payments) {
                setPaymentsList(payments);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadSearchResultsPage = async (pageNumber = 0, replace = false) => {
        setLoading(true);
        try {
            const from = pageNumber * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let q = db.from('students')
                .select('*', { count: 'exact' })
                .order('name')
                .range(from, to);

            if (searchName.trim()) q = q.ilike('name', `%${searchName.trim()}%`);
            if (searchRoll.trim()) q = q.eq('roll_number', searchRoll.trim());
            if (searchClass) q = q.eq('class', searchClass);
            if (searchSession) q = q.eq('session', searchSession);

            const { data, error, count } = await q;
            if (error) throw error;

            if (count !== null) setTotalCount(count);
            setStudents(prev => replace ? (data || []) : [...prev, ...(data || [])]);
            setPage(pageNumber);

            if (replace) {
                if (!data || data.length === 0) {
                    showToast('Student nahi mila', 'info');
                } else {
                    showToast(`Found ${count} student(s)`, 'success');
                }
            }
        } catch (e) {
            console.error('Search error:', e);
            showToast('Search Failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        await loadSearchResultsPage(0, true);
    };

    useEffect(() => {
        const sentinel = loaderRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadSearchResultsPage(page + 1, false);
            }
        }, { threshold: 0.1 });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, page]);

    // SAVE GENERAL FIELD UPDATES
    const handleUpdateStudent = async (updatedFields, extFields = null, timelineAction = null) => {
        try {
            let payload = { ...updatedFields };
            
            const currentExt = previewStudent.extended_info || {};
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
                .from('students')
                .update(payload)
                .eq('id', previewStudent.id)
                .select()
                .single();

            if (error) throw error;
            setPreviewStudent(data);
            showToast('💾 Changes saved successfully!', 'success');
            handleSearch();
        } catch (e) {
            console.error('Update failed:', e);
            showToast('Update failed: ' + e.message, 'error');
        }
    };

    // ATTENDANCE ADJUSTMENT
    const handleSaveAttendance = async (e) => {
        e.preventDefault();
        if (!newAttDate) return;

        try {
            showToast('⏳ Updating attendance register...');
            const payload = {
                student_id: previewStudent.id,
                date: newAttDate,
                status: newAttStatus,
                remarks: newAttRemarks || (newAttLate ? 'Late Entry' : 'Regular Attendance')
            };

            // check if record already exists on date
            const { data: existing } = await db
                .from('attendance')
                .select('id')
                .eq('student_id', previewStudent.id)
                .eq('date', newAttDate);

            if (existing && existing.length > 0) {
                // update
                const { error } = await db
                    .from('attendance')
                    .update(payload)
                    .eq('id', existing[0].id);
                if (error) throw error;
            } else {
                // insert
                const { error } = await db
                    .from('attendance')
                    .insert([payload]);
                if (error) throw error;
            }

            showToast('✅ Attendance updated!', 'success');
            loadAttendanceRecords(previewStudent.id);
            setNewAttDate('');
            setNewAttRemarks('');

            // Push to student activity timeline
            handleUpdateStudent({}, {}, {
                action: 'Attendance Updated',
                details: `Attendance for date ${newAttDate} set as: ${newAttStatus} (${newAttRemarks || 'Regular'})`
            });
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
        }
    };

    // DOCUMENT UPLOAD SIMULATION
    const handleUploadMockDoc = (e) => {
        e.preventDefault();
        setUploading(true);
        setTimeout(() => {
            const currentDocs = previewStudent.extended_info?.documents || [];
            const newDoc = {
                name: uploadDocName,
                fileName: `${uploadDocName.toLowerCase().replace(/ /g, '_')}_${previewStudent.admission_no.toLowerCase()}.pdf`,
                uploadedAt: new Date().toISOString().split('T')[0],
                size: '2.4 MB'
            };
            currentDocs.push(newDoc);
            
            handleUpdateStudent({}, { documents: currentDocs }, {
                action: 'Document Uploaded',
                details: `New document added to locker: ${uploadDocName}`
            });
            setUploading(false);
            showToast('📄 Document uploaded successfully to locker!', 'success');
        }, 1500);
    };

    // MOCK SEND SMS/EMAIL
    const handleSendCommunication = (e) => {
        e.preventDefault();
        if (!commMessage.trim()) return;

        const newComm = {
            type: commType,
            message: commMessage.trim(),
            sentAt: new Date().toLocaleString(),
            status: 'Delivered'
        };

        const currentHist = [...commHistory];
        currentHist.push(newComm);

        handleUpdateStudent({}, { communication_history: currentHist });
        setCommMessage('');
        showToast(`📲 Communication dispatched via ${commType}!`, 'success');
    };

    // RECORD FEES PAYMENT
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!payFeeAmount || Number(payFeeAmount) <= 0) return;

        try {
            showToast('⏳ Generating secure receipt...');
            const payload = {
                student_id: previewStudent.id,
                amount_paid: Number(payFeeAmount),
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: payFeeMethod,
                fee_type: payFeeType
            };

            const { error } = await db.from('fees_payments').insert([payload]);
            if (error) throw error;

            showToast('✅ Payment ledger updated successfully!', 'success');
            setPayFeeAmount('');
            loadFeeLedger(previewStudent);

            // Log timeline activity
            handleUpdateStudent({}, {}, {
                action: 'Fee Paid',
                details: `Fee payment of ₹${payFeeAmount} recorded for: ${payFeeType} (Method: ${payFeeMethod})`
            });
        } catch (e) {
            showToast('Payment Record Failed: ' + e.message, 'error');
        }
    };

    const getGradeBadge = (grade) => {
        if (!grade) return '';
        const gradeClass = 'grade-' + (grade === 'A+' ? 'Ap' : grade === 'B+' ? 'Bp' : grade === 'C+' ? 'Cp' : grade);
        return <span className={`grade-badge ${gradeClass}`}>{grade}</span>;
    };

    if (previewLoading) {
        return (
            <div className="card">
                <div className="loading">{strings.loadingDetailedProfile}</div>
            </div>
        );
    }

    if (previewStudent) {
        const s = previewStudent;
        const ext = s.extended_info || {};
        const marks = s.marks || [];

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

        // Compute Attendance percentages
        let pres = 0, abs = 0, lve = 0;
        attendanceList.forEach(r => {
            if (r.status === 'PRESENT') pres++;
            else if (r.status === 'ABSENT') abs++;
            else if (r.status === 'LEAVE') lve++;
        });
        const totalDays = attendanceList.length;
        const attRate = totalDays > 0 ? Math.round((pres / totalDays) * 100) : 100;

        // Compute Fees balances
        let tuitionTarget = 1000;
        if (feeStructure) {
            const tuition = (feeStructure.tuition_fee_monthly || 0) * 12;
            tuitionTarget = (feeStructure.admission_fee || 0) + tuition + (feeStructure.exam_fee_annual || 0) + (feeStructure.other_charges || 0);
        }
        const totalPaid = paymentsList.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        const feesBalance = tuitionTarget - totalPaid;

        return (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* House Colored Banner Header */}
                <div
                    style={{
                        background: `linear-gradient(135deg, ${currentHouseStyle.bg} 0%, rgba(20,20,20,0.9) 100%)`,
                        padding: '20px 25px',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        borderBottom: `3px solid ${currentHouseStyle.border}`
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.08)',
                                border: '2px solid #fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px'
                            }}
                        >
                            <Icons.Student size={36} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800' }}>{s.name}</h2>
                            <p style={{ margin: '0', fontSize: '13px', opacity: 0.85 }}>
                                {strings.admissionNoLabel}<strong>{s.admission_no}</strong> | Class: <strong>{s.class} - {s.section || 'A'}</strong> | Roll: <strong>{s.roll_number || '—'}</strong>
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span
                            style={{
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <Icons.School size={14} style={{ marginRight: '4px' }} /> {s.house || 'RED'} HOUSE
                        </span>
                        <span
                            style={{
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                background: s.admission_status === 'Approved' ? 'var(--green)' : s.admission_status === 'Pending' ? 'var(--gold)' : 'var(--red)',
                                color: '#fff'
                            }}
                        >
                            {s.admission_status === 'Approved' ? 'Active Approved' : s.admission_status}
                        </span>
                    </div>
                </div>

                {/* Sub Administration Tab Headers */}
                <div
                    style={{
                        display: 'flex',
                        background: '#f8f9fa',
                        borderBottom: '1px solid var(--border)',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        scrollbarWidth: 'none'
                    }}
                >
                    {[
                        { id: 'profile', label: 'Bio & Academics', icon: <Icons.User size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'parent', label: 'Family & Login', icon: <Icons.User size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'docs', label: 'Document Locker', icon: <Icons.Document size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'attendance', label: 'Attendance Log', icon: <Icons.Calendar size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'academics', label: 'Performance', icon: <Icons.TrendUp size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'fees', label: 'Fees Ledger', icon: <Icons.Fee size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'medical', label: 'Medical Profile', icon: <Icons.Info size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'timeline', label: 'Activity Log', icon: <Icons.Clock size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'idcard', label: 'ID Generator', icon: <Icons.Card size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'exit', label: 'Promotion & Exit', icon: <Icons.Academic size={14} style={{ marginRight: '6px' }} /> },
                        { id: 'comm', label: 'Communication', icon: <Icons.Bell size={14} style={{ marginRight: '6px' }} /> }
                    ].map(t => (
                        <button
                            key={t.id}
                            style={{
                                padding: '12px 18px',
                                border: 'none',
                                background: activeTab === t.id ? '#fff' : 'transparent',
                                borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === t.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center'
                            }}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Render Area */}
                <div style={{ padding: '25px' }}>

                    {/* TAB 1: BIO & ACADEMICS */}
                    {activeTab === 'profile' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Info size={16} style={{ marginRight: '6px' }} /> Detailed Biography & Academic Placement
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateStudent({
                                    class: editClass,
                                    section: editSection,
                                    roll_number: editRoll,
                                    house: editHouse,
                                    admission_status: editStatus,
                                    dob: editDob || null,
                                    caste: editCaste,
                                    category: editCategory,
                                    medium: editMedium
                                }, {
                                    aadhaar: editAadhaar,
                                    apar_id: editApar,
                                    previous_school: editPrevSchool
                                }, {
                                    action: 'Class Changed',
                                    details: `Academic records modified: Class: ${editClass}, Sec: ${editSection}, Roll: ${editRoll}, Status: ${editStatus}`
                                });
                            }}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{strings.academicClass}</label>
                                        <select value={editClass} onChange={(e) => setEditClass(e.target.value)}>
                                            <option value="Nursery">{strings.nursery}</option>
                                            <option value="KG-I">KG-I</option>
                                            <option value="KG-II">KG-II</option>
                                            <option value="1st">1st</option>
                                            <option value="2nd">2nd</option>
                                            <option value="3rd">3rd</option>
                                            <option value="4th">4th</option>
                                            <option value="5th">5th</option>
                                            <option value="6th">6th</option>
                                            <option value="7th">7th</option>
                                            <option value="8th">8th</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.sectionPlacement}</label>
                                        <select value={editSection} onChange={(e) => setEditSection(e.target.value)}>
                                            <option value="A">{strings.sectionA}</option>
                                            <option value="B">{strings.sectionB}</option>
                                            <option value="C">{strings.sectionC}</option>
                                            <option value="D">{strings.sectionD}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.rollNumberAssignment}</label>
                                        <input type="text" value={editRoll} onChange={(e) => setEditRoll(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.houseAssignment}</label>
                                        <select value={editHouse} onChange={(e) => setEditHouse(e.target.value)}>
                                            <option value="RED">{strings.redHouse}</option>
                                            <option value="BLUE">{strings.blueHouse}</option>
                                            <option value="GREEN">{strings.greenHouse}</option>
                                            <option value="YELLOW">{strings.yellowHouse}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.aadhaarCardNumber}</label>
                                        <input type="text" value={editAadhaar} onChange={(e) => setEditAadhaar(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>APAR ID Number</label>
                                        <input type="text" value={editApar} onChange={(e) => setEditApar(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.casteCategory}</label>
                                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                            <option value="GENERAL">{strings.general}</option>
                                            <option value="OBC">{strings.obc}</option>
                                            <option value="SC">SC</option>
                                            <option value="ST">ST</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.dateOfBirth}</label>
                                        <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.instructionMedium}</label>
                                        <select value={editMedium} onChange={(e) => setEditMedium(e.target.value)}>
                                            <option value="HINDI">{strings.hindi}</option>
                                            <option value="ENGLISH">{strings.english}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.admissionStatusTracking}</label>
                                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                                            <option value="Pending">Pending Approval</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Withdrawn">Withdrawn</option>
                                            <option value="Alumni">Alumni Conversion</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>{strings.previousSchoolDetails}</label>
                                        <input type="text" placeholder="Previous School passing summary" value={editPrevSchool} onChange={(e) => setEditPrevSchool(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <button type="submit" className="btn btn-primary">💾 Save Placement & Biography</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: PARENT & FAMILY */}
                    {activeTab === 'parent' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.User size={16} style={{ marginRight: '6px' }} /> Parents / Guardians & Login Management
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateStudent({}, {
                                    parent_details: {
                                        father_occupation: fatherOcc,
                                        mother_occupation: motherOcc,
                                        guardian_name: guardName,
                                        guardian_contact: guardContact,
                                        guardian_email: guardEmail,
                                        parent_login_access: parentLogin
                                    }
                                });
                            }}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{strings.fathersName}</label>
                                        <input type="text" value={s.father_name || ''} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.fathersOccupation}</label>
                                        <input type="text" value={fatherOcc} onChange={(e) => setFatherOcc(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.mothersName}</label>
                                        <input type="text" value={s.mother_name || ''} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.mothersOccupation}</label>
                                        <input type="text" value={motherOcc} onChange={(e) => setMotherOcc(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.guardianName}</label>
                                        <input type="text" placeholder="Leave blank if Father/Mother" value={guardName} onChange={(e) => setGuardName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.guardianContact}</label>
                                        <input type="text" value={guardContact} onChange={(e) => setGuardContact(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.guardianEmail}</label>
                                        <input type="email" value={guardEmail} onChange={(e) => setGuardEmail(e.target.value)} />
                                    </div>
                                    
                                    {/* Parent Portal Access */}
                                    <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(184,134,11,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(184,134,11,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary)' }}>Parent Login Access Portal</strong>
                                            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{strings.generateCredentials}{ext.email || 'N/A'}'</span>
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                                <input type="checkbox" checked={parentLogin} onChange={(e) => setParentLogin(e.target.checked)} />
                                                Active Portal Access
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <button type="submit" className="btn btn-primary">💾 Save Parent Ledger & Access</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: DOCUMENT LOCKER */}
                    {activeTab === 'docs' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Document size={16} style={{ marginRight: '6px' }} /> Digital Document Locker Vault
                            </div>
                            
                            {/* Upload Simulator */}
                            <form onSubmit={handleUploadMockDoc} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                                        <label>{strings.documentCategory}</label>
                                        <select value={uploadDocName} onChange={(e) => setUploadDocName(e.target.value)}>
                                            <option value="Birth Certificate">Birth Certificate</option>
                                            <option value="Aadhaar Card">Aadhaar Card</option>
                                            <option value="Transfer Certificate">Transfer Certificate (TC)</option>
                                            <option value="Last Marksheet">Term / Last Marksheet</option>
                                            <option value="Student Photograph">Student Photograph</option>
                                            <option value="Other Medical Certificate">Medical / Disability Certificate</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
                                        <label>{strings.chooseFile}</label>
                                        <input type="file" disabled={uploading} style={{ padding: '4px' }} />
                                    </div>
                                    <button type="submit" className={`btn btn-primary ${uploading ? 'btn-loading' : ''}`} disabled={uploading} style={{ height: '38px', display: 'inline-flex', alignItems: 'center' }}>
                                        {uploading ? '' : <><Icons.Plus size={14} style={{ marginRight: '6px' }} /> Upload File</>}
                                    </button>
                                </div>
                            </form>

                            {/* Uploaded Documents List */}
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
                                        {(ext.documents || []).length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '20px' }}>
                                                    {strings.lockerIsEmpty}
                                                </td>
                                            </tr>
                                        ) : (
                                            (ext.documents || []).map((doc, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{doc.name}</strong></td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{doc.fileName}</td>
                                                    <td>{doc.uploadedAt}</td>
                                                    <td>{doc.size}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn btn-info btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => showToast(`Opening Preview for: ${doc.name}`)}>
                                                                <Icons.Eye size={12} style={{ marginRight: '4px' }} /> Preview
                                                            </button>
                                                            <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => showToast(`Downloading: ${doc.fileName}`)}>
                                                                <Icons.Download size={12} style={{ marginRight: '4px' }} /> Download
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: ATTENDANCE HISTORY LOGS */}
                    {activeTab === 'attendance' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Calendar size={16} style={{ marginRight: '6px' }} /> Complete Attendance Registry
                            </div>
                            
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ background: '#e2f0d9', border: '1px solid #a9d18e', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--green)' }}>{pres}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.presentDays}</div>
                                </div>
                                <div style={{ background: '#fce4d6', border: '1px solid #f4b183', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--red)' }}>{abs}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.absentDays}</div>
                                </div>
                                <div style={{ background: '#fff2cc', border: '1px solid #ffd966', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gold)' }}>{lve}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.leaveDays}</div>
                                </div>
                                <div style={{ background: 'var(--cream)', border: '1px solid rgba(184,134,11,0.2)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{attRate}%</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>{strings.attendanceRate}</div>
                                </div>
                            </div>

                            {/* Mark Attendance adjustment form */}
                            <form onSubmit={handleSaveAttendance} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                        <label>{strings.adjustmentDate}</label>
                                        <input type="date" required value={newAttDate} onChange={(e) => setNewAttDate(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                        <label>{strings.attendanceState}</label>
                                        <select value={newAttStatus} onChange={(e) => setNewAttStatus(e.target.value)}>
                                            <option value="PRESENT">PRESENT</option>
                                            <option value="ABSENT">ABSENT</option>
                                            <option value="LEAVE">APPROVED LEAVE</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '38px', gap: '6px' }}>
                                        <input type="checkbox" id="checkLate" checked={newAttLate} onChange={(e) => setNewAttLate(e.target.checked)} />
                                        <label htmlFor="checkLate" style={{ marginBottom: '0', cursor: 'pointer' }}>Late Entry?</label>
                                    </div>
                                    <div className="form-group" style={{ flex: '2', minWidth: '200px' }}>
                                        <label>{strings.remarksNotes}</label>
                                        <input type="text" placeholder="e.g. Approved medical leave" value={newAttRemarks} onChange={(e) => setNewAttRemarks(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ height: '38px', display: 'inline-flex', alignItems: 'center' }}>
                                        <Icons.Check size={14} style={{ marginRight: '6px' }} /> Record Log
                                    </button>
                                </div>
                            </form>

                            {/* Logs listing */}
                            <div className="table-scroll" style={{ maxHeight: '250px' }}>
                                <table className="results-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.date}</th>
                                            <th>{strings.attendanceStatus}</th>
                                            <th>{strings.adjustmentRemarks}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceList.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>
                                                    {strings.noAttendanceLogs}
                                                </td>
                                            </tr>
                                        ) : (
                                            attendanceList.map(item => (
                                                <tr key={item.id}>
                                                    <td><strong>{fmtDate(item.date)}</strong></td>
                                                    <td>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            background: item.status === 'PRESENT' ? '#e2f0d9' : item.status === 'ABSENT' ? '#fce4d6' : '#fff2cc',
                                                            color: item.status === 'PRESENT' ? 'var(--green)' : item.status === 'ABSENT' ? 'var(--red)' : 'var(--gold)'
                                                        }}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td>{item.remarks || 'Regular Day'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: ACADEMIC RECORDS & RESULT ANALYTICS */}
                    {activeTab === 'academics' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.TrendUp size={16} style={{ marginRight: '6px' }} /> Performance Analytics & Examination Cards
                            </div>
                            
                            {/* Beautiful SVG Subject Charts */}
                            <div style={{ background: '#fcfcfc', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                    <strong style={{ display: 'flex', alignItems: 'center' }}>
                                        <Icons.TrendUp size={14} style={{ marginRight: '6px' }} /> Subject Marks Analytics (Visual Progress)
                                    </strong>
                                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{strings.comparingMarks}</span>
                                </div>
                                
                                {/* Simple SVG Bar Chart */}
                                {marks.length === 0 ? (
                                    <div style={{ fontStyle: 'italic', color: 'var(--muted)', padding: '20px' }}>{strings.enterMarksHelp}</div>
                                ) : (
                                    <svg width="100%" height="200" style={{ maxWidth: '600px' }}>
                                        {/* Grid lines */}
                                        <line x1="50" y1="20" x2="550" y2="20" stroke="#eee" />
                                        <line x1="50" y1="70" x2="550" y2="70" stroke="#eee" strokeDasharray="5" />
                                        <line x1="50" y1="120" x2="550" y2="120" stroke="#eee" strokeDasharray="5" />
                                        <line x1="50" y1="170" x2="550" y2="170" stroke="#ccc" strokeWidth="2" />
                                        
                                        {/* Left axis labels */}
                                        <text x="15" y="25" fontSize="10" fill="#999">100</text>
                                        <text x="20" y="75" fontSize="10" fill="#999">50</text>
                                        <text x="25" y="175" fontSize="10" fill="#999">0</text>

                                        {marks.map((m, idx) => {
                                            const totalObtd = (Number(m.hy_obtained) || 0) + (Number(m.an_obtained) || 0);
                                            const totalMax = (Number(m.hy_total) || 100) + (Number(m.an_total) || 100);
                                            const pct = totalMax > 0 ? (totalObtd / totalMax) * 100 : 0;
                                            
                                            // bars placements
                                            const width = 35;
                                            const gap = (500 - (marks.length * width)) / (marks.length + 1);
                                            const x = 50 + gap + idx * (width + gap);
                                            
                                            const height = (pct / 100) * 150;
                                            const y = 170 - height;

                                            return (
                                                <g key={m.subject}>
                                                    <rect x={x} y={y} width={width} height={height} rx="4" fill="var(--primary)" opacity="0.85" style={{ transition: 'all 0.5s' }} />
                                                    <text x={x + width/2} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--gold)">
                                                        {pct.toFixed(0)}%
                                                    </text>
                                                    <text x={x + width/2} y="185" textAnchor="middle" fontSize="10" fill="#555" fontWeight="bold">
                                                        {m.subject.substring(0, 5)}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                )}
                            </div>

                            {/* Table */}
                            <div className="table-scroll">
                                <table className="results-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.subject}</th>
                                            <th>{strings.halfYearlyObtd}</th>
                                            <th>{strings.annualObtd}</th>
                                            <th>{strings.aggregateScore}</th>
                                            <th>{strings.gradeBadge}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marks.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>
                                                    {strings.marksPendingHelp}
                                                </td>
                                            </tr>
                                        ) : (
                                            marks.map((m) => {
                                                const totalObtd = (Number(m.hy_obtained) || 0) + (Number(m.an_obtained) || 0);
                                                const totalMax = (Number(m.hy_total) || 100) + (Number(m.an_total) || 100);
                                                const pct = totalMax > 0 ? ((totalObtd / totalMax) * 100).toFixed(1) : '0.0';

                                                return (
                                                    <tr key={m.subject}>
                                                        <td style={{ fontWeight: '600' }}>{m.subject}</td>
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

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onEnterMarks(s)}>
                                    <Icons.Edit size={14} style={{ marginRight: '6px' }} /> Update Subject Marks Register
                                </button>
                                <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onDownloadPDF(s.id)}>
                                    <Icons.Download size={14} style={{ marginRight: '6px' }} /> Download Class Report Card
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: FEES & PAYMENT LEDGER */}
                    {activeTab === 'fees' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Fee size={16} style={{ marginRight: '6px' }} /> Financial Ledger & Fee Collection Account
                            </div>
                            
                            {/* Dues Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#f8f9fa' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{strings.annualFeeStructure}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{tuitionTarget}</div>
                                </div>
                                <div style={{ border: '1px solid #a9d18e', padding: '15px', borderRadius: '8px', background: 'rgba(26,92,42,0.03)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--green)' }}>{strings.totalPaymentsRecorded}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green)' }}>₹{totalPaid}</div>
                                </div>
                                <div style={{ border: feesBalance > 0 ? '1px solid #f4b183' : '1px solid #a9d18e', padding: '15px', borderRadius: '8px', background: feesBalance > 0 ? 'rgba(139,26,26,0.03)' : 'rgba(26,92,42,0.03)' }}>
                                    <div style={{ fontSize: '12px', color: feesBalance > 0 ? 'var(--red)' : 'var(--green)' }}>{strings.outstandingLedgerBalance}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: feesBalance > 0 ? 'var(--red)' : 'var(--green)' }}>₹{feesBalance}</div>
                                </div>
                            </div>

                            {/* Collect Fee Form */}
                            <form onSubmit={handleRecordPayment} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                        <label>{strings.amountCollected}</label>
                                        <input type="number" required placeholder="e.g. 500" value={payFeeAmount} onChange={(e) => setPayFeeAmount(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                        <label>{strings.feeSubCategory}</label>
                                        <select value={payFeeType} onChange={(e) => setPayFeeType(e.target.value)}>
                                            <option value="Tuition Fee">{strings.tuitionFee}</option>
                                            <option value="Admission Fee">{strings.admissionFee}</option>
                                            <option value="Exam Fee">{strings.examFee}</option>
                                            <option value="Fine / Late Charge">{strings.fineLateCharge}</option>
                                            <option value="Uniform / Materials">{strings.uniformMaterials}</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
                                        <label>{strings.paymentMethod}</label>
                                        <select value={payFeeMethod} onChange={(e) => setPayFeeMethod(e.target.value)}>
                                            <option value="Cash">Cash Handover</option>
                                            <option value="UPI / Online">UPI / Online Net</option>
                                            <option value="Bank Check">Bank Check / Draft</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ height: '38px', display: 'inline-flex', alignItems: 'center' }}>
                                        <Icons.Card size={14} style={{ marginRight: '6px' }} /> Record Payment
                                    </button>
                                </div>
                            </form>

                            {/* Receipts Ledger */}
                            <div className="table-scroll" style={{ maxHeight: '200px' }}>
                                <table className="results-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.receiptDate}</th>
                                            <th>{strings.feeCategory}</th>
                                            <th>{strings.paymentMethod}</th>
                                            <th>{strings.amountReceived}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentsList.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic', padding: '15px' }}>
                                                    {strings.noPaymentsRegistered}
                                                </td>
                                            </tr>
                                        ) : (
                                            paymentsList.map(pay => (
                                                <tr key={pay.id}>
                                                    <td><strong>{fmtDate(pay.payment_date)}</strong></td>
                                                    <td>{pay.fee_type || 'Tuition Fee'}</td>
                                                    <td>{pay.payment_method || 'Cash'}</td>
                                                    <td><strong style={{ color: 'var(--green)' }}>₹{pay.amount_paid}</strong></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 7: MEDICAL INFORMATION */}
                    {activeTab === 'medical' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Info size={16} style={{ marginRight: '6px' }} /> Student Medical & Emergency Directory
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdateStudent({}, {
                                    medical_info: {
                                        allergies: medAllergies,
                                        conditions: medConditions,
                                        emergency_contact: medEmergContact,
                                        emergency_phone: medEmergPhone,
                                        doctor_name: medDoctor,
                                        doctor_phone: medDoctorPhone
                                    }
                                });
                            }}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{strings.bloodGroup}</label>
                                        <input type="text" value={ext.blood_group || 'A+'} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.allergies}</label>
                                        <input type="text" value={medAllergies} onChange={(e) => setMedAllergies(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>{strings.medicalConditions}</label>
                                        <input type="text" value={medConditions} onChange={(e) => setMedConditions(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.emergencyContactPerson}</label>
                                        <input type="text" value={medEmergContact} onChange={(e) => setMedEmergContact(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.emergencyContactPhone}</label>
                                        <input type="text" value={medEmergPhone} onChange={(e) => setMedEmergPhone(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.doctorName}</label>
                                        <input type="text" value={medDoctor} onChange={(e) => setMedDoctor(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>{strings.doctorPhone}</label>
                                        <input type="text" value={medDoctorPhone} onChange={(e) => setMedDoctorPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <Icons.Check size={14} style={{ marginRight: '6px' }} /> Save Medical Ledger
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 8: ACTIVITY TIMELINE */}
                    {activeTab === 'timeline' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Clock size={16} style={{ marginRight: '6px' }} /> Real-time Student Timeline Activity
                            </div>
                            <div style={{ position: 'relative', paddingLeft: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ position: 'absolute', left: '9px', top: '5px', bottom: '5px', width: '2px', background: '#ccc' }}></div>
                                {(ext.timeline || []).map((tl, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: '-26px',
                                                top: '3px',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                border: '2px solid #fff'
                                            }}
                                        ></div>
                                        <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold' }}>{fmtDate(tl.date)}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', margin: '3px 0' }}>{tl.action}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tl.details}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 9: ID CARD GENERATOR */}
                    {activeTab === 'idcard' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Card size={16} style={{ marginRight: '6px' }} /> Student ID Card Printing Chamber
                            </div>
                            <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                                
                                {/* Flipping ID Card wrapper */}
                                <div 
                                    style={{
                                        width: '320px',
                                        height: '200px',
                                        perspective: '1000px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setFlipCard(!flipCard)}
                                    title="Click card to flip side!"
                                >
                                    <div 
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            textAlign: 'center',
                                            transition: 'transform 0.6s',
                                            transformStyle: 'preserve-3d',
                                            transform: flipCard ? 'rotateY(180deg)' : 'none'
                                        }}
                                    >
                                        {/* FRONT SIDE */}
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                width: '100%',
                                                height: '100%',
                                                backfaceVisibility: 'hidden',
                                                border: `4px solid ${currentHouseStyle.bg}`,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #fff 0%, #fcfcfc 100%)',
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                                                <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>{strings.schoolName}</strong>
                                                <span style={{ fontSize: '9px', fontWeight: 'bold', color: currentHouseStyle.bg }}>{s.house} HOUSE</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '8px 0', textAlign: 'left' }}>
                                                <div style={{ width: '60px', height: '60px', border: '1px solid #ccc', borderRadius: '4px', background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icons.User size={32} color="var(--primary)" />
                                                </div>
                                                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111' }}>{s.name}</div>
                                                    <div>{strings.classLabel}<strong>{s.class} - {s.section}</strong></div>
                                                    <div>{strings.rollNoLabel}<strong>{s.roll_number || '—'}</strong></div>
                                                    <div>{strings.admNoLabel}<strong>{s.admission_no}</strong></div>
                                                </div>
                                            </div>
                                            <div style={{ borderTop: '1px solid #eee', paddingTop: '4px', fontSize: '9px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{strings.sessionLabel}{s.session}</span>
                                                <span style={{ fontWeight: 'bold', color: currentHouseStyle.bg }}>{strings.studentIdentity}</span>
                                            </div>
                                        </div>

                                        {/* BACK SIDE */}
                                        <div 
                                            style={{
                                                position: 'absolute',
                                                width: '100%',
                                                height: '100%',
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)',
                                                border: `4px solid ${currentHouseStyle.bg}`,
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #1f1f1f 0%, #111 100%)',
                                                color: '#fff',
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '4px', fontSize: '10px', textAlign: 'left' }}>
                                                <strong>{strings.guardianContactInfo}</strong>
                                            </div>
                                            <div style={{ fontSize: '10px', textAlign: 'left', lineHeight: '1.5', margin: '8px 0' }}>
                                                <div>{strings.fatherLabel}<strong>{s.father_name || '—'}</strong></div>
                                                <div>{strings.emergCallLabel}<strong>{ext.mobile || '—'}</strong></div>
                                                <div>{strings.bloodGroupLabel}<strong>{ext.blood_group || 'A+'}</strong></div>
                                                <div>{strings.addressLabel}{s.address?.substring(0, 45) || '—'}...</div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                                                <span style={{ fontSize: '8px', color: '#999' }}>{strings.returnToAdmin}</span>
                                                
                                                {/* Visual QR Code box */}
                                                <div style={{ background: '#fff', padding: '2px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="25" height="25" viewBox="0 0 25 25">
                                                        <rect x="0" y="0" width="7" height="7" fill="#000" />
                                                        <rect x="18" y="0" width="7" height="7" fill="#000" />
                                                        <rect x="0" y="18" width="7" height="7" fill="#000" />
                                                        <rect x="9" y="9" width="7" height="7" fill="#000" />
                                                        <rect x="3" y="3" width="1" height="1" fill="#fff" />
                                                        <rect x="21" y="3" width="1" height="1" fill="#fff" />
                                                        <rect x="3" y="21" width="1" height="1" fill="#fff" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" onClick={() => window.print()}>Print Digital ID Card</button>
                                    <button className="btn btn-secondary" onClick={() => setFlipCard(!flipCard)}>Flip ID Card Side</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 10: PROMOTION & TC EXIT */}
                    {activeTab === 'exit' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Academic size={16} style={{ marginRight: '6px' }} /> Student Academic Promotion & Termination Exit
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                
                                {/* Promotion */}
                                <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '8px', padding: '15px' }}>
                                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                                        <Icons.TrendUp size={14} style={{ marginRight: '6px' }} /> Promotion Next Session
                                    </strong>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!promoteClass) return;
                                        handleUpdateStudent({
                                            class: promoteClass,
                                            roll_number: '',
                                            session: '2026-27'
                                        }, {}, {
                                            action: 'Class Changed',
                                            details: `Promoted student to Class: ${promoteClass} for next Session 2026-27`
                                        });
                                        setPromoteClass('');
                                    }}>
                                        <div className="form-group">
                                            <label>{strings.targetPromotionClass}</label>
                                            <select value={promoteClass} onChange={(e) => setPromoteClass(e.target.value)} required>
                                                <option value="">{strings.selectPromotion}</option>
                                                <option value="KG-I">KG-I</option>
                                                <option value="KG-II">KG-II</option>
                                                <option value="1st">1st</option>
                                                <option value="2nd">2nd</option>
                                                <option value="3rd">3rd</option>
                                                <option value="4th">4th</option>
                                                <option value="5th">5th</option>
                                                <option value="6th">6th</option>
                                                <option value="7th">7th</option>
                                                <option value="8th">8th</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icons.Check size={14} style={{ marginRight: '6px' }} /> Promote Student
                                        </button>
                                    </form>
                                </div>

                                {/* Transfer Certificate exit */}
                                <div style={{ background: '#fff9f9', border: '1px solid rgba(139,26,26,0.15)', borderRadius: '8px', padding: '15px' }}>
                                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '12px', color: 'var(--red)', display: 'flex', alignItems: 'center' }}>
                                        <Icons.Document size={14} style={{ marginRight: '6px' }} /> School Exit & Transfer Certificate (TC)
                                    </strong>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleUpdateStudent({
                                            admission_status: 'Withdrawn'
                                        }, {
                                            tc_details: {
                                                tc_no: exitTCNo,
                                                reason: exitReason,
                                                exit_date: exitDate
                                            }
                                        }, {
                                            action: 'Documents Uploaded',
                                            details: `Transfer Certificate (TC No: ${exitTCNo}) issued. Student withdrawn.`
                                        });
                                    }}>
                                        <div className="form-group">
                                            <label>{strings.tcDispatchNumber}</label>
                                            <input type="text" placeholder="e.g. TC/2026/043" value={exitTCNo} onChange={(e) => setExitTCNo(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.reasonForWithdrawal}</label>
                                            <input type="text" placeholder="e.g. Relocated to another city" value={exitReason} onChange={(e) => setExitReason(e.target.value)} required />
                                        </div>
                                        <div className="form-group">
                                            <label>{strings.schoolLeavingDate}</label>
                                            <input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} required />
                                        </div>
                                        <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icons.Trash size={14} style={{ marginRight: '6px' }} /> Withdraw & Issue TC
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 11: MOCK COMMUNICATION */}
                    {activeTab === 'comm' && (
                        <div>
                            <div className="card-title" style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <Icons.Bell size={16} style={{ marginRight: '6px' }} /> Dispatch Communication Notifications
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
                                
                                {/* Send form */}
                                <form onSubmit={handleSendCommunication} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div className="form-group">
                                        <label>{strings.dispatchChannels}</label>
                                        <select value={commType} onChange={(e) => setCommType(e.target.value)}>
                                            <option value="SMS">SMS (Mobile Text)</option>
                                            <option value="Email">Email Dispatch</option>
                                            <option value="WhatsApp">WhatsApp Direct Alert</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginTop: '12px' }}>
                                        <label>{strings.messageContent}</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Write message to send parents/guardians..."
                                            value={commMessage}
                                            onChange={(e) => setCommMessage(e.target.value)}
                                            required
                                            style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>{strings.dispatchedMessage}</button>
                                </form>

                                {/* History list */}
                                <div>
                                    <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                                        <Icons.Document size={14} style={{ marginRight: '6px' }} /> Communication History logs
                                    </strong>
                                    <div style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: '#fcfcfc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {commHistory.length === 0 ? (
                                            <div style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>{strings.noMessagesLogged}</div>
                                        ) : (
                                            commHistory.map((item, idx) => (
                                                <div key={idx} style={{ background: '#fff', border: '1px solid #eee', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                                                        <span style={{ color: 'var(--primary)' }}>{item.type} Channel</span>
                                                        <span style={{ color: 'var(--green)' }}>{item.status}</span>
                                                    </div>
                                                    <div style={{ color: '#333' }}>{item.message}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'right', marginTop: '4px' }}>{item.sentAt}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="btn-row" style={{ borderTop: '1px solid var(--border)', padding: '15px 25px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => {
                            setPreviewStudent(null);
                            if (onClosePreview) onClosePreview();
                        }}
                    >
                        <Icons.Close size={14} style={{ marginRight: '6px' }} /> Back to Students List
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => onDownloadPDF(s.id)}>
                            <Icons.Download size={14} style={{ marginRight: '6px' }} /> Download Academic Result
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                <Icons.Search size={16} style={{ marginRight: '6px' }} /> Search Student Directory
            </div>
            <form onSubmit={handleSearch} className="search-bar">
                <div className="form-group">
                    <label>{strings.searchNameLabel}</label>
                    <input
                        type="text"
                        placeholder="Search student name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>{strings.searchRollLabel}</label>
                    <input
                        type="text"
                        placeholder="Roll no."
                        value={searchRoll}
                        onChange={(e) => setSearchRoll(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>{strings.searchClassLabel}</label>
                    <select value={searchClass} onChange={(e) => setSearchClass(e.target.value)}>
                        <option value="">{strings.allClasses}</option>
                        <option value="Nursery">{strings.nursery}</option>
                        <option value="KG-I">KG-I</option>
                        <option value="KG-II">KG-II</option>
                        <option value="1st">1st</option>
                        <option value="2nd">2nd</option>
                        <option value="3rd">3rd</option>
                        <option value="4th">4th</option>
                        <option value="5th">5th</option>
                        <option value="6th">6th</option>
                        <option value="7th">7th</option>
                        <option value="8th">8th</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>{strings.searchSessionLabel}</label>
                    <select value={searchSession} onChange={(e) => setSearchSession(e.target.value)}>
                        <option value="">{strings.allSessions}</option>
                        <option value="2019-20">2019-20</option>
                        <option value="2020-21">2020-21</option>
                        <option value="2021-22">2021-22</option>
                        <option value="2022-23">2022-23</option>
                        <option value="2023-24">2023-24</option>
                        <option value="2024-25">2024-25</option>
                        <option value="2025-26">2025-26</option>
                        <option value="2026-27">2026-27</option>
                    </select>
                </div>
                <div className="form-group search-btn-group">
                    <label>&nbsp;</label>
                    <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} disabled={loading}>
                        {loading ? '' : <><Icons.Search size={14} style={{ marginRight: '6px' }} /> Search Student</>}
                    </button>
                </div>
            </form>

            <div id="search-results-table">
                {loading && students.length === 0 ? (
                    <div>
                        <style>{shimmerCSS}</style>
                        <div className="info-row" style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="skeleton-cell" style={{ width: '150px', height: '14px' }} />
                        </div>
                        <div className="results-table-wrap" style={{ display: 'block' }}>
                            <div className="table-scroll" style={{ display: 'block' }}>
                                <table className="results-table" style={{ minWidth: '540px' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.searchNameLabel}</th>
                                            <th>{strings.fathersName}</th>
                                            <th>{strings.classSection}</th>
                                            <th>{strings.rollNoLabel}</th>
                                            <th>% Marks</th>
                                            <th>{strings.houseAssignment}</th>
                                            <th>{strings.status}</th>
                                            <th>{strings.actionControls}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 6 }).map((_, idx) => (
                                            <SkeletonRow key={idx} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon"><Icons.Search size={48} /></div>
                        <p>{strings.searchEmptyState}</p>
                    </div>
                ) : (
                    <div>
                        <style>{shimmerCSS}</style>
                        <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Icons.Pin size={14} style={{ marginRight: '6px' }} /> {totalCount !== null ? `${students.length} of ${totalCount} student(s) loaded` : `${students.length} student(s) found`}
                            </div>
                            {loading && (
                                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Clock size={11} className="spin" /> Loading more...
                                </span>
                            )}
                        </div>
                        <div className="results-table-wrap" style={{ display: 'block' }}>
                            <div className="table-scroll" style={{ display: 'block' }}>
                                <table className="results-table" style={{ minWidth: '540px' }}>
                                    <thead>
                                        <tr>
                                            <th>{strings.searchNameLabel}</th>
                                            <th>{strings.fathersName}</th>
                                            <th>{strings.classSection}</th>
                                            <th>{strings.rollNoLabel}</th>
                                            <th>% Marks</th>
                                            <th>{strings.houseAssignment}</th>
                                            <th>{strings.status}</th>
                                            <th>{strings.actionControls}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => {
                                            const status = getStudentStatus(s);
                                            return (
                                                <tr key={s.id}>
                                                    <td>
                                                        <strong>{s.name}</strong>{' '}
                                                    </td>
                                                    <td>{s.father_name || '—'}</td>
                                                    <td><strong>{s.class} - {s.section || 'A'}</strong></td>
                                                    <td>{s.roll_number || '—'}</td>
                                                    <td>{s.percentage !== null && s.percentage !== undefined ? `${s.percentage}%` : '0%'}</td>
                                                    <td>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: s.house === 'BLUE' ? 'dodgerblue' : s.house === 'GREEN' ? 'seagreen' : s.house === 'YELLOW' ? 'goldenrod' : 'crimson' }}>
                                                            {s.house || 'RED'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', background: s.admission_status === 'Approved' ? '#e2f0d9' : '#fff2cc', color: s.admission_status === 'Approved' ? 'var(--green)' : 'var(--gold)' }}>
                                                            {s.admission_status || 'Approved'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn btn-info btn-sm"
                                                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                title="Student Portal Hub"
                                                                onClick={() => loadStudentPreview(s.id)}
                                                            >
                                                                <Icons.Eye size={12} style={{ marginRight: '4px' }} /> Hub
                                                            </button>
                                                            {isHighAccess && (
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                    onClick={() => onDownloadPDF(s.id)}
                                                                >
                                                                    <Icons.Download size={12} style={{ marginRight: '4px' }} /> PDF
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                onClick={() => onEnterMarks(s)}
                                                            >
                                                                <Icons.Clipboard size={12} style={{ marginRight: '4px' }} /> Marks
                                                            </button>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                onClick={() => onEditInfo(s)}
                                                            >
                                                                <Icons.Edit size={12} style={{ marginRight: '4px' }} /> Info
                                                            </button>
                                                            {isHighAccess && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                    onClick={() => onDelete(s.id)}
                                                                >
                                                                    <Icons.Trash size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* Inline skeleton loader rows for page appending */}
                                        {loading && Array.from({ length: 3 }).map((_, idx) => (
                                            <SkeletonRow key={`inline-sk-${idx}`} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Sentinel target for Infinite Scroll */}
                        <div ref={loaderRef} style={{ height: '20px', margin: '10px 0' }} />

                        {/* Load More Button fallback & End of List Indicator */}
                        {hasMore ? (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => loadSearchResultsPage(page + 1, false)}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading...' : `Load More (${students.length} of ${totalCount})`}
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', padding: '15px 0', fontStyle: 'italic' }}>
                                — All {totalCount} students loaded —
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
