/**
 * 학생 엑셀 Import 모달 (로드맵 2단계)
 *
 * 2단계 상태: 초기 (템플릿 다운로드 + 파일 업로드) → 미리보기 (테이블 + 등록)
 */
import type { ValidatedRow } from '../utils/excel-import';
import { parseExcelFile, validateRows } from '../utils/excel-import';
import { downloadExcelTemplate } from '../utils/excel-template';
import { formatContact } from '@school/utils';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
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
    const [parseError, setParseError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const utils = trpc.useUtils();
    const bulkCreateMutation = trpc.student.bulkCreate.useMutation({
        onSuccess: (data) => {
            utils.student.list.invalidate();
            analytics.trackStudentBulkCreated(data.successCount);
            toast.success(`${data.successCount}명의 학생이 등록되었습니다.`);
            onImportSuccess();
            handleClose();
        },
        onError: (error) => {
            toast.error(extractErrorMessage(error));
        },
    });

    const resetState = () => {
        setFileName(null);
        setValidatedRows(null);
        setIsParsing(false);
        setParseError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
                setIsParsing(false);
                return;
            }

            if (parsed.length > 500) {
                setParseError(`데이터가 ${parsed.length}건입니다. 500건 이하로 업로드해주세요.`);
                setValidatedRows(null);
                setIsParsing(false);
                return;
            }

            const validated = validateRows(parsed, groups);
            setValidatedRows(validated);
        } catch {
            setParseError('파일을 읽을 수 없습니다. 올바른 .xlsx 파일인지 확인해주세요.');
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

    const handleRegister = async () => {
        if (!validatedRows) return;

        const successRows = validatedRows.filter((r) => r.status === 'success');
        if (successRows.length === 0) return;

        await bulkCreateMutation.mutateAsync({
            students: successRows.map((row) => ({
                societyName: row.societyName,
                catholicName: row.catholicName || undefined,
                gender: row.normalizedGender ?? undefined,
                age: row.normalizedAge ?? undefined,
                contact: row.normalizedContact ?? undefined,
                baptizedAt: row.baptizedAt || undefined,
                description: row.description || undefined,
                groupIds: [row.groupId!],
                registered: row.normalizedRegistered || undefined,
            })),
        });
    };

    const successCount = validatedRows?.filter((r) => r.status === 'success').length ?? 0;
    const errorCount = validatedRows?.filter((r) => r.status === 'error').length ?? 0;
    const totalCount = validatedRows?.length ?? 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>엑셀로 학생 등록</DialogTitle>
                    <DialogDescription>
                        양식을 다운로드한 후 학생 정보를 입력하고 업로드하세요.
                        <br />첫 번째 행(헤더)을 수정하면 오류가 발생할 수 있습니다. 헤더 아래부터 입력해 주세요.
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
                                    컬럼 순서: 학년, 이름, 세례명, 성별, 전화번호, 축일, 나이, 비고, 등록 여부
                                    <br />
                                    헤더(1행)는 수정하지 마세요. 2행부터 데이터를 입력해 주세요.
                                </p>
                            </div>
                            <Button variant="outline" onClick={downloadExcelTemplate}>
                                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
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
                            {isParsing ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
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
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">파일: {fileName}</p>
                            <p className="text-sm" aria-live="polite">
                                전체 <span className="font-medium">{totalCount}</span>건 중{' '}
                                <span className="font-medium text-green-600">{successCount}</span>건 성공,{' '}
                                <span className="font-medium text-red-600">{errorCount}</span>건 실패
                            </p>
                        </div>

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
                                        <TableHead className="w-12">상태</TableHead>
                                        <TableHead>학년</TableHead>
                                        <TableHead>이름</TableHead>
                                        <TableHead>세례명</TableHead>
                                        <TableHead>성별</TableHead>
                                        <TableHead>전화번호</TableHead>
                                        <TableHead>축일</TableHead>
                                        <TableHead>나이</TableHead>
                                        <TableHead>비고</TableHead>
                                        <TableHead>등록</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {validatedRows.map((row) => (
                                        <TableRow
                                            key={row.rowIndex}
                                            className={row.status === 'error' ? 'bg-red-50' : ''}
                                        >
                                            <TableCell className="tabular-nums">{row.rowIndex}</TableCell>
                                            <TableCell>
                                                {row.status === 'success' ? (
                                                    <span className="text-green-600">성공</span>
                                                ) : (
                                                    <span className="text-red-600">실패</span>
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
                                            <TableCell>{row.baptizedAt || '-'}</TableCell>
                                            <TableCell>{row.age || '-'}</TableCell>
                                            <TableCell>{row.description || '-'}</TableCell>
                                            <TableCell>{row.normalizedRegistered ? 'O' : 'X'}</TableCell>
                                        </TableRow>
                                    ))}
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
                                disabled={successCount === 0 || bulkCreateMutation.isPending}
                            >
                                {bulkCreateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        등록 중…
                                    </>
                                ) : (
                                    `${successCount}명 등록`
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
