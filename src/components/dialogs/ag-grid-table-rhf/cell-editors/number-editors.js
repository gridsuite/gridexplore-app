/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Input } from '@mui/material';
import { useController } from "react-hook-form";

const NumberEditor = forwardRef(({ ...props }, ref) => {
    const {
        field: { value, onChange },
    } = useController({
        name: `${props.name}.${props.colDef.field}`,
    });

    const handleChange = (event) => {
        onChange(event.target.value);
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
