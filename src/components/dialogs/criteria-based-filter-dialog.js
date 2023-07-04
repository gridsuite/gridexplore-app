/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import React, { useCallback, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import {
    saveFilter,
    saveCriteriaBasedContingencyList,
} from '../../utils/rest-api';
import { ElementType } from '../../utils/elementType';
import CriteriaBasedFilterDialogContent from './criteria-based-filter-dialog-content';
import NameWrapper from './name-wrapper';

const useStyles = makeStyles(() => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

export const CriteriaBasedFilterDialog = ({
    id,
    open,
    onClose,
    onError,
    title,
    contentType,
    isFilterCreation,
    handleFilterCreation,
    name,
}) => {
    const [currentFilter, setCurrentFilter] = useState(null);
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const [validationsCount, setValidationsCount] = useState(0);
    const [currentName, setCurrentName] = useState(name);
    const [isNameValid, setIsNameValid] = useState(true);
    const classes = useStyles();
    const openRef = useRef(null);
    openRef.current = open;

    const handleEditCallback = (filter, veto) => {
        if (contentType === ElementType.CONTINGENCY_LIST) {
            setCurrentFilter(
                Object.assign({ id: filter.id }, filter.equipmentFilterForm)
            );
        } else if (!veto) {
            setCurrentFilter({
                ...filter,
            });
        } else {
            setCurrentFilter(null);
        }
        setBtnSaveListDisabled(!isNameValid);
    };

    const nameCheckCallBack = (isValid, newName) => {
        setIsNameValid(isValid);
        setCurrentName(newName);
        setBtnSaveListDisabled(!isValid);
    };

    const handleCancel = () => {
        onClose();
    };

    const onFetchedDataCallback = useCallback((value) => {
        setCurrentFilter(value);
    }, []);

    const handleValidate = () => {
        setValidationsCount((prev) => prev + 1);
        if (!currentFilter) {
            return;
        } else if (isFilterCreation) {
            handleFilterCreation(currentFilter);
        } else {
            if (contentType === ElementType.FILTER) {
                saveFilter(currentFilter, currentName)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            } else if (contentType === ElementType.CONTINGENCY_LIST) {
                saveCriteriaBasedContingencyList(currentFilter, currentName)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            }
            handleCancel();
        }
    };
    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={onClose}
            aria-labelledby="dialog-title-filters-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent style={{ maxHeight: '60vh' }}>
                <NameWrapper
                    titleMessage="nameProperty"
                    initialValue={name}
                    contentType={contentType}
                    handleNameValidation={nameCheckCallBack}
                >
                    <CriteriaBasedFilterDialogContent
                        id={id}
                        open={open}
                        contentType={contentType}
                        handleFilterCreation={handleEditCallback}
                        validationsCount={validationsCount}
                        onFetchedDataCallback={onFetchedDataCallback}
                    />
                </NameWrapper>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleValidate}
                    variant="outlined"
                    disabled={btnSaveListDisabled}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CriteriaBasedFilterDialog;
