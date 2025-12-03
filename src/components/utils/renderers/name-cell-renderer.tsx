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

const isElementCaseOrStudy = (objectType: ElementType) =>
    objectType === ElementType.STUDY || objectType === ElementType.CASE;

function getDisplayedElementName(
    data: ElementAttributes,
    childrenMetadata: Record<UUID, ElementAttributes>,
    intl: IntlShape
) {
    const { elementName, uploading, elementUuid } = data;
    const { formatMessage } = intl;
    if (uploading) {
        return `${elementName}\n${formatMessage({ id: 'uploading' })}`;
    }
    if (!childrenMetadata[elementUuid]) {
        return `${elementName}\n${formatMessage({ id: 'creationInProgress' })}`;
    }
    return childrenMetadata[elementUuid].elementName;
}

const styles = {
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    },
    circularRoot: (theme) => ({
        marginRight: theme.spacing(1),
    }),
    icon: (theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
    right: {
        marginLeft: 'auto',
    },
    tooltip: {
        maxWidth: '1000px',
    },
} as const satisfies MuiStyles;

export type NameCellRendererProps = {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
    directoryWritable: boolean;
};

export function NameCellRenderer({ data, childrenMetadata, directoryWritable }: Readonly<NameCellRendererProps>) {
    const intl = useIntl();
    return (
        <Box sx={styles.tableCell}>
            {/*  Icon */}
            {!childrenMetadata[data.elementUuid] && isElementCaseOrStudy(data.type) && (
                <CircularProgress size={18} sx={styles.circularRoot} />
            )}
            {childrenMetadata[data.elementUuid] && getFileIcon(data.type, styles.icon)}
            {/* Name */}
            <OverflowableText
                text={getDisplayedElementName(data, childrenMetadata, intl)}
                tooltipSx={styles.tooltip}
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
