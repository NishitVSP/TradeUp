import React from 'react';
import { Box } from '@mui/joy';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveIndexName } from '@/store/slices/terminalSlice';
import { TerminalRow } from '../../styled';

const IndexSelection: React.FC = () => {
  const dispatch = useDispatch();
  const { addedIndexes, activeIndexName } = useSelector((s: RootState) => s.terminal);

  return (
    <TerminalRow sx={{ gap: '4px', py: '4px', flexWrap: 'nowrap', overflowX: 'auto' }}>
      {addedIndexes.map((idx) => (
        <Box
          key={idx}
          onClick={() => dispatch(setActiveIndexName(idx))}
          sx={{
            px: '10px', py: '3px', borderRadius: '5px',
            fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.4px', whiteSpace: 'nowrap', userSelect: 'none',
            transition: 'all 0.15s',
            ...(activeIndexName === idx
              ? { bgcolor: '#10b981', color: 'white', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }
              : { bgcolor: '#f3f4f6', color: '#6b7280', '&:hover': { bgcolor: '#e5e7eb', color: '#374151' } }
            ),
          }}
        >
          {idx}
        </Box>
      ))}
    </TerminalRow>
  );
};

export default IndexSelection;