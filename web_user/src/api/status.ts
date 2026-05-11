import api from './client';

// Restart the backend system
export const restartSystem = (): Promise<{ message: string }> =>
  api.post<{ message: string }>('/restart');