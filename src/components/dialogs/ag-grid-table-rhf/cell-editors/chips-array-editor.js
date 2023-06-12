import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Chip, Input } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import makeStyles from '@mui/styles/makeStyles';
import TextField from '@mui/material/TextField';
import {useImperativeHandle} from "react";
import {EQUIPMENT_IDS} from "../../../utils/field-constants";
import {styled} from "@mui/styles";

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

export const ChipsArray = ({ values, onDelete, getTagProps }) => {
    return (
        values &&
        values.map((val, index) => (
            <Chip
                key={val + index}
                label={val}
                size={'small'}
                onDelete={() => {
                    onDelete(index);
                }}
                style={{ margin: '2px' }}
                {...getTagProps({index})}
            />
        ))
    );
};

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const [values, setValues] = useState(props?.data?.[EQUIPMENT_IDS] ?? []);
    const classes = useStyles();

    const handleChipDeleted = (index) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        setValues(newValues);
    };

    useEffect(() =>  {
        props.setValue(values)
    }, [values])

    const handleChipAdd = (_, value) => {
        const updatedValues = new Set([...values, ...value]);
        setValues([...updatedValues]);

    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && values?.length > 0) {
            props.api.stopEditing();
            const newVal = Array.isArray(event?.value) ? event.value[0].trim() : '';
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
                height: '100%',
            }}
            multiple
            freeSolo
            options={[]}
            value={values}
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
            renderTags={(val, getTagProps) => (
                <ChipsArray
                    values={val}
                    getTagProps={getTagProps}
                />
            )}
        />
    );
});

export default ChipsArrayEditor;
