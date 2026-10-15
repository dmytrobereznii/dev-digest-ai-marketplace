import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/t';

type CopyState = 'idle' | 'copied' | 'failed';

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for contexts without the async clipboard API.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  if (!ok) throw new Error('copy failed');
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = () => {
    copyText(text).then(
      () => setState('copied'),
      () => setState('failed'),
    );
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2000);
  };

  return (
    <button
      type="button"
      className={`copy-btn copy-${state}`}
      onClick={onClick}
      aria-label={label ?? t('copy.aria', { text })}
    >
      <span aria-live="polite">
        {state === 'copied' ? t('copy.copied') : state === 'failed' ? t('copy.failed') : t('copy.copy')}
      </span>
    </button>
  );
}

/** A command on one line with a Copy button. */
export function CopyCommand({ command }: { command: string }) {
  return (
    <div className="command">
      <code>{command}</code>
      <CopyButton text={command} />
    </div>
  );
}

/** A multi-line shell block with a Copy button. */
export function CopyBlock({ code }: { code: string }) {
  return (
    <div className="command command-block">
      <pre>
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}
