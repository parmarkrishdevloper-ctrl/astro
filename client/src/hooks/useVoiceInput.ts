// useVoiceInput — Web Speech API wrapper.
//
// Browser support: Chrome, Edge, Safari (prefixed). Firefox: no.
// Returns a `supported` flag so callers can hide the button gracefully.
//
//   const v = useVoiceInput('en-IN');
//   <button onClick={v.toggle}>{v.listening ? 'Stop' : 'Speak'}</button>
//   {v.transcript && <div>{v.transcript}</div>}

import { useCallback, useEffect, useRef, useState } from 'react';

// The two vendor-prefixed globals. Not in stock TS lib.dom — guard with `any`.
type SR = any;

function getRecognizerCtor(): any {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceInput(lang: string = 'en-IN') {
  const supported = typeof window !== 'undefined' && !!getRecognizerCtor();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim,    setInterim]    = useState('');
  const [error,      setError]      = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);

  const start = useCallback(() => {
    if (!supported) {
      setError('Voice input not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    setInterim('');
    const Ctor = getRecognizerCtor();
    const rec: SR = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (evt: any) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const res = evt.results[i];
        if (res.isFinal) finalStr += res[0].transcript;
        else interimStr += res[0].transcript;
      }
      if (finalStr) setTranscript((t) => (t ? t + ' ' : '') + finalStr.trim());
      setInterim(interimStr);
    };
    rec.onerror = (e: any) => setError(e?.error ?? 'Speech recognition error');
    rec.onend = () => { setListening(false); setInterim(''); };
    rec.start();
    recRef.current = rec;
    setListening(true);
  }, [lang, supported]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => { listening ? stop() : start(); }, [listening, start, stop]);

  const reset = useCallback(() => { setTranscript(''); setInterim(''); setError(null); }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { try { recRef.current?.stop(); } catch { /* ignore */ } };
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, toggle, reset };
}
