'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const AttendanceSheet = dynamic(() => import('../../components/attendance/AttendanceSheet'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Attendance Sheet...</div>
});

export default function AttendancePage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <AttendanceSheet
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
