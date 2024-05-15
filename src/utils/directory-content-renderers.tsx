/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, Theme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import {
    getFileIcon,
    OverflowableText,
    ElementType,
} from '@gridsuite/commons-ui';
import Tooltip from '@mui/material/Tooltip';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import CreateIcon from '@mui/icons-material/Create';
import Chip from '@mui/material/Chip';
import { IntlShape, useIntl } from 'react-intl';
import { UUID } from 'crypto';
import { IElement, IElementMetadata } from '../redux/reducer.type';

const styles = {
    tableCell: (theme: Theme) => ({
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    }),
    chip: {
        cursor: 'pointer',
    },
    icon: (theme: Theme) => ({
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    }),
    circularRoot: (theme: Theme) => ({
        marginRight: theme.spacing(1),
    }),
    tooltip: {
        maxWidth: '1000px',
    },
    descriptionTooltip: {
        display: 'inline-block',
        whiteSpace: 'pre',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '250px',
        maxHeight: '50px',
        cursor: 'pointer',
    },
};

const getDisplayedElementName = (
    data: IElement,
    childrenMetadata: Record<UUID, IElementMetadata>,
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

const isElementCaseOrStudy = (objectType: ElementType) => {
    return objectType === ElementType.STUDY || objectType === ElementType.CASE;
};

const abbreviationFromUserName = (name: string | null) => {
    if (name === null) {
        return '';
    }
    const tab = name.split(' ').map((x) => x.charAt(0));
    if (tab.length === 1) {
        return tab[0];
    } else {
        return tab[0] + tab[tab.length - 1];
    }
};

const getElementTypeTranslation = (
    type: ElementType,
    subtype: string | null,
    formatCase: string | null,
    intl: IntlShape
) => {
    let translatedType;
    switch (type) {
        case ElementType.FILTER:
        case ElementType.CONTINGENCY_LIST:
            translatedType = intl.formatMessage({
                id: subtype ? subtype + '_' + type : type,
            });
            break;
        case ElementType.MODIFICATION:
            translatedType =
                intl.formatMessage({ id: type }) +
                ' (' +
                intl.formatMessage({
                    id: 'network_modifications.' + subtype,
                }) +
                ')';
            break;
        default:
            translatedType = type ? intl.formatMessage({ id: type }) : '';
            break;
    }

    const translatedFormat = formatCase
        ? ' (' + intl.formatMessage({ id: formatCase }) + ')'
        : '';

    return `${translatedType}${translatedFormat}`;
};
export const NameCellRenderer = ({
    data,
    childrenMetadata,
}: {
    data: IElement;
    childrenMetadata: Record<UUID, IElementMetadata>;
}) => {
    const intl = useIntl();
    return (
        <Box sx={styles.tableCell}>
            {/*  Icon */}
            {!childrenMetadata[data.elementUuid] &&
                isElementCaseOrStudy(data.type) && (
                    <CircularProgress size={18} sx={styles.circularRoot} />
                )}
            {childrenMetadata[data.elementUuid] &&
                getFileIcon(data.type, styles.icon)}
            {/* Name */}
            <OverflowableText
                text={getDisplayedElementName(data, childrenMetadata, intl)}
                tooltipSx={styles.tooltip}
            />
        </Box>
    );
};

export const DescriptionCellRenderer = ({ data }: { data: IElement }) => {
    const description = data.description;
    const descriptionLines = description?.split('\n');
    if (descriptionLines?.length > 3) {
        descriptionLines[2] = '...';
    }
    const tooltip = descriptionLines?.join('\n');

    const icon = description ? (
        <Tooltip
            title={<Box children={tooltip} sx={styles.descriptionTooltip} />}
            placement="right"
        >
            <StickyNote2OutlinedIcon />
        </Tooltip>
    ) : (
        <CreateIcon />
    );
    return (
        <Box sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
            {icon}
        </Box>
    );
};

export const TypeCellRenderer = ({
    data,
    childrenMetadata,
}: {
    data: IElement;
    childrenMetadata: Record<UUID, IElementMetadata>;
}) => {
    const intl = useIntl();

    return (
        <Box sx={{ height: 'inherit' }}>
            <OverflowableText
                text={getElementTypeTranslation(
                    data?.type,
                    childrenMetadata[data?.elementUuid]?.specificMetadata.type,
                    childrenMetadata[data?.elementUuid]?.specificMetadata
                        .format,
                    intl
                )}
                tooltipSx={styles.tooltip}
            />
        </Box>
    );
};

export const DateCellRenderer = ({ value }: { value: string }) => {
    const intl = useIntl();

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getDate())) {
        const cellMidnight = new Date(value).setHours(0, 0, 0, 0);

        const time = new Intl.DateTimeFormat(intl.locale, {
            timeStyle: 'medium',
            hour12: false,
        }).format(dateValue);
        const displayedDate =
            intl.locale === 'en'
                ? dateValue.toISOString().substring(0, 10)
                : dateValue.toLocaleDateString(intl.locale);
        const cellText = todayStart === cellMidnight ? time : displayedDate;
        const fullDate = new Intl.DateTimeFormat(intl.locale, {
            dateStyle: 'long',
            timeStyle: 'long',
            hour12: false,
        }).format(dateValue);

        return (
            <Box>
                <Tooltip title={fullDate} placement="right">
                    <span>{cellText}</span>
                </Tooltip>
            </Box>
        );
    }
};

export const UserCellRenderer = ({ value }: { value: string }) => {
    return (
        <Box>
            <Tooltip title={value} placement="right">
                <Chip
                    sx={styles.chip}
                    label={abbreviationFromUserName(value)}
                />
            </Tooltip>
        </Box>
    );
};
