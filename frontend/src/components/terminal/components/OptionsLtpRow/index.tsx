// import React from 'react';
// import { Box, Typography } from '@mui/joy';
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store/store';
// import { TerminalRow } from '../../styled';

// const LtpCard: React.FC<{
//   optionType: 'CE' | 'PE';
//   strike: number | null;
//   ltp: number | null;
// }> = ({ optionType, strike, ltp }) => {
//   const isCe = optionType === 'CE';
//   return (
//     <Box
//       sx={{
//         flex: 1,
//         minWidth: 0,
//         px: '8px',
//         py: '6px',
//         borderRadius: '8px',
//         border: `1px solid ${isCe ? '#bbf7d0' : '#fecaca'}`,
//         bgcolor: isCe ? '#f0fdf4' : '#fef2f2',
//       }}
//     >
//       <Typography
//         sx={{
//           fontSize: '10px',
//           fontWeight: 700,
//           color: isCe ? '#10b981' : '#ef4444',
//           lineHeight: 1.2,
//         }}
//       >
//         {optionType}{strike ?? '-'}
//       </Typography>
//       <Typography
//         sx={{
//           fontSize: '14px',
//           fontWeight: 800,
//           color: '#111827',
//           lineHeight: 1.2,
//           mt: '2px',
//         }}
//       >
//         {ltp !== null ? ltp.toFixed(2) : '-'}
//       </Typography>
//     </Box>
//   );
// };

// const OptionsLtpRow: React.FC = () => {
//   const { ceStrike, peStrike, ceLtp, peLtp } = useSelector((s: RootState) => s.terminal);
//   return (
//     <TerminalRow sx={{ gap: '8px', py: '6px' }}>
//       <LtpCard optionType="CE" strike={ceStrike} ltp={ceLtp} />
//       <LtpCard optionType="PE" strike={peStrike} ltp={peLtp} />
//     </TerminalRow>
//   );
// };

// export default OptionsLtpRow;
