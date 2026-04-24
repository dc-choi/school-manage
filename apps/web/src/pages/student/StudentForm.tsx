import { GROUP_TYPE, type GroupOutput } from '@school/shared';
import { formatContact } from '@school/utils';
import { type FormEvent, useMemo, useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
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
    parentContact?: string;
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
    const gradeGroups = useMemo(() => groups.filter((g) => g.type === GROUP_TYPE.GRADE), [groups]);
    const deptGroups = useMemo(() => groups.filter((g) => g.type === GROUP_TYPE.DEPARTMENT), [groups]);

    const [formData, setFormData] = useState<StudentFormData>({
        societyName: initialData?.societyName ?? '',
        catholicName: initialData?.catholicName ?? '',
        gender: initialData?.gender,
        age: initialData?.age,
        contact: initialData?.contact,
        parentContact: initialData?.parentContact ?? '',
        description: initialData?.description ?? '',
        groupIds: initialData?.groupIds ?? [],
        baptizedAt: toFeastDayFormat(initialData?.baptizedAt),
    });
    const [contactInput, setContactInput] = useState(() =>
        initialData?.contact ? formatContact(initialData.contact) : ''
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [tempGroupIds, setTempGroupIds] = useState<string[]>([]);

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
                parentContact: formData.parentContact?.trim() || undefined,
                description: formData.description?.trim() || undefined,
                baptizedAt: formData.baptizedAt?.trim() || undefined,
            });
        } catch (err) {
            setErrors({ submit: extractErrorMessage(err) });
        }
    };

    const openGroupModal = () => {
        setTempGroupIds([...formData.groupIds]);
        setShowGroupModal(true);
    };

    const confirmGroupSelection = () => {
        setFormData((prev) => ({ ...prev, groupIds: tempGroupIds }));
        setShowGroupModal(false);
    };

    const selectedGroups = groups.filter((g) => formData.groupIds.includes(g.id));

    return (
        <>
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

                        <div className="space-y-2">
                            <Label className="text-lg">학년&부서 (선택)</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedGroups.length > 0 ? (
                                    selectedGroups.map((g) => (
                                        <Badge
                                            key={g.id}
                                            variant={g.type === GROUP_TYPE.GRADE ? 'default' : 'secondary'}
                                        >
                                            {g.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">선택된 학년&부서가 없습니다</span>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={openGroupModal}
                                disabled={isSubmitting}
                            >
                                학년&부서 선택
                            </Button>
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
                                    handleChange(
                                        'age',
                                        e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                                    )
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
                            <Label htmlFor="parentContact" className="text-lg">
                                부모님 연락처 (선택)
                            </Label>
                            <Input
                                id="parentContact"
                                type="text"
                                inputMode="tel"
                                maxLength={20}
                                className="h-12 text-lg"
                                value={formData.parentContact ?? ''}
                                onChange={(e) => handleChange('parentContact', e.target.value)}
                                placeholder="010-1234-5678"
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

            <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>학년&부서 선택</DialogTitle>
                        <DialogDescription>학년은 1개만, 부서는 여러 개 선택할 수 있습니다.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <fieldset className="space-y-2">
                            <legend className="text-base font-medium">학년 (0~1개)</legend>
                            <div className="space-y-1">
                                <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
                                    <input
                                        type="radio"
                                        name="modalGradeGroup"
                                        checked={!tempGroupIds.some((id) => gradeGroups.some((g) => g.id === id))}
                                        onChange={() => {
                                            setTempGroupIds((prev) =>
                                                prev.filter((id) => !gradeGroups.some((g) => g.id === id))
                                            );
                                        }}
                                        className="accent-primary"
                                    />
                                    <span className="text-muted-foreground">선택 안 함</span>
                                </label>
                                {gradeGroups.map((g) => (
                                    <label
                                        key={g.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                                    >
                                        <input
                                            type="radio"
                                            name="modalGradeGroup"
                                            checked={tempGroupIds.includes(g.id)}
                                            onChange={() => {
                                                setTempGroupIds((prev) => [
                                                    ...prev.filter((id) => !gradeGroups.some((gg) => gg.id === id)),
                                                    g.id,
                                                ]);
                                            }}
                                            className="accent-primary"
                                        />
                                        <span>{g.name}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-base font-medium">부서 (0~N개)</legend>
                            <div className="space-y-1">
                                {deptGroups.length === 0 ? (
                                    <p className="py-2 text-muted-foreground">등록된 부서가 없습니다</p>
                                ) : (
                                    deptGroups.map((g) => (
                                        <label
                                            key={g.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                id={`modal-dept-${g.id}`}
                                                checked={tempGroupIds.includes(g.id)}
                                                onCheckedChange={(checked) => {
                                                    setTempGroupIds((prev) =>
                                                        checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)
                                                    );
                                                }}
                                            />
                                            <span>{g.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </fieldset>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowGroupModal(false)}>
                            취소
                        </Button>
                        <Button onClick={confirmGroupSelection}>확인</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
