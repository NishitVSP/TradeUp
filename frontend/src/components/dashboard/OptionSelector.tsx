'use client';

import { useState, useEffect } from 'react';
import { Box, Select, MenuItem, FormControl, InputLabel, Alert, Chip, Typography } from '@mui/material';
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
  const terminalContracts = useSelector((state: RootState) => state.terminal.selectedContracts);

  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [loading, setLoading]       = useState(false);

  useEffect(() => { fetchExpiriesAndSpot(); }, [selectedIndex]);

  const fetchExpiriesAndSpot = async () => {
    // Only run on client-side to prevent hydration errors
    if (typeof window === 'undefined') return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
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

  const addContractsBySelection = async (
    strikeOffset: number,
    expiryIndex: number,
    selectedType: 'CE' | 'PE'
  ) => {
    if (!atmStrike || availableExpiries.length === 0) {
      dispatch(setError('Please wait for market data to load'));
      return;
    }

    const strikePrice = atmStrike + strikeOffset * (STRIKE_STEP[selectedIndex] ?? 50);
    const expiryDate  = availableExpiries[Math.max(0, expiryIndex - 1)];
    const strikeStep  = STRIKE_STEP[selectedIndex] ?? 50;

    // Build all strikes from ATM to the selected offset (inclusive both CE and PE)
    // e.g. if offset = +3, we watch ATM, ATM+1, ATM+2, ATM+3 for both CE and PE
    const startOffset = Math.min(0, strikeOffset);
    const endOffset   = Math.max(0, strikeOffset);

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
      // Only run on client-side to prevent hydration errors
      if (typeof window === 'undefined') {
        dispatch(setError('Client-side only operation'));
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setError('Authentication required'));
        return;
      }

      // 1. Tell backend to start simulating ALL contracts in range (both CE and PE)
      const watchRes = await fetch(`${API_BASE}/api/options/watch/multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contracts: allContracts }),
      });
      const watchData = await watchRes.json();

      // 2. Register the specific selected strike in optionsSlice for tracking
      dispatch(addWatchedContract({
        indexName: selectedIndex, strikePrice, expiryDate, optionType: selectedType,
        updateInterval: Math.abs(strikeOffset) <= 5 ? 500
          : Math.abs(strikeOffset) <= 10 ? 1000 : 2000,
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

      setOptionType(selectedType);
    } catch (err) {
      dispatch(setError('Network error. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async () => {
    const strikePrice = getStrikePrice();
    if (!strikePrice) {
      dispatch(setError('Please wait for market data to load'));
      return;
    }
    await addContractsBySelection(selectedStrikeOffset, selectedExpiryIndex, optionType);
  };

  // Auto-add default NIFTY ATM contract pair into terminal using the same OptionSelector flow
  useEffect(() => {
    const hasNiftyInTerminal = terminalContracts.some((c) => c.indexName === 'NIFTY');
    if (hasNiftyInTerminal) return;
    if (selectedIndex !== 'NIFTY') return;
    if (!atmStrike || availableExpiries.length === 0 || loading) return;

    // Add both CE and PE for default selection - just call once with CE, it adds both types internally
    void addContractsBySelection(0, 1, 'CE');
    void addContractsBySelection(0, 1, 'PE');
  }, [selectedIndex, atmStrike, availableExpiries, terminalContracts, loading]);

  return (
    <Panel sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PanelHeader>
        <PanelTitle>Option Contracts</PanelTitle>
        {spotPrice && (
          <Box sx={{
            px: '8px', py: '2px', borderRadius: '12px', fontWeight: 600,
            fontSize: '0.75rem', fontFamily: '"DM Sans", sans-serif',
            bgcolor: '#f0fdf4', color: '#10b981',
            border: '1px solid #bbf7d0',
          }}>
            ₹{spotPrice.toFixed(0)}
          </Box>
        )}
      </PanelHeader>

      {error && (
        <Box sx={{
          px: '12px', py: '6px', bgcolor: '#fef2f2',
          borderBottom: '1px solid #fecaca', fontSize: '0.75rem',
          color: '#ef4444', fontWeight: 600, fontFamily: '"DM Sans", sans-serif'
        }}>
          {error}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: '8px' }}>
        {/* Index and Strike row */}
        <Box sx={{ display: 'flex', gap: '6px', mb: '6px' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', mb: '2px',
              textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Index
            </Typography>
            <Select
              value={selectedIndex}
              onChange={(e) => dispatch(setSelectedIndex(e.target.value))}
              size="small"
              fullWidth
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '2px 6px' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                },
              }}
            >
              {INDICES.map((idx) => (
                <MenuItem key={idx} value={idx} sx={{ fontSize: '0.75rem' }}>
                  {idx}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', mb: '2px',
              textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Strike
            </Typography>
            <Select
              value={selectedStrikeOffset}
              onChange={(e) => dispatch(setSelectedStrikeOffset(e.target.value as number))}
              size="small"
              fullWidth
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '2px 6px' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                },
              }}
            >
              {Array.from({ length: 21 }, (_, i) => i - 10).map((offset) => (
                <MenuItem key={offset} value={offset} sx={{ fontSize: '0.75rem' }}>
                  {offset === 0 ? 'ATM' : offset > 0 ? `+${offset}` : `${offset}`}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>


        {/* Expiry and Type row */}
        <Box sx={{ display: 'flex', gap: '6px', mb: '6px' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', mb: '2px',
              textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Expiry
            </Typography>
            <Select
              value={selectedExpiryIndex}
              onChange={(e) => dispatch(setSelectedExpiryIndex(e.target.value as number))}
              size="small"
              fullWidth
              disabled={availableExpiries.length === 0}
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '2px 6px' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                },
              }}
            >
              {availableExpiries.slice(0, 3).map((expiry, i) => (
                <MenuItem key={expiry} value={i + 1} sx={{ fontSize: '0.75rem' }}>
                  {expiry}{i === 0 ? ' (Near)' : ''}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', mb: '2px',
              textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Type
            </Typography>
            <Select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value as 'CE' | 'PE')}
              size="small"
              fullWidth
              sx={{
                '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '2px 6px' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                },
              }}
            >
              <MenuItem value="CE" sx={{ fontSize: '0.75rem', color: '#10b981' }}>Call</MenuItem>
              <MenuItem value="PE" sx={{ fontSize: '0.75rem', color: '#ef4444' }}>Put</MenuItem>
            </Select>
          </Box>
        </Box>

        {/* Add button */}
        <Box sx={{ mt: 'auto', pt: '4px' }}>
          <Button
            variant="primary"
            fullWidth
            onClick={handleAddContract}
            disabled={loading || !atmStrike}
            sx={{
              background: optionType === 'CE'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              py: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: '"DM Sans", sans-serif',
              '&:hover': {
                background: optionType === 'CE'
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
            }}
          >
            {loading ? 'Adding...' : `Add ${optionType}`}
          </Button>
        </Box>
      </Box>
    </Panel>
  );
}