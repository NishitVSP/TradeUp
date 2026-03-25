import { TextField, TextFieldProps } from '@mui/material';

interface CustomInputProps extends Omit<TextFieldProps, 'variant' | 'type'> {
  label?: string;
  type?: 'text' | 'email' | 'password';
  fullWidth?: boolean;
  error?: boolean;
}

export function Input({
  label,
  type = 'text',
  fullWidth = false,
  error = false,
  sx,
  ...props
}: CustomInputProps) {
  return (
    <TextField
      {...props}
      fullWidth={fullWidth}
      type={type}
      label={label}
      error={error}
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: error ? '#ef4444' : 'rgba(0, 0, 0, 0.23)',
          },
        },
        '& .MuiInputLabel-root': {
          color: error ? '#ef4444' : '#666',
        },
        '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
          borderColor: '#10b981',
        },
        '&.Mui-focused .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
          borderColor: '#10b981',
        },
        ...sx,
      }}
    />
  );
}