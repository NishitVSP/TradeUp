import { configureStore } from '@reduxjs/toolkit';
import optionsReducer from './slices/optionsSlice';
import terminalReducer from './slices/terminalSlice';

export const store = configureStore({
  reducer: {
    options: optionsReducer,
    terminal: terminalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;