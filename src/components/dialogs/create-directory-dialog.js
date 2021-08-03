/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Alert from '@material-ui/lab/Alert';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import { Checkbox } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        alignItems: 'center',
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

/**
 * Dialog to create a directory
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the deletion
 * @param {String} title Title of the dialog
 * @param {String} message Message of the dialog
 */
export const CreateDirectoryDialog = ({
    open,
    onClose,
    onClick,
    title,
    message,
    error,
}) => {
    const classes = useStyles();
    const [elementName, setElementName] = React.useState('');
    const [isPrivate, setIsPrivate] = React.useState(true);

    useEffect(() => {
        setElementName('');
    }, [open]);

    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        onClick(elementName, isPrivate);
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClose();
        }
    };

    const updateElementName = (event) => {
        setElementName(event.target.value);
    };

    const handleChange = (event) => {
        setIsPrivate(event.target.checked);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-delete"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <InputLabel htmlFor="newName">{message}</InputLabel>
                <Grid container spacing={3} className={classes.root}>
                    <Grid item xs={5}>
                        <InputLabel>
                            <FormattedMessage id="directoryNameLabel" />
                        </InputLabel>
                    </Grid>
                    <Grid item xs={7}>
                        <TextField
                            autoFocus
                            value={elementName}
                            required={true}
                            onChange={updateElementName}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={3} className={classes.root}>
                    <Grid item xs={9}>
                        <InputLabel>
                            <FormattedMessage id="isPrivateLabel" />
                        </InputLabel>
                    </Grid>
                    <Grid item xs={3}>
                        <Checkbox
                            checked={isPrivate}
                            onChange={handleChange}
                            inputProps={{ 'aria-label': 'secondary checkbox' }}
                        />
                    </Grid>
                </Grid>
                <br />
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="text">
                    <FormattedMessage id="create" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreateDirectoryDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
};
