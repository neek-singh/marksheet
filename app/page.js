'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './context/AppContext';

import dynamic from 'next/dynamic';

// Dashboard Components (Lazy Loaded)
const AdminDashboard = dynamic(() => import('../components/dashboard/AdminDashboard'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Dashboard...</div>
});
const TeacherDashboard = dynamic(() => import('../components/dashboard/TeacherDashboard'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Teacher Dashboard...</div>
});
const StudentDashboard = dynamic(() => import('../components/dashboard/StudentDashboard'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Student Dashboard...</div>
});
const AssistantDashboard = dynamic(() => import('../components/dashboard/AssistantDashboard'), {
    loading: () => <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>Loading Assistant Dashboard...</div>
});


export default function DashboardPage() {
    const router = useRouter();
    const {
        currentUser,
        dashboardStats,
        pendingStudentsList,
        dashboardStudents,
        classSummaryData,
        personalStudent,
        handleDeleteStudent,
        handleDownloadPDF,
        handleDownloadClassPDF,
        getPathForPage,
        showToast
    } = useAppContext();

    const userRole = currentUser?.role?.toLowerCase();

    const handleNavigate = (page) => {
        router.push(getPathForPage(page));
    };

    if (userRole === 'admin' || userRole === 'director') {
        return (
            <AdminDashboard
                stats={dashboardStats}
                pendingStudents={pendingStudentsList}
                currentUser={currentUser}
                onEnterMarks={(id) => router.push(`/marksheet?studentId=${id}`)}
                onEditInfo={(id) => router.push(`/students/admission?edit=${id}`)}
            />
        );
    } else if (userRole === 'teacher') {
        return (
            <TeacherDashboard
                stats={dashboardStats}
                pendingStudents={pendingStudentsList}
                currentUser={currentUser}
                onEnterMarks={(id) => router.push(`/marksheet?studentId=${id}`)}
                onEditInfo={(id) => router.push(`/students/admission?edit=${id}`)}
                onChangePage={handleNavigate}
                onDownloadClassPDF={handleDownloadClassPDF}
                showToast={showToast}
            />
        );
    } else if (userRole === 'student' || userRole === 'parent') {
        return (
            <StudentDashboard
                personalStudent={personalStudent}
                currentUser={currentUser}
                onDownloadPDF={handleDownloadPDF}
            />
        );
    } else {
        // Assistant
        return (
            <AssistantDashboard
                stats={dashboardStats}
                pendingStudents={pendingStudentsList}
                currentUser={currentUser}
                onEnterMarks={(id) => router.push(`/marksheet?studentId=${id}`)}
                onEditInfo={(id) => router.push(`/students/admission?edit=${id}`)}
                onChangePage={handleNavigate}
            />
        );
    }
}
