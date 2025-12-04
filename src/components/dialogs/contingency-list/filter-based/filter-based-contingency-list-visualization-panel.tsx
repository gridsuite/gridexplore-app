/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'node:crypto';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GetRowIdParams } from 'ag-grid-community';
import { useFormContext } from 'react-hook-form';
import {
    CustomAGGrid,
    DefaultCellRenderer,
    DirectoryItemSelector,
    ElementType,
    FieldConstants,
    getEquipmentTypeShortLabel,
    SeparatorCellRenderer,
    TreeViewFinderNodeProps,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Alert, Button, Grid, Typography } from '@mui/material';
import { FolderOutlined } from '@mui/icons-material';
import { DataTableOverlay } from './data-table-overlay';
import {
    ContingencyFieldConstants,
    FilteredIdentifiables,
    FilterElement,
    FilterSubEquipments,
    IdentifiableAttributes,
} from '../../../../utils/contingency-list.type';
import { getIdentifiablesFromFilters } from '../../../../utils/rest-api';

const separator = '/';
const SEPARATOR_TYPE = 'SEPARATOR';

const defaultDef: ColDef = {
    resizable: false,
    sortable: false,
    cellRenderer: DefaultCellRenderer,
};

interface RowData {
    id: string;
    type?: string;
}

const getRowId = (params: GetRowIdParams<RowData>) => {
    return params.data.id;
};

export type FilterBasedContingencyListVisualizationPanelProps = {
    isDataOutdated: boolean;
    setIsDataOutdated: (value: boolean) => void;
    hasFilters: boolean;
};

