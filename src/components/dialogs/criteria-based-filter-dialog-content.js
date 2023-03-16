/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useEffect, useRef, useState } from 'react';
import { MenuItem, Grid, Select, FormControl, InputLabel } from '@mui/material';
import { getContingencyList, getFilterById } from '../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';
import {
    ContingencyListType,
    ElementType,
    FilterType,
} from '../../utils/elementType';
import {
    contingencyListEquipmentDefinition,
    filterEquipmentDefinition,
} from '../../utils/equipment-types';
import { renderPopup } from './create-filter-dialog';

function deepCopy(aObject) {
    if (!aObject) {
        return aObject;
    }
    let v;
    let bObject = Array.isArray(aObject) ? [] : {};
    for (const k in aObject) {
        v = aObject[k];
        bObject[k] = typeof v === 'object' ? deepCopy(v) : v;
    }
    return bObject;
}

function generateDefaultValue(val, originalValue) {
    if (originalValue != null) return { value: originalValue };
    return {
        value: deepCopy(val.defaultValue) || deepCopy(val.type.defaultValue),
    };
}

const SingleFilter = ({ filter, definition, onChange, validationsCount }) => {
    const localChange = (newVal, veto) => {
        filter.value = newVal;
        onChange(veto);
    };
    return definition.type.renderer({
        initialValue: filter.value,
        onChange: localChange,
        titleMessage: definition.name,
        enumValues: definition.enumValues,
        validationsCount,
    });
};

