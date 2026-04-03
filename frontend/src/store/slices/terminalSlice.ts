import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Lot sizes ───────────────────────────────────────────────────────────────
export const LOT_SIZES: Record<string, number> = {
  NIFTY:      65,
  BANKNIFTY:  30,
  FINNIFTY:   60,
  MIDCPNIFTY: 120,
  BANKEX:     30,
  SENSEX:     20,
};

// Strike step per index
export const STRIKE_STEPS: Record<string, number> = {
  NIFTY:      50,
  BANKNIFTY:  100,
  FINNIFTY:   50,
  MIDCPNIFTY: 25,
  BANKEX:     100,
  SENSEX:     100,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelectedContract {
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  ltp: number | null;
}

export interface OrderEntry {
  id: string;
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  transactionType: 'BUY' | 'SELL';
  lots: number;
  quantity: number;
  lotSize: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  executedPrice: number | null;
  placedAt: string;
  executedAt: string | null;
  targetPts: number | null;
  slPts: number | null;
  trailPts: number | null;
  mtmTrailPts: number | null;
}

export interface Position {
  id: string;
  indexName: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  side: 'BUY' | 'SELL';
  lots: number;
  quantity: number;
  lotSize: number;
  entryPrice: number;
  currentLtp: number | null;
  pnl: number | null;
  openedAt: string;
  // Editable risk params (can be changed from Positions panel)
  targetPts: number | null;
  slPts: number | null;
  trailPts: number | null;
  mtmTrailPts: number | null;
  highestPnl: number | null;
  status: 'OPEN' | 'CLOSED';
}

interface TerminalState {
  // ── Contracts added from OptionSelector ─────────────────────────────────
  selectedContracts: SelectedContract[];

  // Per-index data (built as user adds contracts)
  indexExpiries: Record<string, string[]>;   // { NIFTY: ['2024-12-05', ...], BANKNIFTY: [...] }
  indexStrikes: Record<string, number[]>;    // { NIFTY: [24000, 24050, ...] }
  atmStrikes: Record<string, number>;        // { NIFTY: 24000, BANKNIFTY: 52000 }
  addedIndexes: string[];                    // ordered list of indexes user added

  // ── Active selection in terminal ─────────────────────────────────────────
  activeIndexName: string;
  activeExpiry: string;
  ceStrike: number | null;
  peStrike: number | null;
  ceLtp: number | null;
  peLtp: number | null;

  // ── Order inputs ──────────────────────────────────────────────────────────
  lots: number;
  ceBuyLimit: string;
  ceSellLimit: string;
  peBuyLimit: string;
  peSellLimit: string;

  // ── Predefined risk per trade ─────────────────────────────────────────────
  pdTarget: string;
  pdSL: string;
  pdTrail: string;
  mtmTrail: string;

  // ── Global MTM protection (Positions panel) ───────────────────────────────
  globalMtmTarget: string;   // ₹ profit at which all positions auto-close
  globalMtmSL: string;       // ₹ loss at which all positions auto-close

  // ── Checkboxes ────────────────────────────────────────────────────────────
  limitOnLtp: boolean;
  slLimitProtection: boolean;

  // ── Books ─────────────────────────────────────────────────────────────────
  orders: OrderEntry[];
  positions: Position[];

  // ── UI ────────────────────────────────────────────────────────────────────
  activeTab: number;  // 0=Orders 1=Trades
  loading: boolean;
  error: string | null;
}

// ─── Default strikes for NIFTY so terminal is usable before any contract added
const DEFAULT_ATM = 24000;
const DEFAULT_NIFTY_STRIKES = Array.from({ length: 41 }, (_, i) =>
  DEFAULT_ATM + (i - 20) * STRIKE_STEPS['NIFTY']
);

const initialState: TerminalState = {
  selectedContracts: [],
  indexExpiries: { NIFTY: [] },
  indexStrikes: { NIFTY: DEFAULT_NIFTY_STRIKES },
  atmStrikes: { NIFTY: DEFAULT_ATM },
  addedIndexes: ['NIFTY'],

  activeIndexName: 'NIFTY',
  activeExpiry: '',
  ceStrike: DEFAULT_ATM,
  peStrike: DEFAULT_ATM,
  ceLtp: null,
  peLtp: null,

  lots: 1,
  ceBuyLimit: '',
  ceSellLimit: '',
  peBuyLimit: '',
  peSellLimit: '',

  pdTarget: '',
  pdSL: '',
  pdTrail: '',
  mtmTrail: '',

  globalMtmTarget: '',
  globalMtmSL: '',

  limitOnLtp: false,
  slLimitProtection: false,

  orders: [],
  positions: [],

  activeTab: 0,
  loading: false,
  error: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPnl(pos: Position): number | null {
  if (pos.currentLtp === null) return null;
  const dir = pos.side === 'BUY' ? 1 : -1;
  return (pos.currentLtp - pos.entryPrice) * pos.quantity * dir;
}

function buildStrikeList(atm: number, index: string, count = 41): number[] {
  const step = STRIKE_STEPS[index] ?? 50;
  return Array.from({ length: count }, (_, i) => atm + (i - Math.floor(count / 2)) * step);
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {

    // ── Called from OptionSelector after API success ──────────────────────────
    addToTerminal: (
      state,
      action: PayloadAction<{
        contract: SelectedContract;
        expiryDate: string;
        atmStrike: number;
        allExpiries: string[];   // full expiry list for this index
      }>
    ) => {
      const { contract: c, expiryDate, atmStrike, allExpiries } = action.payload;
      const key = `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}`;

      // Add contract if new
      if (!state.selectedContracts.find(
        (x) => `${x.indexName}-${x.strikePrice}-${x.expiryDate}-${x.optionType}` === key
      )) {
        state.selectedContracts.push(c);
      }

      // Register index
      if (!state.addedIndexes.includes(c.indexName)) {
        state.addedIndexes.push(c.indexName);
      }

      // Update expiries for this index
      state.indexExpiries[c.indexName] = allExpiries;

      // Update ATM and build strike list
      state.atmStrikes[c.indexName] = atmStrike;
      state.indexStrikes[c.indexName] = buildStrikeList(atmStrike, c.indexName);

      // Switch active index/expiry to newly added contract
      state.activeIndexName = c.indexName;
      state.activeExpiry = expiryDate;

      // Auto-set strike for the relevant side
      if (c.optionType === 'CE') {
        state.ceStrike = c.strikePrice;
        state.ceLtp = c.ltp;
      } else {
        state.peStrike = c.strikePrice;
        state.peLtp = c.ltp;
      }
    },

    removeFromTerminal: (state, action: PayloadAction<string>) => {
      state.selectedContracts = state.selectedContracts.filter(
        (c) => `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` !== action.payload
      );
    },

    // ── Active index/expiry selection in terminal dropdowns ──────────────────
    setActiveIndexName: (state, action: PayloadAction<string>) => {
      state.activeIndexName = action.payload;
      // Switch expiry to first available for this index
      const expiries = state.indexExpiries[action.payload] ?? [];
      state.activeExpiry = expiries[0] ?? '';
      // Default strikes to ATM
      const atm = state.atmStrikes[action.payload];
      if (atm) {
        state.ceStrike = atm;
        state.peStrike = atm;
        state.ceLtp = null;
        state.peLtp = null;
      }
    },

    setActiveExpiry: (state, action: PayloadAction<string>) => {
      state.activeExpiry = action.payload;
      // Update LTPs from selectedContracts for the new expiry
      const ceC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName &&
               c.expiryDate === action.payload &&
               c.strikePrice === state.ceStrike && c.optionType === 'CE'
      );
      state.ceLtp = ceC?.ltp ?? null;
      const peC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName &&
               c.expiryDate === action.payload &&
               c.strikePrice === state.peStrike && c.optionType === 'PE'
      );
      state.peLtp = peC?.ltp ?? null;
    },

    // ── Strike selection (also used by stepper +/-) ───────────────────────────
    setCeStrike: (state, action: PayloadAction<number>) => {
      state.ceStrike = action.payload;
      const c = state.selectedContracts.find(
        (x) => x.indexName === state.activeIndexName &&
               x.expiryDate === state.activeExpiry &&
               x.strikePrice === action.payload && x.optionType === 'CE'
      );
      state.ceLtp = c?.ltp ?? null;
    },
    setPeStrike: (state, action: PayloadAction<number>) => {
      state.peStrike = action.payload;
      const c = state.selectedContracts.find(
        (x) => x.indexName === state.activeIndexName &&
               x.expiryDate === state.activeExpiry &&
               x.strikePrice === action.payload && x.optionType === 'PE'
      );
      state.peLtp = c?.ltp ?? null;
    },

    // Stepper helpers — move strike up/down by one step in the list
    stepCeStrike: (state, action: PayloadAction<1 | -1>) => {
      const strikes = state.indexStrikes[state.activeIndexName] ?? [];
      const idx = strikes.indexOf(state.ceStrike ?? 0);
      const next = strikes[idx + action.payload];
      if (next !== undefined) {
        state.ceStrike = next;
        const c = state.selectedContracts.find(
          (x) => x.indexName === state.activeIndexName &&
                 x.expiryDate === state.activeExpiry &&
                 x.strikePrice === next && x.optionType === 'CE'
        );
        state.ceLtp = c?.ltp ?? null;
      }
    },
    stepPeStrike: (state, action: PayloadAction<1 | -1>) => {
      const strikes = state.indexStrikes[state.activeIndexName] ?? [];
      const idx = strikes.indexOf(state.peStrike ?? 0);
      const next = strikes[idx + action.payload];
      if (next !== undefined) {
        state.peStrike = next;
        const c = state.selectedContracts.find(
          (x) => x.indexName === state.activeIndexName &&
                 x.expiryDate === state.activeExpiry &&
                 x.strikePrice === next && x.optionType === 'PE'
        );
        state.peLtp = c?.ltp ?? null;
      }
    },

    // ── LTP live updates ──────────────────────────────────────────────────────
    updateContractLtp: (state, action: PayloadAction<{ key: string; ltp: number }>) => {
      const contract = state.selectedContracts.find(
        (c) => `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` === action.payload.key
      );
      if (contract) contract.ltp = action.payload.ltp;

      const ceC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName && c.expiryDate === state.activeExpiry &&
               c.strikePrice === state.ceStrike && c.optionType === 'CE'
      );
      if (ceC) state.ceLtp = ceC.ltp;

      const peC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName && c.expiryDate === state.activeExpiry &&
               c.strikePrice === state.peStrike && c.optionType === 'PE'
      );
      if (peC) state.peLtp = peC.ltp;

      state.positions.forEach((pos) => {
        if (
          pos.status === 'OPEN' &&
          `${pos.indexName}-${pos.strikePrice}-${pos.expiryDate}-${pos.optionType}` === action.payload.key
        ) {
          pos.currentLtp = action.payload.ltp;
          pos.pnl = calcPnl(pos);
          if (pos.pnl !== null && (pos.highestPnl === null || pos.pnl > pos.highestPnl)) {
            pos.highestPnl = pos.pnl;
          }
        }
      });
    },

    // ── Lots stepper ──────────────────────────────────────────────────────────
    setLots: (state, action: PayloadAction<number>) => { state.lots = Math.max(1, action.payload); },
    stepLots: (state, action: PayloadAction<1 | -1>) => {
      state.lots = Math.max(1, state.lots + action.payload);
    },

    // ── Simple setters ────────────────────────────────────────────────────────
    setCeLtp:             (s, a: PayloadAction<number>)  => { s.ceLtp             = a.payload; },
    setPeLtp:             (s, a: PayloadAction<number>)  => { s.peLtp             = a.payload; },
    setCeBuyLimit:        (s, a: PayloadAction<string>)  => { s.ceBuyLimit        = a.payload; },
    setCeSellLimit:       (s, a: PayloadAction<string>)  => { s.ceSellLimit       = a.payload; },
    setPeBuyLimit:        (s, a: PayloadAction<string>)  => { s.peBuyLimit        = a.payload; },
    setPeSellLimit:       (s, a: PayloadAction<string>)  => { s.peSellLimit       = a.payload; },
    setPdTarget:          (s, a: PayloadAction<string>)  => { s.pdTarget          = a.payload; },
    setPdSL:              (s, a: PayloadAction<string>)  => { s.pdSL              = a.payload; },
    setPdTrail:           (s, a: PayloadAction<string>)  => { s.pdTrail           = a.payload; },
    setMtmTrail:          (s, a: PayloadAction<string>)  => { s.mtmTrail          = a.payload; },
    setGlobalMtmTarget:   (s, a: PayloadAction<string>)  => { s.globalMtmTarget   = a.payload; },
    setGlobalMtmSL:       (s, a: PayloadAction<string>)  => { s.globalMtmSL       = a.payload; },
    setLimitOnLtp:        (s, a: PayloadAction<boolean>) => { s.limitOnLtp        = a.payload; },
    setSlLimitProtection: (s, a: PayloadAction<boolean>) => { s.slLimitProtection = a.payload; },
    setActiveTab:         (s, a: PayloadAction<number>)  => { s.activeTab          = a.payload; },

    // ── Order placement ───────────────────────────────────────────────────────
    placeOrder: (
      state,
      action: PayloadAction<Omit<OrderEntry, 'id' | 'placedAt' | 'executedAt' | 'status' | 'executedPrice'>>
    ) => {
      state.orders.unshift({
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'PENDING',
        executedPrice: null,
        placedAt: new Date().toISOString(),
        executedAt: null,
      });
    },

    executeOrderLocally: (state, action: PayloadAction<{ id: string; executedPrice: number }>) => {
      const order = state.orders.find((o) => o.id === action.payload.id);
      if (!order || order.status !== 'PENDING') return;

      order.status = 'EXECUTED';
      order.executedPrice = action.payload.executedPrice;
      order.executedAt = new Date().toISOString();

      const posKey = `${order.indexName}-${order.strikePrice}-${order.expiryDate}-${order.optionType}`;
      const existing = state.positions.find(
        (p) => p.status === 'OPEN' &&
               `${p.indexName}-${p.strikePrice}-${p.expiryDate}-${p.optionType}` === posKey &&
               p.side === order.transactionType
      );

      if (existing) {
        const totalQty = existing.quantity + order.quantity;
        existing.entryPrice =
          (existing.entryPrice * existing.quantity + action.payload.executedPrice * order.quantity) / totalQty;
        existing.lots     += order.lots;
        existing.quantity  = totalQty;
      } else {
        state.positions.unshift({
          id:          `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          indexName:   order.indexName,
          strikePrice: order.strikePrice,
          expiryDate:  order.expiryDate,
          optionType:  order.optionType,
          side:        order.transactionType,
          lots:        order.lots,
          quantity:    order.quantity,
          lotSize:     order.lotSize,
          entryPrice:  action.payload.executedPrice,
          currentLtp:  action.payload.executedPrice,
          pnl:         0,
          openedAt:    new Date().toISOString(),
          targetPts:   order.targetPts,
          slPts:       order.slPts,
          trailPts:    order.trailPts,
          mtmTrailPts: order.mtmTrailPts,
          highestPnl:  null,
          status:      'OPEN',
        });
      }
    },

    updateOrderStatus: (
      state,
      action: PayloadAction<{ id: string; status: OrderEntry['status']; executedPrice?: number }>
    ) => {
      const order = state.orders.find((o) => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
        if (action.payload.executedPrice !== undefined) {
          order.executedPrice = action.payload.executedPrice;
          order.executedAt = new Date().toISOString();
        }
      }
    },

    // ── Edit per-position risk params from Positions panel ────────────────────
    updatePositionRiskParams: (
      state,
      action: PayloadAction<{
        id: string;
        targetPts?: number | null;
        slPts?: number | null;
        trailPts?: number | null;
        mtmTrailPts?: number | null;
      }>
    ) => {
      const pos = state.positions.find((p) => p.id === action.payload.id);
      if (!pos) return;
      if (action.payload.targetPts  !== undefined) pos.targetPts   = action.payload.targetPts;
      if (action.payload.slPts      !== undefined) pos.slPts       = action.payload.slPts;
      if (action.payload.trailPts   !== undefined) pos.trailPts    = action.payload.trailPts;
      if (action.payload.mtmTrailPts !== undefined) pos.mtmTrailPts = action.payload.mtmTrailPts;
    },

    cancelOrder: (state, action: PayloadAction<string>) => {
      const o = state.orders.find((o) => o.id === action.payload);
      if (o && o.status === 'PENDING') o.status = 'CANCELLED';
    },

    closePosition: (state, action: PayloadAction<string>) => {
      const p = state.positions.find((p) => p.id === action.payload);
      if (p) p.status = 'CLOSED';
    },

    closeAllPositions: (state) => {
      state.positions.forEach((p) => { if (p.status === 'OPEN') p.status = 'CLOSED'; });
    },

    cancelAllOrders: (state) => {
      state.orders.forEach((o) => { if (o.status === 'PENDING') o.status = 'CANCELLED'; });
    },

    setLoading: (s, a: PayloadAction<boolean>)      => { s.loading = a.payload; },
    setError:   (s, a: PayloadAction<string | null>) => { s.error   = a.payload; },
  },
});

export const {
  addToTerminal, removeFromTerminal, updateContractLtp,
  setActiveIndexName, setActiveExpiry,
  setCeStrike, setPeStrike, stepCeStrike, stepPeStrike,
  setCeLtp, setPeLtp,
  setLots, stepLots,
  setCeBuyLimit, setCeSellLimit, setPeBuyLimit, setPeSellLimit,
  setPdTarget, setPdSL, setPdTrail, setMtmTrail,
  setGlobalMtmTarget, setGlobalMtmSL,
  setLimitOnLtp, setSlLimitProtection,
  setActiveTab,
  placeOrder, executeOrderLocally, updateOrderStatus,
  updatePositionRiskParams,
  cancelOrder, closePosition, closeAllPositions, cancelAllOrders,
  setLoading, setError,
} = terminalSlice.actions;

export default terminalSlice.reducer;