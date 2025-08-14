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
    FieldConstants,
    TreeViewFinderNodeProps,
    UniqueNameInput,
    unscrollableDialogStyles,
} from '@gridsuite/commons-ui';
import { Box, Button, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useState } from 'react';
import { FolderOutlined } from '@mui/icons-material';
import { ColDef } from 'ag-grid-community';
import { AppState } from '../../../../redux/types';

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

    const intl = useIntl();

    const colDef: ColDef[] = [
        {
            headerName: intl.formatMessage({
                id: 'equipmentID',
            }),
            field: 'equipmentID',
        },
        {
            headerName: intl.formatMessage({
                id: 'type',
            }),
            field: 'type',
        },
    ];

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
                        onClose={(nodes: TreeViewFinderNodeProps[]) => {
                            if (nodes.length > 0) {
                                if (nodes[0].parents && nodes[0].parents.length > 0) {
                                    setSelectedFolder(nodes[0].parents.map((entry) => entry.name).join(separator));
                                }
                                setSelectedStudy(nodes[0].name);
                            }
                            console.log('setisOpen false');
                            setIsOpen(false);
                        }}
                        multiSelect={false}
                    />
                </Box>
            </Box>
            <CustomAGGrid columnDefs={colDef} defaultColDef={defaultDef} rowData={[]} />
        </>
    );
}
