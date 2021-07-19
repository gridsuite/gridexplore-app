import React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDirectory } from '../redux/actions';

import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';

const useStyles = makeStyles((theme) => ({
    link: {
        color: theme.link.color,
        textDecoration: 'none',
    },
    directory: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        flex: 1,
        height: '48px',
        cursor: 'initial',
        fontWeight: 'bold',
    },
    icon: {
        marginRight: theme.spacing(0.5),
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        width: '18px',
        height: '18px',
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
            return currentPath.slice(0, currentPath.length - 1).map((dir) => (
                <Link
                    className={classes.link}
                    key={dir.elementUuid}
                    color="inherit"
                    href="/"
                    onClick={(event) => handleSelect(event, dir.elementUuid)}
                >
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
                    <FolderOpenIcon className={classes.icon} />
                    {currentPath[currentPath.length - 1].elementName}
                </Typography>
            );
        }
    };

    return (
        <Breadcrumbs maxItems={10} aria-label="breadcrumb">
            {selectedDirectory !== null && (
                <ArrowForwardIosIcon className={classes.icon} />
            )}
            {renderBreadCrumbsLinks(currentPath)}
            {renderBreadCrumbsTypography(currentPath)}
        </Breadcrumbs>
    );
};

export default DirectoryBreadcrumbs;
