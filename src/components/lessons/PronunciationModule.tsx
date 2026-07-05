// ============================================================
// LingoBite - Pronunciation Module
// YouTube video + 10 progressive practice items + Web Audio API
// ============================================================

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioVisualizer from '@/components/lessons/AudioVisualizer';
import PeerReviewPanel from '@/components/peer/PeerReviewPanel';
import TeacherGradeCard from '@/components/dashboard/TeacherGradeCard';
import {
  Mic, Square, RotateCcw, Pause, Volume2, Lightbulb,
  CheckCircle, ChevronRight, ChevronLeft, Headphones, Upload
} from 'lucide-react';
import type { Lesson, PronunciationItem, StudentSubmission } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

interface Props {
  lesson: Lesson;
  onComplete: (submission: Partial<StudentSubmission>) => void;
  onBack: () => void;
  teacherView?: boolean;
  existingSubmission?: StudentSubmission | null;
}

const PronunciationModule: React.FC<Props> = ({
  lesson,
  onComplete,
  onBack: _onBack,
  teacherView = false,
  existingSubmission,
}) => {
  const { user } = useAuth();
  const items = lesson.items.filter(i => i.type === 'pronunciation') as PronunciationItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [showPeerReview, setShowPeerReview] = useState(false);
  const [submission, setSubmission] = useState<Partial<StudentSubmission>>({
    studentId: user?.uid || '',
    studentName: user?.displayName || '',
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    lessonType: 'pronunciation',
    status: 'in_progress',
    maxScore: items.length * 10,
    answers: [],
    competenceFlags: [],
    flawFlags: [],
  });

  const recorder = useAudioRecorder();
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentItem = items[currentIndex];
  const progress = Math.round((completedItems.size / items.length) * 100);
  void progress;
  const isCompleted = completedItems.has(currentIndex);
  void isCompleted;

  const handleRecordToggle = async () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      // Wait a tick for the blob to be ready
      setTimeout(async () => {
        if (recorder.audioBlob) {
          let audioUrl = recorder.audioUrl || '#';
          try {
            const { uploadAudioRecording } = await import('@/lib/cloudinary');
            const filename = `student_pronunciation_${currentItem.id}_${Date.now()}.webm`;
            audioUrl = await uploadAudioRecording(recorder.audioBlob, filename);
          } catch (err) {
            console.error('Failed to upload pronunciation audio:', err);
          }
          setCompletedItems(prev => new Set(prev).add(currentIndex));
          const newAnswer = {
            itemId: currentItem.id,
            itemType: 'pronunciation' as const,
            itemOrder: currentItem.order,
            recordedAudioUrl: audioUrl,
            durationSeconds: recorder.duration,
          };
          setSubmission(prev => ({
            ...prev,
            answers: [...(prev.answers || []).filter((a: any) => a.itemId !== currentItem.id), newAnswer],
          }));
        }
      }, 500);
    } else {
      await recorder.startRecording();
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      recorder.resetRecording();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      recorder.resetRecording();
    }
  };

  const handleSubmit = () => {
    onComplete({
      ...submission,
      status: 'submitted',
      submittedAt: new Date(),
    });
  };

  const playNativeAudio = (index: number) => {
    // Mock: In production, play actual audio file
    setPlayingAudio(index);
    setTimeout(() => setPlayingAudio(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Lesson Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#c9993f]/10 text-[#c9993f] border-[#c9993f]/30 font-medium">
              Pronunciation
            </Badge>
            <span className="text-xs text-[#0d1b2a]/50">
              Item {currentIndex + 1} of {items.length}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0d1b2a] mb-2">
            {lesson.title}
          </h1>
          <p className="text-[#0d1b2a]/60 text-sm sm:text-base">
            {lesson.description}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); recorder.resetRecording(); }}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                idx === currentIndex
                  ? 'bg-[#0d1b2a] text-[#c9993f] shadow-lg'
                  : completedItems.has(idx)
                  ? 'bg-[#38a169] text-white'
                  : 'bg-white text-[#0d1b2a]/40 border border-[#e5ddd0] hover:border-[#c9993f]'
              }`}
            >
              {completedItems.has(idx) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                idx + 1
              )}
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

        {/* Main Practice Card */}
        <Card className="lb-card p-6 sm:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#c9993f] uppercase tracking-wider mb-2">
                Practice Item {currentItem.order}
              </p>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0d1b2a] mb-3">
                {currentItem.instructions}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => playNativeAudio(currentIndex)}
                  className="lb-btn-gold py-2 px-4 flex items-center gap-2 text-xs"
                >
                  {playingAudio === currentIndex ? (
                    <><Volume2 className="w-4 h-4 animate-pulse" /> Playing...</>
                  ) : (
                    <><Headphones className="w-4 h-4" /> Listen to Native</>
                  )}
                </button>
                {currentItem.hint && (
                  <div className="flex items-center gap-1.5 text-xs text-[#0d1b2a]/50">
                    <Lightbulb className="w-4 h-4 text-[#c9993f]" />
                    {currentItem.hint}
                  </div>
                )}
              </div>
            </div>
            {completedItems.has(currentIndex) && (
              <Badge className="lb-badge-reviewed ml-2">
                <CheckCircle className="w-3 h-3 mr-1" /> Recorded
              </Badge>
            )}
          </div>

          {/* Target Phrase Display */}
          <div className="bg-[#0d1b2a]/5 rounded-xl p-6 mb-6 border-l-4 border-[#c9993f]">
            <p className="text-xs text-[#0d1b2a]/50 mb-1">Target Phrase</p>
            <p className="font-serif text-2xl sm:text-3xl text-[#0d1b2a] font-semibold leading-relaxed">
              "{currentItem.targetPhrase}"
            </p>
          </div>

          {/* Audio Recording Interface */}
          <div className="bg-white rounded-2xl border-2 border-[#e5ddd0] p-6">
            {/* Visualizer */}
            {(recorder.isRecording || recorder.audioUrl) && (
              <div className="mb-6">
                {recorder.isRecording && (
                  <AudioVisualizer levels={recorder.levelData.levels} isRecording={recorder.isRecording} />
                )}
                {recorder.audioUrl && !recorder.isRecording && (
                  <audio
                    ref={audioRef}
                    src={recorder.audioUrl}
                    controls
                    className="w-full rounded-xl"
                  />
                )}
              </div>
            )}

            {/* Recording Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {recorder.isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="lb-recording-indicator" />
                    <span className="text-sm font-semibold text-red-500">Recording</span>
                    <span className="text-sm text-[#0d1b2a]/50 font-mono">
                      {recorder.formatDuration(recorder.duration)}
                    </span>
                  </div>
                )}
                {!recorder.isRecording && recorder.duration > 0 && (
                  <span className="text-sm text-[#0d1b2a]/60">
                    Duration: {recorder.formatDuration(recorder.duration)}
                  </span>
                )}
                {!recorder.isRecording && !recorder.audioUrl && (
                  <span className="text-sm text-[#0d1b2a]/40">
                    Press the microphone button to start recording
                  </span>
                )}
              </div>
              {recorder.error && (
                <span className="text-xs text-red-500">{recorder.error}</span>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-center gap-4">
              {!recorder.isRecording && !recorder.audioUrl && (
                <button
                  onClick={handleRecordToggle}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Mic className="w-7 h-7" />
                </button>
              )}
              {recorder.isRecording && (
                <>
                  <button
                    onClick={handleRecordToggle}
                    className="w-16 h-16 rounded-full bg-[#0d1b2a] hover:bg-[#1a2d42] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Square className="w-6 h-6" />
                  </button>
                  <button
                    onClick={recorder.pauseRecording}
                    className="w-12 h-12 rounded-full bg-[#e5ddd0] hover:bg-[#d5cdc0] text-[#0d1b2a] flex items-center justify-center transition-all hover:scale-105"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                </>
              )}
              {recorder.audioUrl && !recorder.isRecording && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => recorder.resetRecording()}
                    className="lb-btn-outline flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Re-record
                  </button>
                  <button
                    onClick={() => {
                      setCompletedItems(prev => new Set(prev).add(currentIndex));
                      handleNext();
                    }}
                    className="lb-btn-gold flex items-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="lb-btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-[#0d1b2a]/40 font-medium">
            {currentIndex + 1} / {items.length}
          </span>
          {currentIndex === items.length - 1 && completedItems.size === items.length ? (
            <button onClick={handleSubmit} className="lb-btn-gold flex items-center gap-2">
              <Upload className="w-4 h-4" /> Submit All
            </button>
          ) : (
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
              className="lb-btn-primary"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Peer Review Toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowPeerReview(!showPeerReview)}
            className="text-sm text-[#c9993f] hover:text-[#0d1b2a] font-medium transition-colors underline underline-offset-4"
          >
            {showPeerReview ? 'Hide' : 'View'} Peer Reviews
          </button>
        </div>

        {/* Peer Review Panel */}
        {showPeerReview && (
          <div className="mt-6">
            <PeerReviewPanel submissionId="sub_001" />
          </div>
        )}

        {/* Teacher Grading Card (visible in teacher view) */}
        {teacherView && existingSubmission && (
          <div className="mt-8">
            <TeacherGradeCard submission={existingSubmission} onGrade={(data) => console.log('Graded:', data)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationModule;
