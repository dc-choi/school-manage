import { StudentForm } from './StudentForm';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { useGroups } from '~/features/group';
import { useStudents } from '~/features/student';

export function StudentAddPage() {
    const navigate = useNavigate();
    const { groups, isLoading: groupsLoading } = useGroups();
    const { create, isCreating } = useStudents();

    const handleSubmit = async (data: Parameters<typeof create>[0]) => {
        await create(data);
        navigate('/students');
    };

    if (groupsLoading) {
        return (
            <MainLayout title="멤버 추가">
                <LoadingSpinner />
            </MainLayout>
        );
    }

    return (
        <MainLayout title="멤버 추가">
            <div className="mx-auto max-w-md">
                <StudentForm
                    groups={groups}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/students')}
                    isSubmitting={isCreating}
                    submitLabel="추가"
                />
            </div>
        </MainLayout>
    );
}
