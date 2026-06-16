'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Icons from '../ui/Icons';

export default function AttendanceOverview({ activeSession }) {
    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState([]);
    const [stats, setStats] = useState({
        avgRate: 0,
        present: 0,
        absent: 0,
        leave: 0,
        total: 0,
        latestDateStr: 'Today'
    });
    const [hoveredBar, setHoveredBar] = useState(null); // { index, x, y, label, rate, present, absent, leave }

    useEffect(() => {
        loadAttendanceStats();
    }, [activeSession]);

    const loadAttendanceStats = async () => {
        setLoading(true);
        try {
            // Fetch all attendance records for students in active session
            const { data, error } = await db
                .from('attendance')
                .select('date, status, student_id, students!inner(session)')
                .eq('students.session', activeSession);

            if (error) throw error;

            if (!data || data.length === 0) {
                setAttendanceData([]);
                setStats({
                    avgRate: 0,
                    present: 0,
                    absent: 0,
                    leave: 0,
                    total: 0,
                    latestDateStr: 'No records'
                });
                setLoading(false);
                return;
            }

            // Calculate overall stats
            const totalRecords = data.length;
            const presentRecords = data.filter(r => r.status === 'PRESENT').length;
            const avgRate = Math.round((presentRecords / totalRecords) * 100);

            // Group by date to find latest school day stats
            const dateGroups = {};
            data.forEach(r => {
                if (!dateGroups[r.date]) {
                    dateGroups[r.date] = { present: 0, absent: 0, leave: 0, total: 0 };
                }
                dateGroups[r.date].total++;
                if (r.status === 'PRESENT') dateGroups[r.date].present++;
                else if (r.status === 'ABSENT') dateGroups[r.date].absent++;
                else if (r.status === 'LEAVE') dateGroups[r.date].leave++;
            });

            const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
            const latestDate = sortedDates[0];
            const latestStats = dateGroups[latestDate] || { present: 0, absent: 0, leave: 0, total: 0 };

            // Format date for display
            let latestDateFormatted = 'Today';
            if (latestDate) {
                const dateObj = new Date(latestDate);
                latestDateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            setStats({
                avgRate,
                present: latestStats.present,
                absent: latestStats.absent,
                leave: latestStats.leave,
                total: latestStats.total,
                latestDateStr: latestDateFormatted
            });

            setAttendanceData(data);
        } catch (e) {
            console.error('Error loading attendance stats:', e);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for grouping
    const getMondayString = (dStr) => {
        const d = new Date(dStr);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(d.setDate(diff));
        return mon.toISOString().split('T')[0];
    };

    const getMonthName = (dStr) => {
        const d = new Date(dStr);
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    // Process chart data depending on view mode
    const getChartData = () => {
        if (attendanceData.length === 0) return [];

        const groups = {};

        if (viewMode === 'daily') {
            attendanceData.forEach(r => {
                if (!groups[r.date]) {
                    groups[r.date] = { present: 0, absent: 0, leave: 0, total: 0 };
                }
                groups[r.date].total++;
                if (r.status === 'PRESENT') groups[r.date].present++;
                else if (r.status === 'ABSENT') groups[r.date].absent++;
                else if (r.status === 'LEAVE') groups[r.date].leave++;
            });

            // Return last 7 school days sorted ascending
            const dates = Object.keys(groups).sort().slice(-7);
            return dates.map(date => {
                const item = groups[date];
                const rate = Math.round((item.present / item.total) * 100);
                
                // Format label: YYYY-MM-DD to "MMM DD"
                const dateObj = new Date(date);
                const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return { label, rate, ...item };
            });

        } else if (viewMode === 'weekly') {
            attendanceData.forEach(r => {
                const mon = getMondayString(r.date);
                if (!groups[mon]) {
                    groups[mon] = { present: 0, absent: 0, leave: 0, total: 0 };
                }
                groups[mon].total++;
                if (r.status === 'PRESENT') groups[mon].present++;
                else if (r.status === 'ABSENT') groups[mon].absent++;
                else if (r.status === 'LEAVE') groups[mon].leave++;
            });

            // Return last 4 weeks sorted ascending
            const weeks = Object.keys(groups).sort().slice(-4);
            return weeks.map(week => {
                const item = groups[week];
                const rate = Math.round((item.present / item.total) * 100);
                
                const dateObj = new Date(week);
                const label = 'W/O ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return { label, rate, ...item };
            });

        } else {
            // monthly
            attendanceData.forEach(r => {
                const month = r.date.substring(0, 7); // YYYY-MM
                if (!groups[month]) {
                    groups[month] = { present: 0, absent: 0, leave: 0, total: 0, monthName: getMonthName(r.date) };
                }
                groups[month].total++;
                if (r.status === 'PRESENT') groups[month].present++;
                else if (r.status === 'ABSENT') groups[month].absent++;
                else if (r.status === 'LEAVE') groups[month].leave++;
            });

            // Return last 6 months sorted ascending
            const months = Object.keys(groups).sort().slice(-6);
            return months.map(month => {
                const item = groups[month];
                const rate = Math.round((item.present / item.total) * 100);
                return { label: item.monthName, rate, ...item };
            });
        }
    };

    const chartData = getChartData();

    // Chart layouts
    const chartWidth = 620;
    const chartHeight = 160;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 25;

    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    return (
        <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', position: 'relative', marginBottom: '0' }}>
            {/* Header section with toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700' }}>
                    <Icons.Calendar size={18} style={{ color: '#0f766e' }} /> Students Attendance Overview
                </div>
                
                {/* Pill style toggles */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '30px', padding: '3px', border: '1px solid #e2e8f0' }}>
                    {['daily', 'weekly', 'monthly'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => {
                                setViewMode(mode);
                                setHoveredBar(null);
                            }}
                            style={{
                                border: 'none',
                                background: viewMode === mode ? '#ffffff' : 'transparent',
                                color: viewMode === mode ? '#0f766e' : '#64748b',
                                fontSize: '12px',
                                fontWeight: '700',
                                padding: '6px 16px',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                textTransform: 'capitalize'
                            }}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                /* Shimmer Loader */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="shimmer" style={{ height: '70px', borderRadius: '12px' }}></div>
                        ))}
                    </div>
                    <div className="shimmer" style={{ height: '160px', borderRadius: '12px', marginTop: '10px' }}></div>
                </div>
            ) : (
                /* Content Section */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Summary Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                        {/* Avg Rate */}
                        <div style={{ background: 'rgba(15, 118, 110, 0.04)', border: '1px solid rgba(15, 118, 110, 0.1)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(15, 118, 110, 0.1)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icons.TrendUp size={16} color="#0f766e" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>Avg Rate</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f766e', fontFamily: 'var(--font-mono)' }}>{stats.avgRate}%</div>
                            </div>
                        </div>

                        {/* Present */}
                        <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icons.Check size={16} color="var(--green)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>Present</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{stats.present}<span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted)' }}>/{stats.total}</span></div>
                            </div>
                        </div>

                        {/* Absent */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icons.Close size={16} color="var(--red)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>Absent</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{stats.absent}</div>
                            </div>
                        </div>

                        {/* Leave */}
                        <div style={{ background: 'rgba(234, 179, 8, 0.04)', border: '1px solid rgba(234, 179, 8, 0.1)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(234, 179, 8, 0.1)', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icons.Clock size={16} color="var(--gold)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>On Leave</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{stats.leave}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textAlign: 'right', marginTop: '-12px' }}>
                        * Latest date records: <span style={{ color: 'var(--text)' }}>{stats.latestDateStr}</span>
                    </div>

                    {/* SVG Chart Render Area */}
                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                        {chartData.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '160px',
                                background: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px dashed #cbd5e1',
                                color: '#64748b',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <Icons.Inbox size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>No Attendance Logs Found</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', maxWidth: '320px' }}>
                                    Charts and metrics will populate automatically once teacher attendance registers are submitted for session {activeSession}.
                                </div>
                            </div>
                        ) : (
                            <>
                                <svg
                                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                    width="100%"
                                    height="100%"
                                    style={{ overflow: 'visible' }}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0f766e" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                        <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#115e59" />
                                            <stop offset="100%" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>

                                    {/* Background Grid Lines (Horizontal) */}
                                    {[0, 25, 50, 75, 100].map(val => {
                                        const y = paddingTop + graphHeight - (val / 100) * graphHeight;
                                        return (
                                            <g key={val}>
                                                <line
                                                    x1={paddingLeft}
                                                    y1={y}
                                                    x2={chartWidth - paddingRight}
                                                    y2={y}
                                                    stroke="#f1f5f9"
                                                    strokeDasharray="3 3"
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    x={paddingLeft - 10}
                                                    y={y + 4}
                                                    fontSize="9"
                                                    fontWeight="600"
                                                    fill="#94a3b8"
                                                    textAnchor="end"
                                                    fontFamily="var(--font-mono)"
                                                >
                                                    {val}%
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Bar Plots */}
                                    {chartData.map((d, index) => {
                                        const barWidth = Math.min(32, Math.max(16, graphWidth / (chartData.length * 2)));
                                        const spacing = graphWidth / chartData.length;
                                        const x = paddingLeft + (index * spacing) + (spacing - barWidth) / 2;
                                        
                                        const barHeight = (d.rate / 100) * graphHeight;
                                        const y = paddingTop + graphHeight - barHeight;

                                        const isHovered = hoveredBar && hoveredBar.index === index;

                                        return (
                                            <g key={index}>
                                                {/* Background hover capture area */}
                                                <rect
                                                    x={paddingLeft + (index * spacing)}
                                                    y={paddingTop}
                                                    width={spacing}
                                                    height={graphHeight}
                                                    fill="transparent"
                                                    cursor="pointer"
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredBar({
                                                            index,
                                                            label: d.label,
                                                            rate: d.rate,
                                                            present: d.present,
                                                            absent: d.absent,
                                                            leave: d.leave
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredBar(null)}
                                                />

                                                {/* 100% Track line background */}
                                                <rect
                                                    x={x}
                                                    y={paddingTop}
                                                    width={barWidth}
                                                    height={graphHeight}
                                                    fill="#f8fafc"
                                                    rx="4"
                                                    ry="4"
                                                    style={{ pointerEvents: 'none' }}
                                                />

                                                {/* Foreground Bar */}
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                                                    rx="4"
                                                    ry="4"
                                                    style={{ pointerEvents: 'none', transition: 'all 0.2s ease-out' }}
                                                />

                                                {/* Percentage Label on Top */}
                                                <text
                                                    x={x + barWidth / 2}
                                                    y={y - 6}
                                                    fontSize="9"
                                                    fontWeight="700"
                                                    fill={isHovered ? "#0f766e" : "#64748b"}
                                                    textAnchor="middle"
                                                    fontFamily="var(--font-mono)"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {d.rate}%
                                                </text>

                                                {/* X Axis Label */}
                                                <text
                                                    x={x + barWidth / 2}
                                                    y={chartHeight - paddingBottom + 16}
                                                    fontSize="9.5"
                                                    fontWeight="700"
                                                    fill="#64748b"
                                                    textAnchor="middle"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {d.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Interactive Tooltip Card Overlay */}
                                {hoveredBar && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '60px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#1e293b',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 15px rgba(15,23,42,0.3)',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        minWidth: '130px'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px', marginBottom: '3px' }}>
                                            {hoveredBar.label}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '10px' }}>
                                            <span style={{ color: '#94a3b8', fontWeight: '600' }}>Attendance:</span>
                                            <span style={{ fontWeight: '800', color: '#4ade80' }}>{hoveredBar.rate}%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '10px' }}>
                                            <span style={{ color: '#94a3b8', fontWeight: '600' }}>Present:</span>
                                            <span style={{ fontWeight: '700' }}>{hoveredBar.present}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '10px' }}>
                                            <span style={{ color: '#94a3b8', fontWeight: '600' }}>Absent:</span>
                                            <span style={{ fontWeight: '700', color: '#f87171' }}>{hoveredBar.absent}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', fontSize: '10px' }}>
                                            <span style={{ color: '#94a3b8', fontWeight: '600' }}>Leave:</span>
                                            <span style={{ fontWeight: '700', color: '#fbbf24' }}>{hoveredBar.leave}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
