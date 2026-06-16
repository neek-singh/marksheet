'use client';
import React from 'react';
import Icons from '../ui/Icons';

export default function StatsGrid({ stats }) {
    const items = [
        {
            id: 'stat-total',
            label: 'Total Students',
            value: stats.total,
            icon: <Icons.Student size={20} />,
            iconBg: 'rgba(37, 99, 235, 0.08)',
            iconColor: '#2563eb'
        },
        {
            id: 'stat-new',
            label: 'New Students',
            value: stats.newStudents,
            icon: <Icons.Plus size={20} />,
            iconBg: 'rgba(34, 197, 94, 0.08)',
            iconColor: 'var(--green)'
        },
        {
            id: 'stat-old',
            label: 'Old Students',
            value: stats.oldStudents,
            icon: <Icons.School size={20} />,
            iconBg: 'rgba(200, 169, 110, 0.08)',
            iconColor: 'var(--gold)'
        },
        {
            id: 'stat-left',
            label: 'Left Students',
            value: stats.leftStudents,
            icon: <Icons.Close size={20} />,
            iconBg: 'rgba(239, 68, 68, 0.08)',
            iconColor: 'var(--red)'
        }
    ];

    return (
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .premium-stat-card {
                    background: #ffffff;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .premium-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
                    border-color: rgba(200, 169, 110, 0.3);
                }
                .stat-icon-wrapper {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.25s ease;
                }
                .premium-stat-card:hover .stat-icon-wrapper {
                    transform: scale(1.1);
                }
            ` }} />
            {items.map(item => (
                <div key={item.id} className="premium-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: item.iconBg, color: item.iconColor }}>
                        {item.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div
                            id={item.id}
                            style={{
                                fontSize: '22px',
                                fontWeight: '800',
                                color: 'var(--ink)',
                                fontFamily: 'var(--font-mono)',
                                lineHeight: '1.1'
                            }}
                        >
                            {item.value !== null && item.value !== undefined ? item.value : '—'}
                        </div>
                        <div
                            style={{
                                fontSize: '11px',
                                color: 'var(--muted)',
                                fontWeight: '600'
                            }}
                        >
                            {item.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
