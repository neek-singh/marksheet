'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const FeesManager = dynamic(() => import('../../components/fees/FeesManager'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Fees...</div>
});

export default function FeesPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <FeesManager
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
