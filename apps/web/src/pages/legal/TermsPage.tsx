import { Link } from 'react-router-dom';
import { LegalPageLayout, type TocItem } from '~/components/layout/LegalPageLayout';
import { LEGAL_INFO, LEGAL_ROUTES } from '~/lib/legal-info';

const TOC: TocItem[] = [
    { id: 'purpose', label: '제1조 (목적)' },
    { id: 'definitions', label: '제2조 (용어의 정의)' },
    { id: 'effect', label: '제3조 (약관의 효력 및 변경)' },
    { id: 'service', label: '제4조 (서비스의 내용)' },
    { id: 'membership', label: '제5조 (회원가입 및 관리)' },
    { id: 'duties', label: '제6조 (회원의 의무)' },
    { id: 'restriction', label: '제7조 (서비스 이용 제한)' },
    { id: 'payment', label: '제8조 (결제 및 환불)' },
    { id: 'privacy', label: '제9조 (개인정보 보호)' },
    { id: 'liability', label: '제10조 (면책 조항)' },
    { id: 'dispute', label: '제11조 (분쟁의 해결)' },
    { id: 'addendum', label: '부칙' },
];

export function TermsPage() {
    return (
        <LegalPageLayout
            title="이용약관"
            description={`${LEGAL_INFO.serviceName} 이용약관`}
            effectiveDate={LEGAL_INFO.effectiveDate}
            tableOfContents={TOC}
        >
            <section id="purpose">
                <h2 className="text-lg font-semibold text-foreground">제1조 (목적)</h2>
                <p className="mt-2">
                    본 약관은 {LEGAL_INFO.businessName}(이하 &ldquo;회사&rdquo;)이 운영하는 {LEGAL_INFO.serviceName}
                    (이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항, 기타 필요한
                    사항을 규정함을 목적으로 합니다.
                </p>
            </section>

            <section id="definitions">
                <h2 className="text-lg font-semibold text-foreground">제2조 (용어의 정의)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>&ldquo;서비스&rdquo;란 회사가 제공하는 가톨릭 주일학교 출석 관리 도구를 의미합니다.</li>
                    <li>
                        &ldquo;회원&rdquo;이란 본 약관에 동의하고 회사와 이용 계약을 체결한 자(교리교사·사제·운영자
                        등)를 말합니다.
                    </li>
                    <li>
                        &ldquo;계정&rdquo;이란 회원의 식별과 서비스 이용을 위해 회원이 등록한 이메일과 비밀번호로 구성된
                        정보를 의미합니다.
                    </li>
                    <li>
                        &ldquo;조직&rdquo;이란 본당·모임 등 회원이 속한 단체를 의미하며, 회사가 정한 절차에 따라
                        생성·관리됩니다.
                    </li>
                </ol>
            </section>

            <section id="effect">
                <h2 className="text-lg font-semibold text-foreground">제3조 (약관의 효력 및 변경)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
                    <li>
                        회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 시행일 7일 전부터
                        서비스 내 공지사항으로 알립니다. 회원에게 불리한 변경의 경우 시행일 30일 전부터 공지하며, 변경
                        약관에 동의하지 않을 경우 회원은 이용 계약을 해지할 수 있습니다.
                    </li>
                </ol>
            </section>

            <section id="service">
                <h2 className="text-lg font-semibold text-foreground">제4조 (서비스의 내용)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>회사는 다음과 같은 서비스를 제공합니다.</li>
                    <li className="ml-4 list-[lower-alpha]">출석 기록·조회 및 통계 기능</li>
                    <li className="ml-4 list-[lower-alpha]">학생·그룹·조직 관리 기능</li>
                    <li className="ml-4 list-[lower-alpha]">전례력·축일 정보 조회</li>
                    <li className="ml-4 list-[lower-alpha]">기타 회사가 추가로 개발하거나 제휴하는 서비스</li>
                </ol>
                <p className="mt-2">
                    회사는 서비스의 내용·품질·기술적 사양을 변경할 수 있으며, 변경된 내용은 서비스 화면에 공지합니다.
                </p>
            </section>

            <section id="membership">
                <h2 className="text-lg font-semibold text-foreground">제5조 (회원가입 및 관리)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>
                        회원가입은 이용자가 본 약관과 개인정보처리방침에 동의하고 회사가 정한 양식에 따라 신청합니다.
                    </li>
                    <li>
                        회사는 다음 각 호의 경우 가입 신청을 승인하지 않거나, 사후에 이용 계약을 해지할 수 있습니다.
                        <ul className="mt-1 list-disc space-y-1 pl-6">
                            <li>타인의 정보를 도용한 경우</li>
                            <li>허위 정보를 기재한 경우</li>
                            <li>부정한 목적으로 서비스를 이용하려는 경우</li>
                        </ul>
                    </li>
                    <li>회원은 언제든지 서비스 내 탈퇴 기능을 통해 이용 계약을 해지할 수 있습니다.</li>
                </ol>
            </section>

            <section id="duties">
                <h2 className="text-lg font-semibold text-foreground">제6조 (회원의 의무)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>회원은 본 약관 및 회사의 공지사항·관계 법령을 준수해야 합니다.</li>
                    <li>회원은 자신의 계정 정보를 제3자에게 제공하거나 양도해서는 안 됩니다.</li>
                    <li>회원은 학생 등 제3자의 개인정보를 입력·관리할 때 관련 법령을 준수해야 합니다.</li>
                </ol>
            </section>

            <section id="restriction">
                <h2 className="text-lg font-semibold text-foreground">제7조 (서비스 이용 제한)</h2>
                <p className="mt-2">
                    회사는 회원이 본 약관 또는 관계 법령을 위반한 경우 서비스 이용을 일시 정지하거나 이용 계약을 해지할
                    수 있습니다. 중대한 위반이 아닌 경우 사전에 시정을 요청합니다.
                </p>
            </section>

            <section id="payment">
                <h2 className="text-lg font-semibold text-foreground">제8조 (결제 및 환불)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>
                        회사가 향후 유료 결제 서비스를 도입할 경우, 회원은 회사가 안내하는 결제 수단으로 이용료를
                        납부합니다.
                    </li>
                    <li>
                        결제·환불에 관한 세부 사항은{' '}
                        <Link
                            to={LEGAL_ROUTES.refund}
                            className="font-medium text-foreground underline hover:no-underline"
                        >
                            환불약관
                        </Link>
                        에 따르며, 본 약관과 환불약관이 충돌할 경우 환불약관을 우선 적용합니다.
                    </li>
                </ol>
            </section>

            <section id="privacy">
                <h2 className="text-lg font-semibold text-foreground">제9조 (개인정보 보호)</h2>
                <p className="mt-2">
                    회사는 관계 법령이 정하는 바에 따라 회원의 개인정보를 보호합니다. 개인정보 처리에 관한 자세한 사항은{' '}
                    <Link
                        to={LEGAL_ROUTES.privacy}
                        className="font-medium text-foreground underline hover:no-underline"
                    >
                        개인정보처리방침
                    </Link>
                    에 따릅니다.
                </p>
            </section>

            <section id="liability">
                <h2 className="text-lg font-semibold text-foreground">제10조 (면책 조항)</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>
                        회사는 천재지변·전쟁·테러·통신 장애 등 불가항력으로 인한 서비스 중단에 책임을 지지 않습니다.
                    </li>
                    <li>회사는 회원이 입력한 정보의 정확성에 대해 책임을 지지 않습니다.</li>
                    <li>
                        회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 개입하지 않으며, 그로 인한
                        손해를 배상하지 않습니다.
                    </li>
                </ol>
            </section>

            <section id="dispute">
                <h2 className="text-lg font-semibold text-foreground">제11조 (분쟁의 해결)</h2>
                <p className="mt-2">
                    본 약관과 관련하여 분쟁이 발생한 경우 회사와 회원은 신의성실의 원칙에 따라 협의로 해결합니다. 협의로
                    해결되지 않을 경우 민사소송법상 관할 법원에 따릅니다.
                </p>
            </section>

            <section id="addendum">
                <h2 className="text-lg font-semibold text-foreground">부칙</h2>
                <p className="mt-2">본 약관은 {LEGAL_INFO.effectiveDate}부터 시행합니다.</p>
            </section>
        </LegalPageLayout>
    );
}
