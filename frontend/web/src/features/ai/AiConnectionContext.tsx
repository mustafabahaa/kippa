import { createContext } from 'react';
import type { AiConnectionStatus } from './AiConnectionPanel';

type AiConnectionContextValue = {
  status: AiConnectionStatus;
  setStatus: (status: AiConnectionStatus) => void;
};

export const AiConnectionContext = createContext<AiConnectionContextValue>({
  status: 'checking',
  setStatus: () => {},
});
