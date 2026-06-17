'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '../../context/AppContext';
import { db } from '../../../lib/supabase';
import AdmissionForm from '../../../components/students/AdmissionForm';

function AdmissionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('edit');
    const { showToast, loadDashboardData } = useAppContext();
    const [editingStudent, setEditingStudent] = useState(null);
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
                        setEditingStudent(data);
                    }
                    setLoading(false);
                });
        } else {
            setEditingStudent(null);
        }
    }, [studentId]);

    const loadingText = 'Loading Student Details...';
    if (loading) {
        return (
            <div className="loading" style={{ padding: '40px', textAlign: 'center', fontSize: '16px' }}>
                {loadingText}
            </div>
        );
    }

    return (
        <AdmissionForm
            editingStudent={editingStudent}
            showToast={showToast}
            onSaveSuccess={async () => {
                await loadDashboardData();
                router.push('/');
            }}
        />
    );
}

const fallbackLoadingText = 'Loading...';
export default function AdmissionPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>{fallbackLoadingText}</div>}>
            <AdmissionPageContent />
        </Suspense>
    );
}
