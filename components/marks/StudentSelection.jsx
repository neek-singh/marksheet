'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { getStudentStatus } from '../../lib/marksUtils';
import { Icons } from '../ui/Icons';

export default function StudentSelection({ onSelectStudent, onPreviewStudent, showToast }) {
    const [searchName, setSearchName] = useState('');
    const [searchRoll, setSearchRoll] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadPendingStudents();
    }, [selectedClass]);

    const loadPendingStudents = async () => {
        setLoading(true);
        try {
            let query = db.from('students').select('*').order('name');
            if (selectedClass !== 'all') {
                query = query.eq('class', selectedClass);
            }
            const { data, error } = await query;
            if (error) throw error;
            setStudents(data || []);
        } catch (e) {
            console.error('Error loading pending students:', e);
            showToast('Error loading student list: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchName.trim() && !searchRoll.trim()) {
            showToast('Type something to search', 'error');
            return;
        }

        setLoading(true);
        try {
            let query = db.from('students').select('*').order('name');
            if (selectedClass !== 'all') {
                query = query.eq('class', selectedClass);
            }
            if (searchName.trim() && searchRoll.trim()) {
                query = query.ilike('name', `%${searchName.trim()}%`).ilike('roll_number', `%${searchRoll.trim()}%`);
            } else if (searchName.trim()) {
                query = query.ilike('name', `%${searchName.trim()}%`);
            } else if (searchRoll.trim()) {
                query = query.ilike('roll_number', `%${searchRoll.trim()}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setStudents(data || []);
            showToast(`Found ${data?.length || 0} student(s)`, 'success');
        } catch (e) {
            console.error('Search error:', e);
            showToast('Search Failed: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const classesList = ['all', 'Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    return (
        <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                <Icons.Search size={16} style={{ marginRight: '6px' }} /> Select Student to Add Marks
            </div>
            <form onSubmit={handleSearch} className="search-bar">
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Student name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Roll No.</label>
                    <input
                        type="text"
                        placeholder="Roll no."
                        value={searchRoll}
                        onChange={(e) => setSearchRoll(e.target.value)}
                    />
                </div>
                <div className="form-group search-btn-group">
                    <label>&nbsp;</label>
                    <button type="submit" className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} disabled={loading}>
                        {loading ? '' : <><Icons.Search size={14} style={{ marginRight: '6px' }} /> Search</>}
                    </button>
                </div>
            </form>

            <div className="filter-chips" id="marks-class-chips" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                {classesList.map(cls => (
                    <div
                        key={cls}
                        className={`chip ${selectedClass === cls ? 'active' : ''}`}
                        onClick={() => setSelectedClass(cls)}
                    >
                        {cls === 'all' ? 'All' : cls}
                    </div>
                ))}
            </div>

            <div id="marks-search-results">
                {loading ? (
                    <div className="loading">Fetching student records...</div>
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon"><Icons.Clipboard size={48} /></div>
                        <p>Is class mein koi student nahi mila</p>
                    </div>
                ) : (
                    <div>
                        <div className="info-row" style={{ marginBottom: '10px', color: 'var(--gold)', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                            <Icons.Pin size={14} style={{ marginRight: '6px' }} /> Student List ({students.length} Total)
                        </div>
                        <div className="results-table-wrap">
                            <div className="table-scroll">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Class</th>
                                            <th>Roll</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s) => {
                                            const status = getStudentStatus(s);
                                            return (
                                                <tr key={s.id}>
                                                    <td>
                                                        <strong>{s.name}</strong>{' '}
                                                        <span title={status.label} style={{ marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                                                            {status.label === 'Complete' ? (
                                                                <Icons.Check size={14} color="var(--green)" />
                                                            ) : status.label === 'Marks Pending' ? (
                                                                <Icons.Clock size={14} color="#ffa000" />
                                                            ) : (
                                                                <Icons.Warning size={14} color="var(--red)" />
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td>{s.class}</td>
                                                    <td>{s.roll_number || '—'}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                                            onClick={() => onSelectStudent(s)}
                                                        >
                                                            <Icons.Clipboard size={12} style={{ marginRight: '4px' }} /> {status.label === 'Complete' ? 'Edit' : 'Enter'} Marks
                                                        </button>{' '}
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                                            onClick={() => onPreviewStudent(s.id)}
                                                        >
                                                            <Icons.Eye size={12} style={{ marginRight: '4px' }} /> Preview
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
