/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { UUID } from 'node:crypto';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ColDef } from 'ag-grid-community';
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
import { Button, ButtonProps, Grid, Typography } from '@mui/material';
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
const defaultDef: ColDef = {
    flex: 1,
    resizable: false,
    sortable: false,
};

export type VisualizationPanelProps = {
    isDataOutdated: boolean;
    setIsDataOutdated: (value: boolean) => void;
};

export function FilterBasedContingencyListVisualizationPanel(props: Readonly<VisualizationPanelProps>) {
    const { isDataOutdated, setIsDataOutdated } = props;

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
                if (data.id === 'SEPARATOR' && data.type === '') {
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
                        const SEPARATOR_TYPE = 'SEPARATOR';
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

    const loadingOverlayComponentParams = useMemo((): ButtonProps => {
        return {
            onClick: () => {
                updateRowData(selectedStudyId);
            },
            size: 'large',
        };
    }, [updateRowData, selectedStudyId]);

    const shouldDisplayRefreshButton = selectedStudy?.length > 0 && isDataOutdated && !isFetching;

    return (
        <Grid item container direction="column" xs>
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
                        <Typography noWrap>
                            {selectedFolder ? selectedFolder + separator + selectedStudy : selectedStudy}
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
            <Grid item xs>
                <CustomAGGrid
                    columnDefs={colDef}
                    defaultColDef={defaultDef}
                    rowData={rowsData}
                    loading={isFetching || shouldDisplayRefreshButton}
                    {...(shouldDisplayRefreshButton && {
                        loadingOverlayComponent: RefreshButton,
                        loadingOverlayComponentParams,
                    })}
                />
            </Grid>
        </Grid>
    );
}
