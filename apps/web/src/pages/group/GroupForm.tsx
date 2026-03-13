import { GROUP_TYPE, type GroupType } from '@school/shared';
import { type FormEvent, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { extractErrorMessage } from '~/lib/error';

interface GroupFormProps {
    initialData?: {
        name: string;
        type?: GroupType;
    };
    onSubmit: (data: { name: string; type: GroupType }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel: string;
}

export function GroupForm({ initialData, onSubmit, onCancel, isSubmitting, submitLabel }: GroupFormProps) {
    const [name, setName] = useState(initialData?.name ?? '');
    const [type, setType] = useState<GroupType>(initialData?.type ?? GROUP_TYPE.GRADE);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('이름을 입력해주세요.');
            return;
        }

        try {
            await onSubmit({ name: name.trim(), type });
        } catch (err) {
            setError(extractErrorMessage(err));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{submitLabel === '추가' ? '새 학년&부서' : '학년&부서 수정'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-base text-destructive">
                            {error}
                        </div>
                    )}

                    <fieldset className="space-y-2">
                        <legend className="text-lg font-medium">유형</legend>
                        <div className="flex gap-4">
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted/50">
                                <input
                                    type="radio"
                                    name="groupType"
                                    value={GROUP_TYPE.GRADE}
                                    checked={type === GROUP_TYPE.GRADE}
                                    onChange={() => setType(GROUP_TYPE.GRADE)}
                                    disabled={isSubmitting}
                                    className="accent-primary"
                                />
                                <span className="text-lg">학년</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted/50">
                                <input
                                    type="radio"
                                    name="groupType"
                                    value={GROUP_TYPE.DEPARTMENT}
                                    checked={type === GROUP_TYPE.DEPARTMENT}
                                    onChange={() => setType(GROUP_TYPE.DEPARTMENT)}
                                    disabled={isSubmitting}
                                    className="accent-primary"
                                />
                                <span className="text-lg">부서</span>
                            </label>
                        </div>
                    </fieldset>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">
                            이름
                        </Label>
                        <Input
                            id="name"
                            className="h-12 text-lg"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요…"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-w-24"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            취소
                        </Button>
                        <Button type="submit" className="min-w-24" disabled={isSubmitting}>
                            {isSubmitting ? '저장 중...' : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
