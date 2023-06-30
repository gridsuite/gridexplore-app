/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { Chip } from '@mui/material';
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
        if (unsavedInput) {
            append(unsavedInput);
        }
        setUnsavedInput('');
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
            fullWidth
            options={[]}
            allowNewValue
            clearOnBlur
            disableClearable={true}
            onInputChange={(_, val) => setUnsavedInput(val.trim() ?? '')}
            onBlur={handleOnBlur}
            blurOnSelect={false}
            size={'small'}
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
            multiple
            renderTags={(val, getTagsProps) =>
                val
                    .filter((val) => val)
                    .map((value, index) => (
                        <Chip
                            id={'chip_' + value}
                            size={'small'}
                            label={value}
                            {...getTagsProps({ index })}
                            onDelete={() => {
                                remove(index);
                            }}
                        />
                    ))
            }
        />
    );
});

export default ChipsArrayEditor;
