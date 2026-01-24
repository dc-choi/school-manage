import type { GroupOutput } from '@school/trpc';
interface StudentFormData {
    societyName: string;
    catholicName?: string;
    gender?: 'M' | 'F';
    age?: number;
    contact?: number;
    description?: string;
    groupId: string;
    baptizedAt?: string;
}
interface StudentFormProps {
    initialData?: StudentFormData;
    groups: GroupOutput[];
    onSubmit: (data: StudentFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel: string;
}
export declare function StudentForm({ initialData, groups, onSubmit, onCancel, isSubmitting, submitLabel }: StudentFormProps): import("react/jsx-runtime").JSX.Element;
export {};
