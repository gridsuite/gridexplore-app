/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import TextField from '@material-ui/core/TextField';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import Grid from '@material-ui/core/Grid';
import { createFilter } from '../utils/rest-api';
import Alert from '@material-ui/lab/Alert';
import { useSelector } from 'react-redux';
import { filterSubtype } from '../utils/elementType';

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const CustomDialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <DialogTitle
            disableTypography
            className={classes.root}
            {...other}
            style={{ padding: '15px' }}
        >
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
});

const CustomDialogContent = withStyles(() => ({
    root: {
        padding: '15px',
    },
}))(DialogContent);

const CustomDialogActions = withStyles(() => ({
    root: {
        margin: '0',
        padding: '15px',
    },
}))(DialogActions);

const DialogContainer = withStyles(() => ({
    paper: {
        width: '600px',
    },
}))(Dialog);

const CreateFilterDialog = ({
    open,
    onClose,
    inputLabelText,
    title,
    customTextValidationBtn,
    customTextCancelBtn,
}) => {
    const [disableBtnSave, setDisableBtnSave] = useState(true);
    const [newNameList, setNewListName] = useState('');
    const [newListType, setNewListType] = useState(filterSubtype.SCRIPT);
    const [filterPrivacy, setFilterPrivacy] = React.useState('private');
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    /**
     * on change input popup check if name already exist
     * @param name
     */
    const onChangeInputName = (name) => {
        if (name.length === 0) {
            setDisableBtnSave(true);
        } else {
            setNewListName(name);
            setDisableBtnSave(false);
        }
    };

    const resetDialog = () => {
        setNewListName('');
        setNewListType(filterSubtype.SCRIPT);
        setFilterPrivacy('private');
        setCreateFilterErr('');
    };

    const handleSave = () => {
        const subtype = newListType === filterSubtype.SCRIPT ? null : 'LINE';
        createFilter(
            {
                type: newListType,
                equipmentFilterForm: {
                    equipmentType: subtype,
                },
                transient: true,
            },
            newNameList,
            filterPrivacy === 'private',
            activeDirectory
        ).then((res) => {
            if (res.ok) {
                onClose();
                resetDialog();
            } else {
                console.debug('Error when creating the filter');
                res.json()
                    .then((data) => {
                        setCreateFilterErr(data.error + ' - ' + data.message);
                    })
                    .catch((error) => {
                        setCreateFilterErr(error.name + ' - ' + error.message);
                    });
            }
        });
    };

    const handleClose = () => {
        onClose();
        resetDialog();
    };

    const handleChangeFilterPrivacy = (event) => {
        setFilterPrivacy(event.target.value);
    };

    return (
        <DialogContainer open={open} onClose={handleClose}>
            <CustomDialogTitle onClose={handleClose}>{title}</CustomDialogTitle>
            <CustomDialogContent dividers>
                <Grid container direction="row" spacing={1}>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            style={{ width: '100%' }}
                            defaultValue={''}
                            onChange={(event) =>
                                onChangeInputName(event.target.value)
                            }
                            label={inputLabelText}
                        />
                        <RadioGroup
                            aria-label="type"
                            name="filterType"
                            value={newListType}
                            onChange={(e) => setNewListType(e.target.value)}
                            row
                        >
                            <FormControlLabel
                                value="SCRIPT"
                                control={<Radio />}
                                label={<FormattedMessage id="SCRIPT" />}
                            />
                            <FormControlLabel
                                value="FILTER"
                                control={<Radio />}
                                label={<FormattedMessage id="FILTERS" />}
                            />
                        </RadioGroup>
                        <RadioGroup
                            aria-label="privacy"
                            name="filterPrivacy"
                            value={filterPrivacy}
                            onChange={handleChangeFilterPrivacy}
                            row
                        >
                            <FormControlLabel
                                value="public"
                                control={<Radio />}
                                label=<FormattedMessage id="public" />
                            />
                            <FormControlLabel
                                value="private"
                                control={<Radio />}
                                label=<FormattedMessage id="private" />
                            />
                        </RadioGroup>
                    </Grid>
                </Grid>
                {createFilterErr !== '' && (
                    <Alert severity="error">{createFilterErr}</Alert>
                )}
            </CustomDialogContent>
            <CustomDialogActions>
                <Button autoFocus size="small" onClick={handleClose}>
                    {customTextCancelBtn}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSave}
                    disabled={disableBtnSave}
                >
                    {customTextValidationBtn}
                </Button>
            </CustomDialogActions>
        </DialogContainer>
    );
};

CreateFilterDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    inputLabelText: PropTypes.object.isRequired,
    title: PropTypes.object.isRequired,
    customTextValidationBtn: PropTypes.object.isRequired,
    customTextCancelBtn: PropTypes.object.isRequired,
};

const PopupInfo = ({
    open,
    onClose,
    title,
    customAlertMessage,
    customTextValidationBtn,
    handleBtnOk,
    handleBtnCancel,
}) => {
    const handleClose = () => {
        onClose();
    };

    const handleOk = () => {
        handleBtnOk();
    };

    const handleCancel = () => {
        handleBtnCancel();
    };

    return (
        <DialogContainer open={open} onClose={handleClose}>
            <CustomDialogTitle onClose={handleClose}>{title}</CustomDialogTitle>
            <CustomDialogContent dividers>
                {customAlertMessage}
            </CustomDialogContent>
            <CustomDialogActions>
                <Button autoFocus size="small" onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button variant="outlined" size="small" onClick={handleOk}>
                    {customTextValidationBtn}
                </Button>
            </CustomDialogActions>
        </DialogContainer>
    );
};

PopupInfo.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.object.isRequired,
    customAlertMessage: PropTypes.object.isRequired,
    customTextValidationBtn: PropTypes.object.isRequired,
    handleBtnOk: PropTypes.func.isRequired,
    handleBtnCancel: PropTypes.func.isRequired,
};

export { CreateFilterDialog };
