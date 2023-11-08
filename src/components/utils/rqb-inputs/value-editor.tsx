/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import { FieldType } from '../../dialogs/filter/expert/expert-filter.type';
import CountryValueEditor from './country-value-editor';
import TranslatedValueEditor from './translated-value-editor';

const ValueEditor = (props: ValueEditorProps) => {
    if (props.field === FieldType.COUNTRY) {
        return <CountryValueEditor {...props} />;
    } else if (props.field === FieldType.ENERGY_SOURCE) {
        return <TranslatedValueEditor {...props} />;
    }
    return <MaterialValueEditor {...props} />;
};
export default ValueEditor;
