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
    getBasicEquipmentLabel,
    TreeViewFinderNodeProps,
    UniqueNameInput,
    unscrollableDialogStyles,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Box, Button, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCallback, useMemo, useState } from 'react';
import { FolderOutlined } from '@mui/icons-material';
import { ColDef } from 'ag-grid-community';
import { blue, brown, green, indigo, lime, red, teal } from '@mui/material/colors';
import { useFormContext } from 'react-hook-form';
import { AppState } from '../../../../redux/types';
import { getIdentifiablesFromFitlers } from '../../../../utils/rest-api';
import { FilterMetaData, IdentifiableAttributes } from '../../../../utils/contingency-list-types';

export interface ContingencyListFilterBasedFromProps {
    studyName: string;
}

const separator = '/';
const defaultDef: ColDef = {
    flex: 1,
    resizable: false,
};

export default function ContingencyListFilterBasedFrom({ studyName }: Readonly<ContingencyListFilterBasedFromProps>) {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [selectedStudy, setSelectedStudy] = useState<string>(studyName);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [rowsData, setRowsData] = useState<IdentifiableAttributes[]>([]);

    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const { getValues } = useFormContext();

    const colDef: ColDef[] = [
        {
            headerName: intl.formatMessage({
                id: FieldConstants.EQUIPMENT_ID,
            }),
            field: FieldConstants.ID,
        },
        {
            headerName: intl.formatMessage({
                id: FieldConstants.TYPE,
            }),
            field: FieldConstants.TYPE,
        },
    ];

    const equipmentTypes: string[] = useMemo(() => {
        return [
            EquipmentType.TWO_WINDINGS_TRANSFORMER,
            EquipmentType.LINE,
            EquipmentType.LOAD,
            EquipmentType.GENERATOR,
            EquipmentType.GENERATOR,
            EquipmentType.SHUNT_COMPENSATOR,
            EquipmentType.STATIC_VAR_COMPENSATOR,
            EquipmentType.HVDC_LINE,
        ];
    }, []);

    const equipmentColorsMap: Map<string, string> = useMemo(() => {
        const map = new Map();
        map.set(EquipmentType.TWO_WINDINGS_TRANSFORMER, blue[700]);
        map.set(EquipmentType.LINE, indigo[700]);
        map.set(EquipmentType.LOAD, brown[700]);
        map.set(EquipmentType.GENERATOR, green[700]);
        map.set(EquipmentType.SHUNT_COMPENSATOR, red[700]);
        map.set(EquipmentType.STATIC_VAR_COMPENSATOR, lime[700]);
        map.set(EquipmentType.HVDC_LINE, teal[700]);
        return map;
    }, []);

    const onNodeChanged = useCallback(
        (nodes: TreeViewFinderNodeProps[]) => {
            if (nodes.length > 0) {
                if (nodes[0].parents && nodes[0].parents.length > 0) {
                    setSelectedFolder(nodes[0].parents.map((entry) => entry.name).join(separator));
                }
                setSelectedStudy(nodes[0].name);
                // call endpoint to update colDef
                getIdentifiablesFromFitlers(
                    nodes[0].id,
                    getValues(FieldConstants.FILTERS).map((filter: FilterMetaData) => filter.id)
                )
                    .then((response: IdentifiableAttributes[]) => {
                        const attributes: IdentifiableAttributes[] = response.map((element: IdentifiableAttributes) => {
                            const equipmentType: string = getBasicEquipmentLabel(element?.type) ?? null;
                            return {
                                id: element.id,
                                type: equipmentType ? intl.formatMessage({ id: equipmentType }) : '',
                            };
                        });
                        setRowsData(attributes);
                    })
                    .catch((error) =>
                        snackError({
                            messageTxt: error.message,
                            headerId: 'cannotComputeContingencyList',
                        })
                    );
            }
            setIsOpen(false);
        },
        [getValues, intl, snackError]
    );

    return (
        <>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="nameProperty"
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                />
            </Box>
            <Box sx={unscrollableDialogStyles.unscrollableHeader}>
                <DescriptionField />
            </Box>
            <Box>
                <FormattedMessage id="Filters" />
                <DirectoryItemsInput
                    titleId="FiltersListsSelection"
                    label=""
                    name={FieldConstants.FILTERS}
                    elementType={ElementType.FILTER}
                    equipmentColorsMap={equipmentColorsMap}
                    equipmentTypes={equipmentTypes}
                />
            </Box>
            <Box sx={{ fontWeight: 'bold', p: 2, display: 'flex', alignItems: 'center' }}>
                <Box margin={1}>
                    <FolderOutlined />
                </Box>
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
            <CustomAGGrid columnDefs={colDef} defaultColDef={defaultDef} rowData={rowsData} />
        </>
    );
}
