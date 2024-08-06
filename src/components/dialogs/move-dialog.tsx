/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DirectoryItemSelector } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { ElementType } from '@gridsuite/commons-ui';
import { FunctionComponent } from 'react';

interface MoveDialogProps {
    open: boolean;
    onClose: () => void;
    itemsCount: number;
}

const MoveDialog: FunctionComponent<MoveDialogProps> = ({ open, onClose, itemsCount }) => {
    const intl = useIntl();

    return (
        <DirectoryItemSelector
            open={open}
            onClose={onClose}
            types={[ElementType.DIRECTORY]}
            onlyLeaves={false}
            multiSelect={false}
            validationButtonText={intl.formatMessage(
                {
                    id: 'moveItemValidate',
                },
                {
                    nbElements: itemsCount,
                }
            )}
            title={intl.formatMessage({
                id: 'moveItemTitle',
            })}
            contentText={intl.formatMessage({ id: 'moveItemContentText' })}
        />
    );
};

export default MoveDialog;
