import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';

/**
 * 개인정보 처리방침 내용 (공유)
 */
export const PrivacyPolicyContent = () => (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <div>
            <p className="font-medium text-foreground">1. 수집하는 개인정보 항목</p>
            <p className="mt-1 font-medium text-foreground/80">가. 계정 정보 (회원가입 시)</p>
            <p>아이디, 이름(닉네임), 비밀번호(암호화 저장)</p>
            <p className="mt-1 font-medium text-foreground/80">나. 학생 정보 (사용자 입력)</p>
            <p>이름, 세례명, 성별, 나이, 연락처, 세례일, 메모, 출석 기록</p>
        </div>
        <div>
            <p className="font-medium text-foreground">2. 수집 목적</p>
            <p className="mt-1 font-medium text-foreground/80">가. 계정 정보</p>
            <p>서비스 회원 식별 및 인증</p>
            <p className="mt-1 font-medium text-foreground/80">나. 학생 정보</p>
            <p>출석부 관리 서비스 제공 (출석 기록, 통계 조회)</p>
        </div>
        <div>
            <p className="font-medium text-foreground">3. 민감정보 처리</p>
            <p>
                세례명·세례일은 종교 관련 민감정보에 해당합니다. 해당 항목은 선택 입력이며, 주일학교 출석 관리
                목적으로만 사용됩니다.
            </p>
        </div>
        <div>
            <p className="font-medium text-foreground">4. 보유 및 이용 기간</p>
            <p>회원 탈퇴 시까지 (탈퇴 후 계정 및 관련 학생 정보를 지체 없이 파기)</p>
        </div>
        <div>
            <p className="font-medium text-foreground">5. 개인정보 위탁 및 제3자 제공</p>
            <p>없음</p>
        </div>
        <div>
            <p className="font-medium text-foreground">6. 이용자 권리</p>
            <p>동의 철회, 개인정보 열람·정정·삭제 요청 가능</p>
        </div>
        <div>
            <p className="font-medium text-foreground">7. 사용자(교사)의 책임</p>
            <p>
                사용자가 입력하는 학생 정보는 사용자 본인의 책임 하에 수집·관리됩니다. 학생 또는 보호자로부터 개인정보
                수집에 대한 동의를 받는 것은 사용자의 책임입니다.
            </p>
        </div>
    </div>
);

/**
 * 개인정보 처리방침 모달 다이얼로그
 *
 * children을 트리거로 사용
 */
export const PrivacyPolicyDialog = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>개인정보 처리방침</DialogTitle>
                </DialogHeader>
                <PrivacyPolicyContent />
            </DialogContent>
        </Dialog>
    );
};
