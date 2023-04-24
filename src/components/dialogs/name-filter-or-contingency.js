/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { elementExists } from '../../utils/rest-api';
import CircularProgress from '@mui/material/CircularProgress';
import CheckIcon from '@mui/icons-material/Check';
import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';
const useStyles = makeStyles((theme) => ({
    inputLegend: {
        backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
        backgroundColor: theme.palette.background.paper,
        padding: '0 8px 0 8px',
    },
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

const NameComponent = ({
    initialValue,
    onChange,
    titleMessage,
    isCreation,
    contentType,
}) => {
    const [value, setValue] = useState(initialValue);
    const [newName, setNewName] = useState('');

    const [loadingCheckName, setLoadingCheckName] = useState(false);
    const [nameValid, setNameValid] = useState(false);
    const timer = React.useRef();
    const intl = useIntl();
    const classes = useStyles();

    const activeDirectory = useSelector((state) => state.activeDirectory);

    const setFormState = (errorMessage, isNameValid) => {
        setNameValid(isNameValid);
    };

    /**
     * on change input check if name already exist
     * @param name
     */
    const updateFormState = (name) => {
        if (name !== '') {
            //If the name is not only white spaces
            if (name.replace(/ /g, '') !== '') {
                elementExists(activeDirectory, name, contentType)
                    .then((data) => {
                        setFormState(
                            data
                                ? intl.formatMessage({
                                      id: 'nameAlreadyUsed',
                                  })
                                : '',
                            !data
                        );
                    })
                    .catch((error) => {
                        setFormState(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error.message,
                            false
                        );
                    })
                    .finally(() => {
                        setLoadingCheckName(false);
                    });
            } else {
                setFormState(intl.formatMessage({ id: 'nameEmpty' }), false);
                setLoadingCheckName(false);
            }
        } else {
            setFormState('', false);
            setLoadingCheckName(false);
        }
    };
    const handleNameChanges = (name) => {
        setValue(name);
        setNewName(name);

        onChange(name);
        setLoadingCheckName(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            updateFormState(name);
        }, 700);
    };

    const renderNameStatus = () => {
        const showOk = newName !== '' && !loadingCheckName && nameValid;
        return (
            <div
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                }}
            >
                {loadingCheckName && (
                    <CircularProgress
                        className={classes.progress}
                        size="1rem"
                    />
                )}
                {showOk && <CheckIcon style={{ color: 'green' }} />}
            </div>
        );
    };
    /** don't show the name field if not edit mode */
    if (isCreation) {
        return null;
    }
    return (
        <>
            <TextField
                onChange={(e) => handleNameChanges(e.target.value)}
                margin="dense"
                value={value || initialValue}
                type="text"
                error={!!newName && !nameValid && !loadingCheckName}
                style={{ width: '100%' }}
                label={<FormattedMessage id={titleMessage} />}
            />
            {renderNameStatus()}
        </>
    );
};

NameComponent.propTypes = {
    initialValue: PropTypes.string,
    titleMessage: PropTypes.string,
    onChange: PropTypes.func,
    isCreation: PropTypes.bool,
    contentType: PropTypes.string,
};

export default NameComponent;