export function FilterBasedContingencyListVisualizationPanel(
    props: Readonly<FilterBasedContingencyListVisualizationPanelProps>
) {
    const { isDataOutdated, setIsDataOutdated, hasFilters } = props;
    const gridRef = useRef<AgGridReact>(null);
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const { getValues } = useFormContext();
    const [selectedStudy, setSelectedStudy] = useState<string>('');
    const [selectedStudyId, setSelectedStudyId] = useState<UUID>();
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [rowsData, setRowsData] = useState<IdentifiableAttributes[]>([]);

    const getTranslatedEquipmentType = useCallback(
        (type: string | undefined) => {
            const equipmentType = getEquipmentTypeShortLabel(type);
            return equipmentType ? intl.formatMessage({ id: equipmentType }) : '';
        },
        [intl]
    );

    const colDef: ColDef[] = [
        {
            headerName: intl.formatMessage({
                id: FieldConstants.EQUIPMENT_ID,
            }),
            field: FieldConstants.ID,
            flex: 3,
        },
        {
            headerName: intl.formatMessage({
                id: FieldConstants.TYPE,
            }),
            field: FieldConstants.TYPE,
            flex: 2,
            maxWidth: 120,
        },
    ];

    const updateRowData = useCallback(
        (studyId: UUID | undefined) => {
            if (studyId) {
                const currentFilters: FilterElement[] = getValues(FieldConstants.FILTERS);
                const currentSubEquipments: FilterSubEquipments[] = getValues(
                    ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER
                );
                const filtersWithSubEquipments = {
                    filters: currentFilters.map((value) => ({ id: value.id })),
                    selectedEquipmentTypesByFilter: currentSubEquipments.map((value) => ({
                        filterId: value.filterId,
                        equipmentTypes: value.subEquipmentTypes,
                    })),
                };
                setIsFetching(true);
                getIdentifiablesFromFilters(studyId, filtersWithSubEquipments)
                    .then((response: FilteredIdentifiables) => {
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
                    .finally(() => {
                        setIsFetching(false);
                        setIsDataOutdated(false);
                    });
            }
        },
        [getTranslatedEquipmentType, snackError, getValues, setIsDataOutdated]
    );

    const onNodeChanged = useCallback(
        (nodes: TreeViewFinderNodeProps[]) => {
            if (nodes.length > 0) {
                if (nodes[0].parents && nodes[0].parents.length > 0) {
                    setSelectedFolder(nodes[0].parents.map((entry) => entry.name).join(separator));
                }
                setSelectedStudy(nodes[0].name);
                setSelectedStudyId(nodes[0].id);
                const currentFilters: FilterElement[] = getValues(FieldConstants.FILTERS);
                if (currentFilters.length > 0) updateRowData(nodes[0].id);
            }
            setIsOpen(false);
        },
        [updateRowData, getValues]
    );

    const scrollOnRowById = useCallback(() => {
        if (gridRef.current?.api) {
            const { api } = gridRef.current;
            const rowNode = api.getRowNode(SEPARATOR_TYPE);

            if (rowNode) {
                api.ensureNodeVisible(rowNode, 'top');
            }
        }
    }, []);

    const hasMissingFromStudy = rowsData.some((row) => row.id === 'SEPARATOR' && row.type === '');

    const studyName = selectedFolder ? selectedFolder + separator + selectedStudy : selectedStudy;

    const formatPathName = useMemo(() => {
        if (studyName.length > 48) {
            const splitNameList = studyName.split('/');
            const lastFolder = splitNameList.at(-1);
            if (lastFolder === undefined) {
                return studyName;
            }
            if (splitNameList.length > 2) {
                const firstFolder = splitNameList.at(0);
                if (firstFolder === undefined) {
                    return studyName;
                }
                if (firstFolder.length + lastFolder.length < 48) {
                    return `${firstFolder}/.../${lastFolder}`;
                }
            }
            return `.../${lastFolder}`;
            // splitNameList length can not be equal to one because there is at least one root folder
        }
        return studyName;
    }, [studyName]);

    return (
        <Grid container direction="column" sx={{ height: '100%' }}>
            <Grid item component="h3">
                <FormattedMessage id="visualization" />
            </Grid>
            <Grid item container alignItems="center" marginY={1}>
                <Grid item paddingTop={1}>
                    <FolderOutlined />
                </Grid>
                <Grid item xs paddingLeft={1}>
                    {selectedStudy.length > 0 ? (
                        <Typography noWrap fontWeight="bold" title={studyName}>
                            {formatPathName}
                        </Typography>
                    ) : (
                        <FormattedMessage id="noSelectedStudyText" />
                    )}
                </Grid>
                <Grid item>
                    <Button
                        disabled={!hasFilters}
                        onClick={() => setIsOpen(true)}
                        variant={selectedStudy.length > 0 ? 'contained' : undefined}
                        component="label"
                    >
                        {selectedStudy.length > 0 ? (
                            <FormattedMessage id="edit" />
                        ) : (
                            <FormattedMessage id="selectStudyDialogTitle" />
                        )}
                    </Button>
                    <DirectoryItemSelector
                        open={isOpen}
                        types={[ElementType.STUDY]}
                        onClose={onNodeChanged}
                        multiSelect={false}
                    />
                </Grid>
            </Grid>
            {hasMissingFromStudy && (
                <Grid item>
                    <Button
                        onClick={scrollOnRowById}
                        fullWidth
                        sx={{
                            padding: 0,
                        }}
                    >
                        <Alert
                            severity="warning"
                            sx={{
                                width: '100%',
                            }}
                        >
                            {intl.formatMessage({ id: 'missingEquipmentsFromStudy' })}
                        </Alert>
                    </Button>
                </Grid>
            )}
            <Grid item xs>
                <CustomAGGrid
                    ref={gridRef}
                    columnDefs={colDef}
                    defaultColDef={defaultDef}
                    rowData={rowsData}
                    getRowId={getRowId}
                    isFullWidthRow={(params) => params.rowNode.data.id === 'SEPARATOR'}
                    fullWidthCellRenderer={() => {
                        return SeparatorCellRenderer({
                            children: intl.formatMessage({ id: 'missingFromStudy' }),
                            sx: {
                                paddingLeft: 3,
                            },
                        });
                    }}
                    loading={isFetching || (selectedStudy?.length > 0 && isDataOutdated)}
                    loadingOverlayComponent={DataTableOverlay}
                    loadingOverlayComponentParams={{
                        onClick: () => {
                            updateRowData(selectedStudyId);
                        },
                        size: 'large',
                        loading: isFetching,
                    }}
                />
            </Grid>
        </Grid>
    );
}
