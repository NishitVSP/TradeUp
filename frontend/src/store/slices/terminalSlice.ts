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
  // Risk params attached at time of order
  targetPts: number | null;
  slPts: number | null;
  trailPts: number | null;
  // NOTE: mtmTrailPts removed from order-level — MTM trailing is a global/position-level concern
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
  // Editable risk params (user can edit from Positions panel after trade)
  targetPts: number | null;
  slPts: number | null;
  trailPts: number | null;
  mtmTrailPts: number | null;  // kept here — global/position-level MTM trail
  highestPnl: number | null;
  status: 'OPEN' | 'CLOSED';
}

// Shape of an order row returned from the backend (schema-aligned)
export interface ApiOrderRow {
  order_id: number;
  index_name: string;
  strike_price: number;
  expiry_date: string;
  option_type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  order_type: 'LMT' | 'MKT' | 'SL';
  quantity: number;
  limit_price: number | null;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  placed_at: string;
  executed_at: string | null;
  execution_price: number | null;
}

interface TerminalState {
  selectedContracts: SelectedContract[];

  // Per-index: only the expiries the user has actually selected in OptionSelector
  indexSelectedExpiries: Record<string, string[]>;
  // Per-index: only the strikes the user has actually selected in OptionSelector
  indexSelectedStrikes: Record<string, number[]>;
  atmStrikes: Record<string, number>;
  addedIndexes: string[];

  activeIndexName: string;
  activeExpiry: string;
  ceStrike: number | null;
  peStrike: number | null;
  ceLtp: number | null;
  peLtp: number | null;

  lots: number;
  ceBuyLimit: string;
  ceSellLimit: string;
  peBuyLimit: string;
  peSellLimit: string;

  // Predefined pts for next trade (mtmTrail removed)
  pdTarget: string;
  pdSL: string;
  pdTrail: string;

  // Global MTM protection in Positions panel
  globalMtmTarget: string;
  globalMtmSL: string;

  limitOnLtp: boolean;
  slLimitProtection: boolean;

  // Optimistic orders placed this session (before backend fetch)
  orders: OrderEntry[];
  positions: Position[];

  activeTab: number;
  loading: boolean;
  error: string | null;
}

const DEFAULT_ATM = 24000;

