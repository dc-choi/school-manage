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
    gender?: 'M' | 'F';
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
        gender: initialData?.gender,
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
                <CardTitle>{submitLabel === '추가' ? '새 멤버' : '멤버 수정'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.submit && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-base text-destructive">
                            {errors.submit}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="societyName" className="text-lg">
                            이름 (세례명)
                        </Label>
                        <Input
                            id="societyName"
                            className="h-12 text-lg"
                            value={formData.societyName}
                            onChange={(e) => handleChange('societyName', e.target.value)}
                            placeholder="이름을 입력하세요"
                            disabled={isSubmitting}
                        />
                        {errors.societyName && <p className="text-base text-destructive">{errors.societyName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="catholicName" className="text-lg">
                            세례명 (선택)
                        </Label>
                        <Input
                            id="catholicName"
                            className="h-12 text-lg"
                            value={formData.catholicName ?? ''}
                            onChange={(e) => handleChange('catholicName', e.target.value)}
                            placeholder="세례명을 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="groupId" className="text-lg">
                            그룹
                        </Label>
                        <Select
                            value={formData.groupId}
                            onValueChange={(value) => handleChange('groupId', value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="groupId" className="h-12 text-lg">
                                <SelectValue placeholder="그룹을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id} className="text-lg">
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.groupId && <p className="text-base text-destructive">{errors.groupId}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender" className="text-lg">
                            성별 (선택)
                        </Label>
                        <Select
                            value={formData.gender ?? ''}
                            onValueChange={(value) => handleChange('gender', value as 'M' | 'F' | undefined)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="gender" className="h-12 text-lg">
                                <SelectValue placeholder="성별을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="M" className="text-lg">
                                    남
                                </SelectItem>
                                <SelectItem value="F" className="text-lg">
                                    여
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age" className="text-lg">
                            나이 (선택)
                        </Label>
                        <Input
                            id="age"
                            type="number"
                            className="h-12 text-lg"
                            value={formData.age ?? ''}
                            onChange={(e) =>
                                handleChange('age', e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                            placeholder="나이를 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact" className="text-lg">
                            연락처 (선택)
                        </Label>
                        <Input
                            id="contact"
                            type="number"
                            className="h-12 text-lg"
                            value={formData.contact ?? ''}
                            onChange={(e) =>
                                handleChange('contact', e.target.value ? parseInt(e.target.value, 10) : undefined)
                            }
                            placeholder="연락처를 입력하세요 (숫자만)"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baptizedAt" className="text-lg">
                            세례일 (선택)
                        </Label>
                        <Input
                            id="baptizedAt"
                            className="h-12 text-lg"
                            value={formData.baptizedAt ?? ''}
                            onChange={(e) => handleChange('baptizedAt', e.target.value)}
                            placeholder="YYYY-MM-DD"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-lg">
                            비고 (선택)
                        </Label>
                        <Input
                            id="description"
                            className="h-12 text-lg"
                            value={formData.description ?? ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="비고를 입력하세요"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
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
