import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiUser, FiAlertCircle, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import {
    Box,
    VStack,
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
    useDisclosure,
    Card,
    CardBody,
    Badge,
    HStack,
    Progress,
    Textarea
} from '@chakra-ui/react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function Issues() {
    const [issues, setIssues] = useState([]);
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [issueToDelete, setIssueToDelete] = useState(null);
    const [currentIssue, setCurrentIssue] = useState({});
    const [newIssue, setNewIssue] = useState({
        landlordId: '',
        description: '',
        status: 'OPEN'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const toast = useToast();
    const cancelRef = useRef();

    const issueStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];

    // Modal disclosures
    const { isOpen: isAddIssueOpen, onOpen: onAddIssueOpen, onClose: onAddIssueClose } = useDisclosure();
    const { isOpen: isEditIssueOpen, onOpen: onEditIssueOpen, onClose: onEditIssueClose } = useDisclosure();
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

    const fetchLandlords = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://10.95.10.92:8277/api/landlords', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setLandlords(response.data.body);
            } else {
                throw new Error(response.data.message || 'Failed to fetch landlords');
            }
        } catch (error) {
            console.error('Error fetching landlords:', error);
            toast({
                title: 'Error',
                description: 'Failed to load landlord list.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://10.95.10.92:8277/api/issues', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setIssues(response.data.body);
                setFilteredIssues(response.data.body);
            } else {
                throw new Error(response.data.message || 'Failed to fetch issues');
            }
        } catch (error) {
            console.error('Error fetching issues:', error);
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
        fetchLandlords();
    }, []);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = issues.filter(issue =>
            (issue.description?.toLowerCase() || '').includes(query) ||
            (issue.status?.toLowerCase() || '').includes(query) ||
            (issue.landlord?.fullName?.toLowerCase() || '').includes(query) ||
            (issue.createdDate?.toLowerCase() || '').includes(query)
        );
        setFilteredIssues(filtered);
    }, [searchQuery, issues]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAddIssueChange = (e) => {
        const { name, value } = e.target;
        setNewIssue(prev => ({ ...prev, [name]: value }));
    };

    const handleEditIssueChange = (e) => {
        const { name, value } = e.target;
        setCurrentIssue(prev => ({ ...prev, [name]: value }));
    };

    const handleAddIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const payload = {
                landlordId: newIssue.landlordId,
                description: newIssue.description,
                status: newIssue.status || 'OPEN'
            };
            const response = await axios.post('http://10.95.10.92:8277/api/issues', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                fetchIssues();
                setNewIssue({
                    landlordId: '',
                    description: '',
                    status: 'OPEN'
                });
                onAddIssueClose();
                toast({
                    title: 'Success',
                    description: response.data.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.data.message || 'Failed to add issue',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error adding issue:', error);
            toast({
                title: 'Error',
                description: 'Error adding issue: ' + (error.response ? error.response.data.message : error.message),
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleEditIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const payload = {
                id: currentIssue.id,
                landlordId: currentIssue.landlordId,
                description: currentIssue.description,
                status: currentIssue.status
            };
            const response = await axios.put(`http://10.95.10.92:8277/api/issues/${payload.id}/status`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                const updatedIssues = issues.map(issue =>
                    issue.id === response.data.body.id ? { ...issue, ...response.data.body } : issue
                );
                setIssues(updatedIssues);
                setFilteredIssues(updatedIssues);
                toast({
                    title: 'Success',
                    description: response.data.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onEditIssueClose();
            } else {
                toast({
                    title: 'Error',
                    description: response.data.message || 'Update failed',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error updating issue:', error);
            toast({
                title: 'Error',
                description: 'Error updating issue: ' + (error.response ? error.response.data.message : error.message),
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDeleteClick = (issue) => {
        setIssueToDelete(issue);
        onDeleteDialogOpen();
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.delete(`http://10.95.10.92:8277/api/issues/${issueToDelete.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                const updatedIssues = issues.filter(issue => issue.id !== issueToDelete.id);
                setIssues(updatedIssues);
                setFilteredIssues(updatedIssues);
                toast({
                    title: 'Success',
                    description: response.data.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onDeleteDialogClose();
            } else {
                toast({
                    title: 'Error',
                    description: response.data.message || 'Delete failed',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error deleting issue:', error);
            toast({
                title: 'Error',
                description: 'Error deleting issue: ' + (error.response ? error.response.data.message : error.message),
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const onEditClick = (issue) => {
        setCurrentIssue({
            ...issue,
            landlordId: issue.landlord?.id
        });
        onEditIssueOpen();
    };

    const statusBodyTemplate = (rowData) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'OPEN': return 'red';
                case 'IN_PROGRESS': return 'orange';
                case 'RESOLVED': return 'green';
                default: return 'gray';
            }
        };

        return (
            <Badge
                colorScheme={getStatusColor(rowData.status)}
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="medium"
                bgGradient={`linear(to-r, ${getStatusColor(rowData.status)}.100, ${getStatusColor(rowData.status)}.200)`}
                color={`${getStatusColor(rowData.status)}.700`}
            >
                {rowData.status}
            </Badge>
        );
    };

    const descriptionBodyTemplate = (rowData) => {
        return (
            <HStack spacing={3} align="start">
                <Box
                    p={2}
                    bgGradient="linear(to-r, blue.100, purple.100)"
                    borderRadius="lg"
                    mt={1}
                >
                    <FiMessageSquare color="#9C27B0" />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" color="gray.800" noOfLines={2}>
                        {rowData.description}
                    </Text>
                </VStack>
            </HStack>
        );
    };

    const landlordBodyTemplate = (rowData) => {
        return (
            <HStack spacing={2}>
                <FiUser size={14} color="#718096" />
                <Text fontSize="sm" color="gray.600">
                    {rowData.landlord?.fullName || 'N/A'}
                </Text>
            </HStack>
        );
    };

    const dateBodyTemplate = (rowData) => {
        if (rowData.createdDate) {
            const date = new Date(rowData.createdDate);
            if (!isNaN(date.getTime())) {
                return (
                    <HStack spacing={2}>
                        <FiCalendar size={14} color="#718096" />
                        <Text fontSize="sm" color="gray.600">
                            {date.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </Text>
                    </HStack>
                );
            }
        }
        return 'Invalid Date';
    };

    const actionsBodyTemplate = (rowData) => {
        return (
            <HStack spacing={2}>
                <IconButton
                    aria-label="Edit"
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => onEditClick(rowData)}
                    _hover={{ transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                />
                <IconButton
                    aria-label="Delete"
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
                                Issue Management
                            </Text>

                        </VStack>

                        <HStack spacing={4}>
                            <InputGroup width="300px">
                                <InputLeftElement>
                                    <FiSearch color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search issues..."
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
                                onClick={onAddIssueOpen}
                            >
                                New Issue
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
                        <Progress
                            size="xs"
                            isIndeterminate
                            bgGradient="linear(to-r, orange.400, purple.500)"
                            mb={4}
                            borderRadius="full"
                        />
                    )}

                    <DataTable
                        value={filteredIssues}
                        loading={loading}
                        globalFilter={globalFilterValue}
                        emptyMessage="No issues found."
                        paginator
                        rows={10}
                        className="modern-datatable"
                    >
                        <Column header="Description" body={descriptionBodyTemplate} />
                        <Column header="Status" body={statusBodyTemplate} />
                        <Column header="Landlord" body={landlordBodyTemplate} />
                        <Column header="Reported Date" body={dateBodyTemplate} />
                        <Column header="Actions" body={actionsBodyTemplate} />
                    </DataTable>

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
                </CardBody>
            </Card>

            {/* Add Issue Modal */}
            <Modal isOpen={isAddIssueOpen} onClose={onAddIssueClose} size="lg">
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
                        Report New Issue
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleAddIssueSubmit}>
                            <VStack spacing={4}>
                                <FormControl id="landlordId" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Landlord
                                    </FormLabel>
                                    <Select
                                        name="landlordId"
                                        value={newIssue.landlordId}
                                        onChange={handleAddIssueChange}
                                        placeholder="Select a landlord"
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        {landlords.map(landlord => (
                                            <option key={landlord.id} value={landlord.id}>
                                                {landlord.fullName}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl id="description" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Issue Description
                                    </FormLabel>
                                    <Textarea
                                        name="description"
                                        value={newIssue.description}
                                        onChange={handleAddIssueChange}
                                        placeholder="Describe the issue in detail..."
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                        minH="120px"
                                    />
                                </FormControl>

                                <FormControl id="status">
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Status
                                    </FormLabel>
                                    <Select
                                        name="status"
                                        value={newIssue.status}
                                        onChange={handleAddIssueChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        {issueStatuses.map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Select>
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
                                    Report Issue
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Edit Issue Modal */}
            <Modal isOpen={isEditIssueOpen} onClose={onEditIssueClose} size="lg">
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
                        Update Issue
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleEditIssueSubmit}>
                            <VStack spacing={4}>
                                <FormControl id="landlordId" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Landlord
                                    </FormLabel>
                                    <Select
                                        name="landlordId"
                                        value={currentIssue.landlordId || ''}
                                        onChange={handleEditIssueChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        {landlords.map(landlord => (
                                            <option key={landlord.id} value={landlord.id}>
                                                {landlord.fullName}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl id="description" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Issue Description
                                    </FormLabel>
                                    <Textarea
                                        name="description"
                                        value={currentIssue.description || ''}
                                        onChange={handleEditIssueChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                        minH="120px"
                                    />
                                </FormControl>

                                <FormControl id="status" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Status
                                    </FormLabel>
                                    <Select
                                        name="status"
                                        value={currentIssue.status || ''}
                                        onChange={handleEditIssueChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        {issueStatuses.map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Select>
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
                                    Update Issue
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <Modal isOpen={isDeleteDialogOpen} onClose={onDeleteDialogClose} size="md">
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
                        Are you sure you want to delete the issue reported by{' '}
                        <Text as="span" fontWeight="semibold" color="orange.500">
                            {issueToDelete?.landlord?.fullName}
                        </Text>
                        ? This action cannot be undone.
                    </Text>

                    <HStack spacing={3} justify="center">
                        <Button
                            ref={cancelRef}
                            onClick={onDeleteDialogClose}
                            variant="outline"
                            borderRadius="xl"
                            colorScheme="gray"
                            flex={1}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={confirmDelete}
                            borderRadius="xl"
                            bgGradient="linear(to-r, red.400, red.500)"
                            _hover={{
                                bgGradient: "linear(to-r, red.500, red.600)",
                                transform: 'translateY(-1px)'
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