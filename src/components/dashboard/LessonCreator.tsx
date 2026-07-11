// ============================================================
// LingoBite - Lesson Creator (Teacher)
// Create Grammar, Vocabulary, and Pronunciation lessons
// ============================================================

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/AuthProvider';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/lib/cloudinary';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import {
  Plus, Trash2, Save, ChevronDown, ChevronUp,
  Mic, BookMarked, Target, Youtube, CheckCircle,
  GripVertical, X, ArrowLeft, ImageIcon, Loader2, MousePointerClick
} from 'lucide-react';
import type { LessonType, Lesson } from '@/types';

// ---- Item type helpers ----
type ItemType = 'grammar_mcq' | 'grammar_sentence' | 'vocab_mcq' | 'vocab_fillin' | 'vocab_image' | 'pronunciation';

const defaultItem = (type: ItemType, order: number): any => {
  const base = { id: `item_${Date.now()}_${order}`, type, order, instructions: '' };
  switch (type) {
    case 'grammar_mcq':
    case 'vocab_mcq':
      return { ...base, question: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' };
    case 'grammar_sentence':
      return { ...base, prompt: '', wordBank: [], targetGrammarRule: '', minWordCount: 5, exampleAnswer: '' };
    case 'vocab_fillin':
      return { ...base, sentenceTemplate: '', correctAnswers: [''], blankCount: 1 };
    case 'vocab_image':
      return { ...base, imageUrl: '', annotations: [] };
    case 'pronunciation':
      return { ...base, targetPhrase: '', nativeAudioUrl: '', hint: '' };
    default:
      return base;
  }
};

// ---- MCQ Editor ----
const MCQEditor: React.FC<{ item: any; onChange: (item: any) => void; onDelete: () => void }> = ({ item, onChange, onDelete }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#0d1b2a]/50 uppercase tracking-wider">
        {item.type === 'grammar_mcq' ? 'Grammar MCQ' : 'Vocabulary MCQ'}
      </span>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    <Input
      value={item.question}
      onChange={e => onChange({ ...item, question: e.target.value })}
      placeholder="Enter question..."
      className="lb-input"
    />
    <div className="space-y-2">
      {item.options.map((opt: string, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onChange({ ...item, correctOptionIndex: i })}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
              item.correctOptionIndex === i
                ? 'bg-[#38a169] border-[#38a169]'
                : 'border-[#e5ddd0] hover:border-[#c9993f]'
            }`}
          >
            {item.correctOptionIndex === i && <CheckCircle className="w-4 h-4 text-white m-auto" />}
          </button>
          <Input
            value={opt}
            onChange={e => {
              const newOpts = [...item.options];
              newOpts[i] = e.target.value;
              onChange({ ...item, options: newOpts });
            }}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            className="lb-input flex-1"
          />
        </div>
      ))}
    </div>
    <Input
      value={item.explanation || ''}
      onChange={e => onChange({ ...item, explanation: e.target.value })}
      placeholder="Explanation (optional)..."
      className="lb-input text-sm"
    />
  </div>
);

// ---- Fill-in-the-Blank Editor ----
const FillInEditor: React.FC<{ item: any; onChange: (item: any) => void; onDelete: () => void }> = ({ item, onChange, onDelete }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#0d1b2a]/50 uppercase tracking-wider">Fill in the Blank</span>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
    </div>
    <p className="text-xs text-[#0d1b2a]/50">Use ____ for each blank in the sentence.</p>
    <Input
      value={item.sentenceTemplate}
      onChange={e => {
        const blanks = (e.target.value.match(/____/g) || []).length;
        const answers = Array(blanks).fill('').map((_, i) => item.correctAnswers[i] || '');
        onChange({ ...item, sentenceTemplate: e.target.value, blankCount: blanks, correctAnswers: answers });
      }}
      placeholder='e.g. "The ____ jumped over the ____"'
      className="lb-input"
    />
    {item.correctAnswers.map((ans: string, i: number) => (
      <Input
        key={i}
        value={ans}
        onChange={e => {
          const newAns = [...item.correctAnswers];
          newAns[i] = e.target.value;
          onChange({ ...item, correctAnswers: newAns });
        }}
        placeholder={`Correct answer for blank ${i + 1}`}
        className="lb-input"
      />
    ))}
  </div>
);

// ---- Grammar Sentence Editor ----
const SentenceEditor: React.FC<{ item: any; onChange: (item: any) => void; onDelete: () => void }> = ({ item, onChange, onDelete }) => {
  const [newWord, setNewWord] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0d1b2a]/50 uppercase tracking-wider">Sentence Construction</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
      <Textarea
        value={item.prompt}
        onChange={e => onChange({ ...item, prompt: e.target.value })}
        placeholder="Write a prompt for the student..."
        rows={2}
        className="lb-input resize-none"
      />
      <Input
        value={item.targetGrammarRule}
        onChange={e => onChange({ ...item, targetGrammarRule: e.target.value })}
        placeholder="Target grammar rule (e.g. Present Perfect)"
        className="lb-input"
      />
      <div>
        <p className="text-xs text-[#0d1b2a]/50 mb-2">Word Bank</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {item.wordBank.map((w: string, i: number) => (
            <span key={i} className="flex items-center gap-1 bg-[#0d1b2a] text-[#c9993f] text-xs px-2 py-1 rounded-lg">
              {w}
              <button onClick={() => onChange({ ...item, wordBank: item.wordBank.filter((_: any, j: number) => j !== i) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newWord.trim()) {
                onChange({ ...item, wordBank: [...item.wordBank, newWord.trim()] });
                setNewWord('');
              }
            }}
            placeholder="Type a word and press Enter"
            className="lb-input flex-1"
          />
          <button
            onClick={() => { if (newWord.trim()) { onChange({ ...item, wordBank: [...item.wordBank, newWord.trim()] }); setNewWord(''); } }}
            className="lb-btn-primary px-3"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <Input
        value={item.exampleAnswer || ''}
        onChange={e => onChange({ ...item, exampleAnswer: e.target.value })}
        placeholder="Example answer (optional)"
        className="lb-input"
      />
    </div>
  );
};

// ---- Pronunciation Editor ----
const PronunciationEditor: React.FC<{ item: any; onChange: (item: any) => void; onDelete: () => void }> = ({ item, onChange, onDelete }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-[#0d1b2a]/50 uppercase tracking-wider">Pronunciation</span>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
    </div>
    <Input
      value={item.targetPhrase}
      onChange={e => onChange({ ...item, targetPhrase: e.target.value })}
      placeholder="Target word or phrase to pronounce"
      className="lb-input"
    />
    <Input
      value={item.hint || ''}
      onChange={e => onChange({ ...item, hint: e.target.value })}
      placeholder="Pronunciation hint (optional, e.g. 'th as in think')"
      className="lb-input"
    />
    <Input
      value={item.nativeAudioUrl || ''}
      onChange={e => onChange({ ...item, nativeAudioUrl: e.target.value })}
      placeholder="Reference audio URL (optional)"
      className="lb-input"
    />
  </div>
);

// ---- Image Annotation Editor ----
const ImageAnnotationEditor: React.FC<{ item: any; onChange: (item: any) => void; onDelete: () => void }> = ({ item, onChange, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadImage(file);
      onChange({ ...item, imageUrl: url });
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadError('Upload failed. Please try again or paste an image URL instead.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newAnnotation = { id: `ann_${Date.now()}`, x, y, label: '', description: '' };
    const next = [...item.annotations, newAnnotation];
    onChange({ ...item, annotations: next });
    setSelectedId(newAnnotation.id);
  };

  const updateAnnotation = (id: string, patch: Partial<{ label: string; description: string }>) => {
    onChange({
      ...item,
      annotations: item.annotations.map((a: any) => a.id === id ? { ...a, ...patch } : a),
    });
  };

  const removeAnnotation = (id: string) => {
    onChange({ ...item, annotations: item.annotations.filter((a: any) => a.id !== id) });
    setSelectedId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0d1b2a]/50 uppercase tracking-wider">Image Annotation</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          value={item.imageUrl}
          onChange={e => onChange({ ...item, imageUrl: e.target.value })}
          placeholder="Paste an image URL, or upload one →"
          className="lb-input flex-1"
        />
        <label className="lb-btn-outline flex items-center gap-2 text-sm px-3 cursor-pointer whitespace-nowrap">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          Upload
          <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} className="hidden" />
        </label>
      </div>
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {item.imageUrl ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#0d1b2a]/50">
              {addMode ? 'Click on the image to place a correct answer point' : 'Mark where the correct labels belong'}
            </p>
            <button
              onClick={() => setAddMode(!addMode)}
              className={`lb-btn-${addMode ? 'primary' : 'gold'} flex items-center gap-2 text-xs`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              {addMode ? 'Done Adding' : 'Add Points'}
            </button>
          </div>

          <div
            ref={imageRef}
            onClick={handleImageClick}
            className={`relative rounded-xl overflow-hidden bg-[#0d1b2a] ${addMode ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ aspectRatio: '16/10' }}
          >
            <img src={item.imageUrl} alt="Annotation source" className="w-full h-full object-cover opacity-90" />

            {item.annotations.map((ann: any, idx: number) => (
              <div
                key={ann.id}
                className="absolute"
                style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === ann.id ? null : ann.id); }}
                  className={`w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${
                    selectedId === ann.id ? 'bg-[#c9993f] text-[#0d1b2a]' : 'bg-[#38a169] text-white'
                  }`}
                >
                  {idx + 1}
                </button>
                {selectedId === ann.id && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 bg-white rounded-xl shadow-xl p-3 w-56 space-y-2"
                  >
                    <Input
                      value={ann.label}
                      onChange={e => updateAnnotation(ann.id, { label: e.target.value })}
                      placeholder="Label (e.g. 'Subject line')"
                      className="lb-input text-sm"
                    />
                    <Input
                      value={ann.description || ''}
                      onChange={e => updateAnnotation(ann.id, { description: e.target.value })}
                      placeholder="Hint shown to students (optional)"
                      className="lb-input text-sm"
                    />
                    <button
                      onClick={() => removeAnnotation(ann.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove point
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {item.annotations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.annotations.map((ann: any, idx: number) => (
                <div key={ann.id} className="flex items-center gap-1.5 bg-[#faf6ef] rounded-lg px-3 py-1.5 border border-[#e5ddd0] text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#38a169] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-[#0d1b2a]">
                    {ann.label || <span className="text-[#0d1b2a]/30 italic">Untitled point</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-[#0d1b2a]/40">Add an image above, then place the correct answer points on it.</p>
      )}
    </div>
  );
};

// ---- Main LessonCreator ----
interface Props {
  onBack: () => void;
  onSaved: () => void;
  editLesson?: Lesson;
}

const LessonCreator: React.FC<Props> = ({ onBack, onSaved, editLesson }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(editLesson?.title || '');
  const [description, setDescription] = useState(editLesson?.description || '');
  const [lessonType, setLessonType] = useState<LessonType>(editLesson?.type || 'grammar');
  const [youtubeUrl, setYoutubeUrl] = useState(editLesson?.youtubeUrl || '');
  const [items, setItems] = useState<any[]>((editLesson?.items as any[]) || []);
  const [saving, setSaving] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const addItem = (type: ItemType) => {
    const newItem = defaultItem(type, items.length);
    setItems(prev => [...prev, newItem]);
    setExpandedIdx(items.length);
  };

  const updateItem = (idx: number, updated: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? updated : item));
  };

  const deleteItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { setError('Please enter a lesson title.'); return; }
    if (items.length === 0) { setError('Please add at least one question.'); return; }
    setError('');
    setSaving(true);
    try {
      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        type: lessonType,
        youtubeUrl: youtubeUrl.trim(),
        teacherId: user?.uid || '',
        teacherName: user?.displayName || '',
        status,
        order: editLesson?.order || Date.now(),
        items: items.map((item, i) => ({ ...item, order: i })),
        updatedAt: serverTimestamp(),
        ...(editLesson ? {} : { createdAt: serverTimestamp() }),
      };
      if (editLesson) {
        await updateDoc(doc(db, 'lessons', editLesson.id), lessonData);
      } else {
        await addDoc(collection(db, 'lessons'), lessonData);
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save lesson:', err);
      setError('Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const itemTypes: { type: ItemType; label: string }[] = lessonType === 'grammar' ? [
    { type: 'grammar_mcq', label: 'Multiple Choice' },
    { type: 'grammar_sentence', label: 'Sentence Construction' },
  ] : lessonType === 'vocabulary' ? [
    { type: 'vocab_mcq', label: 'Multiple Choice' },
    { type: 'vocab_fillin', label: 'Fill in the Blank' },
    { type: 'vocab_image', label: 'Image Annotation' },
  ] : [
    { type: 'pronunciation', label: 'Pronunciation' },
  ];

  return (
    <div className="min-h-screen bg-[#faf6ef] pt-20 pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="lb-btn-outline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#0d1b2a]">{editLesson ? 'Edit Lesson' : 'Create New Lesson'}</h1>
            <p className="text-sm text-[#0d1b2a]/50">Build a lesson question by question</p>
          </div>
        </div>

        {/* Lesson Details */}
        <Card className="lb-card p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-[#0d1b2a] flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[#c9993f]" /> Lesson Details
          </h2>

          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Lesson title *"
            className="lb-input text-lg font-medium"
          />

          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Lesson description..."
            rows={2}
            className="lb-input resize-none"
          />

          {/* Lesson Type */}
          <div>
            <p className="text-sm font-medium text-[#0d1b2a]/60 mb-2">Lesson Type</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'grammar', label: 'Grammar', icon: <Target className="w-4 h-4" /> },
                { value: 'vocabulary', label: 'Vocabulary', icon: <BookMarked className="w-4 h-4" /> },
                { value: 'pronunciation', label: 'Pronunciation', icon: <Mic className="w-4 h-4" /> },
              ] as const).map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => { setLessonType(value); setItems([]); }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    lessonType === value
                      ? 'bg-[#0d1b2a] text-[#c9993f] border-[#0d1b2a]'
                      : 'bg-white text-[#0d1b2a]/60 border-[#e5ddd0] hover:border-[#c9993f]'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube URL */}
          <div>
            <p className="text-sm font-medium text-[#0d1b2a]/60 mb-2 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" /> YouTube Video (optional)
            </p>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="lb-input"
            />
            {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
              <div className="mt-3 rounded-xl overflow-hidden aspect-video">
                <iframe
                  src={getYoutubeEmbedUrl(youtubeUrl)!}
                  className="w-full h-full"
                  allowFullScreen
                  title="YouTube preview"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Questions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#0d1b2a]">
              Questions <span className="text-[#0d1b2a]/40 font-normal text-sm">({items.length})</span>
            </h2>
          </div>

          {items.map((item, idx) => (
            <Card key={item.id} className="lb-card overflow-hidden">
              <button
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#faf6ef]/50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-[#0d1b2a]/20" />
                <span className="text-sm font-medium text-[#0d1b2a] flex-1 text-left">
                  Q{idx + 1}: {
                    item.question || item.prompt || item.targetPhrase || item.sentenceTemplate ||
                    (item.type === 'vocab_image'
                      ? (item.imageUrl ? `Image with ${item.annotations.length} point${item.annotations.length === 1 ? '' : 's'}` : <span className="text-[#0d1b2a]/30 italic">Untitled question</span>)
                      : <span className="text-[#0d1b2a]/30 italic">Untitled question</span>)
                  }
                </span>
                <span className="text-xs text-[#0d1b2a]/40 capitalize mr-2">
                  {item.type.replace(/_/g, ' ')}
                </span>
                {expandedIdx === idx
                  ? <ChevronUp className="w-4 h-4 text-[#0d1b2a]/40" />
                  : <ChevronDown className="w-4 h-4 text-[#0d1b2a]/40" />
                }
              </button>

              {expandedIdx === idx && (
                <div className="p-4 pt-0 border-t border-[#e5ddd0]">
                  <div className="mb-3">
                    <Input
                      value={item.instructions}
                      onChange={e => updateItem(idx, { ...item, instructions: e.target.value })}
                      placeholder="Instructions for this question (optional)"
                      className="lb-input text-sm"
                    />
                  </div>
                  {(item.type === 'grammar_mcq' || item.type === 'vocab_mcq') && (
                    <MCQEditor item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
                  )}
                  {item.type === 'vocab_fillin' && (
                    <FillInEditor item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
                  )}
                  {item.type === 'vocab_image' && (
                    <ImageAnnotationEditor item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
                  )}
                  {item.type === 'grammar_sentence' && (
                    <SentenceEditor item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
                  )}
                  {item.type === 'pronunciation' && (
                    <PronunciationEditor item={item} onChange={u => updateItem(idx, u)} onDelete={() => deleteItem(idx)} />
                  )}
                </div>
              )}
            </Card>
          ))}

          {/* Add Question Buttons */}
          <div className="flex flex-wrap gap-2">
            {itemTypes.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addItem(type)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-[#c9993f]/40 text-[#c9993f] text-sm hover:bg-[#c9993f]/5 transition-colors"
              >
                <Plus className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Save Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="lb-btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="lb-btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : <><CheckCircle className="w-4 h-4" /> Publish Lesson</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonCreator;
