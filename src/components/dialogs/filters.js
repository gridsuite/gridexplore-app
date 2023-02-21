/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {
    useCallback,
    useRef,
    useState,
    useMemo,
    useEffect,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Grid from '@mui/material/Grid';
import { Chip, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { useParameterState } from './parameters-dialog';
import { getComputedLanguage } from '../../utils/language';
import makeStyles from '@mui/styles/makeStyles';
import { useSnackMessage } from '@gridsuite/commons-ui';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { fetchAppsAndUrls } from '../../utils/rest-api';

const useStyles = makeStyles((theme) => ({
    inputLegend: {
        backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px 0 8px',
    },
}));

export const CountriesSelection = ({
    initialValue,
    onChange,
    titleMessage,
}) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [value, setValue] = useState(initialValue);
    const countriesListCB = useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to english if no localised list found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);

    const countriesList = countriesListCB();
    return (
        <>
            <FormControl fullWidth margin="dense">
                <Autocomplete
                    id="select_countries"
                    value={value}
                    multiple={true}
                    onChange={(oldVal, newVal) => {
                        onChange(newVal);
                        setValue(newVal);
                    }}
                    options={Object.keys(countriesList.object())}
                    getOptionLabel={(code) => countriesList.get(code)}
                    renderInput={(props) => (
                        <TextField
                            label={<FormattedMessage id={titleMessage} />}
                            {...props}
                        />
                    )}
                    renderTags={(val, getTagsProps) =>
                        val.map((code, index) => (
                            <Chip
                                id={'chip_' + code}
                                size={'small'}
                                label={countriesList.get(code)}
                                {...getTagsProps({ index })}
                            />
                        ))
                    }
                />
            </FormControl>
        </>
    );
};

export const EnumSelection = ({
    initialValue,
    onChange,
    titleMessage,
    enumValues,
}) => {
    const [value, setValue] = useState(initialValue);
    const intl = useIntl();
    const options = useMemo(() => Object.keys(enumValues), [enumValues]);

    const enumTranslations = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(enumValues).map(([k, v]) => [
                    k,
                    intl.formatMessage({ id: v }),
                ])
            ),
        [intl, enumValues]
    );

    const getOptionLabel = useCallback(
        (enumEntry) => enumTranslations[enumEntry] ?? '',
        [enumTranslations]
    );

    // Note: we use Autocomplete because it has a convenient clear icon to set the enum to null (not defined).
    // To make the field read-only, we disable the KeyDown event.

    return (
        <>
            <FormControl fullWidth margin="dense">
                <Autocomplete
                    id={'select_' + titleMessage}
                    defaultValue={initialValue}
                    value={value}
                    onChange={(oldVal, newVal) => {
                        onChange(newVal);
                        setValue(newVal);
                    }}
                    options={options}
                    getOptionLabel={getOptionLabel}
                    renderInput={(props) => (
                        <TextField
                            onKeyDown={(event) => {
                                // We disable any user Key strike, except Tab for navigation
                                if (event.code !== 'Tab') {
                                    event.preventDefault();
                                }
                            }}
                            label={<FormattedMessage id={titleMessage} />}
                            {...props}
                        />
                    )}
                />
            </FormControl>
        </>
    );
};

export const RangeType = {
    equality: 'EQUALITY',
    greaterThan: 'GREATER_THAN',
    greaterOrEqual: 'GREATER_OR_EQUAL',
    lessThan: 'LESS_THAN',
    lessOrEqual: 'LESS_OR_EQUAL',
    range: 'RANGE',
};

