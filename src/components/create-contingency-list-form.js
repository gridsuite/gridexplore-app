/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Alert from '@material-ui/lab/Alert';

import { FormattedMessage, useIntl } from 'react-intl';

import { createContingencyList, elementExists } from '../utils/rest-api';

import { useSelector } from 'react-redux';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import PropTypes from 'prop-types';
import { ContingencyListType, ElementType } from '../utils/elementType';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles(() => ({}));

/**
 * Dialog to create a contingency
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 */
export const CreateContingencyListForm = ({ open, onClose }) => {
    const [contingencyListType, setContingencyListType] = React.useState(
        ContingencyListType.SCRIPT
    );

    const [contingencyListName, setContingencyListName] = React.useState('');
    const [contingencyListDescription, setContingencyListDescription] =
        React.useState('');
    const [contingencyListPrivacy, setContingencyListPrivacy] =
        React.useState('private');
    const [createContingencyListErr, setCreateContingencyListErr] =
        React.useState('');

    const [contingencyInvalid, setContingencyInvalid] = useState(false);
    const [loadingCheckContingencyName, setLoadingCheckContingencyName] =
        React.useState(false);
    const [contingencyNameChecked, setContingencyNameChecked] =
        React.useState(false);

    const classes = useStyles();
    const intl = useIntl();
    const timer = React.useRef();

    const activeDirectory = useSelector((state) => state.activeDirectory);

    const resetDialog = () => {
        setContingencyListName('');
        setContingencyListDescription('');
        setContingencyListPrivacy('private');
        setContingencyListType(ContingencyListType.SCRIPT);
        setContingencyNameChecked(false);
        setLoadingCheckContingencyName(false);
        setCreateContingencyListErr('');
    };

    const handleCloseDialog = () => {
        onClose();
        resetDialog();
    };

    const handleContingencyListDescriptionChanges = (e) => {
        setContingencyListDescription(e.target.value);
    };

    /**
     * on change input popup check if name already exist
     * @param name
     */
    const updateContingencyFormState = (name) => {
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
                        setCreateContingencyListErr(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error
                        );
                    });
            } else {
                setContingencyFormState(
                    intl.formatMessage({ id: 'nameEmpty' }),
                    false
                );
            }
        } else {
            setContingencyFormState('', false);
        }
        setLoadingCheckContingencyName(false);
    };

    const handleContingencyNameChanges = (name) => {
        setContingencyListName(name);
        setContingencyNameChecked(false);
        setLoadingCheckContingencyName(true);

        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            updateContingencyFormState(name);
        }, 700);
    };

    const setContingencyFormState = (errorMessage, isNameValid) => {
        setCreateContingencyListErr(errorMessage);
        setContingencyInvalid(!isNameValid);
        setContingencyNameChecked(isNameValid);
    };

    const handleChangeContingencyListPrivacy = (event) => {
        setContingencyListPrivacy(event.target.value);
    };

    const handleChangeContingencyListType = (event) => {
        setContingencyListType(event.target.value);
    };

    const handleCreateNewContingencyList = () => {
        if (contingencyListName === '') {
            setCreateContingencyListErr(
                intl.formatMessage({ id: 'elementNameErrorMsg' })
            );
            return;
        }

        let isPrivateContingencyList = contingencyListPrivacy === 'private';

        createContingencyList(
            contingencyListType,
            contingencyListName,
            contingencyListDescription,
            isPrivateContingencyList,
            activeDirectory
        ).then((res) => {
            if (res.ok) {
                onClose();
                resetDialog();
            } else {
                console.debug('Error when creating the contingency list');
                res.json()
                    .then((data) => {
                        setCreateContingencyListErr(
                            data.error + ' - ' + data.message
                        );
                    })
                    .catch((error) => {
                        setCreateContingencyListErr(
                            error.name + ' - ' + error.message
                        );
                    });
            }
        });
    };

    const handleKeyPressed = (event) => {
        if (event.key === 'Enter') {
            handleCreateNewContingencyList();
        }
    };
    return (
        <div>
            <Dialog
                fullWidth={true}
                open={open}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
                onKeyPress={handleKeyPressed}
            >
                <DialogTitle id="form-dialog-title">
                    <FormattedMessage id="createNewContingencyList" />
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <FormattedMessage id="createNewContingencyListDescription" />
                    </DialogContentText>
                    <div>
                        <TextField
                            onChange={(e) =>
                                handleContingencyNameChanges(e.target.value)
                            }
                            autoFocus
                            margin="dense"
                            value={contingencyListName}
                            type="text"
                            style={{ width: '90%' }}
                            label=<FormattedMessage id="contingencyListName" />
                        />
                        {loadingCheckContingencyName && (
                            <div
                                style={{
                                    display: 'inline-block',
                                    verticalAlign: 'bottom',
                                }}
                            >
                                <CircularProgress
                                    className={classes.progress}
                                    size="1rem"
                                />
                            </div>
                        )}
                        {contingencyNameChecked && (
                            <div
                                style={{
                                    display: 'inline-block',
                                    verticalAlign: 'bottom',
                                }}
                            >
                                <CheckIcon style={{ color: 'green' }} />
                            </div>
                        )}
                    </div>
                    <TextField
                        onChange={(e) =>
                            handleContingencyListDescriptionChanges(e)
                        }
                        margin="dense"
                        value={contingencyListDescription}
                        type="text"
                        style={{ width: '90%' }}
                        label=<FormattedMessage id="contingencyListDescription" />
                    />

                    <RadioGroup
                        aria-label="gender"
                        name="gender1"
                        value={contingencyListType}
                        onChange={handleChangeContingencyListType}
                        style={{ paddingBottom: '20px' }}
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
                        aria-label=""
                        name="contingencyListPrivacy"
                        value={contingencyListPrivacy}
                        onChange={handleChangeContingencyListPrivacy}
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
                    {createContingencyListErr !== '' && (
                        <Alert severity="error">
                            {createContingencyListErr}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog()} variant="text">
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        onClick={() => handleCreateNewContingencyList()}
                        variant="outlined"
                        disabled={!contingencyNameChecked || contingencyInvalid}
                    >
                        <FormattedMessage id="create" />
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

CreateContingencyListForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CreateContingencyListForm;
