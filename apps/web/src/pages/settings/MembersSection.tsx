import { RemoveMemberDialog } from './RemoveMemberDialog';
import { TransferAdminDialog } from './TransferAdminDialog';
import { ROLE } from '@school/shared';
import { formatDateKR } from '@school/utils';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/features/auth';
import { trpc } from '~/lib/trpc';

type MemberTarget = { id: string; name: string } | null;

export function MembersSection() {
    const { role } = useAuth();
    const { data, isLoading } = trpc.organization.members.useQuery();
    const [transferTarget, setTransferTarget] = useState<MemberTarget>(null);
    const [removeTarget, setRemoveTarget] = useState<MemberTarget>(null);

    if (isLoading) return null;

    const members = data?.members ?? [];
    if (members.length <= 1) return null;

    const isAdmin = role === ROLE.ADMIN;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>멤버 목록</CardTitle>
                        <Badge>{members.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {members.map((member) => (
                            <li
                                key={member.id}
                                className="flex items-center justify-between gap-3 rounded-md border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-medium">{member.displayName}</p>
                                        <Badge variant={member.role === ROLE.ADMIN ? 'default' : 'secondary'}>
                                            {member.role === ROLE.ADMIN ? '관리자' : '선생님'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDateKR(member.joinedAt)} 합류
                                    </p>
                                </div>
                                {isAdmin && member.role === ROLE.TEACHER ? (
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setTransferTarget({ id: member.id, name: member.displayName })
                                            }
                                            aria-label={`${member.displayName}에게 관리자 양도`}
                                        >
                                            양도
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setRemoveTarget({ id: member.id, name: member.displayName })}
                                            aria-label={`${member.displayName} 제거`}
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            제거
                                        </Button>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <TransferAdminDialog target={transferTarget} onClose={() => setTransferTarget(null)} />
            <RemoveMemberDialog target={removeTarget} onClose={() => setRemoveTarget(null)} />
        </>
    );
}
