import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OptionContract {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  ltp: number;
  lastUpdated: string;
}

export interface WatchedContract {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  updateInterval: number; // 500ms, 1000ms, or 2000ms
}

interface OptionsState {
  selectedIndex: string;
  selectedStrikeOffset: number; // 1-40 (strikes above/below ATM)
  selectedExpiryIndex: number; // 1-5
  availableExpiries: string[];
  availableStrikes: number[];
  atmStrike: number | null;
  spotPrice: number | null;
  watchedContracts: WatchedContract[];
  contractLTPs: Record<string, OptionContract>;
  loading: boolean;
  error: string | null;
}

const initialState: OptionsState = {
  selectedIndex: 'NIFTY',
  selectedStrikeOffset: 0,
  selectedExpiryIndex: 1,
  availableExpiries: [],
  availableStrikes: [],
  atmStrike: null,
  spotPrice: null,
  watchedContracts: [],
  contractLTPs: {},
  loading: false,
  error: null,
};

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    setSelectedIndex: (state, action: PayloadAction<string>) => {
      state.selectedIndex = action.payload;
      state.selectedStrikeOffset = 0;
      state.selectedExpiryIndex = 1;
    },
    setSelectedStrikeOffset: (state, action: PayloadAction<number>) => {
      state.selectedStrikeOffset = action.payload;
    },
    setSelectedExpiryIndex: (state, action: PayloadAction<number>) => {
      state.selectedExpiryIndex = action.payload;
    },
    setAvailableExpiries: (state, action: PayloadAction<string[]>) => {
      state.availableExpiries = action.payload;
    },
    setAvailableStrikes: (state, action: PayloadAction<number[]>) => {
      state.availableStrikes = action.payload;
    },
    setAtmStrike: (state, action: PayloadAction<number>) => {
      state.atmStrike = action.payload;
    },
    setSpotPrice: (state, action: PayloadAction<number>) => {
      state.spotPrice = action.payload;
    },
    addWatchedContract: (state, action: PayloadAction<WatchedContract>) => {
      const key = `${action.payload.indexName}-${action.payload.strikePrice}-${action.payload.expiryDate}-${action.payload.optionType}`;
      const exists = state.watchedContracts.find(
        (c) =>
          `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` === key
      );
      if (!exists) {
        state.watchedContracts.push(action.payload);
      }
    },
    removeWatchedContract: (state, action: PayloadAction<string>) => {
      state.watchedContracts = state.watchedContracts.filter(
        (c) =>
          `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` !==
          action.payload
      );
    },
    updateContractLTP: (state, action: PayloadAction<OptionContract>) => {
      const key = `${action.payload.indexName}-${action.payload.strikePrice}-${action.payload.expiryDate}-${action.payload.optionType}`;
      state.contractLTPs[key] = action.payload;
    },
    updateMultipleContractLTPs: (state, action: PayloadAction<OptionContract[]>) => {
      action.payload.forEach((contract) => {
        const key = `${contract.indexName}-${contract.strikePrice}-${contract.expiryDate}-${contract.optionType}`;
        state.contractLTPs[key] = contract;
      });
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSelectedIndex,
  setSelectedStrikeOffset,
  setSelectedExpiryIndex,
  setAvailableExpiries,
  setAvailableStrikes,
  setAtmStrike,
  setSpotPrice,
  addWatchedContract,
  removeWatchedContract,
  updateContractLTP,
  updateMultipleContractLTPs,
  setLoading,
  setError,
  clearError,
} = optionsSlice.actions;

export default optionsSlice.reducer;