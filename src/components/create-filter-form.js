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
import { FormattedMessage, useIntl } from 'react-intl';
import TextField from '@material-ui/core/TextField';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import Grid from '@material-ui/core/Grid';
import { createFilter, elementExists } from '../utils/rest-api';
import Alert from '@material-ui/lab/Alert';
import { useSelector } from 'react-redux';
import { ElementType, FilterType } from '../utils/elementType';
import CircularProgress from '@material-ui/core/CircularProgress';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles((theme) => ({
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
}));

const CustomDialogTitle = (props) => {
    const { children, onClose, ...other } = props;
    const classes = useStyles();
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
};

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
    const [newNameList, setNewListName] = useState('');
    const [newListType, setNewListType] = useState(FilterType.SCRIPT);
    const [filterPrivacy, setFilterPrivacy] = React.useState('private');
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const [filterNameValid, setFilterNameValid] = useState(false);
    const [loadingCheckFilterName, setLoadingCheckFilterName] =
        React.useState(false);

    const classes = useStyles();
    const intl = useIntl();
    const timer = React.useRef();

    /**
     * on change input popup check if name already exist
     * @param name
     */
    const updateFilterFormState = (name) => {
        if (name !== '') {
            //If the name is not only white spaces
            if (name.replace(/ /g, '') !== '') {
                elementExists(activeDirectory, name, ElementType.FILTER)
                    .then((data) => {
                        setFilterFormState(
                            data
                                ? intl.formatMessage({
                                      id: 'nameAlreadyUsed',
                                  })
                                : '',
                            !data
                        );
                    })
                    .catch((error) => {
                        setCreateFilterErr(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error
                        );
                    })
                    .finally(() => {
                        setLoadingCheckFilterName(false);
                    });
            } else {
                setFilterFormState(
                    intl.formatMessage({ id: 'nameEmpty' }),
                    false
                );
                setLoadingCheckFilterName(false);
            }
        } else {
            setFilterFormState('', false);
            setLoadingCheckFilterName(false);
        }
    };

    const handleFilterNameChanges = (name) => {
        setNewListName(name);
        setLoadingCheckFilterName(true);

        //Reset the timer so we only call update on the last input
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            updateFilterFormState(name);
        }, 700);
    };

    const setFilterFormState = (errorMessage, isNameValid) => {
        setCreateFilterErr(errorMessage);
        setFilterNameValid(isNameValid);
    };

    const resetDialog = () => {
        setNewListName('');
        setNewListType(FilterType.SCRIPT);
        setFilterPrivacy('private');
        setLoadingCheckFilterName(false);
        setCreateFilterErr('');
        setFilterNameValid(false);
    };

    const handleSave = () => {
        const subtype = newListType === FilterType.SCRIPT ? null : 'LINE';
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

    const renderFilterNameStatus = () => {
        const showOk =
            newNameList !== '' && !loadingCheckFilterName && filterNameValid;
        return (
            <div
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                }}
            >
                {loadingCheckFilterName && (
                    <CircularProgress
                        className={classes.progress}
                        size="1rem"
                    />
                )}
                {showOk && <CheckIcon style={{ color: 'green' }} />}
            </div>
        );
    };

    return (
        <DialogContainer open={open} onClose={handleClose}>
            <CustomDialogTitle onClose={handleClose}>{title}</CustomDialogTitle>
            <CustomDialogContent dividers>
                <Grid container direction="row" spacing={1}>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            autoFocus
                            margin="dense"
                            type="text"
                            style={{ width: '90%' }}
                            onChange={(event) =>
                                handleFilterNameChanges(event.target.value)
                            }
                            error={
                                newNameList !== '' &&
                                !filterNameValid &&
                                !loadingCheckFilterName
                            }
                            label={inputLabelText}
                        />
                        {renderFilterNameStatus()}
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
                                value="FORM"
                                control={<Radio />}
                                label={<FormattedMessage id="FORM" />}
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
                    disabled={
                        newNameList === '' ||
                        !filterNameValid ||
                        loadingCheckFilterName
                    }
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
