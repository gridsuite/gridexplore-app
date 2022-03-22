/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { FormattedMessage } from 'react-intl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';

/**
 * Dialog to change the access rights
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to handle access rights changes
 * @param {String} title Title of the dialog
 * @param {String} isPrivate tells if the element is private or not
 * @param {String} error error message if there is a fail
 */

const useStyles = makeStyles(() => ({
    formControl: {
        minWidth: 300,
    },
}));

const AccessRightsDialog = ({
    open,
    onClose,
    onClick,
    title,
    isPrivate,
    error,
}) => {
    const classes = useStyles();

    const [loading, setLoading] = React.useState(false);
    const [selected, setSelected] = React.useState(
        isPrivate !== undefined ? isPrivate.toString() : null
    );

    const handleClick = () => {
        setLoading(true);
        onClick(selected);
        setLoading(false);
    };

    const handleClose = () => {
        onClose();
        setLoading(false);
    };

    const handleChange = (event) => {
        setSelected(event.target.value);
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClick();
        }
    };

    useEffect(() => {
        setSelected(isPrivate !== undefined ? isPrivate.toString() : null);
    }, [isPrivate]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            onKeyPress={handleKeyPressed}
            aria-labelledby="dialog-title-accessRights"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <FormControl className={classes.formControl}>
                    <RadioGroup
                        aria-label=""
                        name="elementAccessRights"
                        value={selected}
                        onChange={handleChange}
                        row
                    >
                        <FormControlLabel
                            value="false"
                            control={<Radio />}
                            label=<FormattedMessage id="public" />
                        />
                        <FormControlLabel
                            value="true"
                            control={<Radio />}
                            label=<FormattedMessage id="private" />
                        />
                    </RadioGroup>
                    {error !== '' && <Alert severity="error">{error}</Alert>}
                </FormControl>
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '5px',
                        }}
                    >
                        <CircularProgress />
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
                    <FormattedMessage id="edit" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

AccessRightsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool,
    error: PropTypes.string.isRequired,
};

export default AccessRightsDialog;
