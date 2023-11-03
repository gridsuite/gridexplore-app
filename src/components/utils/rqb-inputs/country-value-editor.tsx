/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React, { useCallback, useMemo } from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import { useParameterState } from '../../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../../utils/config-params';
import { getComputedLanguage } from '../../../utils/language';

const CountryValueEditor = (props: ValueEditorProps) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const countriesListCB = useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to English if no localized list is found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);

    const countriesList = useMemo(
        () =>
            Object.keys(countriesListCB().object()).map((country) => {
                return { name: country, label: countriesListCB().get(country) };
            }),
        [countriesListCB]
    );
    return <MaterialValueEditor {...props} values={countriesList} />;
};
export default CountryValueEditor;
