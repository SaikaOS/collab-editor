'use client'
import { useEffect, useState, useRef } from 'react'
import * as Y from 'yjs'
import { User, AwarenessState } from '../types/types'
import { WebsocketProvider } from 'y-websocket'

interface FieldEditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider; 
  fieldName: string;
  currentUser: User | undefined;
  label: string;
}

const FieldEditor = ({ ydoc, provider, fieldName, currentUser, label }: FieldEditorProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<User | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  
  const yText = ydoc.getText(fieldName);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const [value, setValue] = useState(() => yText.toString());

  useEffect(() => {
    if (measureRef.current) {
      setTextWidth(measureRef.current.offsetWidth);
    }
  }, [value, isLocked]);

  useEffect(() => {
    const handleYjsChange = (event: Y.YTextEvent) => {
      if (event.transaction.origin !== provider.awareness.clientID) {
        setValue(yText.toString());
      }
    };
    yText.observe(handleYjsChange);

    const handleAwareness = () => {
      const awareness = provider.awareness;
      const states = awareness.getStates() as Map<number, AwarenessState>;
      let foundLock: User | null = null;
      states.forEach((state, clientID) => {
        if (clientID !== awareness.clientID && state.focusedField === fieldName) {
          foundLock = state.user;
        }
      });
      setLockedBy(foundLock);
      setIsLocked(!!foundLock);
    };

    provider.awareness.on('change', handleAwareness);
    return () => {
      yText.unobserve(handleYjsChange);
      provider.awareness.off('change', handleAwareness);
    };
  }, [yText, fieldName, provider]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    ydoc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newValue);
    }, provider.awareness.clientID);
  };

  const onFocus = () => {
    setIsFocused(true);
    provider.awareness.setLocalStateField('focusedField', fieldName);
  };

  const onBlur = () => {
    setIsFocused(false);
    const currentState = provider.awareness.getLocalState() as AwarenessState | null;
    if (currentState?.focusedField === fieldName) {
      provider.awareness.setLocalStateField('focusedField', null);
    }
  };

  const handleForceUnlock = () => {
    setIsLocked(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  return (
    <div className="mb-8 relative" style={{ zIndex: isFocused ? 20 : 1 }}>
      <div className="flex justify-between items-center mb-2 h-6">
        <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          {label}
        </label>
        
        {isLocked && (
          <div className="flex items-center gap-3">
             <button 
                onClick={handleForceUnlock}
                className="text-[11px] cursor-pointer bg-red-400 text-white px-2 py-1 rounded-md"
              >
                Вытеснить
              </button>
          </div>
        )}
      </div>
      
      <div 
        className="relative flex items-center border-2 rounded-xl bg-white px-3 h-13"
        style={{ 
          borderColor: isLocked ? lockedBy?.color : (isFocused ? currentUser?.color : '#e2e8f0'),
          boxShadow: isFocused ? `0 0 0 4px ${currentUser?.color}20` : 'none'
        }}
      >
        <span ref={measureRef} className="absolute invisible whitespace-pre text-base font-sans px-0">
          {value}
        </span>

        {isLocked && lockedBy && (
          <div 
            className="absolute flex flex-col items-start z-20"
            style={{ 
              left: `${Math.min(textWidth + 12, 500)}px`, 
              height: '24px'
            }}
          >
            <div 
              className="w-0.5 h-6 animate-pulse" 
              style={{ backgroundColor: lockedBy.color }}
            />
            <div 
              className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-sm text-[9px] text-white font-black whitespace-nowrap shadow-sm"
              style={{ backgroundColor: lockedBy.color }}
            >
              {lockedBy.name.toUpperCase()}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={isLocked}
          className="w-full h-full outline-none bg-transparent text-gray-800 text-base font-sans disabled:cursor-not-allowed z-10"
          placeholder={isLocked ? "" : "Введите значение..."}
        />
      </div>
    </div>
  );
}

export default FieldEditor;