const initialState: TerminalState = {
  selectedContracts: [],
  indexSelectedExpiries: {},
  indexSelectedStrikes: {},
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

// Append a value to a de-duped array
function appendUnique<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr : [...arr, val];
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {

    // ── Called from OptionSelector "Add to Terminal" ──────────────────────────
    // Adds all strikes from ATM to the selected offset (inclusive)
    addToTerminal: (
      state,
      action: PayloadAction<{
        contracts: SelectedContract[];
        expiryDate: string;      // the one expiry the user picked
        atmStrike: number;
      }>
    ) => {
      const { contracts, expiryDate, atmStrike } = action.payload;

      contracts.forEach((c) => {
        const key = `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}`;

        // Add contract if not already present
        if (!state.selectedContracts.find(
          (x) => `${x.indexName}-${x.strikePrice}-${x.expiryDate}-${x.optionType}` === key
        )) {
          state.selectedContracts.push(c);
        }
      });

      // Register index (use first contract's indexName)
      const indexName = contracts[0]?.indexName;
      if (indexName && !state.addedIndexes.includes(indexName)) {
        state.addedIndexes.push(indexName);
      }

      // Append this expiry to per-index selected expiries (de-duped)
      const prevExpiries = state.indexSelectedExpiries[indexName] ?? [];
      state.indexSelectedExpiries[indexName] = appendUnique(prevExpiries, expiryDate);

      // Append all strikes to per-index selected strikes (de-duped, sorted asc)
      const prevStrikes = state.indexSelectedStrikes[indexName] ?? [];
      const newStrikes = contracts.reduce((arr, c) => appendUnique(arr, c.strikePrice), prevStrikes);
      state.indexSelectedStrikes[indexName] = [...newStrikes].sort((a, b) => a - b);

      // Update ATM snapshot
      state.atmStrikes[indexName] = atmStrike;

      // Switch active context to what was just added
      state.activeIndexName = indexName;
      state.activeExpiry = expiryDate;

      // Set active strikes to the first contract (usually ATM)
      const firstContract = contracts[0];
      if (firstContract) {
        if (firstContract.optionType === 'CE') {
          state.ceStrike = firstContract.strikePrice;
          state.ceLtp = firstContract.ltp;
        } else {
          state.peStrike = firstContract.strikePrice;
          state.peLtp = firstContract.ltp;
        }
      }
    },

    removeFromTerminal: (state, action: PayloadAction<string>) => {
      state.selectedContracts = state.selectedContracts.filter(
        (c) => `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` !== action.payload
      );
    },

    // ── Active index / expiry ─────────────────────────────────────────────────
    setActiveIndexName: (state, action: PayloadAction<string>) => {
      state.activeIndexName = action.payload;
      const expiries = state.indexSelectedExpiries[action.payload] ?? [];
      state.activeExpiry = expiries[0] ?? '';
      const atm = state.atmStrikes[action.payload];
      if (atm !== undefined) {
        state.ceStrike = atm;
        state.peStrike = atm;
        state.ceLtp = null;
        state.peLtp = null;
      }
    },

    setActiveExpiry: (state, action: PayloadAction<string>) => {
      state.activeExpiry = action.payload;
      const ceC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName && c.expiryDate === action.payload &&
               c.strikePrice === state.ceStrike && c.optionType === 'CE'
      );
      state.ceLtp = ceC?.ltp ?? null;
      const peC = state.selectedContracts.find(
        (c) => c.indexName === state.activeIndexName && c.expiryDate === action.payload &&
               c.strikePrice === state.peStrike && c.optionType === 'PE'
      );
      state.peLtp = peC?.ltp ?? null;
    },

    // ── Strike selection ──────────────────────────────────────────────────────
    setCeStrike: (state, action: PayloadAction<number>) => {
      state.ceStrike = action.payload;
      const c = state.selectedContracts.find(
        (x) => x.indexName === state.activeIndexName && x.expiryDate === state.activeExpiry &&
               x.strikePrice === action.payload && x.optionType === 'CE'
      );
      state.ceLtp = c?.ltp ?? null;
    },

    setPeStrike: (state, action: PayloadAction<number>) => {
      state.peStrike = action.payload;
      const c = state.selectedContracts.find(
        (x) => x.indexName === state.activeIndexName && x.expiryDate === state.activeExpiry &&
               x.strikePrice === action.payload && x.optionType === 'PE'
      );
      state.peLtp = c?.ltp ?? null;
    },

    // Step through the selected strikes list (only user-added strikes)
    stepCeStrike: (state, action: PayloadAction<1 | -1>) => {
      const strikes = state.indexSelectedStrikes[state.activeIndexName] ?? [];
      const idx = strikes.indexOf(state.ceStrike ?? 0);
      const next = strikes[idx + action.payload];
      if (next !== undefined) {
        state.ceStrike = next;
        const c = state.selectedContracts.find(
          (x) => x.indexName === state.activeIndexName && x.expiryDate === state.activeExpiry &&
                 x.strikePrice === next && x.optionType === 'CE'
        );
        state.ceLtp = c?.ltp ?? null;
      }
    },

    stepPeStrike: (state, action: PayloadAction<1 | -1>) => {
      const strikes = state.indexSelectedStrikes[state.activeIndexName] ?? [];
      const idx = strikes.indexOf(state.peStrike ?? 0);
      const next = strikes[idx + action.payload];
      if (next !== undefined) {
        state.peStrike = next;
        const c = state.selectedContracts.find(
          (x) => x.indexName === state.activeIndexName && x.expiryDate === state.activeExpiry &&
                 x.strikePrice === next && x.optionType === 'PE'
        );
        state.peLtp = c?.ltp ?? null;
      }
    },

    // ── Live LTP updates ──────────────────────────────────────────────────────
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

    // ── Lots ──────────────────────────────────────────────────────────────────
    setLots:  (s, a: PayloadAction<number>) => { s.lots = Math.max(1, a.payload); },
    stepLots: (s, a: PayloadAction<1 | -1>) => { s.lots = Math.max(1, s.lots + a.payload); },

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
    setGlobalMtmTarget:   (s, a: PayloadAction<string>)  => { s.globalMtmTarget   = a.payload; },
    setGlobalMtmSL:       (s, a: PayloadAction<string>)  => { s.globalMtmSL       = a.payload; },
    setLimitOnLtp:        (s, a: PayloadAction<boolean>) => { s.limitOnLtp        = a.payload; },
    setSlLimitProtection: (s, a: PayloadAction<boolean>) => { s.slLimitProtection = a.payload; },
    setActiveTab:         (s, a: PayloadAction<number>)  => { s.activeTab          = a.payload; },

    // ── Order placement (optimistic, session-only) ────────────────────────────
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
          mtmTrailPts: null,
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
      if (action.payload.targetPts   !== undefined) pos.targetPts   = action.payload.targetPts;
      if (action.payload.slPts       !== undefined) pos.slPts       = action.payload.slPts;
      if (action.payload.trailPts    !== undefined) pos.trailPts    = action.payload.trailPts;
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
  setPdTarget, setPdSL, setPdTrail,
  setGlobalMtmTarget, setGlobalMtmSL,
  setLimitOnLtp, setSlLimitProtection,
  setActiveTab,
  placeOrder, executeOrderLocally, updateOrderStatus,
  updatePositionRiskParams,
  cancelOrder, closePosition, closeAllPositions, cancelAllOrders,
  setLoading, setError,
} = terminalSlice.actions;

export default terminalSlice.reducer;