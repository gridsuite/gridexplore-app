/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const SingleFilter = ({ filter, definition, onChange }) => {
    const localChange = (newVal) => {
        console.log('localchange', newVal);
        filter.value = newVal;
        onChange();
    };
    return definition.type.renderer({
        initialValue: filter.value,
        onChange: localChange,
        titleMessage: definition.name,
    });
};

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

export const CriteriaFilterDialogContent = ({
    id,
    open,
    contentType,
    handleFilterCreation,
    handleEquipementChange,
}) => {
    const [initialFilter, setInitialFilter] = useState(null);
    const [filterType, setFilterType] = useState(null);
    const [currentFormEdit, setCurrentFormEdit] = useState({
        type: { value: filterType },
    });
    const currentFilter = useRef(null);
    const currentFilterToSend = useRef({});
    const { snackError } = useSnackMessage();
    const openRef = useRef(null);
    openRef.current = open;

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
                        setInitialFilter(response);
                        setFilterType(
                            response.equipmentFilterForm.equipmentType
                        );
                        setCurrentFormEdit({
                            equipmentType: {
                                value: response.equipmentFilterForm
                                    .equipmentType,
                            },
                        });
                    })
                    .catch((errmsg) => {
                        snackError({
                            messageTxt: errmsg,
                            headerId: 'cannotRetrieveFilter',
                        });
                    });
            } else if (contentType === ElementType.CONTINGENCY_LIST) {
                getContingencyList(ContingencyListType.FORM, id)
                    .then((response) => {
                        setInitialFilter(response);
                        setFilterType(response.equipmentType);
                        setCurrentFormEdit({
                            equipmentType: {
                                value: response.equipmentType,
                            },
                        });
                    })
                    .catch((errmsg) => {
                        snackError({
                            messageTxt: errmsg,
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
            setFilterType(null);
        }
    }, [id, contentType, snackError]);

    function onChange(newVal) {
        currentFilter.current = {};
        currentFilter.current.id = id;
        currentFilter.current.type = FilterType.CRITERIA;
        if (contentType === ElementType.FILTER) {
            // data model is not the same: filter has a sub-object 'equipmentFilterForm'
            currentFilter.current.equipmentFilterForm = newVal;
        } else {
            for (const k in newVal) currentFilter.current[k] = newVal[k];
        }

        // console.log('currentFilter.current.equipmentFilterForm : ', currentFilter.current.equipmentFilterForm);
        // if (contentType === ElementType.FILTER) {
        //     handleFilterCreation({
        //         id: id,
        //         type: FilterType.CRITERIA,
        //         equipmentFilterForm: {...currentFilter.current.equipmentFilterForm, newVal}
        //     });
        // } else {
        //     handleFilterCreation({ ...newVal });
        // }
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

    const editDone = () => {
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
        currentFilterToSend.current.id = id;
        currentFilterToSend.current.type = FilterType.CRITERIA;
        currentFilterToSend.current.equipmentFilterForm = { ...res };
        handleFilterCreation(currentFilterToSend.current);
    };

    const changeFilterType = (newType) => {
        // TODO: should reset all fields in currentFormEdit
        console.log('newType', newType);
        currentFormEdit.equipmentType = { value: newType };
        setFilterType(newType);
        handleEquipementChange(newType);
        editDone();
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
            />
        );
    };

    const renderSpecific = () => {
        if (filterType !== null) {
            return Object.entries(
                getEquipmentsDefinition()[filterType].fields
            ).map(([key, definition]) => {
                return renderFilter(key, definition);
            });
        }
    };

    return (
        <>
            <Grid
                container
                spacing={1}
                style={{ width: '100%', padding: 10, paddingRight: 20 }}
            >
                {FilterTypeSelection({
                    type: filterType,
                    onChange: changeFilterType,
                    equipmentDefinition: getEquipmentsDefinition(),
                })}
                {renderSpecific()}
            </Grid>
        </>
    );
};

export default CriteriaFilterDialogContent;
