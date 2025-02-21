/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, yupConfig as yup } from '@gridsuite/commons-ui';
import { ContingencyListType } from '../../../../utils/elementType';

const getExplicitNamingConditionSchema = (schema: yup.ArraySchema<any, any, any, any>) =>
    schema
        .min(1, 'contingencyTableContainAtLeastOneRowError')
        .test(
            'rowWithoutName',
            'contingencyTablePartiallyDefinedError',
            (array) => !array.some((row: any) => !row[FieldConstants.CONTINGENCY_NAME]?.trim())
        )
        .test(
            'rowWithoutEquipments',
            'contingencyTablePartiallyDefinedError',
            (array) => !array.some((row: any) => !row[FieldConstants.EQUIPMENT_IDS]?.length)
        );

const getSchema = () =>
    yup
        .array()
        .of(
            yup.object().shape({
                [FieldConstants.CONTINGENCY_NAME]: yup.string().nullable(),
                [FieldConstants.EQUIPMENT_IDS]: yup.array().of(yup.string().nullable()),
            })
        ) // we remove empty lines
        .compact((row) => !row[FieldConstants.CONTINGENCY_NAME] && !row[FieldConstants.EQUIPMENT_IDS]?.length);

export const getExplicitNamingSchema = () => ({
    [FieldConstants.EQUIPMENT_TABLE]: getSchema().when([FieldConstants.CONTINGENCY_LIST_TYPE], {
        is: ContingencyListType.EXPLICIT_NAMING.id,
        then: (schema) => getExplicitNamingConditionSchema(schema),
    }),
});

export const getExplicitNamingEditSchema = () => {
    return {
        [FieldConstants.EQUIPMENT_TABLE]: getExplicitNamingConditionSchema(getSchema()),
    };
};
