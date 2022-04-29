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
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { EquipmentTypes } from '../../utils/equipment-types';
import { FormattedMessage, useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import { Chip, Grid, InputLabel, MenuItem } from '@mui/material';

const useStyles = makeStyles((theme) => {
    console.log(theme);
    return {
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
    };
});

const CustomTextField = withStyles(() => ({
    root: {
        width: '90%',
    },
}))(TextField);

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
        countriesList = require('localized-countries')(
            require('localized-countries/data/en')
        );
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

    const nominalVoltageOperators = ['=', '>', '>=', '<', '<='];

    return (
        <>
            <CustomTextField
                margin="dense"
                label={<FormattedMessage id="equipmentID" />}
                onChange={handleEquipmentID}
                value={filters.equipmentID}
            />
            <CustomTextField
                margin="dense"
                label={<FormattedMessage id="equipmentName" />}
                onChange={handleEquipmentName}
                value={filters.equipmentName}
            />
            <FormControl fullWidth margin="dense">
                <InputLabel className={classes.inputLegend}>
                    <FormattedMessage id="nominalVoltage" />
                </InputLabel>
                <Grid>
                    <Select
                        style={{ width: '15%', borderRadius: '4px 0 0 4px' }}
                        value={filters.nominalVoltageOperator}
                        onChange={handleOperator}
                    >
                        {nominalVoltageOperators.map((operator) => (
                            <MenuItem key={operator} value={operator}>
                                {operator}
                            </MenuItem>
                        ))}
                    </Select>
                    <TextField
                        style={{ width: '75%' }}
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
            </FormControl>
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

            <FormControl fullWidth margin="dense">
                <Autocomplete
                    id="select_countries"
                    value={filters.countries}
                    multiple={true}
                    onChange={(event, newValue) => {
                        handleCountrySelection(newValue);
                    }}
                    options={Object.keys(countriesList.object())}
                    getOptionLabel={(code) => countriesList.get(code)}
                    renderInput={(props) => (
                        <CustomTextField
                            label={<FormattedMessage id="Countries" />}
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

export default FiltersEditor;
