'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const Noticeboard = dynamic(() => import('../../components/notices/Noticeboard'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Notices...</div>
});

export default function NoticesPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <Noticeboard
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
