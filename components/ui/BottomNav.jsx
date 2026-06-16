'use client';
import React from 'react';

export default function BottomNav({ currentPage, onChangePage, currentUser }) {
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    const navItems = [
        {
            id: 'dashboard',
            label: 'Home',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            ),
            roles: ['admin', 'director', 'teacher', 'student', 'parent']
        },
        {
            id: 'search',
            label: 'Marks',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637z" />
                </svg>
            ),
            roles: ['admin', 'director', 'teacher']
        },
        {
            id: 'marksheet',
            label: 'Marksheets',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            roles: ['admin', 'director', 'teacher', 'assistant']
        },
        {
            id: 'attendance',
            label: 'Attendance',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            ),
            roles: ['admin', 'director', 'teacher']
        },
        {
            id: 'fees',
            label: 'Fees',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm12 4.5h.008v.008h-.008V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
            ),
            roles: ['admin', 'director', 'assistant']
        },
    ];

    const allowedItems = navItems.filter(item => {
        if (isHighAccess) return true;
        return item.roles.includes(role);
    });

    if (allowedItems.length <= 1) {
        return null;
    }

    return (
        <nav className="bottom-nav" id="bottom-nav">
            {allowedItems.map(item => (
                <div
                    key={item.id}
                    className={`bottom-nav-item ${currentPage === item.id ? 'active' : ''}`}
                    onClick={() => onChangePage(item.id)}
                    data-page={item.id}
                >
                    <span className="bn-icon">{item.icon}</span>
                    <span className="bn-label">{item.label}</span>
                </div>
            ))}
        </nav>
    );
}
