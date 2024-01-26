/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useMemo } from 'react';
import {
    BETWEEN_RULE,
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
import {
    Generator,
    Load,
    Substation,
    VoltageLevel,
} from '../../../../utils/equipment-types';
import {
    COMBINATOR_OPTIONS,
    EXPERT_FILTER_EQUIPMENTS,
    fields,
    OPERATOR_OPTIONS,
} from './expert-filter-constants';
import yup from '../../../utils/yup-config';
import { FilterType } from '../../../../utils/elementType';
import CustomReactQueryBuilder from '../../../utils/rqb-inputs/custom-react-query-builder';
import { FieldType } from './expert-filter.type';
import { v4 as uuid4 } from 'uuid';
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
                        })
                        .test(BETWEEN_RULE, BETWEEN_RULE, (query) => {
                            return testQuery(
                                BETWEEN_RULE,
                                query as RuleGroupTypeAny
                            );
                        }),
            }),
    }),
};

function isSupportedEquipmentType(equipmentType: string): boolean {
    return Object.values(EXPERT_FILTER_EQUIPMENTS)
        .map((equipments) => equipments.id)
        .includes(equipmentType);
}

const defaultQuery = {
    combinator: COMBINATOR_OPTIONS.AND.name,
    rules: [
        {
            id: uuid4(),
            field: FieldType.ID,
            operator: OPERATOR_OPTIONS.CONTAINS.name,
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

    const openConfirmationPopup = useCallback(() => {
        return (
            formatQuery(getValues(EXPERT_FILTER_QUERY), 'json_without_ids') !==
            formatQuery(defaultQuery, 'json_without_ids')
        );
    }, [getValues]);

    const handleResetOnConfirmation = useCallback(() => {
        setValue(EXPERT_FILTER_QUERY, defaultQuery);
    }, [setValue]);

    const watchEquipmentType = useWatch({
        name: EQUIPMENT_TYPE,
    });

    const translatedFields = useMemo(() => {
        return fields[watchEquipmentType]?.map((field) => {
            return {
                ...field,
                label: intl.formatMessage({ id: field.label }),
            };
        });
    }, [intl, watchEquipmentType]);

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
                    message={'changeTypeMessage'}
                />
            </Grid>
            {watchEquipmentType &&
                isSupportedEquipmentType(watchEquipmentType) && (
                    <CustomReactQueryBuilder
                        name={EXPERT_FILTER_QUERY}
                        fields={translatedFields}
                    />
                )}
        </Grid>
    );
}

export default ExpertFilterForm;
