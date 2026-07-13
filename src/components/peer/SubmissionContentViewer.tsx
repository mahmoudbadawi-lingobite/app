// ============================================================
// LingoBite - Submission Content Viewer (Peer-Facing, Read-Only)
// Shows what a classmate actually submitted so a peer review is
// grounded in the real work, not just a name and a score.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getLessonById } from '@/lib/firebase';
import AnnotationImageViewer from '@/components/lessons/AnnotationImageViewer';
import type { Lesson, StudentSubmission, StudentAnswer } from '@/types';
import { CheckCircle, XCircle, Mic, BookOpen, Loader2, Volume2, BookOpenCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props {
  submission: StudentSubmission;
}

const SubmissionContentViewer: React.FC<Props> = ({ submission }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getLessonById(submission.lessonId);
        if (!cancelled) setLesson(data as Lesson);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [submission.lessonId]);

  const getAnswer = (itemId: string, order: number): StudentAnswer | undefined =>
    submission.answers?.find(a => a.itemId === itemId) ||
    submission.answers?.find(a => (a as any).itemOrder === order) ||
    submission.answers?.[order];

  if (loading) return (
    <Card className="lb-card p-8 flex items-center justify-center gap-2 text-[#0d1b2a]/40">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading their work...</span>
    </Card>
  );

  if (!lesson) return (
    <Card className="lb-card p-8 text-center text-[#0d1b2a]/40 text-sm">
      Lesson content not found.
    </Card>
  );

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="w-4 h-4 text-[#c9993f]" />
        <h3 className="text-sm font-semibold text-[#0d1b2a]">Their Submission</h3>
      </div>

      {lesson.type === 'reading' && lesson.readingPassage && (
        <Card className="lb-card overflow-hidden">
          <div className="bg-[#0d1b2a] px-5 py-3 flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-[#c9993f]" />
            <span className="text-xs font-medium text-[#faf6ef]/80 uppercase tracking-wider">Reading Passage</span>
          </div>
          <div className="p-5 space-y-3">
            {lesson.readingImageUrl && (
              <img
                src={lesson.readingImageUrl}
                alt="Passage illustration"
                className="w-full max-h-64 object-cover rounded-xl border border-[#e5ddd0]"
              />
            )}
            <p className="text-sm text-[#0d1b2a] leading-relaxed whitespace-pre-wrap">{lesson.readingPassage}</p>
          </div>
        </Card>
      )}

      {(lesson.items as any[]).map((item: any, idx: number) => {
        const answer = getAnswer(item.id, idx);
        return (
          <Card key={item.id} className="lb-card overflow-hidden">
            <div className="bg-[#0d1b2a] px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-[#faf6ef]/60 uppercase tracking-wider">
                Question {idx + 1}
              </span>
              <span className="text-xs text-[#c9993f] capitalize">
                {item.type?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-5 space-y-3">
              {/* GRAMMAR / VOCAB MCQ */}
              {(item.type === 'grammar_mcq' || item.type === 'vocab_mcq') && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.question}</p>
                  <div className="space-y-2">
                    {item.options?.map((opt: string, i: number) => {
                      const selected = (answer as any)?.selectedOptionIndex === i;
                      const isCorrect = i === item.correctOptionIndex;
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                          selected && isCorrect ? 'bg-green-50 border-green-300 text-green-800' :
                          selected && !isCorrect ? 'bg-red-50 border-red-300 text-red-700' :
                          'bg-[#faf6ef] border-[#e5ddd0] text-[#0d1b2a]/60'
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* FILL IN THE BLANK */}
              {item.type === 'vocab_fillin' && (
                <>
                  <p className="font-medium text-[#0d1b2a] mb-1">{item.contextText || item.sentence}</p>
                  <div className="space-y-2">
                    {item.blanks?.map((_: any, i: number) => {
                      const studentAns = (answer as any)?.answers?.[i] || '';
                      const correct = (answer as any)?.isCorrect?.[i];
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                          correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                        }`}>
                          <span className="text-xs text-[#0d1b2a]/50 w-16 flex-shrink-0">Blank {i + 1}:</span>
                          <span className={`font-medium flex-1 ${correct ? 'text-green-700' : 'text-red-600'}`}>
                            {studentAns || '(no answer)'}
                          </span>
                          {correct
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <XCircle className="w-4 h-4 text-red-500" />
                          }
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* VOCAB IMAGE ANNOTATION */}
              {item.type === 'vocab_image' && (
                <>
                  <AnnotationImageViewer
                    imageUrl={item.imageUrl}
                    studentMarkers={(answer as any)?.annotations}
                  />
                  {(answer as any)?.annotations?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {(answer as any).annotations.map((ann: any, i: number) => (
                        <span key={ann.id} className="text-xs px-2 py-1 rounded-lg bg-[#faf6ef] border border-[#e5ddd0] text-[#0d1b2a]/70">
                          {i + 1}. {ann.label || '(unlabeled)'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0d1b2a]/40 italic">No annotations placed.</p>
                  )}
                </>
              )}

              {/* GRAMMAR SENTENCE */}
              {item.type === 'grammar_sentence' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.prompt}</p>
                  {item.wordBank && (
                    <div className="flex flex-wrap gap-2">
                      {item.wordBank.map((w: string, i: number) => (
                        <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                          (answer as any)?.wordsUsed?.includes(w)
                            ? 'bg-[#0d1b2a] text-[#c9993f] border-[#0d1b2a]'
                            : 'bg-[#faf6ef] text-[#0d1b2a]/50 border-[#e5ddd0]'
                        }`}>
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
                    <p className="text-sm text-[#0d1b2a]">
                      {(answer as any)?.sentence || <span className="text-[#0d1b2a]/30 italic">No answer submitted</span>}
                    </p>
                  </div>
                </>
              )}

              {/* PRONUNCIATION */}
              {item.type === 'pronunciation' && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="w-4 h-4 text-[#c9993f]" />
                    <p className="font-medium text-[#0d1b2a]">{item.targetText || item.word}</p>
                  </div>
                  {(answer as any)?.recordedAudioUrl ? (
                    <audio src={(answer as any).recordedAudioUrl} controls className="w-full rounded-xl" />
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-[#0d1b2a]/40 bg-[#faf6ef] rounded-xl p-3">
                      <Mic className="w-4 h-4" />
                      No audio recorded
                    </div>
                  )}
                </>
              )}

              {/* READING MCQ */}
              {item.type === 'reading_mcq' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.question}</p>
                  <div className="space-y-2">
                    {item.options?.map((opt: string, i: number) => {
                      const selected = (answer as any)?.selectedOptionIndex === i;
                      const isCorrect = i === item.correctOptionIndex;
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                          selected && isCorrect ? 'bg-green-50 border-green-300 text-green-800' :
                          selected && !isCorrect ? 'bg-red-50 border-red-300 text-red-700' :
                          'bg-[#faf6ef] border-[#e5ddd0] text-[#0d1b2a]/60'
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* READING TRUE / FALSE */}
              {item.type === 'reading_tf' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.statement}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[true, false].map(val => {
                      const selected = (answer as any)?.selectedAnswer === val;
                      const isCorrect = val === item.correctAnswer;
                      return (
                        <div key={String(val)} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
                          selected && isCorrect ? 'bg-green-50 border-green-300 text-green-800' :
                          selected && !isCorrect ? 'bg-red-50 border-red-300 text-red-700' :
                          'bg-[#faf6ef] border-[#e5ddd0] text-[#0d1b2a]/60'
                        }`}>
                          {val ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                          {val ? 'True' : 'False'}
                          {selected && isCorrect && <CheckCircle className="w-4 h-4" />}
                          {selected && !isCorrect && <XCircle className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* READING ESSAY */}
              {item.type === 'reading_essay' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.prompt}</p>
                  <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
                    <p className="text-sm text-[#0d1b2a] whitespace-pre-wrap">
                      {(answer as any)?.response || <span className="text-[#0d1b2a]/30 italic">No answer submitted</span>}
                    </p>
                  </div>
                </>
              )}

              {/* READING SHORT ANSWER */}
              {item.type === 'reading_short_answer' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.question}</p>
                  <div className="bg-white rounded-xl border border-[#e5ddd0] p-4">
                    <p className="text-sm text-[#0d1b2a] whitespace-pre-wrap">
                      {(answer as any)?.response || <span className="text-[#0d1b2a]/30 italic">No answer submitted</span>}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SubmissionContentViewer;
