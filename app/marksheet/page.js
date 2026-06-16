'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { db } from '../../lib/supabase';
import dynamic from 'next/dynamic';

const MarksheetHub = dynamic(() => import('../../components/marks/MarksheetHub'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Marksheet Hub...</div>
});

const MarksEntryView = dynamic(() => import('../../components/marks/MarksEntryView'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Marks Entry...</div>
});

function MarksheetPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    const { showToast, loadDashboardData } = useAppContext();
    
    const [activeStudent, setActiveStudent] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (studentId) {
            setLoading(true);
            db.from('students')
                .select('*')
                .eq('id', studentId)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        showToast('Error loading student: ' + error.message, 'error');
                    } else {
                        setActiveStudent(data);
                    }
                    setLoading(false);
                });
        } else {
            setActiveStudent(null);
        }
    }, [studentId]);

    const loadingText = 'Loading Academic Student Profile...';
    if (loading) {
        return (
            <div className="loading" style={{ padding: '40px', textAlign: 'center', fontSize: '16px' }}>
                {loadingText}
            </div>
        );
    }

    if (activeStudent) {
        return (
            <MarksEntryView
                student={activeStudent}
                onBack={() => router.push('/marksheet')}
                showToast={showToast}
                onSaveSuccess={async () => {
                    await loadDashboardData();
                    router.push('/marksheet');
                }}
            />
        );
    }

    return (
        <MarksheetHub
            onEnterMarks={(s) => router.push(`/marksheet?studentId=${s.id}`)}
            onPreviewStudent={(id) => router.push(`/search?preview=${id}`)}
            onEditInfo={(id) => router.push(`/students/admission?edit=${id}`)}
        />
    );
}

const fallbackLoadingText = 'Loading Marksheet Hub...';
export default function MarksheetPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>{fallbackLoadingText}</div>}>
            <MarksheetPageContent />
        </Suspense>
    );
}
