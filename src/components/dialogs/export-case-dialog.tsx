/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CancelButton, ElementAttributes, FlatParameters } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { getExportFormats } from '../../utils/rest-api';

type ExportFormats =
    | {
          [formatName: string]: {
              formatName: string;
              parameters: {
                  name: string;
                  type: string;
                  defaultValue: any;
                  possibleValues: any;
              }[];
          };
      }
    | [];

type FormatParameters = {
    [parameterName: string]: any;
};

export interface ExportCaseDialogProps {
    selectedElements: ElementAttributes[];
    onClose: () => void;
    onExport: (
        selectedElements: ElementAttributes[],
        format: string,
        parameters: FormatParameters,
        caseUuidFileNameMap?: Map<UUID, string>
    ) => Promise<void>;
}

/* separate in a function because Sonar don't like nested lambda/functions */
function transformFetchedFormats(fetchedFormats: ExportFormats): ExportFormats {
    return Array.isArray(fetchedFormats)
        ? fetchedFormats
        : Object.fromEntries(
              Object.entries(fetchedFormats).map(([key, value]) => [
                  key,
                  {
                      ...value,
                      parameters: value.parameters.map((param) => {
                          if (param.type === 'STRING_LIST' && param.name.endsWith('extensions')) {
                              return { ...param, defaultValue: param.possibleValues };
                          }
                          return param;
                      }),
                  },
              ])
          );
}

export default function ExportCaseDialog({ selectedElements, onClose, onExport }: Readonly<ExportCaseDialogProps>) {
    const [loading, setLoading] = useState<boolean>(false);
    const [formats, setFormats] = useState<ExportFormats>([]);
    const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

    // a Map between case uuid and file name to export
    // by default all cases take elementName as file name
    const [caseUuidFileNameMap] = useState<Map<UUID, string>>(() => {
        const fileNameMap = new Map<UUID, string>();
        selectedElements.forEach((elem) => {
            fileNameMap.set(elem.elementUuid, elem.elementName);
        });
        return fileNameMap;
    });

    // support file name editing if exporting only one file
    const oneFileMode = useMemo<boolean>(() => selectedElements.length === 1, [selectedElements]);
    const [fileName, setFileName] = useState<string>(() => selectedElements[0]?.elementName);

    // updates file name of fist case in file name map
    useEffect(() => {
        caseUuidFileNameMap.set(selectedElements[0].elementUuid, fileName);
    }, [fileName, caseUuidFileNameMap, selectedElements]);

    const [expanded, setExpanded] = useState<boolean>(false);
    const [currentParameters, setCurrentParameters] = useState<FormatParameters>({});

    const intl = useIntl();

    useEffect(() => {
        getExportFormats().then((fetchedFormats: ExportFormats) => {
            // we check if the param is for extension, if it is, we select all possible values by default.
            // the only way for the moment to check if the param is for extension, is by checking his type is name.
            // TODO to be removed when extensions param default value corrected in backend to include all possible values
            setFormats(transformFetchedFormats(fetchedFormats));
        });
    }, []);

    const handleParameterChange = useCallback((name: string, value: any, isEdit: boolean) => {
        if (!isEdit) {
            setCurrentParameters((prevParameters) => ({
                ...prevParameters,
                [name]: value,
            }));
        }
    }, []);

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    const handleExport = useCallback(async () => {
        setLoading(true);
        await onExport(selectedElements, selectedFormat!, currentParameters, caseUuidFileNameMap);
        onClose();
    }, [onExport, onClose, selectedElements, selectedFormat, currentParameters, caseUuidFileNameMap]);

    return (
        <Dialog open fullWidth maxWidth="sm" onClose={handleClose} aria-labelledby="dialog-title-export-case">
            <DialogTitle>{intl.formatMessage({ id: 'download.export.button' })}</DialogTitle>
            <DialogContent>
                {oneFileMode && (
                    <TextField
                        key="fileName"
                        margin="dense"
                        label={<FormattedMessage id="download.fileName" />}
                        variant="filled"
                        id="fileName"
                        value={fileName}
                        sx={{ width: '100%', marginBottom: 1 }}
                        onChange={(event) => setFileName(event.target.value)}
                    />
                )}
                <FormControl fullWidth size="small">
                    <InputLabel id="select-format-label" variant="filled" margin="dense">
                        <FormattedMessage id="download.exportFormat" />
                    </InputLabel>
                    <Select
                        labelId="select-format-label"
                        label={<FormattedMessage id="download.exportFormat" />}
                        variant="filled"
                        id="controlled-select-format"
                        onChange={(event) => setSelectedFormat(event.target.value)}
                        defaultValue=""
                        inputProps={{
                            id: 'select-format',
                        }}
                    >
                        {Object.keys(formats).map((formatKey) => (
                            <MenuItem key={formatKey} value={formatKey}>
                                {formatKey}
                            </MenuItem>
                        ))}
                    </Select>
                    <Stack marginTop="0.7em" direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                            component="span"
                            color={selectedFormat ? 'text.main' : 'text.disabled'}
                            sx={{ fontWeight: 'bold' }}
                        >
                            <FormattedMessage id="parameters" />
                        </Typography>
                        <IconButton onClick={() => setExpanded((prevState) => !prevState)} disabled={!selectedFormat}>
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Stack>
                </FormControl>
                <Collapse in={expanded}>
                    <FlatParameters
                        paramsAsArray={selectedFormat ? (formats as any)[selectedFormat].parameters : []}
                        initValues={currentParameters}
                        onChange={handleParameterChange}
                        variant="standard"
                        selectionWithDialog={(params: any) =>
                            !!params?.possibleValues?.length && params.possibleValues.length > 10
                        }
                    />
                </Collapse>
                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '5px',
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={onClose} />
                <Button onClick={handleExport} variant="outlined" disabled={loading || !selectedFormat || !fileName}>
                    <FormattedMessage id="download.export.button" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
