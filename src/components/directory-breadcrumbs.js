/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import clsx from 'clsx';

import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { emphasize } from '@mui/material/styles/';
import makeStyles from '@mui/styles/makeStyles';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { Tooltip } from '@mui/material';

const useStyles = makeStyles((theme) => ({
    link: {
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
            backgroundColor: emphasize(theme.row.hover, 0.15),
        },
    },
    directory: {
        display: 'inline-grid',
        alignItems: 'center',
        textAlign: 'center',

        backgroundColor: theme.row.hover,
        padding: theme.spacing(0.5, 2, 0.5),
        borderRadius: theme.spacing(2),

        cursor: 'initial',
    },
    selectedLabel: {
        fontWeight: 'bold',
    },
    icon: {
        marginRight: theme.spacing(1),
        width: theme.spacing(2.25),
        height: theme.spacing(2.25),
        position: 'relative',
        top: theme.spacing(0.5),
    },
    breadcrumbs: {
        padding: theme.spacing(0.5, 0, 0.5),
        marginLeft: theme.spacing(1),
    },
    limitTextSize: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
}));

const DirectoryBreadcrumbs = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const currentPath = useSelector((state) => state.currentPath);

    /* Handle User interactions */
    const handleSelect = (event, dir) => {
        event.preventDefault();
        dispatch(setSelectedDirectory(dir));
    };

    /* Handle Rendering */
    const renderBreadCrumbsLinks = () => {
        if (
            selectedDirectory !== null &&
            currentPath !== null &&
            currentPath.length > 1
        ) {
            return currentPath
                .slice(0, currentPath.length - 1)
                .map((dir, index) => (
                    <Link
                        className={classes.link}
                        key={dir.elementUuid}
                        href="/"
                        onClick={(event) => handleSelect(event, dir)}
                        onDragStart={(event) => {
                            event.preventDefault();
                        }}
                        underline="hover"
                    >
                        <Tooltip title={dir.elementName}>
                            <div className={classes.limitTextSize}>
                                {index === 0 ? (
                                    <FolderOpenIcon className={classes.icon} />
                                ) : null}
                                {dir.elementName}
                            </div>
                        </Tooltip>
                    </Link>
                ));
        }
    };

    const renderBreadCrumbsTypography = () => {
        if (
            selectedDirectory !== null &&
            currentPath !== null &&
            currentPath.length > 0
        ) {
            return (
                <Tooltip
                    title={currentPath[currentPath.length - 1].elementName}
                >
                    <div className={classes.directory}>
                        <Typography
                            className={clsx(
                                classes.selectedLabel,
                                classes.limitTextSize
                            )}
                            color="textPrimary"
                        >
                            {currentPath.length === 1 && (
                                <FolderOpenIcon className={classes.icon} />
                            )}
                            {currentPath[currentPath.length - 1].elementName}
                        </Typography>
                    </div>
                </Tooltip>
            );
        }
    };

    return (
        <>
            {selectedDirectory !== null &&
                currentPath !== null &&
                currentPath.length > 0 && (
                    <Breadcrumbs
                        aria-label="breadcrumb"
                        className={classes.breadcrumbs}
                    >
                        {renderBreadCrumbsLinks()}
                        {renderBreadCrumbsTypography()}
                    </Breadcrumbs>
                )}
        </>
    );
};

export default DirectoryBreadcrumbs;
