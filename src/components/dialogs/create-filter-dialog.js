/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
import CriteriaBasedFilterDialogContent from './criteria-based-filter-dialog-content';
import ExplicitNamingFilterDialogContent from './explicit-naming-filter-dialog-content';
import { DialogContentText } from '@mui/material';
import filterSave from './filters-save';

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
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

export const renderPopup = (
    isConfirmationPopupOpen,
    handleKeyPressed,
    intl,
    setOpenConfirmationPopup,
    handlePopupConfirmation
) => {
    return (
        <div>
            <Dialog
                open={isConfirmationPopupOpen}
                aria-labelledby="dialog-title-change-equipment-type"
                onKeyPress={handleKeyPressed}
            >
                <DialogTitle id={'dialog-title-change-equipment-type'}>
                    {'Confirmation'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {intl.formatMessage({ id: 'changeTypeMessage' })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmationPopup(false)}>
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={handlePopupConfirmation}
                        variant="outlined"
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

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
    const [filterType, setFilterType] = useState(null);
    const [isConfirmationPopupOpen, setOpenConfirmationPopup] = useState(false);
    const [chosenFilterType, setChosenFilterType] = useState(
        FilterType.CRITERIA
    );

    const [filterToSave, setFilterToSave] = useState(null);
    const [validationsCount, setValidationsCount] = useState(0);
    const [tableValues, setTableValues] = useState([]);
    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [isFilterCreation, setIsFilterCreation] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const handleCallback = (criteriaFilter, veto) => {
        if (veto) setFilterToSave(null);
        else if (criteriaFilter) {
            setFilterToSave(criteriaFilter);
        }
    };

    const handleEquipmentChange = (equipmentType) => {
        setEquipmentType(equipmentType);
        setCreateFilterErr('');
    };

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
                            }) + error.message,
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

    const handleNamingFilterCallBack = (
        tableValues,
        isGeneratorOrLoad,
        isCreation,
        equipmentType,
        name,
        id
    ) => {
        setIsGeneratorOrLoad(isGeneratorOrLoad);
        setIsFilterCreation(isCreation);
        setEquipmentType(equipmentType);
        setName(name);
        setId(id);
        setTableValues(tableValues);
    };

    useEffect(() => {
        setCreateFilterErr('');
    }, [tableValues]);

    const handleValidation = () => {
        setValidationsCount((prev) => prev + 1);

        //To manage the case when we never tried to enter a name
        if (newNameList === '') {
            setCreateFilterErr(intl.formatMessage({ id: 'nameEmpty' }));
            return;
        }
        //We don't do anything if the checks are not over or the name is not valid
        if (!filterNameValid || loadingCheckFilterName) {
            return;
        }

        if (newListType === FilterType.EXPLICIT_NAMING) {
            filterSave(
                tableValues,
                isGeneratorOrLoad,
                isFilterCreation,
                equipmentType,
                name,
                id,
                setCreateFilterErr,
                activeDirectory,
                intl,
                handleClose
            );
            return;
        } else if (!filterToSave) {
            return;
        }

        setFilterType(newListType);
        handleSave(filterToSave);
    };

    const handleSave = (filter) => {
        createFilter(filter, newNameList, activeDirectory)
            .then(() => {
                handleClose();
            })
            .catch((error) => {
                setCreateFilterErr(error.message);
            });
    };

    const handleClose = () => {
        onClose();
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

    const onFilterTypeChange = (event) => {
        if (equipmentType !== null) {
            setOpenConfirmationPopup(true);
            setChosenFilterType(event.target.value);
        } else {
            handlePopupConfirmation();
            setNewListType(event.target.value);
        }
    };

    const handlePopupConfirmation = () => {
        setOpenConfirmationPopup(false);
        setNewListType(chosenFilterType);
        setEquipmentType(null);
        setCreateFilterErr('');
    };

    return (
        <>
            <Dialog
                classes={{ paper: classes.dialogPaper }}
                fullWidth={true}
                open={open && !filterType}
                onClose={handleClose}
                onKeyPress={handleKeyPressed}
            >
                <DialogTitle>{title}</DialogTitle>
                <DialogContent style={{ maxHeight: '60vh' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        type="text"
                        style={{ width: '100%' }}
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
                        onChange={(e) => onFilterTypeChange(e)}
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
                        <CriteriaBasedFilterDialogContent
                            open={open && filterType === FilterType.CRITERIA}
                            isFilterCreation={true}
                            handleFilterCreation={handleCallback}
                            handleEquipmentTypeChange={handleEquipmentChange}
                            contentType={ElementType.FILTER}
                            validationsCount={validationsCount}
                        />
                    ) : (
                        <ExplicitNamingFilterDialogContent
                            open={
                                open &&
                                filterType === FilterType.EXPLICIT_NAMING
                            }
                            name={newNameList}
                            isFilterCreation={true}
                            handleFilterCreation={handleNamingFilterCallBack}
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
                            loadingCheckFilterName ||
                            equipmentType === null
                        }
                    >
                        {customTextValidationBtn}
                    </Button>
                </DialogActions>
            </Dialog>
            {renderPopup(
                isConfirmationPopupOpen,
                handleKeyPressed,
                intl,
                setOpenConfirmationPopup,
                handlePopupConfirmation
            )}
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

export default CreateFilterDialog;
