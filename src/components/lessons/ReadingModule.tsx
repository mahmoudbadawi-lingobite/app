// ============================================================
// LingoBite - Reading Comprehension Module
// Shared passage (+ optional image) followed by MCQ, True/False,
// Essay, and Short Answer questions
// ============================================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Upload,
  Lightbulb, HelpCircle, BookOpenCheck, PenLine, MessageCircleQuestion,
  ToggleLeft, ThumbsUp, ThumbsDown
} from 'lucide-react';
import type {
  Lesson, ReadingMCQItem, ReadingTrueFalseItem, ReadingEssayItem,
  ReadingShortAnswerItem, StudentSubmission
} from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import PeerReviewPanel from '@/components/peer/PeerReviewPanel';

type ReadingItem = ReadingMCQItem | ReadingTrueFalseItem | ReadingEssayItem | ReadingShortAnswerItem;

interface Props {
  lesson: Lesson;
  onComplete: (submission: Partial<StudentSubmission>) => void;
  onBack: () => void;
  teacherView?: boolean;
  existingSubmission?: StudentSubmission | null;
  onProgress?: (progress: number) => void;
  autoShowPeerReview?: boolean;
  highlightReviewId?: string;
}

const ReadingModule: React.FC<Props> = ({ lesson, onComplete, onBack: _onBack, teacherView: _teacherView, existingSubmission, onProgress, autoShowPeerReview, highlightReviewId }) => {
  const { user } = useAuth();
  const items = lesson.items as ReadingItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState<Record<string, boolean>>({});
  const [showPeerReview, setShowPeerReview] = useState(false);

  // Deep-linked here from a "someone commented" notification — auto-open
  // the peer review panel so the student can find (and report) it right away.
  useEffect(() => {
    if (autoShowPeerReview || highlightReviewId) setShowPeerReview(true);
  }, [autoShowPeerReview, highlightReviewId]);
  const [showPassage, setShowPassage] = useState(true);

  const [submission, setSubmission] = useState<Partial<StudentSubmission>>({
    studentId: user?.uid || '',
    studentName: user?.displayName || '',
    studentEmail: user?.email || '',
    studentPhotoURL: user?.customAvatarUrl || user?.photoURL || undefined,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonType: 'reading',
    status: 'in_progress',
    startedAt: new Date(),
    maxScore: items.reduce((sum, item) => sum + (item.marks ?? 1), 0),
    answers: [],
    competenceFlags: [],
    flawFlags: [],
  });

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  const handleMCQAnswer = (itemId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: optionIndex }));
    setShowResult(prev => ({ ...prev, [itemId]: true }));
  };

  const handleTFAnswer = (itemId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
    setShowResult(prev => ({ ...prev, [itemId]: true }));
  };

  const handleTextAnswer = (itemId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
  };

  const handleNext = () => {
    // Save current answer into a local variable (not just via setSubmission)
    // so the last item's answer is guaranteed to be included when we
    // submit within this same call.
    let updatedAnswers = submission.answers || [];

    if (currentItem.type === 'reading_mcq') {
      const mcqItem = currentItem as ReadingMCQItem;
      const selectedIdx = answers[currentItem.id] as number;
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'reading_mcq' as const,
        itemOrder: currentItem.order,
        selectedOptionIndex: selectedIdx,
        isCorrect: selectedIdx === mcqItem.correctOptionIndex,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    } else if (currentItem.type === 'reading_tf') {
      const tfItem = currentItem as ReadingTrueFalseItem;
      const selected = answers[currentItem.id] as boolean;
      setShowResult(prev => ({ ...prev, [currentItem.id]: true }));
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'reading_tf' as const,
        itemOrder: currentItem.order,
        selectedAnswer: selected,
        isCorrect: selected === tfItem.correctAnswer,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    } else if (currentItem.type === 'reading_essay') {
      const response = (answers[currentItem.id] as string) || '';
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'reading_essay' as const,
        itemOrder: currentItem.order,
        response,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    } else if (currentItem.type === 'reading_short_answer') {
      const response = (answers[currentItem.id] as string) || '';
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'reading_short_answer' as const,
        itemOrder: currentItem.order,
        response,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    }

    if (isLastItem) {
      handleSubmit(updatedAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = (finalAnswers?: typeof submission.answers) => {
    onComplete({
      ...submission,
      answers: finalAnswers ?? submission.answers,
      status: 'submitted',
      submittedAt: new Date(),
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'reading_mcq': return <HelpCircle className="w-4 h-4" />;
      case 'reading_tf': return <ToggleLeft className="w-4 h-4" />;
      case 'reading_essay': return <PenLine className="w-4 h-4" />;
      case 'reading_short_answer': return <MessageCircleQuestion className="w-4 h-4" />;
      default: return null;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'reading_mcq': return 'Multiple Choice';
      case 'reading_tf': return 'True / False';
      case 'reading_essay': return 'Essay';
      case 'reading_short_answer': return 'Short Answer';
      default: return type;
    }
  };

  const isAnswered = (item: ReadingItem) => {
    if (item.type === 'reading_mcq') return typeof answers[item.id] === 'number';
    if (item.type === 'reading_tf') return typeof answers[item.id] === 'boolean';
    return !!(answers[item.id] as string)?.trim();
  };

  const canAdvance = isAnswered(currentItem) || !!showResult[currentItem.id];

  const progress = Math.round(((currentIndex + (showResult[currentItem.id] || isAnswered(currentItem) ? 1 : 0)) / items.length) * 100);
  React.useEffect(() => { onProgress?.(progress); }, [progress, onProgress]);

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/30 font-medium">
              Reading
            </Badge>
            <span className="text-xs text-[#0d1b2a]/50">
              Item {currentIndex + 1} of {items.length}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0d1b2a] mb-2">
            {lesson.title}
          </h1>
          <p className="text-[#0d1b2a]/60 text-sm sm:text-base">{lesson.description}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                idx === currentIndex
                  ? 'bg-[#0d1b2a] text-[#c9993f] shadow-lg'
                  : showResult[item.id] || isAnswered(item)
                  ? 'bg-[#38a169] text-white'
                  : 'bg-white text-[#0d1b2a]/40 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
              title={getItemTypeLabel(item.type)}
            >
              {showResult[item.id] || isAnswered(item) ? <CheckCircle className="w-5 h-5" /> : getItemIcon(item.type)}
            </button>
          ))}
        </div>

        {/* YouTube Video */}
        {lesson.youtubeUrl && (
          <Card className="lb-card p-1 mb-6 overflow-hidden">
            <div className="aspect-video rounded-[1rem] overflow-hidden">
              <iframe
                src={lesson.youtubeUrl.includes('embed') ? lesson.youtubeUrl : lesson.youtubeUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
                title="Lesson video"
              />
            </div>
          </Card>
        )}

        {/* Reading Passage */}
        {lesson.readingPassage && (
          <Card className="lb-card mb-6 overflow-hidden">
            <button
              onClick={() => setShowPassage(!showPassage)}
              className="w-full flex items-center gap-2 px-6 py-4 bg-[#0d1b2a] text-left"
            >
              <BookOpenCheck className="w-4 h-4 text-[#c9993f] flex-shrink-0" />
              <span className="text-[#faf6ef] font-serif font-semibold flex-1">Reading Passage</span>
              {showPassage ? <ChevronLeft className="w-4 h-4 text-[#c9993f] rotate-90" /> : <ChevronRight className="w-4 h-4 text-[#c9993f] -rotate-90" />}
            </button>
            {showPassage && (
              <div className="p-6 space-y-4">
                {lesson.readingImageUrl && (
                  <img
                    src={lesson.readingImageUrl}
                    alt="Passage illustration"
                    className="w-full max-h-80 object-cover rounded-xl border border-[#e5ddd0]"
                  />
                )}
                <p className="text-[#0d1b2a] leading-relaxed whitespace-pre-wrap font-serif text-base sm:text-lg">
                  {lesson.readingPassage}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Practice Card */}
        <Card className="lb-card p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getItemIcon(currentItem.type)} {getItemTypeLabel(currentItem.type)}
              </Badge>
              <span className="text-xs text-[#c9993f] font-semibold">Item {currentItem.order}</span>
              <span className="text-xs text-[#0d1b2a]/40 ml-auto">
                {currentItem.marks ?? 1} {(currentItem.marks ?? 1) === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            {currentItem.instructions && (
              <p className="text-lg text-[#0d1b2a] font-medium">{currentItem.instructions}</p>
            )}
          </div>

          {/* MCQ Type */}
          {currentItem.type === 'reading_mcq' && (
            <ReadingMCQSection
              item={currentItem as ReadingMCQItem}
              selectedAnswer={answers[currentItem.id] as number}
              showResult={!!showResult[currentItem.id]}
              onAnswer={(idx) => handleMCQAnswer(currentItem.id, idx)}
            />
          )}

          {/* True / False Type */}
          {currentItem.type === 'reading_tf' && (
            <TrueFalseSection
              item={currentItem as ReadingTrueFalseItem}
              selectedAnswer={answers[currentItem.id] as boolean | undefined}
              showResult={!!showResult[currentItem.id]}
              onAnswer={(val) => handleTFAnswer(currentItem.id, val)}
            />
          )}

          {/* Essay Type */}
          {currentItem.type === 'reading_essay' && (
            <EssaySection
              item={currentItem as ReadingEssayItem}
              value={(answers[currentItem.id] as string) || ''}
              onChange={(val) => handleTextAnswer(currentItem.id, val)}
            />
          )}

          {/* Short Answer Type */}
          {currentItem.type === 'reading_short_answer' && (
            <ShortAnswerSection
              item={currentItem as ReadingShortAnswerItem}
              value={(answers[currentItem.id] as string) || ''}
              onChange={(val) => handleTextAnswer(currentItem.id, val)}
            />
          )}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="lb-btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-[#0d1b2a]/40 font-medium">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="lb-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastItem ? (
              <><Upload className="w-4 h-4" /> Submit</>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Peer Review Toggle */}
        {existingSubmission && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowPeerReview(!showPeerReview)}
              className="text-sm text-[#c9993f] hover:text-[#0d1b2a] font-medium transition-colors underline underline-offset-4"
            >
              {showPeerReview ? 'Hide' : 'View'} Peer Reviews
            </button>
          </div>
        )}

        {/* Peer Review Panel */}
        {showPeerReview && existingSubmission && (
          <div className="mt-6">
            <PeerReviewPanel
              submissionId={existingSubmission.id}
              submissionOwnerId={existingSubmission.studentId}
              lessonId={lesson.id}
              lessonTitle={existingSubmission.lessonTitle}
              highlightReviewId={highlightReviewId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

const ReadingMCQSection: React.FC<{
  item: ReadingMCQItem;
  selectedAnswer?: number;
  showResult: boolean;
  onAnswer: (idx: number) => void;
}> = ({ item, selectedAnswer, showResult, onAnswer }) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-serif text-xl sm:text-2xl text-[#0d1b2a] mb-4">{item.question}</h3>
        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={val => onAnswer(parseInt(val))}
          disabled={showResult}
          className="space-y-3"
        >
          {item.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === item.correctOptionIndex;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;

            return (
              <div
                key={idx}
                onClick={() => !showResult && onAnswer(idx)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  showCorrect
                    ? 'border-[#38a169] bg-[#38a169]/10'
                    : showWrong
                    ? 'border-red-400 bg-red-50'
                    : isSelected
                    ? 'border-[#2563eb] bg-[#2563eb]/10'
                    : 'border-[#e5ddd0] hover:border-[#2563eb]/50'
                }`}
              >
                <RadioGroupItem value={idx.toString()} id={`ropt-${idx}`} className="sr-only" />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  showCorrect ? 'border-[#38a169] bg-[#38a169]' :
                  showWrong ? 'border-red-400 bg-red-400' :
                  isSelected ? 'border-[#2563eb] bg-[#2563eb]' : 'border-[#e5ddd0]'
                }`}>
                  {(showCorrect || showWrong || isSelected) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <Label htmlFor={`ropt-${idx}`} className="flex-1 cursor-pointer text-[#0d1b2a] font-medium">
                  {option}
                </Label>
                {showCorrect && <CheckCircle className="w-5 h-5 text-[#38a169]" />}
                {showWrong && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            );
          })}
        </RadioGroup>
      </div>
      {showResult && item.explanation && (
        <div className="p-4 bg-[#2563eb]/10 rounded-xl border border-[#2563eb]/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0d1b2a]/80">{item.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const TrueFalseSection: React.FC<{
  item: ReadingTrueFalseItem;
  selectedAnswer?: boolean;
  showResult: boolean;
  onAnswer: (val: boolean) => void;
}> = ({ item, selectedAnswer, showResult, onAnswer }) => {
  return (
    <div>
      <h3 className="font-serif text-xl sm:text-2xl text-[#0d1b2a] mb-6">{item.statement}</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[true, false].map(val => {
          const isSelected = selectedAnswer === val;
          const isCorrect = val === item.correctAnswer;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;
          return (
            <button
              key={String(val)}
              onClick={() => !showResult && onAnswer(val)}
              disabled={showResult}
              className={`flex items-center justify-center gap-2 p-5 rounded-xl border-2 font-semibold text-lg transition-all duration-200 ${
                showCorrect
                  ? 'border-[#38a169] bg-[#38a169]/10 text-[#38a169]'
                  : showWrong
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : isSelected
                  ? 'border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]'
                  : 'border-[#e5ddd0] text-[#0d1b2a]/70 hover:border-[#2563eb]/50'
              }`}
            >
              {val ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
              {val ? 'True' : 'False'}
              {showCorrect && <CheckCircle className="w-5 h-5" />}
              {showWrong && <XCircle className="w-5 h-5" />}
            </button>
          );
        })}
      </div>
      {showResult && item.explanation && (
        <div className="p-4 bg-[#2563eb]/10 rounded-xl border border-[#2563eb]/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0d1b2a]/80">{item.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const EssaySection: React.FC<{
  item: ReadingEssayItem;
  value: string;
  onChange: (val: string) => void;
}> = ({ item, value, onChange }) => {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const minWords = item.minWordCount ?? 0;
  const hasMinWords = wordCount >= minWords;

  return (
    <div>
      <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a2d42] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <PenLine className="w-6 h-6 text-[#c9993f] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#faf6ef]/60 text-xs uppercase tracking-wider mb-1">Essay Prompt</p>
            <p className="text-[#faf6ef] font-serif text-xl leading-relaxed">{item.prompt}</p>
          </div>
        </div>
      </div>
      {item.guidance && (
        <div className="mb-4 p-3 bg-[#c9993f]/10 rounded-lg border border-[#c9993f]/20">
          <p className="text-xs text-[#0d1b2a]/70">{item.guidance}</p>
        </div>
      )}
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your essay response here..."
        rows={10}
        className="lb-input resize-y"
      />
      <p className={`text-xs mt-2 ${hasMinWords ? 'text-[#38a169]' : 'text-[#0d1b2a]/40'}`}>
        {wordCount} {minWords > 0 ? `/ ${minWords} min words` : 'words'}
      </p>
      <p className="text-xs text-[#0d1b2a]/40 mt-1">This question will be graded manually by your teacher.</p>
    </div>
  );
};

const ShortAnswerSection: React.FC<{
  item: ReadingShortAnswerItem;
  value: string;
  onChange: (val: string) => void;
}> = ({ item, value, onChange }) => {
  return (
    <div>
      <h3 className="font-serif text-xl sm:text-2xl text-[#0d1b2a] mb-4">{item.question}</h3>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your answer here..."
        rows={4}
        className="lb-input resize-y"
      />
      <p className="text-xs text-[#0d1b2a]/40 mt-2">This question will be graded manually by your teacher.</p>
    </div>
  );
};

export default ReadingModule;
