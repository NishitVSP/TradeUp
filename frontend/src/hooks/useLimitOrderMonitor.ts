'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { executeOrderLocally, updateContractLtp } from '@/store/slices/terminalSlice';

/**
 * Monitors limit orders and executes them when price crosses the limit
 */
export function useLimitOrderMonitor() {
  const dispatch = useDispatch();
  const { orders, selectedContracts } = useSelector((s: RootState) => s.terminal);
  
  // Ref to prevent duplicate executions
  const processedOrdersRef = useRef<Set<string>>(new Set());

  const checkAndExecuteLimitOrders = useCallback(() => {
    const pendingLimitOrders = orders.filter(order => 
      order.status === 'PENDING' && 
      order.orderType === 'LIMIT' && 
      order.limitPrice !== null
    );

    for (const order of pendingLimitOrders) {
      // Skip if already processed
      if (processedOrdersRef.current.has(order.id)) continue;

      // Find current LTP for this contract
      const contractKey = `${order.indexName}-${order.strikePrice}-${order.expiryDate}-${order.optionType}`;
      const contract = selectedContracts.find(c => 
        `${c.indexName}-${c.strikePrice}-${c.expiryDate}-${c.optionType}` === contractKey
      );

      if (!contract || contract.ltp === null) continue;

      const currentLtp = contract.ltp;
      const limitPrice = order.limitPrice;
      const isBuy = order.transactionType === 'BUY';

      // Check if limit price is crossed
      let shouldExecute = false;
      
      if (isBuy) {
        // Buy limit executes when price goes to or below limit
        shouldExecute = currentLtp <= limitPrice!;
      } else {
        // Sell limit executes when price goes to or above limit
        shouldExecute = currentLtp >= limitPrice!;
      }

      if (shouldExecute) {
        // Mark as processed to prevent duplicate executions
        processedOrdersRef.current.add(order.id);
        
        // Execute the order at current market price
        dispatch(executeOrderLocally({
          id: order.id,
          executedPrice: currentLtp,
        }));

        // Clean up processed orders periodically
        if (processedOrdersRef.current.size > 100) {
          const currentOrderIds = new Set(orders.map(o => o.id));
          processedOrdersRef.current = new Set(
            Array.from(processedOrdersRef.current).filter(id => currentOrderIds.has(id))
          );
        }
      }
    }
  }, [orders, selectedContracts, dispatch]);

  // Monitor limit orders whenever LTP updates
  useEffect(() => {
    checkAndExecuteLimitOrders();
  }, [selectedContracts.map(c => c.ltp).join(','), checkAndExecuteLimitOrders]);

  // Clean up processed orders when orders change
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id));
    processedOrdersRef.current = new Set(
      Array.from(processedOrdersRef.current).filter(id => currentOrderIds.has(id))
    );
  }, [orders]);
}
