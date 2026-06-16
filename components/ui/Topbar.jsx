'use client';
import React from 'react';
import { useAppContext } from '../../app/context/AppContext';
import Icons from './Icons';

export default function Topbar({ pageTitle, onToggleSidebar }) {
    const { activeSession, setActiveSession } = useAppContext();

    return (
        <div className="topbar">
            <div className="topbar-left">
                <button className="hamburger" onClick={onToggleSidebar} title="Toggle Sidebar" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Menu size={20} />
                </button>
                <h1 id="page-title">{pageTitle || 'Dashboard'}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                    className="session-badge"
                    value={activeSession}
                    onChange={(e) => setActiveSession(e.target.value)}
                    style={{
                        background: 'var(--cream)',
                        color: 'var(--charcoal)',
                        border: '1px solid var(--border)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontSize: '11px',
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                >
                    <option value="2025-26" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2025-26</option>
                    <option value="2026-27" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2026-27</option>
                    <option value="2024-25" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2024-25</option>
                    <option value="2023-24" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2023-24</option>
                    <option value="2022-23" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2022-23</option>
                    <option value="2021-22" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2021-22</option>
                    <option value="2020-21" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2020-21</option>
                    <option value="2019-20" style={{ background: '#1e293b', color: '#ffffff' }}>Session 2019-20</option>
                </select>
            </div>
        </div>
    );
}
