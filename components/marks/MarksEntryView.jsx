'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { SUBJECTS, getGrade } from '../../lib/marksUtils';
import { Icons } from '../ui/Icons';

export default function MarksEntryView({ student, onBack, showToast, onSaveSuccess }) {
    const [step, setStep] = useState(2); // Start at Step 2 (Half Yearly entry)
    const [hyTotal, setHyTotal] = useState(100);
    const [anTotal, setAnTotal] = useState(100);
    const [marksData, setMarksData] = useState([]); // Array of { subject, hy_total, an_total, hy_obtained, an_obtained }
    const [loading, setLoading] = useState(false);

    const activeSubs = SUBJECTS[student.class] || ['HINDI', 'ENGLISH', 'MATHEMATICS'];

    useEffect(() => {
        // Determine automatic total marks based on class
        const lowerClasses = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th'];
        const autoTot = lowerClasses.includes(student.class) ? 50 : 100;
        setHyTotal(autoTot);
        setAnTotal(autoTot);

        // Prepopulate from student's existing marks if available
        const studentMarks = student.marks || [];
        const initialMarks = activeSubs.map(sub => {
            const existing = studentMarks.find(m => m.subject.toUpperCase() === sub.toUpperCase());
            return {
                subject: sub,
                hy_total: existing?.hy_total || autoTot,
                an_total: existing?.an_total || autoTot,
                hy_obtained: existing ? Number(existing.hy_obtained) : 0,
                an_obtained: existing ? Number(existing.an_obtained) : 0
            };
        });
        setMarksData(initialMarks);
    }, [student, student.class]);

    const handleObtainedChange = (subject, exam, val) => {
        const numVal = Math.max(0, Number(val));
        const maxLimit = exam === 'hy' ? hyTotal : anTotal;
        const finalVal = Math.min(numVal, maxLimit);

        setMarksData(prev =>
            prev.map(m => {
                if (m.subject === subject) {
                    return {
                        ...m,
                        [exam === 'hy' ? 'hy_obtained' : 'an_obtained']: finalVal
                    };
                }
                return m;
            })
        );
    };

    const getRowStats = (item) => {
        const hyP = hyTotal > 0 ? Math.round((item.hy_obtained / hyTotal) * 100) : 0;
        const anP = anTotal > 0 ? Math.round((item.an_obtained / anTotal) * 100) : 0;
        const tObtd = item.hy_obtained + item.an_obtained;
        const tMax = hyTotal + anTotal;
        const tP = tMax > 0 ? Math.round((tObtd / tMax) * 100) : 0;

        return {
            hyPct: hyP,
            hyGrade: getGrade(hyP),
            anPct: anP,
            anGrade: getGrade(anP),
            totalObtd: tObtd,
            totalMax: tMax,
            totalPct: tP,
            totalGrade: getGrade(tP)
        };
    };

    const getGrandTotals = () => {
        let gHyO = 0;
        let gAnO = 0;
        const numSubs = marksData.length;

        marksData.forEach(m => {
            gHyO += m.hy_obtained;
            gAnO += m.an_obtained;
        });

        const gHyT = hyTotal * numSubs;
        const gAnT = anTotal * numSubs;
        const gTO = gHyO + gAnO;
        const gTT = gHyT + gAnT;
        const gTP = gTT > 0 ? Math.round((gTO / gTT) * 100) : 0;

        return {
            hyObtd: gHyO,
            hyMax: gHyT,
            anObtd: gAnO,
            anMax: gAnT,
            totalObtd: gTO,
            totalMax: gTT,
            totalPct: gTP,
            totalGrade: getGrade(gTP)
        };
    };

    const handleSaveMarks = async () => {
        setLoading(true);
        const totals = getGrandTotals();
        
        // Ensure totals are saved inside the marks elements
        const finalMarks = marksData.map(m => ({
            ...m,
            hy_total: hyTotal,
            an_total: anTotal
        }));

        const payload = {
            marks: finalMarks,
            grand_total_obtained: totals.totalObtd,
            grand_total_marks: totals.totalMax,
            percentage: totals.totalPct,
            grade: totals.totalGrade
        };

        try {
            const { error } = await db
                .from('students')
                .update(payload)
                .eq('id', student.id);

            if (error) throw error;
            showToast('Marks saved successfully!', 'success');
            if (onSaveSuccess) onSaveSuccess();
        } catch (e) {
            console.error('Error saving marks:', e);
            showToast('Save Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const gt = getGrandTotals();

    return (
        <div>
            <div className="info-row" style={{ background: 'var(--cream)', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>Student:</span> <span>{student.name}</span> |{' '}
                <span style={{ fontWeight: 700 }}>Class:</span> <span>{student.class}</span> |{' '}
                <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Icons.ArrowLeft size={12} /> Back to List
                </button>
            </div>

            {/* Step Indicators */}
            <div className="step-indicator">
                <div className={`step-dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} data-step="2">
                    1<span className="step-label">HY</span>
                </div>
                <div className={`step-line ${step > 2 ? 'active' : ''}`}></div>
                <div className={`step-dot ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`} data-step="3">
                    2<span className="step-label">Annual</span>
                </div>
                <div className={`step-line ${step > 3 ? 'active' : ''}`}></div>
                <div className={`step-dot ${step === 4 ? 'active' : ''}`} data-step="4">
                    3<span className="step-label">Save</span>
                </div>
            </div>

            {/* STEP 2: Half Yearly */}
            {step === 2 && (
                <div className="entry-step">
                    <div className="card">
                        <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Calendar size={16} /> Half Yearly Marks Entry (Max: {hyTotal})
                        </div>
                        <div className="marks-section">
                            <div className="table-scroll">
                                <table className="marks-table" style={{ minWidth: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Obtained</th>
                                            <th>%</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marksData.map((item) => {
                                            const stats = getRowStats(item);
                                            return (
                                                <tr key={item.subject}>
                                                    <td className="subject-name">{item.subject}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="m-hy"
                                                            value={item.hy_obtained}
                                                            min="0"
                                                            max={hyTotal}
                                                            onChange={(e) => handleObtainedChange(item.subject, 'hy', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="m-hy-pct computed-cell">{stats.hyPct}%</td>
                                                    <td className="m-hy-grade">
                                                        <span className={`grade-badge grade-${stats.hyGrade === 'A+' ? 'Ap' : stats.hyGrade === 'B+' ? 'Bp' : stats.hyGrade === 'C+' ? 'Cp' : stats.hyGrade}`}>
                                                            {stats.hyGrade}
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
                    <div className="btn-row">
                        <button className="btn btn-primary" onClick={() => setStep(3)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            Next: Annual Marks <Icons.ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Annual */}
            {step === 3 && (
                <div className="entry-step">
                    <div className="card">
                        <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.Calendar size={16} /> Annual Marks Entry (Max: {anTotal})
                        </div>
                        <div className="marks-section">
                            <div className="table-scroll">
                                <table className="marks-table" style={{ minWidth: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Obtained</th>
                                            <th>%</th>
                                            <th>Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marksData.map((item) => {
                                            const stats = getRowStats(item);
                                            return (
                                                <tr key={item.subject}>
                                                    <td className="subject-name">{item.subject}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="m-an"
                                                            value={item.an_obtained}
                                                            min="0"
                                                            max={anTotal}
                                                            onChange={(e) => handleObtainedChange(item.subject, 'an', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="m-an-pct computed-cell">{stats.anPct}%</td>
                                                    <td className="m-an-grade">
                                                        <span className={`grade-badge grade-${stats.anGrade === 'A+' ? 'Ap' : stats.anGrade === 'B+' ? 'Bp' : stats.anGrade === 'C+' ? 'Cp' : stats.anGrade}`}>
                                                            {stats.anGrade}
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
                    <div className="btn-row">
                        <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.ArrowLeft size={14} /> Back
                        </button>
                        <button className="btn btn-primary" onClick={() => setStep(4)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            Next: Review <Icons.ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
                <div className="entry-step">
                    <div className="card">
                        <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.TrendUp size={16} /> Final Review
                        </div>
                        <div className="table-scroll">
                            <table className="marks-table" style={{ minWidth: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Total Obtained</th>
                                        <th>Total Max</th>
                                        <th>%</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marksData.map((item) => {
                                        const stats = getRowStats(item);
                                        return (
                                            <tr key={item.subject}>
                                                <td className="subject-name">{item.subject}</td>
                                                <td>{stats.totalObtd}</td>
                                                <td>{stats.totalMax}</td>
                                                <td>{stats.totalPct}%</td>
                                                <td>
                                                    <span className={`grade-badge grade-${stats.totalGrade === 'A+' ? 'Ap' : stats.totalGrade === 'B+' ? 'Bp' : stats.totalGrade === 'C+' ? 'Cp' : stats.totalGrade}`}>
                                                        {stats.totalGrade}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot id="marks-tfoot" style={{ background: 'var(--cream)', fontWeight: 'bold' }}>
                                    <tr>
                                        <td style={{ padding: '9px 10px' }}>GRAND TOTAL</td>
                                        <td>{gt.totalObtd}</td>
                                        <td>{gt.totalMax}</td>
                                        <td>{gt.totalPct}%</td>
                                        <td>
                                            <span className={`grade-badge grade-${gt.totalGrade === 'A+' ? 'Ap' : gt.totalGrade === 'B+' ? 'Bp' : gt.totalGrade === 'C+' ? 'Cp' : gt.totalGrade}`}>
                                                {gt.totalGrade}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="grand-total-box" style={{ marginTop: '20px' }}>
                            <div className="grand-total-grid">
                                <div className="gt-cell">
                                    <div className="gt-label">HY</div>
                                    <div className="gt-val" id="m-gt-hy">
                                        {gt.hyObtd}/{gt.hyMax}
                                    </div>
                                </div>
                                <div className="gt-cell">
                                    <div className="gt-label">Annual</div>
                                    <div className="gt-val" id="m-gt-an">
                                        {gt.anObtd}/{gt.anMax}
                                    </div>
                                </div>
                                <div className="gt-cell">
                                    <div className="gt-label">Total %</div>
                                    <div className="gt-val" id="m-gt-tot">
                                        {gt.totalPct}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
                                Grade:{' '}
                                <span id="m-gt-grade" style={{ fontWeight: 700, fontSize: '16px' }}>
                                    {gt.totalGrade}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="btn-row">
                        <button className="btn btn-secondary" onClick={() => setStep(3)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Icons.ArrowLeft size={14} /> Back
                        </button>
                        <button
                            id="save-marks-btn"
                            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                            onClick={handleSaveMarks}
                            disabled={loading}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                        >
                            {loading ? '' : (
                                <>
                                    <Icons.Save size={14} /> Save Marksheet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
