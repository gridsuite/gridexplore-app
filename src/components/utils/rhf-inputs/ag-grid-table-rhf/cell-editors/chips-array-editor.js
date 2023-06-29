/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Chip } from '@mui/material';
import { useFieldArray, useWatch } from 'react-hook-form';
import AutocompleteInput from '../../autocomplete-input';

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const { name, rowIndex, colDef } = props;
    const [unsavedInput, setUnsavedInput] = useState('');
    const watchValues = useWatch({
        name: `${name}.${rowIndex}.${colDef.field}`,
    });

    const { append, remove } = useFieldArray({
        name: `${name}.${rowIndex}.${colDef.field}`,
    });

    const handleOnBlur = () => {
        append(unsavedInput);
        setUnsavedInput('');
    };

    const handleChipDeleted = (index) => {
        remove(index);
    };

    useImperativeHandle(
        ref,
        () => {
            return {
                getValue: () => {
                    return watchValues;
                },
            };
        },
        [watchValues]
    );

    return (
        <AutocompleteInput
            name={`${name}.${rowIndex}.${colDef.field}`}
            options={[]}
            size={'small'}
            allowNewValue
            multiple
            clearOnBlur
            disableClearable={true}
            onInputChange={(_, val) => setUnsavedInput(val.trim() ?? '')}
            onBlur={handleOnBlur}
            blurOnSelect={false}
            formProps={{
                sx: {
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: 'unset', // Remove the border
                    },
                    '&:hover .MuiOutlinedInput-root': {
                        border: 'unset', // Remove the border on hover
                    },
                    '& .Mui-focused .MuiOutlinedInput-root': {
                        border: 'unset', // Remove the border when focused
                    },
                },
            }}
            renderTags={(val, getTagProps) => {
                return val.map((chip, index) => {
                    return (
                        <Chip
                            key={chip.id}
                            label={val[index]}
                            size={'small'}
                            {...getTagProps({ index })}
                            onDelete={(i) => handleChipDeleted(i)}
                        />
                    );
                });
            }}
        />
    );
});

export default ChipsArrayEditor;
