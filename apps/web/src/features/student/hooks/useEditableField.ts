import { useEffect, useState } from 'react';

export const useEditableField = (value: string, onSave: (value: string) => void) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const startEdit = () => setIsEditing(true);

    const save = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const cancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') cancel();
    };

    return { isEditing, editValue, setEditValue, startEdit, save, cancel, handleKeyDown };
};
