import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Input,
    InputGroup,
    InputLeftElement,
    Button,
    Select,
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
    Tooltip,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Spinner,
    Center
} from '@chakra-ui/react';
import { FiSearch, FiEdit, FiFileText, FiDownload, FiUser, FiGlobe, FiUsers, FiFile, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';

const UserHome = () => {
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [isEditFileOpen, setIsEditFileOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [validityFilter, setValidityFilter] = useState('');
    const toast = useToast();
    const [regions, setRegions] = useState([]);
    const [channelPartnerTypes, setChannelPartnerTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // New state for modal details
    const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
    const [modalDetails, setModalDetails] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Status options for filtering
    const fileStatusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'VALID', label: 'Valid' },
        { value: 'EXPIRED', label: 'Expired' }
    ];

    const validityOptions = [
        { value: '', label: 'All Validity' },
        { value: 'valid', label: 'Currently Valid' },
        { value: 'expired', label: 'Expired' }
    ];

    // Get user ID from token and fetch files
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const extractedUserId = decodedToken.userId;
                setUserId(extractedUserId);

                // Fetch files immediately with the user ID
                if (extractedUserId) {
                    fetchFiles(extractedUserId);
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, []);

    const fetchFiles = (userIdToFetch) => {
        const token = localStorage.getItem("token");
        setLoading(true);
        axios.get(`http://localhost:8277/api/files/user/${userIdToFetch}/all`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.data.success) {
                    setFiles(response.data.body);
                    setFilteredFiles(response.data.body);
                } else {
                    toast({
                        title: 'Error',
                        description: response.data.message,
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching user files:', error);
                toast({
                    title: 'Error',
                    description: 'Error fetching files',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => setLoading(false));
    };

    const fetchRegions = () => {
        const token = localStorage.getItem("token");
        axios.get('http://localhost:8277/api/regions', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.data.success) {
                    setRegions(response.data.body);
                }
            })
            .catch(error => {
                console.error('Error fetching regions:', error);
            });
    };

    const fetchChannelPartnerTypes = () => {
        const token = localStorage.getItem("token");
        axios.get('http://localhost:8277/api/channel-partner-types', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.data.success) {
                    setChannelPartnerTypes(response.data.body);
                }
            })
            .catch(error => {
                console.error('Error fetching channel partner types:', error);
            });
    };

    const fetchUsers = () => {
        const token = localStorage.getItem("token");
        axios.get('http://localhost:8277/api/users', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.data.success) {
                    setUsers(response.data.body);
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    };

    useEffect(() => {
        fetchRegions();
        fetchChannelPartnerTypes();
        fetchUsers();
    }, []);

    // Filter files based on search query and status filters
    useEffect(() => {
        let filtered = files;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(file =>
                (file.fileName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (file.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter) {
            if (statusFilter === 'VALID') {
                filtered = filtered.filter(file => file.valid);
            } else if (statusFilter === 'EXPIRED') {
                filtered = filtered.filter(file => file.expired);
            }
        }

        // Apply validity filter
        if (validityFilter) {
            if (validityFilter === 'valid') {
                filtered = filtered.filter(file => file.valid && !file.expired);
            } else if (validityFilter === 'expired') {
                filtered = filtered.filter(file => file.expired);
            }
        }

        setFilteredFiles(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, statusFilter, validityFilter, files]);

    // Pagination calculations
    const totalItems = filteredFiles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFiles = filteredFiles.slice(startIndex, endIndex);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleValidityFilterChange = (e) => {
        setValidityFilter(e.target.value);
    };

    const handleEditFileChange = (e) => {
        const { name, value, type } = e.target;
        setCurrentFile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value,
        }));
    };

    const handleFileSelect = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleEditFileSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        try {
            const formData = new FormData();
            formData.append('fileName', currentFile.fileName);
            formData.append('description', currentFile.description);
            formData.append('expiryDate', currentFile.expiryDate);
            formData.append('validityDate', currentFile.validityDate);
            formData.append('regional', currentFile.regional);
            formData.append('channelPartnerTypeId', currentFile.channelPartnerTypeId);
            formData.append('assignedKARId', currentFile.assignedKARId);

            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await axios.put(`http://localhost:8277/api/files/${currentFile.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'File updated successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                fetchFiles(userId);
                setIsEditFileOpen(false);
                setSelectedFile(null);
            } else {
                toast({
                    title: 'Error',
                    description: response.data.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error updating file:', error);
            toast({
                title: 'Error',
                description: 'Error updating file',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Check if current user can edit the file (only if they uploaded it)
    const canUserEditFile = (file) => {
        return file.uploadedBy && file.uploadedBy.id === userId;
    };

    const onEditClick = (file) => {
        if (!canUserEditFile(file)) {
            toast({
                title: 'Access Denied',
                description: 'You can only edit files that you have uploaded',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setCurrentFile({
            ...file,
            regional: file.region?.id || '',
            channelPartnerTypeId: file.channelPartnerType?.id || '',
            assignedKARId: file.assignedKAR?.id || ''
        });
        setIsEditFileOpen(true);
    };

    const handleDownloadFile = async (fileId, fileName, fileType) => {
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
        }
    };

    const formatUploadDate = (uploadDate) => {
        if (!uploadDate) return '';
        return uploadDate.split('T')[0];
    };

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

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleViewDetails = (details, type) => {
        setModalDetails(details);
        setModalTitle(type);
        onDetailsModalOpen();
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredFiles.map(file => ({
            'File Name': file.fileName,
            'File Size': formatFileSize(file.fileSize),
            'File Type': getFileTypeShort(file.fileType),
            'Upload Date': formatUploadDate(file.uploadDate),
            'Validity Date': file.validityDate,
            'Expiry Date': file.expiryDate,
            'Status': file.expired ? 'Expired' : 'Valid',
            'Region': file.region?.regionName,
            'Channel Partner': file.channelPartnerType?.typeName,
            'Assigned KAR': file.assignedKAR ? `${file.assignedKAR.firstName} ${file.assignedKAR.lastName}` : 'Not Assigned',
            'Uploaded By': file.uploadedBy ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}` : 'Unknown',
            'Description': file.description,
            'Ownership': file.uploadedBy?.id === userId ? 'Uploaded by me' : 'Assigned to me'
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'My Files');
        XLSX.writeFile(workbook, `my_files_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: 'Success',
            description: 'Excel file exported successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
        });
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

    return (
        <Box
            minH="100vh"
            bg="gray.50"
        >
            <Flex
                justify="center"
                align="center"
                mb={2}
                mt={1}
                position="sticky"
                top={2}
                zIndex={100}
            >
                <Card
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="gray.100"
                    width="full"
                    maxW="1200px"
                >
                    <CardBody p={6}>
                        <Flex
                            direction={{ base: 'column', md: 'row' }}
                            gap={4}
                            width="full"
                            justify="center"
                            align="center"
                        >
                            {/* Search Input */}
                            <InputGroup width="full" maxW="300px">
                                <InputLeftElement>
                                    <FiSearch color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search my files by name or description..."
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

                            {/* Filters */}
                            <HStack spacing={3} flexWrap="wrap" justify="center">
                                <FormControl width="160px">
                                    <Select
                                        value={statusFilter}
                                        onChange={handleStatusFilterChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                        size="md"
                                    >
                                        {fileStatusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl width="160px">
                                    <Select
                                        value={validityFilter}
                                        onChange={handleValidityFilterChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                        size="md"
                                    >
                                        {validityOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </HStack>

                            {/* Export Button */}
                            <Tooltip label="Export to Excel">
                                <Button
                                    onClick={exportToExcel}
                                    variant="solid"
                                    size="md"
                                    leftIcon={<FiFile />}
                                    borderRadius="xl"
                                    bgGradient="linear(to-r, green.400, green.500)"
                                    color="white"
                                    _hover={{
                                        bgGradient: "linear(to-r, green.500, green.600)",
                                        transform: 'translateY(-1px)'
                                    }}
                                    transition="all 0.2s"
                                    height="40px"
                                    px={6}
                                    flexShrink={0}
                                >
                                    Export to Excel
                                </Button>
                            </Tooltip>
                        </Flex>
                    </CardBody>
                </Card>
            </Flex>

            {/* Data Table Card */}
            <Card
                bg="white"
                borderRadius="2xl"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="gray.100"
                mt={16}
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
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">File Name</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">File Type</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Upload Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Validity Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Expiry Date</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Status</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Region</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Channel Partner</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Assigned KAR</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Uploaded By</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Ownership</Th>
                                            <Th bg="gray.50" color="gray.600" fontWeight="semibold" border="1px" borderColor="gray.200">Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {currentFiles.map((file) => (
                                            <Tr
                                                key={file.id}
                                                _hover={{
                                                    bg: 'orange.50',
                                                    transform: 'translateY(-1px)',
                                                    transition: 'all 0.2s'
                                                }}
                                                transition="all 0.2s"
                                            >
                                                <Td borderColor="gray.100" fontWeight="medium">{file.fileName}</Td>
                                                <Td borderColor="gray.100">
                                                    <Badge
                                                        colorScheme="blue"
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        fontSize="xs"
                                                        fontWeight="bold"
                                                        bg="blue.50"
                                                        color="blue.700"
                                                    >
                                                        {getFileTypeShort(file.fileType)}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor="gray.100">{formatUploadDate(file.uploadDate)}</Td>
                                                <Td borderColor="gray.100">{file.validityDate}</Td>
                                                <Td borderColor="gray.100">{file.expiryDate}</Td>
                                                <Td borderColor="gray.100">
                                                    <Badge
                                                        colorScheme={file.expired ? 'red' : file.valid ? 'green' : 'gray'}
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                        bgGradient={`linear(to-r, ${file.expired ? 'red' : file.valid ? 'green' : 'gray'}.100, ${file.expired ? 'red' : file.valid ? 'green' : 'gray'}.200)`}
                                                        color={`${file.expired ? 'red' : file.valid ? 'green' : 'gray'}.700`}
                                                    >
                                                        {file.expired ? 'Expired' : file.valid ? 'Valid' : 'Unknown'}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        leftIcon={<FiGlobe />}
                                                        onClick={() => handleViewDetails(file.region, 'Region')}
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            bg: 'blue.50'
                                                        }}
                                                        transition="all 0.2s"
                                                        color="blue.600"
                                                        fontWeight="medium"
                                                    >
                                                        {file.region?.regionName}
                                                    </Button>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        leftIcon={<FiUsers />}
                                                        onClick={() => handleViewDetails(file.channelPartnerType, 'Channel Partner Type')}
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            bg: 'purple.50'
                                                        }}
                                                        transition="all 0.2s"
                                                        color="purple.600"
                                                        fontWeight="medium"
                                                    >
                                                        {file.channelPartnerType?.typeName}
                                                    </Button>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        leftIcon={<FiUser />}
                                                        onClick={() => handleViewDetails(file.assignedKAR, 'Assigned KAR')}
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            bg: 'green.50'
                                                        }}
                                                        transition="all 0.2s"
                                                        color="green.600"
                                                        fontWeight="medium"
                                                    >
                                                        {file.assignedKAR ? `${file.assignedKAR.firstName} ${file.assignedKAR.lastName}` : 'Not Assigned'}
                                                    </Button>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        leftIcon={<FiUser />}
                                                        onClick={() => handleViewDetails(file.uploadedBy, 'Uploaded By')}
                                                        _hover={{
                                                            transform: 'translateY(-1px)',
                                                            bg: 'orange.50'
                                                        }}
                                                        transition="all 0.2s"
                                                        color="orange.600"
                                                        fontWeight="medium"
                                                    >
                                                        {file.uploadedBy ? `${file.uploadedBy.firstName} ${file.uploadedBy.lastName}` : 'Unknown'}
                                                    </Button>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <Badge
                                                        colorScheme={file.uploadedBy?.id === userId ? 'green' : 'blue'}
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                    >
                                                        {file.uploadedBy?.id === userId ? 'My Upload' : 'Assigned to me'}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor="gray.100">
                                                    <HStack spacing={1}>
                                                        {canUserEditFile(file) && (
                                                            <Tooltip label="Edit File">
                                                                <IconButton
                                                                    aria-label="Edit"
                                                                    icon={<FiEdit />}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    colorScheme="blue"
                                                                    onClick={() => onEditClick(file)}
                                                                    _hover={{
                                                                        transform: 'translateY(-2px)',
                                                                        bg: 'blue.50'
                                                                    }}
                                                                    transition="all 0.2s"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip label="Download File">
                                                            <IconButton
                                                                aria-label="Download"
                                                                icon={<FiDownload />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="green"
                                                                onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                                _hover={{
                                                                    transform: 'translateY(-2px)',
                                                                    bg: 'green.50'
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

                            {currentFiles.length === 0 && !loading && (
                                <Center py={8}>
                                    <Text color="gray.500">No files found</Text>
                                </Center>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={onDetailsModalClose} size="md">
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
                        {modalTitle} Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {modalDetails && (
                            <VStack spacing={3} align="stretch">
                                {Object.entries(modalDetails).map(([key, value]) => {
                                    if (value === null || value === '' || typeof value === 'object') return null;

                                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    let icon = FiFileText;

                                    if (key.includes('region') || key.includes('Region')) icon = FiGlobe;
                                    if (key.includes('user') || key.includes('KAR') || key.includes('uploaded')) icon = FiUser;
                                    if (key.includes('channel') || key.includes('partner')) icon = FiUsers;

                                    return (
                                        <Flex
                                            key={key}
                                            p={3}
                                            bg="gray.50"
                                            borderRadius="xl"
                                            align="center"
                                            transition="all 0.2s"
                                            _hover={{ bg: "gray.100", transform: "translateX(4px)" }}
                                        >
                                            <Box
                                                p={2}
                                                bgGradient="linear(to-r, orange.100, purple.100)"
                                                borderRadius="lg"
                                                mr={3}
                                            >
                                                {React.createElement(icon, { color: "#9C27B0" })}
                                            </Box>
                                            <VStack align="start" spacing={0} flex={1}>
                                                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                                    {formattedKey}
                                                </Text>
                                                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                                    {String(value)}
                                                </Text>
                                            </VStack>
                                        </Flex>
                                    );
                                })}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={onDetailsModalClose}
                            colorScheme="gray"
                            variant="ghost"
                            borderRadius="xl"
                            width="full"
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit File Modal */}
            <Modal isOpen={isEditFileOpen} onClose={() => setIsEditFileOpen(false)} size="xl">
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
                        Edit File
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleEditFileSubmit}>
                            <VStack spacing={4}>
                                {/* Row 1: File Name & Description */}
                                <Flex width="100%" direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            File Name *
                                        </FormLabel>
                                        <Input
                                            name="fileName"
                                            value={currentFile.fileName || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Description
                                        </FormLabel>
                                        <Input
                                            name="description"
                                            value={currentFile.description || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                </Flex>

                                {/* Row 2: Validity Date & Expiry Date */}
                                <Flex width="100%" direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Validity Date
                                        </FormLabel>
                                        <Input
                                            name="validityDate"
                                            type="date"
                                            value={currentFile.validityDate || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Expiry Date
                                        </FormLabel>
                                        <Input
                                            name="expiryDate"
                                            type="date"
                                            value={currentFile.expiryDate || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                </Flex>

                                {/* Row 3: Region & Channel Partner Type */}
                                <Flex width="100%" direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Region
                                        </FormLabel>
                                        <Select
                                            name="regional"
                                            value={currentFile.regional || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        >
                                            <option value="">Select Region</option>
                                            {regions.map(region => (
                                                <option key={region.id} value={region.id}>
                                                    {region.regionName}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Channel Partner Type
                                        </FormLabel>
                                        <Select
                                            name="channelPartnerTypeId"
                                            value={currentFile.channelPartnerTypeId || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        >
                                            <option value="">Select Channel Partner Type</option>
                                            {channelPartnerTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.typeName}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Flex>

                                {/* Row 4: Assigned KAR & File Upload */}
                                <Flex width="100%" direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl width="100%">
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Assigned KAR
                                        </FormLabel>
                                        <Select
                                            name="assignedKARId"
                                            value={currentFile.assignedKARId || ''}
                                            onChange={handleEditFileChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        >
                                            <option value="">Select Assigned KAR</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl width="100%">
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Upload New File (Optional)
                                        </FormLabel>
                                        <Input
                                            type="file"
                                            onChange={handleFileSelect}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                            p={1}
                                        />
                                    </FormControl>
                                </Flex>
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
                                    Update File
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default UserHome;