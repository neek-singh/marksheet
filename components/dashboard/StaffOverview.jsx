'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Icons from '../ui/Icons';

export default function StaffOverview() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            // Set data to 0 (empty array) as there is no data right now
            setTeachers([]);
        } catch (e) {
            console.error('Error loading teachers for overview:', e);
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalStaff = teachers.length;
    const activeStaff = teachers.filter(t => t.status === 'ACTIVE').length;
    const leaveStaff = teachers.filter(t => t.status === 'ON LEAVE').length;
    const totalPayroll = teachers.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);

    // Group by department
    const deptCounts = {};
    teachers.forEach(t => {
        const dept = t.department || 'Other';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const deptList = Object.keys(deptCounts).map(dept => ({
        name: dept,
        count: deptCounts[dept],
        percentage: totalStaff > 0 ? Math.round((deptCounts[dept] / totalStaff) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Initial Circle Colors based on Name
    const getInitialsColor = (name) => {
        const char = name.trim().charAt(0).toUpperCase();
        const colors = {
            'A': '#f43f5e', 'B': '#ec4899', 'C': '#d946ef', 'D': '#a855f7',
            'E': '#8b5cf6', 'F': '#6366f1', 'G': '#3b82f6', 'H': '#0ea5e9',
            'I': '#06b6d4', 'J': '#14b8a6', 'K': '#10b981', 'L': '#22c55e',
            'M': '#84cc16', 'N': '#eab308', 'O': '#f59e0b', 'P': '#f97316',
            'Q': '#ef4444', 'R': '#4b5563', 'S': '#0f766e', 'T': '#b8860b',
            'U': '#7c2d12', 'V': '#312e81', 'W': '#1e1b4b', 'X': '#831843',
            'Y': '#022c22', 'Z': '#422006'
        };
        return colors[char] || 'var(--primary)';
    };

    const getInitials = (name) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.trim().slice(0, 2).toUpperCase();
    };

    return (
        <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '0' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700' }}>
                    <Icons.Teacher size={18} style={{ color: 'var(--primary)' }} /> Staff & Faculty Directory Overview
                </div>
                <span style={{ fontSize: '10px', color: 'var(--muted)', background: 'var(--cream)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>Live Database</span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="shimmer" style={{ height: '55px', borderRadius: '10px' }}></div>
                        ))}
                    </div>
                    <div className="shimmer" style={{ height: '200px', borderRadius: '12px' }}></div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Key Stats Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'rgba(75, 85, 99, 0.08)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                <Icons.User size={15} color="#4b5563" />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>Total Staff</div>
                                <div style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{totalStaff}</div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.08)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                <Icons.Check size={15} color="var(--green)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>Active</div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{activeStaff}</div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                <Icons.Clock size={15} color="var(--red)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>On Leave</div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{leaveStaff}</div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'rgba(184, 134, 11, 0.08)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                                <Icons.Fee size={15} color="var(--gold)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>Monthly Payroll</div>
                                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold-dark)', fontFamily: 'var(--font-mono)' }}>₹{totalPayroll.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Section: Dept Distribution & Staff Directory Grid */}
                    {totalStaff === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '180px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px dashed #cbd5e1',
                            color: '#64748b',
                            padding: '20px',
                            textAlign: 'center',
                            marginTop: '10px'
                        }}>
                            <Icons.Inbox size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>No Teacher Profiles Registered</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '320px' }}>
                                Add faculty members in the Staff Directory portal to generate payroll summaries and department allocation statistics.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
                            
                            {/* Column 1: Department Distribution */}
                            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '18px' }}>
                                <strong style={{ display: 'block', fontSize: '12.5px', color: '#1e293b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Department Allocations
                                </strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {deptList.map((dept, index) => (
                                        <div key={dept.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>
                                                <span>{dept.name}</span>
                                                <span>{dept.count} {dept.count > 1 ? 'Teachers' : 'Teacher'} ({dept.percentage}%)</span>
                                            </div>
                                            {/* Progress Track */}
                                            <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{
                                                    background: `linear-gradient(to right, ${index === 0 ? '#0f766e, #14b8a6' : index === 1 ? '#0284c7, #38bdf8' : '#b8860b, #e8d5a3'})`,
                                                    width: `${dept.percentage}%`,
                                                    height: '100%',
                                                    borderRadius: '10px',
                                                    transition: 'width 0.5s ease-out'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Column 2: Staff List Directory */}
                            <div>
                                <strong style={{ display: 'block', fontSize: '12.5px', color: '#1e293b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Active Faculty Directory
                                </strong>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {teachers.map(t => {
                                        const initColor = getInitialsColor(t.full_name);
                                        const initials = getInitials(t.full_name);
                                        const isActive = t.status === 'ACTIVE';

                                        return (
                                            <div
                                                key={t.id}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                    padding: '10px 14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '12px',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {/* Initials Badge */}
                                                    <div style={{
                                                        background: initColor,
                                                        color: '#ffffff',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        flexShrink: 0
                                                    }}>
                                                        {initials}
                                                    </div>
                                                    
                                                    <div>
                                                        <div style={{ fontSize: '12.5px', fontWeight: '750', color: 'var(--text)' }}>
                                                            {t.full_name}
                                                        </div>
                                                        <div style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: '600' }}>
                                                            {t.designation} • <span style={{ color: '#0f766e' }}>{t.department}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Section: Status & Details */}
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        fontSize: '8px',
                                                        fontWeight: '800',
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                        color: isActive ? 'var(--green)' : 'var(--red)',
                                                        border: `1px solid ${isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`
                                                    }}>
                                                        {t.status}
                                                    </span>
                                                    <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '700', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                                        {t.employee_id}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
