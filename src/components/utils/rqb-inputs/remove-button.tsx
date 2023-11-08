/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ActionWithRulesProps } from 'react-querybuilder';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';

const RemoveButton = (props: ActionWithRulesProps) => {
    return (
        <IconButton
            size={'small'}
            onClick={props.handleOnClick}
            className={props.className}
        >
            <DeleteIcon />
        </IconButton>
    );
};

export default RemoveButton;
