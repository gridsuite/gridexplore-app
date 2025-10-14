/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    ArrayAction,
    CONTINGENCY_LIST_EQUIPMENTS,
    DescriptionField,
    DirectoryItemsInput,
    ElementType,
    EquipmentType,
    FieldConstants,
    FormEquipment,
    UniqueNameInput,
} from '@gridsuite/commons-ui';
import {
    Checkbox,
    Divider,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useCallback, useState } from 'react';
import {
    blue,
    brown,
    cyan,
    green,
    indigo,
    lightBlue,
    lightGreen,
    lime,
    orange,
    pink,
    red,
    teal,
} from '@mui/material/colors';
import { useFormContext, useWatch } from 'react-hook-form';
import { AppState } from '../../../../redux/types';
import { ContingencyFieldConstants, FilterElement, FilterSubEquipments } from '../../../../utils/contingency-list.type';
import { FilterBasedContingencyListVisualizationPanel } from './filter-based-contingency-list-visualization-panel';
import { isSubstationOrVoltageLevelFilter } from '../contingency-list-utils';

const equipmentTypes: string[] = [
    EquipmentType.SUBSTATION,
    EquipmentType.VOLTAGE_LEVEL,
    EquipmentType.LINE,
    EquipmentType.TWO_WINDINGS_TRANSFORMER,
    EquipmentType.THREE_WINDINGS_TRANSFORMER,
    EquipmentType.GENERATOR,
    EquipmentType.BATTERY,
    EquipmentType.LOAD,
    EquipmentType.SHUNT_COMPENSATOR,
    EquipmentType.STATIC_VAR_COMPENSATOR,
    EquipmentType.HVDC_LINE,
    EquipmentType.DANGLING_LINE,
];

const equipmentColorsMap: Map<string, string> = new Map([
    [EquipmentType.SUBSTATION, pink[700]],
    [EquipmentType.VOLTAGE_LEVEL, orange[700]],
    [EquipmentType.LINE, indigo[700]],
    [EquipmentType.TWO_WINDINGS_TRANSFORMER, blue[700]],
    [EquipmentType.THREE_WINDINGS_TRANSFORMER, lightBlue[700]],
    [EquipmentType.GENERATOR, green[700]],
    [EquipmentType.BATTERY, lightGreen[700]],
    [EquipmentType.LOAD, brown[700]],
    [EquipmentType.SHUNT_COMPENSATOR, red[700]],
    [EquipmentType.STATIC_VAR_COMPENSATOR, lime[700]],
    [EquipmentType.HVDC_LINE, teal[700]],
    [EquipmentType.DANGLING_LINE, cyan[700]],
]);

