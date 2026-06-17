import React, { useState, useEffect } from 'react';
import { HomeStorePicker } from '../components/HomeStorePicker';
import { EditorContainer } from './EditorContainer';
import { useCurrentWorkspace } from '@/lib/stores';

interface Props {
  storeName?: string;
  isInsideAdmin?: boolean;
  onExit?: () => void;
}

export default function EstampasApp({ storeName: externalStoreName, isInsideAdmin, onExit }: Props) {
  const currentWorkspace = useCurrentWorkspace();
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (externalStoreName) {
      setStoreName(externalStoreName);
    } else if (currentWorkspace?.name) {
      setStoreName(currentWorkspace.name);
    }
  }, [currentWorkspace, externalStoreName]);

  if (!storeName) {
    return <HomeStorePicker onStart={setStoreName} />;
  }

  return <EditorContainer storeName={storeName} onExit={() => { setStoreName(null); if (onExit) onExit(); }} isInsideAdmin={isInsideAdmin ?? !!currentWorkspace} />;
}
