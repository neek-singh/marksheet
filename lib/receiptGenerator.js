import { jsPDF } from 'jspdf';
import { fmtDate } from './marksUtils';

export async function genFeeReceipt(s, paymentObj, totalPaid, totalDues) {
    if (typeof window === 'undefined') return;

    // Lazy load standard jsPDF client
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' }); // A5 is perfect for receipts
    const W = 148, H = 210, mg = 10, cW = W - mg * 2;

    // Border
    doc.setDrawColor(184, 134, 11); // Gold Border
    doc.setLineWidth(0.8);
    doc.rect(5, 5, W - 10, H - 10);
    doc.setLineWidth(0.2);
    doc.rect(6.2, 6.2, W - 12.4, H - 12.4);

    // School Header
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 86, 179);
    doc.text('SHRI HANS VIDYA NIKETAN SCHOOL', W / 2, 14, { align: 'center' });
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text('Sonpur, Post - Masga, Block - Pratappur (C.G.) - 497223', W / 2, 19, { align: 'center' });
    
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('FEES PAYMENT RECEIPT', W / 2, 25, { align: 'center' });

    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(mg, 28, W - mg, 28);

    // Receipt details
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: HN-F-${paymentObj.receipt_no || '1001'}`, mg + 2, 34);
    doc.text(`Date: ${fmtDate(paymentObj.payment_date || new Date())}`, W - mg - 45, 34);

    // Student Box Info
    let y = 39;
    doc.setFillColor(245, 237, 216); // light cream box background
    doc.rect(mg, y, cW, 24, 'F');
    doc.rect(mg, y, cW, 24, 'D');

    doc.setFont('helvetica', 'bold');
    doc.text(`Student Name: ${(s.name || '').toUpperCase()}`, mg + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Father's Name: Mr. ${(s.father_name || '').toUpperCase()}`, mg + 4, y + 12);
    doc.text(`Class: ${s.class}`, mg + 4, y + 18);
    doc.text(`Roll Number: ${s.roll_number || '—'}`, W - mg - 45, y + 18);

    // Receipt particulars
    y = 70;
    doc.setFont('helvetica', 'bold');
    doc.text('Particulars', mg + 2, y);
    doc.text('Amount (INR)', W - mg - 30, y);
    doc.line(mg, y + 3, W - mg, y + 3);

    y = 79;
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Tuition & School Charges Dues', mg + 2, y);
    doc.text(`₹ ${totalDues}`, W - mg - 25, y);
    doc.line(mg, y + 3, W - mg, y + 3);

    y = 88;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Fees Due', mg + 2, y);
    doc.text(`₹ ${totalDues}`, W - mg - 25, y);
    doc.line(mg, y + 3, W - mg, y + 3);

    y = 97;
    doc.setTextColor(26, 92, 42); // Green for amount paid
    doc.text('Amount Received now', mg + 2, y);
    doc.text(`₹ ${paymentObj.amount_paid}`, W - mg - 25, y);
    doc.setTextColor(0);
    doc.line(mg, y + 3, W - mg, y + 3);

    y = 106;
    doc.text('Total Fees Paid to date', mg + 2, y);
    doc.text(`₹ ${totalPaid}`, W - mg - 25, y);
    doc.line(mg, y + 3, W - mg, y + 3);

    const balance = totalDues - totalPaid;
    y = 115;
    doc.setTextColor(139, 26, 26); // Red for balance dues
    doc.text('Remaining Balance Dues', mg + 2, y);
    doc.text(`₹ ${balance}`, W - mg - 25, y);
    doc.setTextColor(0);
    doc.line(mg, y + 3, W - mg, y + 3);

    // Payment Meta info
    y = 126;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Payment Mode: ${paymentObj.payment_mode || 'CASH'}`, mg + 2, y);
    if (paymentObj.remarks) {
        doc.text(`Remarks: ${paymentObj.remarks}`, mg + 2, y + 5);
    }

    // Signature boxes
    y = 158;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Signature of Cashier', mg + 10, y, { align: 'center' });
    doc.text('Seal & Signature of Principal', W - mg - 20, y, { align: 'center' });

    // Save PDF
    doc.save(`Receipt_${s.name.replace(/\s+/g, '_')}_HN.pdf`);
}
