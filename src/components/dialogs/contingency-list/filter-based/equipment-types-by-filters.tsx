/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    CONTINGENCY_LIST_EQUIPMENTS,
    ContingencyListEquipment,
    GridSection,
    OverflowableTableCell,
    OverflowableTableCellWithCheckbox,
} from '@gridsuite/commons-ui';
import {
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { ContingencyFieldConstants, FilterElement, FilterSubEquipments } from '../../../../utils/contingency-list.type';

interface EquipmentTypesByFiltersProps {
    substationAndVLFilters: ReadonlyArray<FilterElement>;
    setIsDataOutdated: (value: boolean) => void;
}

function EquipmentTypesByFilters({
    substationAndVLFilters,
    setIsDataOutdated,
}: Readonly<EquipmentTypesByFiltersProps>) {
    const theme = useTheme();
    const vwBelow900px = useMediaQuery(theme.breakpoints.down('md'));
    const { setValue, getValues } = useFormContext();
    const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);

    const filtersSubEquipments: FilterSubEquipments[] = useWatch({
        name: ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER,
    }) as unknown as FilterSubEquipments[];

    const filterEquipmentTypes =
        selectedFilterId &&
        filtersSubEquipments?.find((value) => value[ContingencyFieldConstants.FILTER_ID] === selectedFilterId)?.[
            ContingencyFieldConstants.SUB_EQUIPMENT_TYPES
        ];

    const handleFilterRowClick = useCallback((clickedFilterId: string, currentFilterId: string | null) => {
        if (clickedFilterId !== currentFilterId) {
            setSelectedFilterId(clickedFilterId);
        }
    }, []);

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
        [getValues, setValue, setIsDataOutdated]
    );

    const containerProps = vwBelow900px ? { xs: true } : { xs: 8, sx: { height: '100%' } };

    return (
        <Grid item container direction="column" {...containerProps}>
            <GridSection title="equipmentTypesByFilters" />
            <Grid item container xs sx={{ height: 0, flex: 1 }}>
                <Grid item xs={6} marginRight={-0.05} sx={{ height: '100%' }}>
                    <TableContainer
                        component={Paper}
                        sx={{
                            height: '100%',
                            border: '0.5px solid #808080',
                        }}
                    >
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
                                        <OverflowableTableCell text={filterRow.name} />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={6} marginLeft={-0.05} sx={{ height: '100%' }}>
                    <TableContainer
                        component={Paper}
                        sx={{
                            height: '100%',
                            border: '0.5px solid #808080',
                        }}
                    >
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
                                        (equipmentRow: ContingencyListEquipment) => {
                                            const isEquipmentSelected = filterEquipmentTypes.includes(equipmentRow.id);
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
                                                    <OverflowableTableCellWithCheckbox
                                                        checked={isEquipmentSelected}
                                                        text={<FormattedMessage id={equipmentRow.label} />}
                                                    />
                                                </TableRow>
                                            );
                                        }
                                    )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Grid>
    );
}

export default EquipmentTypesByFilters;
