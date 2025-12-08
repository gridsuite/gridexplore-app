/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { UUID } from 'node:crypto';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import {
    type ElementAttributes,
    ElementType,
    getFileIcon,
    mergeSx,
    type MuiStyles,
    OverflowableText,
} from '@gridsuite/commons-ui';

const waitingForAsyncCreation = (metadata: ElementAttributes, objectType: ElementType) =>
    !metadata && (objectType === ElementType.STUDY || objectType === ElementType.CASE);

function getDisplayedElementName(
    data: ElementAttributes,
    childrenMetadata: Record<UUID, ElementAttributes>,
    intl: IntlShape
) {
    const { elementName, uploading, elementUuid, type } = data;
    const { formatMessage } = intl;
    if (uploading) {
        return `${elementName}\n${formatMessage({ id: 'uploading' })}`;
    }
    if (waitingForAsyncCreation(childrenMetadata[elementUuid], type)) {
        return `${elementName}\n${formatMessage({ id: 'creationInProgress' })}`;
    }
    return childrenMetadata[elementUuid]?.elementName ?? elementName;
}

const styles = {
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    },
    icon: (theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        minWidth: '18px',
        height: '18px',
        minHeight: '18px',
    }),
    right: {
        marginLeft: 'auto',
    },
    tooltip: {
        maxWidth: '1000px',
    },
    waitingName: {
        display: 'inline-block',
        whiteSpace: 'pre',
        overflow: 'hidden',
        lineHeight: 'initial',
        verticalAlign: 'middle',
    },
    singleName: {
        marginTop: 1,
    },
} as const satisfies MuiStyles;

export type NameCellRendererProps = {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
    directoryWritable: boolean;
};

export function NameCellRenderer({ data, childrenMetadata, directoryWritable }: Readonly<NameCellRendererProps>) {
    const intl = useIntl();
    const metadata = childrenMetadata[data.elementUuid];
    const waiting = waitingForAsyncCreation(metadata, data.type);
    return (
        <Box sx={styles.tableCell}>
            {/*  Icon */}
            {waiting && <CircularProgress size={18} sx={styles.icon} />}
            {metadata && getFileIcon(data.type, styles.icon)}
            {/* Name */}
            <OverflowableText
                text={getDisplayedElementName(data, childrenMetadata, intl)}
                tooltipSx={styles.tooltip}
                style={waiting ? styles.waitingName : styles.singleName}
                data-testid="ElementName"
            />
            {!directoryWritable && (
                <Tooltip title={<FormattedMessage id="protectedElement" />}>
                    <LockIcon sx={mergeSx(styles.icon, styles.right)} />
                </Tooltip>
            )}
        </Box>
    );
}
