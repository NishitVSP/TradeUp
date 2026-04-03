import React from 'react';
import { Box, Tabs, TabList, Tab, Typography } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveTab, cancelOrder, OrderEntry } from '@/store/slices/terminalSlice';
import { useBeepSound } from '@/hooks/useBeepSound';

const statusColor = (s: OrderEntry['status']) =>
  ({ EXECUTED: '#10b981', PENDING: '#f59e0b', CANCELLED: '#9ca3af', FAILED: '#ef4444' }[s] ?? '#9ca3af');

const OrderRow: React.FC<{ order: OrderEntry }> = ({ order }) => {
  const dispatch = useDispatch();
  const playBeep = useBeepSound();
  return (
    <Box sx={{
      display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.5fr 0.7fr 0.45fr 0.75fr',
      alignItems: 'center', px: '8px', py: '5px',
      borderBottom: '1px solid #f9f9f9', '&:hover': { bgcolor: '#fafafa' },
    }}>
      <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>
        {order.indexName} {order.strikePrice}
      </Typography>
      <Typography sx={{ fontSize: '10px', fontWeight: 700, color: order.optionType === 'CE' ? '#10b981' : '#ef4444' }}>
        {order.optionType}
      </Typography>
      <Typography sx={{ fontSize: '10px', fontWeight: 700, color: order.transactionType === 'BUY' ? '#10b981' : '#ef4444' }}>
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
            sx={{ ml: '2px', cursor: 'pointer', color: '#ef4444', fontSize: '10px',
              fontWeight: 700, '&:hover': { opacity: 0.7 } }}>✕</Box>
        )}
      </Box>
    </Box>
  );
};

const TableHeader: React.FC = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 0.5fr 0.7fr 0.45fr 0.75fr',
    px: '8px', py: '4px', bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
    {['Symbol', 'Type', 'Side', 'Price', 'Lots', 'Status'].map((h) => (
      <Typography key={h} sx={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</Typography>
    ))}
  </Box>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '70px', color: '#d1d5db', fontSize: '11px' }}>{label}</Box>
);

const TabsRow: React.FC = () => {
  const dispatch = useDispatch();
  const { activeTab, orders } = useSelector((s: RootState) => s.terminal);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const tradeBook = orders.filter((o) => ['EXECUTED', 'CANCELLED', 'FAILED'].includes(o.status));

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '110px' }}>
      <Tabs value={activeTab} onChange={(_, v) => dispatch(setActiveTab(typeof v === 'number' ? v : 0))}
        sx={{ bgcolor: 'white', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TabList disableUnderline sx={{
          bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb',
          minHeight: '28px', p: '2px 6px 0', gap: 0,
          '& .MuiTab-root': {
            fontSize: '10px', fontWeight: 600, minHeight: '26px', px: '10px',
            borderRadius: '6px 6px 0 0', color: '#6b7280',
            '&.Mui-selected': { bgcolor: 'white', color: '#10b981', borderBottom: '2px solid #10b981' },
          },
        }}>
          <Tab value={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Order Book
              {pendingCount > 0 && (
                <Box sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '50%',
                  minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '8px', fontWeight: 700 }}>
                  {pendingCount}
                </Box>
              )}
            </Box>
          </Tab>
          <Tab value={1}>Trade Book</Tab>
        </TabList>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 0 && (
            <>{<TableHeader />}{orders.length === 0
              ? <EmptyState label="No orders placed yet" />
              : orders.map((o) => <OrderRow key={o.id} order={o} />)}</>
          )}
          {activeTab === 1 && (
            <>{<TableHeader />}{tradeBook.length === 0
              ? <EmptyState label="No executed trades yet" />
              : tradeBook.map((o) => <OrderRow key={o.id} order={o} />)}</>
          )}
        </Box>
      </Tabs>
    </Box>
  );
};

export default TabsRow;