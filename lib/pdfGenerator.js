import { getGrade, fmtDate, dateWords } from './marksUtils';

// Helper to load libraries dynamically in the browser only
async function loadLibraries() {
    if (typeof window === 'undefined') {
        throw new Error('PDF generation can only run in the browser.');
    }
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const QRCode = await import('qrcode');
    return { jsPDF, QRCode };
}

export async function genPDF(s) {
    try {
        const { jsPDF, QRCode } = await loadLibraries();
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await drawMarksheet(doc, s, QRCode);
        doc.save(`Marksheet_${s.name.replace(/\s+/g, '_')}_${s.class}.pdf`);
    } catch (e) {
        console.error('Error generating single PDF:', e);
        throw e;
    }
}

export async function downloadClassPDF(cls, data, showToast) {
    try {
        if (!data || data.length === 0) {
            showToast('Is class mein koi students nahi mile!', 'error');
            return;
        }

        showToast(`⏳ ${data.length} students ki combined PDF generate ho rahi hai...`);
        
        const { jsPDF, QRCode } = await loadLibraries();
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        for (let i = 0; i < data.length; i++) {
            if (i > 0) doc.addPage();
            await drawMarksheet(doc, data[i], QRCode);
            // Yield control to UI to prevent browser freezing
            if (i % 5 === 0) {
                await new Promise(r => setTimeout(r, 100));
            }
        }

        doc.save(`Class_${cls}_All_Marksheets.pdf`);
        showToast(`✅ ${data.length} marksheets combined PDF mein download ho gayi!`, 'success');
    } catch (e) {
        console.error('Error generating batch PDF:', e);
        showToast('Batch PDF generation failed: ' + e.message, 'error');
    }
}

