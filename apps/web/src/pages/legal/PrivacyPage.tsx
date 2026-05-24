import { LegalPageLayout, type TocItem } from '~/components/layout/LegalPageLayout';
import { LEGAL_INFO } from '~/lib/legal-info';

const TOC: TocItem[] = [
    { id: 'collection', label: '1. 수집하는 개인정보 항목 및 방법' },
    { id: 'purpose', label: '2. 개인정보 이용 목적' },
    { id: 'retention', label: '3. 보유 및 이용 기간' },
    { id: 'third-party', label: '4. 제3자 제공' },
    { id: 'consignment', label: '5. 처리 위탁' },
    { id: 'rights', label: '6. 정보주체의 권리·행사 방법' },
    { id: 'safeguards', label: '7. 안전성 확보 조치' },
    { id: 'cookies', label: '8. 쿠키 등의 사용' },
    { id: 'officer', label: '9. 개인정보 보호책임자' },
    { id: 'changes', label: '10. 처리방침의 변경' },
];

export function PrivacyPage() {
    return (
        <LegalPageLayout
            title="개인정보처리방침"
            description={`${LEGAL_INFO.serviceName} 개인정보처리방침`}
            effectiveDate={LEGAL_INFO.effectiveDate}
            tableOfContents={TOC}
        >
            <p>
                {LEGAL_INFO.businessName}(이하 &ldquo;회사&rdquo;)은 「개인정보 보호법」 제30조에 따라 정보주체의
                개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리하기 위해 본 개인정보처리방침을
                수립·공개합니다.
            </p>

            <section id="collection">
                <h2 className="text-lg font-semibold text-foreground">1. 수집하는 개인정보 항목 및 방법</h2>
                <p className="mt-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>회원가입 시: 이메일, 비밀번호, 표시 이름</li>
                    <li>
                        서비스 이용 시(회원이 입력): 학생 이름·세례명·생년월일·학년·연락처·세례 정보, 그룹·조직 정보,
                        출석 기록
                    </li>
                    <li>자동 수집: 접속 IP, 쿠키, 서비스 이용 기록, 로그</li>
                </ul>
                <p className="mt-2">
                    수집 방법: 회원가입·서비스 이용 시 회원이 직접 입력하거나, 자동으로 생성·수집됩니다.
                </p>
            </section>

            <section id="purpose">
                <h2 className="text-lg font-semibold text-foreground">2. 개인정보 이용 목적</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>회원가입 의사 확인, 본인 식별·인증, 회원 자격 유지·관리</li>
                    <li>주일학교 출석·학생·조직 관리 등 서비스 제공</li>
                    <li>서비스 이용에 관한 통계 분석 및 품질 개선</li>
                    <li>공지사항 전달, 고객 문의 응대</li>
                </ol>
            </section>

            <section id="retention">
                <h2 className="text-lg font-semibold text-foreground">3. 보유 및 이용 기간</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>
                        회원 정보: 회원 탈퇴 시까지. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지 보관합니다.
                    </li>
                    <li>학생·출석 정보: 회원이 직접 삭제하거나 회원 탈퇴 시까지.</li>
                    <li>접속 로그: 통신비밀보호법에 따라 3개월.</li>
                </ol>
            </section>

            <section id="third-party">
                <h2 className="text-lg font-semibold text-foreground">4. 제3자 제공</h2>
                <p className="mt-2">
                    회사는 정보주체의 개인정보를 제1조의 이용 목적 범위 내에서만 처리하며, 정보주체의 동의·법령의 특별한
                    규정 등에 해당하는 경우에만 제3자에게 제공합니다.
                </p>
            </section>

            <section id="consignment">
                <h2 className="text-lg font-semibold text-foreground">5. 처리 위탁</h2>
                <p className="mt-2">
                    회사는 안정적인 서비스 제공을 위해 개인정보 처리 업무를 외부 전문 업체에 위탁할 수 있으며, 위탁 시
                    위탁 업체와 위탁 업무를 본 처리방침에 공개합니다. 현재 위탁 현황은 다음과 같습니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>클라우드 인프라 운영: Amazon Web Services, Inc.</li>
                    <li>서비스 이용 통계 분석: Google LLC (Google Analytics)</li>
                    <li>서비스 이용 행태 분석: Microsoft Corporation (Microsoft Clarity)</li>
                    <li>사용자 피드백 수집 및 관리: Lenit (lenit.cloud)</li>
                </ul>
            </section>

            <section id="rights">
                <h2 className="text-lg font-semibold text-foreground">6. 정보주체의 권리·행사 방법</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>
                        정보주체는 회사에 대해 언제든지 다음의 권리를 행사할 수 있습니다: 개인정보 열람·정정·삭제 요구,
                        처리정지 요구.
                    </li>
                    <li>
                        권리 행사는 서비스 내 설정 화면 또는 이메일({LEGAL_INFO.contactEmail})로 신청할 수 있습니다.
                    </li>
                    <li>회사는 요청 접수 후 지체 없이 조치하며, 처리 결과를 정보주체에게 통지합니다.</li>
                </ol>
            </section>

            <section id="safeguards">
                <h2 className="text-lg font-semibold text-foreground">7. 안전성 확보 조치</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-6">
                    <li>관리적 조치: 내부 관리 계획 수립·시행, 접근 권한 최소화.</li>
                    <li>기술적 조치: 비밀번호 암호화 저장, 통신 구간 암호화(TLS), 접근 통제.</li>
                    <li>물리적 조치: 안전한 클라우드 데이터센터 위탁 운영.</li>
                </ol>
            </section>

            <section id="cookies">
                <h2 className="text-lg font-semibold text-foreground">8. 쿠키 등의 사용</h2>
                <p className="mt-2">
                    회사는 로그인 상태 유지·서비스 품질 측정 목적으로 쿠키를 사용할 수 있습니다. 정보주체는 브라우저
                    설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
                </p>
                <p className="mt-2">
                    회사는 서비스 개선과 이용 행태 분석을 위해 Google Analytics, Microsoft Clarity 등 외부 분석 도구를
                    사용하며, 이 과정에서 쿠키 및 유사 기술을 통해 이용 기록이 수집될 수 있습니다.
                </p>
            </section>

            <section id="officer">
                <h2 className="text-lg font-semibold text-foreground">9. 개인정보 보호책임자</h2>
                <p className="mt-2">
                    회사는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및
                    피해 구제 등을 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>이름: {LEGAL_INFO.representative}</li>
                    <li>
                        이메일:{' '}
                        <a
                            href={`mailto:${LEGAL_INFO.contactEmail}`}
                            className="font-medium text-foreground underline hover:no-underline"
                        >
                            {LEGAL_INFO.contactEmail}
                        </a>
                    </li>
                </ul>
            </section>

            <section id="changes">
                <h2 className="text-lg font-semibold text-foreground">10. 처리방침의 변경</h2>
                <p className="mt-2">
                    본 처리방침은 {LEGAL_INFO.effectiveDate}부터 시행합니다. 처리방침이 변경되는 경우 시행일 7일 전부터
                    서비스 화면에 공지합니다.
                </p>
            </section>
        </LegalPageLayout>
    );
}
