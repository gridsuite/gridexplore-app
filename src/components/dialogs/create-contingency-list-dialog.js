/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';

import { FormattedMessage, useIntl } from 'react-intl';

import { createContingencyList, elementExists } from '../../utils/rest-api';

import { useSelector } from 'react-redux';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import PropTypes from 'prop-types';
import { ContingencyListType, ElementType } from '../../utils/elementType';
import CircularProgress from '@mui/material/CircularProgress';
import makeStyles from '@mui/styles/makeStyles';
import CheckIcon from '@mui/icons-material/Check';
import { renderPopup } from './create-filter-dialog';
import ScriptDialogContent from './script-dialog-content';
import CriteriaBasedFilterDialogContent from './criteria-based-filter-dialog-content';
import ExplicitNamingContingencyListDialogContent from './explicit-naming-contingency-list-content';
import { prepareContingencyListForBackend } from './contingency-list-helper';
import { useDebounce } from '@gridsuite/commons-ui';

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '700px',
        minHeight: '500px',
        margin: 'auto',
    },
}));

/**
 * Dialog to create a contingency
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 */
export const CreateContingencyListDialog = ({ open, onClose }) => {
    const [contingencyListType, setContingencyListType] = React.useState(
        ContingencyListType.FORM
    );
    const [chosenContingencyListType, setChosenContingencyListType] = useState(
        ContingencyListType.FORM
    );

    const [contingencyListName, setContingencyListName] = React.useState('');
    const [createContingencyListErr, setCreateContingencyListErr] =
        React.useState('');

    const [contingencyNameValid, setContingencyNameValid] = useState(false);
    const [loadingCheckContingencyName, setLoadingCheckContingencyName] =
        React.useState(false);

    const classes = useStyles();
    const intl = useIntl();
    const [isConfirmationPopupOpen, setOpenConfirmationPopup] = useState(false);
    const [currentScript, setCurrentScript] = useState(null);
    const [tableValues, setTableValues] = useState([]);

    // currentCriteriaBasedFilter is a ref but should be a state, like in create-filter-dialog.js.
    // We tried to change the code this way, but failed to fix related bugs in time.
    // If/when someone tries to change it to a state, they should be mindful of the content
    // of the form sent to the backend when submitting a criteria-based form with multiple
    // fields : while testing this, we found that only the last modified field was sent instead
    // of all of them.
    const currentCriteriaBasedFilter = useRef(null);

    const [
        isCriteriaBasedEquipmentTypeSelected,
        setIsCriteriaBasedEquipmentTypeSelected,
    ] = useState(false);

    const [isExplicitNamingFormClean, setIsExplicitNamingFormClean] =
        useState(true);

    const [isUnsavedChanges, setUnsavedChanges] = useState(false);

    const activeDirectory = useSelector((state) => state.activeDirectory);

    const handleCloseDialog = () => {
        onClose();
    };

    /**
     * on change input popup check if name already exist
     * @param name
     */
    const updateContingencyFormState = useCallback(
        (name) => {
            if (name !== '') {
                //If the name is not only white spaces
                if (name.replace(/ /g, '') !== '') {
                    elementExists(
                        activeDirectory,
                        name,
                        ElementType.CONTINGENCY_LIST
                    )
                        .then((data) => {
                            setContingencyFormState(
                                data
                                    ? intl.formatMessage({
                                          id: 'nameAlreadyUsed',
                                      })
                                    : '',
                                !data
                            );
                        })
                        .catch((error) => {
                            setContingencyFormState(
                                intl.formatMessage({
                                    id: 'nameValidityCheckErrorMsg',
                                }) + error.message,
                                false
                            );
                        })
                        .finally(() => {
                            setLoadingCheckContingencyName(false);
                        });
                } else {
                    setContingencyFormState(
                        intl.formatMessage({ id: 'nameEmpty' }),
                        false
                    );
                    setLoadingCheckContingencyName(false);
                }
            } else {
                setContingencyFormState('', false);
                setLoadingCheckContingencyName(false);
            }
        },
        [activeDirectory, intl]
    );

    const debouncedUpdateContingencyFormState = useDebounce(
        updateContingencyFormState,
        700
    );
    const handleContingencyNameChanges = (name) => {
        setContingencyListName(name);
        setLoadingCheckContingencyName(true);
        debouncedUpdateContingencyFormState(name);
    };

    const setContingencyFormState = (errorMessage, isNameValid) => {
        setCreateContingencyListErr(errorMessage);
        setContingencyNameValid(isNameValid);
    };

    const handleChangeContingencyListType = (event) => {
        if (isUnsavedChanges) {
            setOpenConfirmationPopup(true);
            setChosenContingencyListType(event.target.value);
        } else {
            resetForms();
            setContingencyListType(event.target.value);
        }
    };

    const isFormValidationAllowed = () => {
        return (
            contingencyListName !== '' &&
            contingencyNameValid &&
            !loadingCheckContingencyName &&
            (contingencyListType !== ContingencyListType.FORM ||
                isCriteriaBasedEquipmentTypeSelected) &&
            (contingencyListType !== ContingencyListType.EXPLICIT_NAMING ||
                isExplicitNamingFormClean)
        );
    };

    const handleCreateNewContingencyList = () => {
        if (!isFormValidationAllowed()) {
            return;
        }
        let formContent;
        if (contingencyListType === ContingencyListType.FORM) {
            formContent = currentCriteriaBasedFilter.current;
        } else if (contingencyListType === ContingencyListType.SCRIPT) {
            formContent = { script: currentScript };
        } else if (
            contingencyListType === ContingencyListType.EXPLICIT_NAMING
        ) {
            formContent = prepareContingencyListForBackend(
                null,
                contingencyListName,
                tableValues
            );
        }
        createContingencyList(
            contingencyListType,
            contingencyListName,
            formContent,
            activeDirectory
        )
            .then(() => {
                setUnsavedChanges(false);
                onClose();
            })
            .catch((error) => {
                setCreateContingencyListErr(error.message);
            });
    };

    const renderContingencyNameStatus = () => {
        const showOk =
            contingencyListName !== '' &&
            !loadingCheckContingencyName &&
            contingencyNameValid;
        return (
            <div
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                }}
            >
                {loadingCheckContingencyName && (
                    <CircularProgress
                        className={classes.progress}
                        size="1rem"
                    />
                )}
                {showOk && <CheckIcon style={{ color: 'green' }} />}
            </div>
        );
    };

    const resetForms = () => {
        setCreateContingencyListErr('');
        setUnsavedChanges(false);
        currentCriteriaBasedFilter.current = null;
        setIsCriteriaBasedEquipmentTypeSelected(false);
        setCurrentScript(null);
        setIsExplicitNamingFormClean(true);
    };

    const handlePopupConfirmation = () => {
        setOpenConfirmationPopup(false);
        setContingencyListType(chosenContingencyListType);
        resetForms();
    };

    const onChangeScriptHandler = (newScript) => {
        setCurrentScript(newScript);
        if (newScript !== currentScript) {
            setUnsavedChanges(true);
        }
    };

    const onChangeCriteriaBasedHandler = (filter) => {
        currentCriteriaBasedFilter.current = {};
        currentCriteriaBasedFilter.current.id = filter.id;
        Object.assign(
            currentCriteriaBasedFilter.current,
            filter.equipmentFilterForm
        );

        setIsCriteriaBasedEquipmentTypeSelected(
            !!currentCriteriaBasedFilter?.current?.equipmentType
        );
        setUnsavedChanges(true);
    };

    const onChangeExplicitNamingHandler = (
        tableValues,
        isEdited,
        isDragged,
        isClean // used if one of the field's value is not yet registered, to prevent submiting the form without it
    ) => {
        setTableValues(tableValues);
        setCreateContingencyListErr('');
        setUnsavedChanges(isEdited);
        setIsExplicitNamingFormClean(isClean);
        if (isDragged) {
            setUnsavedChanges(true);
        }
    };

    return (
        <div>
            <Dialog
                classes={{ paper: classes.dialogPaper }}
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">
                    <FormattedMessage id="createNewContingencyList" />
                </DialogTitle>
                <DialogContent>
                    <div>
                        <TextField
                            onChange={(e) =>
                                handleContingencyNameChanges(e.target.value)
                            }
                            autoFocus
                            margin="dense"
                            value={contingencyListName}
                            error={
                                contingencyListName !== '' &&
                                !contingencyNameValid &&
                                !loadingCheckContingencyName
                            }
                            type="text"
                            style={{ width: '100%' }}
                            label={<FormattedMessage id="nameList" />}
                        />
                        {renderContingencyNameStatus()}
                    </div>

                    <RadioGroup
                        aria-label="type"
                        name="contingencyListType"
                        value={contingencyListType}
                        onChange={handleChangeContingencyListType}
                        row
                    >
                        <FormControlLabel
                            value={ContingencyListType.FORM}
                            control={<Radio />}
                            label={<FormattedMessage id="CriteriaBased" />}
                        />
                        <FormControlLabel
                            value={ContingencyListType.EXPLICIT_NAMING}
                            control={<Radio />}
                            label={<FormattedMessage id="ExplicitNaming" />}
                        />
                        <FormControlLabel
                            value={ContingencyListType.SCRIPT}
                            control={<Radio />}
                            label={<FormattedMessage id="SCRIPT" />}
                        />
                    </RadioGroup>
                    {contingencyListType === ContingencyListType.SCRIPT && (
                        <ScriptDialogContent
                            isCreation
                            onChange={onChangeScriptHandler}
                            onError={setCreateContingencyListErr}
                            type={ElementType.CONTINGENCY_LIST}
                        />
                    )}
                    {contingencyListType === ContingencyListType.FORM && (
                        <CriteriaBasedFilterDialogContent
                            open={open}
                            isCreation
                            contentType={ElementType.CONTINGENCY_LIST}
                            handleFilterCreation={onChangeCriteriaBasedHandler}
                        />
                    )}
                    {contingencyListType ===
                        ContingencyListType.EXPLICIT_NAMING && (
                        <ExplicitNamingContingencyListDialogContent
                            open={open}
                            name={'newContingencyList'}
                            isCreation={true}
                            onChange={onChangeExplicitNamingHandler}
                        />
                    )}
                    {createContingencyListErr !== '' && (
                        <Alert severity="error">
                            {createContingencyListErr}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={handleCreateNewContingencyList}
                        variant="outlined"
                        disabled={!isFormValidationAllowed()}
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
            {renderPopup(
                isConfirmationPopupOpen,
                intl,
                setOpenConfirmationPopup,
                handlePopupConfirmation
            )}
        </div>
    );
};

CreateContingencyListDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CreateContingencyListDialog;
