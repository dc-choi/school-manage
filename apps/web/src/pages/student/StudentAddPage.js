import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '~/components/common';
import { StudentForm } from '~/components/forms/StudentForm';
import { MainLayout } from '~/components/layout';
import { useGroups } from '~/features/group';
import { useStudents } from '~/features/student';
export function StudentAddPage() {
    const navigate = useNavigate();
    const { groups, isLoading: groupsLoading } = useGroups();
    const { create, isCreating } = useStudents();
    const handleSubmit = async (data) => {
        await create(data);
        navigate('/students');
    };
    if (groupsLoading) {
        return (_jsx(MainLayout, { title: "\uD559\uC0DD \uCD94\uAC00", children: _jsx(LoadingSpinner, {}) }));
    }
    return (_jsx(MainLayout, { title: "\uD559\uC0DD \uCD94\uAC00", children: _jsx("div", { className: "mx-auto max-w-md", children: _jsx(StudentForm, { groups: groups, onSubmit: handleSubmit, onCancel: () => navigate('/students'), isSubmitting: isCreating, submitLabel: "\uCD94\uAC00" }) }) }));
}
