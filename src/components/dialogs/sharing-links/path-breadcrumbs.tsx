/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Breadcrumbs, Chip, Tooltip } from '@mui/material';
import type { MuiStyles } from '@gridsuite/commons-ui';

const styles = {
    breadcrumbs: {
        '& .MuiBreadcrumbs-separator': {
            marginLeft: 0.5,
            marginRight: 0.5,
        },
    },
    chip: (theme) => ({
        backgroundColor: theme.row.primary as string,
        maxWidth: theme.spacing(20),
    }),
} as const satisfies MuiStyles;

export interface PathBreadcrumbsProps {
    /** Parent directories, from root to the closest parent. */
    path: string[];
}

/**
 * Renders an element path as a MUI Breadcrumbs styled the GridExplore way (chips),
 * in a compact "small" size. When the path has more than two segments, the condensed
 * form is truncated in the middle: "Element 1 / ... / Element N".
 */
export default function PathBreadcrumbs({ path }: Readonly<PathBreadcrumbsProps>) {
    return (
        <Breadcrumbs
            aria-label="breadcrumb"
            maxItems={2}
            itemsBeforeCollapse={1}
            itemsAfterCollapse={1}
            sx={styles.breadcrumbs}
        >
            {path.map((segment, index) => (
                <Tooltip key={path.slice(0, index + 1).join('/')} title={segment}>
                    <Chip label={segment} size="small" sx={styles.chip} />
                </Tooltip>
            ))}
        </Breadcrumbs>
    );
}
