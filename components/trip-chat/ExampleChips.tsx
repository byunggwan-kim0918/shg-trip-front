'use client';

interface Props {
  examples: string[];
  onPick: (example: string) => void;
}

/** 예시는 입력을 돕는다. 누르면 입력창을 채우고, 보내기 전에 고칠 수 있다. */
export default function ExampleChips({ examples, onPick }: Props) {
  if (examples.length === 0) return null;
  return (
    <div className="mb-3.5 flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2">
      {examples.map((example, i) => (
        <button
          key={example}
          type="button"
          onClick={() => onPick(example)}
          style={{ animationDelay: `${i * 40}ms` }}
          className="shg-rise-in min-h-8 rounded-[7px] bg-field px-2.5 py-[7px] text-left text-xs text-foreground transition-colors hover:bg-accent-soft hover:text-accent-weak-fg pointer-coarse:min-h-11"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
