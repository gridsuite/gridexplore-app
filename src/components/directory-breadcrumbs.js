import React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';

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

    const selectedDirectory = useSelector((state) => state.selectedDirectory);
    const currentPath = useSelector((state) => state.currentPath);

    /* Handle User interactions */
    const handleSelect = (event, nodeId) => {
        event.preventDefault();
        dispatch(setSelectedDirectory(nodeId));
    };

    /* Handle Rendering */
    const renderBreadCrumbsLinks = (currentPath) => {
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
        if (
            selectedDirectory !== null &&
            currentPath !== null &&
            currentPath.length > 0
        ) {
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
