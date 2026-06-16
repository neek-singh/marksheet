'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { getStudentStatus, gClass } from '../../lib/marksUtils';

export default function ClasswiseList({
    currentUser,
    onPreviewStudent,
    onEnterMarks,
    onEditInfo,
    onDelete,
    onDownloadPDF,
    onDownloadClassPDF,
    showToast
}) {
    const [selectedClass, setSelectedClass] = useState('all');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const { data, error } = await db
                .from('students')
                .select('*')
                .order('class')
                .order('name');
            if (error) throw error;
            setStudents(data || []);
        } catch (e) {
            console.error('Error loading classwise students:', e);
            showToast('Error loading student lists: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const getGradeBadge = (grade) => {
        if (!grade) return '';
        const gradeClass = gClass(grade);
        return <span className={`grade-badge ${gradeClass}`}>{grade}</span>;
    };

    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    const filteredStudents = selectedClass === 'all'
        ? students
        : students.filter(s => s.class === selectedClass);

    // Group filtered students by class
    const grouped = {};
    filteredStudents.forEach(s => {
        if (!grouped[s.class]) grouped[s.class] = [];
        grouped[s.class].push(s);
    });

    return (
        <div className="card">
            <div className="card-title">📋 Class-wise Students</div>
            
            <div className="filter-chips" id="class-chips">
                {classesList.map(cls => (
                    <div
                        key={cls}
                        className={`chip ${selectedClass === cls ? 'active' : ''}`}
                        onClick={() => setSelectedClass(cls)}
                    >
                        {cls === 'all' ? 'All' : cls}
                    </div>
                ))}
            </div>

            <div id="classwise-results">
                {loading ? (
                    <div className="loading">Loading student lists...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📭</div>
                        <p>Is class mein koi student nahi</p>
                    </div>
                ) : (
                    Object.keys(grouped).map(c => {
                        const classStudents = grouped[c];
                        const avg = classStudents.length
                            ? Math.round(classStudents.reduce((sum, d) => sum + (d.percentage || 0), 0) / classStudents.length)
                            : 0;

                        return (
                            <div key={c} style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>Class {c}</div>
                                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--muted)' }}>
                                        {classStudents.length} students • avg {avg}%
                                    </div>
                                    {isHighAccess && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => onDownloadClassPDF(c)}
                                        >
                                            ⬇ All PDF
                                        </button>
                                    )}
                                </div>

                                <div className="results-table-wrap" style={{ display: 'block' }}>
                                    <div className="table-scroll" style={{ display: 'block' }}>
                                        <table className="results-table" style={{ minWidth: '460px' }}>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Roll</th>
                                                    <th>Obtained</th>
                                                    <th>%</th>
                                                    <th>Grade</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {classStudents.map((s, index) => {
                                                    const status = getStudentStatus(s);
                                                    return (
                                                        <tr key={s.id}>
                                                            <td style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                <strong>{s.name}</strong>{' '}
                                                                <span title={status.label} style={{ cursor: 'help' }}>
                                                                    {status.icon}
                                                                </span>
                                                                <br />
                                                                <small style={{ color: 'var(--muted)' }}>{s.father_name || ''}</small>
                                                            </td>
                                                            <td>{s.roll_number || '—'}</td>
                                                            <td>
                                                                {s.grand_total_obtained || 0}/{s.grand_total_marks || 0}
                                                            </td>
                                                            <td>
                                                                <strong>{s.percentage || 0}%</strong>
                                                            </td>
                                                            <td>{getGradeBadge(s.grade)}</td>
                                                            <td>
                                                                <div className="action-btns">
                                                                    <button
                                                                        className="btn btn-info btn-sm"
                                                                        title="Preview Data"
                                                                        onClick={() => onPreviewStudent(s.id)}
                                                                    >
                                                                        👁️
                                                                    </button>
                                                                    {isHighAccess && (
                                                                        <button
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={() => onDownloadPDF(s.id)}
                                                                        >
                                                                            ⬇ PDF
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => onEnterMarks(s)}
                                                                    >
                                                                        📝 Marks
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-secondary btn-sm"
                                                                        onClick={() => onEditInfo(s)}
                                                                    >
                                                                        ✏️ Info
                                                                    </button>
                                                                    {isHighAccess && (
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => onDelete(s.id)}
                                                                        >
                                                                            🗑
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="student-cards" style={{ marginTop: '10px' }}>
                                    {classStudents.map(s => {
                                        const status = getStudentStatus(s);
                                        const pct = s.percentage !== null && s.percentage !== undefined ? s.percentage : 0;
                                        const obtd = s.grand_total_obtained !== null && s.grand_total_obtained !== undefined ? s.grand_total_obtained : 0;
                                        const max = s.grand_total_marks !== null && s.grand_total_marks !== undefined ? s.grand_total_marks : 0;

                                        return (
                                            <div className="student-card" key={s.id}>
                                                <div className="sc-header">
                                                    <div className="sc-name">
                                                        {s.name || 'Unknown Student'}{' '}
                                                        <span title={status.label} style={{ cursor: 'help', fontSize: '14px' }}>
                                                            {status.icon}
                                                        </span>
                                                    </div>
                                                    {getGradeBadge(s.grade)}
                                                </div>
                                                <div className="sc-meta">
                                                    {s.class} | Roll: {s.roll_number || '—'} | {s.father_name || ''}
                                                </div>
                                                <div className="sc-stats">
                                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: '700', color: 'var(--gold)' }}>
                                                        {pct}%
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                                                        {obtd}/{max}
                                                    </span>
                                                </div>
                                                <div className="sc-actions" style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                                    <button className="btn btn-info btn-sm" onClick={() => onPreviewStudent(s.id)}>
                                                        👁️ Preview
                                                    </button>
                                                    {isHighAccess && (
                                                        <button className="btn btn-success btn-sm" onClick={() => onDownloadPDF(s.id)}>
                                                            ⬇ PDF
                                                        </button>
                                                    )}
                                                    <button className="btn btn-primary btn-sm" onClick={() => onEnterMarks(s)}>
                                                        📝 Marks
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => onEditInfo(s)}>
                                                        ✏️ Info
                                                    </button>
                                                    {isHighAccess && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(s.id)}>
                                                            🗑
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
