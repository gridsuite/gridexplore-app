/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPath } from '../redux/actions';

import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { emphasize, makeStyles } from '@material-ui/core/styles/';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';

const useStyles = makeStyles((theme) => ({
    link: {
        display: 'flex',
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
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        fontWeight: 'bold',

        backgroundColor: theme.row.hover,
        padding: theme.spacing(0.5, 2, 0.5),
        borderRadius: theme.spacing(2),

        cursor: 'initial',
    },
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    },
    breadcrumbs: {
        padding: theme.spacing(0.5, 0, 0.5),
        marginLeft: theme.spacing(1),
    },
}));

const DirectoryBreadcrumbs = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const currentPath = useSelector((state) => state.currentPath);

    /* Handle User interactions */
    const handleSelect = (event, nodeId) => {
        event.preventDefault();
        let path = [];
        if (currentPath) {
            for (const i in currentPath) {
                path.push(currentPath[i]);
                if (nodeId === currentPath[i].elementUuid) break;
            }
        }
        dispatch(setCurrentPath(path));
    };

    /* Handle Rendering */
    const renderBreadCrumbsLinks = (currentPath) => {
        if (currentPath !== null && currentPath.length > 1) {
            return currentPath
                .slice(0, currentPath.length - 1)
                .map((dir, index) => (
                    <Link
                        className={classes.link}
                        key={dir.elementUuid}
                        href="/"
                        onClick={(event) =>
                            handleSelect(event, dir.elementUuid)
                        }
                    >
                        {index === 0 ? (
                            <FolderOpenIcon className={classes.icon} />
                        ) : null}
                        {dir.elementName}
                    </Link>
                ));
        }
    };

    const renderBreadCrumbsTypography = (currentPath) => {
        if (currentPath !== null && currentPath.length > 0) {
            return (
                <Typography className={classes.directory} color="textPrimary">
                    {currentPath.length === 1 && (
                        <FolderOpenIcon className={classes.icon} />
                    )}
                    {currentPath[currentPath.length - 1].elementName}
                </Typography>
            );
        }
    };

    return (
        <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumbs}>
            {renderBreadCrumbsLinks(currentPath)}
            {renderBreadCrumbsTypography(currentPath)}
        </Breadcrumbs>
    );
};

export default DirectoryBreadcrumbs;
