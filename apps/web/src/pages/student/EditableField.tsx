import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useEditableField } from '~/features/student';

interface RenderInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

interface EditableFieldProps {
    label: string;
    value: string;
    displayValue?: string;
    onSave: (value: string) => void;
    disabled?: boolean;
    type?: 'text' | 'number';
    placeholder?: string;
    hint?: string;
    renderInput?: (props: RenderInputProps) => React.ReactNode;
}

export function EditableField({
    label,
    value,
    displayValue,
    onSave,
    disabled,
    type = 'text',
    placeholder,
    hint,
    renderInput,
}: Readonly<EditableFieldProps>) {
    const { isEditing, editValue, setEditValue, startEdit, save, cancel, handleKeyDown } = useEditableField(
        value,
        onSave
    );

    const inputElement = renderInput ? (
        renderInput({ value: editValue, onChange: setEditValue, onKeyDown: handleKeyDown })
    ) : (
        <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            type={type}
            placeholder={placeholder}
            autoFocus
        />
    );

    return (
        <div className="flex flex-col border-b py-4 last:border-b-0 sm:flex-row sm:items-center">
            <dt className="mb-1 shrink-0 text-base font-medium text-muted-foreground sm:mb-0 sm:w-32 sm:text-xl">
                {label}
            </dt>
            <dd className="flex-1 text-base sm:text-xl">
                {isEditing && (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="flex-1">{inputElement}</div>
                            <div className="flex gap-2">
                                <Button onClick={save} className="flex-1 sm:min-w-24 sm:flex-none">
                                    저장
                                </Button>
                                <Button variant="outline" onClick={cancel} className="flex-1 sm:min-w-24 sm:flex-none">
                                    취소
                                </Button>
                            </div>
                        </div>
                        {hint && <p className="text-sm text-muted-foreground sm:text-base">{hint}</p>}
                    </div>
                )}
                {!isEditing && disabled && <span className="rounded px-2 py-1">{displayValue ?? (value || '-')}</span>}
                {!isEditing && !disabled && (
                    <button
                        type="button"
                        className="cursor-pointer rounded px-2 py-1 hover:bg-muted/50"
                        onClick={startEdit}
                        title="클릭하여 수정"
                    >
                        {displayValue ?? (value || '-')}
                    </button>
                )}
            </dd>
        </div>
    );
}
