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
import { FilterType } from '../../../utils/elementType';
import { ElementType } from '@gridsuite/commons-ui';
import { EQUIPMENT_TYPE, FILTER_UUID } from '../field-constants';
import { useFormContext } from 'react-hook-form';
import { Substation, VoltageLevel } from '../../../utils/equipment-types';
import PropertyValueEditor from './property-value-editor';

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
                    // we do not authorize to use an expert filter in the rules of
                    // another expert filter, to prevent potential cycle problems
                    value?.specificMetadata?.type !== FilterType.EXPERT.id &&
                    ((props.field === FieldType.ID &&
                        value?.specificMetadata?.equipmentType ===
                            getValues(EQUIPMENT_TYPE)) ||
                        ((props.field === FieldType.VOLTAGE_LEVEL_ID ||
                            props.field === FieldType.VOLTAGE_LEVEL_ID_1 ||
                            props.field === FieldType.VOLTAGE_LEVEL_ID_2) &&
                            value?.specificMetadata?.equipmentType ===
                                VoltageLevel.type))
                );
            }
            return true;
        },
        [props.field, getValues]
    );

    if (
        props.operator === OperatorType.EXISTS ||
        props.operator === OperatorType.NOT_EXISTS
    ) {
        // No value needed for these operators
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
        props.field === FieldType.SHUNT_COMPENSATOR_TYPE ||
        props.field === FieldType.LOAD_TYPE ||
        props.field === FieldType.RATIO_REGULATION_MODE ||
        props.field === FieldType.PHASE_REGULATION_MODE
    ) {
        return <TranslatedValueEditor {...props} />;
    }
    if (
        props.operator === OperatorType.IS_PART_OF ||
        props.operator === OperatorType.IS_NOT_PART_OF
    ) {
        let equipmentTypes;
        if (
            props.field === FieldType.VOLTAGE_LEVEL_ID ||
            props.field === FieldType.VOLTAGE_LEVEL_ID_1 ||
            props.field === FieldType.VOLTAGE_LEVEL_ID_2
        ) {
            equipmentTypes = [VoltageLevel.type];
        } else if (props.field === FieldType.ID) {
            equipmentTypes = [getValues(EQUIPMENT_TYPE)];
        }

        return (
            <ElementValueEditor
                name={FILTER_UUID + props.rule.id}
                elementType={ElementType.FILTER}
                equipmentTypes={equipmentTypes}
                titleId="selectFilterDialogTitle"
                hideErrorMessage={true}
                onChange={(e: any) => {
                    props.handleOnChange(e.map((v: any) => v.id));
                }}
                itemFilter={itemFilter}
                defaultValue={props.value}
            />
        );
    } else if (
        props.field === FieldType.ID ||
        props.field === FieldType.NAME ||
        props.field === FieldType.VOLTAGE_LEVEL_ID ||
        props.field === FieldType.VOLTAGE_LEVEL_ID_1 ||
        props.field === FieldType.VOLTAGE_LEVEL_ID_2
    ) {
        return <TextValueEditor {...props} />;
    } else if (
        props.field === FieldType.PROPERTY ||
        props.field === FieldType.SUBSTATION_PROPERTY ||
        props.field === FieldType.SUBSTATION_PROPERTY_1 ||
        props.field === FieldType.SUBSTATION_PROPERTY_2
    ) {
        let equipmentType;
        if (
            props.field === FieldType.SUBSTATION_PROPERTY ||
            props.field === FieldType.SUBSTATION_PROPERTY_1 ||
            props.field === FieldType.SUBSTATION_PROPERTY_2
        ) {
            equipmentType = Substation.type;
        } else {
            equipmentType = getValues(EQUIPMENT_TYPE);
        }

        return (
            <PropertyValueEditor
                equipmentType={equipmentType}
                valueEditorProps={props}
            />
        );
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
