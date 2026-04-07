import React, { useEffect, useState, useCallback } from 'react';
import { Box, Tabs, TabList, Tab, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveTab, cancelOrder, OrderEntry, ApiOrderRow } from '@/store/slices/terminalSlice';
import { useBeepSound } from '@/hooks/useBeepSound';

const API_BASE = 'http://localhost:3001';

const statusColor = (s: string) =>
  ({ EXECUTED: '#10b981', PENDING: '#f59e0b', CANCELLED: '#9ca3af', FAILED: '#ef4444', REJECTED: '#ef4444' }[s] ?? '#9ca3af');

// ─── Column layout constants ──────────────────────────────────────────────────
const ORDER_COLS = '1.3fr 0.5fr 0.5fr 0.7fr 0.45fr 0.8fr';

// ─── Order Book row (from backend DB) ────────────────────────────────────────
const ApiOrderRow_: React.FC<{ order: ApiOrderRow }> = ({ order }) => (
  <Box sx={{
    display: 'grid', gridTemplateColumns: ORDER_COLS,
    alignItems: 'center', px: '8px', py: '5px',
    borderBottom: '1px solid #f9f9f9', '&:hover': { bgcolor: '#fafafa' },
  }}>
    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>
      {order.index_name} {order.strike_price}
    </Typography>
    <Typography sx={{ fontSize: '10px', fontWeight: 700,
      color: order.option_type === 'CE' ? '#10b981' : '#ef4444' }}>
      {order.option_type}
    </Typography>
    <Typography sx={{ fontSize: '10px', fontWeight: 700,
      color: order.action === 'BUY' ? '#10b981' : '#ef4444' }}>
      {order.action}
    </Typography>
    <Typography sx={{ fontSize: '10px', color: '#374151' }}>
      {order.execution_price !== null ? order.execution_price.toFixed(2)
        : order.limit_price   !== null ? `L:${order.limit_price.toFixed(2)}` : 'MKT'}
    </Typography>
    <Typography sx={{ fontSize: '10px', color: '#374151' }}>{order.quantity}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: statusColor(order.status), flexShrink: 0 }} />
      <Typography sx={{ fontSize: '9px', color: statusColor(order.status), fontWeight: 600 }}>
        {order.status}
      </Typography>
    </Box>
  </Box>
);

// ─── Trade Book row (from Redux session) ─────────────────────────────────────
const SessionOrderRow: React.FC<{ order: OrderEntry }> = ({ order }) => {
  const dispatch = useDispatch();
  const playBeep = useBeepSound();

  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: ORDER_COLS,
      alignItems: 'center', px: '8px', py: '5px',
      borderBottom: '1px solid #f9f9f9', '&:hover': { bgcolor: '#fafafa' },
    }}>
      <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>
        {order.indexName} {order.strikePrice}
      </Typography>
      <Typography sx={{ fontSize: '10px', fontWeight: 700,
        color: order.optionType === 'CE' ? '#10b981' : '#ef4444' }}>
        {order.optionType}
      </Typography>
      <Typography sx={{ fontSize: '10px', fontWeight: 700,
        color: order.transactionType === 'BUY' ? '#10b981' : '#ef4444' }}>
        {order.transactionType}
      </Typography>
      <Typography sx={{ fontSize: '10px', color: '#374151' }}>
        {order.executedPrice !== null ? order.executedPrice.toFixed(2)
          : order.limitPrice !== null ? `L:${order.limitPrice.toFixed(2)}` : 'MKT'}
      </Typography>
      <Typography sx={{ fontSize: '10px', color: '#374151' }}>{order.lots}L</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: statusColor(order.status), flexShrink: 0 }} />
        <Typography sx={{ fontSize: '9px', color: statusColor(order.status), fontWeight: 600 }}>
          {order.status}
        </Typography>
        {order.status === 'PENDING' && (
          <Box onClick={() => { playBeep(); dispatch(cancelOrder(order.id)); }}
            sx={{ ml: '2px', cursor: 'pointer', color: '#ef4444',
              fontSize: '10px', fontWeight: 700, '&:hover': { opacity: 0.7 } }}>✕</Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Table headers ─────────────────────────────────────────────────────────────
const TableHeader: React.FC = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: ORDER_COLS,
    px: '8px', py: '4px', bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
    {['Symbol', 'Type', 'Side', 'Price', 'Qty', 'Status'].map((h) => (
      <Typography key={h} sx={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</Typography>
    ))}
  </Box>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '70px', color: '#d1d5db', fontSize: '11px' }}>{label}</Box>
);

