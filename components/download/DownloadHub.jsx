'use client';
import React, { useState } from 'react';
import { useAppContext } from '../../app/context/AppContext';
import { db } from '../../lib/supabase';
import Icons from '../ui/Icons';

export default function DownloadHub() {
    const { currentUser, activeSession, handleDownloadClassPDF, showToast } = useAppContext();

    const [biodataLoading, setBiodataLoading] = useState(false);
    const [feesLoading, setFeesLoading] = useState(false);
    const [marksLoading, setMarksLoading] = useState(false);
    const [aadhaarLoading, setAadhaarLoading] = useState(false);
    const [penLoading, setPenLoading] = useState(false);
    const [mobileLoading, setMobileLoading] = useState(false);

    // Biodata Filters State
    const [bioClass, setBioClass] = useState('all');
    const [bioSection, setBioSection] = useState('all');
    const [bioMedium, setBioMedium] = useState('all');
    const [bioStatus, setBioStatus] = useState('all');

    // Fees Filters State
    const [feesClass, setFeesClass] = useState('all');
    const [feesMethod, setFeesMethod] = useState('all');

    // Marksheet Filters State
    const [marksClass, setMarksClass] = useState('1st');

    // Additional Filters State
    const [aadhaarClass, setAadhaarClass] = useState('all');
    const [aparClass, setAparClass] = useState('all');
    const [penClass, setPenClass] = useState('all');
    const [mobileClass, setMobileClass] = useState('all');
    const [aparLoading, setAparLoading] = useState(false);

    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const marksClassesList = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const sectionsList = ['all', 'A', 'B', 'C', 'D'];
    const mediumsList = ['all', 'HINDI', 'ENGLISH'];
    const statusList = ['all', 'Approved', 'Pending'];
    const paymentMethodsList = ['all', 'Cash', 'Bank Transfer', 'Online', 'Cheque'];

    // Helper to generate and download Excel (.xls)
    const downloadExcel = (headers, rows, filename) => {
        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        html += '<head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
        html += '<body><table border="1">';
        
        // Headers
        html += '<tr>';
        headers.forEach(h => {
            html += `<th style="background-color: #f2f2f2; border: 1px solid #dddddd; padding: 8px; font-weight: bold; text-align: left;">${h}</th>`;
        });
        html += '</tr>';

        // Rows
        rows.forEach(r => {
            html += '<tr>';
            r.forEach(val => {
                const strVal = val === null || val === undefined ? '' : String(val);
                // mso-number-format:"\@" forces Excel to treat cell value as Text (keeps leading zeros, prevents scientific notation)
                html += `<td style="border: 1px solid #dddddd; padding: 8px; mso-number-format:\\@;">${strVal}</td>`;
            });
            html += '</tr>';
        });

        html += '</table></body></html>';

        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 1. Export Student General Registry Excel
    const handleExportBiodata = async () => {
        setBiodataLoading(true);
        showToast('⏳ Generating Student Registry Export...');
        try {
            let q = db.from('students').select('*').order('name');
            if (bioClass !== 'all') q = q.eq('class', bioClass);
            if (bioSection !== 'all') q = q.eq('section', bioSection);
            if (bioMedium !== 'all') q = q.eq('medium', bioMedium);
            if (bioStatus !== 'all') q = q.eq('admission_status', bioStatus);
            q = q.eq('session', activeSession); // Filter by currently selected active session

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi data nahi mila!', 'info');
                return;
            }

            const headers = [
                "Admission No", "Roll No", "Student Name", "Class", "Section", "Medium", "Session", 
                "Date of Birth", "Caste", "Category", "Address", "PEN No", "Aadhaar Card",
                "Father Name", "Mother Name", "Father Occupation", "Mother Occupation", 
                "Guardian Name", "Guardian Contact", "Guardian Email", "Admission Status"
            ];

            const rows = data.map(s => {
                const ext = s.extended_info || {};
                const parent = ext.parent_details || {};
                return [
                    s.admission_no || '',
                    s.roll_number || '',
                    s.name || '',
                    s.class || '',
                    s.section || 'A',
                    s.medium || 'HINDI',
                    s.session || '',
                    s.dob || '',
                    s.caste || '',
                    s.category || 'GENERAL',
                    s.address || '',
                    s.pen_no || '',
                    ext.aadhaar || '',
                    s.father_name || '',
                    s.mother_name || '',
                    parent.father_occupation || '',
                    parent.mother_occupation || '',
                    parent.guardian_name || '',
                    parent.guardian_contact || '',
                    parent.guardian_email || '',
                    s.admission_status || 'Approved'
                ];
            });

            const fileName = `Students_Registry_Class_${bioClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} students successfully!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setBiodataLoading(false);
        }
    };

    // 2. Export Fee Ledger Excel
    const handleExportFees = async () => {
        setFeesLoading(true);
        showToast('⏳ Generating Fees Ledger Export...');
        try {
            let q = db.from('fees_payments')
                .select('*, students!inner(*)')
                .order('payment_date');

            if (feesClass !== 'all') q = q.eq('students.class', feesClass);
            if (feesMethod !== 'all') q = q.eq('payment_mode', feesMethod);
            q = q.eq('students.session', activeSession); // Filter by active session

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi fee records nahi mile!', 'info');
                return;
            }

            const headers = [
                "Receipt No", "Date", "Admission No", "Student Name", "Class", "Session", 
                "Category", "Amount Paid (₹)", "Payment Mode", "Remarks"
            ];

            const rows = data.map(p => {
                const s = p.students || {};
                return [
                    p.receipt_number || p.id || '',
                    p.payment_date || '',
                    s.admission_no || '',
                    s.name || '',
                    s.class || '',
                    s.session || '',
                    p.fee_category || '',
                    p.amount_paid || 0,
                    p.payment_mode || '',
                    p.remarks || ''
                ];
            });

            const fileName = `Fees_Ledger_Class_${feesClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} fee records successfully!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setFeesLoading(false);
        }
    };

    // 3. Export Marksheets Batch PDF
    const handleExportMarksheets = async () => {
        setMarksLoading(true);
        try {
            await handleDownloadClassPDF(marksClass);
        } catch (e) {
            console.error(e);
            showToast('PDF Export failed: ' + e.message, 'error');
        } finally {
            setMarksLoading(false);
        }
    };

    // 4. Export Aadhaar Numbers Excel
    const handleExportAadhaar = async () => {
        setAadhaarLoading(true);
        showToast('⏳ Generating Aadhaar Numbers Export...');
        try {
            let q = db.from('students')
                .select('*')
                .order('class')
                .order('name');
            if (aadhaarClass !== 'all') q = q.eq('class', aadhaarClass);
            q = q.eq('session', activeSession);

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi data nahi mila!', 'info');
                return;
            }

            const headers = ["Admission No", "Student Name", "Class", "Section", "Father's Name", "Aadhaar Card Number"];
            const rows = data.map(s => {
                const ext = s.extended_info || {};
                return [
                    s.admission_no || '',
                    s.name || '',
                    s.class || '',
                    s.section || 'A',
                    s.father_name || '',
                    ext.aadhaar || '—'
                ];
            });

            const fileName = `Student_Aadhaar_List_Class_${aadhaarClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} Aadhaar records!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setAadhaarLoading(false);
        }
    };

    // Export APAR ID Registry Excel
    const handleExportApar = async () => {
        setAparLoading(true);
        showToast('⏳ Generating APAR ID Registry Export...');
        try {
            let q = db.from('students')
                .select('*')
                .order('class')
                .order('name');
            if (aparClass !== 'all') q = q.eq('class', aparClass);
            q = q.eq('session', activeSession);

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi data nahi mila!', 'info');
                return;
            }

            const headers = ["Admission No", "Student Name", "Class", "Section", "Father's Name", "APAR ID"];
            const rows = data.map(s => {
                const ext = s.extended_info || {};
                return [
                    s.admission_no || '',
                    s.name || '',
                    s.class || '',
                    s.section || 'A',
                    s.father_name || '',
                    ext.apar_id || '—'
                ];
            });

            const fileName = `Student_APAR_List_Class_${aparClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} APAR ID records!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setAparLoading(false);
        }
    };

    // 5. Export PEN Numbers Excel
    const handleExportPen = async () => {
        setPenLoading(true);
        showToast('⏳ Generating PEN Numbers Export...');
        try {
            let q = db.from('students')
                .select('*')
                .order('class')
                .order('name');
            if (penClass !== 'all') q = q.eq('class', penClass);
            q = q.eq('session', activeSession);

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi data nahi mila!', 'info');
                return;
            }

            const headers = ["Admission No", "Student Name", "Class", "Section", "Date of Birth", "PEN Number"];
            const rows = data.map(s => [
                s.admission_no || '',
                s.name || '',
                s.class || '',
                s.section || 'A',
                s.dob || '',
                s.pen_no || '—'
            ]);

            const fileName = `Student_PEN_List_Class_${penClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} PEN records!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setPenLoading(false);
        }
    };

    // 6. Export Mobile Contact Sheet Excel
    const handleExportMobile = async () => {
        setMobileLoading(true);
        showToast('⏳ Generating Mobile Contact Sheet Export...');
        try {
            let q = db.from('students')
                .select('*')
                .order('class')
                .order('name');
            if (mobileClass !== 'all') q = q.eq('class', mobileClass);
            q = q.eq('session', activeSession);

            const { data, error } = await q;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Is selection mein koi data nahi mila!', 'info');
                return;
            }

            const headers = ["Admission No", "Student Name", "Class", "Section", "Father's Name", "Primary Mobile No", "Guardian Name", "Guardian Contact", "Guardian Email"];
            const rows = data.map(s => {
                const ext = s.extended_info || {};
                const parent = ext.parent_details || {};
                return [
                    s.admission_no || '',
                    s.name || '',
                    s.class || '',
                    s.section || 'A',
                    s.father_name || '',
                    parent.guardian_contact || '—',
                    parent.guardian_name || '—',
                    parent.guardian_contact || '—',
                    parent.guardian_email || '—'
                ];
            });

            const fileName = `Student_Mobile_List_Class_${mobileClass}_Session_${activeSession}.xls`;
            downloadExcel(headers, rows, fileName);
            showToast(`✅ Exported ${data.length} contact records!`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Export failed: ' + e.message, 'error');
        } finally {
            setMobileLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Page Title & Intro */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ background: 'rgba(184, 134, 11, 0.08)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icons.Download size={20} color="var(--gold)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--ink)' }}>Download & Exports Center</h2>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>Session: {activeSession}</span>
                    </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '8px 0 0 0', lineHeight: '1.6' }}>
                    Yahan se aap students ki registry, fees payments ledgers, aur academic marksheets compile karke download kar sakte hain. Excel (.xls) ya PDF format mein data export karke local records maintain karein.
                </p>
            </div>

            {/* Grid layout for download types */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                
                {/* 1. Biodata Registry Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.Student size={18} style={{ color: 'var(--primary)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>Student General Registry (Excel)</strong>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                                <select value={bioClass} onChange={(e) => setBioClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                    {classesList.map(cls => (
                                        <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Section</label>
                                <select value={bioSection} onChange={(e) => setBioSection(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                    {sectionsList.map(sec => (
                                        <option key={sec} value={sec}>{sec === 'all' ? 'All Sections' : `Section ${sec}`}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Medium</label>
                                <select value={bioMedium} onChange={(e) => setBioMedium(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                    {mediumsList.map(med => (
                                        <option key={med} value={med}>{med === 'all' ? 'All Mediums' : med}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Status</label>
                                <select value={bioStatus} onChange={(e) => setBioStatus(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                    {statusList.map(st => (
                                        <option key={st} value={st}>{st === 'all' ? 'All Status' : st}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary" 
                        onClick={handleExportBiodata} 
                        disabled={biodataLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                        {biodataLoading ? 'Generating...' : <><Icons.Download size={14} /> Download Excel Registry</>}
                    </button>
                </div>

                {/* 2. Fees Ledger Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.Fee size={18} style={{ color: 'var(--gold-dark)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>Fee Collection Ledgers (Excel)</strong>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                            <select value={feesClass} onChange={(e) => setFeesClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Payment Mode</label>
                            <select value={feesMethod} onChange={(e) => setFeesMethod(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {paymentMethodsList.map(mode => (
                                    <option key={mode} value={mode}>{mode === 'all' ? 'All Payment Modes' : mode}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-secondary" 
                        onClick={handleExportFees} 
                        disabled={feesLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--cream)', color: 'var(--gold-dark)', border: '1px solid rgba(184,134,11,0.2)' }}
                    >
                        {feesLoading ? 'Generating...' : <><Icons.Download size={14} /> Download Fees Excel Ledger</>}
                    </button>
                </div>

                {/* 3. Class Marksheets Compilation Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.Clipboard size={18} style={{ color: 'var(--green)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>Class Marksheets (Combined PDF)</strong>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            Select target class to generate and combine individual student academic result reports in a single, high-fidelity PDF.
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Target Class</label>
                            <select value={marksClass} onChange={(e) => setMarksClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {marksClassesList.map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-success" 
                        onClick={handleExportMarksheets} 
                        disabled={marksLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                        {marksLoading ? 'Compiling PDF...' : <><Icons.Download size={14} /> Download Combined PDF</>}
                    </button>
                </div>

                {/* 4. Student Aadhaar Directory Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.User size={18} style={{ color: 'var(--primary)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>Aadhaar Card Registry (Excel)</strong>
                        </div>

                        <p style={{ fontSize: '12.2px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            Export students' government Aadhaar card registration numbers for class profiles, scholarship records, and state registers.
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                            <select value={aadhaarClass} onChange={(e) => setAadhaarClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary" 
                        onClick={handleExportAadhaar} 
                        disabled={aadhaarLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                        {aadhaarLoading ? 'Generating...' : <><Icons.Download size={14} /> Download Aadhaar Excel List</>}
                    </button>
                </div>

                {/* Student APAR ID Registry Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.User size={18} style={{ color: 'var(--primary)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>APAR ID Registry (Excel)</strong>
                        </div>

                        <p style={{ fontSize: '12.2px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            Export students' Automated Permanent Academic Registry (APAR) numbers for administrative records, board enrollments, and academic credits.
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                            <select value={aparClass} onChange={(e) => setAparClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary" 
                        onClick={handleExportApar} 
                        disabled={aparLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                        {aparLoading ? 'Generating...' : <><Icons.Download size={14} /> Download APAR Excel List</>}
                    </button>
                </div>

                {/* 5. Student PEN Directory Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.Document size={18} style={{ color: 'var(--gold-dark)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>PEN Numbers Registry (Excel)</strong>
                        </div>

                        <p style={{ fontSize: '12.2px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            Export Permanent Education Numbers (PEN) for national student registries (UDISE+) and board examination applications.
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                            <select value={penClass} onChange={(e) => setPenClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-secondary" 
                        onClick={handleExportPen} 
                        disabled={penLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--cream)', color: 'var(--gold-dark)', border: '1px solid rgba(184,134,11,0.2)' }}
                    >
                        {penLoading ? 'Generating...' : <><Icons.Download size={14} /> Download PEN Excel List</>}
                    </button>
                </div>

                {/* 6. Mobile Contacts Card */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                            <Icons.Student size={18} style={{ color: 'var(--green)' }} />
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>Parent Mobile Contacts (Excel)</strong>
                        </div>

                        <p style={{ fontSize: '12.2px', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            Export parents' and guardians' mobile contacts for bulk announcements, official emergency calls, and SMS notification registers.
                        </p>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>Class Selection</label>
                            <select value={mobileClass} onChange={(e) => setMobileClass(e.target.value)} style={{ width: '100%', fontSize: '12.5px', padding: '8px 10px', borderRadius: '6px' }}>
                                {classesList.map(cls => (
                                    <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        className="btn btn-success" 
                        onClick={handleExportMobile} 
                        disabled={mobileLoading}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                        {mobileLoading ? 'Generating...' : <><Icons.Download size={14} /> Download Contact Excel Sheet</>}
                    </button>
                </div>

            </div>

        </div>
    );
}
