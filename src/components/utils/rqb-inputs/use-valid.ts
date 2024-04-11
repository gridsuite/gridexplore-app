/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValidationResult, ValueEditorProps } from 'react-querybuilder';

/**
 * Hook that return if a field of RQB is valid or not
 */
const useValid = ({ validation }: ValueEditorProps) => {
    if (validation === undefined || validation === null) {
        return true;
    }
    if (typeof validation === 'boolean') {
        return validation;
    }
    const convertedValidation = validation as ValidationResult;
    return convertedValidation.valid;
};

export default useValid;
