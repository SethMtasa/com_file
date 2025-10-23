import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    FiSearch,
    FiDownload,
    FiFileText,
    FiCalendar,
    FiFolder,
    FiPlus,
    FiTrash2,
    FiUpload,
    FiUser,
    FiHome,
    FiFile,
    FiCheck,
    FiList
} from 'react-icons/fi';
import {
    Box,
    VStack,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Button,
    Select,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    IconButton,
    ModalFooter,
    FormLabel,
    FormControl,
    Flex,
    Text,
    Card,
    CardBody,
    Badge,
    SimpleGrid,
    Progress,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Avatar,
    AvatarGroup,
    Divider
} from '@chakra-ui/react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function Documents() {
    const [activeTab, setActiveTab] = useState(0);
    const [leases, setLeases] = useState([]);
    const [selectedLease, setSelectedLease] = useState('');
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const toast = useToast();
    const fileInputRef = useRef(null);

    // Upload document state
    const [uploadData, setUploadData] = useState({
        files: [],
        documentRequests: []
    });

    const fetchApprovedLeases = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://10.95.10.92:8277/api/leases/approved', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setLeases(response.data.body);
            }
        } catch (error) {
            console.error('Error fetching approved leases:', error);
            toast({
                title: 'Error',
                description: 'Failed to load approved leases',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchDocumentsByLease = async (leaseId) => {
        if (!leaseId) return;

        setDocumentsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://10.95.10.92:8277/api/documents/lease/${leaseId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setDocuments(response.data.body);
                setFilteredDocuments(response.data.body);
            } else {
                setDocuments([]);
                setFilteredDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load documents',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setDocuments([]);
            setFilteredDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedLeases();
    }, []);

    useEffect(() => {
        if (selectedLease) {
            fetchDocumentsByLease(selectedLease);
        } else {
            setDocuments([]);
            setFilteredDocuments([]);
        }
    }, [selectedLease]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = documents.filter(doc =>
            (doc.fileName?.toLowerCase() || '').includes(query) ||
            (doc.documentType?.toLowerCase() || '').includes(query) ||
            (doc.category?.toLowerCase() || '').includes(query) ||
            (doc.description?.toLowerCase() || '').includes(query)
        );
        setFilteredDocuments(filtered);
    }, [searchQuery, documents]);

    const handleLeaseChange = (e) => {
        setSelectedLease(e.target.value);
        setSearchQuery('');
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Upload Document Functions
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadData(prev => ({
            ...prev,
            files: [...prev.files, ...files]
        }));

        // Auto-create document requests for new files
        const newDocumentRequests = files.map(file => ({
            documentType: '',
            category: '',
            description: ''
        }));

        setUploadData(prev => ({
            ...prev,
            documentRequests: [...prev.documentRequests, ...newDocumentRequests]
        }));
    };

    const handleDocumentRequestChange = (index, field, value) => {
        const updatedRequests = [...uploadData.documentRequests];
        updatedRequests[index] = {
            ...updatedRequests[index],
            [field]: value
        };
        setUploadData(prev => ({
            ...prev,
            documentRequests: updatedRequests
        }));
    };

    const removeFile = (index) => {
        const updatedFiles = uploadData.files.filter((_, i) => i !== index);
        const updatedRequests = uploadData.documentRequests.filter((_, i) => i !== index);
        setUploadData({
            files: updatedFiles,
            documentRequests: updatedRequests
        });
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();

        if (!selectedLease) {
            toast({
                title: 'Validation Error',
                description: 'Please select a lease to upload documents to.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (uploadData.files.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please select at least one file to upload.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        const token = localStorage.getItem("token");
        const formData = new FormData();

        // Append files
        uploadData.files.forEach(file => {
            formData.append('files', file);
        });

        // Append documentRequests as a SINGLE JSON array string
        formData.append('documentRequests', JSON.stringify(uploadData.documentRequests));

        try {
            setUploadProgress(0);
            const response = await axios.post(`http://10.95.10.92:8277/api/leases/${selectedLease}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: response.data.message || 'Documents uploaded successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Refresh documents list
                fetchDocumentsByLease(selectedLease);

                // Reset form and close modal
                setIsUploadModalOpen(false);
                setUploadData({
                    files: [],
                    documentRequests: []
                });
                setUploadProgress(0);
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
            console.error('Error uploading documents:', error);
            toast({
                title: 'Error',
                description: 'Error uploading documents',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Delete Document Functions
    const handleDeleteClick = (document) => {
        setDocumentToDelete(document);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.delete(`http://10.95.10.92:8277/api/documents/${documentToDelete.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: response.data.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Refresh documents list
                fetchDocumentsByLease(selectedLease);

                setIsDeleteDialogOpen(false);
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
            console.error('Error deleting document:', error);
            toast({
                title: 'Error',
                description: 'Error deleting document',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleFileDownload = async (id, fileName) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://10.95.10.92:8277/api/documents/${id}/file`, {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `document_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Success',
                description: 'File download started',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            toast({
                title: 'Error',
                description: 'Could not download the file',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Template Functions
    const fileNameBodyTemplate = (rowData) => {
        return (
            <HStack spacing={3}>
                <Box
                    p={2}
                    bgGradient="linear(to-r, red.100, orange.100)"
                    borderRadius="lg"
                >
                    <FiFileText color="#DD6B20" />
                </Box>
                <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" color="gray.800" noOfLines={1}>
                        {rowData.fileName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        ID: {rowData.id} • {rowData.description}
                    </Text>
                </VStack>
            </HStack>
        );
    };

    const documentTypeBodyTemplate = (rowData) => {
        return (
            <Badge
                colorScheme="blue"
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="medium"
            >
                {rowData.documentType || 'N/A'}
            </Badge>
        );
    };

    const categoryBodyTemplate = (rowData) => {
        const getCategoryColor = (category) => {
            switch (category?.toLowerCase()) {
                case 'contract': return 'green';
                case 'certificate': return 'teal';
                case 'lease_agreement': return 'blue';
                case 'insurance': return 'orange';
                case 'identification': return 'red';
                default: return 'gray';
            }
        };

        return (
            <Badge
                colorScheme={getCategoryColor(rowData.category)}
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="medium"
            >
                {rowData.category || 'Uncategorized'}
            </Badge>
        );
    };

    const uploadTimeBodyTemplate = (rowData) => {
        return (
            <HStack spacing={2}>
                <FiCalendar size={14} color="#718096" />
                <Text fontSize="sm" color="gray.600">
                    {new Date(rowData.uploadTime).toLocaleDateString()}
                </Text>
            </HStack>
        );
    };

    const actionsBodyTemplate = (rowData) => {
        return (
            <HStack spacing={2}>
                <IconButton
                    aria-label="Download file"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => handleFileDownload(rowData.id, rowData.fileName)}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                />
                <IconButton
                    aria-label="Delete document"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDeleteClick(rowData)}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                />
            </HStack>
        );
    };

    const getSelectedLeaseDetails = () => {
        return leases.find(lease => lease.id.toString() === selectedLease);
    };

    return (
        <Box minH="100vh" bg="gray.50" p={6}>
            {/* Header */}
            <VStack spacing={6} align="stretch" mb={8}>
                <Text fontSize="3xl" fontWeight="bold" textAlign="center" bgGradient="linear(to-r, orange.400, purple.600)" bgClip="text">
                    Lease Document Management
                </Text>

            </VStack>

            {/* Main Action Cards */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
                {/* Add Documents Card */}
                <Card
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
                    border="1px solid"
                    borderColor="gray.100"
                    _hover={{
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 48px rgba(255, 138, 0, 0.15)'
                    }}
                    transition="all 0.3s ease"
                    cursor="pointer"
                    onClick={() => setActiveTab(0)}
                >
                    <CardBody p={8}>
                        <VStack spacing={4} align="center" textAlign="center">
                            <Box
                                p={4}
                                bgGradient="linear(to-r, green.100, teal.100)"
                                borderRadius="xl"
                            >
                                <FiUpload size={32} color="#319795" />
                            </Box>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                Add Documents to Lease
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Upload new documents and attach them to approved leases. Support for multiple files with metadata.
                            </Text>
                            <Badge colorScheme="green" borderRadius="full" px={3}>
                                {leases.length} Approved Leases
                            </Badge>
                        </VStack>
                    </CardBody>
                </Card>

                {/* View Documents Card */}
                <Card
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
                    border="1px solid"
                    borderColor="gray.100"
                    _hover={{
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 48px rgba(128, 90, 213, 0.15)'
                    }}
                    transition="all 0.3s ease"
                    cursor="pointer"
                    onClick={() => setActiveTab(1)}
                >
                    <CardBody p={8}>
                        <VStack spacing={4} align="center" textAlign="center">
                            <Box
                                p={4}
                                bgGradient="linear(to-r, purple.100, pink.100)"
                                borderRadius="xl"
                            >
                                <FiFileText size={32} color="#805AD5" />
                            </Box>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                View Lease Documents
                            </Text>
                            <Text color="gray.600" fontSize="sm">
                                Browse, search, and download documents attached to leases. Manage your document library efficiently.
                            </Text>
                            <Badge colorScheme="purple" borderRadius="full" px={3}>
                                PDF Documents
                            </Badge>
                        </VStack>
                    </CardBody>
                </Card>
            </SimpleGrid>

            {/* Content Area */}
            <Card
                bg="white"
                borderRadius="2xl"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
                border="1px solid"
                borderColor="gray.100"
            >
                <CardBody p={6}>
                    <Tabs index={activeTab} onChange={setActiveTab} isLazy>
                        <TabList mb={6}>
                            <Tab _selected={{ color: 'orange.500', borderColor: 'orange.500' }}>
                                <FiUpload style={{ marginRight: '8px' }} />
                                Add Documents
                            </Tab>
                            <Tab _selected={{ color: 'purple.500', borderColor: 'purple.500' }}>
                                <FiFileText style={{ marginRight: '8px' }} />
                                View Documents
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Add Documents Panel */}
                            <TabPanel>
                                <VStack spacing={6} align="stretch">
                                    {/* Lease Selection */}
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Select Approved Lease *
                                        </FormLabel>
                                        <Select
                                            placeholder="Choose a lease..."
                                            value={selectedLease}
                                            onChange={handleLeaseChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                            isDisabled={loading}
                                        >
                                            {leases.map(lease => (
                                                <option key={lease.id} value={lease.id}>
                                                    {lease.agreementNumber} - {lease.site?.siteName}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {selectedLease && (
                                        <>
                                            {/* Lease Details Card */}
                                            <Card bg="orange.50" border="1px solid" borderColor="orange.200">
                                                <CardBody p={4}>
                                                    <HStack justify="space-between">
                                                        <VStack align="start" spacing={1}>
                                                            <Text fontWeight="bold" color="orange.700">
                                                                {getSelectedLeaseDetails()?.agreementNumber}
                                                            </Text>
                                                            <Text fontSize="sm" color="orange.600">
                                                                {getSelectedLeaseDetails()?.site?.siteName}
                                                            </Text>
                                                            <Text fontSize="xs" color="orange.500">
                                                                Landlord: {getSelectedLeaseDetails()?.landlord?.fullName}
                                                            </Text>
                                                        </VStack>
                                                        <Badge colorScheme="orange" borderRadius="full">
                                                            {getSelectedLeaseDetails()?.documentCount || 0} Documents
                                                        </Badge>
                                                    </HStack>
                                                </CardBody>
                                            </Card>

                                            {/* Upload Section */}
                                            <Card>
                                                <CardBody>
                                                    <VStack spacing={4}>
                                                        <Button
                                                            leftIcon={<FiPlus />}
                                                            colorScheme="orange"
                                                            borderRadius="xl"
                                                            onClick={() => setIsUploadModalOpen(true)}
                                                            size="lg"
                                                        >
                                                            Add Documents to This Lease
                                                        </Button>
                                                        <Text fontSize="sm" color="gray.600" textAlign="center">
                                                            You can upload multiple PDF documents with their metadata
                                                        </Text>
                                                    </VStack>
                                                </CardBody>
                                            </Card>
                                        </>
                                    )}
                                </VStack>
                            </TabPanel>

                            {/* View Documents Panel */}
                            <TabPanel>
                                <VStack spacing={6} align="stretch">
                                    {/* Lease Selection and Search */}
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                                Select Lease to View Documents
                                            </FormLabel>
                                            <Select
                                                placeholder="Choose a lease..."
                                                value={selectedLease}
                                                onChange={handleLeaseChange}
                                                borderRadius="xl"
                                                border="1px solid"
                                                borderColor="gray.200"
                                                _focus={{
                                                    borderColor: 'purple.400',
                                                    boxShadow: '0 0 0 1px purple.400'
                                                }}
                                            >
                                                {leases.map(lease => (
                                                    <option key={lease.id} value={lease.id}>
                                                        {lease.agreementNumber} - {lease.site?.siteName}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                                Search Documents
                                            </FormLabel>
                                            <InputGroup>
                                                <InputLeftElement>
                                                    <FiSearch color="gray.400" />
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Search by filename, type, category..."
                                                    value={searchQuery}
                                                    onChange={handleSearchChange}
                                                    borderRadius="xl"
                                                    border="1px solid"
                                                    borderColor="gray.200"
                                                    isDisabled={!selectedLease || documentsLoading}
                                                />
                                            </InputGroup>
                                        </FormControl>
                                    </SimpleGrid>

                                    {selectedLease && getSelectedLeaseDetails() && (
                                        <Card bg="purple.50" border="1px solid" borderColor="purple.200">
                                            <CardBody p={4}>
                                                <HStack justify="space-between" align="start">
                                                    <VStack align="start" spacing={2}>
                                                        <HStack>
                                                            <FiHome color="#805AD5" />
                                                            <Text fontWeight="bold" color="purple.700">
                                                                {getSelectedLeaseDetails()?.agreementNumber}
                                                            </Text>
                                                        </HStack>
                                                        <Text fontSize="sm" color="purple.600">
                                                            {getSelectedLeaseDetails()?.site?.siteName}
                                                        </Text>
                                                        <Text fontSize="xs" color="purple.500">
                                                            {getSelectedLeaseDetails()?.site?.zone} • {getSelectedLeaseDetails()?.site?.district}
                                                        </Text>
                                                    </VStack>
                                                    <VStack align="end" spacing={1}>
                                                        <Badge colorScheme="purple" borderRadius="full">
                                                            {documents.length} Documents
                                                        </Badge>
                                                        <Text fontSize="xs" color="purple.500">
                                                            Landlord: {getSelectedLeaseDetails()?.landlord?.fullName}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </CardBody>
                                        </Card>
                                    )}

                                    {/* Documents Table */}
                                    {!selectedLease ? (
                                        <VStack spacing={4} py={12} textAlign="center">
                                            <Box p={4} bg="gray.50" borderRadius="xl">
                                                <FiFolder size={48} color="#A0AEC0" />
                                            </Box>
                                            <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                                                Select a Lease to View Documents
                                            </Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Choose a lease from the dropdown above to display its documents
                                            </Text>
                                        </VStack>
                                    ) : documentsLoading ? (
                                        <VStack spacing={4} py={8}>
                                            <Progress size="xs" isIndeterminate width="100%" borderRadius="full" />
                                            <Text color="gray.600">Loading documents...</Text>
                                        </VStack>
                                    ) : filteredDocuments.length === 0 ? (
                                        <VStack spacing={4} py={12} textAlign="center">
                                            <Box p={4} bg="gray.50" borderRadius="xl">
                                                <FiFileText size={48} color="#A0AEC0" />
                                            </Box>
                                            <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                                                No Documents Found
                                            </Text>
                                            <Text fontSize="sm" color="gray.500">
                                                {searchQuery ? 'Try adjusting your search terms' : 'No documents available for the selected lease'}
                                            </Text>
                                            <Button
                                                leftIcon={<FiPlus />}
                                                colorScheme="orange"
                                                variant="outline"
                                                onClick={() => setActiveTab(0)}
                                            >
                                                Add Documents
                                            </Button>
                                        </VStack>
                                    ) : (
                                        <DataTable
                                            value={filteredDocuments}
                                            loading={documentsLoading}
                                            emptyMessage="No documents found."
                                            paginator
                                            rows={10}
                                            className="modern-datatable"
                                        >
                                            <Column header="File Name" body={fileNameBodyTemplate} style={{ minWidth: '300px' }} />
                                            <Column header="Document Type" body={documentTypeBodyTemplate} style={{ minWidth: '150px' }} />
                                            <Column header="Category" body={categoryBodyTemplate} style={{ minWidth: '150px' }} />
                                            <Column header="Upload Date" body={uploadTimeBodyTemplate} style={{ minWidth: '150px' }} />
                                            <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
                                        </DataTable>
                                    )}
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </CardBody>
            </Card>

            {/* Upload Documents Modal */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} size="4xl">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent borderRadius="2xl" boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)" bg="white">
                    <ModalHeader textAlign="center" fontSize="xl" fontWeight="bold" bgGradient="linear(to-r, orange.400, purple.500)" bgClip="text">
                        Upload Documents to Lease
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleUploadSubmit}>
                            <VStack spacing={6}>
                                {/* File Upload Area */}
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Select PDF Files *
                                    </FormLabel>
                                    <Input
                                        type="file"
                                        multiple
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                    />
                                    <Box
                                        border="2px dashed"
                                        borderColor="gray.300"
                                        borderRadius="xl"
                                        p={8}
                                        textAlign="center"
                                        cursor="pointer"
                                        _hover={{ borderColor: 'orange.400', bg: 'orange.50' }}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <VStack spacing={3}>
                                            <FiUpload size={32} color="#CBD5E0" />
                                            <Text fontWeight="medium" color="gray.600">
                                                Click to select PDF files
                                            </Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Select multiple PDF documents to upload
                                            </Text>
                                        </VStack>
                                    </Box>
                                </FormControl>

                                {/* Selected Files */}
                                {uploadData.files.length > 0 && (
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Selected Files ({uploadData.files.length})
                                        </FormLabel>
                                        <VStack spacing={2} align="stretch">
                                            {uploadData.files.map((file, index) => (
                                                <Card key={index} size="sm">
                                                    <CardBody p={3}>
                                                        <HStack justify="space-between">
                                                            <HStack spacing={3}>
                                                                <FiFileText color="#DD6B20" />
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontSize="sm" fontWeight="medium">
                                                                        {file.name}
                                                                    </Text>
                                                                    <Text fontSize="xs" color="gray.500">
                                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                    </Text>
                                                                </VStack>
                                                            </HStack>
                                                            <IconButton
                                                                icon={<FiTrash2 />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="red"
                                                                onClick={() => removeFile(index)}
                                                            />
                                                        </HStack>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </VStack>
                                    </FormControl>
                                )}

                                {/* Document Metadata */}
                                {uploadData.files.length > 0 && (
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Document Metadata
                                        </FormLabel>
                                        <VStack spacing={4} align="stretch">
                                            {uploadData.files.map((file, index) => (
                                                <Card key={index}>
                                                    <CardBody>
                                                        <VStack spacing={3} align="stretch">
                                                            <Text fontWeight="medium" color="gray.700" fontSize="sm">
                                                                {file.name}
                                                            </Text>
                                                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                                                                <FormControl>
                                                                    <FormLabel fontSize="xs">Document Type</FormLabel>
                                                                    <Select
                                                                        size="sm"
                                                                        value={uploadData.documentRequests[index]?.documentType || ''}
                                                                        onChange={(e) => handleDocumentRequestChange(index, 'documentType', e.target.value)}
                                                                        borderRadius="lg"
                                                                    >
                                                                        <option value="LEASE_AGREEMENT">Lease Agreement</option>
                                                                        <option value="INSURANCE">Insurance</option>
                                                                        <option value="IDENTIFICATION">Identification</option>
                                                                        <option value="CERTIFICATE">Certificate</option>
                                                                        <option value="CONTRACT">Contract</option>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormControl>
                                                                    <FormLabel fontSize="xs">Category</FormLabel>
                                                                    <Select
                                                                        size="sm"
                                                                        value={uploadData.documentRequests[index]?.category || ''}
                                                                        onChange={(e) => handleDocumentRequestChange(index, 'category', e.target.value)}
                                                                        borderRadius="lg"
                                                                    >
                                                                        <option value="CONTRACT">Contract</option>
                                                                        <option value="CERTIFICATE">Certificate</option>
                                                                        <option value="IDENTIFICATION">Identification</option>
                                                                        <option value="INSURANCE">Insurance</option>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormControl>
                                                                    <FormLabel fontSize="xs">Description</FormLabel>
                                                                    <Input
                                                                        size="sm"
                                                                        placeholder="Document description"
                                                                        value={uploadData.documentRequests[index]?.description || ''}
                                                                        onChange={(e) => handleDocumentRequestChange(index, 'description', e.target.value)}
                                                                        borderRadius="lg"
                                                                    />
                                                                </FormControl>
                                                            </SimpleGrid>
                                                        </VStack>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </VStack>
                                    </FormControl>
                                )}

                                {/* Upload Progress */}
                                {uploadProgress > 0 && (
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Upload Progress
                                        </FormLabel>
                                        <Progress value={uploadProgress} borderRadius="full" colorScheme="orange" />
                                        <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
                                            {uploadProgress}% Complete
                                        </Text>
                                    </FormControl>
                                )}
                            </VStack>

                            <ModalFooter pt={6}>
                                <Button
                                    type="submit"
                                    colorScheme="orange"
                                    borderRadius="xl"
                                    size="lg"
                                    width="full"
                                    isDisabled={uploadData.files.length === 0}
                                >
                                    Upload {uploadData.files.length} Document(s)
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <Modal isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} size="md">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent borderRadius="2xl" boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)" bg="white" textAlign="center" p={6}>
                    <Box p={4} bg="red.50" borderRadius="xl" mb={4}>
                        <FiTrash2 size="48px" color="#E53E3E" />
                    </Box>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={2}>
                        Confirm Deletion
                    </Text>
                    <Text color="gray.600" mb={6}>
                        Are you sure you want to delete "{documentToDelete?.fileName}"?
                    </Text>
                    <HStack spacing={3} justify="center">
                        <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline" borderRadius="xl" flex={1}>
                            Cancel
                        </Button>
                        <Button colorScheme="red" onClick={confirmDelete} borderRadius="xl" flex={1}>
                            Delete
                        </Button>
                    </HStack>
                </ModalContent>
            </Modal>

            <style jsx>{`
                .modern-datatable {
                    border: none;
                }
                
                .modern-datatable .p-datatable-thead > tr > th {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: none;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.875rem;
                    padding: 1rem 0.75rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .modern-datatable .p-datatable-tbody > tr {
                    background: transparent;
                    transition: all 0.2s ease;
                    border-radius: 0.75rem;
                }
                
                .modern-datatable .p-datatable-tbody > tr > td {
                    border: none;
                    padding: 1rem 0.75rem;
                    background: transparent;
                    border-bottom: 1px solid #f1f5f9;
                }
                
                .modern-datatable .p-datatable-tbody > tr:hover {
                    background: linear-gradient(135deg, #fff7ed 0%, #fefce8 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(255, 138, 0, 0.1);
                }
                
                .modern-datatable .p-paginator {
                    background: transparent;
                    border: none;
                    padding: 1rem 0;
                }
            `}</style>
        </Box>
    );
}