// ============================================================
// LingoBite - Grammar Module
// MCQs + Sentence Generation Spark with word bank
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Upload,
  Lightbulb, HelpCircle, Sparkles, Zap, RotateCcw, Wand2
} from 'lucide-react';
import type {
  Lesson, GrammarMCQItem, GrammarSentenceItem, StudentSubmission
} from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

type GrammarItem = GrammarMCQItem | GrammarSentenceItem;

interface Props {
  lesson: Lesson;
  onComplete: (submission: Partial<StudentSubmission>) => void;
  onBack: () => void;
  teacherView?: boolean;
  onProgress?: (progress: number) => void;
}

const GrammarModule: React.FC<Props> = ({ lesson, onComplete, onBack: _onBack, teacherView: _teacherView, onProgress }) => {
  const { user } = useAuth();
  const items = lesson.items as GrammarItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState<Record<string, boolean>>({});
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [customWord, setCustomWord] = useState('');
  const [sparkedSentence, setSparkedSentence] = useState('');

  const [submission, setSubmission] = useState<Partial<StudentSubmission>>({
    studentId: user?.uid || '',
    studentName: user?.displayName || '',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonType: 'grammar',
    status: 'in_progress',
    maxScore: items.reduce((sum, item) => sum + (item.type === 'grammar_mcq' ? 10 : 15), 0),
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

  const handleWordBankClick = (word: string) => {
    setSentenceWords(prev => [...prev, word]);
    setSparkedSentence(prev => prev ? `${prev} ${word}` : word);
  };

  const handleCustomWordAdd = () => {
    if (customWord.trim()) {
      setSentenceWords(prev => [...prev, customWord.trim()]);
      setSparkedSentence(prev => prev ? `${prev} ${customWord.trim()}` : customWord.trim());
      setCustomWord('');
    }
  };

  const handleSentenceSubmit = (itemId: string) => {
    setShowResult(prev => ({ ...prev, [itemId]: true }));
    setAnswers(prev => ({
      ...prev,
      [itemId]: {
        sentence: sparkedSentence,
        wordsUsed: sentenceWords,
      },
    }));
  };

  const handleResetSentence = () => {
    setSentenceWords([]);
    setSparkedSentence('');
  };

  const handleNext = () => {
    // Save current answer
    if (currentItem.type === 'grammar_mcq') {
      const mcqItem = currentItem as GrammarMCQItem;
      const selectedIdx = answers[currentItem.id] as number;
      const answerObj = {
        itemId: currentItem.id,
        itemType: 'grammar_mcq' as const,
        itemOrder: currentItem.order,
        selectedOptionIndex: selectedIdx,
        isCorrect: selectedIdx === mcqItem.correctOptionIndex,
      };
      setSubmission(prev => ({
        ...prev,
        answers: [...(prev.answers || []).filter((a: any) => a.itemId !== currentItem.id), answerObj],
      }));
    } else if (currentItem.type === 'grammar_sentence') {
      const ans = answers[currentItem.id] as { sentence: string; wordsUsed: string[] } | undefined;
      if (ans) {
        const answerObj = {
          itemId: currentItem.id,
          itemType: 'grammar_sentence' as const,
          itemOrder: currentItem.order,
          sentence: ans.sentence,
          wordsUsed: ans.wordsUsed,
        };
        setSubmission(prev => ({
          ...prev,
          answers: [...(prev.answers || []).filter((a: any) => a.itemId !== currentItem.id), answerObj],
        }));
      }
    }

    if (isLastItem) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
      setSentenceWords([]);
      setSparkedSentence('');
      setCustomWord('');
    }
  };

  const handleSubmit = () => {
    onComplete({
      ...submission,
      status: 'submitted',
      submittedAt: new Date(),
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'grammar_mcq': return <HelpCircle className="w-4 h-4" />;
      case 'grammar_sentence': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'grammar_mcq': return 'Multiple Choice';
      case 'grammar_sentence': return 'Sentence Spark';
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
            <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30 font-medium">
              Grammar
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
        <Card className="lb-card p-1 mb-6 overflow-hidden">
          <div className="aspect-video bg-[#0d1b2a] rounded-[1rem] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b2a] to-[#2d1a42]" />
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#8b5cf6] flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <p className="text-[#faf6ef]/80 text-sm font-medium">Grammar Instruction</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop"
              alt="Grammar lesson"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          </div>
        </Card>

        {/* Practice Card */}
        <Card className="lb-card p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getItemIcon(currentItem.type)} {getItemTypeLabel(currentItem.type)}
              </Badge>
              {currentItem.type === 'grammar_mcq' && (
                <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs">
                  {(currentItem as GrammarMCQItem).grammarRule}
                </Badge>
              )}
              <span className="text-xs text-[#c9993f] font-semibold">Item {currentItem.order}</span>
            </div>
            <p className="text-lg text-[#0d1b2a] font-medium">{currentItem.instructions}</p>
          </div>

          {/* MCQ Type */}
          {currentItem.type === 'grammar_mcq' && (
            <GrammarMCQSection
              item={currentItem as GrammarMCQItem}
              selectedAnswer={answers[currentItem.id] as number}
              showResult={!!showResult[currentItem.id]}
              onAnswer={(idx) => handleMCQAnswer(currentItem.id, idx)}
            />
          )}

          {/* Sentence Spark Type */}
          {currentItem.type === 'grammar_sentence' && (
            <SentenceSparkSection
              item={currentItem as GrammarSentenceItem}
              sentence={sparkedSentence}
              words={sentenceWords}
              customWord={customWord}
              showResult={!!showResult[currentItem.id]}
              onWordClick={handleWordBankClick}
              onCustomWordChange={setCustomWord}
              onCustomWordAdd={handleCustomWordAdd}
              onSubmit={() => handleSentenceSubmit(currentItem.id)}
              onReset={handleResetSentence}
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
      </div>
    </div>
  );
};

// --- Sub-components ---

const GrammarMCQSection: React.FC<{
  item: GrammarMCQItem;
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
                    ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                    : 'border-[#e5ddd0] hover:border-[#8b5cf6]/50'
                }`}
              >
                <RadioGroupItem value={idx.toString()} id={`gopt-${idx}`} className="sr-only" />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  showCorrect ? 'border-[#38a169] bg-[#38a169]' :
                  showWrong ? 'border-red-400 bg-red-400' :
                  isSelected ? 'border-[#8b5cf6] bg-[#8b5cf6]' : 'border-[#e5ddd0]'
                }`}>
                  {(showCorrect || showWrong || isSelected) && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <Label htmlFor={`gopt-${idx}`} className="flex-1 cursor-pointer text-[#0d1b2a] font-medium">
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
        <div className="p-4 bg-[#8b5cf6]/10 rounded-xl border border-[#8b5cf6]/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-[#8b5cf6] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[#0d1b2a]/80 font-medium mb-1">{item.explanation}</p>
              {item.grammarRule && (
                <p className="text-xs text-[#8b5cf6]">Rule: {item.grammarRule}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SentenceSparkSection: React.FC<{
  item: GrammarSentenceItem;
  sentence: string;
  words: string[];
  customWord: string;
  showResult: boolean;
  onWordClick: (word: string) => void;
  onCustomWordChange: (val: string) => void;
  onCustomWordAdd: () => void;
  onSubmit: () => void;
  onReset: () => void;
}> = ({
  item, sentence, words, customWord, showResult,
  onWordClick, onCustomWordChange, onCustomWordAdd, onSubmit, onReset
}) => {
  const wordCount = sentence.trim().split(/\s+/).filter(Boolean).length;
  const hasMinWords = wordCount >= item.minWordCount;

  return (
    <div>
      {/* Prompt */}
      <div className="bg-gradient-to-r from-[#0d1b2a] to-[#1a2d42] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <Wand2 className="w-6 h-6 text-[#c9993f] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#faf6ef]/60 text-xs uppercase tracking-wider mb-1">Sentence Spark Prompt</p>
            <p className="text-[#faf6ef] font-serif text-xl leading-relaxed">{item.prompt}</p>
          </div>
        </div>
      </div>

      {/* Grammar Rule Badge */}
      <div className="mb-4">
        <Badge className="bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20">
          Target Grammar: {item.targetGrammarRule}
        </Badge>
      </div>

      {/* Word Bank */}
      {!showResult && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#0d1b2a] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c9993f]" /> Word Bank (click to use)
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {item.wordBank.map((word, idx) => {
              const used = words.filter(w => w === word).length;
              const maxUses = item.wordBank.filter(w => w === word).length;
              const isDepleted = used >= maxUses;
              return (
                <button
                  key={idx}
                  onClick={() => !isDepleted && onWordClick(word)}
                  disabled={isDepleted}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDepleted
                      ? 'bg-[#e5ddd0] text-[#0d1b2a]/30 cursor-not-allowed'
                      : 'bg-white border-2 border-[#c9993f]/30 text-[#0d1b2a] hover:bg-[#c9993f] hover:text-[#0d1b2a] hover:border-[#c9993f]'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
          
          {/* Custom Word Input */}
          <div className="flex gap-2">
            <Input
              value={customWord}
              onChange={e => onCustomWordChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onCustomWordAdd()}
              placeholder="Add your own word..."
              className="lb-input flex-1"
            />
            <button onClick={onCustomWordAdd} className="lb-btn-outline px-4">
              Add
            </button>
            <button onClick={onReset} className="lb-btn-outline px-3 text-red-500 border-red-300 hover:bg-red-50">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sentence Builder */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[#0d1b2a] mb-2">
          Your Sentence
          <span className="text-xs font-normal text-[#0d1b2a]/50 ml-2">
            ({wordCount}/{item.minWordCount} min words)
          </span>
        </p>
        <div className={`min-h-[80px] rounded-xl p-4 border-2 transition-all ${
          showResult
            ? hasMinWords
              ? 'border-[#38a169] bg-[#38a169]/5'
              : 'border-red-400 bg-red-50'
            : sentence
            ? 'border-[#c9993f] bg-white'
            : 'border-dashed border-[#e5ddd0] bg-[#faf6ef]'
        }`}>
          {sentence ? (
            <p className="text-[#0d1b2a] text-lg leading-relaxed font-serif">{sentence}</p>
          ) : (
            <p className="text-[#0d1b2a]/30 text-sm italic">Your sentence will appear here as you build it...</p>
          )}
        </div>
        {showResult && item.exampleAnswer && (
          <div className="mt-3 p-3 bg-[#c9993f]/10 rounded-lg">
            <p className="text-xs text-[#0d1b2a]/60 mb-1">Example answer:</p>
            <p className="text-sm text-[#0d1b2a] italic">{item.exampleAnswer}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!showResult && (
        <button
          onClick={onSubmit}
          disabled={!hasMinWords}
          className={`lb-btn-primary flex items-center gap-2 ${!hasMinWords ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CheckCircle className="w-4 h-4" /> Submit Sentence
        </button>
      )}
    </div>
  );
};

export default GrammarModule;
