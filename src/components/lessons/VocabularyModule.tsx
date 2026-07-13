// ============================================================
// LingoBite - Vocabulary Module
// Context Fill-In + Image Canvas Annotation + MCQs
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Upload,
  Lightbulb, ImageIcon, Type, HelpCircle, MousePointerClick
} from 'lucide-react';
import type {
  Lesson, VocabularyFillInItem, VocabularyImageItem,
  VocabularyMCQItem, StudentSubmission, StudentAnnotation
} from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import PeerReviewPanel from '@/components/peer/PeerReviewPanel';

type VocabItem = VocabularyFillInItem | VocabularyImageItem | VocabularyMCQItem;

interface Props {
  lesson: Lesson;
  onComplete: (submission: Partial<StudentSubmission>) => void;
  onBack: () => void;
  teacherView?: boolean;
  existingSubmission?: StudentSubmission | null;
  onProgress?: (progress: number) => void;
  autoShowPeerReview?: boolean;
}

const VocabularyModule: React.FC<Props> = ({ lesson, onComplete, onBack: _onBack, teacherView: _teacherView, existingSubmission, onProgress, autoShowPeerReview }) => {
  const { user } = useAuth();
  const items = lesson.items as VocabItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState<Record<string, boolean>>({});
  const [imageAnnotations, setImageAnnotations] = useState<StudentAnnotation[]>([]);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [showPeerReview, setShowPeerReview] = useState(false);

  // Deep-linked here from a "someone commented" notification — auto-open
  // the peer review panel so the student can find (and report) it right away.
  useEffect(() => {
    if (autoShowPeerReview) setShowPeerReview(true);
  }, [autoShowPeerReview]);
  const imageRef = useRef<HTMLDivElement>(null);

  const [submission, setSubmission] = useState<Partial<StudentSubmission>>({
    studentId: user?.uid || '',
studentName: user?.displayName || '',
    studentEmail: user?.email || '',
    studentPhotoURL: user?.customAvatarUrl || user?.photoURL || undefined,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonType: 'vocabulary',
status: 'in_progress',
    startedAt: new Date(),
    maxScore: items.reduce((sum, item) => sum + (item.marks ?? 10), 0),
    answers: [],
    competenceFlags: [],
    flawFlags: [],
  });

  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  const handleFillInAnswer = (itemId: string, blankIdx: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [blankIdx]: value,
      },
    }));
  };

  const checkFillInAnswer = (item: VocabularyFillInItem) => {
    const studentAnswers = answers[item.id] || {};
    const results = item.correctAnswers.map((correct, idx) => {
      const student = studentAnswers[idx]?.toLowerCase().trim() || '';
      if (student === correct.toLowerCase()) return true;
      if (item.acceptableAnswers?.[idx]) {
        return item.acceptableAnswers[idx].some(a => a.toLowerCase() === student);
      }
      return false;
    });
    setShowResult(prev => ({ ...prev, [item.id]: true }));
    return results;
  };

  const handleMCQAnswer = (itemId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: optionIndex }));
    setShowResult(prev => ({ ...prev, [itemId]: true }));
  };

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newAnnotation: StudentAnnotation = {
      id: `sa_${Date.now()}`,
      x,
      y,
      label: `Label ${imageAnnotations.length + 1}`,
    };
    setImageAnnotations(prev => [...prev, newAnnotation]);
  }, [annotationMode, imageAnnotations.length]);

  const handleNext = () => {
    // Save current answer. Computed into a local variable (not just via
    // setSubmission) so the very last item's answer is guaranteed to be
    // included when we submit in this same call — reading `submission`
    // from the closure here would still hold the pre-update value, since
    // the setSubmission above hasn't been applied/re-rendered yet.
    let updatedAnswers = submission.answers || [];

    if (currentItem.type === 'vocab_fillin') {
      const fillItem = currentItem as VocabularyFillInItem;
      const studentAnswers = Object.values(answers[currentItem.id] || {}) as string[];
      const isCorrect = checkFillInAnswer(fillItem);
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'vocab_fillin' as const,
        itemOrder: currentItem.order,
        answers: studentAnswers,
        isCorrect,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    } else if (currentItem.type === 'vocab_mcq') {
      const mcqItem = currentItem as VocabularyMCQItem;
      const selectedIdx = answers[currentItem.id] as number;
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'vocab_mcq' as const,
        itemOrder: currentItem.order,
        selectedOptionIndex: selectedIdx,
        isCorrect: selectedIdx === mcqItem.correctOptionIndex,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    } else if (currentItem.type === 'vocab_image') {
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'vocab_image' as const,
        itemOrder: currentItem.order,
        annotations: imageAnnotations,
      };
      updatedAnswers = [...updatedAnswers.filter((a: any) => a.itemId !== currentItem.id), answerObj];
      setSubmission(prev => ({ ...prev, answers: updatedAnswers }));
    }

    if (isLastItem) {
      handleSubmit(updatedAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setAnnotationMode(false);
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
      case 'vocab_fillin': return <Type className="w-4 h-4" />;
      case 'vocab_image': return <ImageIcon className="w-4 h-4" />;
      case 'vocab_mcq': return <HelpCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'vocab_fillin': return 'Fill-In';
      case 'vocab_image': return 'Image Annotation';
      case 'vocab_mcq': return 'Multiple Choice';
      default: return type;
    }
  };

  const progress = Math.round(((currentIndex + (showResult[currentItem.id] ? 1 : 0)) / items.length) * 100);
  React.useEffect(() => { onProgress?.(progress); }, [progress, onProgress]);

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#38a169]/10 text-[#38a169] border-[#38a169]/30 font-medium">
              Vocabulary
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
                  : showResult[item.id]
                  ? 'bg-[#38a169] text-white'
                  : 'bg-white text-[#0d1b2a]/40 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
              title={getItemTypeLabel(item.type)}
            >
              {showResult[item.id] ? <CheckCircle className="w-5 h-5" /> : getItemIcon(item.type)}
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

        {/* Practice Card */}
        <Card className="lb-card p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getItemIcon(currentItem.type)} {getItemTypeLabel(currentItem.type)}
              </Badge>
              <span className="text-xs text-[#c9993f] font-semibold">Item {currentItem.order}</span>
            </div>
            <p className="text-lg text-[#0d1b2a] font-medium">{currentItem.instructions}</p>
          </div>

          {/* Fill-In Type */}
          {currentItem.type === 'vocab_fillin' && (
            <FillInSection
              item={currentItem as VocabularyFillInItem}
              answers={answers[currentItem.id] || {}}
              showResult={!!showResult[currentItem.id]}
              onAnswer={(blankIdx, val) => handleFillInAnswer(currentItem.id, blankIdx, val)}
              onCheck={() => checkFillInAnswer(currentItem as VocabularyFillInItem)}
            />
          )}

          {/* MCQ Type */}
          {currentItem.type === 'vocab_mcq' && (
            <MCQSection
              item={currentItem as VocabularyMCQItem}
              selectedAnswer={answers[currentItem.id] as number}
              showResult={!!showResult[currentItem.id]}
              onAnswer={(idx) => handleMCQAnswer(currentItem.id, idx)}
            />
          )}

          {/* Image Annotation Type */}
          {currentItem.type === 'vocab_image' && (
            <ImageAnnotationSection
              key={currentItem.id}
              item={currentItem as VocabularyImageItem}
              annotations={imageAnnotations}
              annotationMode={annotationMode}
              imageRef={imageRef}
              onToggleMode={() => setAnnotationMode(!annotationMode)}
              onImageClick={handleImageClick}
              onUpdateAnnotations={setImageAnnotations}
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
          <button onClick={handleNext} className="lb-btn-primary flex items-center gap-2">
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

const FillInSection: React.FC<{
  item: VocabularyFillInItem;
  answers: Record<number, string>;
  showResult: boolean;
  onAnswer: (blankIdx: number, val: string) => void;
  onCheck: () => void;
}> = ({ item, answers, showResult, onAnswer, onCheck }) => {
  const parts = item.sentenceTemplate.split('____');

  return (
    <div>
      <div className="bg-[#0d1b2a]/5 rounded-xl p-6 mb-6">
        <p className="text-sm text-[#0d1b2a]/50 mb-3">Complete the sentence:</p>
        <div className="flex flex-wrap items-center gap-2 text-lg leading-relaxed">
          {parts.map((part, idx) => (
            <React.Fragment key={idx}>
              <span className="text-[#0d1b2a]">{part}</span>
              {idx < parts.length - 1 && (
                <div className="relative inline-block">
                  <Input
                    value={answers[idx] || ''}
                    onChange={e => onAnswer(idx, e.target.value)}
                    disabled={showResult}
                    className={`w-32 sm:w-40 inline-block text-center font-semibold ${
                      showResult
                        ? answers[idx]?.toLowerCase().trim() === item.correctAnswers[idx].toLowerCase()
                          ? 'border-[#38a169] bg-[#38a169]/10 text-[#38a169]'
                          : 'border-red-400 bg-red-50 text-red-600'
                        : 'lb-input'
                    }`}
                    placeholder="___"
                  />
                  {showResult && (
                    <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                      {answers[idx]?.toLowerCase().trim() === item.correctAnswers[idx].toLowerCase() ? (
                        <CheckCircle className="w-5 h-5 text-[#38a169]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </span>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {showResult && (
          <div className="mt-4 p-3 bg-[#38a169]/10 rounded-lg">
            <p className="text-sm text-[#38a169] font-medium">
              Correct answer: {item.correctAnswers.join(', ')}
            </p>
          </div>
        )}
      </div>
      {!showResult && (
        <button onClick={onCheck} className="lb-btn-gold">
          Check Answer
        </button>
      )}
    </div>
  );
};

const MCQSection: React.FC<{
  item: VocabularyMCQItem;
  selectedAnswer?: number;
  showResult: boolean;
  onAnswer: (idx: number) => void;
}> = ({ item, selectedAnswer, showResult, onAnswer }) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-serif text-xl text-[#0d1b2a] mb-4">{item.question}</h3>
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
                    ? 'border-[#c9993f] bg-[#c9993f]/10'
                    : 'border-[#e5ddd0] hover:border-[#c9993f]/50'
                }`}
              >
                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} className="sr-only" />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  showCorrect ? 'border-[#38a169] bg-[#38a169]' :
                  showWrong ? 'border-red-400 bg-red-400' :
                  isSelected ? 'border-[#c9993f] bg-[#c9993f]' : 'border-[#e5ddd0]'
                }`}>
                  {(showCorrect || showWrong || isSelected) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-[#0d1b2a] font-medium">
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
        <div className="p-4 bg-[#c9993f]/10 rounded-xl border border-[#c9993f]/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-[#c9993f] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#0d1b2a]/80">{item.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageAnnotationSection: React.FC<{
  item: VocabularyImageItem;
  annotations: StudentAnnotation[];
  annotationMode: boolean;
  imageRef: React.RefObject<HTMLDivElement | null>;
  onToggleMode: () => void;
  onImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onUpdateAnnotations: (a: StudentAnnotation[]) => void;
}> = ({ item, annotations, annotationMode, imageRef, onToggleMode, onImageClick, onUpdateAnnotations }) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 10);

  const updateLabel = (id: string, newLabel: string) => {
    onUpdateAnnotations(
      annotations.map(a => a.id === id ? { ...a, label: newLabel } : a)
    );
  };

  const removeAnnotation = (id: string) => {
    onUpdateAnnotations(annotations.filter(a => a.id !== id));
    setSelectedAnnotation(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#0d1b2a]/60">
          {annotationMode
            ? 'Click on the image to place annotation markers'
            : 'Your annotations will appear on the image'}
        </p>
        <button
          onClick={onToggleMode}
          className={`lb-btn-${annotationMode ? 'primary' : 'gold'} flex items-center gap-2 text-xs`}
        >
          <MousePointerClick className="w-4 h-4" />
          {annotationMode ? 'Done Adding' : 'Add Annotations'}
        </button>
      </div>

      <div
        ref={imageRef}
        onClick={onImageClick}
        className={`relative rounded-xl overflow-hidden bg-[#0d1b2a] mb-4 mx-auto w-full ${
          annotationMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
        style={{ aspectRatio: `${aspectRatio}`, maxHeight: '520px' }}
      >
        <img
          src={item.imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=750&fit=crop'}
          alt="Annotation source"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          className="w-full h-full object-contain opacity-90"
        />

        {/* Correct annotations overlay (hint) */}
        {!annotationMode && item.annotations.map(ann => (
          <div
            key={ann.id}
            className="absolute group"
            style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-6 h-6 rounded-full bg-[#38a169] border-2 border-white shadow-md flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="lb-tooltip visible whitespace-nowrap">
                <p className="font-semibold">{ann.label}</p>
                {ann.description && <p className="opacity-80 mt-0.5">{ann.description}</p>}
              </div>
            </div>
          </div>
        ))}

        {/* Student annotations */}
        {annotations.map((ann, idx) => (
          <div
            key={ann.id}
            className="absolute"
            style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedAnnotation(selectedAnnotation === ann.id ? null : ann.id); }}
              className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${
                selectedAnnotation === ann.id ? 'bg-[#c9993f] text-[#0d1b2a]' : 'bg-[#0d1b2a] text-[#c9993f]'
              }`}
            >
              {idx + 1}
            </button>
            {selectedAnnotation === ann.id && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 bg-white rounded-xl shadow-xl p-3 w-48">
                <input
                  value={ann.label}
                  onChange={e => updateLabel(ann.id, e.target.value)}
                  className="w-full text-sm lb-input mb-2"
                  placeholder="Label..."
                  onClick={e => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {annotationMode && (
          <div className="absolute top-4 left-4 bg-[#0d1b2a]/80 text-[#faf6ef] px-3 py-1.5 rounded-lg text-xs font-medium">
            Click anywhere to add a label
          </div>
        )}
      </div>

      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#0d1b2a]">Your Annotations ({annotations.length})</p>
          <div className="flex flex-wrap gap-2">
            {annotations.map((ann, idx) => (
              <div key={ann.id} className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-[#e5ddd0] text-sm">
                <span className="w-5 h-5 rounded-full bg-[#0d1b2a] text-[#c9993f] text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="text-[#0d1b2a]">{ann.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyModule;
