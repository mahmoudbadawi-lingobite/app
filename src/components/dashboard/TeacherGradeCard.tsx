// ============================================================
// LingoBite - Teacher Grading Dashboard
// Manual review + written/audio feedback + email notification
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioVisualizer from '@/components/lessons/AudioVisualizer';
import {
  Star, Mic, Square, RotateCcw, Volume2,
  Award, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Mail, Clock, BookOpen
} from 'lucide-react';
import type { StudentSubmission } from '@/types';
import { fmtTimestamp } from '@/lib/firebase';
import { sendFeedbackEmail } from '@/lib/emailjs';
import SubmissionReview from './SubmissionReview';

interface Props {
  submission: StudentSubmission;
  onGrade: (data: {
    totalScore: number;
    teacherWrittenFeedback: string;
    teacherAudioFeedbackUrl?: string;
    competenceFlags: string[];
    flawFlags: string[];
  }) => void;
}

const TeacherGradeCard: React.FC<Props> = ({ submission, onGrade }) => {
  const [expanded, setExpanded] = useState(true);
  const [score, setScore] = useState(submission.totalScore?.toString() || '');
  const [writtenFeedback, setWrittenFeedback] = useState(submission.teacherWrittenFeedback || '');
  const [competenceFlags, setCompetenceFlags] = useState<string[]>(submission.competenceFlags || []);
  const [flawFlags, setFlawFlags] = useState<string[]>(submission.flawFlags || []);
  const [emailSent, setEmailSent] = useState(submission.emailSent || false);
  const [newCompetence, setNewCompetence] = useState('');
  const [newFlaw, setNewFlaw] = useState('');

  const audioRecorder = useAudioRecorder();

  const handleAddFlag = (type: 'competence' | 'flaw') => {
    if (type === 'competence' && newCompetence.trim()) {
      setCompetenceFlags(prev => [...prev, newCompetence.trim()]);
      setNewCompetence('');
    } else if (type === 'flaw' && newFlaw.trim()) {
      setFlawFlags(prev => [...prev, newFlaw.trim()]);
      setNewFlaw('');
    }
  };

  const handleRemoveFlag = (type: 'competence' | 'flaw', idx: number) => {
    if (type === 'competence') {
      setCompetenceFlags(prev => prev.filter((_, i) => i !== idx));
    } else {
      setFlawFlags(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmitGrade = async () => {
    let audioUrl: string | undefined = undefined;
    if (audioRecorder.audioBlob) {
      try {
        const { uploadAudioRecording } = await import('@/lib/cloudinary');
        const filename = `teacher_feedback_${submission.id}_${Date.now()}.webm`;
        audioUrl = await uploadAudioRecording(audioRecorder.audioBlob, filename);
      } catch (err) {
        console.error('Failed to upload audio feedback:', err);
      }
    }
    onGrade({
      totalScore: parseInt(score) || 0,
      teacherWrittenFeedback: writtenFeedback,
      teacherAudioFeedbackUrl: audioUrl,
      competenceFlags,
      flawFlags,
    });
  };

  const handleSubmitAndEmail = async () => {
    await handleSubmitGrade();
    await handleSendEmail();
  };

  const handleSendEmail = async () => {
    try {
      await sendFeedbackEmail({
        student_name: submission.studentName || "Student",
        student_email: submission.studentEmail || "",
        lesson_title: submission.lessonTitle || "",
        score: parseInt(score) || submission.totalScore || 0,
        max_score: submission.maxScore || 100,
        feedback: writtenFeedback || submission.teacherWrittenFeedback || "",
        competence_flags: competenceFlags.length > 0
          ? competenceFlags.join(', ')
          : (submission.competenceFlags?.join(', ') || 'None specified'),
        flaw_flags: flawFlags.length > 0
          ? flawFlags.join(', ')
          : (submission.flawFlags?.join(', ') || 'None specified'),
        audio_feedback_url: audioRecorder.audioUrl || submission.teacherAudioFeedbackUrl || '',
      });
      setEmailSent(true);
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send email. Check the console for details.");
    }
  };

  const statusColors = {
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    graded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const isGraded = submission.status === 'graded';

  return (
    <Card className="lb-card overflow-hidden">
      {/* Header */}
      <div
        className="p-6 bg-gradient-to-r from-[#0d1b2a] to-[#1a2d42] cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={submission.studentPhotoURL || 'https://via.placeholder.com/48'}
              alt={submission.studentName}
              className="w-12 h-12 rounded-full border-2 border-[#c9993f] object-cover"
            />
            <div>
              <h3 className="text-[#faf6ef] font-serif text-lg font-semibold">
                {submission.studentName}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-[#faf6ef]/60">
                  <BookOpen className="w-3 h-3" /> {submission.lessonTitle}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#faf6ef]/60">
                  <Clock className="w-3 h-3" />
                  {submission.submittedAt ? fmtTimestamp(submission.submittedAt) : 'In progress'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[submission.status]}>
              {submission.status}
            </Badge>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-[#c9993f]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#c9993f]" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-6">
          {/* Submission Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#faf6ef] rounded-xl p-4 text-center">
              <p className="text-xs text-[#0d1b2a]/50 mb-1">Lesson Type</p>
              <p className="text-sm font-bold text-[#0d1b2a] capitalize">{submission.lessonType}</p>
            </div>
            <div className="bg-[#faf6ef] rounded-xl p-4 text-center">
              <p className="text-xs text-[#0d1b2a]/50 mb-1">Max Score</p>
              <p className="text-sm font-bold text-[#0d1b2a]">{submission.maxScore}</p>
            </div>
            <div className="bg-[#faf6ef] rounded-xl p-4 text-center">
              <p className="text-xs text-[#0d1b2a]/50 mb-1">Answers</p>
              <p className="text-sm font-bold text-[#0d1b2a]">{submission.answers?.length || 0}</p>
            </div>
            <div className="bg-[#faf6ef] rounded-xl p-4 text-center">
              <p className="text-xs text-[#0d1b2a]/50 mb-1">Duration</p>
              <p className="text-sm font-bold text-[#0d1b2a]">
                {submission.submittedAt && submission.startedAt
                  ? Math.round((
                      (submission.submittedAt as any)?.toDate?.()?.getTime?.() ?? new Date(submission.submittedAt as any).getTime()
                    - (
                      (submission.startedAt as any)?.toDate?.()?.getTime?.() ?? new Date(submission.startedAt as any).getTime()
                    )) / 60000)
                  : 0}m
              </p>
            </div>
          </div>

          {/* Student Answers - Full Lesson Review */}
          <SubmissionReview submission={submission} />

          {/* Score Input */}
          <div>
            <label className="text-sm font-semibold text-[#0d1b2a] mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#c9993f]" /> Overall Score (0-{submission.maxScore})
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={0}
                max={submission.maxScore}
                value={score}
                onChange={e => setScore(e.target.value)}
                disabled={isGraded}
                className="lb-input w-24 text-center text-lg font-bold"
              />
              <div className="flex-1">
                <div className="lb-progress-bar">
                  <div
                    className="lb-progress-fill"
                    style={{ width: `${Math.min(100, (parseInt(score) / submission.maxScore) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-[#0d1b2a]/50 font-medium">/ {submission.maxScore}</span>
            </div>
          </div>

          {/* Competence Flags */}
          <div>
            <label className="text-sm font-semibold text-[#0d1b2a] mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#38a169]" /> Areas of Competence
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {competenceFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#38a169]/10 text-[#38a169] text-sm font-medium border border-[#38a169]/20"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {flag}
                  {!isGraded && (
                    <button
                      onClick={() => handleRemoveFlag('competence', idx)}
                      className="ml-1 hover:text-[#0d1b2a]"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!isGraded && (
              <div className="flex gap-2">
                <Input
                  value={newCompetence}
                  onChange={e => setNewCompetence(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFlag('competence')}
                  placeholder="Add competence area..."
                  className="lb-input flex-1"
                />
                <button onClick={() => handleAddFlag('competence')} className="lb-btn-outline px-3">
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Flaw Flags */}
          <div>
            <label className="text-sm font-semibold text-[#0d1b2a] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Areas Needing Improvement
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {flawFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-200"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {flag}
                  {!isGraded && (
                    <button
                      onClick={() => handleRemoveFlag('flaw', idx)}
                      className="ml-1 hover:text-[#0d1b2a]"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {!isGraded && (
              <div className="flex gap-2">
                <Input
                  value={newFlaw}
                  onChange={e => setNewFlaw(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddFlag('flaw')}
                  placeholder="Add area for improvement..."
                  className="lb-input flex-1"
                />
                <button onClick={() => handleAddFlag('flaw')} className="lb-btn-outline px-3">
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Written Feedback */}
          <div>
            <label className="text-sm font-semibold text-[#0d1b2a] mb-2">
              Written Feedback (Markdown supported)
            </label>
            <Textarea
              value={writtenFeedback}
              onChange={e => setWrittenFeedback(e.target.value)}
              disabled={isGraded}
              placeholder="Provide detailed feedback to the student..."
              className="lb-input min-h-[120px] resize-none"
            />
          </div>

          {/* Audio Feedback */}
          <div>
            <label className="text-sm font-semibold text-[#0d1b2a] mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#c9993f]" /> Audio Feedback (Spoken)
            </label>
            <div className="bg-[#faf6ef] rounded-xl p-4 border border-[#e5ddd0]">
              {audioRecorder.isRecording ? (
                <div className="space-y-3">
                  <AudioVisualizer levels={audioRecorder.levelData.levels} isRecording={true} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="lb-recording-indicator" />
                      <span className="text-sm text-red-500 font-medium">
                        Recording... {audioRecorder.formatDuration(audioRecorder.duration)}
                      </span>
                    </div>
                    <button
                      onClick={() => audioRecorder.stopRecording()}
                      className="lb-btn-primary flex items-center gap-2 text-xs"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  </div>
                </div>
              ) : audioRecorder.audioUrl ? (
                <div className="space-y-3">
                  <audio src={audioRecorder.audioUrl} controls className="w-full rounded-xl" />
                  <button
                    onClick={() => audioRecorder.resetRecording()}
                    className="lb-btn-outline flex items-center gap-2 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-record
                  </button>
                </div>
              ) : submission.teacherAudioFeedbackUrl && isGraded ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#0d1b2a]/50 mb-1">Recorded audio feedback:</p>
                  <audio src={submission.teacherAudioFeedbackUrl} controls className="w-full rounded-xl" />
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <button
                    onClick={() => audioRecorder.startRecording()}
                    disabled={isGraded}
                    className="flex items-center gap-2 text-[#c9993f] hover:text-[#0d1b2a] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mic className="w-5 h-5" />
                    {isGraded ? 'No audio feedback recorded' : 'Record Audio Feedback'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#e5ddd0]">
            {!isGraded ? (
              <>
                <button onClick={handleSubmitGrade} className="lb-btn-primary flex-1 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Submit Grade
                </button>
                <button
                  onClick={handleSubmitAndEmail}
                  className="lb-btn-gold flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Submit & Send Email
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#38a169]/10 rounded-xl text-[#38a169] font-medium text-sm">
                  <CheckCircle className="w-4 h-4" /> Graded on {fmtTimestamp(submission.gradedAt)}
                </div>
                <button
                  onClick={handleSendEmail}
                  disabled={emailSent}
                  className={`lb-btn-${emailSent ? 'outline' : 'gold'} flex items-center gap-2`}
                >
                  <Mail className="w-4 h-4" />
                  {emailSent ? 'Email Sent ✓' : 'Send Feedback Email'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TeacherGradeCard;
