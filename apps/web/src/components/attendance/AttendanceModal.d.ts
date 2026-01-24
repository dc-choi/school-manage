import type { AttendanceData, StudentAttendanceDetail } from '@school/trpc';
interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    holyday: string | null;
    students: StudentAttendanceDetail[];
    isLoading?: boolean;
    onSave: (data: AttendanceData[], isFull: boolean) => Promise<void>;
    year: number;
}
export declare function AttendanceModal({ isOpen, onClose, date, holyday, students, isLoading, onSave, year, }: AttendanceModalProps): import("react/jsx-runtime").JSX.Element;
export {};
