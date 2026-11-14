import React, { useState } from 'react';
import { CommunityPost, ComplexData } from '../types/game';
import {
  X,
  MessageSquare,
  ThumbsUp,
  Flame,
  ShieldAlert,
  Sparkles,
  Filter,
  Users,
  Building,
} from 'lucide-react';

interface VirtualCommunityModalProps {
  posts: CommunityPost[];
  complexes: ComplexData[];
  currentTurn: number;
  onClose: () => void;
}

export const VirtualCommunityModal: React.FC<VirtualCommunityModalProps> = ({
  posts,
  complexes,
  currentTurn,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'BRAND' | 'PRAGMATIC' | 'FLOATING'>('ALL');
  const [selectedComplexId, setSelectedComplexId] = useState<number | 'ALL'>('ALL');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const complexMap = new Map(complexes.map((c) => [c.id, c.name]));

  const filteredPosts = posts.filter((p) => {
    if (selectedGroup !== 'ALL' && p.voterGroup !== selectedGroup) return false;
    if (selectedComplexId !== 'ALL' && p.complexId !== selectedComplexId) return false;
    return true;
  });

  const handleLike = (id: string) => {
    setLikeCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const getBadgeStyle = (badge: CommunityPost['authorBadge']) => {
    switch (badge) {
      case '대의원':
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
      case '동대표':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case '부동산소장':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case '조합원':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getGroupIcon = (group: CommunityPost['voterGroup']) => {
    switch (group) {
      case 'BRAND':
        return <Sparkles className="w-3 h-3 text-amber-400" />;
      case 'PRAGMATIC':
        return <Flame className="w-3 h-3 text-cyan-400" />;
      case 'FLOATING':
        return <Users className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  가온 주민 소통방 (가온톡)
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  실시간 턴 {currentTurn}
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

        {/* 필터 탭 */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedGroup === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setSelectedGroup('BRAND')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                selectedGroup === 'BRAND'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> 브랜드파
            </button>
            <button
              onClick={() => setSelectedGroup('PRAGMATIC')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                selectedGroup === 'PRAGMATIC'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-cyan-400" /> 실리파
            </button>
            <button
              onClick={() => setSelectedGroup('FLOATING')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                selectedGroup === 'FLOATING'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3 h-3 text-slate-400" /> 부동층
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedComplexId}
              onChange={(e) =>
                setSelectedComplexId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">모든 단지</option>
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-950/40">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              조건에 맞는 소통방 게시글이 없습니다.
            </div>
          ) : (
            filteredPosts.map((post) => {
              const complexName = post.complexId ? complexMap.get(post.complexId) : null;
              const currentLikes = post.likes + (likeCounts[post.id] || 0);

              return (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  {/* 상단 메타 */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getBadgeStyle(
                          post.authorBadge
                        )}`}
                      >
                        {post.authorBadge}
                      </span>
                      <span className="font-semibold text-slate-200">{post.authorNickname}</span>
                      {complexName && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {complexName}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        {getGroupIcon(post.voterGroup)}
                        <span>{post.voterGroup}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.isVocalMinority && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          목소리 큰 소수 의견
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{post.turn}턴 전</span>
                    </div>
                  </div>

                  {/* 본문 내용 */}
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {/* 하단 좋아요 & 반응 */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-[10px] text-slate-400">
                      {post.isVocalMinority
                        ? '※ 댓글 여론과 실제 총회 비밀투표 표심 사이에는 괴리가 있을 수 있습니다.'
                        : '※ 단지 내 대다수 주민들의 보편적 정서가 반영된 글입니다.'}
                    </span>
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>공감 {currentLikes}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400">
            소통방의 과열된 홍보전은 <span className="text-amber-400 font-semibold">홍보 피로도</span>를 유발하여 부동층의 이탈을 부를 수 있습니다.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
