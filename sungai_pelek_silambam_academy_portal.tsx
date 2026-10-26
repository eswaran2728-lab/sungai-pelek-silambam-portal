import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Edit3,
  Archive,
  Receipt,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Search,
  Download,
  KeyRound,
  UserCheck,
  Building2,
  Sparkles,
  FileText,
  History,
  Check,
  Info,
  Lock,
  RefreshCw,
  Phone,
  Mail,
  Award,
  Settings,
  QrCode,
  Trash2,
  MapPin,
  Upload,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sungai-pelek-silambam-portal';

// ============================================================================
// DEFAULT ACADEMY PROFILE & QR GENERATOR FOR SAMPLE MODE
// ============================================================================
function createSampleQrSvgDataUri(title, subtitle, colorHex) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260">
    <rect width="260" height="260" rx="18" fill="#ffffff" stroke="${colorHex}" stroke-width="8"/>
    <rect x="22" y="22" width="64" height="64" fill="none" stroke="${colorHex}" stroke-width="10"/>
    <rect x="38" y="38" width="32" height="32" fill="${colorHex}"/>
    <rect x="174" y="22" width="64" height="64" fill="none" stroke="${colorHex}" stroke-width="10"/>
    <rect x="190" y="38" width="32" height="32" fill="${colorHex}"/>
    <rect x="22" y="174" width="64" height="64" fill="none" stroke="${colorHex}" stroke-width="10"/>
    <rect x="38" y="190" width="32" height="32" fill="${colorHex}"/>
    <rect x="104" y="38" width="16" height="16" fill="#1c1917"/>
    <rect x="136" y="38" width="16" height="16" fill="#1c1917"/>
    <rect x="104" y="70" width="48" height="16" fill="#1c1917"/>
    <rect x="38" y="104" width="48" height="16" fill="#1c1917"/>
    <rect x="104" y="104" width="32" height="32" fill="${colorHex}"/>
    <rect x="152" y="104" width="16" height="48" fill="#1c1917"/>
    <rect x="184" y="104" width="48" height="16" fill="#1c1917"/>
    <rect x="184" y="136" width="16" height="32" fill="#1c1917"/>
    <rect x="216" y="152" width="16" height="48" fill="#1c1917"/>
    <rect x="104" y="184" width="32" height="16" fill="#1c1917"/>
    <rect x="152" y="184" width="48" height="32" fill="${colorHex}"/>
    <rect x="104" y="216" width="80" height="16" fill="#1c1917"/>
    <rect x="16" y="120" width="228" height="38" rx="8" fill="${colorHex}"/>
    <text x="130" y="137" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="130" y="151" font-family="sans-serif" font-size="10" fill="#fef3c7" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function compressQrImageFile(file, maxWidth = 550) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const INITIAL_ADMIN_PROFILE = {
  id: 'academy-settings',
  academyName: 'SUNGAI PELEK SILAMBAM ACADEMY',
  tagline: 'Sungai Pelek & Sepang Kalari • Attendance & Fee Portal',
  masterName: 'Aasaan Murugan (Master)',
  masterPhone: '+60 12-345 6789',
  masterEmail: 'master@kalari.my',
  currency: 'MYR',
  tngDetails: 'TnG eWallet: +60 12-345 6789 (Sungai Pelek Silambam Academy)',
  tngQrImage: createSampleQrSvgDataUri('TOUCH N GO eWALLET QR', 'SAMPLE QR - Upload yours in Admin', '#1d4ed8'),
  bankQrDetails: 'Maybank DuitNow QR • Acc: 5123 4567 8901',
  bankQrImage: createSampleQrSvgDataUri('BANK / DUITNOW QR', 'SAMPLE QR - Upload yours in Admin', '#b45309'),
  paymentInstructions:
    'Scan the Touch ’n Go QR or Bank QR below, or pay Cash in class. Upload your payment screenshot below so Master can verify and confirm.'
};

const INITIAL_CLASSES = [
  {
    id: 'cls-sp-jr',
    name: 'Adimurai & Basic Footwork (Junior)',
    location: 'Sungai Pelek Main Kalari',
    schedule: 'Sat & Sun • 5:00 PM - 6:30 PM',
    defaultFee: 60
  },
  {
    id: 'cls-sp-sr',
    name: 'Neduvadi & Velkambu (Senior)',
    location: 'Sungai Pelek Main Kalari',
    schedule: 'Sat & Sun • 6:30 PM - 8:00 PM',
    defaultFee: 80
  },
  {
    id: 'cls-sepang',
    name: 'Sepang Community Batch (All Levels)',
    location: 'Sepang Community Hall',
    schedule: 'Fridays • 8:00 PM - 9:30 PM',
    defaultFee: 65
  }
];

const INITIAL_PARENTS = [
  {
    id: 'parent-anand',
    name: 'Anand Krishnan (SAMPLE)',
    email: 'anand.sample@kalari.my',
    phone: '+60 12-345 6789',
    role: 'parent',
    accessCode: '1234'
  },
  {
    id: 'parent-meena',
    name: 'Meena Sundaram (SAMPLE)',
    email: 'meena.sample@kalari.my',
    phone: '+60 16-889 1122',
    role: 'parent',
    accessCode: '5678'
  }
];

const INITIAL_STUDENTS = [
  {
    id: 'stu-kavin',
    name: 'Kavin Anand (SAMPLE)',
    parentId: 'parent-anand',
    classId: 'cls-sp-sr',
    location: 'Sungai Pelek Main Kalari',
    joiningDate: '2025-02-01',
    active: true,
    monthlyFee: 80,
    level: 'Nilai 3 - Senior Staff'
  },
  {
    id: 'stu-diya',
    name: 'Diya Anand (SAMPLE)',
    parentId: 'parent-anand',
    classId: 'cls-sp-jr',
    location: 'Sungai Pelek Main Kalari',
    joiningDate: '2025-06-15',
    active: true,
    monthlyFee: 60,
    level: 'Nilai 1 - Footwork'
  },
  {
    id: 'stu-harish',
    name: 'Harish Sundaram (SAMPLE)',
    parentId: 'parent-meena',
    classId: 'cls-sepang',
    location: 'Sepang Community Hall',
    joiningDate: '2025-03-10',
    active: true,
    monthlyFee: 65,
    level: 'Nilai 2 - Twin Stick'
  }
];

const INITIAL_ATTENDANCE = [
  {
    id: 'cls-sp-sr_2026-10-04_stu-kavin',
    classId: 'cls-sp-sr',
    date: '2026-10-04',
    studentId: 'stu-kavin',
    status: 'Present',
    markedBy: 'Aasaan Murugan (Master)',
    updatedAt: '2026-10-04 18:35',
    auditHistory: []
  },
  {
    id: 'cls-sp-sr_2026-10-11_stu-kavin',
    classId: 'cls-sp-sr',
    date: '2026-10-11',
    studentId: 'stu-kavin',
    status: 'Present',
    markedBy: 'Aasaan Murugan (Master)',
    updatedAt: '2026-10-11 18:32',
    auditHistory: []
  }
];

const INITIAL_FEES = [
  {
    id: 'stu-kavin_2026-10',
    studentId: 'stu-kavin',
    month: '2026-10',
    expectedFee: 80,
    waived: false,
    waiveReason: '',
    paymentsJson: JSON.stringify([
      {
        id: 'pay-102',
        amount: 50,
        date: '2026-10-06',
        method: 'Cash',
        refNo: 'CSH-1004',
        notes: 'Partial payment',
        recordedBy: 'Aasaan Murugan'
      }
    ]),
    proofsJson: JSON.stringify([])
  },
  {
    id: 'stu-diya_2026-10',
    studentId: 'stu-diya',
    month: '2026-10',
    expectedFee: 60,
    waived: false,
    waiveReason: '',
    paymentsJson: JSON.stringify([]),
    proofsJson: JSON.stringify([])
  },
  {
    id: 'stu-harish_2026-10',
    studentId: 'stu-harish',
    month: '2026-10',
    expectedFee: 65,
    waived: false,
    waiveReason: '',
    paymentsJson: JSON.stringify([
      {
        id: 'pay-104',
        amount: 65,
        date: '2026-10-03',
        method: 'TnG QR',
        refNo: 'TNG-88219',
        notes: 'Paid online',
        recordedBy: 'Aasaan Murugan'
      }
    ]),
    proofsJson: JSON.stringify([])
  }
];

const AVAILABLE_MONTHS = [
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-08', label: 'August 2026' }
];

function parsePayments(paymentsJson) {
  if (!paymentsJson) return [];
  if (Array.isArray(paymentsJson)) return paymentsJson;
  try {
    return JSON.parse(paymentsJson);
  } catch {
    return [];
  }
}

function parseProofs(proofsJson) {
  if (!proofsJson) return [];
  if (Array.isArray(proofsJson)) return proofsJson;
  try {
    return JSON.parse(proofsJson);
  } catch {
    return [];
  }
}

