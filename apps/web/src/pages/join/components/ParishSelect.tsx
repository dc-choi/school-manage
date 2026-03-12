import { Loader2 } from 'lucide-react';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { trpc } from '~/lib/trpc';

interface ParishSelectProps {
    value: string | null;
    onChange: (parishId: string) => void;
}

export function ParishSelect({ value, onChange }: ParishSelectProps) {
    const { data, isLoading, error } = trpc.parish.list.useQuery();

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" aria-label="교구 목록 불러오는 중" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-8 text-destructive">교구 목록을 불러오지 못했습니다.</div>;
    }

    const parishes = data?.parishes ?? [];

    if (parishes.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">등록된 교구가 없습니다.</div>;
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="parish-select">교구 선택</Label>
            <Select value={value ?? undefined} onValueChange={onChange}>
                <SelectTrigger id="parish-select" className="w-full" aria-label="교구 선택">
                    <SelectValue placeholder="교구를 선택하세요…" />
                </SelectTrigger>
                <SelectContent>
                    {parishes.map((parish) => (
                        <SelectItem key={parish.id} value={parish.id}>
                            {parish.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
