/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { DirectoryItemSelector } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { ElementType } from '../../utils/elementType';
import {
    fetchDirectoryContent,
    fetchElementsInfos,
    fetchRootFolders,
} from '../../utils/rest-api';

const MoveDialog = ({ open, onClose, items }) => {
    const intl = useIntl();

    return (
        <DirectoryItemSelector
            open={open}
            onClose={onClose}
            types={[ElementType.DIRECTORY]}
            onlyLeaves={false}
            multiselect={false}
            validationButtonText={intl.formatMessage(
                {
                    id: 'moveItemValidate',
                },
                {
                    nbElements: items.length,
                }
            )}
            title={intl.formatMessage({
                id: 'moveItemTitle',
            })}
            contentText={intl.formatMessage({ id: 'moveItemContentText' })}
            fetchDirectoryContent={fetchDirectoryContent}
            fetchRootFolders={fetchRootFolders}
            fetchElementsInfos={fetchElementsInfos}
        />
    );
};

MoveDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
};

export default MoveDialog;
