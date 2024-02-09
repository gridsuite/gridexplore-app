/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ErrorInput, FieldErrorAlert } from '@gridsuite/commons-ui';
import { Button, Grid, ListItem } from '@mui/material';
import {
    CRITERIA_BASED,
    EQUIPMENT_TYPE,
} from 'components/utils/field-constants';
import { useFieldArray, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Hvdc, Line } from 'utils/equipment-types';
import { FreePropertiesTypes } from './filter-properties';
import FilterProperty, {
    PROPERTY_NAME,
    PROPERTY_VALUES,
    PROPERTY_VALUES_1,
    PROPERTY_VALUES_2,
} from './filter-property';
import AddIcon from '@mui/icons-material/Add';
import { useMemo } from 'react';

interface FilterFreePropertiesProps {
    freePropertiesType: FreePropertiesTypes;
    predefined: Object;
}

function FilterFreeProperties({
    freePropertiesType,
    predefined,
}: FilterFreePropertiesProps) {
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });
    const isForLineOrHvdcLineSubstation =
        (watchEquipmentType === Line.type ||
            watchEquipmentType === Hvdc.type) &&
        freePropertiesType === FreePropertiesTypes.SUBSTATION_FILTER_PROPERTIES;

    const fieldName = `${CRITERIA_BASED}.${freePropertiesType}`;

    const {
        fields: filterProperties, // don't use it to access form data ! check doc,
        append,
        remove,
    } = useFieldArray({
        name: fieldName,
    });

    function addNewProp() {
        if (isForLineOrHvdcLineSubstation) {
            append({
                [PROPERTY_NAME]: null,
                [PROPERTY_VALUES_1]: [],
                [PROPERTY_VALUES_2]: [],
            });
        } else {
            append({ [PROPERTY_NAME]: null, [PROPERTY_VALUES]: [] });
        }
    }

    const valuesFields = isForLineOrHvdcLineSubstation
        ? [
              { name: PROPERTY_VALUES_1, label: 'PropertyValues1' },
              { name: PROPERTY_VALUES_2, label: 'PropertyValues2' },
          ]
        : [{ name: PROPERTY_VALUES, label: 'PropertyValues' }];

    const title = useMemo<string>(() => {
        return freePropertiesType === FreePropertiesTypes.FREE_FILTER_PROPERTIES
            ? 'FreeProps'
            : 'SubstationFreeProps';
    }, [freePropertiesType]);

    return (
        <>
            <Grid item xs={12}>
                <FormattedMessage id={title}>
                    {(title) => <h4>{title}</h4>}
                </FormattedMessage>
            </Grid>
            {filterProperties.map((prop, index) => (
                <ListItem key={prop.id}>
                    <FilterProperty
                        index={index}
                        valuesFields={valuesFields}
                        predefined={predefined}
                        handleDelete={remove}
                        propertyType={freePropertiesType}
                    />
                </ListItem>
            ))}
            <Grid item>
                <Button startIcon={<AddIcon />} onClick={addNewProp}>
                    <FormattedMessage id={'AddFreePropCrit'} />
                </Button>
            </Grid>
            <Grid item>
                <ErrorInput name={fieldName} InputField={FieldErrorAlert} />
            </Grid>
        </>
    );
}

export default FilterFreeProperties;
