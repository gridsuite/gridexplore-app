import { useCallback } from 'react';
import { IconButton } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

export const AlertButton = () => {
    const handleClick = useCallback(() => {
        alert('this is an alert');
    }, []);

    return (
        <IconButton onClick={handleClick}>
            <ErrorOutlineOutlinedIcon />
            {'Alert '}
        </IconButton>
    );
};

export default AlertButton;
