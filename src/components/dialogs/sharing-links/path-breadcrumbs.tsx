/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { MouseEventHandler } from 'react';
import { Link } from 'react-router';
import { Breadcrumbs, Chip, Tooltip } from '@mui/material';
import type { MuiStyles } from '@gridsuite/commons-ui';
import type { ReferencingElementInfos } from '../../../utils/referencing-element-infos.type';

const styles = {
    breadcrumbs: (theme) => ({
        // inline, like the other cell renderers, to be vertically centered in the cell
        display: 'inline-block',
        verticalAlign: 'middle',
        // a long path stays on one line within the cell: the chips shrink and what still does not fit is clipped
        maxWidth: '100%',
        overflow: 'hidden',
        '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
        },
        // the chips shrink proportionally to their length, unlike the separators and the collapsed button
        '& .MuiBreadcrumbs-li': {
            minWidth: 0,
            maxWidth: theme.spacing(20),
        },
        '& .MuiBreadcrumbs-li:has(.MuiBreadcrumbCollapsed-root), & .MuiBreadcrumbs-separator': {
            flexShrink: 0,
        },
        '& .MuiBreadcrumbs-separator': {
            marginLeft: 0.5,
            marginRight: 0.5,
        },
        // for MuiBreadcrumbCollapsed
        '& .MuiButtonBase-root': {
            backgroundColor: theme.row.primary as string,
            '&:hover, &:focus, &:active': {
                backgroundColor: theme.row.hover as string,
            },
        },
    }),
    chip: (theme) => ({
        backgroundColor: theme.row.primary as string,
        maxWidth: '100%',
    }),
} as const satisfies MuiStyles;

export interface PathBreadcrumbsProps {
    path: ReferencingElementInfos['path'];
    onLinkClick?: MouseEventHandler;
}

/**
 * Renders an element path as a MUI Breadcrumbs.
 * When the path has more than two segments, the condensed
 * form is truncated in the middle: "Element 1 / ... / Element N".
 * Each segment links to its directory.
 */
export default function PathBreadcrumbs({ path, onLinkClick }: Readonly<PathBreadcrumbsProps>) {
    return (
        <Breadcrumbs aria-label="breadcrumb" maxItems={2} sx={styles.breadcrumbs}>
            {path.map(({ elementUuid, elementName }) => (
                <Tooltip key={elementUuid} title={elementName}>
                    <Chip
                        label={elementName}
                        size="small"
                        sx={styles.chip}
                        component={Link}
                        to={`/elements/${elementUuid}`}
                        onClick={onLinkClick}
                        clickable
                    />
                </Tooltip>
            ))}
        </Breadcrumbs>
    );
}
