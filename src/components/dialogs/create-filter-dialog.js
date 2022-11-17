/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import withStyles from '@mui/styles/withStyles';
import makeStyles from '@mui/styles/makeStyles';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { createFilter, elementExists } from '../../utils/rest-api';
import Alert from '@mui/material/Alert';
import { useSelector } from 'react-redux';
import { ElementType, FilterType } from '../../utils/elementType';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import ExplicitNamingCreationDialog from './explicit-naming-filter-creation-dialog';
import CsvImportFilterCreationDialog from './csv-import-filter-creation-dialog';
import CriteriaBasedFilterDialog from './criteria-based-filter-dialog';
import CriteriaFilterDialogContent from './criteria-filter-dialog-content';
import ExplicitNamingFilterDialogContent from './explicit-naming-filter-dialog-content';
import { DialogContentText } from '@mui/material';

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
                    size="large"
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
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const [filterNameValid, setFilterNameValid] = useState(false);
    const [loadingCheckFilterName, setLoadingCheckFilterName] =
        React.useState(false);

    const classes = useStyles();
    const intl = useIntl();
    const timer = React.useRef();
    const [newListType, setNewListType] = useState(FilterType.CRITERIA);
    const [filterType, setFilterType] = useState('');
    const [openConfirmationPopup, setopenConfirmationPopup] = useState(false);
    const [choosedFilterType, setChoosedFilterType] = useState(
        FilterType.CRITERIA
    );

    // const [currentFilter] = CriteriaFilterDialogContent({
    //     id: null,
    //     open: open && filterType === FilterType.CRITERIA,
    //     contentType: ElementType.FILTER,
    // });

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
                        setFilterFormState(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error,
                            false
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
        setNewListType(FilterType.CRITERIA);
        setFilterType('');
        setLoadingCheckFilterName(false);
        setCreateFilterErr('');
        setFilterNameValid(false);
        setopenConfirmationPopup(false);
        setChoosedFilterType(FilterType.CRITERIA);
    };

    const handleValidation = () => {
        console.log('handleValidation in create filter dialog', newListType);
        //console.log('handleValidation in create filter dialog currentFilter', currentFilter);
        //To manage the case when we never tried to enter a name
        if (newNameList === '') {
            setCreateFilterErr(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!filterNameValid || loadingCheckFilterName) {
            return;
        }

        setFilterType(newListType);
    };

    const handleSave = (filter) => {
        console.log('enter handleSave in create filter dialog', filter);
        createFilter(filter, newNameList, activeDirectory)
            .then(() => {
                handleClose();
            })
            .catch((message) => {
                setCreateFilterErr(message);
            });
    };

    const handleClose = () => {
        onClose();
        resetDialog();
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

    const handleKeyPressed = (event) => {
        if (event.key === 'Enter') {
            handleValidation();
        }
    };

    const handleRadioButtonClick = (event) => {
        setopenConfirmationPopup(true);
        setChoosedFilterType(event.target.value);
    };

    const handlePopupConfirmation = () => {
        setopenConfirmationPopup(false);
        setNewListType(choosedFilterType);
    };

    const renderchangeFilterTypePopup = () => {
        return (
            <div>
                <Dialog
                    open={openConfirmationPopup}
                    aria-labelledby="dialog-title-change-filter-type"
                    onKeyPress={() => handlePopupConfirmation(false)}
                >
                    <DialogTitle id={'dialog-title-change-filter-type'}>
                        {'confirmation'}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            voulez-vous change le type ?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setopenConfirmationPopup(false)}>
                            <FormattedMessage id="cancel" />
                        </Button>
                        <Button
                            onClick={() => handlePopupConfirmation()}
                            variant="outlined"
                        >
                            <FormattedMessage id="validate" />
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    };

    return (
        <>
            <Dialog
                fullWidth={true}
                open={open && !filterType}
                onClose={handleClose}
                onKeyPress={handleKeyPressed}
            >
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
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
                        defaultValue={FilterType.CRITERIA}
                        onChange={(e) => handleRadioButtonClick(e)}
                        row
                    >
                        <FormControlLabel
                            value={FilterType.CRITERIA}
                            control={<Radio />}
                            label={<FormattedMessage id="CriteriaBased" />}
                        />
                        <FormControlLabel
                            value={FilterType.EXPLICIT_NAMING}
                            control={<Radio />}
                            label={<FormattedMessage id="ExplicitNaming" />}
                        />
                    </RadioGroup>
                    {newListType === FilterType.CRITERIA ? (
                        <CriteriaFilterDialogContent
                            open={open && filterType === FilterType.CRITERIA}
                            //onClose={handleClose}
                            //title={title}
                            isFilterCreation={true}
                           // handleFilterCreation={handleSave}
                            contentType={ElementType.FILTER}
                        />
                    ) : (
                        <ExplicitNamingFilterDialogContent
                            open={
                                open &&
                                filterType === FilterType.EXPLICIT_NAMING
                            }
                            title={title}
                            onClose={handleClose}
                            name={newNameList}
                            isFilterCreation={true}
                        />
                    )}
                    {createFilterErr !== '' && (
                        <Alert severity="error">{createFilterErr}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>{customTextCancelBtn}</Button>
                    <Button
                        variant="outlined"
                        onClick={handleValidation}
                        disabled={
                            newNameList === '' ||
                            !filterNameValid ||
                            loadingCheckFilterName
                        }
                    >
                        {customTextValidationBtn}
                    </Button>
                </DialogActions>
            </Dialog>
            {renderchangeFilterTypePopup()}

            {/* <CsvImportFilterCreationDialog
                open={open && filterType === FilterType.IMPORT_CSV}
                title={title}
                name={newNameList}
                onClose={handleClose}
            /> */}
        </>
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
                <Button autoFocus onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button variant="outlined" onClick={handleOk}>
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

export default CreateFilterDialog;
