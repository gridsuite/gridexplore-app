/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useDispatch, useSelector } from 'react-redux';
import { Box, Breadcrumbs, emphasize, Link, SxProps, Theme, Tooltip, Typography } from '@mui/material';
import { FolderOpen as FolderOpenIcon } from '@mui/icons-material';
import { ElementAttributes, mergeSx } from '@gridsuite/commons-ui';
import { MouseEvent } from 'react';
import { setSelectedDirectory } from '../redux/actions';
import { AppState } from '../redux/types';

const styles = {
    link: (theme: Theme) => ({
        display: 'inline-grid',
        alignItems: 'center',
        textAlign: 'center',
        color: theme.link.color,

        backgroundColor: theme.row.primary,
        padding: theme.spacing(0.5, 2, 0.5),
        borderRadius: theme.spacing(2),

        '&:hover, &:focus': {
            backgroundColor: theme.row.hover,
            textDecoration: 'none',
        },
        '&:active': {
            backgroundColor: emphasize(theme.row.hover as string, 0.15),
        },
    }),
    directory: (theme: Theme) => ({
        display: 'inline-grid',
        alignItems: 'center',
        textAlign: 'center',

        backgroundColor: theme.row.hover,
        padding: theme.spacing(0.5, 2, 0.5),
        borderRadius: theme.spacing(2),

        cursor: 'initial',
    }),
    selectedLabel: {
        fontWeight: 'bold',
    },
    icon: (theme: Theme) => ({
        marginRight: theme.spacing(1),
        width: theme.spacing(2.25),
        height: theme.spacing(2.25),
        position: 'relative',
        top: theme.spacing(0.5),
    }),
    breadcrumbs: (theme: Theme) => ({
        padding: theme.spacing(0.5, 0, 0.5),
        marginLeft: theme.spacing(1),
    }),
    limitTextSize: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
};

export default function DirectoryBreadcrumbs() {
    const dispatch = useDispatch();

    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const currentPath = useSelector((state: AppState) => state.currentPath);

    /* Handle User interactions */
    const handleSelect = (event: MouseEvent<HTMLElement>, dir: ElementAttributes | null) => {
        event.preventDefault();
        dispatch(setSelectedDirectory(dir));
    };

    /* Handle Rendering */
    const renderBreadCrumbsLinks = () => {
        if (selectedDirectory !== null && currentPath !== null && currentPath.length > 1) {
            return currentPath.slice(0, currentPath.length - 1).map((dir, index) => (
                <Link
                    sx={styles.link as SxProps}
                    key={dir.elementUuid}
                    href="/"
                    onClick={(event: MouseEvent<HTMLElement>) => handleSelect(event, dir)}
                    onDragStart={(event: MouseEvent<HTMLElement>) => {
                        event.preventDefault();
                    }}
                    underline="hover"
                >
                    <Tooltip title={dir.elementName}>
                        <Box sx={styles.limitTextSize}>
                            {index === 0 ? <FolderOpenIcon sx={styles.icon} /> : null}
                            {dir.elementName}
                        </Box>
                    </Tooltip>
                </Link>
            ));
        }
        return undefined;
    };

    const renderBreadCrumbsTypography = () => {
        if (selectedDirectory !== null && currentPath !== null && currentPath.length > 0) {
            return (
                <Tooltip title={currentPath[currentPath.length - 1].elementName}>
                    <Box sx={styles.directory as SxProps}>
                        <Typography sx={mergeSx(styles.selectedLabel, styles.limitTextSize)} color="textPrimary">
                            {currentPath.length === 1 && <FolderOpenIcon sx={styles.icon} />}
                            {currentPath[currentPath.length - 1].elementName}
                        </Typography>
                    </Box>
                </Tooltip>
            );
        }
        return undefined;
    };

    return selectedDirectory !== null && currentPath !== null && currentPath.length > 0 ? (
        <Breadcrumbs aria-label="breadcrumb" sx={styles.breadcrumbs}>
            {renderBreadCrumbsLinks()}
            {renderBreadCrumbsTypography()}
        </Breadcrumbs>
    ) : undefined;
}
