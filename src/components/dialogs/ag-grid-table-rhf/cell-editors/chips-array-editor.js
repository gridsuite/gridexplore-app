/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import { Chip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import makeStyles from '@mui/styles/makeStyles';
import TextField from '@mui/material/TextField';
import { useController, useFieldArray } from 'react-hook-form';

const useStyles = makeStyles({
    input: {
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
});

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const [unsavedInput, setUnsavedInput] = useState('');
    const classes = useStyles();
    const {
        field: { value: equipments },
    } = useController({
        name: `${props.name}.${props.rowIndex}.${props.colDef.field}`,
    });

    const { fields, append, remove } = useFieldArray({
        name: `${props.name}.${props.rowIndex}.${props.colDef.field}`,
    });

    const handleChipDeleted = (index) => {
        remove(index);
    };

    useEffect(() => {
        props.setValue(equipments);
    }, [equipments, props]);

    const handleChipAdd = (_, newValue) => {
        append(newValue);
        setUnsavedInput('');
    };

    const handleOnChange = (event) => {
        if (unsavedInput) {
            handleChipAdd(event, unsavedInput);
        }
    };

    useImperativeHandle(
        ref,
        () => {
            return {
                getValue: () => {
                    return equipments;
                },
            };
        },
        [equipments]
    );

    return (
        <Autocomplete
            style={{
                width: '100%',
            }}
            multiple
            freeSolo
            options={[]}
            value={equipments}
            size={'small'}
            clearOnBlur
            onChange={(event, newVal) => {
                handleOnChange(event);
            }}
            disableClearable={true}
            onInputChange={(_, val) => setUnsavedInput(val.trim() ?? '')}
            onBlur={handleOnChange}
            renderInput={(params) => {
                return (
                    <TextField
                        fullWidth
                        className={classes.input}
                        style={{ height: '100%' }}
                        {...params}
                    />
                );
            }}
            renderTags={(val, getTagProps) => {
                return fields.map((val, index) => (
                    <Chip
                        key={val.id}
                        label={equipments[index]}
                        size={'small'}
                        {...getTagProps({ index })}
                        onDelete={(i) => handleChipDeleted(i)}
                    />
                ));
            }}
        />
    );
});

export default ChipsArrayEditor;
