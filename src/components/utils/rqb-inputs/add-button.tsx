/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ActionWithRulesAndAddersProps } from 'react-querybuilder';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/ControlPoint';
import { FormattedMessage } from 'react-intl';
import React from 'react';

const AddButton = (props: ActionWithRulesAndAddersProps) => (
    <span>
        <Button
            startIcon={<AddIcon />}
            onClick={props.handleOnClick}
            size={'small'}
            className={'add-button'}
        >
            <FormattedMessage id={props.label} />
        </Button>
    </span>
);

export default AddButton;
