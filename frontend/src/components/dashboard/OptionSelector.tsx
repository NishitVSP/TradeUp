'use client';

import { useState, useEffect } from 'react';
import { Box, Select, MenuItem, FormControl, InputLabel, Alert, Chip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Panel, PanelHeader, PanelTitle } from './styled';
import { Button } from '../ui';
import {
  setSelectedIndex, setSelectedStrikeOffset, setSelectedExpiryIndex,
  setAvailableExpiries, setAtmStrike, setSpotPrice,
  addWatchedContract, setError, clearError,
} from '@/store/slices/optionsSlice';
import { addToTerminal } from '@/store/slices/terminalSlice';
import type { RootState } from '@/store/store';

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'BANKEX', 'SENSEX'];
const STRIKE_STEP: Record<string, number> = {
  NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, MIDCPNIFTY: 25, BANKEX: 100, SENSEX: 100,
};

export function OptionSelector() {
  const dispatch = useDispatch();
  const {
    selectedIndex, selectedStrikeOffset, selectedExpiryIndex,
    availableExpiries, atmStrike, spotPrice, error,
  } = useSelector((state: RootState) => state.options);

  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchExpiriesAndSpot(); }, [selectedIndex]);

  const fetchExpiriesAndSpot = async () => {
    try {
      const token = localStorage.getItem('token');
      const [er, sr] = await Promise.all([
        fetch(`http://localhost:3001/api/options/expiries/${selectedIndex}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:3001/api/options/spot/${selectedIndex}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ed = await er.json();
      const sd = await sr.json();
      if (ed.success) dispatch(setAvailableExpiries(ed.data.expiries));
      if (sd.success) { dispatch(setSpotPrice(sd.data.spotPrice)); dispatch(setAtmStrike(sd.data.atmStrike)); }
    } catch { /* backend not ready */ }
  };

  const getStrikePrice = () =>
    atmStrike ? atmStrike + selectedStrikeOffset * (STRIKE_STEP[selectedIndex] ?? 50) : null;

  const getStrikeLabel = () => {
    const sp = getStrikePrice();
    if (!sp) return 'Loading...';
    if (selectedStrikeOffset === 0) return `${sp} (ATM)`;
    return selectedStrikeOffset > 0 ? `${sp} (ATM+${selectedStrikeOffset})` : `${sp} (ATM${selectedStrikeOffset})`;
  };

  const handleAddContract = async () => {
    const strikePrice = getStrikePrice();
    if (!strikePrice || availableExpiries.length === 0 || !atmStrike) {
      dispatch(setError('Please wait for market data to load'));
      return;
    }
    const expiryDate = availableExpiries[selectedExpiryIndex - 1];
    const strikeStep = STRIKE_STEP[selectedIndex] ?? 50;
    
    // Generate all strikes from ATM to selected offset (inclusive)
    const startOffset = Math.min(0, selectedStrikeOffset); // Handle negative offsets
    const endOffset = Math.max(0, selectedStrikeOffset);
    const allStrikes = [];
    for (let offset = startOffset; offset <= endOffset; offset++) {
      allStrikes.push(atmStrike + offset * strikeStep);
    }
    
    setLoading(true);
    dispatch(clearError());

    try {
      const token = localStorage.getItem('token');
      
      // Create contracts for all strikes in the range
      const contracts = allStrikes.map(strike => ({
        indexName: selectedIndex,
        strikePrice: strike,
        expiryDate,
        optionType,
        ltp: null, // Will be populated by LTP updates
      }));

      // Watch the selected strike for LTP polling
      const res = await fetch('http://localhost:3001/api/options/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ indexName: selectedIndex, strikePrice, expiryDate, optionType }),
      });
      const data = await res.json();

      if (data.success) {
        // Watched contract for LTP polling (only the selected strike)
        dispatch(addWatchedContract({
          indexName: selectedIndex, strikePrice, expiryDate, optionType,
          updateInterval: Math.abs(selectedStrikeOffset) <= 5 ? 500
            : Math.abs(selectedStrikeOffset) <= 10 ? 1000 : 2000,
        }));

        // Add ALL contracts from ATM to selected offset to terminal
        dispatch(addToTerminal({
          contracts,
          expiryDate,
          atmStrike: atmStrike!,
        }));

        setOptionType('CE');
      } else {
        dispatch(setError(data.message || 'Failed to add contract'));
      }
    } catch {
      dispatch(setError('Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Option Contracts</PanelTitle>
        {spotPrice && (
          <Chip label={`Spot: ₹${spotPrice.toFixed(2)}`} size="small"
            sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }} />
        )}
      </PanelHeader>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Index</InputLabel>
          <Select value={selectedIndex} label="Index" onChange={(e) => dispatch(setSelectedIndex(e.target.value))} sx={{ fontFamily: '"DM Sans", sans-serif' }}>
            {INDICES.map((idx) => <MenuItem key={idx} value={idx}>{idx}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Strike</InputLabel>
          <Select value={selectedStrikeOffset} label="Strike" onChange={(e) => dispatch(setSelectedStrikeOffset(e.target.value as number))} sx={{ fontFamily: '"DM Sans", sans-serif' }}>
            {Array.from({ length: 81 }, (_, i) => i - 40).map((offset) => (
              <MenuItem key={offset} value={offset}>
                {offset === 0 ? 'ATM' : offset > 0 ? `ATM+${offset}` : `ATM${offset}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ p: 1.5, background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Box sx={{ fontSize: '0.75rem', color: '#64748b', fontFamily: '"DM Sans", sans-serif', mb: 0.5 }}>
            Selected Strike
          </Box>
          <Box sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: '"DM Sans", sans-serif' }}>
            {getStrikeLabel()}
          </Box>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Expiry</InputLabel>
          <Select value={selectedExpiryIndex} label="Expiry"
            onChange={(e) => dispatch(setSelectedExpiryIndex(e.target.value as number))}
            sx={{ fontFamily: '"DM Sans", sans-serif' }} disabled={availableExpiries.length === 0}>
            {availableExpiries.map((expiry, i) => (
              <MenuItem key={expiry} value={i + 1}>{expiry}{i === 0 ? ' (Nearest)' : ''}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select value={optionType} label="Type" onChange={(e) => setOptionType(e.target.value as 'CE' | 'PE')} sx={{ fontFamily: '"DM Sans", sans-serif' }}>
            <MenuItem value="CE">Call (CE)</MenuItem>
            <MenuItem value="PE">Put (PE)</MenuItem>
          </Select>
        </FormControl>

        <Button variant="primary" fullWidth onClick={handleAddContract} disabled={loading || !atmStrike}
          sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', mt: 1 }}>
          {loading ? 'Adding...' : `Add ${optionType} to Terminal`}
        </Button>
      </Box>
    </Panel>
  );
}