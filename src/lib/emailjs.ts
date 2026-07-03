// ============================================================
// LingoBite - EmailJS Integration for Student Feedback
// ============================================================

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
  // Dynamically load EmailJS to keep bundle size small
  const emailjs = await import('@emailjs/browser');
  emailjs.init({ publicKey: PUBLIC_KEY });

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    student_name: params.student_name,
    student_email: params.student_email,
    lesson_title: params.lesson_title,
    score: params.score,
    max_score: params.max_score,
    feedback: params.feedback,
  });
};