// ─── Refresh button ───────────────────────────────────────────────────────────
const RefreshBtn: React.FC<{ onClick: () => void; loading: boolean }> = ({ onClick, loading }) => (
  <Box onClick={loading ? undefined : onClick} sx={{
    display: 'flex', alignItems: 'center', gap: '3px',
    px: '6px', py: '2px', fontSize: '9px', cursor: loading ? 'default' : 'pointer',
    color: '#10b981', '&:hover': { opacity: 0.7 },
  }}>
    {loading ? (
      <Box sx={{ width: 8, height: 8, borderRadius: '50%',
        border: '1.5px solid #10b981', borderTopColor: 'transparent',
        animation: 'spin 0.6s linear infinite',
        '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
    ) : '↻'}
    {loading ? '' : 'Refresh'}
  </Box>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
const TabsRow: React.FC = () => {
  const dispatch = useDispatch();
  const { activeTab, orders } = useSelector((s: RootState) => s.terminal);

  // Order book — fetched from backend DB
  const [apiOrders, setApiOrders]       = useState<ApiOrderRow[]>([]);
  const [apiFetching, setApiFetching]   = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);

  const fetchOrderHistory = useCallback(async () => {
    setApiFetching(true);
    setApiError(null);
    try {
      // Only run on client-side to prevent hydration errors
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setApiOrders(data.data ?? []);
      } else {
        setApiError(data.message ?? 'Failed to load orders');
      }
    } catch {
      setApiError('Backend not reachable');
      setApiOrders([]);
    } finally {
      setApiFetching(false);
    }
  }, []);

  // Auto-fetch when Order Book tab is active
  useEffect(() => {
    if (activeTab === 0) fetchOrderHistory();
  }, [activeTab]);

  // Trade book = this session's Redux orders
  const sessionTrades = orders.filter((o) =>
    ['EXECUTED', 'CANCELLED', 'FAILED'].includes(o.status)
  );

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs
        value={activeTab}
        onChange={(_, v) => dispatch(setActiveTab(typeof v === 'number' ? v : 0))}
        sx={{ bgcolor: 'white', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <TabList disableUnderline sx={{
          bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb',
          minHeight: '28px', p: '2px 6px 0', gap: 0,
          '& .MuiTab-root': {
            fontSize: '10px', fontWeight: 600, minHeight: '26px', px: '10px',
            borderRadius: '6px 6px 0 0', color: '#6b7280',
            '&.Mui-selected': { bgcolor: 'white', color: '#10b981', borderBottom: '2px solid #10b981' },
          },
        }}>
          {/* Order Book — from backend DB */}
          <Tab value={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Order Book
              {apiOrders.filter(o => o.status === 'PENDING').length > 0 && (
                <Box sx={{ bgcolor: '#f59e0b', color: 'white', borderRadius: '50%',
                  minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>
                  {apiOrders.filter(o => o.status === 'PENDING').length}
                </Box>
              )}
            </Box>
          </Tab>

          {/* Trade Book — from Redux session */}
          <Tab value={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Trade Book
              {sessionTrades.length > 0 && (
                <Box sx={{ bgcolor: '#10b981', color: 'white', borderRadius: '50%',
                  minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>
                  {sessionTrades.length}
                </Box>
              )}
            </Box>
          </Tab>
          
            <Box sx={{ display: 'flex', justifyContent: 'right',
              borderBottom: '1px solid #f3f4f6', pr: '4px' }}>
              <RefreshBtn onClick={fetchOrderHistory} loading={apiFetching} />
            </Box>
          
        </TabList>

        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#d1d5db', borderRadius: '8px' },
          '&::-webkit-scrollbar-track': { backgroundColor: '#f9fafb' },
        }}>
          {/* ── Order Book (backend) ── */}
          {activeTab === 0 && (
            <>
              <TableHeader />
              {apiFetching   ? <EmptyState label="Loading orders..." /> :
               apiError      ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '70px', gap: '4px' }}>
                  <Typography sx={{ fontSize: '10px', color: '#9ca3af' }}>{apiError}</Typography>
                  <Box onClick={fetchOrderHistory} sx={{ fontSize: '10px', color: '#10b981',
                    cursor: 'pointer', textDecoration: 'underline' }}>Retry</Box>
                </Box>
              ) : apiOrders.length === 0 ? <EmptyState label="No orders yet" />
               : apiOrders.map((o) => <ApiOrderRow_ key={o.order_id} order={o} />)
              }
            </>
          )}

          {/* ── Trade Book (Redux session) ── */}
          {activeTab === 1 && (
            <>
              <TableHeader />
              {sessionTrades.length === 0
                ? <EmptyState label="No trades this session" />
                : sessionTrades.map((o) => <SessionOrderRow key={o.id} order={o} />)
              }
            </>
          )}
        </Box>
      </Tabs>
    </Box>
  );
};

export default TabsRow;