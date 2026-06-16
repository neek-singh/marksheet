'use client';
import React, { Suspense } from 'react';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const DownloadHub = dynamic(() => import('../../components/download/DownloadHub'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Downloads Center...</div>
});

function DownloadPageContent() {
    const { currentUser } = useAppContext();
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isAllowed = ['admin', 'director', 'teacher', 'assistant'].includes(role);

    if (!isAllowed) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 40px',
                textAlign: 'center',
                minHeight: '60vh'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
                <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--red)', margin: '0 0 10px 0' }}>
                    Access Denied / प्रवेश वर्जित
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '450px', margin: 0 }}>
                    You do not have permission to access the Downloads & Exports Center. Please contact school administration if you believe this is an error.
                </p>
            </div>
        );
    }

    return <DownloadHub />;
}

export default function DownloadPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}>
            <DownloadPageContent />
        </Suspense>
    );
}
