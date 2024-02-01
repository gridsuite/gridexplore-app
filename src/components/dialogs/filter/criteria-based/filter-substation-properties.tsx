/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    ErrorInput,
    FieldErrorAlert,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Button, Grid, ListItem } from '@mui/material';
import {
    CRITERIA_BASED,
    EQUIPMENT_TYPE,
} from 'components/utils/field-constants';
import { useFieldArray, useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Hvdc, Line } from 'utils/equipment-types';
import { SUBSTATION_FILTER_PROPERTIES } from './filter-properties';
import FilterProperty, {
    PROPERTY_NAME,
    PROPERTY_VALUES,
    PROPERTY_VALUES_1,
    PROPERTY_VALUES_2,
} from './filter-property';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import { fetchAppsAndUrls } from 'utils/rest-api';

function fetchPredefinedProperties() {
    return fetchAppsAndUrls().then((res) => {
        const studyMetadata = res.find(
            (metadata: any) => metadata.name === 'Study'
        );
        if (!studyMetadata) {
            return Promise.reject(
                'Study entry could not be found in metadatas'
            );
        }

        return studyMetadata?.predefinedEquipmentProperties?.substation;
    });
}

function FilterSubstationProperties() {
    const { snackError } = useSnackMessage();

    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });
    const isForLineOrHvdcLine =
        watchEquipmentType === Line.type || watchEquipmentType === Hvdc.type;

    const fieldName = `${CRITERIA_BASED}.${SUBSTATION_FILTER_PROPERTIES}`;

    const [fieldProps, setFieldProps] = useState({});

    useEffect(() => {
        fetchPredefinedProperties()
            .then((p) => setFieldProps(p))
            .catch((error) => {
                snackError({
                    messageTxt: error.message ?? error,
                });
            });
    }, [snackError]);

    const {
        fields: filterProperties, // don't use it to access form data ! check doc,
        append,
        remove,
    } = useFieldArray({
        name: fieldName,
    });

    function addNewProp() {
        if (isForLineOrHvdcLine) {
            append({
                [PROPERTY_NAME]: null,
                [PROPERTY_VALUES_1]: [],
                [PROPERTY_VALUES_2]: [],
            });
        } else {
            append({ [PROPERTY_NAME]: null, [PROPERTY_VALUES]: [] });
        }
    }

    const valuesFields = isForLineOrHvdcLine
        ? [
              { name: PROPERTY_VALUES_1, label: 'PropertyValues1' },
              { name: PROPERTY_VALUES_2, label: 'PropertyValues2' },
          ]
        : [{ name: PROPERTY_VALUES, label: 'PropertyValues' }];

    return (
        <>
            <Grid item xs={12}>
                <FormattedMessage id={'SubstationFreeProps'}>
                    {(txt) => <h4>{txt}</h4>}
                </FormattedMessage>
            </Grid>
            {filterProperties.map((prop, index) => (
                <ListItem key={prop.id}>
                    <FilterProperty
                        index={index}
                        valuesFields={valuesFields}
                        predefined={fieldProps}
                        handleDelete={remove}
                        propertyType={SUBSTATION_FILTER_PROPERTIES}
                    />
                </ListItem>
            ))}
            <Grid item>
                <Button fullWidth startIcon={<AddIcon />} onClick={addNewProp}>
                    <FormattedMessage id={'AddFreePropCrit'} />
                </Button>
            </Grid>
            <Grid item>
                <ErrorInput name={fieldName} InputField={FieldErrorAlert} />
            </Grid>
        </>
    );
}

export default FilterSubstationProperties;
