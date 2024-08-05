/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'crypto';
import { IntlShape, useIntl } from 'react-intl';
import { Box, Theme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { ElementType, getFileIcon, OverflowableText, ElementAttributes } from '@gridsuite/commons-ui';

const isElementCaseOrStudy = (objectType: ElementType) => {
    return objectType === ElementType.STUDY || objectType === ElementType.CASE;
};

const getDisplayedElementName = (
    data: ElementAttributes,
    childrenMetadata: Record<UUID, ElementAttributes>,
    intl: IntlShape
) => {
    const { elementName, uploading, elementUuid } = data;
    const formatMessage = intl.formatMessage;
    if (uploading) {
        return elementName + '\n' + formatMessage({ id: 'uploading' });
    }
    if (!childrenMetadata[elementUuid]) {
        return elementName + '\n' + formatMessage({ id: 'creationInProgress' });
    }
    return childrenMetadata[elementUuid].elementName;
};

const styles = {
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    },
    circularRoot: (theme: Theme) => ({
        marginRight: theme.spacing(1),
    }),
    icon: (theme: Theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
    tooltip: {
        maxWidth: '1000px',
    },
    overflow: {
        display: 'inline-block',
        whiteSpace: 'pre',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        lineHeight: 'initial',
        verticalAlign: 'middle',
    },
};
export const NameCellRenderer = ({
    data,
    childrenMetadata,
}: {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
}) => {
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
                style={styles.overflow}
            />
        </Box>
    );
};
