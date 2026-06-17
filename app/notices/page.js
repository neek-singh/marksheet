'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import Noticeboard from '../../components/notices/Noticeboard';

export default function NoticesPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <Noticeboard
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
