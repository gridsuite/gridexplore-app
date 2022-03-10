/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import Grid from '@mui/material/Grid';
import { Chip, InputAdornment, MenuItem, Select } from '@mui/material';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { PARAM_LANGUAGE } from '../../utils/config-params';
import { useParameterState } from './parameters-dialog';
import { getComputedLanguage } from '../../utils/language';

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

export const CountriesSelection = ({ initialValue, onChange, disabled }) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
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
        <Autocomplete
            id="select_countries"
            defaultValue={initialValue}
            multiple={true}
            disabled={disabled}
            onChange={(oldVal, newVal) => onChange(newVal)}
            options={Object.keys(countriesList.object())}
            getOptionLabel={(code) => countriesList.get(code)}
            renderInput={(props) => <TextField {...props} />}
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
    );
};

export const RangeType = {
    equality: 'EQUALITY',
    range: 'RANGE',
    approx: 'APPROX',
};

export const RangeSelection = ({ initialValue, onChange, disabled }) => {
    const [equalityType, setEqualityType] = useState(initialValue.type);
    const range = useRef(initialValue);

    function onSetEqualityType(e) {
        range.current.type = e.target.value;
        range.current.value2 = null;
        onChange(range.current);
        setEqualityType(e.target.value);
    }

    function onSetNumber(index, value) {
        range.current['value' + (index + 1)] = value;
        onChange(range.current);
    }

    const intl = useIntl();

    return (
        <Grid container spacing={1}>
            <Grid item xs>
                <Select
                    value={equalityType}
                    onChange={onSetEqualityType}
                    disabled={disabled}
                >
                    {Object.entries(RangeType).map(([key, value]) => (
                        <MenuItem key={key} value={value}>
                            <FormattedMessage id={key} />
                        </MenuItem>
                    ))}
                </Select>
            </Grid>
            <Grid item xs>
                <TextField
                    onChange={(e) => {
                        onSetNumber(0, e.target.value);
                    }}
                    disabled={disabled}
                    defaultValue={range.current.value1}
                    inputMode={'numeric'}
                    type="number"
                    placeholder={
                        equalityType === RangeType.range
                            ? intl.formatMessage({ id: 'Min' })
                            : ''
                    }
                />
            </Grid>
            {equalityType !== RangeType.equality && (
                <Grid item xs>
                    <TextField
                        onChange={(e) => {
                            onSetNumber(1, e.target.value);
                        }}
                        InputProps={
                            equalityType === RangeType.approx
                                ? {
                                      endAdornment: (
                                          <InputAdornment position="end">
                                              %
                                          </InputAdornment>
                                      ),
                                  }
                                : {}
                        }
                        disabled={disabled}
                        defaultValue={range.current.value2}
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
