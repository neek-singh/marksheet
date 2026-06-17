'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { fmtDate } from '../../lib/marksUtils';
import { Icons } from '../ui/Icons';

export default function Noticeboard({ currentUser, showToast }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [audience, setAudience] = useState('ALL');

    const role = currentUser?.role?.toLowerCase() || 'assistant';
    const isHighAccess = role === 'admin' || role === 'director';

    useEffect(() => {
        if (!currentUser) return;
        loadNotices();
    }, [currentUser]);

    const loadNotices = async () => {
        setLoading(true);
        try {
            const { data, error } = await db
                .from('notices')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setNotices(data || []);
        } catch (e) {
            console.error('Error loading notices:', e);
            showToast('Fetch Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePostNotice = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            showToast('Title & Content required!', 'error');
            return;
        }

        setFormLoading(true);
        const payload = {
            title: title.trim(),
            content: content.trim(),
            audience: audience,
            posted_by: currentUser.id
        };

        try {
            const { error } = await db
                .from('notices')
                .insert([payload]);
            if (error) throw error;

            showToast('Notice posted successfully!', 'success');
            clearForm();
            loadNotices();
        } catch (e) {
            console.error('Error posting notice:', e);
            showToast('Post Failed: ' + e.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!isHighAccess) return;
        if (!confirm('Kya aap sach mein is notice ko delete karna chahte hain?')) return;

        setLoading(true);
        try {
            const { error } = await db.from('notices').delete().eq('id', id);
            if (error) throw error;
            showToast('Notice removed!', 'success');
            loadNotices();
        } catch (e) {
            console.error('Error deleting notice:', e);
            showToast('Delete Failed: ' + e.message, 'error');
            setLoading(false);
        }
    };

    const clearForm = () => {
        setTitle('');
        setContent('');
        setAudience('ALL');
        setAdding(false);
    };

    return (
        <div>
            {adding && isHighAccess ? (
                <div className="card">
                    <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Icons.Notice size={16} /> Add New Notice / Announcement
                    </div>
                    <form onSubmit={handlePostNotice}>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label>Notice Title</label>
                            <input
                                type="text"
                                placeholder="Ex: Summer Vacation Announcement"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label>Audience / Target Group</label>
                            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                                <option value="ALL">ALL (Students, Parents & Staff)</option>
                                <option value="TEACHERS">TEACHERS ONLY</option>
                                <option value="PARENTS">PARENTS ONLY</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '18px' }}>
                            <label>Announcement Details</label>
                            <textarea
                                placeholder="Type the announcement message details here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--input-bg)',
                                    fontFamily: 'inherit',
                                    color: 'var(--ink)'
                                }}
                                required
                            />
                        </div>
                        <div className="btn-row">
                            <button type="button" className="btn btn-secondary" onClick={clearForm}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${formLoading ? 'btn-loading' : ''}`}
                                disabled={formLoading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                            >
                                {formLoading ? '' : (
                                    <>
                                        <Icons.Notice size={14} /> Publish Notice
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div>
                    <div className="card">
                        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Icons.Notice size={18} /> Digital Noticeboard
                            </span>
                            {isHighAccess && (
                                <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Icons.Plus size={12} /> Create Notice
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="loading">Loading announcements...</div>
                        ) : notices.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon">
                                    <Icons.Notice size={48} />
                                </div>
                                <p>Noticeboard bilkul khali hai</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                {notices.map(notice => (
                                    <div
                                        key={notice.id}
                                        className="student-card"
                                        style={{
                                            padding: '20px',
                                            border: '1px solid var(--border)',
                                            background: notice.audience === 'TEACHERS' ? 'var(--cream)' : 'var(--card)'
                                        }}
                                    >
                                        <div className="sc-header">
                                            <div className="sc-name" style={{ fontSize: '16px', color: 'var(--ink)' }}>
                                                {notice.title}
                                            </div>
                                            <span
                                                className="grade-badge"
                                                style={{
                                                    background: notice.audience === 'TEACHERS' ? '#e3f2fd' : '#e8f5e9',
                                                    color: notice.audience === 'TEACHERS' ? '#1565c0' : '#1a5c2a',
                                                    border: notice.audience === 'TEACHERS' ? '1px solid #90caf9' : '1px solid #a5d6a7',
                                                    fontSize: '9px'
                                                }}
                                            >
                                                {notice.audience}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '13px', margin: '10px 0', lineHeight: '1.6', color: 'rgba(26, 18, 8, 0.85)' }}>
                                            {notice.content}
                                        </p>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderTop: '1px solid var(--cream)',
                                                paddingTop: '10px',
                                                marginTop: '12px',
                                                fontSize: '11px',
                                                color: 'var(--muted)'
                                            }}
                                        >
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Icons.User size={12} /> Posted by: <strong>{notice.profiles?.full_name || 'Admin'}</strong>
                                            </span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <Icons.Calendar size={12} /> {fmtDate(notice.created_at)}
                                            </span>
                                        </div>
                                        {isHighAccess && (
                                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(notice.id)}
                                                    style={{ padding: '4px 10px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Icons.Trash size={12} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
