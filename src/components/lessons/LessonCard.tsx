// ============================================================
// LingoBite - Lesson Card Component
// ============================================================

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic, BookOpen, Target, Clock, BarChart3, ArrowRight,
  CheckCircle, Play
} from 'lucide-react';
import type { Lesson } from '@/types';

interface Props {
  lesson: Lesson;
  onClick: () => void;
  progress?: number;
}

const typeConfig = {
  pronunciation: {
    icon: Mic,
    color: 'bg-[#c9993f]/10 text-[#c9993f] border-[#c9993f]/20',
    badgeBg: 'bg-[#c9993f]/10 text-[#c9993f]',
    gradient: 'from-[#c9993f]/20 to-[#0d1b2a]/5',
  },
  vocabulary: {
    icon: BookOpen,
    color: 'bg-[#38a169]/10 text-[#38a169] border-[#38a169]/20',
    badgeBg: 'bg-[#38a169]/10 text-[#38a169]',
    gradient: 'from-[#38a169]/20 to-[#0d1b2a]/5',
  },
  grammar: {
    icon: Target,
    color: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20',
    badgeBg: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
    gradient: 'from-[#8b5cf6]/20 to-[#0d1b2a]/5',
  },
};

const LessonCard: React.FC<Props> = ({ lesson, onClick, progress = 0 }) => {
  const config = typeConfig[lesson.type];
  const Icon = config.icon;
  const itemCount = lesson.items.length;
  const hasProgress = progress > 0;

  return (
    <Card
      onClick={onClick}
      className="lb-card p-0 overflow-hidden cursor-pointer group"
    >
      {/* Top Gradient Banner */}
      <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
      
      <div className="p-5">
        {/* Type Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${config.badgeBg} border-0 text-xs capitalize font-medium`}>
            <Icon className="w-3 h-3 mr-1" />
            {lesson.type}
          </Badge>
          {hasProgress && progress === 100 && (
            <CheckCircle className="w-5 h-5 text-[#38a169]" />
          )}
        </div>

        {/* Title & Description */}
        <h3 className="font-serif text-lg font-bold text-[#0d1b2a] mb-1.5 group-hover:text-[#c9993f] transition-colors line-clamp-1">
          {lesson.title}
        </h3>
        <p className="text-sm text-[#0d1b2a]/50 mb-4 line-clamp-2 leading-relaxed">
          {lesson.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-[#0d1b2a]/40 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {itemCount} items
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~{itemCount * 3} min
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> {lesson.teacherName}
          </span>
        </div>

        {/* Progress or CTA */}
        {hasProgress ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#0d1b2a]/60">
                {progress === 100 ? 'Completed' : 'In Progress'}
              </span>
              <span className="text-xs font-bold text-[#c9993f]">{progress}%</span>
            </div>
            <div className="lb-progress-bar h-1.5">
              <div className="lb-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="lb-btn-gold py-2 px-4 text-xs flex items-center gap-1.5 group-hover:shadow-md transition-all">
              <Play className="w-3.5 h-3.5" /> Start Lesson
            </span>
            <ArrowRight className="w-4 h-4 text-[#0d1b2a]/20 group-hover:text-[#c9993f] group-hover:translate-x-1 transition-all" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default LessonCard;
