'use client';
import React from 'react';
import { useAppContext } from '../context/AppContext';
import FeesManager from '../../components/fees/FeesManager';

export default function FeesPage() {
    const { currentUser, showToast } = useAppContext();

    return (
        <FeesManager
            currentUser={currentUser}
            showToast={showToast}
        />
    );
}
