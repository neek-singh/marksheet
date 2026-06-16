export const SUBJECTS = {
    'Nursery': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'],
    'KG-I': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'],
    'KG-II': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'],
    '1st': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
    '2nd': ['HINDI', 'ENGLISH', 'MATHEMATICS'],
    '3rd': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'],
    '4th': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'],
    '5th': ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'],
    '6th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'],
    '7th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'],
    '8th': ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE']
};

export const PAGE_TITLES = {
    dashboard: 'Dashboard',
    'add-student': 'Student Admission',
    'add-marks': 'Academic Records (Marks)',
    search: 'Search & Preview',
    classwise: 'Class-wise Students',
    preview: 'Student Data Preview'
};

export function getGrade(p) {
    p = Number(p);
    if (p >= 91) return 'A+';
    if (p >= 81) return 'A';
    if (p >= 71) return 'B+';
    if (p >= 61) return 'B';
    if (p >= 51) return 'C+';
    if (p >= 41) return 'C';
    if (p >= 33) return 'D';
    return 'E';
}

export function getGradeBadge(grade) {
    if (!grade) return '';
    const gradeClass = 'grade-' + (grade === 'A+' ? 'Ap' : grade === 'B+' ? 'Bp' : grade === 'C+' ? 'Cp' : grade);
    return <span className={`grade-badge ${gradeClass}`}>{grade}</span>;
}

export function gClass(g) {
    return 'grade-' + (g === 'A+' ? 'Ap' : g === 'B+' ? 'Bp' : g === 'C+' ? 'Cp' : g);
}

const getExpectedSubs = (className) => {
    switch(className) {
        case 'Nursery': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'];
        case 'KG-I': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'];
        case 'KG-II': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'MORAL', 'DRAWING'];
        case '1st': return ['HINDI', 'ENGLISH', 'MATHEMATICS'];
        case '2nd': return ['HINDI', 'ENGLISH', 'MATHEMATICS'];
        case '3rd': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'];
        case '4th': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'];
        case '5th': return ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL'];
        case '6th': return ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'];
        case '7th': return ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'];
        case '8th': return ['HINDI', 'ENGLISH', 'SANSKRIT', 'MATHEMATICS', 'SCIENCE', 'SOCIAL SCIENCE'];
        default: return [];
    }
};

export function getStudentStatus(s) {
    const requiredInfo = ['name', 'father_name', 'mother_name', 'dob', 'class', 'admission_no', 'roll_number', 'medium', 'address', 'caste'];
    
    const getSafeProp = (obj, prop) => {
        switch(prop) {
            case 'name': return obj?.name;
            case 'father_name': return obj?.father_name;
            case 'mother_name': return obj?.mother_name;
            case 'dob': return obj?.dob;
            case 'class': return obj?.class;
            case 'admission_no': return obj?.admission_no;
            case 'roll_number': return obj?.roll_number;
            case 'medium': return obj?.medium;
            case 'address': return obj?.address;
            case 'caste': return obj?.caste;
            default: return undefined;
        }
    };

    const hasFullInfo = requiredInfo.every(field => {
        const val = getSafeProp(s, field);
        return val && String(val).trim() !== '';
    });

    const expectedSubs = getExpectedSubs(s.class);
    const hasAllMarks = s.marks && Array.isArray(s.marks) && s.marks.length >= expectedSubs.length && expectedSubs.length > 0;

    if (hasFullInfo && hasAllMarks) return { icon: '✅', color: 'var(--green)', label: 'Complete' };
    if (hasFullInfo) return { icon: '⏳', color: '#ffa000', label: 'Marks Pending' };
    return { icon: '⚠️', color: 'var(--red)', label: 'Info Missing' };
}

export function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
}

export function dateWords(d) {
    if (!d) return '—';
    const dt = new Date(d);
    const D = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty First', 'Twenty Second', 'Twenty Third', 'Twenty Fourth', 'Twenty Fifth', 'Twenty Sixth', 'Twenty Seventh', 'Twenty Eighth', 'Twenty Ninth', 'Thirtieth', 'Thirty First'];
    const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n2w = n => (n < 20 ? ones.at(n) : tens.at(Math.floor(n / 10)) + (n % 10 ? ' ' + ones.at(n % 10) : ''));
    const y = dt.getFullYear();
    let yW = (y >= 2000 && y < 2100) ? 'Two Thousand' + (y === 2000 ? '' : ' ' + n2w(y % 100)) :
        (y >= 1900 && y < 2000) ? 'Nineteen ' + n2w(y % 100) : y.toString();
    return `${D.at(dt.getDate())} ${M.at(dt.getMonth())} ${yW}`;
}
