/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import {
    FieldType,
    OperatorType,
} from '../../dialogs/filter/expert/expert-filter.type';
import CountryValueEditor from './country-value-editor';
import TranslatedValueEditor from './translated-value-editor';
import TextValueEditor from './text-value-editor';

const ValueEditor = (props: ValueEditorProps) => {
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
    if (props.field === FieldType.ID || props.field === FieldType.NAME) {
        return <TextValueEditor {...props} />;
    }
    return (
        <MaterialValueEditor
            {...props}
            title={undefined} // disable the tooltip
        />
    );
};
export default ValueEditor;
