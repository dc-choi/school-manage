import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { GroupForm } from '~/components/forms/GroupForm';
import { MainLayout } from '~/components/layout';
import { useGroups } from '~/features/group';
export function GroupAddPage() {
    const navigate = useNavigate();
    const { create, isCreating } = useGroups();
    const handleSubmit = async (data) => {
        await create(data);
        navigate('/groups');
    };
    return (_jsx(MainLayout, { title: "\uADF8\uB8F9 \uCD94\uAC00", children: _jsx("div", { className: "mx-auto max-w-md", children: _jsx(GroupForm, { onSubmit: handleSubmit, onCancel: () => navigate('/groups'), isSubmitting: isCreating, submitLabel: "\uCD94\uAC00" }) }) }));
}
