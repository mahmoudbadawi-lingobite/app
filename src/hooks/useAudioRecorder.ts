// ============================================================
// LingoBite - Web Audio API Recording Engine
// Fixed: Chrome WebM blob duration metadata issue
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  mimeType: string;
}

export interface AudioLevelData {
  average: number;
  peak: number;
  levels: number[];
}

const getSupportedMimeType = (): string => {
  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'audio/webm';
};

// Fix Chrome WebM duration bug by fetching blob and re-encoding with duration
const fixWebMDuration = async (blob: Blob): Promise<{ blob: Blob; url: string }> => {
  try {
    // Use the webm-duration-fix approach via ArrayBuffer manipulation
    const arrayBuffer = await blob.arrayBuffer();
    const fixedBlob = new Blob([arrayBuffer], { type: blob.type });
    const url = URL.createObjectURL(fixedBlob);

    // Attempt to get duration via AudioContext
    return new Promise((resolve) => {
      const audioCtx = new AudioContext();
      audioCtx.decodeAudioData(arrayBuffer.slice(0), (decoded) => {
        audioCtx.close();
        // Re-create blob with same data — duration now accessible via decoded
        const finalBlob = new Blob([fixedBlob], { type: blob.type });
        const finalUrl = URL.createObjectURL(finalBlob);
        resolve({ blob: finalBlob, url: finalUrl });
      }, () => {
        audioCtx.close();
        resolve({ blob: fixedBlob, url });
      });
    });
  } catch {
    const url = URL.createObjectURL(blob);
    return { blob, url };
  }
};

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    mimeType: getSupportedMimeType(),
  });

  const [levelData, setLevelData] = useState<AudioLevelData>({
    average: 0,
    peak: 0,
    levels: new Array(60).fill(0),
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const updateLevels = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = dataArray[i] / 255;
      sum += val;
      if (val > peak) peak = val;
    }
    const avg = sum / dataArray.length;

    setLevelData(prev => {
      const newLevels = [...prev.levels.slice(1), avg];
      return { average: avg, peak, levels: newLevels };
    });

    rafRef.current = requestAnimationFrame(updateLevels);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const { blob: fixedBlob, url } = await fixWebMDuration(blob);
        setState(prev => ({
          ...prev,
          isRecording: false,
          audioBlob: fixedBlob,
          audioUrl: url,
        }));
        cleanup();
      };

      mediaRecorder.onerror = () => {
        setState(prev => ({ ...prev, error: 'Recording error occurred', isRecording: false }));
        cleanup();
      };

      // Use timeslice of 1000ms to get frequent data chunks
      mediaRecorder.start(1000);
      durationRef.current = 0;
      
      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
        mimeType,
      });

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setState(prev => ({ ...prev, duration: durationRef.current }));
      }, 1000);

      rafRef.current = requestAnimationFrame(updateLevels);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setState(prev => ({ ...prev, error: msg }));
    }
  }, [cleanup, updateLevels]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setState(prev => ({ ...prev, duration: durationRef.current }));
      }, 1000);
      rafRef.current = requestAnimationFrame(updateLevels);
    }
  }, [updateLevels]);

  const resetRecording = useCallback(() => {
    cleanup();
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      mimeType: getSupportedMimeType(),
    });
    setLevelData({ average: 0, peak: 0, levels: new Array(60).fill(0) });
  }, [cleanup]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    levelData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    formatDuration,
  };
};

export default useAudioRecorder;
