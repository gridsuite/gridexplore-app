/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import { useFormContext } from 'react-hook-form';
import { AutocompleteInput } from '@gridsuite/commons-ui';
import MultipleAutocompleteInput from '../rhf-inputs/autocomplete-inputs/multiple-autocomplete-input';
import { usePredefinedProperties } from '../../../hooks/predefined-properties-hook';
import {
    PROPERTY_NAME,
    PROPERTY_VALUES,
} from '../../dialogs/filter/criteria-based/filter-property';

interface ExpertFilterPropertyProps {
    name: string;
    equipmentTypes: string[];
    onChange: (name: string, values: string[]) => void;
    defaultValue?: any;
}

function PropertyValueEditor(props: ExpertFilterPropertyProps) {
    const { setValue, getValues } = useFormContext();
    const [propertyName, setPropertyName] = useState('');

    const [equipmentPredefinedProps, setEquipmentType] =
        usePredefinedProperties(props.equipmentTypes[0]);

    useEffect(() => {
        if (props.defaultValue) {
            setValue(
                `${props.name}_` + PROPERTY_NAME,
                props.defaultValue.propertyName
            );
            setValue(
                `${props.name}_` + PROPERTY_VALUES,
                props.defaultValue.propertyValues
            );
        }
    }, [props, setValue]);

    useEffect(() => {
        setEquipmentType(props.equipmentTypes[0]);
    }, [props.equipmentTypes, setEquipmentType]);

    const predefinedNames = useMemo(() => {
        return Object.keys(equipmentPredefinedProps ?? []).sort();
    }, [equipmentPredefinedProps]);

    const predefinedValues = useMemo(() => {
        const predefinedForName: string[] =
            equipmentPredefinedProps?.[propertyName];

        if (!predefinedForName) {
            return [];
        }
        return [...new Set(predefinedForName)].sort();
    }, [equipmentPredefinedProps, propertyName]);

    // We reset values when name change
    const onNameChange = useCallback(
        (value: string) => {
            setPropertyName(value);
            setValue(`${props.name}_` + PROPERTY_VALUES, []);
        },
        [setValue, setPropertyName, props]
    );

    const onValuesChange = useCallback(() => {
        props.onChange &&
            props.onChange(
                getValues(`${props.name}_` + PROPERTY_NAME),
                getValues(`${props.name}_` + PROPERTY_VALUES)
            );
    }, [getValues, props]);

    return (
        <Grid container item spacing={1} columns={50}>
            <Grid item xs={30}>
                <AutocompleteInput
                    name={`${props.name}_` + PROPERTY_NAME}
                    inputTransform={(value) => (!value ? '' : value)}
                    options={predefinedNames}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    onInputChange={(event: any, value: any) => {
                        onNameChange(value);
                    }}
                />
            </Grid>
            <Grid item xs={20} key={propertyName}>
                <MultipleAutocompleteInput
                    name={`${props.name}_` + PROPERTY_VALUES}
                    options={predefinedValues}
                    onBlur={onValuesChange}
                />
            </Grid>
        </Grid>
    );
}

export default PropertyValueEditor;
