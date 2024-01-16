/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ValueSelectorProps } from 'react-querybuilder';
import React from 'react';
import { MaterialValueSelector } from '@react-querybuilder/material';

const ValueSelector = (props: ValueSelectorProps) => {
    return (
        <MaterialValueSelector
            {...props}
            title={undefined} // disable the tooltip
        />
    );
};
export default ValueSelector;
