/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import NativeSelect from '@material-ui/core/NativeSelect';
import InputBase from '@material-ui/core/InputBase';
import withStyles from '@material-ui/core/styles/withStyles';
import { EquipmentTypes } from '../utils/equipment-types';
import { FormattedMessage, useIntl } from 'react-intl';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { Chip } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    root: {
        flexGrow: 1,
        padding: '15px 40px',
    },
}));

const CustomNativeSelect = withStyles((theme) => ({
    select: {
        color: theme.palette.type === 'light' ? '#000 !important' : '#fff',
        backgroundColor: 'transparent !important',
    },
}))(NativeSelect);

const BootstrapInput = withStyles(() => ({
    input: {
        minWidth: '223px',
        minHeight: '19px',
        color: 'white',
        borderColor: 'grey',
        borderRadius: 4,
        position: 'relative',
        border: '1px solid',
        fontSize: 16,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 18.5,
        paddingBottom: 18.5,
    },
}))(InputBase);

// need english countries to save the country list
export const en_countries = require('localized-countries')(
    require('localized-countries/data/en')
);

const CustomTextField = withStyles(() => ({
    root: {
        width: '263px',
    },
}))(TextField);

const CustomAutocomplete = withStyles(() => ({
    root: {
        width: '263px',
    },
}))(Autocomplete);

const FiltersEditor = ({ filters, onChange }) => {
    const classes = useStyles();

    let countriesList;
    try {
        countriesList = require('localized-countries')(
            require('localized-countries/data/' +
                navigator.language.substr(0, 2))
        );
    } catch (error) {
        // fallback to english if no localised list found
        countriesList = en_countries;
    }
    const intl = useIntl();

    function handleOperator(event) {
        onChange({
            equipmentID: filters.equipmentID,
            equipmentName: filters.equipmentName,
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: event.target.value,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
        });
    }

    function handleEquipmentType(event) {
        onChange({
            equipmentID: filters.equipmentID,
            equipmentName: filters.equipmentName,
            equipmentType: event.target.value,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
        });
    }

    function handleCountrySelection(newValue) {
        onChange({
            equipmentID: filters.equipmentID,
            equipmentName: filters.equipmentName,
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: newValue,
        });
    }

    function handleEquipmentID(event) {
        onChange({
            equipmentID: event.target.value,
            equipmentName: filters.equipmentName,
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
        });
    }

    function handleEquipmentName(event) {
        onChange({
            equipmentID: filters.equipmentID,
            equipmentName: event.target.value,
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: filters.nominalVoltage,
            countries: filters.countries,
        });
    }

    function handleNominalVoltage(event) {
        onChange({
            equipmentID: filters.equipmentID,
            equipmentName: filters.equipmentName,
            equipmentType: filters.equipmentType,
            nominalVoltageOperator: filters.nominalVoltageOperator,
            nominalVoltage: event.target.value,
            countries: filters.countries,
        });
    }

    return (
        <div className={classes.root}>
            <Grid container direction="row" spacing={1}>
                <Grid item xs={12} sm={3}>
                    <h3>
                        <FormattedMessage id="equipmentID" />
                    </h3>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <CustomTextField
                        onChange={handleEquipmentID}
                        variant="outlined"
                        value={filters.equipmentID}
                    />
                </Grid>
            </Grid>

            <Grid container direction="row" spacing={1}>
                <Grid item xs={12} sm={3}>
                    <h3>
                        <FormattedMessage id="equipmentName" />
                    </h3>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <CustomTextField
                        onChange={handleEquipmentName}
                        variant="outlined"
                        value={filters.equipmentName}
                    />
                </Grid>
            </Grid>

            <Grid container direction="row" spacing={1}>
                <Grid item xs={9} sm={2}>
                    <h3>
                        <FormattedMessage id="nominalVoltage" />
                    </h3>
                </Grid>
                <Grid item xs={3} sm={1}>
                    <FormControl className={classes.formControl}>
                        <Select
                            native
                            value={filters.nominalVoltageOperator}
                            onChange={handleOperator}
                        >
                            <option value={'='}>=</option>
                            <option value={'>'}> &gt; </option>
                            <option value={'>='}> &ge; </option>
                            <option value={'<'}> &lt; </option>
                            <option value={'<='}> &le; </option>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <CustomTextField
                        onChange={handleNominalVoltage}
                        variant="outlined"
                        value={
                            filters.nominalVoltage === -1
                                ? ''
                                : filters.nominalVoltage
                        }
                    />
                </Grid>
            </Grid>

            <Grid container direction="row" spacing={1}>
                <Grid item xs={12} sm={3}>
                    <h3>
                        {' '}
                        <FormattedMessage id="equipmentType" />
                    </h3>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <FormControl>
                        <CustomNativeSelect
                            id="demo-customized-select-native"
                            value={filters.equipmentType}
                            onChange={handleEquipmentType}
                            input={<BootstrapInput />}
                        >
                            {Object.values(EquipmentTypes).map((val) => (
                                <option value={val} key={val}>
                                    {intl.formatMessage({ id: val })}
                                </option>
                            ))}
                        </CustomNativeSelect>
                    </FormControl>
                </Grid>
            </Grid>

            <Grid container direction="row" spacing={1}>
                <Grid item xs={12} sm={3}>
                    <h3>
                        <FormattedMessage id="Countries" />
                    </h3>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <CustomAutocomplete
                        id="select_countries"
                        value={filters.countries}
                        multiple={true}
                        onChange={(event, newValue) => {
                            handleCountrySelection(newValue);
                        }}
                        input={<BootstrapInput />}
                        options={Object.keys(countriesList.object())}
                        style={BootstrapInput.input}
                        getOptionLabel={(code) => countriesList.get(code)}
                        renderInput={(props) => (
                            <TextField {...props} variant="outlined" />
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
                </Grid>
            </Grid>
        </div>
    );
};

export default FiltersEditor;
