// ============================================================
// LingoBite - Gamified Badges & Achievement Dashboard
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Lock, Star, Flame, Crown, Target,
  TrendingUp, Zap, BookOpen, Mic, MessageCircle, ChevronLeft, BookOpenCheck
} from 'lucide-react';
import { BADGES, MOCK_STUDENT } from '@/lib/mockData';
import { useAuth } from '@/components/auth/AuthProvider';

interface Props {
  // When a teacher opens this from the Students list, these describe the
  // student being viewed instead of the signed-in user.
  student?: {
    uid: string;
    displayName: string | null;
    badges: string[];
    currentStreak: number;
  };
  onBack?: () => void;
}

const TIER_STYLES = {
  bronze: { bg: 'from-amber-700 to-amber-800', text: 'text-amber-700', border: 'border-amber-700/30', light: 'bg-amber-50' },
  silver: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-500', border: 'border-slate-400/30', light: 'bg-slate-50' },
  gold: { bg: 'from-yellow-400 to-yellow-500', text: 'text-yellow-500', border: 'border-yellow-400/30', light: 'bg-yellow-50' },
  platinum: { bg: 'from-purple-400 to-purple-600', text: 'text-purple-600', border: 'border-purple-400/30', light: 'bg-purple-50' },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  pronunciation: Mic,
  vocabulary: BookOpen,
  grammar: Target,
  reading: BookOpenCheck,
  engagement: MessageCircle,
  milestone: Crown,
};

const BadgeShowcase: React.FC<Props> = ({ student, onBack }) => {
  const { user } = useAuth();
  const earnedBadges = student ? student.badges : (user?.badges ?? MOCK_STUDENT.badges);
  const currentStreak = student ? student.currentStreak : (user?.currentStreak ?? MOCK_STUDENT.currentStreak);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredBadges = filterCategory === 'all'
    ? BADGES
    : BADGES.filter(b => b.category === filterCategory);

  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;
  const completionPercent = Math.round((earnedCount / totalCount) * 100);

  const stats = [
    { label: 'Earned', value: earnedCount, icon: Trophy, color: 'text-[#c9993f]' },
    { label: 'Total', value: totalCount, icon: Star, color: 'text-[#0d1b2a]' },
    { label: 'Completion', value: `${completionPercent}%`, icon: TrendingUp, color: 'text-[#38a169]' },
    { label: 'Current Streak', value: `${currentStreak} days`, icon: Flame, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="lb-btn-outline flex items-center gap-2 mb-6"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Students
            </button>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9993f] to-[#0d1b2a] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0d1b2a]">
                {student ? `${student.displayName || 'Student'}'s Achievements` : 'Achievements'}
              </h1>
              <p className="text-sm text-[#0d1b2a]/50">Unlock badges by completing lessons and engaging</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="lb-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-[#faf6ef] flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d1b2a]">{stat.value}</p>
                  <p className="text-xs text-[#0d1b2a]/50">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-6 bg-white rounded-[1.2rem] shadow-[0_4px_24px_rgba(13,27,42,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#0d1b2a]">Overall Progress</span>
            <span className="text-sm font-bold text-[#c9993f]">{completionPercent}%</span>
          </div>
          <div className="lb-progress-bar h-3">
            <div className="lb-progress-fill" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pronunciation', 'vocabulary', 'grammar', 'reading', 'engagement', 'milestone'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-[#0d1b2a] text-[#faf6ef]'
                  : 'bg-white text-[#0d1b2a]/60 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
            >
              {cat === 'all' ? 'All Badges' : cat}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            const tierStyle = TIER_STYLES[badge.tier];
            const CategoryIcon = CATEGORY_ICONS[badge.category] || Star;

            return (
              <Card
                key={badge.id}
                className={`lb-card p-5 transition-all duration-300 ${
                  isEarned ? '' : 'opacity-60 grayscale'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isEarned
                      ? `bg-gradient-to-br ${tierStyle.bg}`
                      : 'bg-[#e5ddd0]'
                  }`}>
                    {isEarned ? (
                      <Trophy className="w-7 h-7 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-[#0d1b2a]/30" />
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-[#0d1b2a] truncate ${isEarned ? '' : 'text-[#0d1b2a]/40'}`}>
                        {badge.name}
                      </h3>
                    </div>
                    <p className={`text-xs mb-2 ${isEarned ? 'text-[#0d1b2a]/60' : 'text-[#0d1b2a]/30'}`}>
                      {badge.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs capitalize ${tierStyle.light} ${tierStyle.text} border ${tierStyle.border}`}
                      >
                        {badge.tier}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {badge.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Achievement Tips */}
        <Card className="lb-card p-6 mt-8">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#c9993f] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-lg font-bold text-[#0d1b2a] mb-2">
                Tips to Earn More Badges
              </h3>
              <ul className="space-y-2 text-sm text-[#0d1b2a]/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9993f]" />
                  Complete at least one lesson daily to maintain your streak
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9993f]" />
                  Leave peer reviews on other students&apos; submissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9993f]" />
                  Aim for perfect scores on pronunciation exercises
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9993f]" />
                  Practice all three lesson types: pronunciation, vocabulary, and grammar
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BadgeShowcase;
