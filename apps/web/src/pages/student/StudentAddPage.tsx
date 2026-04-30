import { StudentForm } from './StudentForm';
import type { CreateStudentInput, ExistingStudentBrief } from '@school/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { useGroups } from '~/features/group';
import { useStudents } from '~/features/student';
import { StudentDuplicateDialog } from '~/features/student/components/StudentDuplicateDialog';
import { analytics } from '~/lib/analytics';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

type StudentFormPayload = Omit<CreateStudentInput, 'force'>;

export function StudentAddPage() {
    const navigate = useNavigate();
    const { groups, isLoading: groupsLoading } = useGroups();
    const { create, isCreating } = useStudents();
    const utils = trpc.useUtils();

    const [duplicate, setDuplicate] = useState<ExistingStudentBrief | null>(null);
    const [pending, setPending] = useState<StudentFormPayload | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const finalize = async (payload: CreateStudentInput) => {
        await create(payload);
        navigate('/students');
    };

    const handleSubmit = async (data: StudentFormPayload) => {
        const payload = { ...data, groupIds: data.groupIds };

        // 사전 중복 검사 (force 분기는 다이얼로그로 처리)
        const { conflicts } = await utils.student.checkDuplicate.fetch({
            students: [{ societyName: data.societyName, catholicName: data.catholicName }],
        });
        const dbConflict = conflicts.find((c) => c.reason === 'DB_DUP' && c.existing);
        if (dbConflict?.existing) {
            setDuplicate(dbConflict.existing);
            setPending(payload);
            setDialogOpen(true);
            analytics.trackStudentDuplicateWarningShown({ mode: 'single', internalCount: 0, dbCount: 1 });
            return;
        }

        await finalize(payload);
    };

    const handleForce = async () => {
        if (!pending) return;
        analytics.trackStudentDuplicateForced({ mode: 'single', count: 1 });
        try {
            await finalize({ ...pending, force: true });
            setDialogOpen(false);
            setPending(null);
            setDuplicate(null);
        } catch (err) {
            toast.error(extractErrorMessage(err));
            // 다이얼로그는 닫지 않음 — 사용자가 다시 시도할 수 있도록 유지
        }
    };

    const handleCancel = () => {
        setDialogOpen(false);
        setPending(null);
        setDuplicate(null);
        analytics.trackStudentDuplicateCancelled({ mode: 'single', count: 1 });
    };

    if (groupsLoading) {
        return (
            <MainLayout title="학생 추가">
                <LoadingSpinner />
            </MainLayout>
        );
    }

    return (
        <MainLayout title="학생 추가">
            <div className="mx-auto max-w-md">
                <StudentForm
                    groups={groups}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/students')}
                    isSubmitting={isCreating}
                    submitLabel="추가"
                />
            </div>
            <StudentDuplicateDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) handleCancel();
                }}
                existing={duplicate}
                onForce={handleForce}
                onCancel={handleCancel}
                loading={isCreating}
            />
        </MainLayout>
    );
}
