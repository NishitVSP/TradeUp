'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import { Panel, PanelHeader, PanelTitle, PlaceholderText } from './styled';
import {
  closePosition, closeAllPositions,
  setGlobalMtmTarget, setGlobalMtmSL,
  updatePositionRiskParams,
} from '@/store/slices/terminalSlice';
import type { RootState } from '@/store/store';
import type { Position } from '@/store/slices/terminalSlice';
import { useBeepSound } from '@/hooks/useBeepSound';

// ─── Small editable field used inside each position row ──────────────────────

const EditableField: React.FC<{
  label: string;
  value: number | null;
  color: string;
  onSave: (v: number | null) => void;
}> = ({ label, value, color, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value?.toString() ?? '');

  const handleBlur = () => {
    setEditing(false);
    const n = parseFloat(draft);
    onSave(isNaN(n) ? null : n);
  };

  if (editing) {
    return (
      <TextField
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
        size="small"
        variant="outlined"
        sx={{
          width: '60px',
          '& .MuiInputBase-input': { fontSize: '10px', padding: '2px 4px', textAlign: 'center' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: color },
            '&:hover fieldset': { borderColor: color },
          },
        }}
      />
    );
  }

  return (
    <Tooltip title={`Click to edit ${label}`} placement="top">
      <Box
        onClick={() => { setDraft(value?.toString() ?? ''); setEditing(true); }}
        sx={{
          minWidth: '44px', px: '5px', py: '2px', borderRadius: '4px',
          border: `1px dashed ${value !== null ? color : '#e5e7eb'}`,
          color: value !== null ? color : '#d1d5db',
          fontSize: '10px', fontWeight: 600, textAlign: 'center', cursor: 'pointer',
          bgcolor: value !== null ? `${color}0d` : 'transparent',
          '&:hover': { borderStyle: 'solid', bgcolor: `${color}18` },
        }}
      >
        {value !== null ? value : '—'}
      </Box>
    </Tooltip>
  );
};

// ─── Single position row ──────────────────────────────────────────────────────

