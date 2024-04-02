/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Grid from '@mui/material/Grid';
import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { FilterType } from '../../../../utils/elementType';
import {
    Hvdc,
    Line,
    Load,
    Substation,
} from '../../../../utils/equipment-types';
import { areArrayElementsUnique } from '../../../../utils/functions';
import { EQUIPMENT_TYPE, FILTER_TYPE } from '../../../utils/field-constants';
import yup from '../../../utils/yup-config';
import FilterFreeProperties from './filter-free-properties';
import {
    PROPERTY_NAME,
    PROPERTY_VALUES,
    PROPERTY_VALUES_1,
    PROPERTY_VALUES_2,
} from './filter-property';
import { usePredefinedProperties } from '../../../../hooks/predefined-properties-hook';

export enum FreePropertiesTypes {
    SUBSTATION_FILTER_PROPERTIES = 'substationFreeProperties',
    FREE_FILTER_PROPERTIES = 'freeProperties',
}

function propertyValuesTest(
    values: (string | undefined)[] | undefined,
    context: yup.TestContext<yup.AnyObject>,
    doublePropertyValues: boolean
) {
    // with context.from[length - 1], we can access to the root fields of the form
    const rootLevelForm = context.from![context.from!.length - 1];
    const filterType = rootLevelForm.value[FILTER_TYPE];
    if (filterType !== FilterType.CRITERIA_BASED.id) {
        // we don't test if we are not in a criteria based form
        return true;
    }
    const equipmentType = rootLevelForm.value[EQUIPMENT_TYPE];
    const isForLineOrHvdcLine =
        equipmentType === Line.type || equipmentType === Hvdc.type;
    if (doublePropertyValues) {
        return isForLineOrHvdcLine ? values?.length! > 0 : true;
    } else {
        return isForLineOrHvdcLine ? true : values?.length! > 0;
    }
}

export const filterPropertiesYupSchema = {
    [FreePropertiesTypes.SUBSTATION_FILTER_PROPERTIES]: yup
        .array()
        .of(
            yup.object().shape({
                [PROPERTY_NAME]: yup.string().required(),
                [PROPERTY_VALUES]: yup
                    .array()
                    .of(yup.string())
                    .test(
                        'can not be empty if not line',
                        'YupRequired',
                        (values, context) =>
                            propertyValuesTest(values, context, false)
                    ),
                [PROPERTY_VALUES_1]: yup
                    .array()
                    .of(yup.string())
                    .test(
                        'can not be empty if line',
                        'YupRequired',
                        (values, context) =>
                            propertyValuesTest(values, context, true)
                    ),
                [PROPERTY_VALUES_2]: yup
                    .array()
                    .of(yup.string())
                    .test(
                        'can not be empty if line',
                        'YupRequired',
                        (values, context) =>
                            propertyValuesTest(values, context, true)
                    ),
            })
        )
        .test(
            'distinct names',
            'filterPropertiesNameUniquenessError',
            (properties, context) => {
                // with context.from[length - 1], we can access to the root fields of the form
                const rootLevelForm = context.from![context.from!.length - 1];
                const filterType = rootLevelForm.value[FILTER_TYPE];
                if (filterType !== FilterType.CRITERIA_BASED.id) {
                    // we don't test if we are not in a criteria based form
                    return true;
                }
                const names = properties! // never null / undefined
                    .filter((prop) => !!prop[PROPERTY_NAME])
                    .map((prop) => prop[PROPERTY_NAME]);
                return areArrayElementsUnique(names);
            }
        ),
    [FreePropertiesTypes.FREE_FILTER_PROPERTIES]: yup
        .array()
        .of(
            yup.object().shape({
                [PROPERTY_NAME]: yup.string().required(),
                [PROPERTY_VALUES]: yup
                    .array()
                    .of(yup.string())
                    .test(
                        'can not be empty if not line',
                        'YupRequired',
                        (values, context) =>
                            propertyValuesTest(values, context, false)
                    ),
            })
        )
        .test(
            'distinct names',
            'filterPropertiesNameUniquenessError',
            (properties, context) => {
                // with context.from[length - 1], we can access to the root fields of the form
                const rootLevelForm = context.from![context.from!.length - 1];
                const filterType = rootLevelForm.value[FILTER_TYPE];
                if (filterType !== FilterType.CRITERIA_BASED.id) {
                    // we don't test if we are not in a criteria based form
                    return true;
                }
                const names = properties! // never null / undefined
                    .filter((prop) => !!prop[PROPERTY_NAME])
                    .map((prop) => prop[PROPERTY_NAME]);
                return areArrayElementsUnique(names);
            }
        ),
};

function FilterProperties() {
    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });
    const [equipmentPredefinedProps, setEquipmentType] =
        usePredefinedProperties(watchEquipmentType);
    const [substationPredefinedProps, setSubstationType] =
        usePredefinedProperties(null);

    const displayEquipmentProperties = useMemo(() => {
        return (
            watchEquipmentType === Substation.type ||
            watchEquipmentType === Load.type
        );
    }, [watchEquipmentType]);

    const displaySubstationProperties = useMemo(() => {
        return (
            watchEquipmentType !== Substation.type &&
            watchEquipmentType !== null
        );
    }, [watchEquipmentType]);

    useEffect(() => {
        if (displayEquipmentProperties) {
            setEquipmentType(watchEquipmentType);
        }
    }, [displayEquipmentProperties, watchEquipmentType, setEquipmentType]);

    useEffect(() => {
        if (displaySubstationProperties) {
            setSubstationType(Substation.type);
        }
    }, [displaySubstationProperties, setSubstationType]);

    return (
        watchEquipmentType && (
            <Grid item container spacing={1}>
                <Grid item xs={12}>
                    <FormattedMessage id={'FreePropsCrit'}>
                        {(txt) => <h3>{txt}</h3>}
                    </FormattedMessage>
                    {displayEquipmentProperties && (
                        <FilterFreeProperties
                            freePropertiesType={
                                FreePropertiesTypes.FREE_FILTER_PROPERTIES
                            }
                            predefined={equipmentPredefinedProps}
                        />
                    )}
                    {displaySubstationProperties && (
                        <FilterFreeProperties
                            freePropertiesType={
                                FreePropertiesTypes.SUBSTATION_FILTER_PROPERTIES
                            }
                            predefined={substationPredefinedProps}
                        />
                    )}
                </Grid>
            </Grid>
        )
    );
}

export default FilterProperties;
