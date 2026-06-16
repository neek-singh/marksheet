'use client';
import React from 'react';
import Icons from '../ui/Icons';

export default function ClassSummary({ classSummary, currentUser, onDownloadClassPDF }) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const classOrder = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    const sortedClasses = Object.keys(classSummary).sort((a, b) => {
        const idxA = classOrder.indexOf(a);
        const idxB = classOrder.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    if (sortedClasses.length === 0) {
        return (
            <div className="card">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.School size={18} />
                    <span>Class Marks Status</span>
                </div>
                <div className="empty-state">
                    <p>No class records found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.School size={18} />
                <span>Class Marks Status</span>
            </div>
            <div className="results-table-wrap" style={{ display: 'block' }}>
                <div className="table-scroll" style={{ display: 'block' }}>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Total</th>
                                <th>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Cmp <Icons.Check size={12} color="var(--green)" />
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Pnd <Icons.Clock size={12} color="var(--red)" />
                                    </div>
                                </th>
                                <th>Status</th>
                                {isHighAccess && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClasses.map((c) => {
                                const stats = classSummary[c];
                                const pct = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
                                return (
                                    <tr key={c}>
                                        <td>
                                            <strong>{c}</strong>
                                        </td>
                                        <td>{stats.total}</td>
                                        <td style={{ color: 'var(--green)', fontWeight: '600' }}>{stats.complete}</td>
                                        <td style={{ color: stats.pending > 0 ? '#ffa000' : 'var(--muted)', fontWeight: '600' }}>
                                            {stats.pending}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: '1', height: '6px', background: 'var(--cream)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: '100%',
                                                            background: pct === 100 ? 'var(--green)' : 'var(--gold)',
                                                            transition: 'width 0.5s ease'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                        {isHighAccess && (
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => onDownloadClassPDF(c)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '11px' }}
                                                >
                                                    <Icons.Download size={12} /> PDF
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