export const FilterTypeSelection = ({
    type,
    onChange,
    equipmentDefinition,
    isEdited,
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
                    onChange={(e) => onChange(e.target.value, isEdited)}
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

const backToFrontTweak = (response) => {
    if (
        !response?.equipmentFilterForm ||
        !['LINE', 'HVDC_LINE'].includes(response.equipmentType)
    ) {
        return response;
    }

    const props1 = response.equipmentFilterForm.freeProperties1;
    const props2 = response.equipmentFilterForm.freeProperties2;
    let ret = { ...response };
    let eff = { ...response.equipmentFilterForm };
    delete eff.freeProperties1;
    delete eff.freeProperties2;
    ret.equipmentFilterForm = eff;
    const allKeys = new Set();
    const biProps = {};
    if (props1) Object.keys(props1).forEach((k) => allKeys.add(k));
    if (props2) Object.keys(props2).forEach((k) => allKeys.add(k));
    allKeys.forEach((k) => {
        const biProp = { name: k };
        const values1 = props1[k];
        if (values1) biProp.values1 = values1;
        const values2 = props2[k];
        if (values2) biProp.values2 = values2;
        biProps[k] = biProp;
    });
    eff.freePropertiesP = biProps;
    return ret;
};

const frontToBackTweak = (filter) => {
    if (
        !filter?.equipmentFilterForm ||
        !['LINE', 'HVDC_LINE'].includes(
            filter.equipmentFilterForm.equipmentType
        )
    ) {
        return filter;
    }

    const biProps = filter.equipmentFilterForm.freePropertiesP;
    let ret = { ...filter };
    let eff = { ...ret.equipmentFilterForm };
    delete eff.freePropertiesP;
    ret.equipmentFilterForm = eff;
    const props1 = {};
    const props2 = {};
    if (biProps) {
        Object.entries(biProps).forEach(([k, bp]) => {
            if (!bp) return;
            const values1 = bp.values1;
            const values2 = bp.values2;
            if (values1) {
                props1[bp.name] = values1;
            }
            if (values2) {
                props2[bp.name] = values2;
            }
        });
    }

    eff.freeProperties1 = props1;
    eff.freeProperties2 = props2;
    return ret;
};

export const CriteriaBasedFilterDialogContent = ({
    id,
    open,
    contentType,
    handleFilterCreation,
    handleEquipmentTypeChange,
    validationsCount,
}) => {
    const [initialFilter, setInitialFilter] = useState(null);
    const [equipmentType, setEquipmentType] = useState(null);
    const [currentFormEdit, setCurrentFormEdit] = useState({
        type: { value: equipmentType },
    });
    const currentFilter = useRef(null);
    const currentFilterToSend = useRef({});
    const { snackError } = useSnackMessage();
    const openRef = useRef(null);
    openRef.current = open;
    const intl = useIntl();
    const isCurrentFormEdited = useRef({ isFormEdited: false });
    const [isConfirmationPopupOpen, setOpenConfirmationPopup] = useState(false);
    const [newEquipmentType, setNewEquipmentType] = useState(null);
    function getEquipmentsDefinition() {
        return contentType === ElementType.FILTER
            ? filterEquipmentDefinition
            : contingencyListEquipmentDefinition;
    }

    useEffect(() => {
        if (id !== null && openRef.current) {
            if (contentType === ElementType.FILTER) {
                getFilterById(id)
                    .then((response) => {
                        setInitialFilter(backToFrontTweak(response));
                        let eType = response.equipmentFilterForm.equipmentType;
                        setEquipmentType(eType);
                        setCurrentFormEdit({
                            equipmentType: {
                                value: eType,
                            },
                        });
                    })
                    .catch((error) => {
                        snackError({
                            messageTxt: error.message,
                            headerId: 'cannotRetrieveFilter',
                        });
                    });
            } else if (contentType === ElementType.CONTINGENCY_LIST) {
                getContingencyList(ContingencyListType.FORM, id)
                    .then((response) => {
                        setInitialFilter(response);
                        setEquipmentType(response.equipmentType);
                        setCurrentFormEdit({
                            equipmentType: {
                                value: response.equipmentType,
                            },
                        });
                    })
                    .catch((error) => {
                        snackError({
                            messageTxt: error.message,
                            headerId: 'cannotRetrieveContingencyList',
                        });
                    });
            }
        } else {
            setCurrentFormEdit({
                equipmentType: { value: null },
            });
            currentFilter.current = null;
            setInitialFilter(null);
            setEquipmentType(null);
        }
    }, [id, contentType, snackError]);

    function onChange(newVal) {
        if (contentType !== ElementType.FILTER) {
            const newFilter = { id, type: FilterType.CRITERIA, ...newVal };
            currentFilter.current = newFilter;
        } else if (newVal) {
            // data model is not the same: filter has a sub-object 'equipmentFilterForm'
            const newFilter = { id, type: FilterType.CRITERIA };
            newFilter.equipmentFilterForm = newVal;
            currentFilter.current = frontToBackTweak(newFilter);
        }
    }

    function validVoltageValues(obj) {
        let value1NotNull =
            obj.value.hasOwnProperty('value1') && obj.value['value1'] !== null;
        if (obj.value.type !== 'RANGE') {
            return value1NotNull;
        }
        let value2NotNull =
            obj.value.hasOwnProperty('value2') && obj.value['value2'] !== null;
        return value1NotNull && value2NotNull;
    }

    const editDone = (veto) => {
        let res = {};
        Object.entries(currentFormEdit).forEach(([key, obj]) => {
            if (key.startsWith('nominalVoltage') && !validVoltageValues(obj)) {
                // dont send nominalVoltage with null value1/value2 properties
                res[key] = null;
            } else {
                res[key] = obj.value;
            }
        });
        onChange(res);
        const newFilter = { id, type: FilterType.CRITERIA };
        newFilter.equipmentFilterForm = { ...res };
        currentFilterToSend.current = frontToBackTweak(newFilter);
        handleFilterCreation(currentFilterToSend.current, veto);
        const hasEdition = Object.values(res).some(
            (val) =>
                val &&
                ((Array.isArray(val) && val.length > 0) ||
                    (typeof val === 'object' && Object.keys(val).length > 0))
        );
        if (id === undefined && hasEdition) {
            isCurrentFormEdited.current.isFormEdited = true;
        }
    };

    const changeEquipmentType = (newType) => {
        // TODO: should reset all fields in currentFormEdit
        if (isCurrentFormEdited.current.isFormEdited) {
            setOpenConfirmationPopup(true);
            setNewEquipmentType(newType);
        } else {
            handleSelectionEquipmentTypeChange(newType);
        }
    };

    const handleSelectionEquipmentTypeChange = (newType) => {
        isCurrentFormEdited.current.isFormEdited = false;
        currentFormEdit.equipmentType = { value: newType };
        setEquipmentType(newType);
        if (id == null && contentType === ElementType.FILTER)
            handleEquipmentTypeChange(newType);
        editDone(false);
    };

    const handlePopupConfirmation = () => {
        setOpenConfirmationPopup(false);
        handleSelectionEquipmentTypeChange(newEquipmentType);
    };

    const renderFilter = (key, definition) => {
        if (initialFilter !== null) {
            if (currentFormEdit[key] === undefined) {
                currentFormEdit[key] = generateDefaultValue(
                    definition,
                    contentType === ElementType.FILTER
                        ? initialFilter.equipmentFilterForm[key]
                        : initialFilter[key]
                );
            }
        } else {
            currentFormEdit[key] = generateDefaultValue(definition, null);
        }
        return (
            <SingleFilter
                key={key}
                filter={currentFormEdit[key]}
                definition={definition}
                onChange={editDone}
                validationsCount={validationsCount}
            />
        );
    };

    const renderSpecific = () => {
        if (equipmentType !== null) {
            return Object.entries(
                getEquipmentsDefinition()[equipmentType].fields
            ).map(([key, definition]) => {
                return renderFilter(key, definition);
            });
        }
    };

    return (
        <>
            <Grid container>
                {FilterTypeSelection({
                    type: equipmentType,
                    onChange: changeEquipmentType,
                    equipmentDefinition: getEquipmentsDefinition(),
                })}
                {renderSpecific()}
                {renderPopup(
                    isConfirmationPopupOpen,
                    intl,
                    setOpenConfirmationPopup,
                    handlePopupConfirmation
                )}
            </Grid>
        </>
    );
};

export default CriteriaBasedFilterDialogContent;
