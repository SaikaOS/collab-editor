'use client'
import * as Y from 'yjs'
import { useMemo, useState, useEffect } from 'react'
import TiptapCollabProvider from '@tiptap-pro/provider'
import FieldEditor from './FieldEditor'
import { User, USERS, AwarenessState } from '../types/types'

const appId = '7j9y6m10'
const roomName = 'collab-editor'

const App = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const { provider, ydoc } = useMemo(() => {
    const ydoc = new Y.Doc()
    const provider = new TiptapCollabProvider({
      appId,
      name: roomName,
      document: ydoc,
    })
    return { provider, ydoc }
  }, [])

  useEffect(() => {
    if (!provider?.awareness) return;

    const updateUsers = () => {
      const states = provider.awareness?.getStates() as Map<number, AwarenessState>;
      const users: User[] = [];
      states.forEach((state) => {
        if (state.user) users.push(state.user);
      });
      setActiveUsers(users);
    };

    provider.awareness.on('change', updateUsers);
    return () => provider.awareness?.off('change', updateUsers);
  }, [provider]);

  const handleUserSelect = (u: User) => {
    setSelectedUser(u);
    if (provider?.awareness) {
      provider.awareness.setLocalStateField('user', u);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc]">
        <div className="bg-white p-10 rounded-3xl text-center border border-gray-100">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Collab Editor</h2>
          <p className="text-gray-500 mb-8">Выберите аккаунт для начала редактирования</p>
          <div className="flex gap-10 justify-center">
            {USERS.map(u => (
              <button
                key={u.name}
                onClick={() => handleUserSelect(u)}
                className="group relative flex flex-col items-center cursor-pointer"
              >
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white font-bold transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name[0]}
                </div>
                <span className="mt-3 font-bold text-gray-700">{u.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-12">
      <div className="max-w-3xl mx-auto bg-white rounded-4xl shadow-2xl overflow-hidden border border-white">
        <header className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: selectedUser.color }}>
              {selectedUser.name[0]}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Проект №1</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-400 font-medium">Онлайн синхронизация активна</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase mr-2">Онлайн:</span>
            <div className="flex -space-x-3">
              {activeUsers.map((user, i) => (
                <div 
                  key={i}
                  className="w-9 h-9 rounded-full border-4 border-white flex items-center justify-center text-xs text-white font-black shadow-sm"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name[0]}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="p-8 md:p-12">
          <FieldEditor 
            label="Имя проекта" 
            fieldName="project_title"
            ydoc={ydoc} 
            provider={provider} 
            currentUser={selectedUser} 
          />

          <FieldEditor 
            label="Описание" 
            fieldName="project_description"
            ydoc={ydoc} 
            provider={provider} 
            currentUser={selectedUser} 
          />
        </div>
      </div>
    </div>
  )
}

export default App