import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { Chip, Input } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    chip: {
        cursor: 'pointer',
        marginRight: theme.spacing(0.5),
    },
}));

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const value = useMemo(() => props?.data?.equipments, [props.data]);
    const [selectedValues, setSelectedValues] = useState([]);

    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    const handleChipDelete = (chipToDelete) => () => {
        const updatedValues = selectedValues.filter(
            (value) => value !== chipToDelete
        );
        setSelectedValues(updatedValues);
        props.data.equipments = updatedValues;
    };

    const handleChipAdd = (_, value) => {
        const updatedValues = [...selectedValues, value];
        setSelectedValues(updatedValues);
        console.log('props  add ', props);
        props.data.equipments = updatedValues;
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && selectedValues.length > 0) {
            props.api.stopEditing();
            console.log('key press event : ', event);
            handleChipAdd(event.value);
        }
    };

    const chipsArray = useMemo(
        () =>
            selectedValues &&
            selectedValues
                .filter((v) => v)
                .map((val) => (
                    <Chip
                        label={val}
                        onDelete={() => {
                            if (Array.isArray(selectedValues)) {
                                setSelectedValues((oldValues) =>
                                    oldValues.splice(
                                        oldValues.indexOf(val) + 1,
                                        1
                                    )
                                );
                            }
                        }}
                        style={{ margin: '2px' }}
                    />
                )),
        [selectedValues]
    );
    return (
        <Autocomplete
            style={{
                width: '100%',
                height: '100%',
            }}
            multiple
            freeSolo
            options={selectedValues}
            getOptionLabel={(o) => (o ? o.toString() : '')}
            value={''}
            onChange={handleChipAdd}
            onKeyPress={handleKeyPress}
            renderInput={(params) => {
                console.log('params renderInput', selectedValues);
                return (
                    <div>
                        {selectedValues && (
                            <>
                                {selectedValues.filter((v) => v).map((val) => (
                                    <Chip
                                        label={val}
                                        onDelete={() => {
                                            if (Array.isArray(selectedValues)) {
                                                setSelectedValues((oldValues) =>
                                                    oldValues.splice(
                                                        oldValues.indexOf(val) + 1,
                                                        1
                                                    )
                                                );
                                            }
                                        }}
                                        style={{margin: '2px'}}
                                    />))
                                }
                                <Input disableUnderline={true} {...params} />
                            </>
                        )}
                    </div>
                );
            }}
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
