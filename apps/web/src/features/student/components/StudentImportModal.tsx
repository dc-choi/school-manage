/**
 * 학생 엑셀 Import 모달 (로드맵 2단계)
 *
 * 2단계 상태: 초기 (템플릿 다운로드 + 파일 업로드) → 미리보기 (테이블 + 등록)
 * 검증 단계: 엑셀 파싱 + 데이터 검증 + 서버 중복 검증을 한 번에 수행 후 미리보기 노출
 * (로드맵 2단계 — 학생 등록 중복 확인)
 */
import type { ValidatedRow } from '../utils/excel-import';
import { parseExcelFile, validateRows } from '../utils/excel-import';
import { downloadExcelTemplate } from '../utils/excel-template';
import type { DuplicateConflict } from '@school/shared';
import { formatContact } from '@school/utils';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { analytics } from '~/lib/analytics';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

interface GroupInfo {
    id: string;
    name: string;
}

interface StudentImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groups: GroupInfo[];
    onImportSuccess: () => void;
}

export function StudentImportModal({ open, onOpenChange, groups, onImportSuccess }: StudentImportModalProps) {
    const [fileName, setFileName] = useState<string | null>(null);
    const [validatedRows, setValidatedRows] = useState<ValidatedRow[] | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    /** rowIndex → 충돌 메타 */
    const [duplicates, setDuplicates] = useState<Map<number, DuplicateConflict>>(() => new Map());
    /** rowIndex → 강제 등록 여부 (default false) */
    const [forceMap, setForceMap] = useState<Map<number, boolean>>(() => new Map());
    /** 사전 중복 검증 실패 시 사용자에게 안내 (서버 bulkCreate가 최종 검증으로 대체됨을 알림) */
    const [duplicateCheckFailed, setDuplicateCheckFailed] = useState(false);
    /** GA4 warning_shown 이벤트는 미리보기당 1회만 발화 (state로 두면 재렌더 트리거되어 fetch 2회 발생) */
    const warningTrackedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const utils = trpc.useUtils();
    /** bulkCreate 호출 직전 보낸 학생 페이로드(이름 매핑용). onSuccess의 skipped[] 안내에 사용한다. */
    const lastPayloadRef = useRef<{ societyName: string; catholicName?: string }[]>([]);
    const bulkCreateMutation = trpc.student.bulkCreate.useMutation({
        onSuccess: (data) => {
            utils.student.list.invalidate();
            analytics.trackStudentBulkCreated(data.successCount);
            const skipped = data.skipped ?? [];
            if (skipped.length > 0) {
                const names = skipped
                    .map((s) => {
                        const row = lastPayloadRef.current[s.index];
                        if (!row) return null;
                        return row.catholicName ? `${row.societyName}(${row.catholicName})` : row.societyName;
                    })
                    .filter((n): n is string => !!n);
                const head = names.slice(0, 3).join(', ');
                const tail = names.length > 3 ? ` 외 ${names.length - 3}명` : '';
                toast.success(
                    `${data.successCount}명의 학생이 등록되었습니다. (중복 제외 ${skipped.length}건${
                        names.length > 0 ? `: ${head}${tail}` : ''
                    })`
                );
            } else {
                toast.success(`${data.successCount}명의 학생이 등록되었습니다.`);
            }
            onImportSuccess();
            handleClose();
        },
        onError: (error) => {
            toast.error(extractErrorMessage(error));
        },
    });

    const successRows = useMemo(() => validatedRows?.filter((r) => r.status === 'success') ?? [], [validatedRows]);

    const resetState = () => {
        setFileName(null);
        setValidatedRows(null);
        setIsParsing(false);
        setParseError(null);
        setDuplicates(new Map());
        setForceMap(new Map());
        setDuplicateCheckFailed(false);
        warningTrackedRef.current = false;
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        setIsDownloading(true);
        try {
            await downloadExcelTemplate();
        } catch {
            toast.error('엑셀 양식을 다운로드할 수 없습니다. 네트워크를 확인해 주세요.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleClose = () => {
        resetState();
        onOpenChange(false);
    };

    const processFile = async (file: File) => {
        if (!file.name.endsWith('.xlsx')) {
            setParseError('.xlsx 파일만 업로드할 수 있습니다.');
            return;
        }

        setIsParsing(true);
        setParseError(null);
        setFileName(file.name);

        try {
            const parsed = await parseExcelFile(file);

            if (parsed.length === 0) {
                setParseError('데이터가 없습니다. 엑셀 파일에 학생 정보를 입력해주세요.');
                setValidatedRows(null);
                return;
            }

            if (parsed.length > 500) {
                setParseError(`데이터가 ${parsed.length}건입니다. 500건 이하로 업로드해주세요.`);
                setValidatedRows(null);
                return;
            }

            // 1) 엑셀 데이터 자체 검증
            const validated = validateRows(parsed, groups);
            const successOnly = validated.filter((r) => r.status === 'success');

            // 2) 서버 중복 검증 (success 행 한정). 실패해도 등록은 가능 (서버 bulkCreate가 최종 검증)
            const dupMap = new Map<number, DuplicateConflict>();
            let checkFailed = false;
            if (successOnly.length > 0) {
                try {
                    const { conflicts } = await utils.student.checkDuplicate.fetch({
                        students: successOnly.map((r) => ({
                            societyName: r.societyName,
                            catholicName: r.catholicName || undefined,
                        })),
                    });
                    conflicts.forEach((c) => {
                        const row = successOnly[c.index];
                        if (row) dupMap.set(row.rowIndex, c);
                    });
                    if (conflicts.length > 0 && !warningTrackedRef.current) {
                        analytics.trackStudentDuplicateWarningShown({
                            mode: 'bulk',
                            internalCount: conflicts.filter((c) => c.reason === 'INTERNAL_DUP').length,
                            dbCount: conflicts.filter((c) => c.reason === 'DB_DUP').length,
                        });
                        warningTrackedRef.current = true;
                    }
                } catch (e) {
                    // 사전 검증 실패: 미리보기는 노출하되 사용자에게 안내 (bulkCreate가 최종 검증)
                    console.warn('[StudentImportModal] 중복 사전 검증 실패', e);
                    checkFailed = true;
                }
            }

            // 3) 두 검증 결과를 한 번에 반영 (UX: 깜빡임 없이 미리보기 노출)
            setDuplicates(dupMap);
            setDuplicateCheckFailed(checkFailed);
            setValidatedRows(validated);
        } catch {
            setParseError('파일을 읽을 수 없습니다. 올바른 .xlsx 파일인지, 네트워크가 정상인지 확인해 주세요.');
            setValidatedRows(null);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processFile(file);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) await processFile(file);
    };

    const setForceForRow = (rowIndex: number, force: boolean) => {
        setForceMap((prev) => {
            const next = new Map(prev);
            next.set(rowIndex, force);
            return next;
        });
    };

    const setForceForAllConflicts = (force: boolean) => {
        setForceMap((prev) => {
            const next = new Map(prev);
            duplicates.forEach((_, rowIndex) => next.set(rowIndex, force));
            return next;
        });
    };

    const handleRegister = async () => {
        if (!validatedRows) return;
        if (successRows.length === 0) return;

        let forcedCount = 0;
        let cancelledCount = 0;

        const studentsPayload = successRows.map((row) => {
            const dup = duplicates.get(row.rowIndex);
            const force = dup ? forceMap.get(row.rowIndex) === true : false;
            if (dup) {
                if (force) forcedCount++;
                else cancelledCount++;
            }
            return {
                societyName: row.societyName,
                catholicName: row.catholicName || undefined,
                gender: row.normalizedGender ?? undefined,
                age: row.normalizedAge ?? undefined,
                contact: row.normalizedContact ?? undefined,
                parentContact: row.normalizedParentContact ?? undefined,
                baptizedAt: row.baptizedAt || undefined,
                description: row.description || undefined,
                groupIds: [row.groupId!],
                registered: row.normalizedRegistered || undefined,
                force: force || undefined,
            };
        });

        if (forcedCount > 0) {
            analytics.trackStudentDuplicateForced({ mode: 'bulk', count: forcedCount });
        }
        if (cancelledCount > 0) {
            analytics.trackStudentDuplicateCancelled({ mode: 'bulk', count: cancelledCount });
        }

        // 응답 skipped[] 안내(toast)에서 학생 이름 매핑용 — 보낸 순서 그대로 보존
        lastPayloadRef.current = studentsPayload.map((s) => ({
            societyName: s.societyName,
            catholicName: s.catholicName,
        }));

        await bulkCreateMutation.mutateAsync({ students: studentsPayload });
    };

    const successCount = successRows.length;
    const errorCount = validatedRows?.filter((r) => r.status === 'error').length ?? 0;
    const totalCount = validatedRows?.length ?? 0;
    const duplicateCount = duplicates.size;
    const internalDupCount = Array.from(duplicates.values()).filter((c) => c.reason === 'INTERNAL_DUP').length;
    const dbDupCount = duplicateCount - internalDupCount;
    const cleanCount = successCount - duplicateCount;
    const forcedConflictCount = successRows.reduce(
        (acc, r) => acc + (duplicates.has(r.rowIndex) && forceMap.get(r.rowIndex) === true ? 1 : 0),
        0
    );
    const willRegisterCount = cleanCount + forcedConflictCount;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>엑셀로 학생 등록</DialogTitle>
                    <DialogDescription>
                        양식을 다운로드한 후 학생 정보를 입력하고 업로드하세요.
                        <br />첫 번째 행(헤더)을 수정하면 오류가 발생할 수 있습니다. 헤더 아래부터 입력해 주세요.
                        <br />
                        이름·세례명이 같은 학생이 이미 등록되어 있으면 미리보기 단계에서 경고가 표시됩니다.
                    </DialogDescription>
                </DialogHeader>

                {validatedRows === null ? (
                    /* 초기 상태: 템플릿 다운로드 + 파일 업로드 */
                    <div className="space-y-4 py-4">
                        <Card className="flex items-center gap-4 p-4">
                            <FileSpreadsheet className="h-8 w-8 text-green-600" aria-hidden="true" />
                            <div className="flex-1">
                                <p className="font-medium">1. 양식 다운로드</p>
                                <p className="text-sm text-muted-foreground">
                                    컬럼 순서: 학년, 이름, 세례명, 성별, 전화번호, 축일, 나이, 비고, 등록 여부, 부모
                                    연락처
                                    <br />
                                    헤더(1행)는 수정하지 마세요. 2행부터 데이터를 입력해 주세요.
                                </p>
                            </div>
                            <Button variant="outline" onClick={handleDownloadTemplate} disabled={isDownloading}>
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                                )}
                                양식 다운로드
                            </Button>
                        </Card>

                        <Card
                            className={`flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed p-6 transition-colors ${
                                isDragging ? 'border-blue-500 bg-blue-50' : 'border-muted-foreground/25'
                            }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => !isParsing && fileInputRef.current?.click()}
                        >
                            <Upload
                                className={`h-8 w-8 ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`}
                                aria-hidden="true"
                            />
                            <p className="font-medium">2. 파일 업로드</p>
                            <p className="text-center text-sm text-muted-foreground">
                                .xlsx 파일을 드래그하거나 클릭하여 선택하세요.
                                <br />
                                헤더를 변경한 파일은 정상적으로 인식되지 않을 수 있습니다.
                            </p>
                            {isParsing ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                    <span>검증 중…</span>
                                </div>
                            ) : null}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-file-input"
                            />
                        </Card>

                        {parseError ? <p className="text-sm text-red-600">{parseError}</p> : null}

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                취소
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    /* 미리보기 상태: 테이블 + 검증 결과 + 등록 */
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">파일: {fileName}</p>
                            <p className="text-sm" aria-live="polite">
                                전체 <span className="font-medium">{totalCount}</span>건 중{' '}
                                <span className="font-medium text-green-600">{cleanCount}</span>건 정상,{' '}
                                <span className="font-medium text-red-600">{errorCount}</span>건 오류
                                {duplicateCount > 0 ? (
                                    <>
                                        , <span className="font-medium text-yellow-700">{duplicateCount}</span>건 중복
                                    </>
                                ) : null}
                            </p>
                        </div>

                        {duplicateCheckFailed && (
                            <div
                                className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800"
                                role="status"
                                aria-live="polite"
                            >
                                서버 중복 확인을 완료하지 못했습니다. 등록 시 자동으로 재검증되며, 이미 등록된 학생은
                                결과 알림에 제외 명단으로 표시됩니다.
                            </div>
                        )}

                        {duplicateCount > 0 && (
                            <div
                                className="flex flex-col gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 sm:flex-row sm:items-center sm:justify-between"
                                role="status"
                                aria-live="polite"
                            >
                                <p>
                                    중복 {duplicateCount}건 발견 (내부 {internalDupCount}건 / 기존 {dbDupCount}건).
                                    행마다 강제 등록 여부를 선택하거나 아래 버튼으로 일괄 처리할 수 있습니다.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setForceForAllConflicts(true)}
                                    >
                                        모두 강제 등록
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setForceForAllConflicts(false)}
                                    >
                                        모두 제외
                                    </Button>
                                </div>
                            </div>
                        )}

                        {errorCount > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="mb-2 text-sm font-medium text-red-700">오류 항목</p>
                                <div className="space-y-2 text-sm text-red-600">
                                    {validatedRows
                                        .filter((r) => r.status === 'error')
                                        .map((row) => (
                                            <div key={row.rowIndex}>
                                                <p className="font-medium">{row.rowIndex}행</p>
                                                <ul className="list-disc pl-5">
                                                    {row.errors.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <UITable>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">행</TableHead>
                                        <TableHead className="w-20">상태</TableHead>
                                        <TableHead className="whitespace-nowrap">학년</TableHead>
                                        <TableHead className="whitespace-nowrap">이름</TableHead>
                                        <TableHead className="whitespace-nowrap">세례명</TableHead>
                                        <TableHead className="whitespace-nowrap">성별</TableHead>
                                        <TableHead className="whitespace-nowrap">전화번호</TableHead>
                                        <TableHead className="whitespace-nowrap">부모 연락처</TableHead>
                                        <TableHead className="whitespace-nowrap">축일</TableHead>
                                        <TableHead className="whitespace-nowrap">나이</TableHead>
                                        <TableHead className="whitespace-nowrap">비고</TableHead>
                                        <TableHead className="whitespace-nowrap">등록</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {validatedRows.map((row) => {
                                        const dup = duplicates.get(row.rowIndex);
                                        const isError = row.status === 'error';
                                        const rowClass = isError ? 'bg-red-50' : dup ? 'bg-yellow-50' : '';
                                        return (
                                            <TableRow key={row.rowIndex} className={rowClass}>
                                                <TableCell className="tabular-nums">{row.rowIndex}</TableCell>
                                                <TableCell>
                                                    {isError ? (
                                                        <span className="text-red-600">실패</span>
                                                    ) : dup ? (
                                                        <div className="flex flex-col gap-1">
                                                            <Badge
                                                                variant="outline"
                                                                className="whitespace-normal border-yellow-300 text-yellow-800"
                                                            >
                                                                {dup.reason === 'INTERNAL_DUP'
                                                                    ? `내부 중복: ${
                                                                          dup.otherIndex !== undefined
                                                                              ? `${
                                                                                    successRows[dup.otherIndex]
                                                                                        ?.rowIndex ?? '?'
                                                                                }행과 동일`
                                                                              : '동일 학생'
                                                                      }`
                                                                    : dup.existing
                                                                      ? `이미 등록됨: ${dup.existing.societyName}${
                                                                            dup.existing.catholicName
                                                                                ? `(${dup.existing.catholicName})`
                                                                                : ''
                                                                        }`
                                                                      : '이미 등록됨'}
                                                            </Badge>
                                                            <label className="flex items-center gap-1 text-xs text-yellow-800">
                                                                <Checkbox
                                                                    checked={forceMap.get(row.rowIndex) === true}
                                                                    onCheckedChange={(checked) =>
                                                                        setForceForRow(row.rowIndex, checked === true)
                                                                    }
                                                                />
                                                                강제 등록
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <span className="text-green-600">성공</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{row.groupName || '-'}</TableCell>
                                                <TableCell>{row.societyName || '-'}</TableCell>
                                                <TableCell>{row.catholicName || '-'}</TableCell>
                                                <TableCell>
                                                    {row.normalizedGender === 'M'
                                                        ? '남'
                                                        : row.normalizedGender === 'F'
                                                          ? '여'
                                                          : row.gender || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {row.normalizedContact ? formatContact(row.normalizedContact) : '-'}
                                                </TableCell>
                                                <TableCell>{row.normalizedParentContact ?? '-'}</TableCell>
                                                <TableCell>{row.baptizedAt || '-'}</TableCell>
                                                <TableCell>{row.age || '-'}</TableCell>
                                                <TableCell>{row.description || '-'}</TableCell>
                                                <TableCell>{row.normalizedRegistered ? 'O' : 'X'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </UITable>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={resetState}>
                                다시 선택
                            </Button>
                            <Button variant="outline" onClick={handleClose}>
                                취소
                            </Button>
                            <Button
                                onClick={handleRegister}
                                disabled={willRegisterCount === 0 || bulkCreateMutation.isPending}
                            >
                                {bulkCreateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        등록 중…
                                    </>
                                ) : (
                                    `${willRegisterCount}명 등록`
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
