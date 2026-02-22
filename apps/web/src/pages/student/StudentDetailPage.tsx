import { EditableField } from './EditableField';
import { formatDateKR } from '@school/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useGroups } from '~/features/group';
import { useStudent, useStudents } from '~/features/student';
import { extractErrorMessage } from '~/lib/error';

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
            toast.error(extractErrorMessage(e));
        }
    };

    // 연락처 표시값 변환
    const contactRaw = student?.contact ? String(student.contact).padStart(11, '0') : '';
    const contactDisplay = contactRaw
        ? `${contactRaw.slice(0, 3)}-${contactRaw.slice(3, 7)}-${contactRaw.slice(7)}`
        : '-';

    // 성별 표시값 변환
    const genderDisplay = student?.gender === 'M' ? '남' : student?.gender === 'F' ? '여' : '-';

    // 그룹 이름 찾기
    const groupName = groups.find((g) => g.id === student?.groupId)?.name ?? student?.groupId ?? '';

    if (error) {
        return (
            <MainLayout title="학생 상세">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-xl text-destructive">학생 정보를 불러오는데 실패했습니다.</p>
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
        <MainLayout title="학생 상세">
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
                                <EditableField
                                    label="성별"
                                    value={student?.gender ?? ''}
                                    displayValue={genderDisplay}
                                    onSave={(v) => handleUpdate('gender', v)}
                                    disabled={isDeleted}
                                    renderInput={({ value, onChange }) => (
                                        <Select value={value} onValueChange={onChange}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="성별 선택" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">남</SelectItem>
                                                <SelectItem value="F">여</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <EditableField
                                    label="나이"
                                    value={student?.age?.toString() ?? ''}
                                    onSave={(v) => handleUpdate('age', v)}
                                    type="number"
                                    disabled={isDeleted}
                                />
                                <EditableField
                                    label="연락처"
                                    value={contactRaw}
                                    displayValue={contactDisplay}
                                    onSave={(v) => handleUpdate('contact', v)}
                                    disabled={isDeleted}
                                    hint="- 없이 숫자만 입력하세요"
                                    renderInput={({ value, onChange, onKeyDown }) => (
                                        <Input
                                            value={value}
                                            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
                                            onKeyDown={onKeyDown}
                                            placeholder="01012345678"
                                            autoFocus
                                        />
                                    )}
                                />
                                <EditableField
                                    label="학년"
                                    value={student?.groupId ?? ''}
                                    displayValue={groupName}
                                    onSave={(v) => handleUpdate('groupId', v)}
                                    disabled={isDeleted}
                                    renderInput={({ value, onChange }) => (
                                        <Select value={value} onValueChange={onChange}>
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
                                    )}
                                />
                                <EditableField
                                    label="축일"
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
