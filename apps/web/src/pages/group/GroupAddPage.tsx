import { GroupForm } from './GroupForm';
import { type GroupType, getOrganizationLabels } from '@school/shared';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { useAuth } from '~/features/auth';
import { useGroups } from '~/features/group';

export function GroupAddPage() {
    const navigate = useNavigate();
    const { create, isCreating } = useGroups();
    const { organizationType } = useAuth();
    const labels = useMemo(() => getOrganizationLabels(organizationType), [organizationType]);

    const handleSubmit = async (data: { name: string; type: GroupType }) => {
        await create(data);
        navigate('/groups');
    };

    return (
        <MainLayout title={`${labels.groupAndDepartment} 추가`}>
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
