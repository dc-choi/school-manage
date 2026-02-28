import { StudentForm } from './StudentForm';
import { formatDateKR } from '@school/utils';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useGroups } from '~/features/group';
import { useStudent, useStudents } from '~/features/student';

function InfoRow({ label, value, variant }: Readonly<{ label: string; value: string; variant?: 'destructive' }>) {
    return (
        <div className="flex flex-col border-b py-4 last:border-b-0 sm:flex-row sm:items-center">
            <dt className="mb-1 shrink-0 text-base font-medium text-muted-foreground sm:mb-0 sm:w-32 sm:text-xl">
                {label}
            </dt>
            <dd className={`text-base sm:text-xl ${variant === 'destructive' ? 'text-destructive' : ''}`}>
                <span className="rounded px-2 py-1">{value}</span>
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
    const [isEditing, setIsEditing] = useState(false);

    const isDeleted = !!student?.deletedAt;

    // 연락처 표시값 변환
    const contactRaw = student?.contact ? String(student.contact).padStart(11, '0') : '';
    const contactDisplay = contactRaw
        ? `${contactRaw.slice(0, 3)}-${contactRaw.slice(3, 7)}-${contactRaw.slice(7)}`
        : '-';

    // 성별 표시값 변환
    const getGenderDisplay = (gender?: string | null): string => {
        if (gender === 'M') return '남';
        if (gender === 'F') return '여';
        return '-';
    };

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

    if (isEditing && student) {
        return (
            <MainLayout title="학생 상세">
                <div className="mx-auto max-w-md">
                    <StudentForm
                        initialData={{
                            societyName: student.societyName,
                            catholicName: student.catholicName,
                            gender: student.gender as 'M' | 'F' | undefined,
                            age: student.age,
                            contact: student.contact,
                            description: student.description,
                            groupId: student.groupId,
                            baptizedAt: student.baptizedAt,
                        }}
                        groups={groups}
                        onSubmit={async (data) => {
                            if (!id) return;
                            // undefined → null 변환: 폼에서 비운 optional 필드를 DB에서 clear
                            await update({
                                id,
                                societyName: data.societyName,
                                catholicName: data.catholicName ?? null,
                                gender: data.gender ?? null,
                                age: data.age ?? null,
                                contact: data.contact ?? null,
                                description: data.description ?? null,
                                groupId: data.groupId,
                                baptizedAt: data.baptizedAt ?? null,
                            });
                            setIsEditing(false);
                        }}
                        onCancel={() => setIsEditing(false)}
                        isSubmitting={isUpdating}
                        submitLabel="수정"
                    />
                </div>
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
                            </div>
                            <div className="flex gap-2">
                                {!isDeleted && !isLoading && (
                                    <Button
                                        size="lg"
                                        className="flex-1 sm:flex-none"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        수정
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => navigate(-1)}
                                >
                                    목록으로
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center text-xl text-muted-foreground">로딩 중...</p>
                        ) : (
                            <dl className="space-y-0">
                                <InfoRow label="이름" value={student?.societyName ?? '-'} />
                                <InfoRow label="세례명" value={student?.catholicName ?? '-'} />
                                <InfoRow label="성별" value={getGenderDisplay(student?.gender)} />
                                <InfoRow label="나이" value={student?.age?.toString() ?? '-'} />
                                <InfoRow label="연락처" value={contactDisplay} />
                                <InfoRow label="학년" value={groupName || '-'} />
                                <InfoRow label="축일" value={student?.baptizedAt ?? '-'} />
                                <InfoRow label="비고" value={student?.description ?? '-'} />
                                {isDeleted && (
                                    <InfoRow
                                        label="삭제일"
                                        value={formatDateKR(student!.deletedAt!)}
                                        variant="destructive"
                                    />
                                )}
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
