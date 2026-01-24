import type { GroupOutput } from '@school/trpc';
import { type FormEvent, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

interface StudentFormData {
    societyName: string;
    catholicName?: string;
    age?: number;
    contact?: number;
    description?: string;
    groupId: string;
    baptizedAt?: string;
}

interface StudentFormProps {
    initialData?: StudentFormData;
    groups: GroupOutput[];
    onSubmit: (data: StudentFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel: string;
}

export function StudentForm({ initialData, groups, onSubmit, onCancel, isSubmitting, submitLabel }: StudentFormProps) {
    const [formData, setFormData] = useState<StudentFormData>({
        societyName: initialData?.societyName ?? '',
        catholicName: initialData?.catholicName ?? '',
        age: initialData?.age,
        contact: initialData?.contact,
        description: initialData?.description ?? '',
        groupId: initialData?.groupId ?? '',
        baptizedAt: initialData?.baptizedAt ?? '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof StudentFormData, value: string | number | undefined) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.societyName.trim()) {
            newErrors.societyName = '이름을 입력해주세요.';
        }
        if (!formData.groupId) {
            newErrors.groupId = '그룹을 선택해주세요.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await onSubmit({
                ...formData,
                societyName: formData.societyName.trim(),
                catholicName: formData.catholicName?.trim() || undefined,
                description: formData.description?.trim() || undefined,
                baptizedAt: formData.baptizedAt?.trim() || undefined,
            });
        } catch (err) {
            setErrors({ submit: err instanceof Error ? err.message : '오류가 발생했습니다.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{submitLabel === '추가' ? '새 학생' : '학생 수정'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.submit && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {errors.submit}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="societyName">이름 (세례명)</Label>
                        <Input
                            id="societyName"
                            value={formData.societyName}
                            onChange={(e) => handleChange('societyName', e.target.value)}
                            placeholder="이름을 입력하세요"
                            disabled={isSubmitting}
                        />
                        {errors.societyName && <p className="text-sm text-destructive">{errors.societyName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="catholicName">세례명 (선택)</Label>
                        <Input
                            id="catholicName"
                            value={formData.catholicName ?? ''}
                            onChange={(e) => handleChange('catholicName', e.target.value)}
                            placeholder="세례명을 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="groupId">그룹</Label>
                        <Select
                            value={formData.groupId}
                            onValueChange={(value) => handleChange('groupId', value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="groupId">
                                <SelectValue placeholder="그룹을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.groupId && <p className="text-sm text-destructive">{errors.groupId}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age">나이 (선택)</Label>
                        <Input
                            id="age"
                            type="number"
                            value={formData.age ?? ''}
                            onChange={(e) =>
                                handleChange('age', e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                            placeholder="나이를 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact">연락처 (선택)</Label>
                        <Input
                            id="contact"
                            type="number"
                            value={formData.contact ?? ''}
                            onChange={(e) =>
                                handleChange('contact', e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                            placeholder="연락처를 입력하세요 (숫자만)"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baptizedAt">세례일 (선택)</Label>
                        <Input
                            id="baptizedAt"
                            value={formData.baptizedAt ?? ''}
                            onChange={(e) => handleChange('baptizedAt', e.target.value)}
                            placeholder="YYYY-MM-DD"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">비고 (선택)</Label>
                        <Input
                            id="description"
                            value={formData.description ?? ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="비고를 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            취소
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? '저장 중...' : submitLabel}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
