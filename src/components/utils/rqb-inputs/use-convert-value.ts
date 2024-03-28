/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { OPERATOR_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';
import { ValueEditorProps } from 'react-querybuilder';

/**
 * Hook that convert a value of RQB from any to any[] and vice versa when the operator changes
 * PS : can be extended to manage more than the IN operator
 * PS 2 : don't use this if the operator can be another array operator (like BETWEEN) or change a bit the conditions
 */
const useConvertValue = ({
    operator,
    value,
    fieldData: { defaultValue },
    handleOnChange,
}: ValueEditorProps) => {
    useEffect(
        () => {
            if (
                operator === OPERATOR_OPTIONS.IN.name &&
                !Array.isArray(value)
            ) {
                handleOnChange(value ? [value] : []);
            } else if (
                operator !== OPERATOR_OPTIONS.IN.name &&
                Array.isArray(value)
            ) {
                handleOnChange(value.length ? value[0] : defaultValue);
            }
        },
        // We want to trigger this useEffect only if the operator change
        // eslint-disable-next-line
        [operator]
    );
};

export default useConvertValue;
