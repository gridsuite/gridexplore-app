/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { FormattedMessage } from 'react-intl';

export const ExpandableCriteria = ({
    id,
    labelAddValue,
    Field,
    fieldProps,
    initialValues,
    onChange,
    validateItems,
}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState();

    const handleDeleteItem = useCallback(
        (index) => {
            setValues((oldValues) => {
                let newValues = [...oldValues];
                newValues.splice(index, 1);
                onChange(newValues);
                return newValues;
            });
        },
        [onChange]
    );

    const handleSetValue = useCallback(
        (index, newValue) => {
            setValues((oldValues) => {
                let newValues = [...oldValues];
                newValues[index] = newValue;
                onChange(newValues);
                return newValues;
            });
        },
        [onChange]
    );

    const handleAddValue = useCallback(() => {
        setValues((oldValues) => {
            const ret = [...oldValues, { name: '', values: [] }];
            onChange(ret);
            return ret;
        });
    }, [onChange]);

    useEffect(() => {
        if (validateItems) {
            setErrors((prevErrors) => validateItems(values, prevErrors));
        } else {
            setErrors(null);
        }
    }, [values, validateItems]);

    const field = useMemo(() => {
        return (
            <Grid item container spacing={2} columns={1}>
                <Grid item sx={{ width: '100%' }} columns={1}>
                    {values.map((value, idx) => (
                        <span
                            key={id + idx}
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                width: '100%',
                                marginTop: '1ex',
                            }}
                        >
                            <Field
                                index={idx}
                                onChange={handleSetValue}
                                defaultValue={value}
                                fieldProps={fieldProps}
                                errors={errors?.[idx]}
                            />
                            <IconButton
                                key={id + idx}
                                onClick={() => handleDeleteItem(idx)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </span>
                    ))}
                </Grid>
                <Grid
                    item
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                    }}
                >
                    <span>
                        <Button
                            fullWidth
                            // className={classes.button}
                            startIcon={<AddIcon />}
                            onClick={handleAddValue}
                        >
                            <FormattedMessage id={labelAddValue} />
                        </Button>
                    </span>
                </Grid>
            </Grid>
        );
    }, [
        values,
        fieldProps,
        handleAddValue,
        labelAddValue,
        id,
        handleSetValue,
        handleDeleteItem,
        errors,
    ]);

    return field;
};
