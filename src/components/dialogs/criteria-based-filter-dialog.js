/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { MenuItem, Grid, Select, FormControl, InputLabel } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import {
    getContingencyList,
    getFilterById,
    saveFilter,
    saveFormContingencyList,
} from '../../utils/rest-api';
import { useSnackMessage } from '../../utils/messages';
import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../../utils/elementType';
import {
    contingencyListEquipmentDefinition,
    filterEquipmentDefinition,
} from '../../utils/equipment-types';
import CriteriaFilterDialogContent from './criteria-filter-dialog-content';

const useStyles = makeStyles(() => ({
    controlItem: {
        justifyContent: 'flex-end',
    },
    idText: {
        padding: 8,
    },
    dialogPaper: {
        minWidth: '705px',
        minHeight: '500px',
        margin: 'auto',
    },
    filtersEditor: {
        minWidth: '570px',
        margin: 'auto',
    },
}));

// function deepCopy(aObject) {
//     if (!aObject) {
//         return aObject;
//     }
//     let v;
//     let bObject = Array.isArray(aObject) ? [] : {};
//     for (const k in aObject) {
//         v = aObject[k];
//         bObject[k] = typeof v === 'object' ? deepCopy(v) : v;
//     }
//     return bObject;
// }

// function generateDefaultValue(val, originalValue) {
//     if (originalValue != null) return { value: originalValue };
//     return {
//         value: deepCopy(val.defaultValue) || deepCopy(val.type.defaultValue),
//     };
// }

// const SingleFilter = ({ filter, definition, onChange }) => {
//     const localChange = (newVal) => {
//         filter.value = newVal;
//         onChange();
//     };
//     return definition.type.renderer({
//         initialValue: filter.value,
//         onChange: localChange,
//         titleMessage: definition.name,
//     });
// };

export const FilterTypeSelection = ({
    type,
    onChange,
    equipmentDefinition,
}) => {
    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel>
                    <FormattedMessage id={'equipmentType'} />
                </InputLabel>

                <Select
                    label={<FormattedMessage id={'equipmentType'} />}
                    value={type === null ? '' : type}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {Object.entries(equipmentDefinition).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                            <FormattedMessage id={value.label} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </>
    );
};

