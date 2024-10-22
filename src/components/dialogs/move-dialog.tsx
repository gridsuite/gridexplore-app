/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DirectoryItemSelector, ElementType, TreeViewFinderNodeProps } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';

export interface MoveDialogProps {
    open: boolean;
    onClose: (selectedDir: TreeViewFinderNodeProps[]) => void;
    itemsCount: number;
}

export default function MoveDialog({ open, onClose, itemsCount }: Readonly<MoveDialogProps>) {
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
}
