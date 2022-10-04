/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Grid from '@mui/material/Grid';
import { Chip, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { useParameterState } from './parameters-dialog';
import { getComputedLanguage } from '../../utils/language';
import withStyles from '@mui/styles/withStyles';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        padding: '15px 40px',
    },
    inputLegend: {
        backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px 0 8px',
    },
}));

const CustomTextField = withStyles(() => ({
    root: {
        width: '90%',
    },
}))(TextField);

export const StringInput = ({ initialValue, onChange, disabled }) => {
    return (
        <TextField
            onChange={(e) => {
                onChange(e.target.value);
            }}
            disabled={disabled}
            defaultValue={initialValue}
        />
    );
};

export const CountriesSelection = ({
    initialValue,
    onChange,
    disabled,
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
                    disabled={disabled}
                    onChange={(oldVal, newVal) => {
                        onChange(newVal);
                        setValue(newVal);
                    }}
                    options={Object.keys(countriesList.object())}
                    getOptionLabel={(code) => countriesList.get(code)}
                    renderInput={(props) => (
                        <CustomTextField
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

export const RangeType = {
    equality: 'EQUALITY',
    greaterThan: 'GREATER_THAN',
    greaterOrEqual: 'GREATER_OR_EQUAL',
    lessThan: 'LESS_THAN',
    lessOrEqual: 'LESS_OR_EQUAL',
    range: 'RANGE',
};

export const RangeSelection = ({
    initialValue,
    onChange,
    disabled,
    titleMessage,
}) => {
    const [equalityType, setEqualityType] = useState(initialValue.type);
    const range = useRef(initialValue);
    const classes = useStyles();

    function onSetEqualityType(e) {
        range.current.type = e.target.value;
        range.current.value2 = null;
        onChange(range.current);
        setEqualityType(e.target.value);
    }

    function onSetNumber(index, value) {
        range.current['value' + (index + 1)] = value === '' ? null : value;
        onChange(range.current);
    }

    const intl = useIntl();

    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel className={classes.inputLegend}>
                    <FormattedMessage id={titleMessage} />
                </InputLabel>
                <Grid container spacing={0}>
                    <Grid item>
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
                            onChange={(e) => {
                                onSetNumber(0, e.target.value);
                            }}
                            disabled={disabled}
                            defaultValue={range.current.value1}
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
                            inputMode={'numeric'}
                            type="number"
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
                                onChange={(e) => {
                                    onSetNumber(1, e.target.value);
                                }}
                                disabled={disabled}
                                defaultValue={range.current.value2}
                                InputProps={{
                                    style: {
                                        borderRadius: '0 4px 4px 0',
                                    },
                                }}
                                inputMode={'numeric'}
                                type="number"
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

export const filteredTypes = {
    string: {
        defaultValue: '',
        renderer: StringInput,
    },
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
};
