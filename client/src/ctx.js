import { createContext, useContext } from 'react';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
export const navigate = (to) => {
  window.location.hash = to;
};
