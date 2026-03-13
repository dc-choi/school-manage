import { GroupForm } from './GroupForm';
import type { GroupType } from '@school/shared';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { useGroups } from '~/features/group';

export function GroupAddPage() {
    const navigate = useNavigate();
    const { create, isCreating } = useGroups();

    const handleSubmit = async (data: { name: string; type: GroupType }) => {
        await create(data);
        navigate('/groups');
    };

    return (
        <MainLayout title="학년&부서 추가">
            <div className="mx-auto max-w-md">
                <GroupForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/groups')}
                    isSubmitting={isCreating}
                    submitLabel="추가"
                />
            </div>
        </MainLayout>
    );
}