export default function ContingencyListFilterBasedForm() {
    const { setValue, getValues } = useFormContext();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
    const [isDataOutdated, setIsDataOutdated] = useState<boolean>(false);

    const filters: FilterElement[] = useWatch({ name: FieldConstants.FILTERS }) as unknown as FilterElement[];
    const substationAndVLFilters = filters.filter(isSubstationOrVoltageLevelFilter);
    const filtersSubEquipments: FilterSubEquipments[] = useWatch({
        name: ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER,
    }) as unknown as FilterSubEquipments[];

    const handleFilterRowClick = useCallback((clickedFilterId: string, currentFilterId: string | null) => {
        if (clickedFilterId !== currentFilterId) {
            setSelectedFilterId(clickedFilterId);
        }
    }, []);

    const filterEquipmentTypes =
        selectedFilterId &&
        filtersSubEquipments?.find((value) => value[ContingencyFieldConstants.FILTER_ID] === selectedFilterId)?.[
            ContingencyFieldConstants.SUB_EQUIPMENT_TYPES
        ];

    const handleEquipmentRowClick = useCallback(
        (equipmentType: string, isEquipmentSelected: boolean, selectedFilterIdP: string | null) => {
            const currentSubEquipmentsByFilters: FilterSubEquipments[] = getValues(
                ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER
            );
            setValue(
                ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER,
                currentSubEquipmentsByFilters.map((value) => {
                    if (value[ContingencyFieldConstants.FILTER_ID] === selectedFilterIdP) {
                        // we either add or remove the clicked equipment from the list of subEquipments
                        // depending on if the equipment is already selected or not
                        const updatedSubEquipments = isEquipmentSelected
                            ? value[ContingencyFieldConstants.SUB_EQUIPMENT_TYPES].filter(
                                  (subEquipment: string) => subEquipment !== equipmentType
                              )
                            : [...value[ContingencyFieldConstants.SUB_EQUIPMENT_TYPES], equipmentType];

                        return {
                            ...value,
                            [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: updatedSubEquipments,
                        };
                    }
                    // for the other filters, we just return the value as is
                    return value;
                }),
                { shouldDirty: true }
            );
            setIsDataOutdated(true);
        },
        [setValue, getValues]
    );

    const handleFilterOnChange = useCallback(
        (_currentFilters: any, action?: ArrayAction, filter?: FilterElement) => {
            if (!action || !filter) {
                console.error('Action or filter is missing in handleFilterOnChange');
                return;
            }
            if (isSubstationOrVoltageLevelFilter(filter)) {
                const currentSubEquipmentsByFilters = getValues(
                    ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER
                );
                if (action === ArrayAction.ADD) {
                    const newFilterSubEquipments = {
                        [ContingencyFieldConstants.FILTER_ID]: filter.id,
                        [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: [],
                    };
                    setValue(ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER, [
                        ...currentSubEquipmentsByFilters,
                        newFilterSubEquipments,
                    ]);
                } else if (action === ArrayAction.REMOVE) {
                    setValue(
                        ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER,
                        currentSubEquipmentsByFilters.filter(
                            (value: FilterSubEquipments) => value[ContingencyFieldConstants.FILTER_ID] !== filter.id
                        )
                    );
                }
            }
            setIsDataOutdated(true);
        },
        [setValue, getValues]
    );

    return (
        <Grid container spacing={2}>
            <Grid item container direction="column" xs={8} spacing={2}>
                <Grid item>
                    <UniqueNameInput
                        name={FieldConstants.NAME}
                        label="nameProperty"
                        elementType={ElementType.CONTINGENCY_LIST}
                        activeDirectory={activeDirectory}
                    />
                </Grid>
                <Grid item>
                    <DescriptionField />
                </Grid>
                <Grid item>
                    <FormattedMessage id="Filters" />
                    <DirectoryItemsInput
                        titleId="FiltersListsSelection"
                        label=""
                        name={FieldConstants.FILTERS}
                        elementType={ElementType.FILTER}
                        equipmentColorsMap={equipmentColorsMap}
                        equipmentTypes={equipmentTypes}
                        onChange={handleFilterOnChange}
                    />
                </Grid>
                {substationAndVLFilters.length > 0 && (
                    <Grid item container>
                        <Grid item xs={6}>
                            <TableContainer component={Paper} sx={{ height: '100%', border: 0.5 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <FormattedMessage id="contingencyList.filterBased.filtersTableColumn" />
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {substationAndVLFilters.map((filterRow) => (
                                            <TableRow
                                                key={filterRow.id}
                                                hover
                                                onClick={() => handleFilterRowClick(filterRow.id, selectedFilterId)}
                                                selected={filterRow.id === selectedFilterId}
                                            >
                                                <TableCell component="th" scope="row">
                                                    {filterRow.name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                        <Grid item xs={6}>
                            <TableContainer component={Paper} sx={{ height: '100%', border: 0.5 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <FormattedMessage id="contingencyList.filterBased.subEquipmentsTableColumn" />
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filterEquipmentTypes &&
                                            Object.values(CONTINGENCY_LIST_EQUIPMENTS).map(
                                                (equipmentRow: FormEquipment) => {
                                                    const isEquipmentSelected = filterEquipmentTypes.includes(
                                                        equipmentRow.id
                                                    );
                                                    return (
                                                        <TableRow
                                                            key={equipmentRow.id}
                                                            hover
                                                            onClick={() =>
                                                                handleEquipmentRowClick(
                                                                    equipmentRow.id,
                                                                    isEquipmentSelected,
                                                                    selectedFilterId
                                                                )
                                                            }
                                                            selected={isEquipmentSelected}
                                                        >
                                                            <TableCell padding="checkbox">
                                                                <Checkbox checked={isEquipmentSelected} />
                                                                <FormattedMessage id={equipmentRow.label} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                            )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                )}
            </Grid>
            <Grid item>
                <Divider orientation="vertical" />
            </Grid>
            <FilterBasedContingencyListVisualizationPanel
                isDataOutdated={isDataOutdated}
                setIsDataOutdated={setIsDataOutdated}
            />
        </Grid>
    );
}
