import { useEffect, useRef, useState } from 'react';
import type { SaveFeedbackContent } from '../components/SaveFeedbackOverlay';

export function useSaveFeedback() {
  const [content, setContent] = useState<SaveFeedbackContent>({ title: 'Entry logged', amount: '', category: '', account: '' });
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (title: string, amount: string, category: string, account: string) => {
    if (timer.current) clearTimeout(timer.current);
    setContent({ title, amount, category, account });
    setOpen(true);
    timer.current = setTimeout(() => setOpen(false), 2200);
  };
  return { content, hide: () => setOpen(false), open, show };
}
