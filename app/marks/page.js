'use client';
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MarksPageRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const studentId = searchParams.get('studentId');
        if (studentId) {
            router.replace(`/marksheet?studentId=${studentId}`);
        } else {
            router.replace('/marksheet');
        }
    }, [searchParams, router]);

    return (
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
            Redirecting to Marksheet Hub...
        </div>
    );
}

export default function MarksPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Redirecting...</div>}>
            <MarksPageRedirect />
        </Suspense>
    );
}