export async function drawMarksheet(doc, s, QRCode) {
    const W = 210, H = 297, mg = 12, cW = W - mg * 2;

    // 1. Gradient Background Inside Border
    const canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 10;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 500, 0);
    grad.addColorStop(0, '#E1E1E6');
    grad.addColorStop(0.5, '#FFFFFF');
    grad.addColorStop(1, '#E1E1E6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 500, 10);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 8, W - 16, H - 16);

    // 2. Repeating Background Text Watermark (Roll No to Bottom - Straight Red)
    doc.setFontSize(6.5);
    doc.setTextColor(255, 0, 0);
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    const singleWM = "SHRI HANS VIDYA NIKETAN SCHOOL ";
    const fullLine = singleWM.repeat(10);
    for (let yPos = 70; yPos < 290; yPos += 4) {
        doc.text(fullLine, 0, yPos, { angle: 0 });
    }

    // Mask margins to white
    doc.setGState(new doc.GState({ opacity: 1 }));
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 8, H, 'F'); // Left Mask
    doc.rect(W - 8, 0, 8, H, 'F'); // Right Mask
    doc.rect(0, 0, W, 8, 'F'); // Top Mask
    doc.rect(0, H - 8, W, 8, 'F'); // Bottom Mask

    // 3. Subtle Watermark (Center Logo)
    const logoImg = document.getElementById('school-logo');
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.addImage(logoImg, 'PNG', W / 2 - 55, H / 2 - 55, 110, 110);
        doc.setGState(new doc.GState({ opacity: 1 }));
    }

    // Borders
    doc.setDrawColor(0); doc.setLineWidth(1.2); doc.rect(8, 8, W - 16, H - 16);
    doc.setLineWidth(0.3); doc.rect(9.5, 9.5, W - 19, H - 19);

    // Background vertical lines in header
    doc.setDrawColor(242); doc.setLineWidth(0.05);
    for (let lx = mg; lx <= W - mg; lx += 0.8) {
        doc.line(lx, 10.5, lx, 53);
    }

    // Header Section
    // Top Right Info
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('U.Dise Code - 22271702304', W - mg - 5, 14, { align: 'right' });

    // Logo Section
    if (logoImg && logoImg.complete && logoImg.naturalWidth !== 0) {
        doc.addImage(logoImg, 'PNG', mg, 11, 25, 25);
    } else {
        doc.setDrawColor(180); doc.setLineWidth(0.2);
        doc.rect(mg, 11, 25, 25);
        doc.setFontSize(6); doc.text('LOGO', mg + 12.5, 24, { align: 'center' });
    }

    // School Name (Blue)
    doc.setFontSize(19); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 86, 179);
    doc.text('SHRI HANS VIDYA NIKETAN SCHOOL SONPUR', W / 2 + 10, 22, { align: 'center' });

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('Managed by Shri Hans Vidya Seva Kalyan Samiti', W / 2, 28, { align: 'center' });
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
    doc.text('(Sonpur, Post - Masga, Block - Pratappur (C.G.) - 497223)', W / 2, 33, { align: 'center' });

    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('MARKSHEET', W / 2, 41, { align: 'center' });
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text(`Session – ${s.session || '2026-27'}`, W / 2, 47, { align: 'center' });

    // Separator line below Session
    const boxPadding = 18; // approx 70px (30px + 40px)
    const bX = mg + boxPadding;
    const bW_box = (cW - boxPadding * 2) / 4;

    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.line(bX, 50, W - bX, 50);

    // Top Box (Class, Admission, Medium, Roll)
    let y = 53;

    doc.setDrawColor(0); doc.setLineWidth(0.4);
    doc.rect(bX, y, cW - boxPadding * 2, 14);
    [bW_box, bW_box * 2, bW_box * 3].forEach(x => doc.line(bX + x, y, bX + x, y + 14));
    doc.line(bX, y + 7, bX + (cW - boxPadding * 2), y + 7);

    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
    ['CLASS', 'ADMISSION NO.', 'MEDIUM', 'ROLL NUMBER'].forEach((h, i) => {
        doc.text(h, bX + (i * bW_box) + bW_box / 2, y + 5, { align: 'center' });
    });
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    [s.class, s.admission_no || '—', s.medium || 'HINDI', s.roll_number || '—'].forEach((v, i) => {
        doc.text(String(v), bX + (i * bW_box) + bW_box / 2, y + 12, { align: 'center' });
    });

    // Student Info List
    y = 75;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const info = [
        [`Student's Name :  ${(s.name || '').toUpperCase()}`, ''],
        [`Father's Name :  Mr. ${(s.father_name || '').toUpperCase()}`, ''],
        [`Mother's Name :  Mrs. ${(s.mother_name || '').toUpperCase()}`, ''],
    ];
    info.forEach(row => {
        doc.text(row[0], mg + 2, y); y += 9;
    });

    const dobStr = s.dob ? fmtDate(s.dob) : '—';
    const dobW = s.dob ? dateWords(s.dob) : '—';

    doc.text(`Caste : ${s.caste || '—'}`, mg + 2, y);
    doc.text(`Category : ${s.category || '—'}`, mg + 65, y); y += 9;

    doc.text(`Date of Birth : ${dobStr}`, mg + 2, y);
    doc.text(`(In words) : ${dobW}`, mg + 65, y); y += 9;

    doc.text(`PEN No. : ${s.pen_no || '—'}`, mg + 2, y);
    doc.text(`Address : ${s.address || '—'}`, mg + 65, y); y += 9;

    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT WISE MARKS OBTAINED BY HIM/HER ARE AS UNDER :-', mg + 2, y); y += 4;

    // Marks Table
    const mk = s.marks || [];
    let gHyO = 0, gAnO = 0, gHyT = 0, gAnT = 0;
    mk.forEach(m => {
        gHyO += Number(m.hy_obtained || 0);
        gAnO += Number(m.an_obtained || 0);
        gHyT += Number(m.hy_total || 100);
        gAnT += Number(m.an_total || 100);
    });
    const gTO = gHyO + gAnO, gTT = gHyT + gAnT;
    const gHyP = gHyT > 0 ? Math.round(gHyO / gHyT * 100) : 0;
    const gAnP = gAnT > 0 ? Math.round(gAnO / gAnT * 100) : 0;
    const gTP = gTT > 0 ? Math.round(gTO / gTT * 100) : 0;

    const tbody = mk.map(m => {
        const hP = m.hy_total > 0 ? Math.round(m.hy_obtained / m.hy_total * 100) : 0;
        const aP = m.an_total > 0 ? Math.round(m.an_obtained / m.an_total * 100) : 0;
        const tO = m.hy_obtained + m.an_obtained;
        const tT = m.hy_total + m.an_total;
        const tP = tT > 0 ? Math.round(tO / tT * 100) : 0;
        return [m.subject, m.hy_total, m.hy_obtained, hP + '%', getGrade(hP), m.an_total, m.an_obtained, aP + '%', getGrade(aP), tT, tO, tP + '%', getGrade(tP)];
    });
    tbody.push([{ content: 'GRAND TOTAL', styles: { fontStyle: 'bold' } }, gHyT, gHyO, gHyP + '%', getGrade(gHyP), gAnT, gAnO, gAnP + '%', getGrade(gAnP), gTT, gTO, gTP + '%', getGrade(gTP)]);

    doc.autoTable({
        startY: y,
        head: [
            [
                { content: 'SUBJECTS', rowSpan: 2, styles: { halign: 'left', valign: 'middle', fontStyle: 'bold' } },
                { content: 'HALF YEARLY ASSESSMENT', colSpan: 4, styles: { halign: 'center' } },
                { content: 'ANNUAL ASSESSMENT', colSpan: 4, styles: { halign: 'center' } },
                { content: 'TOTAL', colSpan: 4, styles: { halign: 'center' } },
            ],
            ['TOTAL\nMARKS', 'MARKS\nOBTAINED', 'PERCENTAGE', 'GRADE', 'TOTAL\nMARKS', 'MARKS\nOBTAINED', 'PERCENTAGE', 'GRADE', 'TERM-1 +\nTERM-2', 'MARKS\nOBTAINED', 'PERCENTAGE', 'GRADE']
        ],
        body: tbody,
        margin: { left: mg, right: mg },
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.2, halign: 'center', valign: 'middle', textColor: 0, lineColor: 0, lineWidth: 0.1 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', fontSize: 6.2, cellPadding: 1.0 },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 } },
        didDrawCell: d => {
            if (d.section === 'body' && d.row.index === tbody.length - 1) {
                doc.setLineWidth(0.3); doc.line(d.cell.x, d.cell.y, d.cell.x + d.cell.width, d.cell.y);
            }
        }
    });

    y = doc.lastAutoTable.finalY + 6;
    const cH = 46, cW2 = cW * 0.65;
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.rect(mg, y, cW2, cH);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIED THAT', mg + cW2 / 2, y + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text(`CLASS : ${s.class}   ACADEMIC SESSION ${s.session || '2026-27'}`, mg + 3, y + 13);
    doc.text(`IN THE HALF-YEARLY ASSESSMENT : ${getGrade(gHyP)} GRADE ( ${gHyP}% )`, mg + 3, y + 19);
    doc.text(`IN THE ANNUAL ASSESSMENT : ${getGrade(gAnP)} GRADE ( ${gAnP}% )`, mg + 3, y + 25);
    doc.setFont('helvetica', 'bold');
    doc.text(`IN THE FINAL RESULT / TOTAL : ${getGrade(gTP)} GRADE ( ${gTP}% )`, mg + 3, y + 31);
    doc.setFont('helvetica', 'bold'); doc.text("Student's Special Achievements:", mg + 3, y + 38);
    doc.setLineWidth(0.2); doc.line(mg + 5, y + 43, mg + cW2 - 5, y + 43);

    // Grade Reference Table (Remarks)
    const rmX = mg + cW2 + 5, rmW = cW - cW2 - 5;
    doc.autoTable({
        startY: y,
        head: [[{ content: 'Remarks / Grade', colSpan: 2, styles: { halign: 'center', fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' } }]],
        body: [
            ['91% and above', 'A+'], ['81% to 90%', 'A'], ['71% to 80%', 'B+'], ['61% to 70%', 'B'],
            ['51% to 60%', 'C+'], ['41% to 50%', 'C'], ['33% to 40%', 'D'], ['Below 33%', 'E']
        ],
        margin: { left: rmX },
        tableWidth: rmW,
        theme: 'grid',
        styles: { fontSize: 6.5, cellPadding: 1.2, halign: 'left', textColor: 0, lineColor: 0, lineWidth: 0.1 },
        columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } }
    });

    // Footer - Fixed Position at bottom
    const footY = H - 32;
    // QR Code
    const qrText = `School: Shri Hans Vidya Niketan School Sonpur\nStudent: ${s.name}\nFather: ${s.father_name || '—'}\nClass: ${s.class}\nRoll: ${s.roll_number || '—'}\nPercent: ${s.percentage}%`;
    try {
        const qrUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 100 });
        doc.addImage(qrUrl, 'PNG', mg, footY, 18, 18);
    } catch (e) {
        doc.rect(mg, footY, 18, 18);
        doc.setFontSize(5); doc.text('QR ERROR', mg + 9, footY + 10, { align: 'center' });
    }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    const sigs = [
        [W / 2, 'Signature of\nClass Teacher'],
        [W - mg - 25, 'Seal & Signature of\nPrincipal']
    ];
    sigs.forEach(([x, lbl]) => {
        lbl.split('\n').forEach((ln, li) => doc.text(ln, x, footY + 10 + li * 5, { align: 'center' }));
    });
}
