/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Chip, FormControl } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { FormattedMessage } from 'react-intl';

import { useExpandableCriteria } from './expandable-criteria';
import { fetchAppsAndUrls } from '../../utils/rest-api';

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
            <FormControl
                fullWidth
                margin="dense"
                sx={{ flexBasis: '28%', marginTop: 0 }}
            >
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
            <FormControl
                sx={{ paddingLeft: '1ex', flexBasis: '72%', marginTop: 0 }}
            >
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

export const FreeProperties = ({
    initialValue,
    onChange,
    titleMessage,
    validationsCount,
    isForSubstation = false,
}) => {
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
    const validationsCountRef = useRef();

    const onPropertiesArrayChange = useCallback(
        (arr) => {
            const obj = !arr
                ? {}
                : Object.fromEntries(arr.map((p) => [p.name || '', p.values]));
            const vetoIdx = arr.findIndex((p) => !p.name || !p?.values?.length);
            onChange(obj, vetoIdx >= 0);
        },
        [onChange]
    );

    const validateProperties = useCallback(
        (values, prevErrors) => {
            const res = new Map();
            const idMap = values.reduce(
                (m, v) => m.set(v.name, (m.get(v.name) || 0) + 1),
                new Map()
            );

            const shrinksOnly =
                validationsCountRef.current === validationsCount;

            values.forEach((val, idx) => {
                let prevError = prevErrors?.get(idx);
                if (shrinksOnly && !prevError) return;

                const count = idMap.get(val.name);
                const errInBuild = {};
                if (
                    !val?.values?.length &&
                    (!shrinksOnly || prevError?.PropValue)
                ) {
                    errInBuild.PropValue = 'ValueMayNotBeEmpty';
                }

                if (!shrinksOnly || prevError?.PropName) {
                    if (!val.name) {
                        errInBuild.PropName = 'EmptyName';
                    } else if (count > 1) {
                        errInBuild.PropName = 'DuplicateName';
                    }
                }

                if (Object.keys(errInBuild).length) {
                    errInBuild.error = true;
                    res.set(idx, errInBuild);
                }
            });

            if (validationsCountRef.current !== validationsCount) {
                validationsCountRef.current = validationsCount;
            }

            return res;
        },
        [validationsCount]
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

    const field = (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <h3>
                        <FormattedMessage id={'FreePropsCrit'} />
                    </h3>
                    {!isForSubstation && (
                        <h4>
                            <FormattedMessage id={'SubstationFreeProps'} />
                        </h4>
                    )}
                </Grid>
            </Grid>

            <Grid container item direction="row" spacing={2}>
                {freePropsField}
            </Grid>
        </>
    );

    useEffect(() => {
        fetchPredefinedProperties().then((p) => setFieldProps(p));
    }, []);

    return field;
};

export const FreePropertiesS = ({ initialValue, onChange, titleMessage }) => {
    return FreeProperties({
        initialValue,
        onChange,
        titleMessage,
        isForSubstation: true,
    });
};

export const FreeProperty2 = ({
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

    const [values1, setValues1] = useState(defaultValue?.values1 || []);
    const [values2, setValues2] = useState(defaultValue?.values2 || []);

    useEffect(() => {
        setName(defaultValue?.name);
        setValues1(defaultValue?.values1 || []);
        setValues2(defaultValue?.values2 || []);
    }, [defaultValue]);

    return (
        <>
            <FormControl
                fullWidth
                margin="dense"
                sx={{ flexBasis: '28%', marginTop: 0 }}
            >
                <Autocomplete
                    id={'name_property'}
                    defaultValue={''}
                    value={name}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    onChange={(oldVal, newVal) => {
                        onChange(index, {
                            name: newVal,
                            values1: [],
                            values2: [],
                        });
                        setName(newVal);
                        setValues1([]);
                        setValues2([]);
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
            <FormControl sx={{ paddingLeft: '1ex', flexBasis: '36%' }}>
                <Autocomplete
                    id="prop_values1"
                    value={values1}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    multiple={true}
                    onChange={(oldVal, newVal) => {
                        onChange(index, { name, values1: newVal, values2 });
                        setValues1(newVal);
                    }}
                    options={predefinedValues}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id="PropertyValues1" />}
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
            <FormControl sx={{ paddingLeft: '1ex', flexBasis: '36%' }}>
                <Autocomplete
                    id="prop_values2"
                    value={values2}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    multiple={true}
                    onChange={(oldVal, newVal) => {
                        onChange(index, { name, values1, values2: newVal });
                        setValues2(newVal);
                    }}
                    options={predefinedValues}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id="PropertyValues2" />}
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

export const FreeProperties2 = ({
    initialValue,
    onChange,
    titleMessage,
    validationsCount,
}) => {
    const numericSuffixRegex = /[0-9]*$/;
    const numericSuffix = numericSuffixRegex.exec(titleMessage)[0];

    const [fieldProps, setFieldProps] = useState(null);
    const initialValues = useMemo(() => {
        if (!initialValue) return [];
        const ret = Object.entries(initialValue).map(([k, v]) => v);
        return ret;
    }, [initialValue]);
    const validationsCountRef = useRef(0);

    const onPropertiesArrayChange = useCallback(
        (arr) => {
            const obj = !arr
                ? {}
                : Object.fromEntries(arr.map((p) => [p.name || '', p]));
            const veto = arr.some(
                (p) => !p.name || (!p?.values1?.length && !p?.values2?.length)
            );
            onChange(obj, veto);
        },
        [onChange]
    );

    const validateProperties2 = useCallback(
        (values, prevErrors) => {
            const res = new Map();
            const idMap = values.reduce(
                (m, v) => m.set(v.name, (m.get(v.name) || 0) + 1),
                new Map()
            );

            const shrinksOnly =
                validationsCountRef.current === validationsCount;

            values.forEach((val, idx) => {
                let prevError = prevErrors?.get(idx);
                if (shrinksOnly && !prevError) return;

                const count = idMap.get(val.name);
                const errInBuild = {};
                if (
                    !val?.values1?.length &&
                    !val?.values2?.length &&
                    (!shrinksOnly || prevError?.PropValue)
                ) {
                    errInBuild.PropValue = 'ValueMayNotBeEmpty';
                }

                if (!shrinksOnly || prevError?.PropName) {
                    if (!val.name) {
                        errInBuild.PropName = 'EmptyName';
                    } else if (count > 1) {
                        errInBuild.PropName = 'DuplicateName';
                    }
                }

                if (Object.keys(errInBuild).length) {
                    errInBuild.error = true;
                    res.set(idx, errInBuild);
                }
            });

            if (validationsCountRef.current !== validationsCount) {
                validationsCountRef.current = validationsCount;
            }

            return res;
        },
        [validationsCount]
    );

    const freePropsField = useExpandableCriteria({
        id: 'freeProp' + numericSuffix,
        labelAddValue: 'AddFreePropCrit' + numericSuffix,
        Field: FreeProperty2,
        fieldProps: fieldProps,
        initialValues: initialValues,
        onChange: onPropertiesArrayChange,
        validateItems: validateProperties2,
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

    const field = (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <h3>
                        <FormattedMessage id={'FreePropsCrit'} />
                    </h3>
                    <h4>
                        <FormattedMessage id={'SubstationsFreeProps'} />
                    </h4>
                </Grid>
            </Grid>

            <Grid container item direction="row" spacing={2}>
                {freePropsField}
            </Grid>
        </>
    );

    useEffect(() => {
        fetchPredefinedProperties().then((p) => setFieldProps(p));
    }, []);

    return field;
};
