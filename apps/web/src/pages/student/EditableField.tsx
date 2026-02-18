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
        <div className="flex items-center border-b py-4 last:border-b-0">
            <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">{label}</dt>
            <dd className="flex-1 text-xl">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {inputElement}
                            <Button onClick={save} className="min-w-24">
                                저장
                            </Button>
                            <Button variant="outline" onClick={cancel} className="min-w-24">
                                취소
                            </Button>
                        </div>
                        {hint && <p className="text-base text-muted-foreground">{hint}</p>}
                    </div>
                ) : (
                    <span
                        className={`rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`}
                        onClick={() => !disabled && startEdit()}
                        title={disabled ? undefined : '클릭하여 수정'}
                    >
                        {displayValue ?? (value || '-')}
                    </span>
                )}
            </dd>
        </div>
    );
}
