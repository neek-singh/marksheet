'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const StudentsDirectory = dynamic(() => import('../../components/students/StudentsDirectory'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Students Directory...</div>
});

export default function StudentsPage() {
    return (
        <StudentsDirectory />
    );
}
