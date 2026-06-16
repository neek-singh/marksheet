'use client';
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import dynamic from 'next/dynamic';

const SearchAndPreview = dynamic(() => import('../../components/search/SearchAndPreview'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Search & Preview...</div>
});

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const previewId = searchParams.get('preview');
    const { currentUser, showToast, handleDeleteStudent, handleDownloadPDF } = useAppContext();

    return (
        <SearchAndPreview
            currentUser={currentUser}
            activeStudentId={previewId}
            onClosePreview={() => router.push('/search')}
            onDownloadPDF={handleDownloadPDF}
            onEnterMarks={(s) => router.push(`/marksheet?studentId=${s.id}`)}
            onEditInfo={(s) => router.push(`/students/admission?edit=${s.id}`)}
            onDelete={(id) => handleDeleteStudent(id, () => router.push('/search'))}
            showToast={showToast}
        />
    );
}

const fallbackLoadingText = 'Loading...';
export default function SearchPage() {
    return (
        <Suspense fallback={<div className="loading" style={{ padding: '40px', textAlign: 'center' }}>{fallbackLoadingText}</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