export const RangeSelection = ({ initialValue, onChange, titleMessage }) => {
    const [equalityType, setEqualityType] = useState(initialValue.type);
    const range = useRef(initialValue);
    const classes = useStyles();
    const [currentValue1, setCurrentValue1] = useState(
        range.current.value1 !== undefined ? range.current.value1 : ''
    );
    const [currentValue2, setCurrentValue2] = useState(
        range.current.value2 !== undefined ? range.current.value2 : ''
    );
    const { snackInfo } = useSnackMessage();

    function onSetEqualityType(e) {
        range.current.type = e.target.value;
        range.current.value2 = null;
        onChange(range.current);
        setEqualityType(e.target.value);
    }

    // a nominal voltage is positive
    const regex = /^[0-9]*[.,]?[0-9]*$/;

    function onSetNumber(index, newValue) {
        if (newValue === '' || regex.test(newValue)) {
            const value = newValue.replace(',', '.');
            index === 0 ? setCurrentValue1(value) : setCurrentValue2(value);
            range.current['value' + (index + 1)] = value === '' ? null : value;
            onChange(range.current);
        }
    }

    function handlePaste(index, evt) {
        const newValue = evt.clipboardData.getData('text').trim(); // trim spaces in pasted value
        if (newValue !== '' && !regex.test(newValue)) {
            // the clipboard data is bad: clear input and display an info message
            onSetNumber(index, '');
            snackInfo({
                messageTxt: '"' + newValue + '"',
                headerId: 'cannotPasteTextAsNominalVoltage',
            });
        } else {
            onSetNumber(index, newValue);
        }
        evt.preventDefault(); // don't call onChange after onPaste
    }

    const intl = useIntl();

    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel className={classes.inputLegend}>
                    <FormattedMessage id={titleMessage} />
                </InputLabel>
                <Grid container spacing={0}>
                    <Grid
                        item
                        style={
                            equalityType === RangeType.range
                                ? {
                                      flex: 'min-content',
                                  }
                                : {}
                        }
                    >
                        <Select
                            fullWidth
                            style={{
                                borderRadius: '4px 0 0 4px',
                            }}
                            value={equalityType}
                            onChange={onSetEqualityType}
                        >
                            {Object.entries(RangeType).map(([key, value]) => (
                                <MenuItem key={key} value={value}>
                                    <FormattedMessage id={key} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item>
                        <TextField
                            onPaste={(e) => {
                                handlePaste(0, e);
                            }}
                            onChange={(e) => {
                                onSetNumber(0, e.target.value);
                            }}
                            value={currentValue1}
                            InputProps={
                                equalityType === RangeType.range
                                    ? {
                                          style: {
                                              borderRadius: '0 0 0 0',
                                          },
                                      }
                                    : {
                                          style: {
                                              borderRadius: '0 4px 4px 0',
                                          },
                                      }
                            }
                            placeholder={
                                equalityType === RangeType.range
                                    ? intl.formatMessage({ id: 'Min' })
                                    : ''
                            }
                        />
                    </Grid>
                    {equalityType === RangeType.range && (
                        <Grid item>
                            <TextField
                                onPaste={(e) => {
                                    handlePaste(1, e);
                                }}
                                onChange={(e) => {
                                    onSetNumber(1, e.target.value);
                                }}
                                value={currentValue2}
                                InputProps={{
                                    style: {
                                        borderRadius: '0 4px 4px 0',
                                    },
                                }}
                                placeholder={
                                    equalityType === RangeType.range
                                        ? intl.formatMessage({ id: 'Max' })
                                        : ''
                                }
                            />
                        </Grid>
                    )}
                </Grid>
            </FormControl>
        </>
    );
};

export const useExpandableCriterium = ({
    id,
    labelAddValue,
    Field,
    fieldProps,
    initialValues,
    onChange,
    validateItems,
}) => {
    const classes = useStyles();
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
        const res = validateItems ? validateItems(values) : [];
        setErrors(res);
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
                            }}
                        >
                            <Field
                                index={idx}
                                onChange={handleSetValue}
                                defaultValue={value}
                                fieldProps={fieldProps}
                                errors={errors?.get(idx)}
                            />
                            <IconButton
                                className={classes.deleteButton}
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
                            className={classes.button}
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
        classes.button,
        classes.deleteButton,
        handleAddValue,
        labelAddValue,
        id,
        handleSetValue,
        handleDeleteItem,
        errors,
    ]);

    return field;
};

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
                    id={'name_roperty'}
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
            <FormControl fullWidth margin="dense">
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

const FreeProperties = ({ initialValue, onChange, titleMessage }) => {
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

    const freePropsField = useExpandableCriterium({
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

export const filteredTypes = {
    countries: {
        defaultValue: [],
        renderer: CountriesSelection,
    },
    range: {
        renderer: RangeSelection,
        defaultValue: {
            type: RangeType.equality,
            value: [undefined, undefined],
        },
    },
    enum: {
        defaultValue: null,
        renderer: EnumSelection,
    },
    freeProperties: {
        renderer: FreeProperties,
        defaultValue: {},
    },
};
