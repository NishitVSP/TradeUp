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

const API_BASE = 'http://localhost:3001';
const INDICES  = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'BANKEX', 'SENSEX'];

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
  const [loading, setLoading]       = useState(false);

  useEffect(() => { fetchExpiriesAndSpot(); }, [selectedIndex]);

  const fetchExpiriesAndSpot = async () => {
    try {
      const token = localStorage.getItem('token');
      const [er, sr] = await Promise.all([
        fetch(`${API_BASE}/api/options/expiries/${selectedIndex}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/options/spot/${selectedIndex}`,     { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ed = await er.json();
      const sd = await sr.json();
      if (ed.success) dispatch(setAvailableExpiries(ed.data.expiries));
      if (sd.success) {
        dispatch(setSpotPrice(sd.data.spotPrice));
        dispatch(setAtmStrike(sd.data.atmStrike));
      }
    } catch { /* backend not ready */ }
  };

  const getStrikePrice = () =>
    atmStrike ? atmStrike + selectedStrikeOffset * (STRIKE_STEP[selectedIndex] ?? 50) : null;

  const getStrikeLabel = () => {
    const sp = getStrikePrice();
    if (!sp) return 'Loading...';
    if (selectedStrikeOffset === 0) return `${sp} (ATM)`;
    return selectedStrikeOffset > 0
      ? `${sp} (ATM+${selectedStrikeOffset})`
      : `${sp} (ATM${selectedStrikeOffset})`;
  };

  const handleAddContract = async () => {
    const strikePrice = getStrikePrice();
    if (!strikePrice || availableExpiries.length === 0 || !atmStrike) {
      dispatch(setError('Please wait for market data to load'));
      return;
    }

    const expiryDate  = availableExpiries[selectedExpiryIndex - 1];
    const strikeStep  = STRIKE_STEP[selectedIndex] ?? 50;

    // Build all strikes from ATM to the selected offset (inclusive both CE and PE)
    // e.g. if offset = +3, we watch ATM, ATM+1, ATM+2, ATM+3 for both CE and PE
    const startOffset = Math.min(0, selectedStrikeOffset);
    const endOffset   = Math.max(0, selectedStrikeOffset);

    const allContracts: Array<{
      indexName: string; strikePrice: number;
      expiryDate: string; optionType: 'CE' | 'PE';
    }> = [];

    for (let offset = startOffset; offset <= endOffset; offset++) {
      const sp = atmStrike + offset * strikeStep;
      // Add both CE and PE for each strike in range — backend needs both to compute accurate vol
      allContracts.push({ indexName: selectedIndex, strikePrice: sp, expiryDate, optionType: 'CE' });
      allContracts.push({ indexName: selectedIndex, strikePrice: sp, expiryDate, optionType: 'PE' });
    }

    setLoading(true);
    dispatch(clearError());

    try {
      const token = localStorage.getItem('token');

      // 1. Tell backend to start simulating ALL contracts in range (both CE and PE)
      const watchRes = await fetch(`${API_BASE}/api/options/watch/multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contracts: allContracts }),
      });
      const watchData = await watchRes.json();

      // 2. Register the specific selected strike in optionsSlice for tracking
      dispatch(addWatchedContract({
        indexName: selectedIndex, strikePrice, expiryDate, optionType,
        updateInterval: Math.abs(selectedStrikeOffset) <= 5 ? 500
          : Math.abs(selectedStrikeOffset) <= 10 ? 1000 : 2000,
      }));

      // 3. Push ALL watched contracts (with ltp: null initially) into terminal slice
      //    The useLtpPoller will start filling in LTPs automatically
      const terminalContracts = allContracts.map((c) => ({ ...c, ltp: null }));

      dispatch(addToTerminal({
        contracts: terminalContracts,
        expiryDate,
        atmStrike,
      }));

      if (!watchData.success) {
        // Non-fatal — contracts might not exist yet, but terminal is still set up
        console.warn('Watch multiple warning:', watchData.message);
      }

      setOptionType('CE');
    } catch (err) {
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
          <Chip
            label={`Spot: ₹${spotPrice.toFixed(2)}`}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
            }}
          />
        )}
      </PanelHeader>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Index</InputLabel>
          <Select value={selectedIndex} label="Index"
            onChange={(e) => dispatch(setSelectedIndex(e.target.value))}
            sx={{ fontFamily: '"DM Sans", sans-serif' }}>
            {INDICES.map((idx) => <MenuItem key={idx} value={idx}>{idx}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Strike</InputLabel>
          <Select value={selectedStrikeOffset} label="Strike"
            onChange={(e) => dispatch(setSelectedStrikeOffset(e.target.value as number))}
            sx={{ fontFamily: '"DM Sans", sans-serif' }}>
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
            sx={{ fontFamily: '"DM Sans", sans-serif' }}
            disabled={availableExpiries.length === 0}>
            {availableExpiries.map((expiry, i) => (
              <MenuItem key={expiry} value={i + 1}>
                {expiry}{i === 0 ? ' (Nearest)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select value={optionType} label="Type"
            onChange={(e) => setOptionType(e.target.value as 'CE' | 'PE')}
            sx={{ fontFamily: '"DM Sans", sans-serif' }}>
            <MenuItem value="CE">Call (CE)</MenuItem>
            <MenuItem value="PE">Put (PE)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="primary" fullWidth onClick={handleAddContract}
          disabled={loading || !atmStrike}
          sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', mt: 1 }}
        >
          {loading ? 'Adding...' : `Add ${optionType} to Terminal`}
        </Button>
      </Box>
    </Panel>
  );
}