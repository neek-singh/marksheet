'use client';
import React from 'react';

export default function Sidebar({ currentPage, onChangePage, currentUser, onLogout, sidebarOpen, sidebarCollapsed, onToggleCollapse }) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const hasPermission = (page) => {
        if (isHighAccess) return true;
        if (role === 'teacher') {
            return ['dashboard', 'add-student', 'students-list', 'marksheet', 'search', 'attendance', 'notices', 'download'].includes(page);
        }
        if (role === 'student' || role === 'parent') {
            return ['dashboard', 'notices'].includes(page);
        }
        return ['students-list', 'marksheet', 'fees', 'download'].includes(page);
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            )
        },
        {
            id: 'add-student',
            label: 'Add Student',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
            )
        },
        {
            id: 'students-list',
            label: 'All Students',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766v-.109A4.125 4.125 0 0 1 9.75 16.63a4.124 4.124 0 0 1 4.464 2.498ZM15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
            )
        },
        {
            id: 'marksheet',
            label: 'Marksheets',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: 'search',
            label: 'Search & Preview',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637z" />
                </svg>
            )
        },
        {
            id: 'attendance',
            label: 'Attendance',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            )
        },
        {
            id: 'fees',
            label: 'Fee Collection',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm12 4.5h.008v.008h-.008V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
            )
        },
        {
            id: 'teachers',
            label: 'Staff Directory',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766v-.109A4.125 4.125 0 0 1 9.75 16.63a4.124 4.124 0 0 1 4.464 2.498ZM15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
            )
        },
        {
            id: 'notices',
            label: 'Noticeboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.82c-.066.087-.148.163-.24.227L4 21v-4.5H3.75A1.5 1.5 0 0 1 2.25 15V9a1.5 1.5 0 0 1 1.5-1.5h6.09c.6 0 1.144.364 1.378.917l1.714 4.053c.124.294.124.624 0 .918l-1.714 4.053a1.5 1.5 0 0 1-.728.879ZM21 12c0 2.21-1.79 4-4 4v-8c2.21 0 4 1.79 4 4Zm-2 0c0 .9-.54 1.62-1.2 1.62v-3.24c.66 0 1.2.72 1.2 1.62Z" />
                </svg>
            )
        },
        {
            id: 'promotion',
            label: 'Promotion Hub',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                </svg>
            )
        },
        {
            id: 'download',
            label: 'Downloads & Exports',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
            )
        },
    ];

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">

            <nav className="sidebar-nav">
                <div className="nav-label">Menu</div>
                {menuItems.map(item => {
                    if (!hasPermission(item.id)) return null;
                    return (
                        <div
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => onChangePage(item.id)}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    );
                })}
                <div
                    className="nav-item"
                    onClick={onLogout}
                    title={sidebarCollapsed ? 'Logout' : ''}
                    style={{
                        color: 'var(--red)',
                        borderTop: '1px solid rgba(184,134,11,0.1)',
                        marginTop: '20px'
                    }}
                >
                    <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </span>
                    <span>Logout</span>
                </div>
            </nav>
        </aside>
    );
}
