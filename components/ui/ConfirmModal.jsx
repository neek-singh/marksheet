'use client';
import React from 'react';

import Icons from './Icons';

export default function ConfirmModal({ show, message, onConfirm, onCancel }) {
    if (!show) return null;

    return (
        <div className="modal-overlay show">
            <div className="modal-card">
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Warning size={20} color="var(--red)" />
                    Confirmation Required
                </div>
                <div className="modal-msg">{message || 'Kya aap sach mein is student data ko delete karna chahte hain?'}</div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Nahin, Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Haan, Delete Kar Do
                    </button>
                </div>
            </div>
        </div>
    );
}
