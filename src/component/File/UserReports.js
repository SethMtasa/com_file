import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Card,
    CardBody,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useToast,
    Flex,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Center,
    Spinner,
    Alert,
    AlertIcon,
    Heading,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react';
import { FiDownload, FiFile, FiUsers, FiGlobe, FiBell, FiCalendar, FiTrendingUp, FiX, FiMoreVertical, FiEye, FiUser } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    LineElement,
    PointElement,
    Filler
);

// Helper functions
const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const getFileTypeShort = (fileType) => {
    if (!fileType) return 'Unknown';
    const typeMap = {
        'application/pdf': 'PDF',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'application/vnd.ms-excel': 'XLS',
        'text/csv': 'CSV',
        'text/plain': 'TXT'
    };
    return typeMap[fileType] || fileType.split('/')[1]?.toUpperCase() || 'FILE';
};

const getStatusColor = (status) => {
    switch (status) {
        case 'SENT': return 'green';
        case 'FAILED': return 'red';
        default: return 'gray';
    }
};

const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
};

export default function UserReports() {
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState({
        totalFiles: 0,
        uploadedFiles: 0,
        assignedFiles: 0,
        expiredFiles: 0,
        expiringSoon: 0,
        totalNotifications: 0,
        filesByRegion: [],
        filesByPartnerType: [],
        monthlyUploads: []
    });
    const [recentFiles, setRecentFiles] = useState([]);
    const [expiringFiles, setExpiringFiles] = useState([]);
    const [expiredFiles, setExpiredFiles] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [timeRange, setTimeRange] = useState('7');
    const toast = useToast();

    // Modal states
    const { isOpen: isExportModalOpen, onOpen: onExportModalOpen, onClose: onExportModalClose } = useDisclosure();
    const { isOpen: isFilesModalOpen, onOpen: onFilesModalOpen, onClose: onFilesModalClose } = useDisclosure();
    const { isOpen: isExpiredModalOpen, onOpen: onExpiredModalOpen, onClose: onExpiredModalClose } = useDisclosure();
    const { isOpen: isExpiringModalOpen, onOpen: onExpiringModalOpen, onClose: onExpiringModalClose } = useDisclosure();
    const { isOpen: isNotificationsModalOpen, onOpen: onNotificationsModalOpen, onClose: onNotificationsModalClose } = useDisclosure();

    const [exportType, setExportType] = useState('excel');
    const [modalTitle, setModalTitle] = useState('');
    const [modalFiles, setModalFiles] = useState([]);
    const [modalNotifications, setModalNotifications] = useState([]);

    // Get user ID from token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserId(decodedToken.userId || '');
                setUserName(decodedToken.sub || 'User');
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, []);

    // Common headers for all API calls
    const getHeaders = () => {
        const token = localStorage.getItem("token");
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Download file function
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

    // Calculate monthly uploads for line chart
    const calculateMonthlyUploads = (files) => {
        const monthlyData = {};

        files.forEach(file => {
            if (file.uploadDate) {
                const date = new Date(file.uploadDate);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = 0;
                }
                monthlyData[monthYear]++;
            }
        });

        // Convert to array and sort by date
        return Object.entries(monthlyData)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);
    };

    // Fetch user-specific report data
    const fetchUserReportData = async () => {
        if (!userId) return;

        setLoading(true);

        try {
            const headers = getHeaders();

            // Get user-specific files
            const filesResponse = await axios.get(`http://localhost:8277/api/files/user/${userId}/all`, { headers });
            const allUserFiles = filesResponse.data?.body || [];
            setAllFiles(allUserFiles);

            // Separate uploaded files vs assigned files
            const uploadedFiles = allUserFiles.filter(file => file.uploadedBy?.id === userId);
            const assignedFiles = allUserFiles.filter(file => file.uploadedBy?.id !== userId);

            // Calculate expiring and expired files
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            const expiringFiles = allUserFiles.filter(file => {
                if (!file.expiryDate) return false;
                const expiryDate = new Date(file.expiryDate);
                return expiryDate <= thirtyDaysFromNow && expiryDate > today;
            });

            const expiredFiles = allUserFiles.filter(file => file.expired === true);

            // Get user-specific notifications
            let userNotifications = [];
            try {
                const notificationsResponse = await axios.get(`http://localhost:8277/api/notifications/user/${userId}`, { headers });
                userNotifications = notificationsResponse.data?.body || notificationsResponse.data?.data || [];
            } catch (notificationsError) {
                console.log('User notifications endpoint not available, using empty array');
                // Fallback: filter all notifications by user
                try {
                    const allNotificationsResponse = await axios.get('http://localhost:8277/api/notifications', { headers });
                    const allNotifications = allNotificationsResponse.data?.body || allNotificationsResponse.data?.data || [];
                    userNotifications = allNotifications.filter(notification =>
                        notification.targetUser?.id === userId
                    );
                } catch (fallbackError) {
                    userNotifications = [];
                }
            }

            // Calculate statistics
            const totalFiles = allUserFiles.length;
            const uploadedFilesCount = uploadedFiles.length;
            const assignedFilesCount = assignedFiles.length;
            const expiredFilesCount = expiredFiles.length;
            const expiringSoon = expiringFiles.length;
            const totalNotifications = userNotifications.length;

            // Calculate distribution data for user's files
            const regionsMap = {};
            const partnersMap = {};

            allUserFiles.forEach(file => {
                if (file.region && file.region.regionName) {
                    const regionName = file.region.regionName;
                    regionsMap[regionName] = (regionsMap[regionName] || 0) + 1;
                }

                if (file.channelPartnerType && file.channelPartnerType.typeName) {
                    const partnerName = file.channelPartnerType.typeName;
                    partnersMap[partnerName] = (partnersMap[partnerName] || 0) + 1;
                }
            });

            const filesByRegion = Object.entries(regionsMap).map(([region, count]) => ({ region, count }));
            const filesByPartnerType = Object.entries(partnersMap).map(([type, count]) => ({ type, count }));

            // Calculate monthly uploads for user
            const monthlyUploads = calculateMonthlyUploads(uploadedFiles);

            // SET ALL STATE
            setStats({
                totalFiles,
                uploadedFiles: uploadedFilesCount,
                assignedFiles: assignedFilesCount,
                expiredFiles: expiredFilesCount,
                expiringSoon,
                totalNotifications,
                filesByRegion,
                filesByPartnerType,
                monthlyUploads
            });

            setRecentFiles(allUserFiles.slice(0, 5));
            setExpiringFiles(expiringFiles);
            setExpiredFiles(expiredFiles);
            setNotifications(userNotifications.slice(0, 10));

        } catch (error) {
            console.error('Error in fetchUserReportData:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch your report data',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserReportData();
        }
    }, [userId, timeRange]);

    // Modal handlers for stats cards
    const handleTotalFilesClick = () => {
        setModalTitle('All My Files');
        setModalFiles(allFiles);
        onFilesModalOpen();
    };

    const handleUploadedFilesClick = () => {
        const uploadedFiles = allFiles.filter(file => file.uploadedBy?.id === userId);
        setModalTitle('Files Uploaded by Me');
        setModalFiles(uploadedFiles);
        onFilesModalOpen();
    };

    const handleAssignedFilesClick = () => {
        const assignedFiles = allFiles.filter(file => file.uploadedBy?.id !== userId);
        setModalTitle('Files Assigned to Me');
        setModalFiles(assignedFiles);
        onFilesModalOpen();
    };

    const handleExpiredFilesClick = () => {
        setModalTitle('My Expired Files');
        setModalFiles(expiredFiles);
        onExpiredModalOpen();
    };

    const handleExpiringFilesClick = () => {
        setModalTitle('My Files Expiring Soon (Within 30 Days)');
        setModalFiles(expiringFiles);
        onExpiringModalOpen();
    };

    const handleNotificationsClick = () => {
        setModalTitle('My Notifications');
        setModalNotifications(notifications);
        onNotificationsModalOpen();
    };

    // Chart data configurations
    const regionChartData = {
        labels: stats.filesByRegion?.map(item => item.region) || ['No Data'],
        datasets: [
            {
                label: 'My Files by Region',
                data: stats.filesByRegion?.map(item => item.count) || [1],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    const partnerChartData = {
        labels: stats.filesByPartnerType?.map(item => item.type) || ['No Data'],
        datasets: [
            {
                label: 'My Files by Partner Type',
                data: stats.filesByPartnerType?.map(item => item.count) || [1],
                backgroundColor: [
                    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#C9CBCF', '#FF6384'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    const monthlyUploadsChartData = {
        labels: stats.monthlyUploads?.map(item => {
            const [year, month] = item.month.split('-');
            return `${getMonthName(parseInt(month))} ${year}`;
        }) || ['No Data'],
        datasets: [
            {
                label: 'Files I Uploaded',
                data: stats.monthlyUploads?.map(item => item.count) || [0],
                borderColor: '#3182CE',
                backgroundColor: 'rgba(49, 130, 206, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4
            }
        ]
    };

    const fileOwnershipChartData = {
        labels: ['Uploaded by Me', 'Assigned to Me'],
        datasets: [
            {
                label: 'File Ownership',
                data: [stats.uploadedFiles || 0, stats.assignedFiles || 0],
                backgroundColor: ['#3182CE', '#38A169'],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    const fileStatusChartData = {
        labels: ['Active Files', 'Expired Files', 'Expiring Soon'],
        datasets: [
            {
                label: 'My File Status',
                data: [
                    Math.max(0, (stats.totalFiles || 0) - (stats.expiredFiles || 0) - (stats.expiringSoon || 0)),
                    stats.expiredFiles || 0,
                    stats.expiringSoon || 0
                ],
                backgroundColor: ['#38A169', '#E53E3E', '#DD6B20'],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                }
            }
        }
    };

    const lineChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    // Export functions for user data
    const exportMyFilesToExcel = () => {
        try {
            const dataForExport = allFiles.map(file => ({
                'File Name': file.fileName,
                'File Type': getFileTypeShort(file.fileType),
                'File Size': formatFileSize(file.fileSize),
                'Upload Date': formatDate(file.uploadDate),
                'Expiry Date': formatDate(file.expiryDate),
                'Uploaded By': `${file.uploadedBy?.firstName || ''} ${file.uploadedBy?.lastName || ''}`.trim() || 'N/A',
                'Assigned KAR': `${file.assignedKAR?.firstName || ''} ${file.assignedKAR?.lastName || ''}`.trim() || 'N/A',
                'Region': file.region?.regionName || 'N/A',
                'Channel Partner': file.channelPartnerType?.typeName || 'N/A',
                'Status': file.expired ? 'Expired' : 'Active',
                'Ownership': file.uploadedBy?.id === userId ? 'Uploaded by Me' : 'Assigned to Me',
                'Description': file.description || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'My Files Report');
            XLSX.writeFile(workbook, `my_files_report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Export Successful',
                description: 'Your files report exported to Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onExportModalClose();
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export your files report',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const exportMyNotificationsToExcel = () => {
        try {
            const dataForExport = notifications.map(notification => ({
                'Title': notification.title,
                'Message': notification.message,
                'Type': notification.notificationType,
                'Status': notification.status,
                'Scheduled Time': formatDate(notification.scheduledTime),
                'Sent Time': formatDate(notification.sentTime),
                'Target User': `${notification.targetUser?.firstName || ''} ${notification.targetUser?.lastName || ''}`.trim() || 'N/A',
                'File': notification.file?.fileName || 'N/A',
                'Days Until Expiry': notification.daysUntilExpiry || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'My Notifications Report');
            XLSX.writeFile(workbook, `my_notifications_report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Export Successful',
                description: 'Your notifications report exported to Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onExportModalClose();
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export your notifications report',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    if (loading) {
        return (
            <Center minH="100vh">
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>Loading your reports...</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Box minH="100vh" bg="gray.50" p={6}>
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={2}>
                        <Heading size="lg" color="gray.800">My Reports & Analytics</Heading>
                        <Text color="gray.600">Personal overview of your file management activities</Text>
                        <Badge colorScheme="blue" fontSize="sm">
                            Welcome, {userName}
                        </Badge>
                    </VStack>

                    <HStack spacing={4}>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            width="150px"
                            bg="white"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </Select>

                        <Button
                            leftIcon={<FiDownload />}
                            colorScheme="blue"
                            onClick={onExportModalOpen}
                        >
                            Export My Report
                        </Button>
                    </HStack>
                </Flex>

                {/* Statistics Cards */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    {/* Total Files Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="blue.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleTotalFilesClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="blue.50" borderRadius="md">
                                    <FiFile color="#3182CE" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">Total Files</StatLabel>
                                    <StatNumber>{stats.totalFiles || 0}</StatNumber>
                                    <StatHelpText>All files I manage</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

                    {/* Files Uploaded by Me Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="green.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleUploadedFilesClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="green.50" borderRadius="md">
                                    <FiUser color="#38A169" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">Uploaded by Me</StatLabel>
                                    <StatNumber color="green.500">{stats.uploadedFiles || 0}</StatNumber>
                                    <StatHelpText>Files I uploaded</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

                    {/* Files Assigned to Me Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="purple.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleAssignedFilesClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="purple.50" borderRadius="md">
                                    <FiUsers color="#805AD5" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">Assigned to Me</StatLabel>
                                    <StatNumber color="purple.500">{stats.assignedFiles || 0}</StatNumber>
                                    <StatHelpText>Files assigned to me</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

                    {/* Expiring Soon Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="orange.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleExpiringFilesClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="orange.50" borderRadius="md">
                                    <FiTrendingUp color="#DD6B20" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">Expiring Soon</StatLabel>
                                    <StatNumber color="orange.500">{stats.expiringSoon || 0}</StatNumber>
                                    <StatHelpText>My files expiring soon</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Additional Stats Cards */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Expired Files Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="red.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleExpiredFilesClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="red.50" borderRadius="md">
                                    <FiCalendar color="#E53E3E" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">My Expired Files</StatLabel>
                                    <StatNumber color="red.500">{stats.expiredFiles || 0}</StatNumber>
                                    <StatHelpText>Click to view expired files</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

                    {/* Notifications Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="teal.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleNotificationsClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="teal.50" borderRadius="md">
                                    <FiBell color="#319795" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">My Notifications</StatLabel>
                                    <StatNumber>{stats.totalNotifications || 0}</StatNumber>
                                    <StatHelpText>Notifications sent to me</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Charts Section */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* File Ownership Distribution */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>My File Ownership</Text>
                            <Box height="300px">
                                <Doughnut
                                    data={fileOwnershipChartData}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>

                    {/* My Files by Region */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>My Files by Region</Text>
                            <Box height="300px">
                                <Doughnut
                                    data={regionChartData}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Additional Charts */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* My Monthly Uploads Trend */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>My Monthly Uploads</Text>
                            <Box height="300px">
                                <Line
                                    data={monthlyUploadsChartData}
                                    options={lineChartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>

                    {/* My File Status Distribution */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>My File Status</Text>
                            <Box height="300px">
                                <Bar
                                    data={fileStatusChartData}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Recent Files & Notifications */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Recent Files */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text fontSize="lg" fontWeight="bold">My Recent Files</Text>
                                <Badge colorScheme="blue">{recentFiles.length} files</Badge>
                            </Flex>
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>File Name</Th>
                                            <Th>Ownership</Th>
                                            <Th>Expiry Date</Th>
                                            <Th>Status</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {recentFiles.map((file) => (
                                            <Tr key={file.id} _hover={{ bg: 'gray.50' }}>
                                                <Td>
                                                    <Text fontWeight="medium" isTruncated maxW="150px">
                                                        {file.fileName}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={file.uploadedBy?.id === userId ? 'green' : 'purple'}>
                                                        {file.uploadedBy?.id === userId ? 'My Upload' : 'Assigned'}
                                                    </Badge>
                                                </Td>
                                                <Td>{formatDate(file.expiryDate)}</Td>
                                                <Td>
                                                    <Badge colorScheme={file.expired ? 'red' : 'green'}>
                                                        {file.expired ? 'Expired' : 'Active'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <Menu>
                                                        <MenuButton
                                                            as={IconButton}
                                                            icon={<FiMoreVertical />}
                                                            variant="ghost"
                                                            size="sm"
                                                        />
                                                        <MenuList>
                                                            <MenuItem
                                                                icon={<FiDownload />}
                                                                onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                            >
                                                                Download
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<FiEye />}
                                                                onClick={() => {
                                                                    setModalTitle('File Details');
                                                                    setModalFiles([file]);
                                                                    onFilesModalOpen();
                                                                }}
                                                            >
                                                                View Details
                                                            </MenuItem>
                                                        </MenuList>
                                                    </Menu>
                                                </Td>
                                            </Tr>
                                        ))}
                                        {recentFiles.length === 0 && (
                                            <Tr>
                                                <Td colSpan={5} textAlign="center" color="gray.500">
                                                    No files found
                                                </Td>
                                            </Tr>
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </CardBody>
                    </Card>

                    {/* My Recent Notifications */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text fontSize="lg" fontWeight="bold">My Recent Notifications</Text>
                                <Badge colorScheme="teal">{notifications.length} notifications</Badge>
                            </Flex>
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Type</Th>
                                            <Th>Status</Th>
                                            <Th>File</Th>
                                            <Th>Time</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {notifications.map((notification) => (
                                            <Tr key={notification.id} _hover={{ bg: 'gray.50' }}>
                                                <Td>
                                                    <Text isTruncated maxW="120px" fontSize="xs">
                                                        {notification.notificationType}
                                                    </Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(notification.status)} size="sm">
                                                        {notification.status}
                                                    </Badge>
                                                </Td>
                                                <Td fontSize="xs">
                                                    {notification.file?.fileName || 'N/A'}
                                                </Td>
                                                <Td fontSize="xs">{formatDate(notification.scheduledTime)}</Td>
                                            </Tr>
                                        ))}
                                        {notifications.length === 0 && (
                                            <Tr>
                                                <Td colSpan={4} textAlign="center" color="gray.500">
                                                    No notifications found
                                                </Td>
                                            </Tr>
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Expiring Files Alert */}
                {expiringFiles.length > 0 && (
                    <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <Box>
                            <Text fontWeight="bold">
                                {expiringFiles.length} of your files expiring within 30 days
                            </Text>
                            <Text fontSize="sm">
                                Review and take necessary action for these files
                            </Text>
                        </Box>
                    </Alert>
                )}
            </VStack>

            {/* Files Modal with Download Options */}
            <Modal isOpen={isFilesModalOpen} onClose={onFilesModalClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between" width="100%">
                            <Text>{modalTitle} ({modalFiles.length})</Text>
                            <Button size="sm" variant="ghost" onClick={onFilesModalClose}>
                                <FiX />
                            </Button>
                        </HStack>
                    </ModalHeader>

                    <ModalBody maxH="70vh" overflowY="auto">
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead bg="gray.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>File Name</Th>
                                        <Th>File Type</Th>

                                        <Th>Upload Date</Th>
                                        <Th>Expiry Date</Th>
                                        <Th>Region</Th>
                                        <Th>Channel Partner</Th>
                                        <Th>Ownership</Th>
                                        <Th>Status</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalFiles.map((file) => (
                                        <Tr key={file.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="medium">{file.fileName}</Td>
                                            <Td>
                                                <Badge colorScheme="blue">
                                                    {getFileTypeShort(file.fileType)}
                                                </Badge>
                                            </Td>

                                            <Td>{formatDate(file.uploadDate)}</Td>
                                            <Td>{formatDate(file.expiryDate)}</Td>
                                            <Td>{file.region?.regionName || 'N/A'}</Td>
                                            <Td>{file.channelPartnerType?.typeName || 'N/A'}</Td>
                                            <Td>
                                                <Badge colorScheme={file.uploadedBy?.id === userId ? 'green' : 'purple'}>
                                                    {file.uploadedBy?.id === userId ? 'My Upload' : 'Assigned to Me'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={file.expired ? 'red' : 'green'}>
                                                    {file.expired ? 'Expired' : 'Active'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<FiDownload />}
                                                    onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                >
                                                    Download
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                    {modalFiles.length === 0 && (
                                        <Tr>
                                            <Td colSpan={10} textAlign="center" color="gray.500" py={8}>
                                                No files found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onFilesModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Export Modal */}
            <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Export My Report</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value)}
                                bg="white"
                            >
                                <option value="excel">My Files Report (Excel)</option>
                                <option value="notifications">My Notifications Report (Excel)</option>
                            </Select>
                            <Text fontSize="sm" color="gray.600">
                                {exportType === 'excel'
                                    ? 'Export your files data to Excel format'
                                    : 'Export your notifications data to Excel format'
                                }
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onExportModalClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={() => {
                                if (exportType === 'excel') exportMyFilesToExcel();
                                else exportMyNotificationsToExcel();
                            }}
                        >
                            Export My Data
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Expired Files Modal */}
            <Modal isOpen={isExpiredModalOpen} onClose={onExpiredModalClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between" width="100%">
                            <Text>{modalTitle} ({modalFiles.length})</Text>
                            <Button size="sm" variant="ghost" onClick={onExpiredModalClose}>
                                <FiX />
                            </Button>
                        </HStack>
                    </ModalHeader>

                    <ModalBody maxH="70vh" overflowY="auto">
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead bg="gray.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>File Name</Th>
                                        <Th>File Type</Th>

                                        <Th>Upload Date</Th>
                                        <Th>Expiry Date</Th>
                                        <Th>Region</Th>
                                        <Th>Channel Partner</Th>
                                        <Th>Ownership</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalFiles.map((file) => (
                                        <Tr key={file.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="medium">{file.fileName}</Td>
                                            <Td>
                                                <Badge colorScheme="blue">
                                                    {getFileTypeShort(file.fileType)}
                                                </Badge>
                                            </Td>

                                            <Td>{formatDate(file.uploadDate)}</Td>
                                            <Td>{formatDate(file.expiryDate)}</Td>
                                            <Td>{file.region?.regionName || 'N/A'}</Td>
                                            <Td>{file.channelPartnerType?.typeName || 'N/A'}</Td>
                                            <Td>
                                                <Badge colorScheme={file.uploadedBy?.id === userId ? 'green' : 'purple'}>
                                                    {file.uploadedBy?.id === userId ? 'My Upload' : 'Assigned to Me'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<FiDownload />}
                                                    onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                >
                                                    Download
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                    {modalFiles.length === 0 && (
                                        <Tr>
                                            <Td colSpan={9} textAlign="center" color="gray.500" py={8}>
                                                No expired files found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onExpiredModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Expiring Files Modal */}
            <Modal isOpen={isExpiringModalOpen} onClose={onExpiringModalClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between" width="100%">
                            <Text>{modalTitle} ({modalFiles.length})</Text>
                            <Button size="sm" variant="ghost" onClick={onExpiringModalClose}>
                                <FiX />
                            </Button>
                        </HStack>
                    </ModalHeader>

                    <ModalBody maxH="70vh" overflowY="auto">
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead bg="gray.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>File Name</Th>
                                        <Th>File Type</Th>

                                        <Th>Upload Date</Th>
                                        <Th>Expiry Date</Th>
                                        <Th>Region</Th>
                                        <Th>Channel Partner</Th>
                                        <Th>Ownership</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalFiles.map((file) => (
                                        <Tr key={file.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="medium">{file.fileName}</Td>
                                            <Td>
                                                <Badge colorScheme="blue">
                                                    {getFileTypeShort(file.fileType)}
                                                </Badge>
                                            </Td>

                                            <Td>{formatDate(file.uploadDate)}</Td>
                                            <Td>{formatDate(file.expiryDate)}</Td>
                                            <Td>{file.region?.regionName || 'N/A'}</Td>
                                            <Td>{file.channelPartnerType?.typeName || 'N/A'}</Td>
                                            <Td>
                                                <Badge colorScheme={file.uploadedBy?.id === userId ? 'green' : 'purple'}>
                                                    {file.uploadedBy?.id === userId ? 'My Upload' : 'Assigned to Me'}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    leftIcon={<FiDownload />}
                                                    onClick={() => handleDownloadFile(file.id, file.fileName, file.fileType)}
                                                >
                                                    Download
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                    {modalFiles.length === 0 && (
                                        <Tr>
                                            <Td colSpan={9} textAlign="center" color="gray.500" py={8}>
                                                No expiring files found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onExpiringModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Notifications Modal */}
            <Modal isOpen={isNotificationsModalOpen} onClose={onNotificationsModalClose} size="6xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <HStack justify="space-between" width="100%">
                            <Text>{modalTitle} ({modalNotifications.length})</Text>
                            <Button size="sm" variant="ghost" onClick={onNotificationsModalClose}>
                                <FiX />
                            </Button>
                        </HStack>
                    </ModalHeader>

                    <ModalBody maxH="70vh" overflowY="auto">
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead bg="gray.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>Title</Th>
                                        <Th>Type</Th>
                                        <Th>Status</Th>
                                        <Th>File</Th>
                                        <Th>Message</Th>

                                        <Th>Sent Time</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalNotifications.map((notification) => (
                                        <Tr key={notification.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="medium">{notification.title}</Td>
                                            <Td>
                                                <Badge colorScheme="blue">
                                                    {notification.notificationType}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(notification.status)}>
                                                    {notification.status}
                                                </Badge>
                                            </Td>
                                            <Td>{notification.file?.fileName || 'N/A'}</Td>
                                            <Td>
                                                <Text fontSize="sm" maxW="300px" isTruncated title={notification.message}>
                                                    {notification.message}
                                                </Text>
                                            </Td>

                                            <Td>{formatDate(notification.sentTime)}</Td>
                                        </Tr>
                                    ))}
                                    {modalNotifications.length === 0 && (
                                        <Tr>
                                            <Td colSpan={7} textAlign="center" color="gray.500" py={8}>
                                                No notifications found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onNotificationsModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>
    );
}