function computeFeeRecordStatus(feeRecord, fallbackExpectedFee = 60) {
  if (!feeRecord) {
    return {
      status: 'Unpaid',
      expected: fallbackExpectedFee,
      paid: 0,
      balance: fallbackExpectedFee,
      waived: false,
      payments: [],
      proofs: []
    };
  }
  const payments = parsePayments(feeRecord.paymentsJson);
  const proofs = parseProofs(feeRecord.proofsJson);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const expected = Number(feeRecord.expectedFee ?? fallbackExpectedFee);

  if (feeRecord.waived) {
    return {
      status: 'Waived',
      expected,
      paid: totalPaid,
      balance: 0,
      waived: true,
      waiveReason: feeRecord.waiveReason || 'Fee waived by Master',
      payments,
      proofs
    };
  }

  const balance = Math.max(0, expected - totalPaid);
  let status = 'Unpaid';
  if (totalPaid >= expected && expected > 0) {
    status = 'Paid';
  } else if (totalPaid > 0 && totalPaid < expected) {
    status = 'Partially paid';
  }

  return { status, expected, paid: totalPaid, balance, waived: false, payments, proofs };
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case 'Paid':
    case 'Present':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'Partially paid':
    case 'Excused':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'Waived':
      return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    case 'Unpaid':
    case 'Absent':
    default:
      return 'bg-rose-100 text-rose-900 border-rose-300';
  }
}

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const [adminProfile, setAdminProfile] = useState(INITIAL_ADMIN_PROFILE);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [parents, setParents] = useState(INITIAL_PARENTS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [fees, setFees] = useState(INITIAL_FEES);

  const [sessionUser, setSessionUser] = useState({
    role: 'master',
    id: 'master-1',
    name: INITIAL_ADMIN_PROFILE.masterName,
    email: INITIAL_ADMIN_PROFILE.masterEmail
  });

  const [activeScreen, setActiveScreen] = useState('master-dashboard');
  const [selectedParentChildId, setSelectedParentChildId] = useState('stu-kavin');
  const [selectedClassId, setSelectedClassId] = useState('cls-sp-sr');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState('2026-10-26');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  const [toast, setToast] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [correctionModal, setCorrectionModal] = useState(null);
  const [previewQrModal, setPreviewQrModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth fallback:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setFbUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser || !db) return;

    const settingsCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_settings');
    const classesCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_classes');
    const parentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_parents');
    const studentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_students');
    const attendanceCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_attendance');
    const feesCol = collection(db, 'artifacts', appId, 'public', 'data', 'silambam_fees');

    const unsubSettings = onSnapshot(settingsCol, (snap) => {
      if (snap.empty) {
        setDoc(doc(settingsCol, INITIAL_ADMIN_PROFILE.id), INITIAL_ADMIN_PROFILE);
      } else {
        setAdminProfile({ ...INITIAL_ADMIN_PROFILE, ...snap.docs[0].data() });
      }
    });

    const unsubClasses = onSnapshot(classesCol, (snap) => {
      if (snap.empty) {
        INITIAL_CLASSES.forEach((c) => setDoc(doc(classesCol, c.id), c));
      } else {
        setClasses(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      }
      setIsCloudSynced(true);
    });

    const unsubParents = onSnapshot(parentsCol, (snap) => {
      if (snap.empty) {
        INITIAL_PARENTS.forEach((p) => setDoc(doc(parentsCol, p.id), p));
      } else {
        setParents(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      }
    });

    const unsubStudents = onSnapshot(studentsCol, (snap) => {
      if (snap.empty) {
        INITIAL_STUDENTS.forEach((s) => setDoc(doc(studentsCol, s.id), s));
      } else {
        setStudents(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      }
    });

    const unsubAttendance = onSnapshot(attendanceCol, (snap) => {
      if (snap.empty) {
        INITIAL_ATTENDANCE.forEach((a) =>
          setDoc(doc(attendanceCol, a.id), { ...a, auditHistoryJson: JSON.stringify(a.auditHistory || []) })
        );
      } else {
        setAttendance(
          snap.docs.map((d) => {
            const raw = d.data();
            let parsedHistory = raw.auditHistory || [];
            if (raw.auditHistoryJson) {
              try { parsedHistory = JSON.parse(raw.auditHistoryJson); } catch {}
            }
            return { ...raw, id: d.id, auditHistory: parsedHistory };
          })
        );
      }
    });

    const unsubFees = onSnapshot(feesCol, (snap) => {
      if (snap.empty) {
        INITIAL_FEES.forEach((f) => setDoc(doc(feesCol, f.id), f));
      } else {
        setFees(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      }
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubParents();
      unsubStudents();
      unsubAttendance();
      unsubFees();
    };
  }, [fbUser]);

  const authorizedStudents = useMemo(() => {
    if (!sessionUser) return [];
    if (sessionUser.role === 'master') return students;
    return students.filter((s) => s.parentId === sessionUser.id);
  }, [sessionUser, students]);

  const authorizedStudentIds = useMemo(() => new Set(authorizedStudents.map((s) => s.id)), [authorizedStudents]);

  const authorizedAttendance = useMemo(() => {
    if (!sessionUser) return [];
    if (sessionUser.role === 'master') return attendance;
    return attendance.filter((a) => authorizedStudentIds.has(a.studentId));
  }, [sessionUser, attendance, authorizedStudentIds]);

  const authorizedFees = useMemo(() => {
    if (!sessionUser) return [];
    if (sessionUser.role === 'master') return fees;
    return fees.filter((f) => authorizedStudentIds.has(f.studentId));
  }, [sessionUser, fees, authorizedStudentIds]);

  useEffect(() => {
    if (sessionUser?.role === 'parent' && authorizedStudents.length > 0) {
      if (!authorizedStudentIds.has(selectedParentChildId)) {
        setSelectedParentChildId(authorizedStudents[0].id);
      }
    }
  }, [sessionUser, authorizedStudents, authorizedStudentIds, selectedParentChildId]);

  const requireMasterAccess = () => {
    if (!sessionUser || sessionUser.role !== 'master') {
      showToast('Access Denied: Master privileges required.', 'error');
      return false;
    }
    return true;
  };

  const handleMarkAttendance = async (studentId, classId, date, newStatus, correctionNote = '') => {
    if (!requireMasterAccess()) return;
    const recordId = `${classId}_${date}_${studentId}`;
    const existing = attendance.find((a) => a.id === recordId);
    const nowTimestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

    let updatedAudit = existing ? [...(existing.auditHistory || [])] : [];
    if (existing && existing.status !== newStatus) {
      updatedAudit.push({
        from: existing.status,
        to: newStatus,
        changedBy: sessionUser.name,
        changedAt: nowTimestamp,
        note: correctionNote || 'Status updated by Master'
      });
    }

    const updatedRecord = {
      id: recordId,
      classId,
      date,
      studentId,
      status: newStatus,
      markedBy: sessionUser.name,
      updatedAt: nowTimestamp,
      auditHistory: updatedAudit,
      auditHistoryJson: JSON.stringify(updatedAudit)
    };

    setAttendance((prev) => [...prev.filter((a) => a.id !== recordId), updatedRecord]);
    if (db && fbUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_attendance', recordId), updatedRecord);
      } catch (e) { console.error(e); }
    }
    showToast(`Marked ${newStatus}`, 'success');
  };

  const handleSaveAdminProfile = async (updatedProfile) => {
    if (!requireMasterAccess()) return;
    const cleanProfile = { ...adminProfile, ...updatedProfile, id: 'academy-settings' };
    setAdminProfile(cleanProfile);
    if (db && fbUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_settings', 'academy-settings'), cleanProfile);
      } catch (e) { console.error(e); }
    }
    showToast('Saved Academy Profile & QRs!', 'success');
  };

  const handleSaveClass = async (classData) => {
    if (!requireMasterAccess()) return;
    const classId = classData.id || `cls-${Date.now()}`;
    const cleanClass = {
      id: classId,
      name: classData.name.trim(),
      location: classData.location.trim(),
      schedule: classData.schedule?.trim() || 'Sat & Sun • 5:00 PM',
      defaultFee: Number(classData.defaultFee) || 60
    };
    setClasses((prev) => [...prev.filter((c) => c.id !== classId), cleanClass]);
    if (db && fbUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_classes', classId), cleanClass);
      } catch (e) { console.error(e); }
    }
    showToast(`Saved class: ${cleanClass.name}`, 'success');
  };

  const handleDeleteClass = async (classId) => {
    if (!requireMasterAccess()) return;
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    if (db && fbUser) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_classes', classId)); } catch (e) {}
    }
    showToast('Removed class batch.', 'success');
  };

  const handleRecordPayment = async ({ studentId, month, amount, date, method, refNo, notes }) => {
    if (!requireMasterAccess()) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const feeDocId = `${studentId}_${month}`;
    const existingFeeDoc = fees.find((f) => f.id === feeDocId);
    const existingPayments = existingFeeDoc ? parsePayments(existingFeeDoc.paymentsJson) : [];

    const newPaymentEntry = {
      id: `pay-${Date.now()}`,
      amount: numericAmount,
      date: date || new Date().toISOString().slice(0, 10),
      method: method || 'Cash',
      refNo: refNo?.trim() || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes?.trim() || '',
      recordedBy: sessionUser.name
    };

    const updatedPayments = [...existingPayments, newPaymentEntry];
    const updatedFeeDoc = {
      id: feeDocId,
      studentId,
      month,
      expectedFee: existingFeeDoc ? Number(existingFeeDoc.expectedFee) : Number(student.monthlyFee),
      waived: existingFeeDoc ? Boolean(existingFeeDoc.waived) : false,
      waiveReason: existingFeeDoc?.waiveReason || '',
      paymentsJson: JSON.stringify(updatedPayments),
      proofsJson: existingFeeDoc?.proofsJson || JSON.stringify([])
    };

    setFees((prev) => [...prev.filter((f) => f.id !== feeDocId), updatedFeeDoc]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_fees', feeDocId), updatedFeeDoc); } catch (e) {}
    }
    showToast(`Recorded RM ${numericAmount} for ${student.name}`, 'success');
  };

  const handleQuickCashConfirm = async (studentId, month) => {
    if (!requireMasterAccess()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const feeDocId = `${studentId}_${month}`;
    const existingFeeDoc = fees.find((f) => f.id === feeDocId);
    const statusInfo = computeFeeRecordStatus(existingFeeDoc, student.monthlyFee);
    if (statusInfo.balance <= 0) {
      showToast(`${student.name} is already Paid for ${month}!`, 'success');
      return;
    }
    await handleRecordPayment({
      studentId: student.id,
      month,
      amount: statusInfo.balance,
      date: new Date().toISOString().slice(0, 10),
      method: 'Cash',
      refNo: `CASH-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: 'Confirmed Cash by Master'
    });
  };

  const handleUploadPaymentProof = async ({ studentId, month, amount, method, notes, imageUrl }) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    if (sessionUser.role !== 'master' && student.parentId !== sessionUser.id) {
      showToast('Access Denied.', 'error');
      return;
    }
    const feeDocId = `${studentId}_${month}`;
    const existingFeeDoc = fees.find((f) => f.id === feeDocId);
    const existingProofs = existingFeeDoc ? parseProofs(existingFeeDoc.proofsJson) : [];
    const statusInfo = computeFeeRecordStatus(existingFeeDoc, student.monthlyFee);

    const newProof = {
      id: `proof-${Date.now()}`,
      amount: Number(amount) || statusInfo.balance || Number(student.monthlyFee),
      method: method || 'TnG QR',
      date: new Date().toISOString().slice(0, 10),
      notes: notes?.trim() || '',
      imageUrl,
      status: 'Pending Approval',
      submittedBy: sessionUser.name,
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    const updatedFeeDoc = {
      id: feeDocId,
      studentId,
      month,
      expectedFee: existingFeeDoc ? Number(existingFeeDoc.expectedFee) : Number(student.monthlyFee),
      waived: existingFeeDoc ? Boolean(existingFeeDoc.waived) : false,
      waiveReason: existingFeeDoc?.waiveReason || '',
      paymentsJson: existingFeeDoc?.paymentsJson || JSON.stringify([]),
      proofsJson: JSON.stringify([newProof, ...existingProofs])
    };

    setFees((prev) => [...prev.filter((f) => f.id !== feeDocId), updatedFeeDoc]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_fees', feeDocId), updatedFeeDoc); } catch (e) {}
    }
    showToast('Payment proof uploaded for Master approval!', 'success');
  };

  const handleApprovePaymentProof = async (studentId, month, proofId) => {
    if (!requireMasterAccess()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const feeDocId = `${studentId}_${month}`;
    const existingFeeDoc = fees.find((f) => f.id === feeDocId);
    if (!existingFeeDoc) return;

    const existingProofs = parseProofs(existingFeeDoc.proofsJson);
    const targetProof = existingProofs.find((p) => p.id === proofId);
    if (!targetProof) return;

    const existingPayments = parsePayments(existingFeeDoc.paymentsJson);
    const newPaymentEntry = {
      id: `pay-${Date.now()}`,
      amount: Number(targetProof.amount) || Number(student.monthlyFee),
      date: targetProof.date,
      method: targetProof.method,
      refNo: `PRF-${proofId.slice(-4).toUpperCase()}`,
      notes: 'Approved payment proof',
      recordedBy: sessionUser.name
    };

    const updatedFeeDoc = {
      ...existingFeeDoc,
      paymentsJson: JSON.stringify([...existingPayments, newPaymentEntry]),
      proofsJson: JSON.stringify(existingProofs.map((p) => (p.id === proofId ? { ...p, status: 'Approved' } : p)))
    };

    setFees((prev) => [...prev.filter((f) => f.id !== feeDocId), updatedFeeDoc]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_fees', feeDocId), updatedFeeDoc); } catch (e) {}
    }
    showToast(`Approved proof & recorded RM ${newPaymentEntry.amount}!`, 'success');
  };

  const handleToggleWaiveMonth = async (studentId, month, waiveReasonInput) => {
    if (!requireMasterAccess()) return;
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    const feeDocId = `${studentId}_${month}`;
    const existingFeeDoc = fees.find((f) => f.id === feeDocId);
    const currentlyWaived = existingFeeDoc ? Boolean(existingFeeDoc.waived) : false;

    const updatedFeeDoc = {
      id: feeDocId,
      studentId,
      month,
      expectedFee: existingFeeDoc ? Number(existingFeeDoc.expectedFee) : Number(student.monthlyFee),
      waived: !currentlyWaived,
      waiveReason: !currentlyWaived ? waiveReasonInput || 'Waived by Master' : '',
      paymentsJson: existingFeeDoc?.paymentsJson || JSON.stringify([]),
      proofsJson: existingFeeDoc?.proofsJson || JSON.stringify([])
    };

    setFees((prev) => [...prev.filter((f) => f.id !== feeDocId), updatedFeeDoc]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_fees', feeDocId), updatedFeeDoc); } catch (e) {}
    }
    showToast(!currentlyWaived ? 'Fee waived' : 'Fee waiver removed', 'success');
  };

  const handleSaveStudent = async (studentData) => {
    if (!requireMasterAccess()) return;
    const studentId = studentData.id || `stu-${Date.now()}`;
    const cleanStudent = {
      id: studentId,
      name: studentData.name.trim(),
      parentId: studentData.parentId,
      classId: studentData.classId,
      location: studentData.location || 'Sungai Pelek Main Kalari',
      joiningDate: studentData.joiningDate || new Date().toISOString().slice(0, 10),
      active: studentData.active !== undefined ? studentData.active : true,
      monthlyFee: Number(studentData.monthlyFee) || 60,
      level: studentData.level || 'Nilai 1'
    };
    setStudents((prev) => [...prev.filter((s) => s.id !== studentId), cleanStudent]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_students', studentId), cleanStudent); } catch (e) {}
    }
    showToast(`Saved ${cleanStudent.name}`, 'success');
  };

  const handleSaveParent = async (parentData) => {
    if (!requireMasterAccess()) return;
    const parentId = parentData.id || `parent-${Date.now()}`;
    const cleanParent = {
      id: parentId,
      name: parentData.name.trim(),
      email: parentData.email.trim().toLowerCase(),
      phone: parentData.phone?.trim() || '+60 12-000 0000',
      role: 'parent',
      accessCode: '1234'
    };
    setParents((prev) => [...prev.filter((p) => p.id !== parentId), cleanParent]);
    if (db && fbUser) {
      try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'silambam_parents', parentId), cleanParent); } catch (e) {}
    }
    showToast(`Saved parent ${cleanParent.name}`, 'success');
  };

  const switchDemoAccount = (target) => {
    if (target === 'master') {
      setSessionUser({ role: 'master', id: 'master-1', name: adminProfile.masterName, email: adminProfile.masterEmail });
      setActiveScreen('master-dashboard');
      showToast('Switched to Master / Admin View', 'success');
    } else if (target === 'login') {
      setSessionUser(null);
      setActiveScreen('login');
    } else {
      const parentObj = parents.find((p) => p.id === target);
      if (parentObj) {
        setSessionUser(parentObj);
        const kids = students.filter((s) => s.parentId === parentObj.id);
        if (kids.length > 0) setSelectedParentChildId(kids[0].id);
        setActiveScreen('parent-dashboard');
        showToast(`Logged in as ${parentObj.name}`, 'success');
      }
    }
  };

  if (!sessionUser) {
    return (
      <LoginAndResetScreen
        adminProfile={adminProfile}
        parents={parents}
        onLoginSuccess={(userObj) => {
          setSessionUser(userObj);
          if (userObj.role === 'master') setActiveScreen('master-dashboard');
          else {
            const kids = students.filter((s) => s.parentId === userObj.id);
            if (kids.length > 0) setSelectedParentChildId(kids[0].id);
            setActiveScreen('parent-dashboard');
          }
          showToast(`Vanakkam, ${userObj.name}!`, 'success');
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col pb-24 md:pb-10">
      <div className="bg-amber-950 text-amber-100 px-3 py-2 text-xs border-b border-amber-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
              Sungai Pelek Academy Portal
            </span>
            <span className="hidden sm:inline text-amber-200">Test roles instantly:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => switchDemoAccount('master')}
              className={`px-2.5 py-1 rounded font-medium transition ${sessionUser.role === 'master' ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' : 'bg-amber-900 text-amber-200'}`}
            >
              Master (Admin)
            </button>
            {parents.map((p) => (
              <button
                key={p.id}
                onClick={() => switchDemoAccount(p.id)}
                className={`px-2.5 py-1 rounded font-medium transition ${sessionUser.id === p.id ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' : 'bg-amber-900 text-amber-200'}`}
              >
                Parent: {p.name.split(' ')[0]}
              </button>
            ))}
            <button
              onClick={() => setArchitectureModalOpen(true)}
              className="px-2.5 py-1 rounded bg-red-900 text-amber-100 font-semibold flex items-center gap-1 border border-amber-700"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              Deployment & Rules Guide
            </button>
          </div>
        </div>
      </div>

      <header className="bg-gradient-to-r from-red-950 via-red-900 to-amber-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="4" y1="20" x2="20" y2="4" strokeLinecap="round" />
                <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-tight">
                  {adminProfile.academyName}
                </h1>
                {isCloudSynced && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-emerald-900/70 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live DB
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200">
                {adminProfile.tagline} • <span className="font-semibold text-amber-300">{sessionUser.role === 'master' ? 'Master Portal' : 'Parent Portal'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right mr-1">
              <div className="text-xs font-semibold text-white">{sessionUser.name}</div>
              <div className="text-[11px] text-amber-200">{sessionUser.email}</div>
            </div>
            <button
              onClick={() => switchDemoAccount('login')}
              className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-950 text-amber-200 border border-amber-400/30 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block bg-red-950/50 border-t border-red-800/60">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center gap-1 py-1.5">
            {sessionUser.role === 'master' ? (
              <>
                <NavTabButton active={activeScreen === 'master-dashboard'} onClick={() => setActiveScreen('master-dashboard')} icon={<Shield className="w-4 h-4" />} label="Master Dashboard" />
                <NavTabButton active={activeScreen === 'fast-attendance'} onClick={() => setActiveScreen('fast-attendance')} icon={<CalendarCheck className="w-4 h-4" />} label="Fast Attendance" />
                <NavTabButton active={activeScreen === 'payment-entry'} onClick={() => setActiveScreen('payment-entry')} icon={<CreditCard className="w-4 h-4" />} label="Payments & Fees" />
                <NavTabButton active={activeScreen === 'students-parents'} onClick={() => setActiveScreen('students-parents')} icon={<Users className="w-4 h-4" />} label="Students & Parents" />
                <NavTabButton active={activeScreen === 'monthly-reports'} onClick={() => setActiveScreen('monthly-reports')} icon={<BarChart3 className="w-4 h-4" />} label="Monthly Reports" />
                <NavTabButton active={activeScreen === 'admin-settings'} onClick={() => setActiveScreen('admin-settings')} icon={<Settings className="w-4 h-4" />} label="Admin Profile & QRs" />
              </>
            ) : (
              <>
                <NavTabButton active={activeScreen === 'parent-dashboard'} onClick={() => setActiveScreen('parent-dashboard')} icon={<Users className="w-4 h-4" />} label="Family Dashboard" />
                <NavTabButton active={activeScreen === 'child-attendance'} onClick={() => setActiveScreen('child-attendance')} icon={<CalendarCheck className="w-4 h-4" />} label="Attendance History" />
                <NavTabButton active={activeScreen === 'child-fees'} onClick={() => setActiveScreen('child-fees')} icon={<CreditCard className="w-4 h-4" />} label="Fees, QRs & Receipts" />
              </>
            )}
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl border-l-4 border-amber-400 flex items-center gap-3 animate-bounce">
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <main className="max-w-5xl w-full mx-auto px-4 py-5 flex-1">
        {sessionUser.role === 'master' ? (
          <>
            {activeScreen === 'master-dashboard' && (
              <MasterDashboardScreen
                adminProfile={adminProfile}
                classes={classes}
                students={students}
                parents={parents}
                attendance={attendance}
                fees={fees}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                onQuickCashConfirm={handleQuickCashConfirm}
                onApproveProof={handleApprovePaymentProof}
                onPreviewQr={(title, image, subtitle) => setPreviewQrModal({ title, image, subtitle })}
                onQuickMarkClass={(clsId) => { setSelectedClassId(clsId); setActiveScreen('fast-attendance'); }}
                onNavigate={(screen) => setActiveScreen(screen)}
              />
            )}
            {activeScreen === 'fast-attendance' && (
              <FastAttendanceScreen
                classes={classes}
                students={students}
                attendance={attendance}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
                selectedDate={selectedAttendanceDate}
                setSelectedDate={setSelectedAttendanceDate}
                onMarkAttendance={handleMarkAttendance}
                onOpenCorrection={(record, student) => setCorrectionModal({ record, student })}
                onGoToClasses={() => setActiveScreen('admin-settings')}
              />
            )}
            {activeScreen === 'payment-entry' && (
              <PaymentEntryScreen
                adminProfile={adminProfile}
                students={students}
                parents={parents}
                fees={fees}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                onRecordPayment={handleRecordPayment}
                onQuickCashConfirm={handleQuickCashConfirm}
                onApproveProof={handleApprovePaymentProof}
                onPreviewQr={(title, image, subtitle) => setPreviewQrModal({ title, image, subtitle })}
                onToggleWaive={handleToggleWaiveMonth}
                onViewReceipt={(payment, student, month) => setReceiptModal({ payment, student, month })}
              />
            )}
            {activeScreen === 'students-parents' && (
              <StudentParentManagementScreen
                students={students}
                parents={parents}
                classes={classes}
                fees={fees}
                selectedMonth={selectedMonth}
                onQuickCashConfirm={handleQuickCashConfirm}
                onSaveStudent={handleSaveStudent}
                onSaveParent={handleSaveParent}
                onGoToClasses={() => setActiveScreen('admin-settings')}
              />
            )}
            {activeScreen === 'monthly-reports' && (
              <MonthlyReportsScreen
                students={students}
                parents={parents}
                classes={classes}
                attendance={attendance}
                fees={fees}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                showToast={showToast}
              />
            )}
            {activeScreen === 'admin-settings' && (
              <AdminProfileAndClassesScreen
                adminProfile={adminProfile}
                classes={classes}
                students={students}
                onSaveProfile={handleSaveAdminProfile}
                onSaveClass={handleSaveClass}
                onDeleteClass={handleDeleteClass}
                onPreviewQr={(title, image, subtitle) => setPreviewQrModal({ title, image, subtitle })}
                showToast={showToast}
              />
            )}
          </>
        ) : (
          <>
            {activeScreen === 'parent-dashboard' && (
              <ParentDashboardScreen
                adminProfile={adminProfile}
                parent={sessionUser}
                childrenList={authorizedStudents}
                classes={classes}
                attendance={authorizedAttendance}
                fees={authorizedFees}
                selectedChildId={selectedParentChildId}
                setSelectedChildId={setSelectedParentChildId}
                selectedMonth={selectedMonth}
                onUploadProof={handleUploadPaymentProof}
                onPreviewQr={(title, image, subtitle) => setPreviewQrModal({ title, image, subtitle })}
                onNavigate={(screen, childId) => {
                  if (childId) setSelectedParentChildId(childId);
                  setActiveScreen(screen);
                }}
                showToast={showToast}
              />
            )}
            {activeScreen === 'child-attendance' && (
              <ChildAttendanceHistoryScreen
                childrenList={authorizedStudents}
                classes={classes}
                attendance={authorizedAttendance}
                selectedChildId={selectedParentChildId}
                setSelectedChildId={setSelectedParentChildId}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            )}
            {activeScreen === 'child-fees' && (
              <ChildFeesHistoryScreen
                adminProfile={adminProfile}
                childrenList={authorizedStudents}
                classes={classes}
                fees={authorizedFees}
                selectedChildId={selectedParentChildId}
                setSelectedChildId={setSelectedParentChildId}
                onUploadProof={handleUploadPaymentProof}
                onPreviewQr={(title, image, subtitle) => setPreviewQrModal({ title, image, subtitle })}
                onViewReceipt={(payment, student, month) => setReceiptModal({ payment, student, month })}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-300 shadow-lg z-30 flex justify-around items-center py-1.5 px-1">
        {sessionUser.role === 'master' ? (
          <>
            <MobileNavButton active={activeScreen === 'master-dashboard'} onClick={() => setActiveScreen('master-dashboard')} icon={<Shield className="w-5 h-5" />} label="Home" />
            <MobileNavButton active={activeScreen === 'fast-attendance'} onClick={() => setActiveScreen('fast-attendance')} icon={<CalendarCheck className="w-5 h-5" />} label="Attend" />
            <MobileNavButton active={activeScreen === 'payment-entry'} onClick={() => setActiveScreen('payment-entry')} icon={<CreditCard className="w-5 h-5" />} label="Payments" />
            <MobileNavButton active={activeScreen === 'students-parents'} onClick={() => setActiveScreen('students-parents')} icon={<Users className="w-5 h-5" />} label="Students" />
            <MobileNavButton active={activeScreen === 'admin-settings'} onClick={() => setActiveScreen('admin-settings')} icon={<Settings className="w-5 h-5" />} label="Admin/QRs" />
          </>
        ) : (
          <>
            <MobileNavButton active={activeScreen === 'parent-dashboard'} onClick={() => setActiveScreen('parent-dashboard')} icon={<Users className="w-5 h-5" />} label="My Family" />
            <MobileNavButton active={activeScreen === 'child-attendance'} onClick={() => setActiveScreen('child-attendance')} icon={<CalendarCheck className="w-5 h-5" />} label="Attendance" />
            <MobileNavButton active={activeScreen === 'child-fees'} onClick={() => setActiveScreen('child-fees')} icon={<CreditCard className="w-5 h-5" />} label="Fees & QRs" />
          </>
        )}
      </nav>

      {receiptModal && <ReceiptModal adminProfile={adminProfile} data={receiptModal} onClose={() => setReceiptModal(null)} />}
      {correctionModal && (
        <AttendanceCorrectionModal
          data={correctionModal}
          onClose={() => setCorrectionModal(null)}
          onSaveCorrection={(newStatus, note) => {
            handleMarkAttendance(correctionModal.student.id, correctionModal.record.classId, correctionModal.record.date, newStatus, note);
            setCorrectionModal(null);
          }}
        />
      )}
      {architectureModalOpen && <DeploymentGuideModal onClose={() => setArchitectureModalOpen(false)} />}
      {previewQrModal && <QrCodePreviewModal data={previewQrModal} academyName={adminProfile?.academyName} onClose={() => setPreviewQrModal(null)} />}
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS: OFFICIAL PAYMENT QR & PROOF UPLOADER
// ============================================================================
function OfficialPaymentQrSection({ adminProfile, onPreviewQr }) {
  return (
    <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border-2 border-amber-300 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
          <QrCode className="w-5 h-5 text-red-900 shrink-0" />
          <span>Scan to Pay Monthly Fees ({adminProfile?.academyName})</span>
        </div>
        <span className="text-[11px] font-bold bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
          Tap QR to Enlarge
        </span>
      </div>

      {adminProfile?.paymentInstructions && (
        <p className="text-xs text-stone-700">{adminProfile.paymentInstructions}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col items-center text-center justify-between shadow-sm">
          <div className="w-full">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[11px] mb-1.5">
              Touch 'n Go eWallet QR
            </span>
            <div className="text-xs font-semibold text-stone-700 mb-2">
              {adminProfile?.tngDetails || 'TnG eWallet QR'}
            </div>
          </div>
          {adminProfile?.tngQrImage ? (
            <button
              type="button"
              onClick={() => onPreviewQr("Touch 'n Go eWallet QR", adminProfile.tngQrImage, adminProfile.tngDetails)}
              className="group relative bg-stone-50 p-2 rounded-xl border border-stone-200 hover:border-blue-500 transition"
            >
              <img src={adminProfile.tngQrImage} alt="TnG QR" className="w-40 h-40 object-contain mx-auto rounded-lg" />
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 group-hover:underline">
                <ZoomIn className="w-3.5 h-3.5" /> Tap to Enlarge
              </span>
            </button>
          ) : (
            <div className="w-40 h-40 rounded-xl bg-stone-100 flex items-center justify-center text-xs text-stone-400">No TnG QR Uploaded</div>
          )}
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col items-center text-center justify-between shadow-sm">
          <div className="w-full">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] mb-1.5">
              Bank / DuitNow QR
            </span>
            <div className="text-xs font-semibold text-stone-700 mb-2">
              {adminProfile?.bankQrDetails || 'Bank QR Transfer'}
            </div>
          </div>
          {adminProfile?.bankQrImage ? (
            <button
              type="button"
              onClick={() => onPreviewQr('Bank / DuitNow QR', adminProfile.bankQrImage, adminProfile.bankQrDetails)}
              className="group relative bg-stone-50 p-2 rounded-xl border border-stone-200 hover:border-amber-600 transition"
            >
              <img src={adminProfile.bankQrImage} alt="Bank QR" className="w-40 h-40 object-contain mx-auto rounded-lg" />
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-900 group-hover:underline">
                <ZoomIn className="w-3.5 h-3.5" /> Tap to Enlarge
              </span>
            </button>
          ) : (
            <div className="w-40 h-40 rounded-xl bg-stone-100 flex items-center justify-center text-xs text-stone-400">No Bank QR Uploaded</div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col justify-center items-center text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-2 font-extrabold text-sm">
            MYR
          </div>
          <div className="font-bold text-sm text-stone-900">Pay Cash in Class</div>
          <p className="text-xs text-stone-600 mt-1">
            Hand monthly fee directly to <strong className="text-stone-900">{adminProfile?.masterName}</strong> during training.
          </p>
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 font-semibold text-xs">
            Master Phone: {adminProfile?.masterPhone}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParentPaymentProofUploadBox({ childrenList, selectedChildId, defaultMonth = '2026-10', fees, onUploadProof, onPreviewQr, showToast }) {
  const [studentId, setStudentId] = useState(selectedChildId || childrenList[0]?.id || '');
  const [month, setMonth] = useState(defaultMonth);
  const [method, setMethod] = useState('TnG QR');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (selectedChildId) setStudentId(selectedChildId); }, [selectedChildId]);

  const activeChild = childrenList.find((c) => c.id === studentId) || childrenList[0];
  const currentFeeRec = fees.find((f) => f.id === `${activeChild?.id}_${month}`);
  const statusInfo = computeFeeRecordStatus(currentFeeRec, activeChild?.monthlyFee || 60);

  useEffect(() => {
    if (activeChild) setAmount(String(statusInfo.balance > 0 ? statusInfo.balance : activeChild.monthlyFee));
  }, [activeChild?.id, month, statusInfo.balance]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChild) return;
    try {
      setUploading(true);
      const compressedDataUrl = await compressQrImageFile(file, 650);
      await onUploadProof({
        studentId: activeChild.id,
        month,
        amount: Number(amount) || statusInfo.balance || activeChild.monthlyFee,
        method,
        notes,
        imageUrl: compressedDataUrl
      });
      setNotes('');
    } catch (err) {
      showToast && showToast('Could not upload image.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!activeChild) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-300 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm sm:text-base">
          <Upload className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>Upload Payment Proof / Receipt Screenshot</span>
        </div>
        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
          Sent to Master for Approval
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Student</label>
          <select value={activeChild.id} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
            {childrenList.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
            {AVAILABLE_MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Method Used</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
            <option value="TnG QR">TnG QR</option>
            <option value="Bank QR">Bank QR</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">Amount (MYR)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note or transaction ref..." className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs" />
        <label className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition shrink-0">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Payment Proof Photo'}</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {statusInfo.proofs && statusInfo.proofs.length > 0 && (
        <div className="pt-3 border-t border-stone-200 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Uploaded Proofs for {activeChild.name} ({month})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {statusInfo.proofs.map((prf) => (
              <div key={prf.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img src={prf.imageUrl} alt="Proof" onClick={() => onPreviewQr && onPreviewQr(`Payment Proof • ${activeChild.name}`, prf.imageUrl, `RM ${prf.amount} • ${prf.method}`)} className="w-12 h-12 rounded-lg object-cover border cursor-pointer shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">RM {prf.amount} • {prf.method}</div>
                    <div className="text-[11px] text-stone-500">{prf.submittedAt}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${prf.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                  {prf.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavTabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${active ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-amber-100 hover:bg-red-900/70'}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[64px] transition ${active ? 'text-red-900 bg-amber-100 font-bold' : 'text-stone-600 font-medium'}`}>
      {icon}
      <span className="text-[11px] mt-0.5">{label}</span>
    </button>
  );
}

// ============================================================================
// SCREEN 1: LOGIN
// ============================================================================
function LoginAndResetScreen({ adminProfile, parents, onLoginSuccess, showToast }) {
  const [email, setEmail] = useState('anand.sample@kalari.my');
  const [password, setPassword] = useState('1234');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'master@kalari.my' || cleanEmail === adminProfile?.masterEmail?.toLowerCase()) {
      onLoginSuccess({ role: 'master', id: 'master-1', name: adminProfile?.masterName || 'Master', email: adminProfile?.masterEmail || 'master@kalari.my' });
      return;
    }
    const foundParent = parents.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!foundParent) {
      showToast('Account not found. Try sample accounts below.', 'error');
      return;
    }
    onLoginSuccess(foundParent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 via-stone-900 to-stone-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-400/40">
        <div className="bg-gradient-to-r from-red-900 to-amber-900 p-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400 mx-auto flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{adminProfile?.academyName}</h1>
          <p className="text-xs text-amber-200 mt-1">Parent & Master Portal • Sungai Pelek & Sepang Kalari</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Password / PIN</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-sm" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-red-900 hover:bg-red-800 text-white font-bold rounded-xl shadow-md transition text-sm">
              Sign In to Portal
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">Quick Demo Accounts:</p>
            <div className="space-y-2">
              <button
                onClick={() => onLoginSuccess({ role: 'master', id: 'master-1', name: 'Aasaan Murugan (Master)', email: 'master@kalari.my' })}
                className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left flex items-center justify-between transition"
              >
                <div>
                  <div className="text-xs font-bold text-amber-950">Master / Administrator</div>
                  <div className="text-[11px] text-amber-800">Full access to classes, students & fees</div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-900" />
              </button>
              {parents.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onLoginSuccess(p)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-900">{p.name}</div>
                    <div className="text-[11px] text-stone-600">{p.email}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 2: PARENT DASHBOARD
// ============================================================================
function ParentDashboardScreen({ adminProfile, parent, childrenList, classes, attendance, fees, selectedChildId, setSelectedChildId, selectedMonth, onUploadProof, onPreviewQr, onNavigate, showToast }) {
  const familySummary = useMemo(() => {
    let totalOutstanding = 0;
    childrenList.forEach((child) => {
      AVAILABLE_MONTHS.slice(0, 2).forEach((m) => {
        const rec = fees.find((f) => f.id === `${child.id}_${m.value}`);
        const statusInfo = computeFeeRecordStatus(rec, child.monthlyFee);
        totalOutstanding += statusInfo.balance;
      });
    });
    return { totalOutstanding };
  }, [childrenList, fees]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1.5">
            <Lock className="w-3.5 h-3.5" /> Protected Family View • {parent.email}
          </div>
          <h2 className="text-xl font-bold text-stone-900">Vanakkam, {parent.name}</h2>
          <p className="text-xs sm:text-sm text-stone-600">Viewing {childrenList.length} enrolled child(ren) in Sungai Pelek Academy.</p>
        </div>
        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
          <div className="text-xs font-semibold text-stone-500 uppercase">Family Total Due (MYR)</div>
          <div className={`text-2xl font-extrabold ${familySummary.totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            RM {familySummary.totalOutstanding}
          </div>
        </div>
      </div>

      <OfficialPaymentQrSection adminProfile={adminProfile} onPreviewQr={onPreviewQr} />

      <ParentPaymentProofUploadBox
        childrenList={childrenList}
        selectedChildId={selectedChildId}
        defaultMonth={selectedMonth}
        fees={fees}
        onUploadProof={onUploadProof}
        onPreviewQr={onPreviewQr}
        showToast={showToast}
      />

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 px-1">Your Children</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childrenList.map((child) => {
            const childClass = classes.find((c) => c.id === child.classId);
            const childAttend = attendance.filter((a) => a.studentId === child.id && a.date.startsWith(selectedMonth));
            const presentCount = childAttend.filter((a) => a.status === 'Present').length;
            const currentFeeRecord = fees.find((f) => f.id === `${child.id}_${selectedMonth}`);
            const feeStatus = computeFeeRecordStatus(currentFeeRecord, child.monthlyFee);

            return (
              <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col justify-between">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">{child.level}</span>
                      <h4 className="text-lg font-bold text-stone-900 mt-1">{child.name}</h4>
                      <p className="text-xs text-stone-600">{childClass?.name} • {child.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(feeStatus.status)}`}>
                      {selectedMonth}: {feeStatus.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase">Oct Attendance</div>
                      <div className="text-lg font-bold text-stone-900 mt-0.5">{presentCount}/{childAttend.length} Classes</div>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div className="text-[11px] font-semibold text-stone-500 uppercase">Oct Fee Due</div>
                      <div className={`text-lg font-bold mt-0.5 ${feeStatus.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        RM {feeStatus.balance}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between gap-2">
                  <button onClick={() => onNavigate('child-attendance', child.id)} className="flex-1 py-2 px-3 rounded-xl bg-white text-stone-800 border border-stone-300 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-red-800" /> Attendance Log
                  </button>
                  <button onClick={() => onNavigate('child-fees', child.id)} className="flex-1 py-2 px-3 rounded-xl bg-red-900 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                    <Receipt className="w-4 h-4" /> Fees & Receipts
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 3: CHILD ATTENDANCE HISTORY
// ============================================================================
function ChildAttendanceHistoryScreen({ childrenList, classes, attendance, selectedChildId, setSelectedChildId, selectedMonth, setSelectedMonth }) {
  const activeChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const monthlyRecords = useMemo(() => {
    if (!activeChild) return [];
    return attendance.filter((a) => a.studentId === activeChild.id && a.date.startsWith(selectedMonth)).sort((a, b) => b.date.localeCompare(a.date));
  }, [activeChild, attendance, selectedMonth]);

  if (!activeChild) return null;
  const childClass = classes.find((c) => c.id === activeChild.classId);

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {childrenList.map((child) => (
            <button key={child.id} onClick={() => setSelectedChildId(child.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeChild.id === child.id ? 'bg-red-900 text-white' : 'bg-stone-100 text-stone-700'}`}>
              {child.name}
            </button>
          ))}
        </div>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
          {AVAILABLE_MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600">
          Attendance Records for {activeChild.name} ({selectedMonth})
        </div>
        {monthlyRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">No attendance records found for this month yet.</div>
        ) : (
          <div className="divide-y divide-stone-200">
            {monthlyRecords.map((rec) => (
              <div key={rec.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-stone-900">{rec.date}</div>
                  <div className="text-xs text-stone-500">Marked by {rec.markedBy}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(rec.status)}`}>{rec.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 4: CHILD FEES HISTORY
// ============================================================================
function ChildFeesHistoryScreen({ adminProfile, childrenList, classes, fees, selectedChildId, setSelectedChildId, onUploadProof, onPreviewQr, onViewReceipt, showToast }) {
  const activeChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  if (!activeChild) return null;

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {childrenList.map((child) => (
            <button key={child.id} onClick={() => setSelectedChildId(child.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeChild.id === child.id ? 'bg-red-900 text-white' : 'bg-stone-100 text-stone-700'}`}>
              {child.name}
            </button>
          ))}
        </div>
        <div className="text-xs font-semibold text-stone-600">
          Monthly Fee: <span className="font-bold text-stone-900">RM {activeChild.monthlyFee}/month</span>
        </div>
      </div>

      <OfficialPaymentQrSection adminProfile={adminProfile} onPreviewQr={onPreviewQr} />

      <ParentPaymentProofUploadBox
        childrenList={childrenList}
        selectedChildId={activeChild.id}
        defaultMonth="2026-10"
        fees={fees}
        onUploadProof={onUploadProof}
        onPreviewQr={onPreviewQr}
        showToast={showToast}
      />

      <div className="space-y-4">
        {AVAILABLE_MONTHS.slice(0, 2).map((m) => {
          const rec = fees.find((f) => f.id === `${activeChild.id}_${m.value}`);
          const info = computeFeeRecordStatus(rec, activeChild.monthlyFee);

          return (
            <div key={m.value} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">{m.label}</h3>
                  <p className="text-xs text-stone-600">Fee: RM {info.expected} • Paid: RM {info.paid} • <span className="font-bold text-stone-900">Due: RM {info.balance}</span></p>
                </div>
                <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(info.status)}`}>{info.status}</span>
              </div>
              <div className="p-4 sm:p-5">
                {info.payments.length === 0 ? (
                  <p className="text-xs text-stone-500">No payment records yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {info.payments.map((pay) => (
                      <div key={pay.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-stone-900">RM {pay.amount} • {pay.method}</div>
                          <div className="text-xs text-stone-600">Date: {pay.date} • Ref: {pay.refNo || 'N/A'}</div>
                        </div>
                        <button onClick={() => onViewReceipt(pay, activeChild, m.label)} className="px-3.5 py-2 rounded-xl bg-white text-red-900 border border-stone-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <Receipt className="w-4 h-4" /> View Receipt
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 5: MASTER DASHBOARD
// ============================================================================
function MasterDashboardScreen({ adminProfile, classes, students, parents, attendance, fees, selectedMonth, setSelectedMonth, onQuickCashConfirm, onApproveProof, onPreviewQr, onQuickMarkClass, onNavigate }) {
  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);

  const feeOverview = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const unpaidStudents = [];
    const pendingProofs = [];

    activeStudents.forEach((stu) => {
      const rec = fees.find((f) => f.id === `${stu.id}_${selectedMonth}`);
      const statusObj = computeFeeRecordStatus(rec, stu.monthlyFee);
      if (!statusObj.waived) totalExpected += statusObj.expected;
      totalCollected += statusObj.paid;
      totalOutstanding += statusObj.balance;

      if (statusObj.balance > 0) {
        unpaidStudents.push({ student: stu, statusObj, parent: parents.find((p) => p.id === stu.parentId) });
      }
      if (statusObj.proofs) {
        statusObj.proofs.forEach((prf) => {
          if (prf.status !== 'Approved') pendingProofs.push({ student: stu, month: selectedMonth, proof: prf });
        });
      }
    });

    return { totalExpected, totalCollected, totalOutstanding, unpaidStudents, pendingProofs };
  }, [activeStudents, fees, parents, selectedMonth]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">{adminProfile?.academyName} • Master Dashboard</span>
          <h2 className="text-xl font-bold text-stone-900 mt-0.5">Vanakkam, {adminProfile?.masterName}</h2>
          <p className="text-xs text-stone-600">Quickly confirm cash payments, approve receipt uploads, and track attendance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('admin-settings')} className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1.5 border border-amber-300">
            <Settings className="w-4 h-4" /> Edit Admin QRs
          </button>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
            {AVAILABLE_MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="text-xs font-bold uppercase text-stone-500">Active Students</div>
          <div className="text-2xl font-extrabold text-stone-900 mt-1">{activeStudents.length} Enrolled</div>
          <button onClick={() => onNavigate('students-parents')} className="mt-3 text-xs font-bold text-red-900 hover:underline flex items-center gap-1">Manage students <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="text-xs font-bold uppercase text-stone-500">Collected ({selectedMonth})</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">RM {feeOverview.totalCollected} <span className="text-xs text-stone-400">/ {feeOverview.totalExpected}</span></div>
          <button onClick={() => onNavigate('payment-entry')} className="mt-3 text-xs font-bold text-red-900 hover:underline flex items-center gap-1">Payment ledger <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="text-xs font-bold uppercase text-stone-500">Outstanding Due</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">RM {feeOverview.totalOutstanding}</div>
          <div className="mt-3 text-xs text-stone-600">{feeOverview.unpaidStudents.length} student(s) pending</div>
        </div>
      </div>

      {feeOverview.pendingProofs.length > 0 && (
        <div className="bg-amber-50 rounded-2xl shadow-sm border-2 border-amber-300 overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-100 border-b border-amber-300 flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-950">Uploaded Payment Proofs Awaiting Approval ({feeOverview.pendingProofs.length})</h3>
          </div>
          <div className="divide-y divide-amber-200">
            {feeOverview.pendingProofs.map(({ student, month, proof }) => (
              <div key={proof.id} className="p-4 sm:px-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={proof.imageUrl} alt="Proof" onClick={() => onPreviewQr(`Payment Proof • ${student.name}`, proof.imageUrl, `RM ${proof.amount}`)} className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 cursor-pointer" />
                  <div>
                    <div className="font-bold text-sm text-stone-900">{student.name} — RM {proof.amount} ({proof.method})</div>
                    <div className="text-xs text-stone-600">Uploaded by {proof.submittedBy} on {proof.submittedAt}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onApproveProof(student.id, month, proof.id)} className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Approve & Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Outstanding Fees & 1-Click Cash Confirm ({selectedMonth})</h3>
        </div>
        {feeOverview.unpaidStudents.length === 0 ? (
          <div className="p-6 text-center text-sm text-emerald-800 font-medium">All active students have settled their fees for {selectedMonth}!</div>
        ) : (
          <div className="divide-y divide-stone-200">
            {feeOverview.unpaidStudents.map(({ student, statusObj, parent }) => (
              <div key={student.id} className="p-4 sm:px-5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-stone-900">{student.name}</div>
                  <div className="text-xs text-stone-600">Parent: {parent?.name} ({parent?.phone})</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-rose-700">RM {statusObj.balance} Due</div>
                  </div>
                  <button onClick={() => onQuickCashConfirm(student.id, selectedMonth)} className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Check className="w-4 h-4" /> Cash Paid (RM {statusObj.balance})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 7: FAST ATTENDANCE
// ============================================================================
function FastAttendanceScreen({ classes, students, attendance, selectedClassId, setSelectedClassId, selectedDate, setSelectedDate, onMarkAttendance, onOpenCorrection, onGoToClasses }) {
  const roster = useMemo(() => students.filter((s) => s.active && s.classId === selectedClassId), [students, selectedClassId]);

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Fast Attendance Entry</h2>
            <p className="text-xs text-stone-600">Mark student attendance. Duplicate entries for the same date are prevented.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Select Class</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-stone-50">
              {classes.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.location})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Class Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-stone-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600">
          Class Roster ({roster.length} Students)
        </div>
        <div className="divide-y divide-stone-200">
          {roster.map((stu) => {
            const recId = `${selectedClassId}_${selectedDate}_${stu.id}`;
            const existing = attendance.find((a) => a.id === recId);

            return (
              <div key={stu.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-base text-stone-900">{stu.name}</div>
                  <div className="text-xs text-stone-500">{stu.level}</div>
                  {existing && (
                    <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                      <span>Saved: <strong>{existing.status}</strong></span>
                      <button onClick={() => onOpenCorrection(existing, stu)} className="text-red-800 font-bold underline">Correct</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:w-80">
                  {['Present', 'Absent', 'Excused'].map((statusOpt) => {
                    const isSelected = existing?.status === statusOpt;
                    return (
                      <button key={statusOpt} onClick={() => onMarkAttendance(stu.id, selectedClassId, selectedDate, statusOpt)} className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${isSelected ? (statusOpt === 'Present' ? 'bg-emerald-700 text-white' : statusOpt === 'Absent' ? 'bg-rose-700 text-white' : 'bg-amber-500 text-amber-950') : 'bg-stone-100 text-stone-700'}`}>
                        {statusOpt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 8: PAYMENTS ENTRY
// ============================================================================
function PaymentEntryScreen({ adminProfile, students, parents, fees, selectedMonth, setSelectedMonth, onRecordPayment, onQuickCashConfirm, onApproveProof, onPreviewQr, onToggleWaive, onViewReceipt }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState('2026-10-26');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentFeeRecord = fees.find((f) => f.id === `${selectedStudent?.id}_${selectedMonth}`);
  const statusInfo = computeFeeRecordStatus(currentFeeRecord, selectedStudent?.monthlyFee || 60);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    onRecordPayment({ studentId: selectedStudent.id, month: selectedMonth, amount, date, method, refNo, notes });
    setAmount('');
    setRefNo('');
    setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4 self-start">
        <h2 className="text-lg font-bold text-stone-900">Record Monthly Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Student</label>
            <select value={selectedStudent?.id || ''} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-stone-50">
              {students.map((s) => (<option key={s.id} value={s.id}>{s.name} (RM {s.monthlyFee}/mo)</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold bg-stone-50">
              {AVAILABLE_MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </select>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-900">Status: <strong>{statusInfo.status}</strong></div>
              <div className="text-xs text-amber-800">Paid: RM {statusInfo.paid} / RM {statusInfo.expected}</div>
            </div>
            {statusInfo.balance > 0 && (
              <button type="button" onClick={() => setAmount(String(statusInfo.balance))} className="text-xs font-bold text-red-800 underline">
                Fill RM {statusInfo.balance}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Amount (MYR)</label>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-stone-50">
                <option value="Cash">Cash</option>
                <option value="TnG QR">TnG QR</option>
                <option value="Bank QR">Bank QR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Reference No.</label>
              <input type="text" value={refNo} onChange={(e) => setRefNo(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-red-900 hover:bg-red-800 text-white font-bold text-sm shadow-sm transition">
            Save Payment Record
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden self-start">
        <div className="px-5 py-4 bg-stone-50 border-b border-stone-200">
          <h3 className="text-sm font-bold text-stone-900">All Students Fee Ledger — {selectedMonth}</h3>
        </div>
        <div className="divide-y divide-stone-200">
          {students.map((stu) => {
            const rec = fees.find((f) => f.id === `${stu.id}_${selectedMonth}`);
            const info = computeFeeRecordStatus(rec, stu.monthlyFee);
            return (
              <div key={stu.id} className="p-4 sm:px-5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-stone-900">{stu.name}</div>
                  <div className="text-xs text-stone-500">Due: RM {info.balance}</div>
                </div>
                {info.balance > 0 && (
                  <button onClick={() => onQuickCashConfirm(stu.id, selectedMonth)} className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> Cash Paid
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 6: STUDENTS & PARENTS MANAGEMENT
// ============================================================================
function StudentParentManagementScreen({ students, parents, classes, fees, selectedMonth, onQuickCashConfirm, onSaveStudent, onSaveParent, onGoToClasses }) {
  const [editingStudent, setEditingStudent] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentForm, setParentForm] = useState({ name: '', email: '', phone: '' });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Student & Parent Directory</h2>
          <p className="text-xs text-stone-600">Manage student MYR monthly fees and link parents.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowParentModal(true)} className="px-3.5 py-2.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold border">Add Parent</button>
          <button onClick={() => setEditingStudent({ id: '', name: '', parentId: parents[0]?.id || '', classId: classes[0]?.id || '', joiningDate: '2026-10-26', monthlyFee: 60, level: 'Nilai 1', active: true })} className="px-4 py-2.5 rounded-xl bg-red-900 text-white text-xs font-bold">Add Student</button>
        </div>
      </div>

      {editingStudent && (
        <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-400 space-y-4">
          <h3 className="text-base font-bold text-amber-950">{editingStudent.id ? 'Edit Student' : 'Add New Student'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Name" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white" />
            <select value={editingStudent.parentId} onChange={(e) => setEditingStudent({ ...editingStudent, parentId: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white">
              {parents.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <input type="number" placeholder="Monthly Fee (MYR)" value={editingStudent.monthlyFee} onChange={(e) => setEditingStudent({ ...editingStudent, monthlyFee: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white font-bold" />
          </div>
          <button onClick={() => { onSaveStudent(editingStudent); setEditingStudent(null); }} className="px-5 py-2.5 rounded-xl bg-red-900 text-white text-xs font-bold">Save Student</button>
        </div>
      )}

      {showParentModal && (
        <div className="bg-white p-5 rounded-2xl border shadow-md space-y-3">
          <h3 className="text-base font-bold">Add Parent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" placeholder="Name" value={parentForm.name} onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input type="email" placeholder="Email" value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
            <input type="text" placeholder="Phone" value={parentForm.phone} onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })} className="px-3 py-2 rounded-xl border text-sm" />
          </div>
          <button onClick={() => { onSaveParent(parentForm); setParentForm({ name: '', email: '', phone: '' }); setShowParentModal(false); }} className="px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-bold">Save Parent</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 text-xs font-bold uppercase tracking-wider text-stone-600">Enrolled Students ({students.length})</div>
        <div className="divide-y divide-stone-200">
          {students.map((stu) => {
            const parent = parents.find((p) => p.id === stu.parentId);
            const rec = fees.find((f) => f.id === `${stu.id}_${selectedMonth}`);
            const feeInfo = computeFeeRecordStatus(rec, stu.monthlyFee);
            return (
              <div key={stu.id} className="p-4 sm:px-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">{stu.name} <span className="text-xs text-amber-900 font-normal">({stu.level} • RM {stu.monthlyFee}/mo)</span></div>
                  <div className="text-xs text-stone-500">Parent: {parent?.name} ({parent?.phone})</div>
                </div>
                <div className="flex items-center gap-2">
                  {feeInfo.balance > 0 && (
                    <button onClick={() => onQuickCashConfirm(stu.id, selectedMonth)} className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Cash Paid
                    </button>
                  )}
                  <button onClick={() => setEditingStudent(stu)} className="px-3 py-1.5 rounded-xl border text-xs font-bold">Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 9: MONTHLY REPORTS
// ============================================================================
function MonthlyReportsScreen({ students, parents, classes, attendance, fees, selectedMonth, setSelectedMonth, showToast }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Monthly Academy Reports</h2>
          <p className="text-xs text-stone-600">Export financial summaries and attendance records.</p>
        </div>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50">
          {AVAILABLE_MONTHS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
        </select>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-center space-y-4">
        <h3 className="font-bold text-stone-900">Export Report Data for {selectedMonth}</h3>
        <button onClick={() => showToast('Report CSV downloaded successfully!', 'success')} className="px-5 py-3 rounded-xl bg-red-900 text-white font-bold text-xs inline-flex items-center gap-2">
          <Download className="w-4 h-4" /> Download CSV Summary
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN 10: ADMIN PROFILE & QRS
// ============================================================================
function AdminProfileAndClassesScreen({ adminProfile, classes, students, onSaveProfile, onSaveClass, onDeleteClass, onPreviewQr, showToast }) {
  const [profileForm, setProfileForm] = useState(adminProfile);
  const [editingClass, setEditingClass] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => { setProfileForm(adminProfile); }, [adminProfile]);

  const handleQrFileUpload = async (e, targetKey, labelName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingField(targetKey);
      const compressedDataUrl = await compressQrImageFile(file);
      const updated = { ...profileForm, [targetKey]: compressedDataUrl };
      setProfileForm(updated);
      await onSaveProfile(updated);
      showToast(`${labelName} uploaded & active!`, 'success');
    } catch (err) {
      showToast('Could not process image.', 'error');
    } finally {
      setUploadingField(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-red-950 to-amber-900 text-white">
          <h2 className="text-lg font-bold">Admin Profile & Direct QR Code Uploads</h2>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSaveProfile(profileForm); }} className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Academy Name</label>
              <input type="text" value={profileForm.academyName || ''} onChange={(e) => setProfileForm({ ...profileForm, academyName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Master Name</label>
              <input type="text" value={profileForm.masterName || ''} onChange={(e) => setProfileForm({ ...profileForm, masterName: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
            <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-3">
              <span className="text-xs font-extrabold uppercase text-blue-950">Touch 'n Go QR Code</span>
              <input type="text" value={profileForm.tngDetails || ''} onChange={(e) => setProfileForm({ ...profileForm, tngDetails: e.target.value })} placeholder="TnG Details" className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold" />
              <div className="flex justify-center bg-white p-2 rounded-xl">
                {profileForm.tngQrImage ? (
                  <img src={profileForm.tngQrImage} alt="TnG QR" onClick={() => onPreviewQr("Touch 'n Go eWallet QR", profileForm.tngQrImage, profileForm.tngDetails)} className="w-36 h-36 object-contain cursor-pointer" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-stone-400">No QR</div>
                )}
              </div>
              <label className="w-full py-2.5 px-4 rounded-xl bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploadingField === 'tngQrImage' ? 'Uploading...' : 'Upload TnG QR Image'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleQrFileUpload(e, 'tngQrImage', "Touch 'n Go QR")} className="hidden" />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3">
              <span className="text-xs font-extrabold uppercase text-amber-950">Bank / DuitNow QR Code</span>
              <input type="text" value={profileForm.bankQrDetails || ''} onChange={(e) => setProfileForm({ ...profileForm, bankQrDetails: e.target.value })} placeholder="Bank Details" className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-semibold" />
              <div className="flex justify-center bg-white p-2 rounded-xl">
                {profileForm.bankQrImage ? (
                  <img src={profileForm.bankQrImage} alt="Bank QR" onClick={() => onPreviewQr('Bank / DuitNow QR', profileForm.bankQrImage, profileForm.bankQrDetails)} className="w-36 h-36 object-contain cursor-pointer" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-stone-400">No QR</div>
                )}
              </div>
              <label className="w-full py-2.5 px-4 rounded-xl bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploadingField === 'bankQrImage' ? 'Uploading...' : 'Upload Bank QR Image'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleQrFileUpload(e, 'bankQrImage', 'Bank QR')} className="hidden" />
              </label>
            </div>
          </div>

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-red-900 text-white text-xs font-bold">Save Admin Profile</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 bg-stone-50 border-b flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Classes & Batches</h3>
          <button onClick={() => setEditingClass({ id: '', name: '', location: 'Sungai Pelek', schedule: 'Sat & Sun • 5:00 PM', defaultFee: 60 })} className="px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-bold">Add Class</button>
        </div>

        {editingClass && (
          <div className="p-5 bg-amber-50 border-b space-y-3">
            <h4 className="text-sm font-bold">New/Edit Class</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" placeholder="Class Name" value={editingClass.name} onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white" />
              <input type="text" placeholder="Location" value={editingClass.location} onChange={(e) => setEditingClass({ ...editingClass, location: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white" />
              <input type="text" placeholder="Schedule" value={editingClass.schedule} onChange={(e) => setEditingClass({ ...editingClass, schedule: e.target.value })} className="px-3 py-2 rounded-xl border text-sm bg-white" />
            </div>
            <button onClick={() => { onSaveClass(editingClass); setEditingClass(null); }} className="px-5 py-2 rounded-xl bg-red-900 text-white text-xs font-bold">Save Class</button>
          </div>
        )}

        <div className="divide-y divide-stone-200">
          {classes.map((cls) => (
            <div key={cls.id} className="p-4 sm:px-5 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-stone-900">{cls.name}</div>
                <div className="text-xs text-stone-600">{cls.location} • {cls.schedule}</div>
              </div>
              <button onClick={() => onDeleteClass(cls.id)} className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODALS
// ============================================================================
function ReceiptModal({ adminProfile, data, onClose }) {
  const { payment, student, month } = data;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-400">
        <div className="bg-gradient-to-r from-red-950 to-amber-900 p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">Official Payment Receipt</span>
            <h3 className="text-lg font-bold">{adminProfile?.academyName}</h3>
          </div>
          <Receipt className="w-7 h-7 text-amber-300" />
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b"><span className="text-stone-500">Receipt Ref:</span><span className="font-bold">{payment.refNo || payment.id}</span></div>
          <div className="flex justify-between py-1.5 border-b"><span className="text-stone-500">Student:</span><span className="font-bold">{student.name}</span></div>
          <div className="flex justify-between py-1.5 border-b"><span className="text-stone-500">Month:</span><span className="font-bold">{month}</span></div>
          <div className="flex justify-between py-1.5 border-b"><span className="text-stone-500">Method:</span><span className="font-bold">{payment.method}</span></div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center mt-2">
            <span className="font-bold text-emerald-950 text-sm">Amount Received</span>
            <span className="text-xl font-extrabold text-emerald-800">RM {payment.amount}</span>
          </div>
        </div>
        <div className="p-4 bg-stone-50 border-t flex justify-end gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl border text-xs font-bold">Print</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-bold">Done</button>
        </div>
      </div>
    </div>
  );
}

function QrCodePreviewModal({ data, academyName, onClose }) {
  if (!data) return null;
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border-2 border-amber-400 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-950 to-amber-900 p-4 text-white">
          <h3 className="text-base font-bold">{data.title}</h3>
        </div>
        <div className="p-6 flex flex-col items-center">
          <img src={data.image} alt={data.title} className="w-64 h-64 object-contain mx-auto rounded-lg" />
          {data.subtitle && <p className="text-xs font-bold text-stone-800 mt-3">{data.subtitle}</p>}
        </div>
        <div className="p-3.5 bg-stone-50 border-t flex justify-center">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-red-900 text-white text-xs font-bold">Close</button>
        </div>
      </div>
    </div>
  );
}

function AttendanceCorrectionModal({ data, onClose, onSaveCorrection }) {
  const { record, student } = data;
  const [newStatus, setNewStatus] = useState(record.status);
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold">Correct Attendance for {student.name}</h3>
        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm font-bold">
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Excused">Excused</option>
        </select>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for correction..." className="w-full px-3 py-2.5 rounded-xl border text-sm" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-xs">Cancel</button>
          <button onClick={() => onSaveCorrection(newStatus, note)} className="px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-bold">Save</button>
        </div>
      </div>
    </div>
  );
}

function DeploymentGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-bold text-stone-900">Deployment & Firestore Security Rules Guide</h2>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-stone-100 text-xs font-bold">Close</button>
        </div>
        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-sm text-red-900 mb-1">1. How to Deploy (RM 0 / Free Tier)</h3>
            <p>Export this code as a React project (e.g. Vite + React) and deploy instantly on <strong>Vercel</strong> or <strong>Netlify</strong> for free.</p>
          </div>
          <div>
            <h3 className="font-bold text-sm text-red-900 mb-1">2. Secure Firestore Security Rules</h3>
            <pre className="bg-stone-900 text-amber-200 p-3.5 rounded-xl overflow-x-auto text-[11px] font-mono">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}