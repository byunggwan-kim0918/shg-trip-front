'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';

interface Props {
  open: boolean;
  initialTitle: string;
  initialTags: string[];
  busy?: boolean;
  error?: string | null;
  onSave: (payload: { title: string; tags: string[] }) => void;
  onCancel: () => void;
}

const MAX_TAGS = 8;
const MAX_TAG_LEN = 12;

/** 일정 제목·태그 편집 모달. ConfirmModal 패턴 준용(오버레이+ESC+aria). */
export default function EditItineraryModal({
  open,
  initialTitle,
  initialTags,
  busy = false,
  error,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  // 열릴 때마다 현재 값으로 초기화 + 포커스
  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setTags(initialTags);
    setTagInput('');
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, initialTitle, initialTags, busy, onCancel]);

  if (!open) return null;

  const addTag = () => {
    const v = tagInput.trim().slice(0, MAX_TAG_LEN);
    if (!v || tags.includes(v) || tags.length >= MAX_TAGS) { setTagInput(''); return; }
    setTags([...tags, v]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const canSave = title.trim().length > 0 && !busy;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => { if (!busy) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="일정 편집"
        className="w-full max-w-md rounded-xl border border-card-border bg-card-bg p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-foreground">일정 편집</h2>

        {/* 제목 */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-muted-2">제목</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="여행 제목"
            className="w-full rounded-xl border border-card-border bg-surface-3 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {/* 태그 */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-muted-2">태그 <span className="font-semibold text-muted-2/70">(최대 {MAX_TAGS}개)</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              maxLength={MAX_TAG_LEN}
              placeholder="태그 입력 후 Enter"
              className="flex-1 rounded-xl border border-card-border bg-surface-3 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!tagInput.trim() || tags.length >= MAX_TAGS}
              className="shrink-0 rounded-xl bg-accent px-3.5 text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              aria-label="태그 추가"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-[12px] font-semibold text-muted">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} aria-label={`${t} 삭제`} className="opacity-60 hover:opacity-100">
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave({ title: title.trim(), tags })}
            disabled={!canSave}
            className="min-h-[40px] rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
