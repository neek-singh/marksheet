'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import TeacherList from '../../components/teachers/TeacherList';

export default function TeachersPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <TeacherList
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
