/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import { usePredefinedProperties } from '../../../hooks/predefined-properties-hook';
import { Autocomplete, MenuItem, Select, TextField } from '@mui/material';
import { ValueEditorProps } from 'react-querybuilder';
import useValid from './use-valid';
import { useIntl } from 'react-intl';

import {
    PROPERTY_NAME,
    PROPERTY_OPERATOR,
    PROPERTY_VALUES,
} from '../field-constants';
import { OPERATOR_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';

const PROPERTY_VALUE_OPERATORS = [OPERATOR_OPTIONS.IN];

interface ExpertFilterPropertyProps {
    equipmentType: string;
    valueEditorProps: ValueEditorProps;
}

function PropertyValueEditor(props: ExpertFilterPropertyProps) {
    const { equipmentType, valueEditorProps } = props;
    const valid = useValid(valueEditorProps);
    const intl = useIntl();

    const { propertyName, propertyOperator, propertyValues } =
        valueEditorProps?.value ?? {};

    const [equipmentPredefinedProps, setEquipmentType] =
        usePredefinedProperties(equipmentType);

    useEffect(() => {
        setEquipmentType(equipmentType);
    }, [equipmentType, setEquipmentType]);

    const predefinedNames = useMemo(() => {
        return Object.keys(equipmentPredefinedProps ?? {}).sort();
    }, [equipmentPredefinedProps]);

    const predefinedValues = useMemo(() => {
        const predefinedForName: string[] =
            equipmentPredefinedProps?.[propertyName];

        if (!predefinedForName) {
            return [];
        }
        return [...new Set(predefinedForName)].sort();
    }, [equipmentPredefinedProps, propertyName]);

    const onChange = useCallback(
        (field: string, value: any) => {
            let updatedValue = {
                ...valueEditorProps?.value,
                [PROPERTY_OPERATOR]:
                    valueEditorProps?.value?.propertyOperator ??
                    PROPERTY_VALUE_OPERATORS[0].customName,
                [field]: value,
            };
            // Reset the property values when the property name changes
            if (field === PROPERTY_NAME) {
                updatedValue = {
                    ...updatedValue,
                    [PROPERTY_VALUES]: [],
                };
            }
            valueEditorProps?.handleOnChange?.(updatedValue);
        },
        [valueEditorProps]
    );

    return (
        <Grid container item spacing={1}>
            <Grid item xs={5}>
                <Autocomplete
                    value={propertyName ?? ''}
                    options={predefinedNames}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    renderInput={(params) => (
                        <TextField {...params} error={!valid} />
                    )}
                    onChange={(event, value: any) => {
                        onChange(PROPERTY_NAME, value);
                    }}
                />
            </Grid>
            <Grid item xs={2.5}>
                <Select
                    value={
                        propertyOperator ??
                        PROPERTY_VALUE_OPERATORS[0].customName
                    }
                    size={'medium'}
                    error={!valid}
                    onChange={(event, value: any) => {
                        onChange(PROPERTY_OPERATOR, value);
                    }}
                >
                    {Object.values(PROPERTY_VALUE_OPERATORS).map((operator) => (
                        <MenuItem
                            key={operator.customName}
                            value={operator.customName}
                        >
                            {intl.formatMessage({ id: operator.label })}
                        </MenuItem>
                    ))}
                </Select>
            </Grid>
            <Grid item xs={4.5}>
                <Autocomplete
                    value={propertyValues ?? []}
                    options={predefinedValues ?? []}
                    multiple
                    renderInput={(params) => (
                        <TextField {...params} error={!valid} />
                    )}
                    freeSolo
                    autoSelect
                    onChange={(event, value: any) => {
                        onChange(PROPERTY_VALUES, value);
                    }}
                />
            </Grid>
        </Grid>
    );
}

export default PropertyValueEditor;
