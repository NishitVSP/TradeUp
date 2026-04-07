'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { updateContractLtp, STRIKE_STEPS } from '@/store/slices/terminalSlice';

const API_BASE = 'http://localhost:3001';

/**
 * Returns the polling interval for a contract based on its distance from ATM.
 * ≤5 strikes from ATM → 500ms
 * 6–10 strikes → 1000ms
 * >10 strikes  → 2000ms
 */
function getInterval(indexName: string, strikePrice: number, atmStrike: number): number {
  const step = STRIKE_STEPS[indexName] ?? 50;
  const distance = Math.abs(strikePrice - atmStrike) / step;
  if (distance <= 5)  return 500;
  if (distance <= 10) return 1000;
  return 2000;
}

/**
 * Groups contracts by their polling interval tier.
 */
function groupByInterval(
  contracts: Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE'; ltp: number | null }>,
  atmStrikes: Record<string, number>
): Record<number, typeof contracts> {
  const groups: Record<number, typeof contracts> = { 500: [], 1000: [], 2000: [] };

  for (const c of contracts) {
    const atm = atmStrikes[c.indexName] ?? c.strikePrice;
    const interval = getInterval(c.indexName, c.strikePrice, atm);
    groups[interval].push(c);
  }

  return groups;
}

/**
 * Fetches LTPs for a batch of contracts from the backend.
 */
async function fetchLtps(
  contracts: Array<{ indexName: string; strikePrice: number; expiryDate: string; optionType: 'CE' | 'PE' }>
): Promise<Array<{ key: string; ltp: number | null }>> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/orders/ltps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contracts }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

/**
 * useLtpPoller
 *
 * Mounts three independent polling intervals (500ms, 1000ms, 2000ms).
 * Each fires for its tier of contracts — contracts ≤5 from ATM get 500ms,
 * 6-10 get 1000ms, rest get 2000ms.
 *
 * Automatically pauses if no contracts are selected.
 * Re-groups when selectedContracts changes (e.g. user adds a new strike).
 */
export function useLtpPoller() {
  const dispatch = useDispatch();
  const { selectedContracts, atmStrikes } = useSelector((s: RootState) => s.terminal);

  // Refs hold current values so intervals don't stale-close over old state
  const contractsRef  = useRef(selectedContracts);
  const atmRef        = useRef(atmStrikes);
  const isFetchingRef = useRef<Record<number, boolean>>({ 500: false, 1000: false, 2000: false });

  useEffect(() => { contractsRef.current = selectedContracts; }, [selectedContracts]);
  useEffect(() => { atmRef.current       = atmStrikes;        }, [atmStrikes]);

  const pollTier = useCallback(async (interval: number) => {
    // Prevent overlapping fetches for the same tier
    if (isFetchingRef.current[interval]) return;

    const groups  = groupByInterval(contractsRef.current, atmRef.current);
    const batch   = groups[interval];
    if (!batch || batch.length === 0) return;

    isFetchingRef.current[interval] = true;
    try {
      const results = await fetchLtps(batch);
      for (const { key, ltp } of results) {
        if (ltp !== null) {
          dispatch(updateContractLtp({ key, ltp }));
        }
      }
    } finally {
      isFetchingRef.current[interval] = false;
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedContracts.length === 0) return;

    // Three independent timers — each only fires for its tier
    const t500  = setInterval(() => pollTier(500),  500);
    const t1000 = setInterval(() => pollTier(1000), 1000);
    const t2000 = setInterval(() => pollTier(2000), 2000);

    return () => {
      clearInterval(t500);
      clearInterval(t1000);
      clearInterval(t2000);
    };
  }, [selectedContracts.length, pollTier]);
  // Re-mounts intervals when new contracts are added (length changes)
}