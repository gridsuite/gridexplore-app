/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React, { useMemo } from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import { useIntl } from 'react-intl';

const TranslatedValueEditor = (props: ValueEditorProps) => {
    const intl = useIntl();

    const translatedValues = useMemo(() => {
        return props.values?.map((v) => {
            return {
                name: v.name,
                label: intl.formatMessage({ id: v.label }),
            };
        });
    }, [intl, props.values]);

    return <MaterialValueEditor {...props} values={translatedValues} />;
};
export default TranslatedValueEditor;
