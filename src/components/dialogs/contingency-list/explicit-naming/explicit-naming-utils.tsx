/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { type IntlShape } from 'react-intl';
import * as yup from 'yup';
import type { ArraySchema } from 'yup';
import { FieldConstants } from '@gridsuite/commons-ui';
import { ContingencyListType } from '../../../../utils/elementType';

function getExplicitNamingConditionSchema(intl: IntlShape, schema: ArraySchema<any, any, any, any>) {
    return schema
        .min(1, 'contingencyTableContainAtLeastOneRowError')
        .test(
            'rowWithoutName',
            intl.formatMessage({ id: 'contingencyTablePartiallyDefinedError' }),
            (array) => !array.some((row: any) => !row[FieldConstants.CONTINGENCY_NAME]?.trim())
        )
        .test(
            'rowWithoutEquipments',
            intl.formatMessage({ id: 'contingencyTablePartiallyDefinedError' }),
            (array) => !array.some((row: any) => !row[FieldConstants.EQUIPMENT_IDS]?.length)
        );
}

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

export function getExplicitNamingSchema(intl: IntlShape) {
    return {
        [FieldConstants.EQUIPMENT_TABLE]: getSchema().when([FieldConstants.CONTINGENCY_LIST_TYPE], {
            is: ContingencyListType.EXPLICIT_NAMING.id,
            then: (schema) => getExplicitNamingConditionSchema(intl, schema),
        }),
    };
}

export function getExplicitNamingEditSchema(intl: IntlShape) {
    return {
        [FieldConstants.EQUIPMENT_TABLE]: getExplicitNamingConditionSchema(intl, getSchema()),
    };
}
