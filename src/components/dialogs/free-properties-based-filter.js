/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, FormControl } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { FormattedMessage } from 'react-intl';
import { useExpandableCriteria } from './expandable-criteria';
import { fetchAppsAndUrls } from '../../utils/rest-api';
import Grid from '@mui/material/Grid';

export const FreeProperty = ({
    index,
    onChange,
    defaultValue,
    fieldProps,
    errors,
}) => {
    const predefined = fieldProps;

    const [name, setName] = useState(defaultValue?.name || '');

    const predefinedNames = useMemo(() => {
        return Object.keys(predefined ?? []).sort();
    }, [predefined]);

    const predefinedValues = useMemo(() => {
        const predefinedForName = predefined?.[name];
        if (!predefinedForName) return [];
        return [...new Set(predefinedForName)].sort();
    }, [name, predefined]);

    const [values, setValues] = useState(defaultValue?.values || []);

    useEffect(() => {
        setName(defaultValue?.name);
        setValues(defaultValue?.values);
    }, [defaultValue]);

    return (
        <>
            <FormControl fullWidth margin="dense">
                <Autocomplete
                    id={'name_property'}
                    defaultValue={''}
                    value={name}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    onChange={(oldVal, newVal) => {
                        onChange(index, { name: newVal, values: [] });
                        setName(newVal);
                        setValues([]);
                    }}
                    options={predefinedNames}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id="PropertyName" />}
                            error={!!errors?.PropName}
                            {...props}
                        />
                    )}
                />
            </FormControl>
            <FormControl sx={{ paddingLeft: '1ex' }}>
                <Autocomplete
                    id="prop_values"
                    value={values}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    multiple={true}
                    onChange={(oldVal, newVal) => {
                        onChange(index, { name, values: newVal });
                        setValues(newVal);
                    }}
                    options={predefinedValues}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id="PropertyValues" />}
                            error={!!errors?.PropValue}
                            {...props}
                        />
                    )}
                    renderTags={(val, getTagsProps) =>
                        val.map((code, index) => (
                            <Chip
                                id={'chip_' + code}
                                size={'small'}
                                label={code}
                                {...getTagsProps({ index })}
                            />
                        ))
                    }
                />
            </FormControl>
        </>
    );
};

function validateProperties(values) {
    const res = new Map();
    const idMap = values.reduce(
        (m, v) => m.set(v.name, (m.get(v.name) || 0) + 1),
        new Map()
    );

    values.forEach((val, idx) => {
        const count = idMap.get(val.name);
        const errInBuild = {};
        if (!val?.values?.length) {
            errInBuild.PropValue = 'ValueMayNotBeEmpty';
        }

        if (!val.name) {
            errInBuild.PropName = 'EmptyName';
        } else if (count > 1) {
            errInBuild.PropName = 'DuplicateName';
        }

        if (Object.keys(errInBuild).length) {
            errInBuild.error = true;
            res.set(idx, errInBuild);
        }
    });
    return res;
}

export const FreeProperties = ({ initialValue, onChange, titleMessage }) => {
    const numericSuffixRegex = /[0-9]*$/;
    const numericSuffix = numericSuffixRegex.exec(titleMessage)[0];

    const [fieldProps, setFieldProps] = useState(null);
    const initialValues = useMemo(() => {
        if (!initialValue) return [];
        const ret = Object.entries(initialValue).map(([k, v]) => {
            return { name: k || '', values: v };
        });
        return ret;
    }, [initialValue]);

    const onPropertiesArrayChange = useCallback(
        (arr) => {
            const obj = !arr
                ? {}
                : Object.fromEntries(arr.map((p) => [p.name || '', p.values]));
            onChange(obj);
        },
        [onChange]
    );

    const freePropsField = useExpandableCriteria({
        id: 'freeProp' + numericSuffix,
        labelAddValue: 'AddFreePropCrit' + numericSuffix,
        Field: FreeProperty,
        fieldProps: fieldProps,
        initialValues: initialValues,
        onChange: onPropertiesArrayChange,
        validateItems: validateProperties,
    });

    const fetchPredefinedProperties = () => {
        return fetchAppsAndUrls().then((res) => {
            const studyMetadata = res.find(
                (metadata) => metadata.name === 'Study'
            );
            if (!studyMetadata) {
                return Promise.reject(
                    'Study entry could not be found in metadatas'
                );
            }

            return studyMetadata?.predefinedEquipmentProperties?.substation;
        });
    };

    const field = useMemo(() => {
        return (
            <>
                <Grid container item direction="row" spacing={2}>
                    {freePropsField}
                </Grid>
            </>
        );
    }, [freePropsField]);

    useEffect(() => {
        fetchPredefinedProperties().then((p) => setFieldProps(p));
    }, []);

    return field;
};

