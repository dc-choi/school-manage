import { LegalPageLayout, type TocItem } from '~/components/layout/LegalPageLayout';
import { LEGAL_INFO } from '~/lib/legal-info';

const TOC: TocItem[] = [
    { id: 'scope', label: '1. 적용 범위' },
    { id: 'eligible', label: '2. 환불 가능 조건' },
    { id: 'ineligible', label: '3. 환불 불가 조건' },
    { id: 'request', label: '4. 환불 신청 방법' },
    { id: 'processing', label: '5. 처리 기한' },
    { id: 'dispute', label: '6. 분쟁의 해결' },
    { id: 'addendum', label: '부칙' },
];

export function RefundPage() {
    return (
        <LegalPageLayout
            title="환불약관"
            description={`${LEGAL_INFO.serviceName} 환불약관`}
            effectiveDate={LEGAL_INFO.effectiveDate}
            tableOfContents={TOC}
        >
            <p>
                본 환불약관은 {LEGAL_INFO.businessName}(이하 &ldquo;회사&rdquo;)이 제공하는 {LEGAL_INFO.serviceName}의
                유료 결제 서비스에 대한 환불 기준을 정합니다. 본 약관에서 정하지 않은 사항은 「전자상거래 등에서의
                소비자보호에 관한 법률」 등 관계 법령에 따릅니다.
            </p>

            <section id="scope">
                <h2 className="text-lg font-semibold text-foreground">1. 적용 범위</h2>
                <p className="mt-2">
                    본 약관은 회사가 향후 도입하는 정기결제·일회성 결제 등 모든 유료 결제 서비스에 적용됩니다. 결제 기능
                    도입 전까지는 본 약관의 효력은 별도로 발생하지 않습니다.
                </p>
            </section>

            <section id="eligible">
                <h2 className="text-lg font-semibold text-foreground">2. 환불 가능 조건</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>결제 후 7일 이내이며, 회원이 유료 기능을 사용하지 않은 경우 전액 환불합니다.</li>
                    <li>
                        회사의 귀책 사유로 서비스를 정상적으로 제공받지 못한 경우 사용분에 상응하는 금액을 환불합니다.
                    </li>
                    <li>관계 법령에서 환불을 의무화하는 경우 해당 규정에 따라 환불합니다.</li>
                </ol>
            </section>

            <section id="ineligible">
                <h2 className="text-lg font-semibold text-foreground">3. 환불 불가 조건</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>결제 후 7일이 경과한 경우.</li>
                    <li>
                        회원이 유료 기능을 일부라도 사용한 경우. 단, 회사의 귀책 사유로 사용이 불가했던 경우는
                        제외합니다.
                    </li>
                    <li>회원이 본 서비스 이용약관을 위반하여 이용이 제한된 경우.</li>
                </ol>
            </section>

            <section id="request">
                <h2 className="text-lg font-semibold text-foreground">4. 환불 신청 방법</h2>
                <p className="mt-2">
                    환불을 신청하려는 회원은 회사의 이메일(
                    <a
                        href={`mailto:${LEGAL_INFO.contactEmail}`}
                        className="font-medium text-foreground underline hover:no-underline"
                    >
                        {LEGAL_INFO.contactEmail}
                    </a>
                    )로 다음 사항을 기재하여 신청합니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>회원 이메일(가입 시 등록한 계정 이메일)</li>
                    <li>결제일·결제 금액·결제 수단</li>
                    <li>환불 요청 사유</li>
                </ul>
            </section>

            <section id="processing">
                <h2 className="text-lg font-semibold text-foreground">5. 처리 기한</h2>
                <p className="mt-2">
                    회사는 환불 신청을 접수한 날로부터 7영업일 이내에 환불 가능 여부를 판단하여 회원에게 통지하며, 환불
                    승인 시 결제 수단과 동일한 경로로 환불을 진행합니다. 결제 수단의 정책에 따라 실제 환불 완료일은
                    추가로 영업일이 소요될 수 있습니다.
                </p>
            </section>

            <section id="dispute">
                <h2 className="text-lg font-semibold text-foreground">6. 분쟁의 해결</h2>
                <p className="mt-2">
                    환불과 관련한 분쟁이 발생한 경우 회사와 회원은 신의성실의 원칙에 따라 협의로 해결합니다. 협의로
                    해결되지 않을 경우 「전자상거래 등에서의 소비자보호에 관한 법률」 및 민사소송법상 관할 법원에
                    따릅니다.
                </p>
            </section>

            <section id="addendum">
                <h2 className="text-lg font-semibold text-foreground">부칙</h2>
                <p className="mt-2">본 약관은 {LEGAL_INFO.effectiveDate}부터 시행합니다.</p>
            </section>
        </LegalPageLayout>
    );
}
