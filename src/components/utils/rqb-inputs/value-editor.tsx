/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React, { useCallback } from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import {
    FieldType,
    OperatorType,
} from '../../dialogs/filter/expert/expert-filter.type';
import CountryValueEditor from './country-value-editor';
import TranslatedValueEditor from './translated-value-editor';
import TextValueEditor from './text-value-editor';
import Box from '@mui/material/Box';
import ElementValueEditor from './element-value-editor';
import { ElementType, FilterType } from '../../../utils/elementType';
import { EQUIPMENT_TYPE, FILTER_UUID } from '../field-constants';
import { useFormContext } from 'react-hook-form';
import { VoltageLevel } from '../../../utils/equipment-types';

const styles = {
    noArrows: {
        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button':
            {
                display: 'none',
            },
        '& input[type=number]': {
            MozAppearance: 'textfield',
        },
    },
};

const ValueEditor = (props: ValueEditorProps) => {
    const formContext = useFormContext();
    const { getValues } = formContext;

    const itemFilter = useCallback(
        (value: any) => {
            if (value?.type === ElementType.FILTER) {
                return (
                    value?.specificMetadata?.type !== FilterType.EXPERT.id &&
                    ((props.field === FieldType.ID &&
                        value?.specificMetadata?.equipmentType ===
                            getValues(EQUIPMENT_TYPE)) ||
                        (props.field === FieldType.VOLTAGE_LEVEL_ID &&
                            value?.specificMetadata?.equipmentType ===
                                VoltageLevel.type))
                );
            }
            return true;
        },
        [props.field, getValues]
    );

    if (props.operator === OperatorType.EXISTS) {
        // No value needed for this operator
        return null;
    }
    if (
        [FieldType.COUNTRY, FieldType.COUNTRY_1, FieldType.COUNTRY_2].includes(
            props.field as FieldType
        )
    ) {
        return <CountryValueEditor {...props} />;
    }
    if (
        props.field === FieldType.ENERGY_SOURCE ||
        props.field === FieldType.SHUNT_COMPENSATOR_TYPE
    ) {
        return <TranslatedValueEditor {...props} />;
    }
    if (
        props.operator === OperatorType.IS_PART_OF ||
        props.operator === OperatorType.IS_NOT_PART_OF
    ) {
        return (
            <ElementValueEditor
                name={FILTER_UUID + props.rule.id}
                elementType={ElementType.FILTER}
                titleId="selectFilterDialogTitle"
                hideErrorMessage={true}
                onChange={(e: any) => {
                    props.handleOnChange(e.map((v: any) => v.id));
                }}
                itemFilter={itemFilter}
                defaultValue={props.value}
            />
        );
    }
    if (
        (props.field === FieldType.ID || props.field === FieldType.NAME) &&
        props.operator !== OperatorType.IS_PART_OF &&
        props.operator !== OperatorType.IS_NOT_PART_OF
    ) {
        return <TextValueEditor {...props} />;
    }
    return (
        <Box sx={props.inputType === 'number' ? styles.noArrows : undefined}>
            <MaterialValueEditor
                {...props}
                title={undefined} // disable the tooltip
            />
        </Box>
    );
};
export default ValueEditor;
