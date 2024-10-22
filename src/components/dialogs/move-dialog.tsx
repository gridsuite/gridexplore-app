/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DirectoryItemSelector, TreeViewFinderNodeProps } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { ElementType } from '@gridsuite/commons-ui';
import { FunctionComponent } from 'react';

interface MoveDialogProps {
    open: boolean;
    onClose: (selectedDir: TreeViewFinderNodeProps[]) => void;
    itemsCount: number;
    isDirectoryMoving?: boolean;
    directoryName?: string;
}

const MoveDialog: FunctionComponent<MoveDialogProps> = ({
    open,
    onClose,
    itemsCount,
    isDirectoryMoving,
    directoryName,
}) => {
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
                    id: isDirectoryMoving ? 'moveDirectoryValidate' : 'moveItemValidate',
                },
                {
                    nbElements: itemsCount,
                }
            )}
            title={
                isDirectoryMoving
                    ? intl.formatMessage({ id: 'moveDirectoryTitle' }, { directoryName: directoryName })
                    : intl.formatMessage({ id: 'moveItemTitle' })
            }
            contentText={intl.formatMessage({ id: 'moveItemContentText' })}
        />
    );
};

export default MoveDialog;
