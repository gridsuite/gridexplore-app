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
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getExportFormats } from '../../utils/rest-api';
import { FormattedMessage, useIntl } from 'react-intl';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CancelButton, FlatParameters } from '@gridsuite/commons-ui';

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

interface ExportCaseDialogProps {
    onClose: () => void;
    onExport: (format: string, parameters: FormatParameters) => Promise<void>;
}

const ExportCaseDialog = (props: ExportCaseDialogProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [formats, setFormats] = useState<ExportFormats>([]);
    const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);
    const [currentParameters, setCurrentParameters] =
        useState<FormatParameters>({});

    const intl = useIntl();

    useEffect(() => {
        getExportFormats().then((fetchedFormats: ExportFormats) => {
            // we check if the param is for extension, if it is, we select all possible values by default.
            // the only way for the moment to check if the param is for extension, is by checking his type is name.
            //TODO to be removed when extensions param default value corrected in backend to include all possible values
            Object.values(fetchedFormats).forEach((format) =>
                format.parameters.forEach((param) => {
                    if (
                        param.type === 'STRING_LIST' &&
                        param.name.endsWith('extensions')
                    ) {
                        param.defaultValue = param.possibleValues;
                    }
                })
            );
            setFormats(fetchedFormats);
        });
    }, []);

    const handleParameterChange = useCallback(
        (name: string, value: any, isEdit: boolean) => {
            if (!isEdit) {
                setCurrentParameters((prevParameters) => ({
                    ...prevParameters,
                    [name]: value,
                }));
            }
        },
        []
    );

    const handleExport = useCallback(async () => {
        setLoading(true);
        await props.onExport(selectedFormat!, currentParameters);
        props.onClose();
    }, [currentParameters, props, selectedFormat]);

    return (
        <Dialog
            open
            fullWidth
            maxWidth="sm"
            onClose={props.onClose}
            aria-labelledby="dialog-title-export-case"
        >
            <DialogTitle>
                {intl.formatMessage({ id: 'download.export.button' })}
            </DialogTitle>
            <DialogContent>
                <FormControl fullWidth size="small">
                    <InputLabel
                        id="select-format-label"
                        variant="filled"
                        margin="dense"
                    >
                        <FormattedMessage id="download.exportFormat" />
                    </InputLabel>
                    <Select
                        labelId="select-format-label"
                        label={<FormattedMessage id="download.exportFormat" />}
                        variant="filled"
                        id="controlled-select-format"
                        onChange={(event) =>
                            setSelectedFormat(event.target.value)
                        }
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
                    <Stack
                        marginTop="0.7em"
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography
                            component="span"
                            color={
                                selectedFormat ? 'text.main' : 'text.disabled'
                            }
                            style={{ fontWeight: 'bold' }}
                        >
                            <FormattedMessage id="parameters" />
                        </Typography>
                        <IconButton
                            onClick={() =>
                                setExpanded((prevState) => !prevState)
                            }
                            disabled={!selectedFormat}
                        >
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Stack>
                </FormControl>
                <Collapse in={expanded}>
                    <FlatParameters
                        paramsAsArray={
                            selectedFormat
                                ? (formats as any)[selectedFormat].parameters
                                : []
                        }
                        initValues={currentParameters}
                        onChange={handleParameterChange}
                        variant="standard"
                        selectionWithDialog={(params: any) =>
                            !!params?.possibleValues?.length &&
                            params.possibleValues.length > 10
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
                <CancelButton onClick={props.onClose} />
                <Button
                    onClick={handleExport}
                    variant="outlined"
                    disabled={loading || !selectedFormat}
                >
                    <FormattedMessage id="download.export.button" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportCaseDialog;
