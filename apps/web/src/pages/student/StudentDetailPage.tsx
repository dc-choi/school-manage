import { formatDateKR } from '@school/utils';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useGroups } from '~/features/group';
import { useStudent, useStudents } from '~/features/student/hooks/useStudents';

interface EditableFieldProps {
    label: string;
    value: string;
    onSave: (value: string) => void;
    type?: 'text' | 'number';
    disabled?: boolean;
    placeholder?: string;
}

function EditableField({ label, value, onSave, type = 'text', disabled, placeholder }: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <div className="flex items-center border-b py-4 last:border-b-0">
            <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">{label}</dt>
            <dd className="flex-1 text-xl">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            type={type}
                            placeholder={placeholder}
                            autoFocus
                        />
                        <Button onClick={handleSave} className="min-w-24">
                            저장
                        </Button>
                        <Button variant="outline" onClick={handleCancel} className="min-w-24">
                            취소
                        </Button>
                    </div>
                ) : (
                    <span
                        className={`rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`}
                        onClick={() => !disabled && setIsEditing(true)}
                        title={disabled ? undefined : '클릭하여 수정'}
                    >
                        {value || '-'}
                    </span>
                )}
            </dd>
        </div>
    );
}

interface ContactFieldProps {
    label: string;
    value: number | undefined;
    onSave: (value: string) => void;
    disabled?: boolean;
}

function ContactField({ label, value, onSave, disabled }: ContactFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    // 숫자로 저장된 값을 11자리 문자열로 변환 (앞에 0 붙이기)
    const displayValue = value ? String(value).padStart(11, '0') : '';
    const formattedValue = displayValue
        ? `${displayValue.slice(0, 3)}-${displayValue.slice(3, 7)}-${displayValue.slice(7)}`
        : '-';

    useEffect(() => {
        setEditValue(displayValue);
    }, [displayValue]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(displayValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    return (
        <div className="flex items-center border-b py-4 last:border-b-0">
            <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">{label}</dt>
            <dd className="flex-1 text-xl">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                                onKeyDown={handleKeyDown}
                                placeholder="01012345678"
                                autoFocus
                            />
                            <Button onClick={handleSave} className="min-w-24">
                                저장
                            </Button>
                            <Button variant="outline" onClick={handleCancel} className="min-w-24">
                                취소
                            </Button>
                        </div>
                        <p className="text-base text-muted-foreground">- 없이 숫자만 입력하세요</p>
                    </div>
                ) : (
                    <span
                        className={`rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`}
                        onClick={() => !disabled && setIsEditing(true)}
                        title={disabled ? undefined : '클릭하여 수정'}
                    >
                        {formattedValue}
                    </span>
                )}
            </dd>
        </div>
    );
}

interface GroupSelectFieldProps {
    label: string;
    value: string;
    groupName: string;
    groups: { id: string; name: string }[];
    onSave: (groupId: string) => void;
    disabled?: boolean;
}

interface GenderSelectFieldProps {
    label: string;
    value: string | undefined;
    onSave: (gender: string) => void;
    disabled?: boolean;
}

function GenderSelectField({ label, value, onSave, disabled }: GenderSelectFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value ?? '');

    useEffect(() => {
        setEditValue(value ?? '');
    }, [value]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value ?? '');
        setIsEditing(false);
    };

    const displayValue = value === 'M' ? '남' : value === 'F' ? '여' : '-';

    return (
        <div className="flex items-center border-b py-4 last:border-b-0">
            <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">{label}</dt>
            <dd className="flex-1 text-xl">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="성별 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="M">남</SelectItem>
                                <SelectItem value="F">여</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} className="min-w-24">
                            저장
                        </Button>
                        <Button variant="outline" onClick={handleCancel} className="min-w-24">
                            취소
                        </Button>
                    </div>
                ) : (
                    <span
                        className={`rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`}
                        onClick={() => !disabled && setIsEditing(true)}
                        title={disabled ? undefined : '클릭하여 수정'}
                    >
                        {displayValue}
                    </span>
                )}
            </dd>
        </div>
    );
}

function GroupSelectField({ label, value, groupName, groups, onSave, disabled }: GroupSelectFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    return (
        <div className="flex items-center border-b py-4 last:border-b-0">
            <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">{label}</dt>
            <dd className="flex-1 text-xl">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} className="min-w-24">
                            저장
                        </Button>
                        <Button variant="outline" onClick={handleCancel} className="min-w-24">
                            취소
                        </Button>
                    </div>
                ) : (
                    <span
                        className={`rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`}
                        onClick={() => !disabled && setIsEditing(true)}
                        title={disabled ? undefined : '클릭하여 수정'}
                    >
                        {groupName || '-'}
                    </span>
                )}
            </dd>
        </div>
    );
}

