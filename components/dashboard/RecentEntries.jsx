'use client';
import React from 'react';
import { getStudentStatus } from '../../lib/marksUtils';
import Icons from '../ui/Icons';

export default function RecentEntries({
    students,
    currentUser,
    onPreview,
    onDownloadPDF,
    onEnterMarks,
    onEditInfo,
    onDelete
}) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const getGradeBadge = (grade) => {
        if (!grade) return '';
        const gradeClass = 'grade-' + (grade === 'A+' ? 'Ap' : grade === 'B+' ? 'Bp' : grade === 'C+' ? 'Cp' : grade);
        return <span className={`grade-badge ${gradeClass}`}>{grade}</span>;
    };

    const renderStatusIcon = (statusObj) => {
        if (!statusObj) return null;
        if (statusObj.icon === '✅') {
            return <Icons.Check size={14} color="var(--green)" style={{ marginLeft: '4px' }} title={statusObj.label} />;
        }
        if (statusObj.icon === '⚠️') {
            return <Icons.Warning size={14} color="var(--red)" style={{ marginLeft: '4px' }} title={statusObj.label} />;
        }
        return null;
    };

    if (!students || students.length === 0) {
        return (
            <div className="card">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Pin size={18} />
                    <span>Recent Entries</span>
                </div>
                <div className="empty-state">
                    <div className="icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <Icons.Inbox size={48} color="var(--muted)" />
                    </div>
                    <p>Koi student abhi tak add nahi hua</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Pin size={18} />
                <span>Recent Entries</span>
            </div>
            
            {/* Desktop Table View */}
            <div className="results-table-wrap">
                <div className="table-scroll">
                    <table className="results-table" style={{ minWidth: '480px' }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Roll</th>
                                <th>%</th>
                                <th>Grade</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => {
                                const status = getStudentStatus(s);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <strong>{s.name}</strong>
                                                {renderStatusIcon(status)}
                                            </div>
                                        </td>
                                        <td>{s.class}</td>
                                        <td>{s.roll_number || '—'}</td>
                                        <td>{s.percentage !== null && s.percentage !== undefined ? `${s.percentage}%` : '0%'}</td>
                                        <td>{getGradeBadge(s.grade)}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    className="btn btn-info btn-sm"
                                                    title="Preview"
                                                    onClick={() => onPreview(s.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                >
                                                    <Icons.Eye size={14} />
                                                </button>
                                                {isHighAccess && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        title="Download PDF"
                                                        onClick={() => onDownloadPDF(s.id)}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px' }}
                                                    >
                                                        <Icons.Download size={12} /> PDF
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    title="Add/Edit Marks"
                                                    onClick={() => onEnterMarks(s.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                >
                                                    <Icons.Clipboard size={14} />
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    title="Edit Info"
                                                    onClick={() => onEditInfo(s.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                >
                                                    <Icons.Edit size={14} />
                                                </button>
                                                {isHighAccess && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        title="Delete Student"
                                                        onClick={() => onDelete(s.id)}
                                                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                                    >
                                                        <Icons.Trash size={14} />
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

            {/* Mobile Cards View */}
            <div className="student-cards">
                {students.map((s) => {
                    const status = getStudentStatus(s);
                    const pct = s.percentage !== null && s.percentage !== undefined ? s.percentage : 0;
                    const obtd = s.grand_total_obtained !== null && s.grand_total_obtained !== undefined ? s.grand_total_obtained : 0;
                    const max = s.grand_total_marks !== null && s.grand_total_marks !== undefined ? s.grand_total_marks : 0;

                    return (
                        <div className="student-card" key={s.id}>
                            <div className="sc-header">
                                <div className="sc-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {s.name || 'Unknown Student'}
                                    {renderStatusIcon(status)}
                                </div>
                                {getGradeBadge(s.grade)}
                            </div>
                            <div className="sc-meta">
                                {s.class} | Roll: {s.roll_number || '—'} | Mr. {s.father_name || '—'}
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
                                <button className="btn btn-info btn-sm" title="Preview" onClick={() => onPreview(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Eye size={12} /> Preview
                                </button>
                                {isHighAccess && (
                                    <button className="btn btn-success btn-sm" onClick={() => onDownloadPDF(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Icons.Download size={12} /> PDF
                                    </button>
                                )}
                                <button className="btn btn-primary btn-sm" onClick={() => onEnterMarks(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Clipboard size={12} /> Marks
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => onEditInfo(s.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Edit size={12} /> Info
                                </button>
                                {isHighAccess && (
                                    <button className="btn btn-danger btn-sm" title="Delete Student" onClick={() => onDelete(s.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                                        <Icons.Trash size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
