// ============================================================
// LingoBite - Submission Review (Teacher Read-Only View)
// Shows full lesson questions alongside student answers
// ============================================================

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLessonById } from '@/lib/firebase';
import type { Lesson, StudentSubmission, StudentAnswer } from '@/types';
import {
  CheckCircle, XCircle, Mic, BookOpen, Loader2,
  MessageSquare, Volume2
} from 'lucide-react';

interface Props {
  submission: StudentSubmission;
}

const SubmissionReview: React.FC<Props> = ({ submission }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getLessonById(submission.lessonId);
        setLesson(data as Lesson);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [submission.lessonId]);

  const getAnswer = (itemId: string, order: number): StudentAnswer | undefined =>
    submission.answers?.find(a => a.itemId === itemId) ||
    submission.answers?.find(a => (a as any).itemOrder === order) ||
    submission.answers?.[order];

  if (loading) return (
    <div className="flex items-center justify-center py-10 gap-2 text-[#0d1b2a]/40">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading lesson...</span>
    </div>
  );

  if (!lesson) return (
    <div className="text-center py-8 text-[#0d1b2a]/40 text-sm">
      Lesson data not found.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-[#c9993f]" />
        <h3 className="text-sm font-semibold text-[#0d1b2a]">
          {lesson.title} — Student Responses
        </h3>
        <Badge variant="outline" className="text-xs capitalize ml-auto">
          {lesson.type}
        </Badge>
      </div>

      {(lesson.items as any[]).map((item: any, idx: number) => {
        const answer = getAnswer(item.id, idx);
        return (
          <Card key={item.id} className="lb-card overflow-hidden">
            {/* Question Header */}
            <div className="bg-[#0d1b2a] px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-[#faf6ef]/60 uppercase tracking-wider">
                Question {idx + 1}
              </span>
              <span className="text-xs text-[#c9993f] capitalize">
                {item.type?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* GRAMMAR MCQ */}
              {item.type === 'grammar_mcq' && (
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
                          isCorrect ? 'bg-green-50/50 border-green-200 text-green-700' :
                          'bg-[#faf6ef] border-[#e5ddd0] text-[#0d1b2a]/60'
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                          {!selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 opacity-60" />}
                        </div>
                      );
                    })}
                  </div>
                  {item.explanation && (
                    <p className="text-xs text-[#0d1b2a]/50 bg-[#faf6ef] rounded-lg p-3 border border-[#e5ddd0]">
                      💡 {item.explanation}
                    </p>
                  )}
                </>
              )}

              {/* VOCAB MCQ */}
              {item.type === 'vocab_mcq' && (
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
                          isCorrect ? 'bg-green-50/50 border-green-200 text-green-700' :
                          'bg-[#faf6ef] border-[#e5ddd0] text-[#0d1b2a]/60'
                        }`}>
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                          {!selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 opacity-60" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* FILL IN THE BLANK */}
              {item.type === 'vocab_fillin' && (
                <>
                  <p className="font-medium text-[#0d1b2a] mb-3">{item.contextText || item.sentence}</p>
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
                          {!correct && item.correctAnswers?.[i] && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✓ {item.correctAnswers[i]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* GRAMMAR SENTENCE */}
              {item.type === 'grammar_sentence' && (
                <>
                  <p className="font-medium text-[#0d1b2a]">{item.prompt}</p>
                  {item.wordBank && (
                    <div className="flex flex-wrap gap-2 mb-2">
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
                  <div className="flex items-center gap-2 mb-2">
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

              {/* Teacher Comment Box */}
              <div className="pt-3 border-t border-[#e5ddd0]">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#0d1b2a]/40" />
                  <span className="text-xs text-[#0d1b2a]/40">Teacher comment on this question</span>
                </div>
                <textarea
                  value={comments[item.id] || ''}
                  onChange={e => setComments(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Add a comment..."
                  rows={2}
                  className="w-full text-sm bg-[#faf6ef] border border-[#e5ddd0] rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#c9993f] text-[#0d1b2a] placeholder-[#0d1b2a]/30"
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SubmissionReview;
