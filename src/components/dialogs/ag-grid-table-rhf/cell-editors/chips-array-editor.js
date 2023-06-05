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

const useStyles = makeStyles((theme) => ({
    chip: {
        cursor: 'pointer',
        marginRight: theme.spacing(0.5),
    },
}));

const ChipsArray = ({ values, onDelete, getTagProps }) => {
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

    const handleChipDeleted = (index) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        setValues(newValues);
    };

    const handleChipAdd = (_, value) => {
        const updatedValues = new Set([...values, ...value]);
        console.log('handleChipAdd : ', value)
        console.log('handleChipAdd updatedValues : ', updatedValues)
        setValues(value);
        props.setValue([...updatedValues])
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && values?.length > 0) {
            props.api.stopEditing();
            const newVal = Array.isArray(event?.value) ? event.value[0].trim() : '';
            console.log('key press event : ', newVal);
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
                        variant={'standard'}
                        fullWidth
                        style={{ height: '100%' }}
                        inputProps={{disableUnderline: true}}
                        {...params}
                        //inputProps={{disableUnderline: true, autoFocus: true}}
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

/*
renderTags={(values) =>
                    values.map((val, index) => {
                        console.log('renderTags', values)
                        return (
                            <Chip
                                label={val}
                                key={index}
                                onDelete={handleDeleteChip}
                            />
                        );
                    })
                }
<div>
            <Input
                type="text"
                value={editedValues}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
            />
            {props?.data?.equipments && (
                props?.data?.equipments.map((equipment, index) => (
                    <Chip
                        label={equipment}
                        key={index}
                        onDelete={() => props.data.equipments.splice(index, 1)}
                    />
                ))
            )}
        </div>


 */
