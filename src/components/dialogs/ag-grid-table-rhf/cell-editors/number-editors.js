import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Input } from '@mui/material';

const NumberEditor = forwardRef(({ ...props }, ref) => {
    const [value, setValue] = useState(props.value ?? null);

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    useImperativeHandle(
        ref,
        () => {
            return {
                getValue: () => {
                    return value;
                },
            };
        },
        [value]
    );
    return (
        <Input
            type="number"
            value={value}
            onChange={handleChange}
            disableUnderline={true}
            fullWidth
            autoFocus
            style={{ height: 'inherit' }}
        />
    );
});

export default NumberEditor;
