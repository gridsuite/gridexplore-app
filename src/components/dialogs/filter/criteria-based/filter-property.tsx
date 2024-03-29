/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useMemo } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import { useFormContext, useWatch } from 'react-hook-form';
import { CRITERIA_BASED } from '../../../utils/field-constants';
import { AutocompleteInput } from '@gridsuite/commons-ui';
import MultipleAutocompleteInput from '../../../utils/rhf-inputs/autocomplete-inputs/multiple-autocomplete-input';

export const PROPERTY_NAME = 'name_property';
export const PROPERTY_VALUES = 'prop_values';
export const PROPERTY_VALUES_1 = 'prop_values1';
export const PROPERTY_VALUES_2 = 'prop_values2';

interface FilterPropertyProps {
    index: number;
    valuesFields: Array<{ name: string; label: string }>;
    handleDelete: (index: number) => void;
    predefined: any;
    propertyType: string;
}

function FilterProperty(props: FilterPropertyProps) {
    const { setValue } = useFormContext();

    const watchName = useWatch({
        name: `${CRITERIA_BASED}.${props.propertyType}[${props.index}].${PROPERTY_NAME}`,
    });

    const predefinedNames = useMemo(() => {
        return Object.keys(props.predefined ?? []).sort();
    }, [props.predefined]);

    const predefinedValues = useMemo(() => {
        const predefinedForName: string[] = props.predefined?.[watchName];
        if (!predefinedForName) {
            return [];
        }
        return [...new Set(predefinedForName)].sort();
    }, [watchName, props.predefined]);

    // We reset values when name change
    const onNameChange = useCallback(() => {
        props.valuesFields.forEach((valuesField) =>
            setValue(
                `${CRITERIA_BASED}.${props.propertyType}[${props.index}].${valuesField.name}`,
                []
            )
        );
    }, [setValue, props.index, props.valuesFields, props.propertyType]);

    return (
        <Grid container item spacing={1} columns={21}>
            <Grid item xs={6}>
                <AutocompleteInput
                    name={`${CRITERIA_BASED}.${props.propertyType}[${props.index}].${PROPERTY_NAME}`}
                    label={'PropertyName'}
                    options={predefinedNames}
                    freeSolo
                    autoSelect
                    forcePopupIcon
                    onChangeCallback={onNameChange}
                />
            </Grid>
            {props.valuesFields.map((valuesField) => (
                <Grid item xs key={valuesField.name}>
                    <MultipleAutocompleteInput
                        name={`${CRITERIA_BASED}.${props.propertyType}[${props.index}].${valuesField.name}`}
                        label={valuesField.label}
                        options={predefinedValues}
                    />
                </Grid>
            ))}
            <Grid item xs={1} alignSelf="center">
                <IconButton onClick={() => props.handleDelete(props.index)}>
                    <DeleteIcon />
                </IconButton>
            </Grid>
        </Grid>
    );
}

export default FilterProperty;
