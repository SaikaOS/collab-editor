import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { User, AwarenessState } from '../types/types'
import { WebrtcProvider } from 'y-webrtc'

interface FieldEditorProps {
  ydoc: Y.Doc;
  provider: WebrtcProvider; 
  fieldName: string;
  currentUser: User | undefined;
  label: string;
}

const FieldEditor = ({ ydoc, provider, fieldName, currentUser, label }: FieldEditorProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<User | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc, field: fieldName }),
      CollaborationCaret.configure({ provider, user: currentUser }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[40px] p-2 bg-white rounded border-none w-full prose prose-sm max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editable: !isLocked,
      });
    }
  }, [isLocked, editor]);

  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;

    const handleAwareness = () => {
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

    awareness.on('change', handleAwareness);
    return () => awareness.off('change', handleAwareness);
  }, [provider, fieldName]);

  useEffect(() => {
    const awareness = provider.awareness;
    if (!editor || !awareness) return;

    const onFocus = () => {
      awareness.setLocalStateField('focusedField', fieldName);
    };

    const onBlur = () => {
      const currentState = awareness.getLocalState() as AwarenessState | null;
      if (currentState?.focusedField === fieldName) {
        awareness.setLocalStateField('focusedField', null);
      }
    };

    editor.on('focus', onFocus);
    editor.on('blur', onBlur);

    return () => {
      editor.off('focus', onFocus);
      editor.off('blur', onBlur);
    };
  }, [editor, provider.awareness, fieldName]);

  const handleForceUnlock = () => {
    const awareness = provider.awareness;
    if (!awareness || !editor) return;

    setIsLocked(false);
    setLockedBy(null);

    awareness.setLocalStateField('focusedField', fieldName);

    editor.setOptions({ editable: true });
    
    setTimeout(() => {
      editor.chain().focus().run();
    }, 10);
  };

  return (
    <div className="mb-8 relative" style={{ zIndex: editor?.isFocused ? 20 : 1 }}>
      <div className="flex justify-between items-end mb-1">
        <label className="text-sm font-bold text-gray-600 uppercase tracking-wider">{label}</label>
        {isLocked && (
          <button 
            onClick={handleForceUnlock}
            className="text-[11px] cursor-pointer bg-red-400 text-white px-2 py-1 rounded-md"
          >
            Вытеснить {lockedBy?.name}
          </button>
        )}
      </div>
      
      <div 
        className={`relative transition-all duration-300 border-2 rounded-xl overflow-hidden ${
          isLocked ? 'bg-gray-50 border-gray-200' : 'bg-white shadow-sm border-gray-200'
        }`}
        style={{ 
          borderColor: isLocked ? lockedBy?.color : (editor?.isFocused ? currentUser?.color : '#e2e8f0'),
          boxShadow: editor?.isFocused ? `0 0 0 4px ${currentUser?.color}20` : 'none'
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default FieldEditor;