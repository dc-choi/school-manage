import type { GroupOutput } from '@school/shared';
import { formatContact } from '@school/utils';
import { type FormEvent, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { extractErrorMessage } from '~/lib/error';

interface StudentFormData {
    societyName: string;
    catholicName?: string;
    gender?: 'M' | 'F';
    age?: number;
    contact?: string;
    description?: string;
    groupIds: string[];
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

// 기존 YYYY-MM-DD 데이터를 MM/DD로 변환
const toFeastDayFormat = (value?: string): string => {
    if (!value) return '';
    const match = value.match(/^\d{4}-(\d{2})-(\d{2})$/);
    if (match) return `${match[1]}/${match[2]}`;
    return value;
};

export function StudentForm({ initialData, groups, onSubmit, onCancel, isSubmitting, submitLabel }: StudentFormProps) {
    const [formData, setFormData] = useState<StudentFormData>({
        societyName: initialData?.societyName ?? '',
        catholicName: initialData?.catholicName ?? '',
        gender: initialData?.gender,
        age: initialData?.age,
        contact: initialData?.contact,
        description: initialData?.description ?? '',
        groupIds: initialData?.groupIds ?? [],
        baptizedAt: toFeastDayFormat(initialData?.baptizedAt),
    });
    const [contactInput, setContactInput] = useState(() =>
        initialData?.contact ? formatContact(initialData.contact) : ''
    );
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
        if (formData.groupIds.length === 0) {
            newErrors.groupIds = '학년을 선택해주세요.';
        }
        const baptizedAtValue = formData.baptizedAt?.trim();
        if (baptizedAtValue && !/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(baptizedAtValue)) {
            newErrors.baptizedAt = 'MM/DD 형식으로 입력해주세요. (예: 03/19)';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const digits = contactInput.replace(/\D/g, '');
            await onSubmit({
                ...formData,
                societyName: formData.societyName.trim(),
                catholicName: formData.catholicName?.trim() || undefined,
                contact: digits || undefined,
                description: formData.description?.trim() || undefined,
                baptizedAt: formData.baptizedAt?.trim() || undefined,
            });
        } catch (err) {
            setErrors({ submit: extractErrorMessage(err) });
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
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-base text-destructive">
                            {errors.submit}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="societyName" className="text-lg">
                            이름
                        </Label>
                        <Input
                            id="societyName"
                            className="h-12 text-lg"
                            value={formData.societyName}
                            onChange={(e) => handleChange('societyName', e.target.value)}
                            placeholder="이름을 입력하세요…"
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
                            placeholder="세례명을 입력하세요…"
                            disabled={isSubmitting}
                        />
                    </div>

                    <fieldset className="space-y-2">
                        <legend className="text-lg font-medium">학년</legend>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <label
                                    key={g.id}
                                    className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                                >
                                    <Checkbox
                                        id={`group-${g.id}`}
                                        checked={formData.groupIds.includes(g.id)}
                                        onCheckedChange={(checked) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                groupIds: checked
                                                    ? [...prev.groupIds, g.id]
                                                    : prev.groupIds.filter((id) => id !== g.id),
                                            }));
                                            setErrors((prev) => ({ ...prev, groupIds: '' }));
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-lg">{g.name}</span>
                                </label>
                            ))}
                        </div>
                        {errors.groupIds && <p className="text-base text-destructive">{errors.groupIds}</p>}
                    </fieldset>

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
                                <SelectValue placeholder="성별을 선택하세요…" />
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
                                handleChange('age', e.target.value ? Number.parseInt(e.target.value, 10) : undefined)
                            }
                            placeholder="나이를 입력하세요…"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact" className="text-lg">
                            연락처 (선택)
                        </Label>
                        <Input
                            id="contact"
                            type="text"
                            inputMode="tel"
                            className="h-12 text-lg"
                            value={contactInput}
                            onChange={(e) => {
                                setContactInput(e.target.value);
                                setErrors((prev) => ({ ...prev, contact: '' }));
                            }}
                            placeholder="010-1234-1234"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baptizedAt" className="text-lg">
                            축일 (선택)
                        </Label>
                        <Input
                            id="baptizedAt"
                            className="h-12 text-lg"
                            value={formData.baptizedAt ?? ''}
                            onChange={(e) => handleChange('baptizedAt', e.target.value)}
                            placeholder="MM/DD"
                            maxLength={5}
                            inputMode="numeric"
                            disabled={isSubmitting}
                        />
                        {errors.baptizedAt && <p className="text-base text-destructive">{errors.baptizedAt}</p>}
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
                            placeholder="비고를 입력하세요…"
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
