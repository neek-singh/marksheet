'use client';
import React from 'react';
import Icons from '../ui/Icons';

export default function PendingActions({ pendingStudents, currentUser, onEnterMarks, onEditInfo }) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const showCard = isHighAccess || role === 'teacher';
    if (!showCard || !pendingStudents || pendingStudents.length === 0) return null;

    const topPending = pendingStudents.slice(0, 15);

    return (
        <div className="card" id="pending-actions-card" style={{ borderColor: 'var(--red)' }}>
            <div className="card-title" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Warning size={18} color="var(--red)" />
                Pending Actions (Missing Marks/Info)
            </div>
            <div>
                <div className="results-table-wrap">
                    <div className="table-scroll">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Required Action</th>
                                    <th>Fix</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPending.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.name}</strong>
                                        </td>
                                        <td>
                                            <span className="session-badge" style={{ display: 'inline-block' }}>
                                                {s.class}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--red)', fontWeight: '600', fontSize: '11px' }}>
                                                {s.statusObj?.label || 'Required Action'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    title="Add Marks"
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {pendingStudents.length > 15 && (
                    <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>
                        +{pendingStudents.length - 15} more students need attention.
                    </p>
                )}
            </div>
        </div>
    );
}
