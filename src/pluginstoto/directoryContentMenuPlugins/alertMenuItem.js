import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const AlertMenuItem = {
    messageDescriptorId: 'alertMenuItemText',
    handleClick: (activeElement) =>
        alert('this is an alert! on ' + activeElement.elementUuid),
    icon: <InsertDriveFileIcon fontSize="small" />,
};

export default AlertMenuItem;
