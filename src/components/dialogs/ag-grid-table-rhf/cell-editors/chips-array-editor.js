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
import { EQUIPMENT_IDS } from '../../../utils/field-constants';

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
    const [values, setValues] = useState(props?.data?.[EQUIPMENT_IDS] ?? []);
    const classes = useStyles();

    const handleChipDeleted = (index) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        setValues(newValues);
    };

    useEffect(() => {
        props.setValue(values);
    }, [values, props]);

    const handleChipAdd = (_, value) => {
        const updatedValues = new Set([...values, ...value]);
        setValues([...updatedValues]);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && values?.length > 0) {
            props.api.stopEditing();
            const newVal = Array.isArray(event?.value)
                ? event.value[0].trim()
                : '';
            if (newVal !== '' && !values.includes(newVal)) {
                handleChipAdd(event.value);
            }
        }
    };

    useImperativeHandle(
        ref,
        () => {
            return {
                getValue: () => {
                    return values;
                },
            };
        },
        [values]
    );

    return (
        <Autocomplete
            style={{
                width: '100%',
                //height: '100%',
            }}
            multiple
            freeSolo
            options={[]}
            value={values}
            size={'small'}
            onChange={handleChipAdd}
            onKeyPress={handleKeyPress}
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
            renderTags={(val, getTagProps) =>
                values.map((val, index) => (
                    <Chip
                        key={val + index}
                        label={val}
                        size={'small'}
                        style={{ margin: '2px' }}
                        {...getTagProps({ index })}
                        onDelete={(i) => handleChipDeleted(i)}
                    />
                ))
            }
        />
    );
});

export default ChipsArrayEditor;
