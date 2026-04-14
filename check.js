
        // ─── ERROR REPORTING ───
        window.onerror = (m, u, l) => showToast('Browser Error: ' + m, 'error');
        window.onunhandledrejection = (e) => showToast('Promise Error: ' + (e.reason ? e.reason.message : 'failed'), 'error');

        // ─── SUPABASE ───
        const db = supabase.createClient(
            'https://jbbcpzkymgfuxkfgnbfh.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmNwemt5bWdmdXhrZmduYmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Nzk2MDgsImV4cCI6MjA5MTM1NTYwOH0.61m09vQiE6x_9vUSemXqthKIimP-t_5R5zq94mFLje4'
        );
        let editingId = null;
        let currentPage = 'dashboard';
        let currentClassFilter = 'all';

        // ─── SUBJECTS ───
        const SUBJECTS = {
            'Nursery': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
            'KG-I': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
            'KG-II': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
            '1st': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
            '2nd': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
            '3rd': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'],
            '4th': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'],
            '5th': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'], // Assuming same as 4th
            '6th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'],
            '7th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'],
            '8th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'], // Assuming same as 7th
        };
        const PAGE_TITLES = { dashboard: 'Dashboard', add: 'Add Student Marksheet', search: 'Search & Preview', classwise: 'Class-wise Students' };

        // ─── GRADING ───
        function getGrade(p) { p = Number(p); if (p >= 91) return 'A+'; if (p >= 81) return 'A'; if (p >= 71) return 'B+'; if (p >= 61) return 'B'; if (p >= 51) return 'C+'; if (p >= 41) return 'C'; if (p >= 33) return 'D'; return 'E'; }
        function gClass(g) { return 'grade-' + (g === 'A+' ? 'Ap' : g === 'B+' ? 'Bp' : g === 'C+' ? 'Cp' : g); }
        function gBadge(g) { return `<span class="grade-badge ${gClass(g)}">${g}</span>`; }

        // ─── NAV ───
        function showPage(name) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + name).classList.add('active');
            currentPage = name;
            document.getElementById('page-title').textContent = PAGE_TITLES[name];
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => {
                const t = n.textContent.toLowerCase();
                if ((name === 'dashboard' && t.includes('dashboard')) || (name === 'add' && t.includes('add')) || (name === 'search' && t.includes('search')) || (name === 'classwise' && t.includes('class'))) n.classList.add('active');
            });
            document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
            if (name === 'dashboard') loadDashboard();
            if (name === 'classwise') { allStudents = []; loadClasswise('all'); }
            if (name === 'add') setEntryStep(1);
        }

        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('show'); }
        function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('show'); }



        function computeRow(input) {
            const sub = input.dataset.sub;
            const hyT = parseInt(document.getElementById('hy-total').value) || 100;
            const anT = parseInt(document.getElementById('an-total').value) || 100;

            const hyIn = document.querySelector(`.m-hy[data-sub="${sub}"]`);
            const anIn = document.querySelector(`.m-an[data-sub="${sub}"]`);
            
            const hyO = parseFloat(hyIn.value) || 0;
            const anO = parseFloat(anIn.value) || 0;
            
            const hyP = Math.round(hyO / hyT * 100);
            const anP = Math.round(anO / anT * 100);
            const tO = hyO + anO, tT = hyT + anT, tP = Math.round(tO / tT * 100);
            
            // Update row UI
            const hyRow = hyIn.closest('tr');
            const anRow = anIn.closest('tr');
            if (hyRow) {
                const hyPct = hyRow.querySelector('.m-hy-pct');
                const hyG = hyRow.querySelector('.m-hy-grade');
                if (hyPct) hyPct.textContent = hyP + '%';
                if (hyG) hyG.innerHTML = gBadge(getGrade(hyP));
            }
            if (anRow) {
                const anPct = anRow.querySelector('.m-an-pct');
                const anG = anRow.querySelector('.m-an-grade');
                if (anPct) anPct.textContent = anP + '%';
                if (anG) anG.innerHTML = gBadge(getGrade(anP));
            }

            // Update Summary row
            const sRow = document.getElementById(`sum-row-${sub.replace(/\s+/g, '-')}`);
            if (sRow) {
                const sOb = sRow.querySelector('.sum-ob');
                const sPct = sRow.querySelector('.sum-pct');
                const sG = sRow.querySelector('.sum-grade');
                if (sOb) sOb.textContent = tO;
                if (sPct) sPct.textContent = tP + '%';
                if (sG) sG.innerHTML = gBadge(getGrade(tP));
            }

            computeGrandTotal();
        }

        function computeGrandTotal() {
            const hyT = parseInt(document.getElementById('hy-total').value) || 100;
            const anT = parseInt(document.getElementById('an-total').value) || 100;
            
            let gHyO = 0, gAnO = 0;
            const hyIns = document.querySelectorAll('.m-hy');
            const anIns = document.querySelectorAll('.m-an');
            
            hyIns.forEach(el => gHyO += parseFloat(el.value) || 0);
            anIns.forEach(el => gAnO += parseFloat(el.value) || 0);
            
            const n = hyIns.length;
            const gHyT = hyT * n, gAnT = anT * n;
            const gTO = gHyO + gAnO, gTT = gHyT + gAnT;
            const gTP = gTT > 0 ? Math.round(gTO / gTT * 100) : 0;

            const s = (id, v, html = false) => { const el = document.getElementById(id); if (el) { html ? el.innerHTML = v : el.textContent = v; } };
            
            s('m-gt-hy', `${gHyO}/${gHyT}`);
            s('m-gt-an', `${gAnO}/${gAnT}`);
            s('m-gt-tot', gTP + '%');
            s('m-gt-grade', getGrade(gTP));

            const ft = document.getElementById('marks-tfoot');
            if (ft) {
                ft.innerHTML = `
                    <tr>
                        <td style="padding:9px 10px;">GRAND TOTAL</td>
                        <td>${gTO}</td>
                        <td>${gTT}</td>
                        <td>${gTP}%</td>
                        <td>${gBadge(getGrade(gTP))}</td>
                    </tr>`;
            }
        }

        function collectMarks() {
            const marks = [];
            const hyIns = document.querySelectorAll('.m-hy');
            const hyT = parseInt(document.getElementById('hy-total').value) || 100;
            const anT = parseInt(document.getElementById('an-total').value) || 100;

            hyIns.forEach(hyIn => {
                const sub = hyIn.dataset.sub;
                const anIn = document.querySelector(`.m-an[data-sub="${sub}"]`);
                const hyO = parseFloat(hyIn.value) || 0;
                const anO = parseFloat(anIn.value) || 0;
                marks.push({
                    subject: sub,
                    hy_total: hyT,
                    an_total: anT,
                    hy_obtained: hyO,
                    an_obtained: anO
                });
            });

            const gHyO = marks.reduce((acc, m) => acc + m.hy_obtained, 0);
            const gAnO = marks.reduce((acc, m) => acc + m.an_obtained, 0);
            const gHyT = hyT * marks.length;
            const gAnT = anT * marks.length;
            const gTO = gHyO + gAnO, gTT = gHyT + gAnT;
            const gTP = gTT > 0 ? Math.round(gTO / gTT * 100) : 0;

            return { marks, gTO, gTT, gTP };
        }

        // ─── SAVE ───
        async function saveStudent() {
            const name = document.getElementById('s-name').value.trim();
            const cls = document.getElementById('s-class').value;
            if (!name || !cls) { showToast('Name aur Class required hai', 'error'); return; }
            const { marks, gTO, gTT, gTP } = collectMarks();
            const payload = {
                name: name.toUpperCase(),
                father_name: document.getElementById('s-father').value.trim().toUpperCase(),
                mother_name: document.getElementById('s-mother').value.trim().toUpperCase(),
                dob: document.getElementById('s-dob').value || null,
                pen_no: document.getElementById('s-aadhar').value.trim(),
                caste: document.getElementById('s-caste').value.trim().toUpperCase(),
                category: document.getElementById('s-category').value,
                address: document.getElementById('s-address').value.trim().toUpperCase(),
                class: cls, admission_no: document.getElementById('s-admission').value.trim(),
                roll_number: document.getElementById('s-roll').value.trim(),
                medium: document.getElementById('s-medium').value,
                marks, grand_total_obtained: gTO, grand_total_marks: gTT, percentage: gTP,
                grade: getGrade(gTP), session: '2025-26'
            };
            try {
                let res;
                if (editingId) {
                    res = await db.from('students').update(payload).eq('id', editingId);
                } else {
                    res = await db.from('students').insert([payload]);
                }
                const { error } = res;
                if (error) throw error;
                showToast(editingId ? '✅ Marksheet updated!' : '✅ Marksheet saved!');
                clearForm();
                showPage('dashboard');
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        }

        async function deleteFromForm() {
            if (!editingId) return;
            if (await deleteStudent(editingId)) {
                clearForm();
                showPage('dashboard');
            }
        }

        function clearForm() {
            ['s-name', 's-father', 's-mother', 's-aadhar', 's-caste', 's-address', 's-admission', 's-roll'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('s-dob').value = '';
            document.getElementById('s-class').value = '';
            document.getElementById('s-category').value = 'GENERAL';
            document.getElementById('s-medium').value = 'HINDI';
            document.getElementById('marks-card').style.display = 'none';
            document.getElementById('gt-box').style.display = 'none';
            document.getElementById('form-delete-btn').style.display = 'none';
            editingId = null;
            setEntryStep(1);
        }

        // ─── STUDENT CARD (mobile) ───
        function sCard(s) {
            return `<div class="student-card">
    <div class="sc-header"><div class="sc-name">${s.name}</div>${gBadge(s.grade)}</div>
    <div class="sc-meta">${s.class} | Roll: ${s.roll_number || '—'} | ${s.father_name || ''}</div>
    <div class="sc-stats">
      <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;color:var(--gold)">${s.percentage}%</span>
      <span style="font-size:12px;color:var(--muted);font-family:'DM Mono',monospace">${s.grand_total_obtained}/${s.grand_total_marks}</span>
    </div>
    <div class="sc-actions">
      <button class="btn btn-success btn-sm" onclick="downloadPDF('${s.id}')">⬇ PDF</button>
      <button class="btn btn-secondary btn-sm" onclick="editStudent('${s.id}')">✏ Edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑</button>
    </div>
  </div>`;
        }

        // ─── DASHBOARD ───
        async function loadDashboard() {
            try {
                const { data, error } = await db.from('students').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                document.getElementById('stat-total').textContent = data.length;
                document.getElementById('stat-classes').textContent = [...new Set(data.map(d => d.class))].length;
                document.getElementById('stat-aplus').textContent = data.filter(d => d.grade === 'A+').length;
                const avg = data.length ? Math.round(data.reduce((s, d) => s + (d.percentage || 0), 0) / data.length) : 0;
                document.getElementById('stat-avg').textContent = avg + '%';
                const recent = data.slice(0, 10);
                if (!recent.length) { document.getElementById('recent-list').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Koi student abhi tak add nahi hua</p></div>'; return; }
                document.getElementById('recent-list').innerHTML = `
      <div class="results-table-wrap">
        <div class="table-scroll">
          <table class="results-table" style="min-width:480px">
            <thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>%</th><th>Grade</th><th>Action</th></tr></thead>
            <tbody>${recent.map(s => `<tr>
              <td><strong>${s.name}</strong></td><td>${s.class}</td><td>${s.roll_number || '—'}</td>
              <td>${s.percentage}%</td><td>${gBadge(s.grade)}</td>
              <td><div class="action-btns">
                <button class="btn btn-success btn-sm" onclick="downloadPDF('${s.id}')">⬇ PDF</button>
                <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑</button>
              </div></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="student-cards">${recent.map(s => sCard(s)).join('')}</div>`;
            } catch (e) {
                document.getElementById('recent-list').innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error: ${e.message}</p><p style="margin-top:8px;font-size:12px;color:var(--muted)">Supabase mein "students" table banana padega. SQL tab mein schema run karo.</p></div>`;
            }
        }

        // ─── SEARCH ───
        async function searchStudents() {
            const name = document.getElementById('search-name').value.trim();
            const cls = document.getElementById('search-class').value;
            const roll = document.getElementById('search-roll').value.trim();
            let q = db.from('students').select('*').order('name');
            if (name) q = q.ilike('name', `%${name}%`);
            if (cls) q = q.eq('class', cls);
            if (roll) q = q.eq('roll_number', roll);
            try {
                const { data, error } = await q;
                if (error) throw error;
                if (!data.length) {
                    document.getElementById('search-results-table').innerHTML = '<div class="empty-state"><div class="icon">😕</div><p>Koi student nahi mila</p></div>';
                    document.getElementById('search-results-cards').innerHTML = ''; return;
                }
                document.getElementById('search-results-table').innerHTML = `
      <div class="info-row">📌 ${data.length} student(s) found</div>
      <div class="table-scroll">
        <table class="results-table" style="min-width:540px">
          <thead><tr><th>Name</th><th>Father</th><th>Class</th><th>Roll</th><th>%</th><th>Grade</th><th>Action</th></tr></thead>
          <tbody>${data.map(s => `<tr>
            <td><strong>${s.name}</strong></td><td>${s.father_name || '—'}</td>
            <td>${s.class}</td><td>${s.roll_number || '—'}</td>
            <td>${s.percentage}%</td><td>${gBadge(s.grade)}</td>
            <td><div class="action-btns">
              <button class="btn btn-success btn-sm" onclick="downloadPDF('${s.id}')">⬇ PDF</button>
              <button class="btn btn-secondary btn-sm" onclick="editStudent('${s.id}')">✏</button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑</button>
            </div></td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
                document.getElementById('search-results-cards').innerHTML =
                    `<div class="info-row">📌 ${data.length} found</div>` + data.map(s => sCard(s)).join('');
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        }

        // ─── CLASS-WISE ───
        let allStudents = [];
        function setEntryStep(step) {
            if (step > 1) {
                const name = document.getElementById('s-name').value.trim();
                const cls = document.getElementById('s-class').value;
                if (!name || !cls) {
                    showToast('⚠️ Student Name aur Class bharna zaroori hai!');
                    return;
                }
            }
            document.querySelectorAll('.entry-step').forEach(el => el.style.display = 'none');
            const target = document.getElementById(`step-${step}`);
            if (target) target.style.display = 'block';

            // Update Progress Indicator
            document.querySelectorAll('.step-dot').forEach(dot => {
                const dStep = parseInt(dot.dataset.step);
                dot.classList.remove('active', 'done');
                if (dStep === step) dot.classList.add('active');
                else if (dStep < step) dot.classList.add('done');
            });
            document.querySelectorAll('.step-line').forEach((line, i) => {
                line.classList.toggle('active', i < step - 1);
            });

            if (step >= 2) renderMarksSection();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function renderMarksSection() {
            const cls = document.getElementById('s-class').value;
            if (!cls) return;
            let autoTot = 100;
            const lowerClasses = ['Nursery', 'KG-I', 'KG-II', '1st', '2nd', '3rd', '4th', '5th'];
            if (lowerClasses.includes(cls)) autoTot = 50;
            document.getElementById('hy-total').value = autoTot;
            document.getElementById('an-total').value = autoTot;
            document.getElementById('hy-max-label').innerText = autoTot;
            document.getElementById('an-max-label').innerText = autoTot;
            const hyMax = parseInt(document.getElementById('hy-total').value) || 100;
            const anMax = parseInt(document.getElementById('an-total').value) || 100;
            const activeSubs = SUBJECTS[cls] || ['HINDI', 'ENGLISH', 'MATHEMATICS'];
            const hyTbody = document.getElementById('marks-tbody-hy');
            const anTbody = document.getElementById('marks-tbody-an');
            const sumTbody = document.getElementById('marks-tbody-summary');
            const marksObj = collectMarks();
            const oldMarks = marksObj.marks || [];
            hyTbody.innerHTML = '';
            anTbody.innerHTML = '';
            sumTbody.innerHTML = '';
            activeSubs.forEach(sub => {
                const prev = oldMarks.find(m => m.subject === sub) || { hy_obtained: 0, an_obtained: 0 };
                const hyRow = document.createElement('tr');
                hyRow.innerHTML = `
                    <td class="sub-name">${sub}</td>
                    <td><input type="number" class="m-hy" data-sub="${sub}" value="${prev.hy_obtained}" min="0" max="${hyMax}" oninput="computeRow(this)"></td>
                    <td class="m-hy-pct">—</td>
                    <td class="m-hy-grade">—</td>
                `;
                hyTbody.appendChild(hyRow);
                const anRow = document.createElement('tr');
                anRow.innerHTML = `
                    <td class="sub-name">${sub}</td>
                    <td><input type="number" class="m-an" data-sub="${sub}" value="${prev.an_obtained}" min="0" max="${anMax}" oninput="computeRow(this)"></td>
                    <td class="m-an-pct">—</td>
                    <td class="m-an-grade">—</td>
                `;
                anTbody.appendChild(anRow);
                const sumRow = document.createElement('tr');
                sumRow.id = `sum-row-${sub.replace(/\s+/g, '-')}`;
                sumRow.innerHTML = `
                    <td class="sub-name">${sub}</td>
                    <td class="sum-ob">0</td>
                    <td class="sum-max">${hyMax + anMax}</td>
                    <td class="sum-pct">—</td>
                    <td class="sum-grade">—</td>
                `;
                sumTbody.appendChild(sumRow);
            });
            document.querySelectorAll('.m-hy, .m-an').forEach(el => computeRow(el));
        }

        async function loadClasswise(cls) {
            if (!allStudents.length) {
                try {
                    const { data, error } = await db.from('students').select('*').order('class').order('name');
                    if (error) throw error;
                    allStudents = data;
                } catch (e) { document.getElementById('classwise-results').innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error: ${e.message}</p></div>`; return; }
            }
            renderClasswise(cls);
        }
        function filterClass(cls, el) {
            currentClassFilter = cls;
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); el.classList.add('active'); renderClasswise(cls);
        }
        function renderClasswise(cls) {
            const filtered = cls === 'all' ? allStudents : allStudents.filter(s => s.class === cls);
            if (!filtered.length) { document.getElementById('classwise-results').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Is class mein koi student nahi</p></div>'; return; }
            const grouped = {};
            filtered.forEach(s => { if (!grouped[s.class]) grouped[s.class] = []; grouped[s.class].push(s); });
            let html = '';
            Object.keys(grouped).forEach(c => {
                const students = grouped[c];
                const avg = Math.round(students.reduce((s, d) => s + (d.percentage || 0), 0) / students.length);
                html += `<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <div style="font-weight:700;font-size:15px">Class ${c}</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">${students.length} students • avg ${avg}%</div>
        <button class="btn btn-secondary btn-sm" onclick="downloadClassPDF('${c}')">⬇ All PDF</button>
      </div>
      <div class="table-scroll">
        <table class="results-table" style="min-width:460px">
          <thead><tr><th>#</th><th>Name</th><th>Roll</th><th>Obtained</th><th>%</th><th>Grade</th><th>Action</th></tr></thead>
          <tbody>${students.map((s, i) => `<tr>
            <td style="color:var(--muted);font-family:'DM Mono',monospace">${i + 1}</td>
            <td><strong>${s.name}</strong><br><small style="color:var(--muted)">${s.father_name || ''}</small></td>
            <td>${s.roll_number || '—'}</td><td>${s.grand_total_obtained}/${s.grand_total_marks}</td>
            <td><strong>${s.percentage}%</strong></td><td>${gBadge(s.grade)}</td>
            <td><div class="action-btns">
              <button class="btn btn-success btn-sm" onclick="downloadPDF('${s.id}')">⬇ PDF</button>
              <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑</button>
            </div></td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="student-cards" style="display:block;margin-top:10px">${students.map(s => sCard(s)).join('')}</div>
    </div>`;
            });
            document.getElementById('classwise-results').innerHTML = html;
        }

        // ─── DELETE ───
        async function deleteStudent(id) {
            console.log("Delete request for ID:", id);
            if (!id) { showToast('Error: No Student ID', 'error'); return false; }
            
            if (!confirm('Kya aap is student ki marksheet delete karna chahte hain?')) return false;
            
            try {
                showToast('⏳ Deleting from database...');
                const { error } = await db.from('students').delete().eq('id', id);
                if (error) throw error;
                
                showToast('🗑 Student deleted successfully');
                
                // Update local cache if available
                if (allStudents && allStudents.length) {
                    allStudents = allStudents.filter(s => s.id !== id);
                }
                
                // Refresh view based on current page
                try {
                    if (currentPage === 'dashboard') await loadDashboard();
                    else if (currentPage === 'search') await searchStudents();
                    else if (currentPage === 'classwise') await renderClasswise(currentClassFilter);
                    else location.reload(); // Fallback to full reload if on other pages
                } catch (refreshErr) {
                    console.error("Refresh failed:", refreshErr);
                    location.reload(); // Hard refresh if logic fails
                }
                
                return true;
            } catch (e) { 
                console.error("Delete failed:", e);
                showToast('Delete Failed: ' + e.message, 'error'); 
                return false; 
            }
        }

        async function editStudent(id) {
            try {
                const { data: s, error } = await db.from('students').select('*').eq('id', id).single();
                if (error) throw error;
                editingId = id;
                showPage('add');
                document.getElementById('form-delete-btn').style.display = 'inline-flex';
                setEntryStep(1);
                ['s-name', 's-father', 's-mother', 's-aadhar', 's-caste', 's-address', 's-admission', 's-roll'].forEach(f => {
                    const key = {
                        's-name': 'name', 's-father': 'father_name', 's-mother': 'mother_name',
                        's-aadhar': 'pen_no', 's-caste': 'caste', 's-address': 'address',
                        's-admission': 'admission_no', 's-roll': 'roll_number'
                    }[f];
                    document.getElementById(f).value = s[key] || '';
                });
                document.getElementById('s-dob').value = s.dob || '';
                document.getElementById('s-category').value = s.category || 'GENERAL';
                document.getElementById('s-class').value = s.class || '';
                document.getElementById('s-medium').value = s.medium || 'HINDI';
                renderMarksSection();
                setTimeout(() => {
                    const m = s.marks || [];
                    if (m[0]) {
                        document.getElementById('hy-total').value = m[0].hy_total;
                        document.getElementById('an-total').value = m[0].an_total;
                    }
                    m.forEach((mk) => {
                        const sub = mk.subject.toUpperCase(); // Ensure uppercase for matching
                        document.querySelectorAll(`.m-hy[data-sub="${sub}"]`).forEach(el => {
                            el.value = mk.hy_obtained;
                            computeRow(el);
                        });
                        document.querySelectorAll(`.m-an[data-sub="${sub}"]`).forEach(el => {
                            el.value = mk.an_obtained;
                            computeRow(el);
                        });
                    });
                }, 200);
                showToast('✏ Student data loaded');
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        }

        // ─── PDF ───
        async function downloadPDF(id) {
            try { const { data: s, error } = await db.from('students').select('*').eq('id', id).single(); if (error) throw error; genPDF(s); }
            catch (e) { showToast('Error: ' + e.message, 'error'); }
        }
        async function downloadClassPDF(cls) {
            try {
                const { data, error } = await db.from('students').select('*').eq('class', cls).order('roll_number');
                if (error) throw error;
                if (!data.length) { showToast('Koi student nahi mila', 'error'); return; }
                showToast(`⏳ ${data.length} PDFs generate ho rahe hain...`);
                for (let s of data) { await new Promise(r => setTimeout(r, 350)); genPDF(s); }
            } catch (e) { showToast('Error: ' + e.message, 'error'); }
        }

        function genPDF(s) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210, H = 297, mg = 12, cW = W - mg * 2;

            // Subtle Watermark
            doc.setFontSize(55); doc.setTextColor(235, 225, 210); doc.setGState(new doc.GState({ opacity: 0.15 }));
            doc.text('SHRI HANS', W / 2, H / 2 - 10, { align: 'center', angle: 35 });
            doc.text('VIDYA NIKETAN', W / 2, H / 2 + 18, { align: 'center', angle: 35 });
            doc.setGState(new doc.GState({ opacity: 1 }));

            // Borders
            doc.setDrawColor(0); doc.setLineWidth(1.2); doc.rect(8, 8, W - 16, H - 16);
            doc.setLineWidth(0.3); doc.rect(9.5, 9.5, W - 19, H - 19);

            // Header Section
            // Top Right Info
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
            doc.text('U.Dise Code - 22271702304', W - mg - 5, 14, { align: 'right' });

            // Logo Placeholder
            doc.setDrawColor(180); doc.setLineWidth(0.2);
            doc.rect(mg, 15, 25, 25);
            doc.setFontSize(6); doc.text('LOGO', mg + 12.5, 28, { align: 'center' });

            // School Name (Blue)
            doc.setFontSize(19); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 86, 179);
            doc.text('SHRI HANS VIDYA NIKETAN SCHOOL SONPUR', W / 2 + 10, 22, { align: 'center' });
            
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
            doc.text('Managed by Shri Hans Vidya Seva Kalyan Samiti', W / 2 + 10, 28, { align: 'center' });
            doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
            doc.text('(Sonpur, Pratappur, District - Surajpur(C.G.) Pine Code – 497223)', W / 2 + 10, 33, { align: 'center' });
            
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
            doc.text('अंक सूची', W / 2, 41, { align: 'center' });
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            doc.text(`Session – ${s.session || '2025-26'}`, W / 2, 47, { align: 'center' });

            // Top Box (Class, Admission, Medium, Roll) + Photo
            let y = 53;
            const bW = (cW - 35) / 4; // Width of each box
            doc.setDrawColor(0); doc.setLineWidth(0.4);
            doc.rect(mg, y, cW - 35, 14);
            [bW, bW * 2, bW * 3].forEach(x => doc.line(mg + x, y, mg + x, y + 14));
            doc.line(mg, y + 7, mg + cW - 35, y + 7);
            
            doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
            ['CLASS', 'ADMISSION NO.', 'MEDIUM', 'ROLL NUMBER'].forEach((h, i) => {
                doc.text(h, mg + (i * bW) + bW / 2, y + 5, { align: 'center' });
            });
            doc.setFontSize(11); doc.setFont('helvetica', 'bold');
            [s.class, s.admission_no || '—', s.medium || 'HINDI', s.roll_number || '—'].forEach((v, i) => {
                doc.text(String(v), mg + (i * bW) + bW / 2, y + 12, { align: 'center' });
            });

            // Photo Placeholder
            doc.rect(W - mg - 30, y - 5, 30, 35);
            doc.setFontSize(7); doc.text('STUDENT PHOTO', W - mg - 15, y + 13, { align: 'center' });

            // Student Info List
            y = 75;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            const info = [
                [`Student's Name :  ${s.name.toUpperCase()}`, ''],
                [`Father's Name :  ${(s.father_name || '').toUpperCase()}`, ''],
                [`Mother's Name :  ${(s.mother_name || '').toUpperCase()}`, ''],
            ];
            info.forEach(row => {
                doc.text(row[0], mg + 2, y); y += 6;
            });

            const dobStr = s.dob ? fmtDate(s.dob) : '—';
            const dobW = s.dob ? dateWords(s.dob) : '—';
            
            doc.text(`Caste : ${s.caste || '—'}`, mg + 2, y);
            doc.text(`Category : ${s.category || '—'}`, mg + 65, y); y += 6;
            
            doc.text(`Date of Birth : ${dobStr}`, mg + 2, y);
            doc.text(`(In words) : ${dobW}`, mg + 65, y); y += 6;
            
            doc.text(`PEN No. : ${s.pen_no || '—'}`, mg + 2, y);
            doc.text(`Address : ${s.address || '—'}`, mg + 65, y); y += 9;

            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            doc.text('SUBJECT WISE MARKS OBTAIND BY HIM/HER ARE AS UNDER :-', mg + 2, y); y += 4;

            // Marks Table
            const mk = s.marks || [];
            let gHyO = 0, gAnO = 0, gHyT = 0, gAnT = 0;
            mk.forEach(m => { gHyO += m.hy_obtained; gAnO += m.an_obtained; gHyT += m.hy_total; gAnT += m.an_total; });
            const gTO = gHyO + gAnO, gTT = gHyT + gAnT;
            const gHyP = Math.round(gHyO / gHyT * 100), gAnP = Math.round(gAnO / gAnT * 100), gTP = Math.round(gTO / gTT * 100);

            const tbody = mk.map(m => {
                const hP = Math.round(m.hy_obtained / m.hy_total * 100);
                const aP = Math.round(m.an_obtained / m.an_total * 100);
                const tO = m.hy_obtained + m.an_obtained, tT = m.hy_total + m.an_total, tP = Math.round(tO / tT * 100);
                return [m.subject, m.hy_total, m.hy_obtained, hP + '%', getGrade(hP), m.an_total, m.an_obtained, aP + '%', getGrade(aP), tT, tO, tP + '%', getGrade(tP)];
            });
            tbody.push([{content: 'GRAND TOTAL', styles: { fontStyle: 'bold' }}, gHyT, gHyO, gHyP + '%', getGrade(gHyP), gAnT, gAnO, gAnP + '%', getGrade(gAnP), gTT, gTO, gTP + '%', getGrade(gTP)]);

            doc.autoTable({
                startY: y,
                head: [
                    [
                        { content: 'SUBJECTS', rowSpan: 2, styles: { halign: 'left', valign: 'middle', fontStyle: 'bold' } },
                        { content: 'HALF YEARLY ASSESSMENT', colSpan: 4, styles: { halign: 'center' } },
                        { content: 'ANNUAL ASSESSMENT', colSpan: 4, styles: { halign: 'center' } },
                        { content: 'TOTAL', colSpan: 4, styles: { halign: 'center' } },
                    ],
                    ['TOTAL MARKS', 'MARKS OBTAIND', 'PERCENTAGE', 'GRADE', 'TOTAL MARKS', 'MARKS OBTAIND', 'PERCENTAGE', 'GRADE', 'TERM-1 + TERM-2', 'MARKS OBTAIND', 'PERCENTAGE', 'GRADE']
                ],
                body: tbody,
                margin: { left: mg, right: mg },
                theme: 'grid',
                styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', valign: 'middle', textColor: 0, lineColor: 0, lineWidth: 0.1 },
                headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', fontSize: 6.5 },
                columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 } },
                didDrawCell: d => {
                  if (d.section === 'body' && d.row.index === tbody.length - 1) {
                    doc.setLineWidth(0.3); doc.line(d.cell.x, d.cell.y, d.cell.x + d.cell.width, d.cell.y);
                  }
                }
            });

            y = doc.lastAutoTable.finalY + 6;
            const cH = 40, cW2 = cW * 0.65;
            doc.setDrawColor(0); doc.setLineWidth(0.3);
            doc.rect(mg, y, cW2, cH);
            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            doc.text('CERTIFIED THAT', mg + cW2 / 2, y + 6, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
            doc.text(`CLASS : ${s.class}   ACADEMIC SESSION ${s.session || '2025-26'}`, mg + 3, y + 13);
            doc.text(`IN THE HALF-YEARLY ASSESSMENT : ${getGrade(gHyP)} GRADE ( ${gHyP}% )`, mg + 3, y + 19);
            doc.text(`IN THE ANNUAL ASSESSMENT : ${getGrade(gAnP)} GRADE ( ${gAnP}% )`, mg + 3, y + 25);
            doc.setFont('helvetica', 'bold'); doc.text("Student's Special Achievements:", mg + 3, y + 31);
            doc.setLineWidth(0.2); doc.line(mg + 5, y + 36, mg + cW2 - 5, y + 36);

            // Grade Reference Table
            const rmX = mg + cW2 + 5, rmW = cW - cW2 - 5;
            doc.rect(rmX, y, rmW, cH);
            doc.setFontSize(8); doc.text('Remarks', rmX + rmW / 2, y + 5, { align: 'center' });
            const rates = [['91% and above', 'A+'], ['81% to 90%', 'A'], ['71% to 80%', 'B+'], ['61% to 70%', 'B'],
                           ['51% to 60%', 'C+'], ['41% to 50%', 'C'], ['33% to 40%', 'D'], ['Below 33%', 'E']];
            rates.forEach(([r, g], i) => {
                doc.setFont('helvetica', 'normal'); doc.text(r, rmX + 2, y + 10 + i * 3.8);
                doc.setFont('helvetica', 'bold'); doc.text(g, rmX + rmW - 6, y + 10 + i * 3.8);
            });

            // Footer
            y += cH + 8;
            // QR Placeholder
            doc.rect(mg, y, 18, 18);
            doc.setFontSize(5); doc.text('QR CODE', mg + 9, y + 10, { align: 'center' });

            doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            [[mg + 35, 'Signature of\nAsst. Teacher'], [W / 2 + 10, 'Signature of\nClass Teacher'], [W - mg - 25, 'Seal & Signature of\nPrincipal']].forEach(([x, lbl]) => {
                lbl.split('\n').forEach((ln, li) => doc.text(ln, x, y + 10 + li * 5, { align: 'center' }));
            });

            doc.save(`Marksheet_${s.name.replace(/\s+/g, '_')}_${s.class}.pdf`);
            showToast('📄 PDF download ho rahi hai!');
        }

        // ─── HELPERS ───
        function fmtDate(d) { if (!d) return '—'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`; }
        function dateWords(d) {
            if (!d) return '—'; const dt = new Date(d);
            const D = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty First', 'Twenty Second', 'Twenty Third', 'Twenty Fourth', 'Twenty Fifth', 'Twenty Sixth', 'Twenty Seventh', 'Twenty Eighth', 'Twenty Ninth', 'Thirtieth', 'Thirty First'];
            const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const Y = { 2005: 'Two Thousand Five', 2006: 'Two Thousand Six', 2007: 'Two Thousand Seven', 2008: 'Two Thousand Eight', 2009: 'Two Thousand Nine', 2010: 'Two Thousand Ten', 2011: 'Two Thousand Eleven', 2012: 'Two Thousand Twelve', 2013: 'Two Thousand Thirteen', 2014: 'Two Thousand Fourteen', 2015: 'Two Thousand Fifteen', 2016: 'Two Thousand Sixteen', 2017: 'Two Thousand Seventeen', 2018: 'Two Thousand Eighteen', 2019: 'Two Thousand Nineteen', 2020: 'Two Thousand Twenty', 2021: 'Two Thousand Twenty One', 2022: 'Two Thousand Twenty Two', 2023: 'Two Thousand Twenty Three', 2024: 'Two Thousand Twenty Four', 2025: 'Two Thousand Twenty Five' };
            return `${D[dt.getDate()]} ${M[dt.getMonth()]} ${Y[dt.getFullYear()] || dt.getFullYear()}`;
        }
        function showToast(msg, type = 'success') {
            const t = document.getElementById('toast'); t.textContent = msg;
            t.className = 'toast show' + (type === 'error' ? ' error' : '');
            clearTimeout(t._t); t._t = setTimeout(() => t.className = 'toast', 3200);
        }

        // INIT
        loadDashboard();
    
