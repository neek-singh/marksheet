'use client';
import React from 'react';

// Reusable SVG wrapper component
const IconWrapper = ({ children, size = 18, color = 'currentColor', className = '', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-icon ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
        {...props}
    >
        {children}
    </svg>
);

export const Icons = {
    // 🎓 / 🏫 (Graduation/School)
    Academic: (props) => (
        <IconWrapper {...props}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </IconWrapper>
    ),

    School: (props) => (
        <IconWrapper {...props}>
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10M12 5v5" />
        </IconWrapper>
    ),

    // 👤 (User)
    User: (props) => (
        <IconWrapper {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </IconWrapper>
    ),

    // 🧑‍🎓 / 👨‍🎓 (Student)
    Student: (props) => (
        <IconWrapper {...props}>
            <path d="M21.5 12V9c0-.6-.4-1.2-1-1.4L12 4.3 3.5 7.6c-.6.2-1 .8-1 1.4v3c0 .6.4 1.2 1 1.4l7.5 2.9c.6.2 1.3.2 1.9 0l5.1-2" />
            <path d="M12 12.5V20M6 14v4c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-4" />
        </IconWrapper>
    ),

    // 👨‍🏫 (Teacher)
    Teacher: (props) => (
        <IconWrapper {...props}>
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
            <path d="M18 21a6 6 0 0 0-12 0" />
            <path d="M2 13h4M22 13h-4" />
        </IconWrapper>
    ),

    // 📚 (Book)
    Book: (props) => (
        <IconWrapper {...props}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </IconWrapper>
    ),

    // 💰 (Fee/Cash)
    Fee: (props) => (
        <IconWrapper {...props}>
            <path d="M6 3h12" />
            <path d="M6 8h12" />
            <path d="m6 13 8.5 8" />
            <path d="M6 13h3" />
            <path d="M9 13c6.667 0 6.667-10 0-10" />
        </IconWrapper>
    ),

    // 📢 (Notice)
    Notice: (props) => (
        <IconWrapper {...props}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </IconWrapper>
    ),

    // 📝 (Document/Clipboard)
    Document: (props) => (
        <IconWrapper {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </IconWrapper>
    ),

    // 📅 (Calendar)
    Calendar: (props) => (
        <IconWrapper {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </IconWrapper>
    ),

    // ✅ (Check)
    Check: (props) => (
        <IconWrapper {...props}>
            <polyline points="20 6 9 17 4 12" />
        </IconWrapper>
    ),

    // ❌ (Close/Cross)
    Close: (props) => (
        <IconWrapper {...props}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </IconWrapper>
    ),

    // ⚠️ (Warning)
    Warning: (props) => (
        <IconWrapper {...props}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </IconWrapper>
    ),

    // 🚨 (Alert)
    Alert: (props) => (
        <IconWrapper {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </IconWrapper>
    ),

    // ✏️ (Edit/Pen)
    Edit: (props) => (
        <IconWrapper {...props}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </IconWrapper>
    ),

    // 🗑️ (Trash)
    Trash: (props) => (
        <IconWrapper {...props}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </IconWrapper>
    ),

    // ➕ (Plus/Add)
    Plus: (props) => (
        <IconWrapper {...props}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </IconWrapper>
    ),

    // 🔍 (Search)
    Search: (props) => (
        <IconWrapper {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </IconWrapper>
    ),

    // ⚙️ (Settings)
    Settings: (props) => (
        <IconWrapper {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </IconWrapper>
    ),

    // 📈 (TrendUp/Chart)
    TrendUp: (props) => (
        <IconWrapper {...props}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </IconWrapper>
    ),

    // 📉 (TrendDown)
    TrendDown: (props) => (
        <IconWrapper {...props}>
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
        </IconWrapper>
    ),

    // ℹ️ (Info)
    Info: (props) => (
        <IconWrapper {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </IconWrapper>
    ),

    // 🔔 (Bell)
    Bell: (props) => (
        <IconWrapper {...props}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </IconWrapper>
    ),

    // ☰ (Hamburger Menu)
    Menu: (props) => (
        <IconWrapper {...props}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </IconWrapper>
    ),

    // ⏳ (Hourglass/Clock)
    Clock: (props) => (
        <IconWrapper {...props}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </IconWrapper>
    ),

    // 🏆 (Trophy)
    Trophy: (props) => (
        <IconWrapper {...props}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
            <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
        </IconWrapper>
    ),

    // 👁️ (Eye)
    Eye: (props) => (
        <IconWrapper {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </IconWrapper>
    ),

    // ⬇ (Download)
    Download: (props) => (
        <IconWrapper {...props}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </IconWrapper>
    ),

    // 📌 (Pin)
    Pin: (props) => (
        <IconWrapper {...props}>
            <line x1="18" y1="8" x2="22" y2="12" />
            <line x1="12" y1="12" x2="2" y2="22" />
            <path d="M12 2a8 8 0 0 0-8 8c0 1.5.5 3 1.5 4L12 22l6.5-8c1-1 1.5-2.5 1.5-4a8 8 0 0 0-8-8z" />
        </IconWrapper>
    ),

    // 📭 (Inbox/Empty State)
    Inbox: (props) => (
        <IconWrapper {...props}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </IconWrapper>
    ),

    // 💳 (Credit Card)
    Card: (props) => (
        <IconWrapper {...props}>
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
        </IconWrapper>
    ),

    // 🌐 (Globe)
    Globe: (props) => (
        <IconWrapper {...props}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </IconWrapper>
    ),

    // 📊/🎛️ (Dashboard)
    Dashboard: (props) => (
        <IconWrapper {...props}>
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
        </IconWrapper>
    ),

    // 🤖/🧠/⚙️ (AI/Cpu)
    Cpu: (props) => (
        <IconWrapper {...props}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="15" x2="23" y2="15" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="15" x2="4" y2="15" />
        </IconWrapper>
    ),

    // 📋 (Clipboard)
    Clipboard: (props) => (
        <IconWrapper {...props}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </IconWrapper>
    ),
    
    // ⬅️ (ArrowLeft)
    ArrowLeft: (props) => (
        <IconWrapper {...props}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </IconWrapper>
    ),

    // ➡️ (ArrowRight)
    ArrowRight: (props) => (
        <IconWrapper {...props}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </IconWrapper>
    ),

    // 💾 (Save)
    Save: (props) => (
        <IconWrapper {...props}>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </IconWrapper>
    )
};

export default Icons;
