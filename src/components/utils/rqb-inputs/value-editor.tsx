/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import { useParameterState } from '../../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../../utils/config-params';
import React, { useCallback, useMemo } from 'react';
import { getComputedLanguage } from '../../../utils/language';
import { FieldType } from '../../dialogs/filter/expert/expert-filter-constants';
import { MaterialValueEditor } from '@react-querybuilder/material';

const ValueEditor = (props: ValueEditorProps) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const countriesListCB = useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to english if no localised list found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);

    const countriesList = useMemo(() => countriesListCB(), [countriesListCB]);

    function getValues() {
        return Object.keys(countriesList.object()).map((country) => {
            return { name: country, label: countriesList.get(country) };
        });
    }

    if (props.field === FieldType.COUNTRY) {
        return (
            <MaterialValueEditor
                {...props}
                values={getValues()}
                handleOnChange={props.handleOnChange}
            />
        );
    }
    return <MaterialValueEditor {...props} />;
};
export default ValueEditor;
