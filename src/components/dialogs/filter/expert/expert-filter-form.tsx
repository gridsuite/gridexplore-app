/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import {
    EMPTY_GROUP,
    EMPTY_RULE,
    EQUIPMENT_TYPE,
    FILTER_TYPE,
    INCORRECT_RULE,
} from '../../../utils/field-constants';
import Grid from '@mui/material/Grid';
import type { RuleGroupTypeAny } from 'react-querybuilder';
import { formatQuery } from 'react-querybuilder';
import './styles-expert-filter.css';
import InputWithPopupConfirmation from '../../../utils/rhf-inputs/select-inputs/input-with-popup-confirmation';
import { SelectInput } from '@gridsuite/commons-ui';
import { useFormContext, useWatch } from 'react-hook-form';
import { testQuery } from './expert-filter-utils';
import { Generator, Load } from '../../../../utils/equipment-types';
import {
    combinatorType,
    EXPERT_FILTER_EQUIPMENTS,
    fields,
    FieldType,
    operatorType as OperatorType,
} from './expert-filter-constants';
import yup from '../../../utils/yup-config';
import { FilterType } from '../../../../utils/elementType';
import CustomReactQueryBuilder from '../../../utils/rqb-inputs/custom-react-query-builder';
import { useIntl } from 'react-intl';

export const EXPERT_FILTER_QUERY = 'rules';

export const expertFilterSchema = {
    [EXPERT_FILTER_QUERY]: yup.object().when([FILTER_TYPE], {
        is: FilterType.EXPERT.id,
        then: (schema) =>
            schema.when([EQUIPMENT_TYPE], {
                is: (equipmentType: string) =>
                    isSupportedEquipmentType(equipmentType),
                then: (schema) =>
                    schema
                        .test(EMPTY_GROUP, EMPTY_GROUP, (query) => {
                            return testQuery(
                                EMPTY_GROUP,
                                query as RuleGroupTypeAny
                            );
                        })
                        .test(EMPTY_RULE, EMPTY_RULE, (query) => {
                            return testQuery(
                                EMPTY_RULE,
                                query as RuleGroupTypeAny
                            );
                        })
                        .test(INCORRECT_RULE, INCORRECT_RULE, (query) => {
                            return testQuery(
                                INCORRECT_RULE,
                                query as RuleGroupTypeAny
                            );
                        }),
            }),
    }),
};

function isSupportedEquipmentType(equipmentType: string): boolean {
    return equipmentType === Generator.type || equipmentType === Load.type;
}

const defaultQuery = {
    combinator: combinatorType.AND.name,
    rules: [
        {
            id: crypto.randomUUID(),
            field: FieldType.ID,
            operator: OperatorType.CONTAINS.name,
            value: '',
        },
    ],
};

export function getExpertFilterEmptyFormData() {
    return {
        [EXPERT_FILTER_QUERY]: defaultQuery,
    };
}

function ExpertFilterForm() {
    const intl = useIntl();

    const { getValues, setValue } = useFormContext();

    const openConfirmationPopup = () => {
        return (
            formatQuery(getValues(EXPERT_FILTER_QUERY), 'json_without_ids') !==
            formatQuery(defaultQuery, 'json_without_ids')
        );
    };

    const handleResetOnConfirmation = () => {
        setValue(EXPERT_FILTER_QUERY, defaultQuery);
    };

    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    return (
        <Grid container item spacing={2}>
            <Grid item xs={12}>
                <InputWithPopupConfirmation
                    Input={SelectInput}
                    name={EQUIPMENT_TYPE}
                    options={Object.values(EXPERT_FILTER_EQUIPMENTS)}
                    label={'equipmentType'}
                    shouldOpenPopup={openConfirmationPopup}
                    resetOnConfirmation={handleResetOnConfirmation}
                />
            </Grid>
            {watchEquipmentType &&
                isSupportedEquipmentType(watchEquipmentType) && (
                    <CustomReactQueryBuilder
                        name={EXPERT_FILTER_QUERY}
                        fields={fields(intl)[watchEquipmentType]}
                    />
                )}
        </Grid>
    );
}

export default ExpertFilterForm;
