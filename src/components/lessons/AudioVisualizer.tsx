// ============================================================
// LingoBite - Audio Level Visualizer
// Real-time waveform display for recording feedback
// ============================================================

import React from 'react';

interface Props {
  levels: number[];
  isRecording: boolean;
}

const AudioVisualizer: React.FC<Props> = ({ levels, isRecording }) => {
  return (
    <div className="lb-audio-visualizer justify-center gap-[3px] h-16 bg-[#0d1b2a]/5 rounded-xl px-4">
      {levels.map((level, idx) => {
        const height = Math.max(4, level * 56);
        const isActive = level > 0.1;
        return (
          <div
            key={idx}
            className="lb-audio-bar transition-all duration-75"
            style={{
              height: `${height}px`,
              opacity: isActive ? 0.6 + level * 0.4 : 0.3,
              background: isRecording
                ? `linear-gradient(to top, ${level > 0.7 ? '#e53e3e' : '#c9993f'}, ${level > 0.5 ? '#c9993f' : '#0d1b2a'})`
                : 'linear-gradient(to top, #c9993f, #0d1b2a)',
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioVisualizer;
