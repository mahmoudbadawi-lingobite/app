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
    },
    { publicKey: PUBLIC_KEY }
  );
};
