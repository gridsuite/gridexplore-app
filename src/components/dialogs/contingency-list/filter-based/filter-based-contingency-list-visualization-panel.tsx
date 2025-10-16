/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'node:crypto';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GetRowIdParams } from 'ag-grid-community';
import { useFormContext } from 'react-hook-form';
import {
    CustomAGGrid,
    DirectoryItemSelector,
    ElementType,
    FieldConstants,
    getFilterEquipmentTypeLabel,
    RefreshButton,
    SeparatorCellRenderer,
    TreeViewFinderNodeProps,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Alert, Button, ButtonProps, CircularProgress, Grid, Typography } from '@mui/material';
import { FolderOutlined } from '@mui/icons-material';
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
    flex: 1,
    resizable: false,
    sortable: false,
};

interface RowData {
    id: string;
    type?: string;
}

const getRowId = (params: GetRowIdParams<RowData>) => {
    return params.data.id;
};

function Overlay({ loading, ...buttonProps }: Readonly<{ loading: boolean } & ButtonProps>) {
    return loading ? <CircularProgress /> : <RefreshButton {...buttonProps} />;
}

export type FilterBasedContingencyListVisualizationPanelProps = {
    isDataOutdated: boolean;
    setIsDataOutdated: (value: boolean) => void;
};

export function FilterBasedContingencyListVisualizationPanel(
    props: Readonly<FilterBasedContingencyListVisualizationPanelProps>
) {
    const { isDataOutdated, setIsDataOutdated } = props;
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
            const equipmentType = getFilterEquipmentTypeLabel(type);
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
            cellRenderer: ({ data }: { data: IdentifiableAttributes }) => {
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
                api.ensureNodeVisible(rowNode, 'middle');
            }
        }
    }, []);

    const hasMissingFromStudy = rowsData.some((row) => row.id === 'SEPARATOR' && row.type === '');

    const studyName = selectedFolder ? selectedFolder + separator + selectedStudy : selectedStudy;

    return (
        <Grid item container direction="column" xs={3} sx={{ minWidth: '31%' }}>
            {/* ugly width fix for the grid layout */}
            <Grid item>
                <Typography variant="h6">
                    <FormattedMessage id="visualization" />
                </Typography>
            </Grid>
            <Grid item container paddingY={1} alignItems="center" justifyContent="center">
                <Grid item xs={1}>
                    <FolderOutlined />
                </Grid>
                <Grid item xs={7} fontWeight="bold" padding={1}>
                    {selectedStudy.length > 0 ? (
                        <Typography noWrap title={studyName}>
                            {studyName}
                        </Typography>
                    ) : (
                        <FormattedMessage id="noSelectedStudyText" />
                    )}
                </Grid>
                <Grid item xs={4}>
                    <Button onClick={() => setIsOpen(true)} variant="contained" color="primary" component="label">
                        <FormattedMessage id="selectStudyDialogButton" />
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
                            }
                        });
                    }}
                    loading={isFetching || (selectedStudy?.length > 0 && isDataOutdated)}
                    loadingOverlayComponent={Overlay}
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
