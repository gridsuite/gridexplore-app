/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    CustomAGGrid,
    DescriptionField,
    DirectoryItemSelector,
    DirectoryItemsInput,
    ElementType,
    EquipmentType,
    FieldConstants,
    getFilterEquipmentTypeLabel,
    SeparatorCellRenderer,
    TreeViewFinderNodeProps,
    UniqueNameInput,
    unscrollableDialogStyles,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Box, Button, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCallback, useEffect, useState } from 'react';
import { FolderOutlined } from '@mui/icons-material';
import { ColDef } from 'ag-grid-community';
import { blue, brown, cyan, green, indigo, lightBlue, lightGreen, lime, red, teal } from '@mui/material/colors';
import { useWatch } from 'react-hook-form';
import { UUID } from 'crypto';
import { AppState } from '../../../../redux/types';
import { getIdentifiablesFromFitlers } from '../../../../utils/rest-api';
import {
    FilteredIdentifiables,
    FilterAttributes,
    IdentifiableAttributes,
} from '../../../../utils/contingency-list.type';

const separator = '/';
const defaultDef: ColDef = {
    flex: 1,
    resizable: false,
    sortable: false,
};

const equipmentTypes: string[] = [
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
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [selectedStudy, setSelectedStudy] = useState<string>('');
    const [selectedStudyId, setSelectedStudyId] = useState<UUID>();
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [rowsData, setRowsData] = useState<IdentifiableAttributes[]>([]);

    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const filters = useWatch({ name: FieldConstants.FILTERS });

    const colDef: ColDef[] = [
        {
            headerName: intl.formatMessage({
                id: FieldConstants.EQUIPMENT_ID,
            }),
            field: FieldConstants.ID,
            cellRenderer: ({ data }: { data: IdentifiableAttributes }) => {
                if (data.id === 'SEPARATOR') {
                    return SeparatorCellRenderer({
                        value: intl.formatMessage({ id: 'missingFromStudy' }),
                    });
                }
                return data.id;
            },
        },
        {
            headerName: intl.formatMessage({
                id: FieldConstants.TYPE,
            }),
            field: FieldConstants.TYPE,
        },
    ];

    useEffect(() => {
        if (filters?.length && selectedStudyId) {
            setIsFetching(true);
            getIdentifiablesFromFitlers(
                selectedStudyId,
                filters.map((filter: FilterAttributes) => filter.id)
            )
                .then((response: FilteredIdentifiables) => {
                    const SEPARATOR_TYPE = 'SEPARATOR';
                    function getTranslatedEquipmentType(type: string | undefined): string {
                        const equipmentType = getFilterEquipmentTypeLabel(type);
                        return equipmentType ? intl.formatMessage({ id: equipmentType }) : '';
                    }
                    const attributes: IdentifiableAttributes[] = [
                        ...response.equipmentIds.map((element: IdentifiableAttributes) => ({
                            id: element.id,
                            type: getTranslatedEquipmentType(element?.type),
                        })),
                        ...(response.notFoundIds?.length > 0
                            ? [
                                  { id: SEPARATOR_TYPE, type: '' },
                                  ...response.notFoundIds.map((element: IdentifiableAttributes) => ({
                                      id: element.id,
                                      type: getTranslatedEquipmentType(element?.type),
                                  })),
                              ]
                            : []),
                    ];
                    setRowsData(attributes);
                })
                .catch((error) =>
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotComputeContingencyList',
                    })
                )
                .finally(() => setIsFetching(false));
        }
    }, [filters, intl, selectedStudyId, snackError]);

    const onNodeChanged = useCallback((nodes: TreeViewFinderNodeProps[]) => {
        if (nodes.length > 0) {
            if (nodes[0].parents && nodes[0].parents.length > 0) {
                setSelectedFolder(nodes[0].parents.map((entry) => entry.name).join(separator));
            }
            setSelectedStudy(nodes[0].name);
            setSelectedStudyId(nodes[0].id);
        }
        setIsOpen(false);
    }, []);

    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                />
                <DescriptionField />
            </Box>
            <Box sx={{ p: 1 }}>
                <Box>
                    <FormattedMessage id="Filters" />
                    <DirectoryItemsInput
                        titleId="FiltersListsSelection"
                        label=""
                        name={FieldConstants.FILTERS}
                        elementType={ElementType.FILTER}
                        equipmentColorsMap={equipmentColorsMap}
                        equipmentTypes={equipmentTypes}
                        disable={isFetching}
                    />
                </Box>
                <Box sx={{ fontWeight: 'bold', p: 2, display: 'flex', alignItems: 'center' }}>
                    <FolderOutlined />
                    <Box margin={1}>
                        {selectedStudy.length > 0 ? (
                            <Typography>
                                {selectedFolder ? selectedFolder + separator + selectedStudy : selectedStudy}
                            </Typography>
                        ) : (
                            <FormattedMessage id="noSelectedStudyText" />
                        )}
                    </Box>
                    <Box>
                        <Button onClick={() => setIsOpen(true)} variant="contained" color="primary" component="label">
                            <FormattedMessage id="selectStudyDialogButton" />
                        </Button>
                        <DirectoryItemSelector
                            open={isOpen}
                            types={[ElementType.STUDY]}
                            onClose={onNodeChanged}
                            multiSelect={false}
                        />
                    </Box>
                </Box>
            </Box>
            <CustomAGGrid sx={{ p: 1, flex: 1 }} columnDefs={colDef} defaultColDef={defaultDef} rowData={rowsData} />
        </>
    );
}