export const CriteriaBasedFilterDialog = ({
    id,
    open,
    onClose,
    onError,
    title,
    contentType,
    isFilterCreation,
    handleFilterCreation,
}) => {
    const [initialFilter, setInitialFilter] = useState(null);
    //const [filterType, setFilterType] = useState(null);
    // const [currentFormEdit, setCurrentFormEdit] = useState({
    //     type: { value: filterType },
    // });
    const currentFilter = useRef(null);
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const classes = useStyles();
    const { snackError } = useSnackMessage();
    const openRef = useRef(null);
    openRef.current = open;

    // function getEquipmentsDefinition() {
    //     return contentType === ElementType.FILTER
    //         ? filterEquipmentDefinition
    //         : contingencyListEquipmentDefinition;
    // }

    // useEffect(() => {
    //     console.log('from criteria dialog useeffect');
    //     if (id !== null && openRef.current) {
    //         if (contentType === ElementType.FILTER) {
    //             getFilterById(id)
    //                 .then((response) => {
    //                     setInitialFilter(response);
    //                     setFilterType(
    //                         response.equipmentFilterForm.equipmentType
    //                     );
    //                     setCurrentFormEdit({
    //                         equipmentType: {
    //                             value: response.equipmentFilterForm
    //                                 .equipmentType,
    //                         },
    //                     });
    //                 })
    //                 .catch((errmsg) => {
    //                     snackError(errmsg, 'cannotRetrieveFilter');
    //                 });
    //         } else if (contentType === ElementType.CONTINGENCY_LIST) {
    //             getContingencyList(ContingencyListType.FORM, id)
    //                 .then((response) => {
    //                     setInitialFilter(response);
    //                     setFilterType(response.equipmentType);
    //                     setCurrentFormEdit({
    //                         equipmentType: {
    //                             value: response.equipmentType,
    //                         },
    //                     });
    //                 })
    //                 .catch((errmsg) => {
    //                     snackError(errmsg, 'cannotRetrieveContingencyList');
    //                 });
    //         }
    //     } else {
    //         setCurrentFormEdit({
    //             equipmentType: { value: null },
    //         });
    //         currentFilter.current = null;
    //         setInitialFilter(null);
    //         setFilterType(null);
    //     }
    // }, [id, contentType, snackError]);

    useEffect(() => {
        console.log('from criteria dialog useeffect initialFilter', initialFilter);
        if (initialFilter !== null) {
            setBtnSaveListDisabled(initialFilter.transient !== true);
        }
    }, [initialFilter]);

    // function onChange(newVal) {
    //     console.log('from criteria dialog on change');
    //     currentFilter.current = {};
    //     currentFilter.current.id = id;
    //     currentFilter.current.type = FilterType.CRITERIA;
    //     if (contentType === ElementType.FILTER) {
    //         // data model is not the same: filter has a sub-object 'equipmentFilterForm'
    //         currentFilter.current.equipmentFilterForm = newVal;
    //     } else {
    //         for (const k in newVal) currentFilter.current[k] = newVal[k];
    //     }
    //     setBtnSaveListDisabled(false);
    // }

    const handleCancel = () => {
        console.log('from criteria dialog handleCancel');
        onClose();
        currentFilter.current = null;
        // setCurrentFormEdit({
        //     equipmentType: { value: null },
        // });
        setInitialFilter(null);
        //setFilterType(null);
        setBtnSaveListDisabled(true);
    };

    const handleValidate = () => {
        console.log('enter handleValidate in criteria dialog', isFilterCreation);
        if (!isFilterCreation) {
            if (contentType === ElementType.FILTER) {
                saveFilter(currentFilter.current)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            } else if (contentType === ElementType.CONTINGENCY_LIST) {
                saveFormContingencyList(currentFilter.current)
                    .then()
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            }
            handleCancel();
        } else {
            handleFilterCreation(currentFilter.current);
        }
    };

    // function validVoltageValues(obj) {
    //     console.log('from criteria dialog validVoltageValues');
    //     let value1NotNull =
    //         obj.value.hasOwnProperty('value1') && obj.value['value1'] !== null;
    //     if (obj.value.type !== 'RANGE') {
    //         return value1NotNull;
    //     }
    //     let value2NotNull =
    //         obj.value.hasOwnProperty('value2') && obj.value['value2'] !== null;
    //     return value1NotNull && value2NotNull;
    // }

    // const editDone = () => {
    //     console.log('from criteria dialog editDone');
    //     let res = {};
    //     Object.entries(currentFormEdit).forEach(([key, obj]) => {
    //         if (key.startsWith('nominalVoltage') && !validVoltageValues(obj)) {
    //             // dont send nominalVoltage with null value1/value2 properties
    //             res[key] = null;
    //         } else {
    //             res[key] = obj.value;
    //         }
    //     });
    //    // onChange(res);
    // };

    // const changeFilterType = (newType) => {
    //     // TODO: should reset all fields in currentFormEdit
    //     currentFormEdit.equipmentType = { value: newType };
    //     setFilterType(newType);
    //     editDone();
    // };

    // const renderFilter = (key, definition) => {

    //     if (initialFilter !== null) {
    //         if (currentFormEdit[key] === undefined) {
    //             currentFormEdit[key] = generateDefaultValue(
    //                 definition,
    //                 contentType === ElementType.FILTER
    //                     ? initialFilter.equipmentFilterForm[key]
    //                     : initialFilter[key]
    //             );
    //         }
    //     } else {
    //         currentFormEdit[key] = generateDefaultValue(definition, null);
    //     }
    //     return (
    //         <SingleFilter
    //             key={key}
    //             filter={currentFormEdit[key]}
    //             definition={definition}
    //             onChange={editDone}
    //         />
    //     );
    // };

    // const renderSpecific = () => {
    //     if (filterType !== null) {
    //         return Object.entries(
    //             getEquipmentsDefinition()[filterType].fields
    //         ).map(([key, definition]) => {
    //             return renderFilter(key, definition);
    //         });
    //     }
    // };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={onClose}
            aria-labelledby="dialog-title-filters-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <CriteriaFilterDialogContent
                    id={id}
                    open={open}
                    contentType={contentType}
                />
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
