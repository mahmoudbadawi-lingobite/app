// ============================================================
// LingoBite - EmailJS Integration for Student Feedback
// ============================================================

import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

interface FeedbackEmailParams {
  student_name: string;
  student_email: string;
  lesson_title: string;
  score: number;
  max_score: number;
  feedback: string;
  competence_flags?: string;
  flaw_flags?: string;
  question_comments?: string;
  audio_feedback_url?: string;
}

export const sendFeedbackEmail = async (params: FeedbackEmailParams): Promise<void> => {
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      student_name: params.student_name,
      student_email: params.student_email,
      lesson_title: params.lesson_title,
      score: String(params.score),
      max_score: String(params.max_score),
      feedback: params.feedback,
      competence_flags: params.competence_flags || 'None specified',
      flaw_flags: params.flaw_flags || 'None specified',
      question_comments: params.question_comments || 'No per-question comments.',
      audio_feedback_url: params.audio_feedback_url || '',
    },
    { publicKey: PUBLIC_KEY }
  );
};
