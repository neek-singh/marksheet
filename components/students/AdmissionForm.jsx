'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Icons from '../ui/Icons';

export default function AdmissionForm({ editingStudent, showToast, onSaveSuccess }) {
    const [name, setName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [motherName, setMotherName] = useState('');
    const [penNo, setPenNo] = useState('');
    const [dob, setDob] = useState('');
    const [admissionNo, setAdmissionNo] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [caste, setCaste] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [medium, setMedium] = useState('HINDI');
    const [studentClass, setStudentClass] = useState('');
    const [address, setAddress] = useState('');
    
    // New Extended Fields
    const [gender, setGender] = useState('MALE');
    const [section, setSection] = useState('A');
    const [house, setHouse] = useState('RED');
    const [previousSchool, setPreviousSchool] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [aparId, setAparId] = useState('');
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [sessionVal, setSessionVal] = useState('2026-27');
    const [admissionStatus, setAdmissionStatus] = useState('Approved');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingStudent) {
            setName(editingStudent.name || '');
            setFatherName(editingStudent.father_name || '');
            setMotherName(editingStudent.mother_name || '');
            setPenNo(editingStudent.pen_no || '');
            setDob(editingStudent.dob || '');
            setAdmissionNo(editingStudent.admission_no || '');
            setRollNumber(editingStudent.roll_number || '');
            setCaste(editingStudent.caste || '');
            setCategory(editingStudent.category || 'GENERAL');
            setMedium(editingStudent.medium || 'HINDI');
            setStudentClass(editingStudent.class || '');
            setAddress(editingStudent.address || '');
            
            // Set Extended Values
            setSection(editingStudent.section || 'A');
            setHouse(editingStudent.house || 'RED');
            setAdmissionStatus(editingStudent.admission_status || 'Approved');
            setSessionVal(editingStudent.session || '2026-27');

            const ext = editingStudent.extended_info || {};
            setGender(ext.gender || 'MALE');
            setPreviousSchool(ext.previous_school || '');
            setEmail(ext.email || '');
            setMobile(ext.mobile || '');
            setAadhaar(ext.aadhaar || '');
            setAparId(ext.apar_id || '');
            setBloodGroup(ext.blood_group || 'A+');
        } else {
            clearForm();
        }
    }, [editingStudent]);

    const clearForm = () => {
        setName('');
        setFatherName('');
        setMotherName('');
        setPenNo('');
        setDob('');
        setAdmissionNo('');
        setRollNumber('');
        setCaste('');
        setCategory('GENERAL');
        setMedium('HINDI');
        setStudentClass('');
        setAddress('');
        setGender('MALE');
        setSection('A');
        setHouse('RED');
        setPreviousSchool('');
        setEmail('');
        setMobile('');
        setAadhaar('');
        setAparId('');
        setBloodGroup('A+');
        setSessionVal('2026-27');
        setAdmissionStatus('Approved');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim() || !studentClass) {
            showToast('⚠️ Student Name aur Class required hai!', 'error');
            return;
        }

        setLoading(true);
        
        // Auto-generate Admission Number if blank
        let finalAdmNo = admissionNo.trim();
        if (!finalAdmNo) {
            const yr = new Date().getFullYear();
            finalAdmNo = `ADM-${yr}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Auto-generate Roll Number if blank
        let finalRoll = rollNumber.trim();
        if (!finalRoll) {
            finalRoll = `${Math.floor(10 + Math.random() * 89)}`;
        }

        // Setup base structure for JSONB extended_info
        const existingExt = editingStudent?.extended_info || {};
        const extPayload = {
            ...existingExt,
            gender: gender,
            previous_school: previousSchool.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            aadhaar: aadhaar.trim(),
            apar_id: aparId.trim(),
            blood_group: bloodGroup,
            parent_details: existingExt.parent_details || {
                father_occupation: 'SELF-EMPLOYED',
                mother_occupation: 'HOUSEWIFE',
                guardian_name: '',
                guardian_contact: '',
                guardian_email: '',
                parent_login_access: false
            },
            medical_info: existingExt.medical_info || {
                allergies: 'None',
                conditions: 'None',
                emergency_contact: fatherName ? fatherName.trim().toUpperCase() : 'Parent',
                emergency_phone: mobile.trim() || '',
                doctor_name: 'Dr. Sharma',
                doctor_phone: ''
            },
            documents: existingExt.documents || [],
            timeline: existingExt.timeline || [
                { action: 'Admission Created', date: new Date().toISOString().split('T')[0], details: `Initial admission registered under status: ${admissionStatus}` }
            ],
            communication_history: existingExt.communication_history || []
        };

        const payload = {
            name: name.trim().toUpperCase(),
            father_name: fatherName.trim().toUpperCase(),
            mother_name: motherName.trim().toUpperCase(),
            dob: dob || null,
            pen_no: penNo.trim(),
            caste: caste.trim().toUpperCase(),
            category: category,
            address: address.trim().toUpperCase(),
            class: studentClass,
            admission_no: finalAdmNo,
            roll_number: finalRoll,
            medium: medium,
            session: sessionVal,
            section: section,
            house: house,
            admission_status: admissionStatus,
            extended_info: extPayload
        };

        try {
            if (editingStudent?.id) {
                const { error } = await db
                    .from('students')
                    .update(payload)
                    .eq('id', editingStudent.id);
                if (error) throw error;
                showToast('✅ Student Info updated successfully!', 'success');
            } else {
                const { error } = await db
                    .from('students')
                    .insert([payload]);
                if (error) throw error;
                showToast(`✅ Student Admitted! Adm No: ${finalAdmNo}`, 'success');
            }
            clearForm();
            if (onSaveSuccess) onSaveSuccess();
        } catch (e) {
            console.error('Error saving student info:', e);
            showToast('Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.User size={18} />
                <span>{editingStudent ? 'Edit Student Details' : 'Student Admission Form'}</span>
            </div>
            <form onSubmit={handleSave}>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--primary)', marginBottom: '15px', fontSize: '15px' }}>
                    1. Basic & Personal Information
                </h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Student Name *</label>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                        />
                    </div>
                     <div className="form-group">
                        <label>Aadhaar Number</label>
                        <input
                            type="text"
                            placeholder="12 Digit Aadhaar Card No"
                            value={aadhaar}
                            onChange={(e) => setAadhaar(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>APAR ID</label>
                        <input
                            type="text"
                            placeholder="12 Digit APAR ID No"
                            value={aparId}
                            onChange={(e) => setAparId(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Blood Group</label>
                        <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Caste</label>
                        <input
                            type="text"
                            value={caste}
                            onChange={(e) => setCaste(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="GENERAL">GENERAL</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Medium</label>
                        <select value={medium} onChange={(e) => setMedium(e.target.value)}>
                            <option value="HINDI">HINDI</option>
                            <option value="ENGLISH">ENGLISH</option>
                        </select>
                    </div>
                </div>

                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--primary)', marginBottom: '15px', marginTop: '20px', fontSize: '15px' }}>
                    2. Contact & Family Details
                </h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Father's Name</label>
                        <input
                            type="text"
                            placeholder="Father's Name"
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mother's Name</label>
                        <input
                            type="text"
                            placeholder="Mother's Name"
                            value={motherName}
                            onChange={(e) => setMotherName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Mobile Number</label>
                        <input
                            type="text"
                            placeholder="Primary contact mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Guardian email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                </div>

                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--primary)', marginBottom: '15px', marginTop: '20px', fontSize: '15px' }}>
                    3. Academic Allocation & Historical Details
                </h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Class *</label>
                        <select
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value)}
                            required
                        >
                            <option value="">Select Class</option>
                            <option value="Nursery">Nursery</option>
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
                        <label>Section</label>
                        <select value={section} onChange={(e) => setSection(e.target.value)}>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Roll Number (Leave blank to auto-generate)</label>
                        <input
                            type="text"
                            placeholder="e.g. 23"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>House Assignment</label>
                        <select value={house} onChange={(e) => setHouse(e.target.value)}>
                            <option value="RED">🔴 Red House</option>
                            <option value="BLUE">🔵 Blue House</option>
                            <option value="GREEN">🟢 Green House</option>
                            <option value="YELLOW">🟡 Yellow House</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Admission No (Leave blank to auto-generate)</label>
                        <input
                            type="text"
                            placeholder="e.g. ADM-2026-102"
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>PEN No.</label>
                        <input
                            type="text"
                            placeholder="Permanent Education Number"
                            value={penNo}
                            onChange={(e) => setPenNo(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Academic Session</label>
                        <select value={sessionVal} onChange={(e) => setSessionVal(e.target.value)}>
                            <option value="2026-27">2026-27</option>
                            <option value="2025-26">2025-26</option>
                            <option value="2024-25">2024-25</option>
                            <option value="2023-24">2023-24</option>
                            <option value="2022-23">2022-23</option>
                            <option value="2021-22">2021-22</option>
                            <option value="2020-21">2020-21</option>
                            <option value="2019-20">2019-20</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Admission Status</label>
                        <select value={admissionStatus} onChange={(e) => setAdmissionStatus(e.target.value)}>
                            <option value="Pending">Pending Approval</option>
                            <option value="Approved">Approved / Admitted</option>
                            <option value="Withdrawn">Withdrawn</option>
                            <option value="Alumni">Alumni</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Previous School Details (History)</label>
                        <input
                            type="text"
                            placeholder="Name of previous school, last class passed, TC info, etc."
                            value={previousSchool}
                            onChange={(e) => setPreviousSchool(e.target.value)}
                        />
                    </div>
                </div>

                <div className="btn-row" style={{ marginTop: '25px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <button type="button" className="btn btn-secondary" onClick={clearForm}>
                        🔄 Reset Form
                    </button>
                    <button
                        type="submit"
                        className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '' : '💾 Save Admission Info'}
                    </button>
                </div>
            </form>
        </div>
    );
}
