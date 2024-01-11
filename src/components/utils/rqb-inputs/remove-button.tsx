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
import { useController } from 'react-hook-form';
import { EXPERT_FILTER_QUERY } from '../../dialogs/filter/expert/expert-filter-form';
import {
    countRules,
    recursiveRemove,
} from '../../dialogs/filter/expert/expert-filter-utils';

const RemoveButton = (props: ActionWithRulesProps) => {
    const {
        field: { value: query, onChange },
    } = useController({ name: EXPERT_FILTER_QUERY });

    function handleDelete(e: React.MouseEvent<Element, MouseEvent>) {
        // We don't want groups with no rules
        // So if we have only empty subgroups above the removed rule, we want to remove all of them
        onChange(recursiveRemove(query, props.path));
    }

    return (
        <IconButton
            size={'small'}
            onClick={handleDelete}
            className={props.className}
        >
            {countRules(query) > 1 && <DeleteIcon />}
        </IconButton>
    );
};

export default RemoveButton;
