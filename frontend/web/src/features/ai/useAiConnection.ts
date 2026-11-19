import { useContext } from 'react';
import { AiConnectionContext } from './AiConnectionContext';

export function useAiConnection() {
  return useContext(AiConnectionContext);
}
