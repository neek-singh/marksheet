'use client';
import React, { Suspense } from 'react';
import { useAppContext } from '../context/AppContext';
import PromotionHub from '../../components/promotion/PromotionHub';

function PromotionPageContent() {
    const { currentUser } = useAppContext();
    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    if (!isHighAccess) {
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
                    You do not have permission to access the Student Promotion Hub. Please contact school administration if you believe this is an error.
                </p>
            </div>
        );
    }

    return <PromotionHub />;
}

export default function PromotionPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Promotion...</div>}>
            <PromotionPageContent />
        </Suspense>
    );
}
