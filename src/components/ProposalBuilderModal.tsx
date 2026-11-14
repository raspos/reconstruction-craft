import React, { useState, useMemo } from 'react';
import {
  ComplexData,
  CompanyData,
  BidProposal,
} from '../types/game';
import {
  DEFAULT_STANDARD_PROPOSAL,
  evaluateProposal,
} from '../engine/proposalEngine';
import {
  X,
  FileCheck2,
  AlertTriangle,
  Building,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Coins,
  Scale,
  Users2,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface ProposalBuilderModalProps {
  complex: ComplexData;
  playerCompany: CompanyData;
  allCompanies: CompanyData[];
  existingProposal?: BidProposal;
  consortiumPartnerId?: string | null;
  onClose: () => void;
  onSubmit: (proposal: BidProposal, consortiumPartnerId?: string | null) => void;
}

export const ProposalBuilderModal: React.FC<ProposalBuilderModalProps> = ({
  complex,
  playerCompany,
  allCompanies,
  existingProposal,
  consortiumPartnerId: initialPartnerId,
  onClose,
  onSubmit,
}) => {
  const [proposal, setProposal] = useState<BidProposal>(
    existingProposal || { ...DEFAULT_STANDARD_PROPOSAL }
  );

  const [partnerId, setPartnerId] = useState<string | null>(initialPartnerId || null);

  const consortiumAllowed = complex.biddingRules.consortiumAllowed;

  // 실시간 제안서 손익·위험도 평가
  const evalResult = useMemo(() => {
    return evaluateProposal(proposal, complex, playerCompany);
  }, [proposal, complex, playerCompany]);

  const updateField = <K extends keyof BidProposal>(field: K, value: BidProposal[K]) => {
    setProposal((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(proposal, partnerId);
  };

  // 가능한 컨소시엄 후보사 (플레이어 제외)
  const candidatePartners = allCompanies.filter((c) => c.id !== playerCompany.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  [{complex.name}] 입찰 제안서 작성
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                  공사비 {(complex.expectedCost / 10000).toFixed(1)}조원
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단 실시간 평가 HUD */}
        <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          {/* 마진율 */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              예상 영업이익률
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-xl font-black ${
                  evalResult.effectiveMarginPercent <= 1.8
                    ? 'text-red-400'
                    : evalResult.effectiveMarginPercent <= 3.5
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {evalResult.effectiveMarginPercent}%
              </span>
              <span className="text-[10px] text-slate-500">
                (기본: {complex.baseExpectedProfitMargin}%)
              </span>
            </div>
          </div>

          {/* CFO 승인 지수 */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              CFO 승인 지수
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-xl font-black ${
                  evalResult.cfoApprovalScore <= 40 ? 'text-red-400' : 'text-blue-400'
                }`}
              >
                {evalResult.cfoApprovalScore}점
              </span>
              <span className="text-[10px] text-slate-500">
                {evalResult.cfoApprovalScore <= 35 ? '위험 (제동)' : '승인 권고'}
              </span>
            </div>
          </div>

          {/* 브랜드 충성파 호응 */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              브랜드파 호응
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-400">
                {evalResult.brandLoyalistAppeal}점
              </span>
              <span className="text-[10px] text-slate-500">
                비중 {complex.voterSegments.brandLoyalistRatio}%
              </span>
            </div>
          </div>

          {/* 실리파 호응 */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              실리파 호응
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-cyan-400">
                {evalResult.pragmatistAppeal}점
              </span>
              <span className="text-[10px] text-slate-500">
                비중 {complex.voterSegments.pragmatistRatio}%
              </span>
            </div>
          </div>
        </div>

        {/* CFO 경고 배너 */}
        {evalResult.cfoWarningMessage && (
          <div className="px-5 py-2.5 bg-red-950/40 border-b border-red-800/60 flex items-center gap-2 text-red-300 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">{evalResult.cfoWarningMessage}</span>
          </div>
        )}

        {/* 본문 스크롤 영역 (11대 옵션) */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1 text-slate-200 text-sm">
          {/* 1. 컨소시엄 구성 여부 */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white">1. 컨소시엄 (공동도급) 구성</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                  consortiumAllowed
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                    : 'bg-red-900/60 text-red-300 border border-red-700/50'
                }`}
              >
                {consortiumAllowed ? '조합 규정: 컨소시엄 허용' : '조합 규정: 단독 입찰 필수 (컨소시엄 금지)'}
              </span>
            </div>

            {consortiumAllowed ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPartnerId(null)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    partnerId === null
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">단독 응찰</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">브랜드 단독 프리미엄 보존</div>
                </button>

                {candidatePartners.slice(0, 3).map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setPartnerId(comp.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      partnerId === comp.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{comp.name} 연대</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">지분 50:50 / 리스크 분산</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">
                이 단지는 조합 정관상 컨소시엄 시공을 금지하고 있습니다. 단독 입찰로만 응찰 가능합니다.
              </p>
            )}
          </div>

          {/* 11대 레버 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. 브랜드 티어 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                2. 브랜드 티어 적용
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['STANDARD', 'PREMIUM', 'HIGH_END'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => updateField('brandTier', tier)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.brandTier === tier
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tier === 'HIGH_END' ? '하이엔드 독점' : tier === 'PREMIUM' ? '프리미엄' : '일반 브랜드'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.brandTier === 'HIGH_END'
                  ? '최상위 럭셔리 브랜드 적용 (브랜드 호감도 대폭 상승, 마진 -0.5%p)'
                  : proposal.brandTier === 'PREMIUM'
                  ? '표준 프리미엄 브랜드 적용'
                  : '기본 브랜드 적용 (원가 절감, 브랜드파 감점)'}
              </p>
            </div>

            {/* 3. 천장고 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                3. 실내 천장고 높이
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([2.5, 2.6, 2.7] as const).map((height) => (
                  <button
                    key={height}
                    type="button"
                    onClick={() => updateField('ceilingHeight', height)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.ceilingHeight === height
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {height}m
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.ceilingHeight === 2.7
                  ? '펜트하우스급 개방감 (마진 -0.6%p, 인허가 재심의 리스크 +10%)'
                  : proposal.ceilingHeight === 2.6
                  ? '고급 아파트 우대 규격 (마진 -0.3%p)'
                  : '표준 2.5m 우물천장'}
              </p>
            </div>

            {/* 4. 외관 디자인 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                4. 외관 디자인 및 스카이라인
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['STANDARD', 'CURTAIN_WALL', 'SPECIALIZED', 'LANDMARK'] as const).map((facade) => (
                  <button
                    key={facade}
                    type="button"
                    onClick={() => updateField('facade', facade)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.facade === facade
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {facade === 'LANDMARK'
                      ? '스카이브릿지·랜드마크'
                      : facade === 'SPECIALIZED'
                      ? '입체 입면 특화'
                      : facade === 'CURTAIN_WALL'
                      ? '커튼월룩'
                      : '표준 입면'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.facade === 'LANDMARK'
                  ? '동간 스카이브릿지 설치로 가온 전체의 랜드마크 등극 (마진 -0.8%p)'
                  : '도심 외관 심의에 적합한 디자인'}
              </p>
            </div>

            {/* 5. 공사비 할인 (덤핑 여부) */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center justify-between">
                <span>5. 3.3㎡당 공사비 인하 조건</span>
                {proposal.costDiscount === 'DUMPING' && (
                  <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> CFO 극대노
                  </span>
                )}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['NONE', 'SMALL', 'AGGRESSIVE', 'DUMPING'] as const).map((disc) => (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => updateField('costDiscount', disc)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.costDiscount === disc
                        ? disc === 'DUMPING'
                          ? 'bg-red-500/20 border-red-500 text-red-300 font-semibold'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {disc === 'NONE' ? '정가(0%)' : disc === 'SMALL' ? '-3%' : disc === 'AGGRESSIVE' ? '-7%' : '덤핑(-12%)'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.costDiscount === 'DUMPING'
                  ? '실리파 표심 싹쓸이(+35점), 그러나 마진 3.5%p 파괴로 적자 위험'
                  : proposal.costDiscount === 'AGGRESSIVE'
                  ? '공격적 인하로 실리파 우호 지분 확보'
                  : '적정 이윤 방어 중심'}
              </p>
            </div>

            {/* 6. 금융 패키지 (이주비 / LTV) */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                6. 이주비 및 사업비 금융지원
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['STANDARD', 'PREFERENTIAL', 'RADICAL_LTV'] as const).map((fin) => (
                  <button
                    key={fin}
                    type="button"
                    onClick={() => updateField('financePackage', fin)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.financePackage === fin
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {fin === 'RADICAL_LTV' ? 'LTV 100% 무이자' : fin === 'PREFERENTIAL' ? '우대금리 80%' : '표준 LTV 50%'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.financePackage === 'RADICAL_LTV'
                  ? '무이자 대여로 초기 금융 부담 급증(현금 수백억원 묶임), 실리파 대환호'
                  : '표준 금융 조달'}
              </p>
            </div>

            {/* 7. 물가변동 에스컬레이션 리스크 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                7. 물가 상승(자재비) 변동 부담
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['STANDARD', 'PARTIAL_RISK', 'FULL_BUILDER_RISK'] as const).map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => updateField('escalationRisk', risk)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.escalationRisk === risk
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {risk === 'FULL_BUILDER_RISK' ? '시공사 100% 부담' : risk === 'PARTIAL_RISK' ? '50% 절충' : '물가 연동(조합)'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {proposal.escalationRisk === 'FULL_BUILDER_RISK'
                  ? '착공 후 원자재 폭등 시 계약의 덫 위험 증가'
                  : '표준 물가상승분 실비 반영'}
              </p>
            </div>

            {/* 8. 커뮤니티 시설 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                8. 커뮤니티 특화 시설
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['BASIC', 'PREMIUM', 'SUPER_LUXURY'] as const).map((comm) => (
                  <button
                    key={comm}
                    type="button"
                    onClick={() => updateField('community', comm)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.community === comm
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {comm === 'SUPER_LUXURY' ? '인피니티풀·조식' : comm === 'PREMIUM' ? '사우나·골프존' : '기본 피트니스'}
                  </button>
                ))}
              </div>
            </div>

            {/* 9. 주차장 환경 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                9. 지하 주차장 대수 및 스마트 관제
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['BASIC', 'EXTENDED', 'SMART'] as const).map((park) => (
                  <button
                    key={park}
                    type="button"
                    onClick={() => updateField('parking', park)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.parking === park
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {park === 'SMART' ? 'AI 로봇 광폭 1.8대' : park === 'EXTENDED' ? '광폭 1.6대' : '법정 1.3대'}
                  </button>
                ))}
              </div>
            </div>

            {/* 10. 공사 기간 단축 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                10. 공사 기간 (공기) 단축
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['STANDARD', 'MINUS_4', 'MINUS_8'] as const).map((sch) => (
                  <button
                    key={sch}
                    type="button"
                    onClick={() => updateField('scheduleMonths', sch)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.scheduleMonths === sch
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {sch === 'MINUS_8' ? '8개월 단축 (돌관)' : sch === 'MINUS_4' ? '4개월 조기 완공' : '표준 공기'}
                  </button>
                ))}
              </div>
            </div>

            {/* 11. 설계 특화 */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                11. 설계 파트너 및 건축가 티어
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['BASIC', 'FAMOUS', 'GLOBAL_TOP'] as const).map((arch) => (
                  <button
                    key={arch}
                    type="button"
                    onClick={() => updateField('architectTier', arch)}
                    className={`p-2 rounded text-xs border text-center transition-all ${
                      proposal.architectTier === arch
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {arch === 'GLOBAL_TOP' ? '해외 거장 건축가' : arch === 'FAMOUS' ? '국내 1위 설계사' : '사내 표준 설계'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 푸터 (비용 안내 & 제출 버튼) */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>제안서 실비 소멸비용:</span>
            <span className="font-semibold text-white font-mono">
              {complex.biddingRules.proposalPrepCost}억원
            </span>
            <span className="text-slate-500">|</span>
            <span>입찰 보증금:</span>
            <span className="font-semibold text-white font-mono">
              {complex.biddingRules.bidDepositAmount}억원
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4" />
              입찰 제안서 날인 및 공식 접수
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
