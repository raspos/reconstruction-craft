import React, { useState } from 'react';
import { X, BookOpen, ExternalLink, Database, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { RAW_COMPLEX_DATA } from '../data/complexes';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { formatKRW, formatNumber } from '../utils/formatters';

interface Props {
  onClose: () => void;
}

export const DataLabModal: React.FC<Props> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'COMPLEXES' | 'COMPANIES' | 'METHODOLOGY'>('COMPLEXES');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-pixel text-base sm:text-lg font-bold text-white">
                재건축 데이터랩 & 산출 방법론 (Methodology)
              </h3>
              <p className="text-xs text-slate-400">
                실제 공공 정비계획 데이터 및 건설사 공시 자료 기반 시뮬레이션 모델
              </p>
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
            15개 단지 원자료 및 변환 모델
          </button>
          <button
            onClick={() => setActiveTab('COMPANIES')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-pixel transition-colors ${
              activeTab === 'COMPANIES'
                ? 'bg-slate-900 text-sky-300 font-bold border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            8개 건설사 재무·캐파 모델
          </button>
          <button
            onClick={() => setActiveTab('METHODOLOGY')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-pixel transition-colors ${
              activeTab === 'METHODOLOGY'
                ? 'bg-slate-900 text-sky-300 font-bold border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            수익성 및 AI 의사결정 수식
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'COMPLEXES' && (
            <div className="space-y-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                1~14단지는 서울 목동 신시가지 1~14단지의 2026년 정비계획 고시안 및 양천구청 자료를 기반으로 하며,
                15단지는 중견사와 대형사의 역전 찬스 밸런스를 위해 설계된 가상 단지입니다.
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
            <div className="space-y-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                국내 주요 8대 건설사(삼성물산, 현대건설, 대우건설, GS건설, DL이앤씨, 포스코이앤씨, 롯데건설, HDC현대산업개발)의
                사업보고서 및 시공능력평가 공시 지표를 토대로 게임 능력치를 가상화하여 부여했습니다.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONSTRUCTION_COMPANIES.map((comp) => (
                  <div key={comp.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-sm font-bold text-white">{comp.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        시공 캐파 {formatKRW(comp.attributes.capa)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{comp.flavorDescription}</div>
                    <div className="pt-1.5 border-t border-slate-900 grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                      <div className="bg-slate-900 p-1 rounded">브랜드 {comp.attributes.brand}</div>
                      <div className="bg-slate-900 p-1 rounded">자금력 {comp.attributes.funds}</div>
                      <div className="bg-slate-900 p-1 rounded">원가 {comp.attributes.costComp}</div>
                      <div className="bg-slate-900 p-1 rounded">금융 {comp.attributes.finance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'METHODOLOGY' && (
            <div className="space-y-3 font-sans">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-pixel text-sm font-bold text-amber-400">
                  1. 위험조정 예상 영업이익 산출 모델
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>위험조정 예상 영업이익 =</strong> 계약 공사비 - 직접 공사원가(78~82%) - 현장 간접비(6~8%) -
                  본사 배부비(4~5%) - 금융 비용(금리 연동) - 위험 충당금(단지별 1~7%) - 수주 영업비용
                </p>
                <p className="text-slate-400 text-[10px]">
                  * 단순히 공사비를 깎아 수주액을 늘릴 경우, 마진율이 1~2% 이하로 급락하여 [승자의 저주] 엔딩을 초래하도록 정밀 설계되었습니다.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-pixel text-sm font-bold text-sky-400">
                  2. 경쟁사 AI 기대효용(Expected Utility) 및 철수 알고리즘
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  AI는 매 턴 <code>EU = P(win) × ExpectedProfit - Cost - OpportunityCost</code> 수식에 의해 행동합니다.
                  상대방(플레이어 포함)이 75% 이상의 압도적 지지율을 확보하고 본인의 승률이 18% 미만으로 떨어질 경우,
                  자원 보존을 위해 과감하게 <strong>전략적 철수(Withdrawal)</strong>를 단행합니다.
                </p>
              </div>
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
