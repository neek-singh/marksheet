'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClassesPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/marksheet');
    }, [router]);

    return (
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
            Redirecting to Marksheet Hub...
        </div>
    );
}
