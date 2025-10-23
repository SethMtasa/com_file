import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    VStack,
    Input,
    InputGroup,
    InputLeftElement,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    IconButton,
    ModalFooter,
    FormLabel,
    useToast,
    FormControl,
    Flex,
    Text,
    useDisclosure,
    Card,
    CardBody,
    Badge,
    HStack,
    Select,
    Progress,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Center,
    Spinner,
    Tooltip,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    CloseButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiUsers, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiEye, FiFile, FiFileText, FiDownload, FiUser, FiGlobe } from 'react-icons/fi';
import * as XLSX from 'xlsx';

export default function ChannelPartners() {
    const [channelPartners, setChannelPartners] = useState([]);
    const [filteredChannelPartners, setFilteredChannelPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [currentChannelPartner, setCurrentChannelPartner] = useState({});
    const [newChannelPartner, setNewChannelPartner] = useState({
        typeName: '',
        description: ''
    });
    const [channelPartnerToDelete, setChannelPartnerToDelete] = useState(null);

    // Files modal state
    const [partnerFiles, setPartnerFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [selectedPartnerForFiles, setSelectedPartnerForFiles] = useState(null);
    const [downloadingFileId, setDownloadingFileId] = useState(null);

    // Modal disclosures
    const { isOpen: isAddModalOpen, onOpen: onAddModalOpen, onClose: onAddModalClose } = useDisclosure();
    const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const { isOpen: isFilesModalOpen, onOpen: onFilesModalOpen, onClose: onFilesModalClose } = useDisclosure();

    // Fetch channel partners
    const fetchChannelPartners = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:8277/api/channel-partner-types', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const partners = response.data.body || response.data.data || [];
                setChannelPartners(partners);
                setFilteredChannelPartners(partners);
            } else {
                throw new Error(response.data.message || 'Failed to fetch channel partners');
            }
        } catch (error) {
            console.error('Error fetching channel partners:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch channel partners',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch files by channel partner type
    const fetchFilesByPartnerType = async (partnerTypeId) => {
        setFilesLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:8277/api/files/type/${partnerTypeId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setPartnerFiles(response.data.body || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch files');
            }
        } catch (error) {
            console.error('Error fetching files by channel partner type:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch files',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setPartnerFiles([]);
        } finally {
            setFilesLoading(false);
        }
    };

    // Handle download file
    const handleDownloadFile = async (fileId, fileName, fileType) => {
        setDownloadingFileId(fileId);
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`http://localhost:8277/api/files/download/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob'
            });

            // Get the file extension from the original file name or content type
            const blob = new Blob([response.data], { type: fileType });
            const url = window.URL.createObjectURL(blob);

            // Get file extension from original filename or content type
            let fileExtension = '.file';
            if (fileName && fileName.includes('.')) {
                fileExtension = fileName.substring(fileName.lastIndexOf('.'));
            } else {
                // Fallback to determining extension from content type
                const extensionMap = {
                    'application/pdf': '.pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/msword': '.doc',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                    'application/vnd.ms-excel': '.xls',
                    'text/csv': '.csv',
                    'text/plain': '.txt',
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif'
                };
                fileExtension = extensionMap[fileType] || '.file';
            }

            const downloadFileName = fileName && fileName.includes('.') ? fileName : `file${fileExtension}`;

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', downloadFileName);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Success',
                description: 'File download started',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            toast({
                title: 'Error',
                description: 'Error downloading file',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDownloadingFileId(null);
        }
    };

    // Handle view files
    const handleViewFiles = async (partner) => {
        setSelectedPartnerForFiles(partner);
        await fetchFilesByPartnerType(partner.id);
        onFilesModalOpen();
    };

    useEffect(() => {
        fetchChannelPartners();
    }, []);

    // Filter channel partners based on search query
    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = channelPartners.filter(partner =>
            (partner.typeName?.toLowerCase() || '').includes(query) ||
            (partner.description?.toLowerCase() || '').includes(query)
        );
        setFilteredChannelPartners(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, channelPartners]);

    // Pagination calculations
    const totalItems = filteredChannelPartners.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPartners = filteredChannelPartners.slice(startIndex, endIndex);

    // Handlers
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewChannelPartner(prev => ({ ...prev, [name]: value }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setCurrentChannelPartner(prev => ({ ...prev, [name]: value }));
    };

    // CRUD Operations
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post('http://localhost:8277/api/channel-partner-types', newChannelPartner, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setShowSuccessAlert(true);
                onAddModalClose();
                resetAddForm();
                fetchChannelPartners();

                toast({
                    title: 'Success',
                    description: 'Channel partner created successfully!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error(response.data.message || 'Failed to create channel partner');
            }
        } catch (error) {
            console.error('Error creating channel partner:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error creating channel partner',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(`http://localhost:8277/api/channel-partner-types/${currentChannelPartner.id}`, currentChannelPartner, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onEditModalClose();
                fetchChannelPartners();

                toast({
                    title: 'Success',
                    description: 'Channel partner updated successfully!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error(response.data.message || 'Failed to update channel partner');
            }
        } catch (error) {
            console.error('Error updating channel partner:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error updating channel partner',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(`http://localhost:8277/api/channel-partner-types/${channelPartnerToDelete.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                onDeleteModalClose();
                fetchChannelPartners();

                toast({
                    title: 'Success',
                    description: 'Channel partner deleted successfully!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error(response.data.message || 'Failed to delete channel partner');
            }
        } catch (error) {
            console.error('Error deleting channel partner:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error deleting channel partner',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Export functions
    const exportPartnersToExcel = () => {
        const dataForExport = channelPartners.map(partner => ({
            'Partner ID': partner.id,
            'Type Name': partner.typeName,
            'Description': partner.description,
            'Total Files': partner.files?.length || 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Channel Partners');
        XLSX.writeFile(workbook, `channel_partners_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: 'Export Successful',
            description: 'Channel partners data has been exported to Excel',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const exportFilesToExcel = () => {
        if (partnerFiles.length === 0) {
            toast({
                title: 'No Data',
                description: 'No files available to export',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const dataForExport = partnerFiles.map(file => ({
            'File ID': file.id,
            'File Name': file.fileName,
            'File Type': getFileTypeShort(file.fileType),
            'File Size': formatFileSize(file.fileSize),
            'Upload Date': formatUploadDate(file.uploadDate),
            'Uploaded By': getUploadedByFullName(file),
            'Assigned KAR': getAssignedKARFullName(file),
            'Region': file.region?.regionName || 'N/A',
            'Region Code': file.region?.regionCode || 'N/A',
            'Validity Date': file.validityDate || 'N/A',
            'Expiry Date': file.expiryDate || 'N/A',
            'File Version': file.fileVersion || 'N/A',
            'Description': file.description || 'N/A',
            'Status': file.expired ? 'Expired' : file.valid ? 'Valid' : 'Unknown'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Files');
        XLSX.writeFile(workbook, `files_export_${selectedPartnerForFiles?.typeName}_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: 'Export Successful',
            description: 'Files data has been exported to Excel',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    const exportToCSV = () => {
        const dataForExport = channelPartners.map(partner => ({
            'Type Name': partner.typeName,
            'Description': partner.description,
            'Total Files': partner.files?.length || 0
        }));

        const headers = Object.keys(dataForExport[0]);
        const csvContent = [
            headers.join(','),
            ...dataForExport.map(row =>
                headers.map(header => `"${row[header]}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `channel_partners_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: 'Export Successful',
            description: 'Channel partners data has been exported to CSV',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
    };

    // Helper functions
    const resetAddForm = () => {
        setNewChannelPartner({
            typeName: '',
            description: ''
        });
    };

    const onEditClick = (partner) => {
        setCurrentChannelPartner({ ...partner });
        onEditModalOpen();
    };

    const onDeleteClick = (partner) => {
        setChannelPartnerToDelete(partner);
        onDeleteModalOpen();
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Format upload date
    const formatUploadDate = (uploadDate) => {
        if (!uploadDate) return '';
        return uploadDate.split('T')[0];
    };

    // Get file type short name
    const getFileTypeShort = (fileType) => {
        if (!fileType) return 'Unknown';

        const typeMap = {
            'application/pdf': 'PDF',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
            'application/vnd.ms-excel': 'XLS',
            'text/csv': 'CSV',
            'text/plain': 'TXT',
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'image/gif': 'GIF'
        };

        return typeMap[fileType] || fileType.split('/')[1]?.toUpperCase() || 'FILE';
    };

    // Get uploaded by full name
    const getUploadedByFullName = (file) => {
        if (!file.uploadedBy) return 'Unknown';
        return `${file.uploadedBy.firstName || ''} ${file.uploadedBy.lastName || ''}`.trim();
    };

    // Get assigned KAR full name
    const getAssignedKARFullName = (file) => {
        if (!file.assignedKAR) return 'Not Assigned';
        return `${file.assignedKAR.firstName || ''} ${file.assignedKAR.lastName || ''}`.trim();
    };

    return (
        <Box
            minH="100vh"
            bg="gray.50"
            p={6}
        >

            {/* Header Card */}
            <Card
                bg="white"
                borderRadius="2xl"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                backdropFilter="blur(10px)"
                mb={6}
            >
                <CardBody p={6}>
                    <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, orange.400, purple.500)" bgClip="text">
                                Channel Partner Management
                            </Text>
                        </VStack>

                        <HStack spacing={4}>
                            <InputGroup width="300px">
                                <InputLeftElement>
                                    <FiSearch color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search channel partners..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    _hover={{ borderColor: 'gray.300' }}
                                    _focus={{
                                        borderColor: 'orange.400',
                                        boxShadow: '0 0 0 1px orange.400'
                                    }}
                                    transition="all 0.2s"
                                />
                            </InputGroup>

                            <Menu>
                                <MenuButton
                                    as={Button}
                                    leftIcon={<FiDownload />}
                                    colorScheme="blue"
                                    borderRadius="xl"
                                    variant="outline"
                                >
                                    Export
                                </MenuButton>
                                <MenuList>
                                    <MenuItem onClick={exportPartnersToExcel}>
                                        Export Partners to Excel
                                    </MenuItem>
                                    <MenuItem onClick={exportToCSV}>
                                        Export Partners to CSV
                                    </MenuItem>
                                </MenuList>
                            </Menu>

                            <Button
                                leftIcon={<FiPlus />}
                                colorScheme="orange"
                                borderRadius="xl"
                                bgGradient="linear(to-r, orange.400, orange.500)"
                                _hover={{
                                    bgGradient: "linear(to-r, orange.500, orange.600)",
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(255, 138, 0, 0.3)'
                                }}
                                _active={{
                                    transform: 'translateY(0)'
                                }}
                                transition="all 0.2s"
                                onClick={onAddModalOpen}
                            >
                                New Channel Partner
                            </Button>
                        </HStack>
                    </Flex>
                </CardBody>
            </Card>

            {/* Data Table Card */}
            <Card
                bg="white"
                borderRadius="2xl"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
                backdropFilter="blur(10px)"
            >
                <CardBody p={6}>
                    {loading && (
                        <Center py={8}>
                            <Spinner size="xl" color="orange.500" />
                        </Center>
                    )}

                    {!loading && (
                        <>
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Type Name</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Description</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Files</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {currentPartners.map((partner) => (
                                            <Tr
                                                key={partner.id}
                                                _hover={{
                                                    bg: 'orange.50',
                                                    transform: 'translateY(-1px)',
                                                    transition: 'all 0.2s'
                                                }}
                                                transition="all 0.2s"
                                            >
                                                <Td borderColor="gray.100">
                                                    <HStack spacing={3}>
                                                        <Box
                                                            p={2}
                                                            bgGradient="linear(to-r, orange.100, purple.100)"
                                                            borderRadius="lg"
                                                        >
                                                            <FiUsers color="#9C27B0" />
                                                        </Box>
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="semibold" color="gray.800">
                                                                {partner.typeName}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                ID: {partner.id}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Text color="gray.600" noOfLines={2}>
                                                        {partner.description || 'No description provided'}
                                                    </Text>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Button
                                                        leftIcon={<FiEye />}
                                                        size="sm"
                                                        variant="outline"
                                                        colorScheme="green"
                                                        onClick={() => handleViewFiles(partner)}
                                                        _hover={{
                                                            transform: 'translateY(-2px)',
                                                            bg: 'green.50'
                                                        }}
                                                        transition="all 0.2s"
                                                    >
                                                        View Files
                                                    </Button>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <HStack spacing={1}>
                                                        <Tooltip label="Edit Channel Partner">
                                                            <IconButton
                                                                aria-label="Edit"
                                                                icon={<FiEdit />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="blue"
                                                                onClick={() => onEditClick(partner)}
                                                                _hover={{
                                                                    transform: 'translateY(-2px)',
                                                                    bg: 'blue.50'
                                                                }}
                                                                transition="all 0.2s"
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label="Delete Channel Partner">
                                                            <IconButton
                                                                aria-label="Delete"
                                                                icon={<FiTrash2 />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => onDeleteClick(partner)}
                                                                _hover={{
                                                                    transform: 'translateY(-2px)',
                                                                    bg: 'red.50'
                                                                }}
                                                                transition="all 0.2s"
                                                            />
                                                        </Tooltip>
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {totalItems > 0 && (
                                <Flex justify="space-between" align="center" mt={6} p={4} bg="gray.50" borderRadius="lg">
                                    <Text fontSize="sm" color="gray.600">
                                        Page {currentPage} of {totalPages} ({totalItems} total records)
                                    </Text>

                                    <HStack spacing={2}>
                                        <Select
                                            size="sm"
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                            width="120px"
                                            borderRadius="md"
                                        >
                                            <option value={10}>Show 10</option>
                                            <option value={25}>Show 25</option>
                                            <option value={50}>Show 50</option>
                                            <option value={100}>Show 100</option>
                                        </Select>

                                        <HStack spacing={1}>
                                            <IconButton
                                                aria-label="First page"
                                                icon={<FiChevronsLeft />}
                                                size="sm"
                                                variant="ghost"
                                                isDisabled={currentPage === 1}
                                                onClick={() => handlePageChange(1)}
                                            />
                                            <IconButton
                                                aria-label="Previous page"
                                                icon={<FiChevronLeft />}
                                                size="sm"
                                                variant="ghost"
                                                isDisabled={currentPage === 1}
                                                onClick={() => handlePageChange(currentPage - 1)}
                                            />

                                            {getPageNumbers().map(page => (
                                                <Button
                                                    key={page}
                                                    size="sm"
                                                    variant={currentPage === page ? "solid" : "ghost"}
                                                    colorScheme={currentPage === page ? "orange" : "gray"}
                                                    onClick={() => handlePageChange(page)}
                                                    minW="8"
                                                >
                                                    {page}
                                                </Button>
                                            ))}

                                            <IconButton
                                                aria-label="Next page"
                                                icon={<FiChevronRight />}
                                                size="sm"
                                                variant="ghost"
                                                isDisabled={currentPage === totalPages}
                                                onClick={() => handlePageChange(currentPage + 1)}
                                            />
                                            <IconButton
                                                aria-label="Last page"
                                                icon={<FiChevronsRight />}
                                                size="sm"
                                                variant="ghost"
                                                isDisabled={currentPage === totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                            />
                                        </HStack>
                                    </HStack>
                                </Flex>
                            )}

                            {currentPartners.length === 0 && !loading && (
                                <Center py={8}>
                                    <Text color="gray.500">No channel partners found</Text>
                                </Center>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Files Modal */}
            <Modal isOpen={isFilesModalOpen} onClose={onFilesModalClose} size="6xl">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)"
                    bg="white"
                    backdropFilter="blur(20px)"
                    maxH="80vh"
                    overflow="hidden"
                >
                    <ModalHeader
                        textAlign="center"
                        fontSize="xl"
                        fontWeight="bold"
                        bgGradient="linear(to-r, orange.400, purple.500)"
                        bgClip="text"
                        pb={4}
                    >
                        <VStack spacing={2}>
                            <Text>Files for {selectedPartnerForFiles?.typeName} Channel Partner</Text>
                            <Text fontSize="sm" color="gray.600" fontWeight="normal">
                                Total Files: {partnerFiles.length}
                            </Text>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody overflowY="auto">
                        <Flex justify="flex-end" mb={4}>
                            <Button
                                leftIcon={<FiDownload />}
                                colorScheme="green"
                                size="sm"
                                onClick={exportFilesToExcel}
                                isDisabled={partnerFiles.length === 0}
                            >
                                Export Files to Excel
                            </Button>
                        </Flex>

                        {filesLoading ? (
                            <Center py={8}>
                                <Spinner size="xl" color="orange.500" />
                            </Center>
                        ) : partnerFiles.length === 0 ? (
                            <Center py={8} textAlign="center">
                                <VStack spacing={4}>
                                    <Box
                                        p={4}
                                        bg="gray.50"
                                        borderRadius="xl"
                                    >
                                        <FiFile size={48} color="#A0AEC0" />
                                    </Box>
                                    <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                                        No Files Found
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">
                                        There are no files associated with this channel partner type.
                                    </Text>
                                </VStack>
                            </Center>
                        ) : (
                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">File Name</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">File Type</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">File Size</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Upload Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Uploaded By</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Assigned KAR</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Region</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Validity Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Expiry Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">File Version</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Status</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold">Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {partnerFiles.map((file) => (
                                            <Tr
                                                key={file.id}
                                                _hover={{ bg: 'gray.50' }}
                                                transition="all 0.2s"
                                            >
                                                <Td>
                                                    <HStack spacing={3}>
                                                        <Box
                                                            p={2}
                                                            bgGradient="linear(to-r, blue.100, purple.100)"
                                                            borderRadius="lg"
                                                        >
                                                            <FiFileText color="#9C27B0" />
                                                        </Box>
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontWeight="medium" color="gray.800">
                                                                {file.fileName}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                ID: {file.id}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Badge
                                                        colorScheme="blue"
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        fontSize="xs"
                                                        fontWeight="bold"
                                                    >
                                                        {getFileTypeShort(file.fileType)}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {formatFileSize(file.fileSize)}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {formatUploadDate(file.uploadDate)}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <VStack align="start" spacing={0}>
                                                        <HStack spacing={2}>
                                                            <FiUser size={14} color="#718096" />
                                                            <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                                                {getUploadedByFullName(file)}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {file.uploadedBy?.role?.name || ''}
                                                        </Text>
                                                    </VStack>
                                                </Td>
                                                <Td>
                                                    {file.assignedKAR ? (
                                                        <VStack align="start" spacing={0}>
                                                            <HStack spacing={2}>
                                                                <FiUser size={14} color="#9C27B0" />
                                                                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                                                    {getAssignedKARFullName(file)}
                                                                </Text>
                                                            </HStack>
                                                            <Text fontSize="xs" color="gray.500">
                                                                {file.assignedKAR?.role?.name || ''}
                                                            </Text>
                                                        </VStack>
                                                    ) : (
                                                        <Badge
                                                            colorScheme="gray"
                                                            borderRadius="full"
                                                            px={2}
                                                            py={1}
                                                            fontSize="xs"
                                                        >
                                                            Not Assigned
                                                        </Badge>
                                                    )}
                                                </Td>
                                                <Td>
                                                    <VStack align="start" spacing={0}>
                                                        <HStack spacing={2}>
                                                            <FiGlobe size={14} color="#3182CE" />
                                                            <Text fontSize="sm" color="gray.800" fontWeight="medium">
                                                                {file.region?.regionName || 'N/A'}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {file.region?.regionCode || ''}
                                                        </Text>
                                                    </VStack>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {file.validityDate || 'N/A'}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Text fontSize="sm" color="gray.600">
                                                        {file.expiryDate || 'N/A'}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge
                                                        colorScheme="purple"
                                                        borderRadius="full"
                                                        px={2}
                                                        py={1}
                                                        fontSize="xs"
                                                    >
                                                        {file.fileVersion || '1.0'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Badge
                                                        colorScheme={file.expired ? 'red' : file.valid ? 'green' : 'gray'}
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                    >
                                                        {file.expired ? 'Expired' : file.valid ? 'Valid' : 'Unknown'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Tooltip label="Download File">
                                                        <IconButton
                                                            aria-label="Download File"
                                                            icon={downloadingFileId === file.id ? <Spinner size="sm" /> : <FiDownload />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                            isDisabled={downloadingFileId !== null}
                                                            _hover={{
                                                                transform: 'translateY(-2px)',
                                                                bg: 'blue.50'
                                                            }}
                                                            transition="all 0.2s"
                                                        />
                                                    </Tooltip>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={onFilesModalClose}
                            colorScheme="gray"
                            variant="ghost"
                            borderRadius="xl"
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Rest of the modals (Add, Edit, Delete) remain the same */}
            {/* Add Channel Partner Modal */}
            <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="lg">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)"
                    bg="white"
                    backdropFilter="blur(20px)"
                >
                    <ModalHeader
                        textAlign="center"
                        fontSize="xl"
                        fontWeight="bold"
                        bgGradient="linear(to-r, orange.400, purple.500)"
                        bgClip="text"
                        pb={4}
                    >
                        Create New Channel Partner
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleAddSubmit}>
                            <VStack spacing={4}>
                                <FormControl id="typeName" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Type Name
                                    </FormLabel>
                                    <Input
                                        name="typeName"
                                        value={newChannelPartner.typeName}
                                        onChange={handleAddChange}
                                        placeholder="e.g., Vendor, Distributor, Reseller"
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    />
                                </FormControl>

                                <FormControl id="description">
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Description
                                    </FormLabel>
                                    <Input
                                        name="description"
                                        value={newChannelPartner.description}
                                        onChange={handleAddChange}
                                        placeholder="Brief description of the channel partner type"
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    />
                                </FormControl>
                            </VStack>
                            <ModalFooter pt={6}>
                                <Button
                                    type="submit"
                                    colorScheme="orange"
                                    borderRadius="xl"
                                    bgGradient="linear(to-r, orange.400, orange.500)"
                                    _hover={{
                                        bgGradient: "linear(to-r, orange.500, orange.600)",
                                        transform: 'translateY(-2px)'
                                    }}
                                    _active={{ transform: 'translateY(0)' }}
                                    transition="all 0.2s"
                                    width="full"
                                >
                                    Create Channel Partner
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Edit Channel Partner Modal */}
            <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="lg">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)"
                    bg="white"
                    backdropFilter="blur(20px)"
                >
                    <ModalHeader
                        textAlign="center"
                        fontSize="xl"
                        fontWeight="bold"
                        bgGradient="linear(to-r, orange.400, purple.500)"
                        bgClip="text"
                        pb={4}
                    >
                        Edit Channel Partner
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleEditSubmit}>
                            <VStack spacing={4}>
                                <FormControl id="typeName" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Type Name
                                    </FormLabel>
                                    <Input
                                        name="typeName"
                                        value={currentChannelPartner.typeName || ''}
                                        onChange={handleEditChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    />
                                </FormControl>

                                <FormControl id="description">
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Description
                                    </FormLabel>
                                    <Input
                                        name="description"
                                        value={currentChannelPartner.description || ''}
                                        onChange={handleEditChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    />
                                </FormControl>
                            </VStack>
                            <ModalFooter pt={6}>
                                <Button
                                    type="submit"
                                    colorScheme="orange"
                                    borderRadius="xl"
                                    bgGradient="linear(to-r, orange.400, orange.500)"
                                    _hover={{
                                        bgGradient: "linear(to-r, orange.500, orange.600)",
                                        transform: 'translateY(-2px)'
                                    }}
                                    _active={{ transform: 'translateY(0)' }}
                                    transition="all 0.2s"
                                    width="full"
                                >
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} size="md">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)"
                    bg="white"
                    backdropFilter="blur(20px)"
                    textAlign="center"
                    p={6}
                >
                    <Box
                        p={4}
                        bg="red.50"
                        borderRadius="xl"
                        mb={4}
                    >
                        <FiTrash2 size="48px" color="#E53E3E" />
                    </Box>

                    <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={2}>
                        Confirm Deletion
                    </Text>

                    <Text color="gray.600" mb={6}>
                        Are you sure you want to delete the channel partner{' '}
                        <Text as="span" fontWeight="semibold" color="orange.500">
                            {channelPartnerToDelete?.typeName}
                        </Text>
                        ? This action cannot be undone.
                    </Text>

                    <HStack spacing={3} justify="center">
                        <Button
                            onClick={onDeleteModalClose}
                            variant="outline"
                            borderRadius="xl"
                            colorScheme="gray"
                            flex={1}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            colorScheme="red"
                            borderRadius="xl"
                            bgGradient="linear(to-r, red.400, red.500)"
                            _hover={{
                                bgGradient: "linear(to-r, red.500, red.600)",
                                transform: 'translateY(-2px)'
                            }}
                            flex={1}
                        >
                            Delete
                        </Button>
                    </HStack>
                </ModalContent>
            </Modal>
        </Box>
    );
}