import React, { useState, useEffect } from 'react';
import { HomeStorePicker } from '../components/HomeStorePicker';
import { EditorContainer } from './EditorContainer';
import { useCurrentWorkspace } from '@/lib/stores';

export default function EstampasApp() {
  const currentWorkspace = useCurrentWorkspace();
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace?.name) {
      setStoreName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  if (!storeName) {
    return <HomeStorePicker onStart={setStoreName} />;
  }

  return <EditorContainer storeName={storeName} onExit={() => setStoreName(null)} isInsideAdmin={!!currentWorkspace} />;
}
