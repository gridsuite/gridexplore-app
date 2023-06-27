import { Grid, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { ArrowCircleDown, ArrowCircleUp, Upload } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/ControlPoint';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorInput from '../../utils/error-input';
import CsvUploader from './csv-uploader/csv-uploader';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

const InnerColoredButton = styled(IconButton)(({ theme, root }) => {
    return {
        color: theme.palette.primary.main,
        justifyContent: 'flex-end',
    };
});

const BottomRightButtons = ({
    name,
    gridApi,
    rowData,
    selectedRows,
    handleAddRow,
    handleDeleteRows,
    handleMoveRowUp,
    handleMoveRowDown,
    csvProps,
}) => {
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const intl = useIntl();
    const isFirstSelected =
        rowData && gridApi?.api?.getRowNode(rowData[0]?.rowUuid)?.isSelected();
    const isLastSelected =
        rowData &&
        gridApi?.api
            ?.getRowNode(rowData[rowData.length - 1]?.rowUuid)
            ?.isSelected();

    return (
        <>
            <Grid item xs={12} justifyContent={'flex-end'}>
                {csvProps && (
                    <InnerColoredButton onClick={() => setUploaderOpen(true)}>
                        <Tooltip
                            title={intl.formatMessage({
                                id: 'ImportCSV',
                            })}
                            placement="bottom"
                        >
                            <Upload />
                        </Tooltip>
                    </InnerColoredButton>
                )}
                <InnerColoredButton key={'addButton'} onClick={handleAddRow}>
                    <AddIcon />
                </InnerColoredButton>
                <InnerColoredButton
                    key={'DeleteButton'}
                    onClick={handleDeleteRows}
                    disabled={selectedRows.length === 0}
                >
                    <DeleteIcon />
                </InnerColoredButton>
                <InnerColoredButton
                    key={'upButton'}
                    disabled={isFirstSelected || selectedRows.length === 0}
                    onClick={handleMoveRowUp}
                >
                    <ArrowCircleUp />
                </InnerColoredButton>
                <InnerColoredButton
                    key={'downButton'}
                    disabled={isLastSelected || selectedRows.length === 0}
                    onClick={handleMoveRowDown}
                >
                    <ArrowCircleDown />
                </InnerColoredButton>
            </Grid>
            <Grid item xs={12}>
                <ErrorInput name={name} />
            </Grid>
            <CsvUploader
                open={uploaderOpen}
                onClose={() => setUploaderOpen(false)}
                name={name}
                {...csvProps}
            />
        </>
    );
};

export default BottomRightButtons;
