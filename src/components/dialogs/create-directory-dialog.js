/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import makeStyles from '@mui/styles/makeStyles';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';

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

    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        onClick(elementName, isPrivate);
    };

    const updateElementName = (event) => {
        setElementName(event.target.value);
    };

    const handleChange = (event) => {
        setIsPrivate(event.target.value);
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClick();
        }
    };

    useEffect(() => {
        setElementName('');
    }, [open]);

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
                    <Grid item xs={12}>
                        <FormControl className={classes.formControl}>
                            <RadioGroup
                                aria-label=""
                                name="DirectoryAccessRights"
                                value={isPrivate + ''}
                                onChange={handleChange}
                                row
                            >
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label={<FormattedMessage id="public" />}
                                />
                                <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label={<FormattedMessage id="private" />}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                </Grid>
                <br />
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
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
    error: PropTypes.string.isRequired,
};

export default CreateDirectoryDialog;
