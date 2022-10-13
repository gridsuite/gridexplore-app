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
import makeStyles from '@mui/styles/makeStyles';
import { useSnackMessage } from '../../utils/messages';

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
        range.current.value1 ? range.current.value1 : ''
    );
    const [currentValue2, setCurrentValue2] = useState(
        range.current.value2 ? range.current.value2 : ''
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
            snackInfo(
                '"' + newValue + '"',
                'cannotPasteTextAsNominalVoltage',
                {}
            );
        } else {
            onSetNumber(index, newValue);
        }
        evt.preventDefault(); // dont call onChange after onPaste
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
};
