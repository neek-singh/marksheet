'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const TeacherList = dynamic(() => import('../../components/teachers/TeacherList'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Staff Directory...</div>
});

export default function TeachersPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <TeacherList
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
