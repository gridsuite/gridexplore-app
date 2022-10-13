/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import TextField from '@mui/material/TextField';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    Autocomplete,
    Chip,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { EquipmentTypes } from '../../utils/equipment-types';

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

const FiltersEditor = ({ filters, onChange, nbVoltage, nbCountry }) => {
    const classes = useStyles();

    let countriesList;
    try {
        countriesList = require('localized-countries')(
            require('localized-countries/data/' +
                navigator.language.substr(0, 2))
        );
    } catch (error) {
        // fallback to english if no localised list found
        countriesList = require('localized-countries')(
            require('localized-countries/data/en')
        );
    }
    const intl = useIntl();

    function handleOperator(event) {
        onChange({
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: event.target.value,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
            countries2: filters.countries2,
        });
    }

    function handleEquipmentType(event) {
        onChange({
            equipmentType: event.target.value,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
            countries2:
                event.target.value !== 'LINE' &&
                event.target.value !== 'HVDC_LINE'
                    ? []
                    : filters.countries2,
        });
    }

    function handleCountrySelection(index, newValue) {
        onChange({
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: index === 0 ? newValue : filters.countries,
            countries2: index === 0 ? filters.countries2 : newValue,
        });
    }

    function handleNominalVoltage(event) {
        onChange({
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: event.target.value,
            countries: filters.countries,
            countries2: filters.countries2,
        });
    }

    const nominalVoltageOperators = ['=', '>', '>=', '<', '<=', 'range'];

    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel>
                    <FormattedMessage id="equipmentType" />
                </InputLabel>
                <Select
                    style={{ width: '90%' }}
                    id="demo-customized-select-native"
                    label={<FormattedMessage id="equipmentType" />}
                    value={filters.equipmentType}
                    onChange={handleEquipmentType}
                >
                    {Object.values(EquipmentTypes).map((val) => (
                        <MenuItem value={val} key={val}>
                            {intl.formatMessage({ id: val })}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {[...Array(nbCountry).keys()].map((countryIndex) => (
                <FormControl fullWidth margin="dense">
                    <Autocomplete
                        id={'select_countries_' + countryIndex}
                        value={
                            countryIndex === 0
                                ? filters.countries
                                : filters.countries2
                        }
                        multiple={true}
                        onChange={(event, newValue) => {
                            handleCountrySelection(countryIndex, newValue);
                        }}
                        options={Object.keys(countriesList.object())}
                        getOptionLabel={(code) => countriesList.get(code)}
                        renderInput={(props) => (
                            <CustomTextField
                                label={
                                    nbCountry < 2 ? (
                                        <FormattedMessage id="Countries" />
                                    ) : (
                                        <FormattedMessage
                                            id={
                                                'Countries' + (countryIndex + 1)
                                            }
                                        />
                                    )
                                }
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
            ))}
            {[...Array(nbVoltage).keys()].map((voltageIndex) => (
                <FormControl fullWidth margin="dense">
                    <InputLabel className={classes.inputLegend}>
                        {nbVoltage < 2 ? (
                            <FormattedMessage id="nominalVoltage" />
                        ) : (
                            <FormattedMessage
                                id={'nominalVoltage' + (voltageIndex + 1)}
                            />
                        )}
                    </InputLabel>
                    <Grid container style={{ width: '90%' }} spacing={0}>
                        <Grid item xs={2}>
                            <Select
                                fullWidth
                                id={'select_voltage_operator_' + voltageIndex}
                                style={{
                                    borderRadius: '4px 0 0 4px',
                                }}
                                value={filters.nominalVoltageOperator}
                                onChange={handleOperator}
                            >
                                {nominalVoltageOperators.map((operator) => (
                                    <MenuItem
                                        key={operator + '_' + voltageIndex}
                                        value={operator}
                                    >
                                        {operator}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        <Grid xs={10} item>
                            <TextField
                                fullWidth
                                id={'input_voltage_value_' + voltageIndex}
                                onChange={handleNominalVoltage}
                                value={
                                    filters.nominalVoltage === -1
                                        ? ''
                                        : filters.nominalVoltage
                                }
                                InputProps={{
                                    style: {
                                        borderRadius: '0 4px 4px 0',
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </FormControl>
            ))}
        </>
    );
};

export default FiltersEditor;
