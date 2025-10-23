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
    HStack,
    Progress,
    Select,
    Textarea,
    Grid,
    GridItem,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    CloseButton,
    Badge
} from '@chakra-ui/react';
import { FiPlus, FiFileText, FiCalendar, FiUser, FiGlobe, FiUsers, FiUpload, FiFile, FiMessageSquare } from 'react-icons/fi';

export default function AddNewFile() {
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState([]);
    const [channelPartnerTypes, setChannelPartnerTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const [formData, setFormData] = useState({
        fileName: '',
        description: '',
        expiryDate: '',
        validityDate: '',
        regionId: '',
        channelPartnerTypeId: '',
        assignedKarUserId: '',
        comment: ''
    });

    const [errors, setErrors] = useState({});
    const toast = useToast();
    const { isOpen: isAddFileOpen, onOpen: onAddFileOpen, onClose: onAddFileClose } = useDisclosure();

    // Fetch regions, channel partner types, and users data
    useEffect(() => {
        fetchRegions();
        fetchChannelPartnerTypes();
        fetchUsers();
    }, []);

    const fetchRegions = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:8277/api/regions', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setRegions(response.data.body);
            }
        } catch (error) {
            console.error('Error fetching regions:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch regions',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const fetchChannelPartnerTypes = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:8277/api/channel-partner-types', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setChannelPartnerTypes(response.data.body);
            }
        } catch (error) {
            console.error('Error fetching channel partner types:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch channel partner types',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:8277/users', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setUsers(response.data.body);
                console.log('Users fetched successfully:', response.data.body);
            } else {
                throw new Error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch users',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Data type validation functions
    const validateFileName = (fileName) => {
        if (!fileName.trim()) {
            return 'File name is required';
        }
        if (fileName.length > 255) {
            return 'File name must be less than 255 characters';
        }
        if (!/^[a-zA-Z0-9\s\-_.()]+$/.test(fileName)) {
            return 'File name can only contain letters, numbers, spaces, hyphens, underscores, periods, and parentheses';
        }
        return '';
    };

    const validateDescription = (description) => {
        if (description && description.length > 1000) {
            return 'Description must be less than 1000 characters';
        }
        return '';
    };

    const validateDate = (dateString, fieldName) => {
        if (!dateString) {
            if (fieldName === 'expiryDate') return 'Expiry date is required';
            return '';
        }

        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if it's a valid date
        if (isNaN(date.getTime())) {
            return 'Invalid date format';
        }

        // Check if date is in the future (for expiry date)
        if (fieldName === 'expiryDate' && date <= today) {
            return 'Expiry date must be in the future';
        }

        // Check if date is reasonable (not too far in the future)
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(today.getFullYear() + 10); // 10 years max
        if (date > maxFutureDate) {
            return 'Date cannot be more than 10 years in the future';
        }

        return '';
    };

    const validateDateRange = (validityDate, expiryDate) => {
        if (!validityDate || !expiryDate) return '';

        const validity = new Date(validityDate);
        const expiry = new Date(expiryDate);

        if (expiry <= validity) {
            return 'Expiry date must be after validity date';
        }

        return '';
    };

    const validateNumericId = (id, fieldName) => {
        if (!id) {
            return `${fieldName} is required`;
        }
        if (!/^\d+$/.test(id.toString())) {
            return `${fieldName} must be a valid number`;
        }
        if (parseInt(id) <= 0) {
            return `${fieldName} must be a positive number`;
        }
        return '';
    };

    const validateComment = (comment) => {
        if (!comment.trim()) {
            return 'Instructions for the assigned KAR are required';
        }
        if (comment.length > 2000) {
            return 'Instructions must be less than 2000 characters';
        }
        if (comment.trim().length < 10) {
            return 'Please provide more detailed instructions (minimum 10 characters)';
        }
        return '';
    };

    const validateFile = (file) => {
        if (!file) {
            return 'Please select a file to upload';
        }

        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            return 'File size must be less than 10MB';
        }

        // Check file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            return 'File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT';
        }

        // Check file extension
        const fileName = file.name.toLowerCase();
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            return 'File extension not allowed. Allowed extensions: .pdf, .doc, .docx, .xls, .xlsx, .csv, .txt';
        }

        return '';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Real-time validation for specific fields
        let error = '';
        switch (name) {
            case 'fileName':
                error = validateFileName(value);
                break;
            case 'description':
                error = validateDescription(value);
                break;
            case 'expiryDate':
                error = validateDate(value, 'expiryDate');
                if (!error && formData.validityDate) {
                    error = validateDateRange(formData.validityDate, value);
                }
                break;
            case 'validityDate':
                error = validateDate(value, 'validityDate');
                if (!error && formData.expiryDate) {
                    error = validateDateRange(value, formData.expiryDate);
                }
                break;
            case 'regionId':
                error = validateNumericId(value, 'Region');
                break;
            case 'channelPartnerTypeId':
                error = validateNumericId(value, 'Channel partner type');
                break;
            case 'assignedKarUserId':
                error = validateNumericId(value, 'Assigned KAR');
                break;
            case 'comment':
                error = validateComment(value);
                break;
            default:
                break;
        }

        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileError = validateFile(file);
            if (fileError) {
                setErrors(prev => ({
                    ...prev,
                    file: fileError
                }));
                setSelectedFile(null);
                setFilePreview(null);
                return;
            }

            setSelectedFile(file);
            setErrors(prev => ({
                ...prev,
                file: ''
            }));

            // Create preview for image files
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate all fields
        newErrors.fileName = validateFileName(formData.fileName);
        newErrors.description = validateDescription(formData.description);
        newErrors.expiryDate = validateDate(formData.expiryDate, 'expiryDate');
        newErrors.validityDate = validateDate(formData.validityDate, 'validityDate');
        newErrors.regionId = validateNumericId(formData.regionId, 'Region');
        newErrors.channelPartnerTypeId = validateNumericId(formData.channelPartnerTypeId, 'Channel partner type');
        newErrors.assignedKarUserId = validateNumericId(formData.assignedKarUserId, 'Assigned KAR');
        newErrors.comment = validateComment(formData.comment);
        newErrors.file = validateFile(selectedFile);

        // Validate date range
        const dateRangeError = validateDateRange(formData.validityDate, formData.expiryDate);
        if (dateRangeError) {
            newErrors.expiryDate = dateRangeError;
        }

        // Remove empty error messages
        Object.keys(newErrors).forEach(key => {
            if (!newErrors[key]) {
                delete newErrors[key];
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddFileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);

            // Show error toast with first error found
            const firstError = Object.values(errors)[0];
            if (firstError) {
                toast({
                    title: 'Validation Error',
                    description: firstError,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }

            return;
        }

        try {
            const token = localStorage.getItem("token");
            const payload = new FormData();

            // Append form data with correct field names and data types
            payload.append('fileName', formData.fileName.trim());
            payload.append('description', formData.description.trim());
            payload.append('expiryDate', formData.expiryDate);
            payload.append('validityDate', formData.validityDate || '');
            payload.append('regionId', formData.regionId.toString());
            payload.append('channelPartnerTypeId', formData.channelPartnerTypeId.toString());
            payload.append('assignedKarUserId', formData.assignedKarUserId.toString());
            payload.append('comment', formData.comment.trim());

            // Append the file
            if (selectedFile) {
                payload.append('file', selectedFile);
            }

            console.log('Sending file upload payload:', {
                fileName: formData.fileName,
                description: formData.description,
                expiryDate: formData.expiryDate,
                validityDate: formData.validityDate,
                regionId: parseInt(formData.regionId),
                channelPartnerTypeId: parseInt(formData.channelPartnerTypeId),
                assignedKarUserId: parseInt(formData.assignedKarUserId),
                comment: formData.comment,
                file: selectedFile?.name
            });

            const response = await axios.post('http://localhost:8277/api/files/upload', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setShowSuccessAlert(true);
                onAddFileClose();
                resetForm();

                toast({
                    title: 'Success',
                    description: 'File uploaded successfully!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error(response.data.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error uploading file',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fileName: '',
            description: '',
            expiryDate: '',
            validityDate: '',
            regionId: '',
            channelPartnerTypeId: '',
            assignedKarUserId: '',
            comment: ''
        });
        setSelectedFile(null);
        setFilePreview(null);
        setErrors({});
    };

    const getFileTypeBadge = (file) => {
        if (!file) return null;

        const typeMap = {
            'application/pdf': { color: 'red', label: 'PDF' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { color: 'blue', label: 'DOCX' },
            'application/msword': { color: 'blue', label: 'DOC' },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { color: 'green', label: 'XLSX' },
            'application/vnd.ms-excel': { color: 'green', label: 'XLS' },
            'text/csv': { color: 'teal', label: 'CSV' },
            'text/plain': { color: 'gray', label: 'TXT' },
            'image/jpeg': { color: 'purple', label: 'JPEG' },
            'image/png': { color: 'purple', label: 'PNG' },
            'image/gif': { color: 'purple', label: 'GIF' }
        };

        const fileInfo = typeMap[file.type] || { color: 'gray', label: file.type?.split('/')[1]?.toUpperCase() || 'FILE' };

        return (
            <Badge colorScheme={fileInfo.color} ml={2}>
                {fileInfo.label}
            </Badge>
        );
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box
            minH="100vh"
            bg="gray.50"
            p={6}
        >

            {/* Centered Header Card */}
            <Flex justify="center" align="center" mb={8}>
                <VStack spacing={4} textAlign="center">
                    <Text fontSize="3xl" fontWeight="bold" bgGradient="linear(to-r, orange.400, purple.500)" bgClip="text">
                        File Management
                    </Text>
                </VStack>
            </Flex>

            {/* Centered Add New File Card */}
            <Flex justify="center" align="center">
                <Card
                    bg="white"
                    borderRadius="2xl"
                    boxShadow="0 20px 80px rgba(0, 0, 0, 0.15)"
                    backdropFilter="blur(10px)"
                    border="1px solid"
                    borderColor="gray.100"
                    width="80%"
                    maxW="800px"
                    cursor="pointer"
                    transition="all 0.3s ease"
                    _hover={{
                        transform: 'translateY(-12px)',
                        boxShadow: '0 40px 120px rgba(255, 138, 0, 0.35)',
                        borderColor: 'orange.300'
                    }}
                    onClick={onAddFileOpen}
                >
                    <CardBody p={16}>
                        <VStack spacing={12} textAlign="center">
                            <Box
                                p={12}
                                bgGradient="linear(to-r, orange.100, purple.100)"
                                borderRadius="2xl"
                                boxShadow="0 16px 50px rgba(255, 138, 0, 0.3)"
                            >
                                <FiPlus size="120px" color="#9C27B0" />
                            </Box>

                            <VStack spacing={4}>
                                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                                    Upload New File
                                </Text>
                                <Text fontSize="xl" color="gray.600" maxW="600px">
                                    Upload and manage your files with comprehensive metadata
                                </Text>
                            </VStack>
                        </VStack>
                    </CardBody>
                </Card>
            </Flex>

            {/* Add File Modal */}
            <Modal isOpen={isAddFileOpen} onClose={onAddFileClose} size="4xl">
                <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
                <ModalContent
                    borderRadius="2xl"
                    boxShadow="0 20px 60px rgba(0, 0, 0, 0.15)"
                    bg="white"
                    backdropFilter="blur(20px)"
                    maxW="800px"
                >
                    <ModalHeader
                        textAlign="center"
                        fontSize="xl"
                        fontWeight="bold"
                        bgGradient="linear(to-r, orange.400, purple.500)"
                        bgClip="text"
                        pb={4}
                    >
                        Upload New File
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {loading && (
                            <Progress
                                size="xs"
                                isIndeterminate
                                bgGradient="linear(to-r, orange.400, purple.500)"
                                mb={4}
                                borderRadius="full"
                            />
                        )}

                        <form onSubmit={handleAddFileSubmit}>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                {/* File Name */}
                                <FormControl id="fileName" isRequired isInvalid={errors.fileName}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        File Name
                                    </FormLabel>
                                    <Input
                                        name="fileName"
                                        value={formData.fileName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Sales Contract Q4 2025"
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.fileName ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.fileName ? 'red.400' : 'orange.400',
                                            boxShadow: errors.fileName ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                        maxLength={255}
                                    />
                                    {errors.fileName && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.fileName}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Description */}
                                <FormControl id="description" isInvalid={errors.description}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Description
                                    </FormLabel>
                                    <Input
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of the file"
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.description ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.description ? 'red.400' : 'orange.400',
                                            boxShadow: errors.description ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                        maxLength={1000}
                                    />
                                    {errors.description && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.description}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Validity Date */}
                                <FormControl id="validityDate" isInvalid={errors.validityDate}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Validity Date
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement>
                                            <FiCalendar color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            type="date"
                                            name="validityDate"
                                            value={formData.validityDate}
                                            onChange={handleInputChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor={errors.validityDate ? 'red.300' : 'gray.200'}
                                            _focus={{
                                                borderColor: errors.validityDate ? 'red.400' : 'orange.400',
                                                boxShadow: errors.validityDate ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </InputGroup>
                                    {errors.validityDate && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.validityDate}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Expiry Date */}
                                <FormControl id="expiryDate" isRequired isInvalid={errors.expiryDate}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Expiry Date
                                    </FormLabel>
                                    <InputGroup>
                                        <InputLeftElement>
                                            <FiCalendar color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleInputChange}
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor={errors.expiryDate ? 'red.300' : 'gray.200'}
                                            _focus={{
                                                borderColor: errors.expiryDate ? 'red.400' : 'orange.400',
                                                boxShadow: errors.expiryDate ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                            }}
                                        />
                                    </InputGroup>
                                    {errors.expiryDate && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.expiryDate}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Region */}
                                <FormControl id="regionId" isRequired isInvalid={errors.regionId}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Region
                                    </FormLabel>
                                    <Select
                                        name="regionId"
                                        value={formData.regionId}
                                        onChange={handleInputChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.regionId ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.regionId ? 'red.400' : 'orange.400',
                                            boxShadow: errors.regionId ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                    >
                                        <option value="">Select Region</option>
                                        {regions.map(region => (
                                            <option key={region.id} value={region.id}>
                                                {region.regionName}
                                            </option>
                                        ))}
                                    </Select>
                                    {errors.regionId && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.regionId}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Channel Partner Type */}
                                <FormControl id="channelPartnerTypeId" isRequired isInvalid={errors.channelPartnerTypeId}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Channel Partner Type
                                    </FormLabel>
                                    <Select
                                        name="channelPartnerTypeId"
                                        value={formData.channelPartnerTypeId}
                                        onChange={handleInputChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.channelPartnerTypeId ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.channelPartnerTypeId ? 'red.400' : 'orange.400',
                                            boxShadow: errors.channelPartnerTypeId ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                    >
                                        <option value="">Select Channel Partner Type</option>
                                        {channelPartnerTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.typeName}
                                            </option>
                                        ))}
                                    </Select>
                                    {errors.channelPartnerTypeId && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.channelPartnerTypeId}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Assigned KAR */}
                                <FormControl id="assignedKarUserId" isRequired isInvalid={errors.assignedKarUserId}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Assigned KAR
                                    </FormLabel>
                                    <Select
                                        name="assignedKarUserId"
                                        value={formData.assignedKarUserId}
                                        onChange={handleInputChange}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.assignedKarUserId ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.assignedKarUserId ? 'red.400' : 'orange.400',
                                            boxShadow: errors.assignedKarUserId ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                    >
                                        <option value="">Select Assigned KAR</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName} ({user.username})
                                            </option>
                                        ))}
                                    </Select>
                                    {errors.assignedKarUserId && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.assignedKarUserId}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* File Upload */}
                                <FormControl id="file" isRequired isInvalid={errors.file}>
                                    <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                        Upload File
                                    </FormLabel>
                                    <Input
                                        type="file"
                                        onChange={handleFileSelect}
                                        borderRadius="xl"
                                        border="1px solid"
                                        borderColor={errors.file ? 'red.300' : 'gray.200'}
                                        _focus={{
                                            borderColor: errors.file ? 'red.400' : 'orange.400',
                                            boxShadow: errors.file ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                        }}
                                        p={1}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    />
                                    {errors.file && (
                                        <Text color="red.500" fontSize="sm" mt={1}>
                                            {errors.file}
                                        </Text>
                                    )}

                                    {/* File Preview */}
                                    {selectedFile && (
                                        <Box mt={2} p={3} bg="gray.50" borderRadius="lg">
                                            <Flex align="center">
                                                <FiFileText color="orange.500" size="20px" />
                                                <VStack align="start" spacing={0} ml={3}>
                                                    <Text fontSize="sm" fontWeight="medium">
                                                        {selectedFile.name}
                                                        {getFileTypeBadge(selectedFile)}
                                                    </Text>
                                                    <Text fontSize="xs" color="gray.500">
                                                        {formatFileSize(selectedFile.size)}
                                                    </Text>
                                                </VStack>
                                            </Flex>
                                            {filePreview && (
                                                <Box mt={2}>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>Preview:</Text>
                                                    <img
                                                        src={filePreview}
                                                        alt="File preview"
                                                        style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </FormControl>

                                {/* Comment - Span full width */}
                                <GridItem colSpan={2}>
                                    <FormControl id="comment" isRequired isInvalid={errors.comment}>
                                        <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                                            <HStack>
                                                <FiMessageSquare />
                                                <Text>Instructions for Assigned KAR</Text>
                                            </HStack>
                                        </FormLabel>
                                        <Textarea
                                            name="comment"
                                            value={formData.comment}
                                            onChange={handleInputChange}
                                            placeholder="Provide clear instructions for the assigned KAR about what they need to do with this file. This will be sent to them via email."
                                            borderRadius="xl"
                                            border="1px solid"
                                            borderColor={errors.comment ? 'red.300' : 'gray.200'}
                                            _focus={{
                                                borderColor: errors.comment ? 'red.400' : 'orange.400',
                                                boxShadow: errors.comment ? '0 0 0 1px red.400' : '0 0 0 1px orange.400'
                                            }}
                                            rows={4}
                                            resize="vertical"
                                            maxLength={2000}
                                        />
                                        {errors.comment && (
                                            <Text color="red.500" fontSize="sm" mt={1}>
                                                {errors.comment}
                                            </Text>
                                        )}
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            This comment will be sent to the assigned KAR via email but will not be stored in the database.
                                        </Text>
                                    </FormControl>
                                </GridItem>
                            </Grid>

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
                                    isLoading={loading}
                                    loadingText="Uploading File..."
                                    leftIcon={<FiUpload />}
                                >
                                    Upload File
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}