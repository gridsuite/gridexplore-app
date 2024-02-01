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
import AddIcon from '@mui/icons-material/Add';
import { Button, Grid, ListItem } from '@mui/material';
import { CRITERIA_BASED } from 'components/utils/field-constants';
import { useEffect, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { fetchAppsAndUrls } from 'utils/rest-api';
import { FREE_FILTER_PROPERTIES } from './filter-properties';
import FilterProperty, {
    PROPERTY_NAME,
    PROPERTY_VALUES,
} from './filter-property';

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

function FilterFreeProperties() {
    const { snackError } = useSnackMessage();
    const fieldName = `${CRITERIA_BASED}.${FREE_FILTER_PROPERTIES}`;

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
        append({ [PROPERTY_NAME]: null, [PROPERTY_VALUES]: [] });
    }

    const valuesFields = [{ name: PROPERTY_VALUES, label: 'PropertyValues' }];

    return (
        <>
            {filterProperties.map((prop, index) => (
                <ListItem key={prop.id}>
                    <FilterProperty
                        index={index}
                        valuesFields={valuesFields}
                        predefined={fieldProps}
                        handleDelete={remove}
                        propertyType={FREE_FILTER_PROPERTIES}
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

export default FilterFreeProperties;
