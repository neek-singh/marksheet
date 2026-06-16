'use client';
import React from 'react';

// Shared Components
import PendingActions from './PendingActions';
import Noticeboard from '../notices/Noticeboard';
import Icons from '../ui/Icons';

export default function AssistantDashboard({
    stats,
    pendingStudents,
    currentUser,
    onEnterMarks,
    onEditInfo,
    onChangePage
}) {
    // Custom stats structure for Assistant focusing on data entry queues
    const assistantStats = {
        total: stats.total,
        infoPending: stats.infoPending,
        marksPending: stats.marksPending
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Greeting Header */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(184,134,11,0.08) 0%, rgba(20,20,20,0.6) 100%)', border: '1px solid rgba(184,134,11,0.2)', marginBottom: '0' }}>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    नमस्ते, {currentUser?.full_name || 'Assistant'}!
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: '14px' }}>
                    Assistant Portal. Fill out student academic marks, process new admissions, and complete pending record registries.
                </p>
            </div>

            {/* Quick action buttons */}
            <div className="card" style={{ marginBottom: '0' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Settings size={18} />
                    <span>Operational Shortcuts</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '14px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => onChangePage('add-student')}
                    >
                        <Icons.Plus size={16} /> New Student Admission
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '14px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => onChangePage('add-marks')}
                    >
                        <Icons.Clipboard size={16} /> Enter Academic Marks
                    </button>
                    <button
                        className="btn btn-success"
                        style={{ padding: '14px 20px', fontSize: '14px', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => onChangePage('fees')}
                    >
                        <Icons.Fee size={16} /> Fee Collection Counter
                    </button>
                </div>
            </div>

            {/* Queue Metrics */}
            <div className="stats-row" style={{ margin: '0' }}>
                <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                    <div className="number" style={{ color: 'var(--gold)' }}>{assistantStats.total !== null ? assistantStats.total : '—'}</div>
                    <div className="label">Total Students Registered</div>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2', borderColor: '#e67e22' }}>
                    <div className="number" style={{ color: '#e67e22' }}>
                        {assistantStats.infoPending !== null ? assistantStats.infoPending : '—'}
                    </div>
                    <div className="label">Missing Info Profiles</div>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2', borderColor: 'var(--red)' }}>
                    <div className="number" style={{ color: 'var(--red)' }}>
                        {assistantStats.marksPending !== null ? assistantStats.marksPending : '—'}
                    </div>
                    <div className="label">Pending Marks Entries</div>
                </div>
            </div>

            {/* Action lists */}
            <PendingActions
                pendingStudents={pendingStudents}
                currentUser={currentUser}
                onEnterMarks={onEnterMarks}
                onEditInfo={onEditInfo}
            />



            {/* School notices feed */}
            <Noticeboard currentUser={currentUser} showToast={() => {}} />
        </div>
    );
}