export function StudentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: student, isLoading, error } = useStudent(id ?? '');
    const { update, isUpdating } = useStudents();
    const { groups } = useGroups();

    const isDeleted = !!student?.deletedAt;

    const handleUpdate = async (field: string, value: string) => {
        if (!id || !student) return;
        try {
            await update({
                id,
                societyName: field === 'societyName' ? value : student.societyName,
                catholicName: field === 'catholicName' ? value || undefined : student.catholicName,
                gender:
                    field === 'gender' ? (value as 'M' | 'F' | undefined) : (student.gender as 'M' | 'F' | undefined),
                age: field === 'age' ? (value ? parseInt(value) : undefined) : student.age,
                contact: field === 'contact' ? (value ? parseInt(value) : undefined) : student.contact,
                groupId: field === 'groupId' ? value : student.groupId,
                baptizedAt: field === 'baptizedAt' ? value || undefined : student.baptizedAt,
                description: field === 'description' ? value || undefined : student.description,
            });
        } catch (e) {
            console.error('Failed to update student:', e);
        }
    };

    // 그룹 이름 찾기
    const groupName = groups.find((g) => g.id === student?.groupId)?.name ?? student?.groupId ?? '';

    if (error) {
        return (
            <MainLayout title="멤버 상세">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-xl text-destructive">멤버 정보를 불러오는데 실패했습니다.</p>
                        <div className="mt-4 flex justify-center">
                            <Button size="lg" onClick={() => navigate(-1)}>
                                목록으로
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="멤버 상세">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <CardTitle className="text-2xl">
                                        {isLoading ? '로딩 중...' : student?.societyName}
                                        {student?.catholicName && (
                                            <span className="ml-2 text-lg font-normal text-muted-foreground">
                                                ({student.catholicName})
                                            </span>
                                        )}
                                    </CardTitle>
                                </div>
                                {isDeleted && (
                                    <Badge variant="destructive" className="ml-2">
                                        삭제됨
                                    </Badge>
                                )}
                                {isUpdating && (
                                    <Badge variant="outline" className="ml-2">
                                        저장 중...
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="lg"
                                className="flex-1 sm:flex-none"
                                onClick={() => navigate(-1)}
                            >
                                목록으로
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">기본 정보</CardTitle>
                        {!isDeleted && (
                            <p className="text-base text-muted-foreground">각 항목을 클릭하여 수정할 수 있습니다.</p>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center text-xl text-muted-foreground">로딩 중...</p>
                        ) : (
                            <dl className="space-y-0">
                                <EditableField
                                    label="이름"
                                    value={student?.societyName ?? ''}
                                    onSave={(v) => handleUpdate('societyName', v)}
                                    disabled={isDeleted}
                                />
                                <EditableField
                                    label="세례명"
                                    value={student?.catholicName ?? ''}
                                    onSave={(v) => handleUpdate('catholicName', v)}
                                    disabled={isDeleted}
                                />
                                <GenderSelectField
                                    label="성별"
                                    value={student?.gender}
                                    onSave={(v) => handleUpdate('gender', v)}
                                    disabled={isDeleted}
                                />
                                <EditableField
                                    label="나이"
                                    value={student?.age?.toString() ?? ''}
                                    onSave={(v) => handleUpdate('age', v)}
                                    type="number"
                                    disabled={isDeleted}
                                />
                                <ContactField
                                    label="연락처"
                                    value={student?.contact}
                                    onSave={(v) => handleUpdate('contact', v)}
                                    disabled={isDeleted}
                                />
                                <GroupSelectField
                                    label="그룹"
                                    value={student?.groupId ?? ''}
                                    groupName={groupName}
                                    groups={groups}
                                    onSave={(v) => handleUpdate('groupId', v)}
                                    disabled={isDeleted}
                                />
                                <EditableField
                                    label="세례일"
                                    value={student?.baptizedAt ?? ''}
                                    onSave={(v) => handleUpdate('baptizedAt', v)}
                                    disabled={isDeleted}
                                />
                                <EditableField
                                    label="비고"
                                    value={student?.description ?? ''}
                                    onSave={(v) => handleUpdate('description', v)}
                                    disabled={isDeleted}
                                />
                                {isDeleted && (
                                    <div className="flex items-center border-b py-4 last:border-b-0">
                                        <dt className="w-32 shrink-0 text-xl font-medium text-muted-foreground">
                                            삭제일
                                        </dt>
                                        <dd className="text-xl text-destructive">
                                            {formatDateKR(student!.deletedAt!)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
