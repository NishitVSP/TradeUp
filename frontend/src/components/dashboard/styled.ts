import { styled, Box, Paper, Typography } from '@mui/material';

export const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  padding: theme.spacing(3),
}));

export const DashboardGrid = styled(Box)({
  display: 'flex',
  gap: '20px',
  height: 'calc(100vh - 48px)',
  width: '100%',
});

export const Column = styled(Box)<{ width: string }>(({ width }) => ({
  width,
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
}));

export const Panel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  background: '#ffffff',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e2e8f0',
  height: '100%',
  overflow: 'auto',
}));

export const SplitPanel = styled(Box)<{ height: string }>(({ height }) => ({
  height,
  display: 'flex',
  flexDirection: 'column',
}));

export const PanelHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '2px solid #e2e8f0',
});

export const PanelTitle = styled(Typography)({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#1e293b',
  letterSpacing: '-0.01em',
});

export const InfoRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #f1f5f9',
  '&:last-child': {
    borderBottom: 'none',
  },
});

export const InfoLabel = styled(Typography)({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#64748b',
});

export const InfoValue = styled(Typography)({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#1e293b',
});

export const BalanceCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  borderRadius: '12px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  color: '#ffffff',
}));

export const BalanceAmount = styled(Typography)({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '2rem',
  fontWeight: 700,
  color: '#ffffff',
  marginTop: '8px',
});

export const PlaceholderText = styled(Typography)({
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '1rem',
  fontWeight: 500,
  color: '#94a3b8',
  textAlign: 'center',
  padding: '40px 20px',
});