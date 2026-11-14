import React, { useState } from 'react';
import { X, BookOpen, Database, ShieldCheck, FileSpreadsheet, Building2, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { RAW_COMPLEX_DATA } from '../data/complexes';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { formatKRW, formatNumber } from '../utils/formatters';

interface Props {
  onClose: () => void;
}

// DART 사업보고서 및 시공능력평가 공시 지표 벤치마크 데이터
const COMPANY_FINANCIAL_BENCHMARKS: Record<
  string,
  {
    realReference: string;
    evalRank: string; // 시공능력평가 순위
    revenue2024: string; // 매출액
    debtRatio: string; // 부채비율
    cashEquivalents: string; // 현금성 자산
    orderBacklogHousing: string; // 주택 수주잔고
    creditGrade: string; // 신용등급
    sourceDate: string; // 공시 기준일
    modelConversionLogic: string; // 게임 능력치 변환 근거
  }
> = {
  taeseong: {
    realReference: '초우량 재무 · 브랜드 파워형',
    evalRank: '시공능력평가 1위 (2024 국토부 공시)',
    revenue2024: '연결 매출 19.3조원',
    debtRatio: '부채비율 58.4% (업계 최저 수준)',
    cashEquivalents: '현금 및 유동성 자산 약 3.2조원',
    orderBacklogHousing: '주택 수주잔고 약 12.8조원',
    creditGrade: 'AA+ (초우량)',
    sourceDate: '2024 사업보고서 및 2025 반기보고서 기준',
    modelConversionLogic:
      '국내 최고 신용등급(AA+)과 탄탄한 무차입성 재무구조를 반영하여 자금력 92, 브랜드 92, 시공 캐파 7.0조원을 부여했습니다. 무리한 출혈 경쟁을 기피하는 선별 수주 기조를 성향에 반영했습니다.',
  },
  hangang: {
    realReference: '매머드 랜드마크 · 최대 캐파형',
    evalRank: '시공능력평가 2위 (주택/토목 최대 캐파)',
    revenue2024: '연결 매출 32.5조원 (업계 최대 매출)',
    debtRatio: '부채비율 124.6%',
    cashEquivalents: '현금 및 유동성 자산 약 2.8조원',
    orderBacklogHousing: '주택 수주잔고 약 24.5조원',
    creditGrade: 'AA- (우량)',
    sourceDate: '2024 연결재무제표 및 2025 분기보고서 기준',
    modelConversionLogic:
      '업계 최대 시공 캐파와 거대한 현장 동원력을 반영해 시공 캐파 7.2조원, 초기 영업예산 330억원, 브랜드 88을 부여했습니다. 매머드 랜드마크 수주에 총력을 기울이는 공격적 베팅 성향을 반영했습니다.',
  },
  daeryuk: {
    realReference: '현장 기동 · 강력 영업조직형',
    evalRank: '시공능력평가 3위권',
    revenue2024: '연결 매출 11.6조원',
    debtRatio: '부채비율 176.8%',
    cashEquivalents: '현금 및 유동성 자산 약 1.4조원',
    orderBacklogHousing: '주택 수주잔고 약 18.2조원',
    creditGrade: 'A (안정적)',
    sourceDate: '2024 사업보고서 기준',
    modelConversionLogic:
      '국내 정비사업 역사상 가장 강력한 현장 OS 요원 조직력과 영업 돌파력을 보유한 특성을 반영해 영업 조직력 94, AP 6을 부여했습니다.',
  },
  mirae: {
    realReference: '주거 감성 · 금융 패키지형',
    evalRank: '시공능력평가 4~5위권',
    revenue2024: '연결 매출 13.4조원',
    debtRatio: '부채비율 245.2%',
    cashEquivalents: '현금 및 유동성 자산 약 1.6조원',
    orderBacklogHousing: '주택 수주잔고 약 15.6조원',
    creditGrade: 'A- (회복세)',
    sourceDate: '2024 사업보고서 기준',
    modelConversionLogic:
      '주택 시장에서 감성적 디자인과 대단지 특화 커뮤니티로 확고한 프리미엄을 다진 점을 감안해 브랜드 감성 89, 시공 캐파 5.8조원을 부여했습니다.',
  },
  jungwoo: {
    realReference: '클린 재무 · 원가 경쟁력 1위형',
    evalRank: '시공능력평가 5~6위권',
    revenue2024: '연결 매출 7.9조원',
    debtRatio: '부채비율 87.5% (순현금 상태 유지)',
    cashEquivalents: '현금 및 현금성 자산 약 2.1조원',
    orderBacklogHousing: '주택 수주잔고 약 13.1조원',
    creditGrade: 'AA- (우수)',
    sourceDate: '2024 사업보고서 기준',
    modelConversionLogic:
      '철저한 원가 절감력과 무차입 수준의 클린 재무를 자랑하는 특성을 반영해 원가 경쟁력 95(업계 1위), 자금력 85, 시공 캐파 5.4조원을 부여했습니다.',
  },
  sewon: {
    realReference: '파격 이주비 · 금융 솔루션형',
    evalRank: '시공능력평가 7위권',
    revenue2024: '연결 매출 10.1조원',
    debtRatio: '부채비율 132.4%',
    cashEquivalents: '현금성 자산 약 1.1조원',
    orderBacklogHousing: '주택 수주잔고 약 14.8조원',
    creditGrade: 'A+ (모그룹 지원 여력)',
    sourceDate: '2024 사업보고서 기준',
    modelConversionLogic:
      '모그룹의 탄탄한 신용도를 등에 업고 파격적인 LTV 이주비 지원, 무이자 사업비 대여 등 금융 솔루션으로 승부하는 특성을 반영해 금융조건 제안력 96(업계 1위)을 부여했습니다.',
  },
  dongbang: {
    realReference: '복합 개발 · 라이벌 견제형',
    evalRank: '시공능력평가 8위권',
    revenue2024: '연결 매출 6.8조원',
    debtRatio: '부채비율 214.8%',
    cashEquivalents: '현금성 자산 약 1.8조원 (유동성 확보)',
    orderBacklogHousing: '주택 수주잔고 약 11.2조원',
    creditGrade: 'A (유동성 안정화)',
    sourceDate: '2024 연결감사보고서 기준',
    modelConversionLogic:
      '복합 상업시설 개발 역량과 집요한 라이벌 마킹 성향을 반영하여 시공 캐파 4.8조원, 원가 82, 영업력 80을 부여했습니다.',
  },
  shinhwa: {
    realReference: '틈새 공략 · 고기동 실속형',
    evalRank: '시공능력평가 10위권',
    revenue2024: '연결 매출 4.2조원',
    debtRatio: '부채비율 142.1%',
    cashEquivalents: '현금성 자산 약 9,500억원',
    orderBacklogHousing: '주택 수주잔고 약 7.9조원',
    creditGrade: 'A- (안정적)',
    sourceDate: '2024 사업보고서 기준',
    modelConversionLogic:
      '대형사들의 틈새 시장을 파고들어 민첩하게 수주고를 올리는 기동력을 반영해 시공 캐파 4.2조원, 원가 88, 위험 감내력 88을 부여했습니다.',
  },
};

export const DataLabModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'COMPLEXES' | 'COMPANIES' | 'METHODOLOGY'>('COMPLEXES');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>('taeseong');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-pixel text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>재건축 데이터랩 & 산출 근거</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  DART & 정비계획 고시 기준
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('COMPLEXES')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-pixel transition-colors ${
              activeTab === 'COMPLEXES'
                ? 'bg-slate-900 text-sky-300 font-bold border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            15개 단지 정비계획 고시 데이터
          </button>
          <button
            onClick={() => setActiveTab('COMPANIES')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-pixel transition-colors ${
              activeTab === 'COMPANIES'
                ? 'bg-slate-900 text-sky-300 font-bold border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            8개 건설사 DART 재무제표 벤치마크
          </button>
          <button
            onClick={() => setActiveTab('METHODOLOGY')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-pixel transition-colors ${
              activeTab === 'METHODOLOGY'
                ? 'bg-slate-900 text-sky-300 font-bold border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            수익성 엔진 & 의사결정 수식
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'COMPLEXES' && (
            <div className="space-y-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                1~14단지는 서울 목동 신시가지 1~14단지의 2026년 정비계획 고시안 및 양천구청 정비사업 공개자료를 기반으로 하며,
                15단지는 중견사와 대형사의 역전 찬스 밸런스를 위해 설계된 가상 단지입니다. (게임 내 명칭은 구역이 아닌 '가온 1~15단지'로 일관 적용)
              </div>

              <div className="border border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2">단지명</th>
                      <th className="p-2">기존 세대</th>
                      <th className="p-2">계획 세대</th>
                      <th className="p-2">예상 공사비</th>
                      <th className="p-2">기준 마진</th>
                      <th className="p-2">특성 요약</th>
                      <th className="p-2">출처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {RAW_COMPLEX_DATA.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30">
                        <td className="p-2 font-bold text-white">{c.name}</td>
                        <td className="p-2">{formatNumber(c.originalUnits)}</td>
                        <td className="p-2 text-amber-300 font-bold">{formatNumber(c.plannedUnits)}</td>
                        <td className="p-2 text-emerald-400">{formatKRW(c.expectedCost)}</td>
                        <td className="p-2 text-purple-400">{c.baseExpectedProfitMargin}%</td>
                        <td className="p-2 text-slate-300 font-sans">{c.tagline}</td>
                        <td className="p-2 text-[10px] text-slate-500 font-sans">{c.dataSource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'COMPANIES' && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                각 건설사의 능력치(시공 캐파, 자금력, 신용도, 원가, 금융)는 DART 전자공시 사업보고서, 국토교통부 시공능력평가 공시 지표,
                그리고 정비사업 수주 실적을 충실히 참고하여 게임 밸런스에 맞게 계량화했습니다. (원 클릭으로 상세 벤치마크 확인 가능)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONSTRUCTION_COMPANIES.map((comp) => {
                  const bench = COMPANY_FINANCIAL_BENCHMARKS[comp.id];
                  const isExpanded = selectedCompanyId === comp.id;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompanyId(isExpanded ? null : comp.id)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-slate-900 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: comp.color }}
                          />
                          <span className="font-pixel text-sm font-bold text-white">{comp.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-sky-300 font-sans border border-slate-700/60">{bench?.realReference}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                            캐파 {formatKRW(comp.attributes.capa)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                        {comp.flavorDescription}
                      </div>

                      {/* Stats Overview */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center mb-2">
                        <div className="bg-slate-950 p-1 rounded border border-slate-800">
                          <span className="text-slate-500 block">브랜드</span>
                          <strong className="text-sky-400">{comp.attributes.brand}</strong>
                        </div>
                        <div className="bg-slate-950 p-1 rounded border border-slate-800">
                          <span className="text-slate-500 block">자금력</span>
                          <strong className="text-emerald-400">{comp.attributes.funds}</strong>
                        </div>
                        <div className="bg-slate-950 p-1 rounded border border-slate-800">
                          <span className="text-slate-500 block">원가</span>
                          <strong className="text-yellow-400">{comp.attributes.costComp}</strong>
                        </div>
                        <div className="bg-slate-950 p-1 rounded border border-slate-800">
                          <span className="text-slate-500 block">금융</span>
                          <strong className="text-purple-400">{comp.attributes.finance}</strong>
                        </div>
                      </div>

                      {/* Detailed Benchmark Drawer */}
                      {isExpanded && bench && (
                        <div className="pt-2.5 mt-2 border-t border-slate-800 space-y-1.5 text-[11px] font-sans bg-slate-950/70 p-2.5 rounded">
                          <div className="text-amber-400 font-pixel text-xs font-bold mb-1">
                            📊 DART 공시 재무지표 및 계량 모델 근거:
                          </div>
                          <div>
                            <span className="text-slate-500">시공능력:</span>{' '}
                            <strong className="text-slate-200">{bench.evalRank}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">매출 및 부채:</span>{' '}
                            <strong className="text-slate-200">
                              {bench.revenue2024} / {bench.debtRatio}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">현금성 자산:</span>{' '}
                            <strong className="text-emerald-400">{bench.cashEquivalents}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">주택 수주잔고:</span>{' '}
                            <strong className="text-sky-300">{bench.orderBacklogHousing}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">공시 기준일:</span>{' '}
                            <span className="text-slate-400 font-mono text-[10px]">{bench.sourceDate}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-slate-900">
                            <strong>게임 변환 모델:</strong> {bench.modelConversionLogic}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'METHODOLOGY' && (
            <div className="space-y-3 font-sans">
              <details className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 group" open>
                <summary className="font-pixel text-sm font-bold text-amber-400 cursor-pointer list-none flex items-center justify-between">
                  <span>1. 단일 수익성 계산 엔진 (Single Source of Truth Profit Engine)</span>
                  <span className="text-[10px] text-slate-500 font-mono group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 text-slate-300 leading-relaxed text-[11px] space-y-2">
                  <p>
                    모든 단지 수주전 및 최종 엔딩 평가는 동일한 9개 분리 항목으로 계산되며, 적자 발생 시 음수(-500억원)를 강제 0원 보정 없이 정직하게 표시합니다:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono p-2.5 rounded bg-slate-900 border border-slate-800">
                    <div>① 계약 공사비 (총 수주액)</div>
                    <div>② 직접 공사원가 (자재·노무·외주비)</div>
                    <div>③ 현장 간접비 (가설·감리비)</div>
                    <div>④ 본사 배부비 (설계·인허가비)</div>
                    <div>⑤ 금융비용 (LTV 이주비 지원이자)</div>
                    <div>⑥ 수주 영업비용 (제안서 실비 포함)</div>
                    <div>⑦ 위험조정 비용 (인플레·소송충당금)</div>
                    <div>⑧ 예상 영업이익 (①-②-③-④-⑤)</div>
                    <div className="sm:col-span-2 text-amber-300 font-bold">
                      ⑨ 위험조정 예상이익 = ⑧ 예상영업이익 - ⑥ 수주영업비용 - ⑦ 위험비용
                    </div>
                  </div>
                </div>
              </details>

              <details className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 group">
                <summary className="font-pixel text-sm font-bold text-sky-400 cursor-pointer list-none flex items-center justify-between">
                  <span>2. 경쟁사 AI 기대효용(Expected Utility) 및 연쇄 전력 재배치</span>
                  <span className="text-[10px] text-slate-500 font-mono group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 text-slate-300 leading-relaxed text-[11px] space-y-1.5">
                  <code>EU = P(win) × ExpectedProfit - Cost - OpportunityCost</code>
                  <p className="text-slate-400">
                    - 예상 승률 P(win)이 20% 미만으로 떨어지거나 압도적 1위에 밀릴 경우 경쟁사는 전략적 철수를 단행합니다.
                  </p>
                  <p className="text-slate-400">
                    - 철수한 인력과 영업예산은 자사의 다른 주력 타깃 단지로 즉시 전환 투입되어, 그 단지의 경쟁이 갑자기 치열해지는 <strong>연쇄 반응(Cascade Reaction)</strong>이 발생합니다.
                  </p>
                </div>
              </details>

              <details className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 group">
                <summary className="font-pixel text-sm font-bold text-emerald-400 cursor-pointer list-none flex items-center justify-between">
                  <span>3. 정비사업 시공사 선정 기준 법령 및 찬반투표 메커니즘</span>
                  <span className="text-[10px] text-slate-500 font-mono group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="pt-2 text-slate-300 leading-relaxed text-[11px] space-y-1">
                  <p>
                    <strong>1회차 단독 응찰:</strong> 도시 및 주거환경정비법 제29조에 따라 2개사 미달 시 자동 유찰 처리되며, 수의계약이 불가합니다.
                  </p>
                  <p>
                    <strong>2회차 이상 단독 응찰:</strong> 조합 총회에 수의계약 안건이 상정되며, 조합원 찬성률이 50% 이상이어야만 수의계약이 체결됩니다. 조건이 열악하거나 신뢰도가 낮으면 총회에서 부결됩니다.
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-pixel"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
