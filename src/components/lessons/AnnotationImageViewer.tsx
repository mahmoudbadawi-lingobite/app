// ============================================================
// LingoBite - Annotation Image Viewer (Read-Only, Shared)
// Renders a vocab_image submission's image at its real aspect
// ratio (never cropped) with optional "correct answer" and
// "student answer" marker overlays. Used by the teacher grading
// view and the peer-feedback content viewer so both behave the
// same way as the student's own practice screen.
// ============================================================

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export interface AnnotationMarker {
  id: string;
  x: number;
  y: number;
  label?: string;
}

interface Props {
  imageUrl: string;
  maxHeight?: number;
  correctMarkers?: AnnotationMarker[];
  studentMarkers?: AnnotationMarker[];
}

const AnnotationImageViewer: React.FC<Props> = ({
  imageUrl, maxHeight = 420, correctMarkers = [], studentMarkers = [],
}) => {
  const [aspectRatio, setAspectRatio] = useState(16 / 10);

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-[#0d1b2a] mx-auto w-full"
      style={{ aspectRatio: `${aspectRatio}`, maxHeight }}
    >
      <img
        src={imageUrl}
        alt="Annotation source"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            setAspectRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
        className="w-full h-full object-contain"
      />

      {correctMarkers.map(m => (
        <div
          key={m.id}
          className="absolute w-6 h-6 rounded-full bg-[#38a169] border-2 border-white shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          title={m.label}
        >
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      ))}

      {studentMarkers.map((m, i) => (
        <div
          key={m.id}
          className="absolute w-7 h-7 rounded-full bg-[#0d1b2a] text-[#c9993f] border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
          title={m.label}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
};

export default AnnotationImageViewer;
