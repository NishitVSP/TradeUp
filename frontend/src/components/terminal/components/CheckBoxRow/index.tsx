import React from 'react';
import { Box, Checkbox } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setLimitOnLtp, setSlLimitProtection } from '@/store/slices/terminalSlice';
import { TerminalRow } from '../../styled';

const CheckBoxRow: React.FC = () => {
  const dispatch = useDispatch();
  const { limitOnLtp, slLimitProtection } = useSelector((s: RootState) => s.terminal);

  return (
    <TerminalRow sx={{ gap: '12px' }}>
      <Checkbox
        checked={limitOnLtp}
        onChange={(e) => dispatch(setLimitOnLtp(e.target.checked))}
        size="sm"
        label="Limit on LTP"
        sx={{ fontSize: '11px', '--Checkbox-size': '14px' }}
      />
      <Checkbox
        checked={slLimitProtection}
        onChange={(e) => dispatch(setSlLimitProtection(e.target.checked))}
        size="sm"
        label="SL Limit Protection"
        sx={{ fontSize: '11px', '--Checkbox-size': '14px' }}
      />
    </TerminalRow>
  );
};

export default CheckBoxRow;