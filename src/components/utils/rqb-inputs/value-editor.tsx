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
import { ENERGY_SOURCE_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';
import { useIntl } from 'react-intl';
import CountryValueEditor from './country-value-editor';

const ValueEditor = (props: ValueEditorProps) => {
    const intl = useIntl();

    if (props.field === FieldType.COUNTRY) {
        return <CountryValueEditor {...props} />;
    } else if (props.field === FieldType.ENERGY_SOURCE) {
        return (
            <MaterialValueEditor
                {...props}
                values={ENERGY_SOURCE_OPTIONS.map((v) => {
                    return {
                        name: v.name,
                        label: intl.formatMessage({ id: v.label }),
                    };
                })}
            />
        );
    }
    return <MaterialValueEditor {...props} />;
};
export default ValueEditor;
