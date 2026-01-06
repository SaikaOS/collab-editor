export type User = {
    name: string;
    color: string;
  };
  
  export const USERS: User[] = [
    { name: 'Alex', color: '#f472b6' }, 
    { name: 'Dan', color: '#3b82f6' }, 
  ];

export interface AwarenessState {
  user: User
  focusedField: string | null
}