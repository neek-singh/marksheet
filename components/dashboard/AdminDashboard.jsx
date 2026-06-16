'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { useAppContext } from '../../app/context/AppContext';

import Icons from '../ui/Icons';
import StatsGrid from './StatsGrid';
import PendingActions from './PendingActions';
import AttendanceOverview from './AttendanceOverview';
import StaffOverview from './StaffOverview';

export default function AdminDashboard({
    stats,
    pendingStudents,
    currentUser,
    onEnterMarks,
    onEditInfo
}) {
    const { activeSession } = useAppContext();
    const [feeStats, setFeeStats] = useState({
        totalCollected: 0,
        cashTotal: 0,
        onlineTotal: 0,
        loading: true
    });

    useEffect(() => {
        loadFeeCollectionStats();
    }, [activeSession]);

    const loadFeeCollectionStats = async () => {
        try {
            setFeeStats(prev => ({ ...prev, loading: true }));
            const { data, error } = await db
                .from('fees_payments')
                .select('amount_paid, payment_mode, students!inner(session)')
                .eq('students.session', activeSession);
            
            if (error) throw error;

            if (data) {
                const total = data.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
                const cash = data.filter(p => p.payment_mode === 'CASH').reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
                const online = data.filter(p => p.payment_mode === 'ONLINE').reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
                
                setFeeStats({
                    totalCollected: total,
                    cashTotal: cash,
                    onlineTotal: online,
                    loading: false
                });
            }
        } catch (e) {
            console.error('Error loading fee collection stats on Admin Dashboard:', e);
            setFeeStats(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Greeting Header */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '32px 30px',
                borderRadius: '16px',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.25)',
                marginBottom: '0'
            }}>
                {/* Decorative background circle */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(184,134,11,0.2) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(184,134,11,0.15)', color: 'var(--gold-light)', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(184,134,11,0.3)' }}>
                                <Icons.Trophy size={12} color="var(--gold-light)" /> {currentUser?.role?.toLowerCase() === 'director' ? 'DIRECTOR PORTAL' : 'ADMIN COMMAND CENTER'}
                            </span>
                        </div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '850', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #e8d5a3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {currentUser?.role?.toLowerCase() === 'director' ? 'निदेशक पोर्टल' : 'प्रशासक पोर्टल'} | नमस्ते, {currentUser?.full_name || 'System User'}!
                        </h2>
                        <p style={{ color: '#94a3b8', margin: '0', fontSize: '13.5px', maxWidth: '500px', lineHeight: '1.5' }}>
                            Welcome to the Shri Hans Vidya Niketan School administrative command center. Manage student details, marks, and school fees efficiently.
                        </p>
                    </div>
                    
                    {/* Quick Stats Summary in Greeting Card */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        gap: '20px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: '600' }}>Session</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#e8d5a3', fontFamily: 'var(--font-mono)' }}>{activeSession}</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontWeight: '600' }}>Status</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span> Active
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* School Metrics Overview */}
            <StatsGrid stats={stats} />

            {/* Attendance Analytics Overview */}
            <AttendanceOverview activeSession={activeSession} />

            {/* Grid Layout for Financial Overview & Pending Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', alignItems: 'start' }}>
                {/* Financial Overview Metrics */}
                <div className="card" style={{ marginBottom: '0', background: '#ffffff', borderRadius: '16px', padding: '24px' }}>
                    <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700' }}>
                            <Icons.Fee size={18} style={{ color: 'var(--gold)' }} /> Financial Overview
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', background: 'var(--cream)', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>Live</span>
                    </div>
                    {feeStats.loading ? (
                         <div style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--muted)', padding: '10px 0' }}>Calculating...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            {/* Stat Card 1: Total Collected */}
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                                <div style={{ background: 'rgba(34, 197, 94, 0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icons.Card size={18} color="var(--green)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--green)', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>₹{feeStats.totalCollected.toLocaleString()}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Total Fees Collected</div>
                                </div>
                            </div>

                            {/* Stat Card 2: Cash Collection */}
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                                <div style={{ background: 'rgba(200, 169, 110, 0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icons.Fee size={18} color="var(--gold)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>₹{feeStats.cashTotal.toLocaleString()}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Cash Collection</div>
                                </div>
                            </div>

                            {/* Stat Card 3: Online Total */}
                            <div style={{
                                background: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                                <div style={{ background: 'rgba(15, 118, 110, 0.08)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icons.Globe size={18} color="#0f766e" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f766e', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>₹{feeStats.onlineTotal.toLocaleString()}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Online Collection</div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Incomplete items requiring actions */}
                <PendingActions
                    pendingStudents={pendingStudents}
                    currentUser={currentUser}
                    onEnterMarks={onEnterMarks}
                    onEditInfo={onEditInfo}
                />
            </div>

            {/* Staff & Faculty Overview */}
            <StaffOverview />
        </div>
    );
}