const PositionRow: React.FC<{ position: Position }> = ({ position: p }) => {
  const dispatch = useDispatch();
  const playBeep = useBeepSound();

  const pnlColor = p.pnl === null ? '#6b7280' : p.pnl >= 0 ? '#10b981' : '#ef4444';

  const handleClose = () => {
    playBeep();
    dispatch(closePosition(p.id));
  };

  const updateRisk = (patch: Partial<{ targetPts: number | null; slPts: number | null; trailPts: number | null; mtmTrailPts: number | null }>) => {
    dispatch(updatePositionRiskParams({ id: p.id, ...patch }));
  };

  return (
    <Box sx={{
      p: '6px 12px', borderBottom: '1px solid #f3f4f6',
      opacity: p.status === 'CLOSED' ? 0.45 : 1,
      '&:hover': { bgcolor: '#fafafa' },
    }}>
      {/* Row 1: symbol + side + entry + PnL + close */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '4px' }}>
        {/* Symbol pill */}
        <Box sx={{
          fontSize: '10px', fontWeight: 700, color: '#374151',
          bgcolor: '#f3f4f6', borderRadius: '4px', px: '6px', py: '1px',
          whiteSpace: 'nowrap',
        }}>
          {p.indexName} {p.strikePrice}
          <Box component="span" sx={{ ml: '4px', color: p.optionType === 'CE' ? '#10b981' : '#ef4444' }}>
            {p.optionType}
          </Box>
        </Box>

        {/* Side badge */}
        <Box sx={{
          fontSize: '9px', fontWeight: 700, px: '5px', py: '1px', borderRadius: '4px',
          bgcolor: p.side === 'BUY' ? '#f0fdf4' : '#fef2f2',
          color: p.side === 'BUY' ? '#10b981' : '#ef4444',
          border: `1px solid ${p.side === 'BUY' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {p.side} · {p.lots}L
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Entry */}
        <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>
          @{p.entryPrice.toFixed(2)}
        </Typography>

        {/* PnL */}
        <Box sx={{
          fontSize: '11px', fontWeight: 800, color: pnlColor,
          minWidth: '60px', textAlign: 'right',
        }}>
          {p.pnl !== null ? `${p.pnl >= 0 ? '+' : ''}₹${p.pnl.toFixed(0)}` : '—'}
        </Box>

        {/* Close button */}
        {p.status === 'OPEN' ? (
          <Box onClick={handleClose} sx={{
            fontSize: '9px', fontWeight: 700, color: '#ef4444',
            border: '1px solid #ef4444', borderRadius: '3px', px: '5px', py: '1px',
            cursor: 'pointer', '&:hover': { bgcolor: '#fef2f2' }, ml: '4px',
          }}>
            CLOSE
          </Box>
        ) : (
          <Typography sx={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600, ml: '4px' }}>CLOSED</Typography>
        )}
      </Box>

      {/* Row 2: editable risk params */}
      {p.status === 'OPEN' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', pl: '2px' }}>
          <Typography sx={{ fontSize: '9px', color: '#9ca3af', mr: '2px' }}>Risk:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Typography sx={{ fontSize: '9px', color: '#10b981' }}>TGT</Typography>
            <EditableField label="Target pts" value={p.targetPts} color="#10b981"
              onSave={(v) => updateRisk({ targetPts: v })} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Typography sx={{ fontSize: '9px', color: '#ef4444' }}>SL</Typography>
            <EditableField label="SL pts" value={p.slPts} color="#ef4444"
              onSave={(v) => updateRisk({ slPts: v })} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Typography sx={{ fontSize: '9px', color: '#f59e0b' }}>Trail</Typography>
            <EditableField label="Trail pts" value={p.trailPts} color="#f59e0b"
              onSave={(v) => updateRisk({ trailPts: v })} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Typography sx={{ fontSize: '9px', color: '#6366f1' }}>MTM</Typography>
            <EditableField label="MTM Trail pts" value={p.mtmTrailPts} color="#6366f1"
              onSave={(v) => updateRisk({ mtmTrailPts: v })} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ─── MTM protection bar ───────────────────────────────────────────────────────

const MtmProtectionBar: React.FC<{
  totalPnl: number;
  globalMtmTarget: string;
  globalMtmSL: string;
}> = ({ totalPnl, globalMtmTarget, globalMtmSL }) => {
  const dispatch = useDispatch();

  return (
    <Box sx={{
      px: '12px', py: '8px', bgcolor: '#f8fafc',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {/* MTM display */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '6px' }}>
        <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6b7280',
          textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          MTM P&L
        </Typography>
        <Typography sx={{
          fontSize: '14px', fontWeight: 800,
          color: totalPnl >= 0 ? '#10b981' : '#ef4444',
        }}>
          {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(0)}
        </Typography>
      </Box>

      {/* MTM Target + SL inputs */}
      <Box sx={{ display: 'flex', gap: '8px' }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 600, color: '#10b981', mb: '2px',
            textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            MTM Target (₹)
          </Typography>
          <TextField
            value={globalMtmTarget}
            onChange={(e) => dispatch(setGlobalMtmTarget(e.target.value.replace(/[^0-9.]/g, '')))}
            placeholder="e.g. 5000"
            size="small"
            variant="outlined"
            sx={{
              width: '100%',
              '& .MuiInputBase-input': { fontSize: '11px', padding: '4px 8px' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#bbf7d0' },
                '&:hover fieldset': { borderColor: '#10b981' },
                '&.Mui-focused fieldset': { borderColor: '#10b981' },
              },
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '9px', fontWeight: 600, color: '#ef4444', mb: '2px',
            textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            MTM Stop Loss (₹)
          </Typography>
          <TextField
            value={globalMtmSL}
            onChange={(e) => dispatch(setGlobalMtmSL(e.target.value.replace(/[^0-9.]/g, '')))}
            placeholder="e.g. 2000"
            size="small"
            variant="outlined"
            sx={{
              width: '100%',
              '& .MuiInputBase-input': { fontSize: '11px', padding: '4px 8px' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#fecaca' },
                '&:hover fieldset': { borderColor: '#ef4444' },
                '&.Mui-focused fieldset': { borderColor: '#ef4444' },
              },
            }}
          />
        </Box>
      </Box>

      {/* Warning if approaching MTM SL */}
      {globalMtmSL && totalPnl < 0 && Math.abs(totalPnl) > parseFloat(globalMtmSL) * 0.8 && (
        <Box sx={{
          mt: '6px', px: '8px', py: '4px', bgcolor: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '4px',
          fontSize: '9px', fontWeight: 600, color: '#ef4444',
        }}>
          ⚠ Approaching MTM Stop Loss — ₹{Math.abs(totalPnl).toFixed(0)} / ₹{globalMtmSL}
        </Box>
      )}
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export function Positions() {
  const dispatch  = useDispatch();
  const playBeep  = useBeepSound();
  const { positions, globalMtmTarget, globalMtmSL } = useSelector((s: RootState) => s.terminal);

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const totalPnl      = openPositions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);

  const handleCloseAll = () => {
    if (openPositions.length === 0) return;
    playBeep();
    dispatch(closeAllPositions());
  };

  return (
    <Panel sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PanelHeader>
        <PanelTitle>Positions</PanelTitle>
        {openPositions.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box sx={{
              px: '10px', py: '3px', borderRadius: '20px', fontWeight: 700,
              fontSize: '0.8rem', fontFamily: '"DM Sans", sans-serif',
              bgcolor: totalPnl >= 0 ? '#f0fdf4' : '#fef2f2',
              color: totalPnl >= 0 ? '#10b981' : '#ef4444',
              border: `1px solid ${totalPnl >= 0 ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(0)}
            </Box>
            <Box
              onClick={handleCloseAll}
              sx={{
                px: '8px', py: '3px', borderRadius: '4px', cursor: 'pointer',
                bgcolor: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700,
                border: '1px solid #fecaca',
                '&:hover': { bgcolor: '#fee2e2' },
              }}
            >
              Close All
            </Box>
          </Box>
        )}
      </PanelHeader>

      {openPositions.length > 0 && (
        <MtmProtectionBar
          totalPnl={totalPnl}
          globalMtmTarget={globalMtmTarget}
          globalMtmSL={globalMtmSL}
        />
      )}

      {positions.length === 0 ? (
        <PlaceholderText>Your active positions will appear here</PlaceholderText>
      ) : (
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <Box sx={{ px: '12px', py: '4px', bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb',
            display: 'flex', gap: '6px' }}>
            {['Symbol', 'Side', 'Entry @', 'P&L', 'Risk params'].map((h) => (
              <Typography key={h} sx={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</Typography>
            ))}
          </Box>
          {positions.map((p) => <PositionRow key={p.id} position={p} />)}
        </Box>
      )}
    </Panel>
  );
}