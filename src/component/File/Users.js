import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiUser, FiMail, FiKey } from 'react-icons/fi';
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
    FormControl,
    Flex,
    Text,
    useDisclosure,
    Card,
    CardBody,
    Badge,
    HStack,
    Progress,
    Stack,
    useToast,
    useColorModeValue
} from '@chakra-ui/react';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState({});
    const [newUser, setNewUser] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        role: 'USER'
    });
    const toast = useToast();
    const cancelRef = useRef();

    // Modal disclosures
    const { isOpen: isEditUserOpen, onOpen: onEditUserOpen, onClose: onEditUserClose } = useDisclosure();
    const { isOpen: isAddUserOpen, onOpen: onAddUserOpen, onClose: onAddUserClose } = useDisclosure();
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();

    const fetchUsers = () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        axios.get('http://10.95.10.92:8277/users', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.data.success) {
                    setUsers(response.data.body);
                    setFilteredUsers(response.data.body);
                } else {
                    throw new Error(response.data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                toast({
                    title: 'Error',
                    description: 'Error fetching users',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = users.filter(user =>
            (user.username?.toLowerCase() || '').includes(query) ||
            (user.email?.toLowerCase() || '').includes(query) ||
            (user.firstName?.toLowerCase() || '').includes(query) ||
            (user.lastName?.toLowerCase() || '').includes(query) ||
            (user.role?.name?.toLowerCase() || '').includes(query)
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAddUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleEditUserChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const response = await axios.post('http://10.95.10.92:8177/register', newUser, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                toast({
                    title: 'Success',
                    description: 'User registered successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setNewUser({
                    firstName: '',
                    lastName: '',
                    username: '',
                    email: '',
                    role: 'USER'
                });
                onAddUserClose();
                fetchUsers();
            } else {
                toast({
                    title: 'Error',
                    description: response.data.message || 'Registration failed',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error adding user:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Network error',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const updatePayload = {
            username: currentUser.username,
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role,
        };

        try {
            const response = await axios.put(`http://10.95.10.92:8277/user/update/${currentUser.id}`, updatePayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'User updated successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                fetchUsers();
                onEditUserClose();
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
            console.error('Error updating user:', error);
            toast({
                title: 'Error',
                description: 'Error updating user',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        onDeleteDialogOpen();
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.delete(`http://10.95.10.92:8277/user/delete/${userToDelete.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const updatedUsers = users.filter(user => user.id !== userToDelete.id);
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);
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
            console.error('Error deleting user:', error);
            toast({
                title: 'Error',
                description: 'Error deleting user',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const onEditClick = (user) => {
        setCurrentUser({
            ...user,
            role: user.role?.name
        });
        onEditUserOpen();
    };

    const userInfoBodyTemplate = (rowData) => {
        return (
            <HStack spacing={3}>
                <Box
                    p={2}
                    bgGradient="linear(to-r, orange.100, purple.100)"
                    borderRadius="lg"
                >
                    <FiUser color="#9C27B0" />
                </Box>
                <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" color="gray.800">
                        {rowData.firstName} {rowData.lastName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                        @{rowData.username}
                    </Text>
                </VStack>
            </HStack>
        );
    };

    const contactBodyTemplate = (rowData) => {
        return (
            <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                    <FiMail size={14} color="#718096" />
                    <Text fontSize="sm" color="gray.600">{rowData.email}</Text>
                </HStack>
            </VStack>
        );
    };

    const roleBodyTemplate = (rowData) => {
        const getRoleColor = (role) => {
            switch (role?.toLowerCase()) {
                case 'admin': return 'red';
                case 'user': return 'blue';
                default: return 'gray';
            }
        };

        return (
            <Badge
                colorScheme={getRoleColor(rowData.role?.name)}
                borderRadius="full"
                px={3}
                py={1}
                fontSize="xs"
                fontWeight="medium"
                bgGradient={`linear(to-r, ${getRoleColor(rowData.role?.name)}.100, ${getRoleColor(rowData.role?.name)}.200)`}
                color={`${getRoleColor(rowData.role?.name)}.700`}
            >
                {rowData.role?.name || 'USER'}
            </Badge>
        );
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
                                User Management
                            </Text>

                        </VStack>

                        <HStack spacing={4}>
                            <InputGroup width="300px">
                                <InputLeftElement>
                                    <FiSearch color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search users..."
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
                                onClick={onAddUserOpen}
                            >
                                New User
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
                        value={filteredUsers}
                        loading={loading}
                        emptyMessage="No users found."
                        paginator
                        rows={10}
                        className="modern-datatable"
                    >
                        <Column header="User" body={userInfoBodyTemplate} />
                        <Column header="Contact" body={contactBodyTemplate} />
                        <Column header="Role" body={roleBodyTemplate} />
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

            {/* Add User Modal */}
            <Modal isOpen={isAddUserOpen} onClose={onAddUserClose} size="lg">
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
                        Create New User
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleAddUserSubmit}>
                            <Stack spacing={4}>
                                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl id="firstName" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            First Name
                                        </FormLabel>
                                        <Input
                                            name="firstName"
                                            value={newUser.firstName}
                                            onChange={handleAddUserChange}
                                            placeholder="e.g., John"
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl id="lastName" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Last Name
                                        </FormLabel>
                                        <Input
                                            name="lastName"
                                            value={newUser.lastName}
                                            onChange={handleAddUserChange}
                                            placeholder="e.g., Smith"
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

                                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl id="username" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Username
                                        </FormLabel>
                                        <Input
                                            name="username"
                                            value={newUser.username}
                                            onChange={handleAddUserChange}
                                            placeholder="e.g., johnsmith"
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl id="email" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Email Address
                                        </FormLabel>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={handleAddUserChange}
                                            placeholder="e.g., john.smith@example.com"
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

                                <FormControl id="role">
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Role
                                    </FormLabel>
                                    <Select
                                        name="role"
                                        value={newUser.role}
                                        onChange={handleAddUserChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </Select>
                                </FormControl>
                            </Stack>
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
                                    Create User
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Edit User Modal */}
            <Modal isOpen={isEditUserOpen} onClose={onEditUserClose} size="lg">
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
                        Update User
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <form onSubmit={handleEditUserSubmit}>
                            <Stack spacing={4}>
                                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl id="firstName" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            First Name
                                        </FormLabel>
                                        <Input
                                            name="firstName"
                                            value={currentUser.firstName || ''}
                                            onChange={handleEditUserChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl id="lastName" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Last Name
                                        </FormLabel>
                                        <Input
                                            name="lastName"
                                            value={currentUser.lastName || ''}
                                            onChange={handleEditUserChange}
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

                                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                                    <FormControl id="username" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Username
                                        </FormLabel>
                                        <Input
                                            name="username"
                                            value={currentUser.username || ''}
                                            onChange={handleEditUserChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            _focus={{
                                                borderColor: 'orange.400',
                                                boxShadow: '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </FormControl>
                                    <FormControl id="email" isRequired>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            Email Address
                                        </FormLabel>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={currentUser.email || ''}
                                            onChange={handleEditUserChange}
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

                                <FormControl id="role" isRequired>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Role
                                    </FormLabel>
                                    <Select
                                        name="role"
                                        value={currentUser.role || ''}
                                        onChange={handleEditUserChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        _focus={{
                                            borderColor: 'orange.400',
                                            boxShadow: '0 0 0 1px orange.400'
                                        }}
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </Select>
                                </FormControl>
                            </Stack>
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
                                    Update User
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
                        Are you sure you want to delete the user{' '}
                        <Text as="span" fontWeight="semibold" color="orange.500">
                            {userToDelete?.firstName} {userToDelete?.lastName}
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
};

export default Users;