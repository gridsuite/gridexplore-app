/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueEditorProps } from 'react-querybuilder';
import React, { useMemo } from 'react';
import { MaterialValueEditor } from '@react-querybuilder/material';
import { useCountriesListCB } from '../dialog-utils';

const CountryValueEditor = (props: ValueEditorProps) => {
    const countriesListCB = useCountriesListCB();

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
