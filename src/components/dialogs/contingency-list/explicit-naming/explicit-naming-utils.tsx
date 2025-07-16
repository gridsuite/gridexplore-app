/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FieldConstants, yupConfig as yup } from '@gridsuite/commons-ui';
import { ContingencyListType } from '../../../../utils/elementType';
import { SideActionProps } from '../../../utils/rhf-inputs/ag-grid-table-rhf/cell-editors/chips-array-editor';

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

export const manageContingencyName = ({ ...props }: SideActionProps) => {
    const { api, node } = props;
    if (api && node && node.data && node.data[FieldConstants.EQUIPMENT_IDS]) {
        const [first, ...others] = node.data[FieldConstants.EQUIPMENT_IDS] as String[];
        if (
            node.displayed && // to prevent error trace in console when deleting the row
            first &&
            (node.data[FieldConstants.CONTINGENCY_NAME] == null ||
                node.data[FieldConstants.CONTINGENCY_NAME] === '' ||
                (node.data[FieldConstants.CONTINGENCY_NAME] != null &&
                    node.data[FieldConstants.CONTINGENCY_NAME].startsWith(first)))
        ) {
            // define the first equipment id as default equipment name
            const suffix = others.length > 0 ? '...' : '';
            node.data[FieldConstants.CONTINGENCY_NAME] = first + suffix;
            api.applyTransaction({ update: [node.data] });
        }
    }
};
