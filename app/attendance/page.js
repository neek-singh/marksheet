'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import AttendanceSheet from '../../components/attendance/AttendanceSheet';

export default function AttendancePage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <AttendanceSheet
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
