import { useCallback } from 'react';
import { IconButton } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

export const AlertButton = (key) => {
    const handleClick = useCallback(() => {
        alert('this is an alert');
    }, []);

    return (
        <IconButton key={key} onClick={handleClick}>
            <ErrorOutlineOutlinedIcon />
        </IconButton>
    );
};

export default AlertButton;
