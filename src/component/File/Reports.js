import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { FiDownload, FiFile, FiUsers, FiGlobe, FiBell, FiCalendar, FiTrendingUp, FiX, FiMoreVertical, FiEye } from 'react-icons/fi';
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

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalFiles: 0,
        expiredFiles: 0,
        expiringSoon: 0,
        totalNotifications: 0,
        sentNotifications: 0,
        failedNotifications: 0,
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

    // Fetch all report data
    const fetchReportData = async () => {
        setLoading(true);

        try {
            const headers = getHeaders();

            // Get files first
            const filesResponse = await axios.get('http://localhost:8277/api/files', { headers });
            const files = filesResponse.data?.body || [];
            setAllFiles(files);

            // Try other endpoints with individual error handling
            let expiringFiles = [];
            let expiredFiles = [];
            let notifications = [];

            // Try expiring files endpoint
            try {
                const expiringResponse = await axios.get('http://localhost:8277/api/files/expiring/30', { headers });
                expiringFiles = expiringResponse.data?.body || [];
            } catch (expiringError) {
                // Calculate expiring files from the files data
                const today = new Date();
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(today.getDate() + 30);

                expiringFiles = files.filter(file => {
                    if (!file.expiryDate) return false;
                    const expiryDate = new Date(file.expiryDate);
                    return expiryDate <= thirtyDaysFromNow && expiryDate > today;
                });
            }

            // Try expired files endpoint
            try {
                const expiredResponse = await axios.get('http://localhost:8277/api/files/expired', { headers });
                expiredFiles = expiredResponse.data?.body || [];
            } catch (expiredError) {
                expiredFiles = files.filter(file => file.expired === true);
            }

            // Try notifications endpoint - using the updated endpoint
            try {
                const notificationsResponse = await axios.get('http://localhost:8277/api/notifications', { headers });
                notifications = notificationsResponse.data?.body || notificationsResponse.data?.data || [];
            } catch (notificationsError) {
                console.log('Notifications endpoint not available, using empty array');
                notifications = [];
            }

            // Calculate statistics
            const totalFiles = files.length;
            const expiredFilesCount = expiredFiles.length > 0 ? expiredFiles.length : files.filter(file => file.expired).length;
            const expiringSoon = expiringFiles.length;
            const totalNotifications = notifications.length;
            const sentNotifications = notifications.filter(n => n.status === 'SENT').length;
            const failedNotifications = notifications.filter(n => n.status === 'FAILED').length;

            // Calculate distribution data
            const regionsMap = {};
            const partnersMap = {};

            files.forEach(file => {
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

            // Calculate monthly uploads
            const monthlyUploads = calculateMonthlyUploads(files);

            // SET ALL STATE
            setStats({
                totalFiles,
                expiredFiles: expiredFilesCount,
                expiringSoon,
                totalNotifications,
                sentNotifications,
                failedNotifications,
                filesByRegion,
                filesByPartnerType,
                monthlyUploads
            });

            setRecentFiles(files.slice(0, 5));
            setExpiringFiles(expiringFiles);
            setExpiredFiles(expiredFiles);
            setNotifications(notifications.slice(0, 10));

        } catch (error) {
            console.error('Error in fetchReportData:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch some report data',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [timeRange]);

    // Modal handlers for stats cards
    const handleTotalFilesClick = () => {
        setModalTitle('All Files');
        setModalFiles(allFiles);
        onFilesModalOpen();
    };

    const handleExpiredFilesClick = () => {
        setModalTitle('Expired Files');
        setModalFiles(expiredFiles);
        onExpiredModalOpen();
    };

    const handleExpiringFilesClick = () => {
        setModalTitle('Files Expiring Soon (Within 30 Days)');
        setModalFiles(expiringFiles);
        onExpiringModalOpen();
    };

    const handleNotificationsClick = () => {
        setModalTitle('All Notifications');
        setModalNotifications(notifications);
        onNotificationsModalOpen();
    };

    // Chart data configurations
    const regionChartData = {
        labels: stats.filesByRegion?.map(item => item.region) || ['No Data'],
        datasets: [
            {
                label: 'Files by Region',
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
                label: 'Files by Partner Type',
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
                label: 'Files Uploaded',
                data: stats.monthlyUploads?.map(item => item.count) || [0],
                borderColor: '#3182CE',
                backgroundColor: 'rgba(49, 130, 206, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4
            }
        ]
    };

    const statusChartData = {
        labels: ['Active Files', 'Expired Files', 'Expiring Soon'],
        datasets: [
            {
                label: 'File Status',
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

    const notificationStatusChartData = {
        labels: ['Sent', 'Failed'],
        datasets: [
            {
                label: 'Notifications',
                data: [stats.sentNotifications || 0, stats.failedNotifications || 0],
                backgroundColor: ['#38A169', '#E53E3E'],
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

    // Export functions
    const exportToExcel = () => {
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
                'Description': file.description || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Files Report');
            XLSX.writeFile(workbook, `files_report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Export Successful',
                description: 'Files report exported to Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onExportModalClose();
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export files report',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const exportNotificationsToExcel = () => {
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
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Notifications Report');
            XLSX.writeFile(workbook, `notifications_report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Export Successful',
                description: 'Notifications report exported to Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onExportModalClose();
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export notifications report',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const exportComprehensiveReport = () => {
        try {
            // Create multiple sheets for comprehensive report
            const filesData = allFiles.map(file => ({
                'File Name': file.fileName,
                'File Type': getFileTypeShort(file.fileType),
                'File Size': formatFileSize(file.fileSize),
                'Upload Date': formatDate(file.uploadDate),
                'Expiry Date': formatDate(file.expiryDate),
                'Uploaded By': `${file.uploadedBy?.firstName || ''} ${file.uploadedBy?.lastName || ''}`.trim() || 'N/A',
                'Assigned KAR': `${file.assignedKAR?.firstName || ''} ${file.assignedKAR?.lastName || ''}`.trim() || 'N/A',
                'Region': file.region?.regionName || 'N/A',
                'Channel Partner': file.channelPartnerType?.typeName || 'N/A',
                'Status': file.expired ? 'Expired' : 'Active'
            }));

            const notificationsData = notifications.map(notification => ({
                'Title': notification.title,
                'Type': notification.notificationType,
                'Status': notification.status,
                'Scheduled Time': formatDate(notification.scheduledTime),
                'Sent Time': formatDate(notification.sentTime),
                'Target User': `${notification.targetUser?.firstName || ''} ${notification.targetUser?.lastName || ''}`.trim() || 'N/A',
                'File': notification.file?.fileName || 'N/A'
            }));

            const statsData = [{
                'Total Files': stats.totalFiles || 0,
                'Expired Files': stats.expiredFiles || 0,
                'Expiring Soon': stats.expiringSoon || 0,
                'Total Notifications': stats.totalNotifications || 0,
                'Sent Notifications': stats.sentNotifications || 0,
                'Failed Notifications': stats.failedNotifications || 0
            }];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(filesData), 'Files');
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(notificationsData), 'Notifications');
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statsData), 'Statistics');

            XLSX.writeFile(workbook, `comprehensive_report_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast({
                title: 'Export Successful',
                description: 'Comprehensive report exported to Excel',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onExportModalClose();
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export comprehensive report',
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
                    <Text>Loading reports...</Text>
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
                        <Heading size="lg" color="gray.800">Reports & Analytics</Heading>

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
                            colorScheme="orange"
                            onClick={onExportModalOpen}
                        >
                            Export Report
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
                                    <StatHelpText>Click to view all files</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

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
                                    <StatLabel color="gray.600">Expired Files</StatLabel>
                                    <StatNumber color="red.500">{stats.expiredFiles || 0}</StatNumber>
                                    <StatHelpText>Click to view expired files</StatHelpText>
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
                                    <StatHelpText>Click to view expiring files</StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>

                    {/* Notifications Card */}
                    <Card
                        bg="white"
                        shadow="md"
                        borderLeft="4px"
                        borderColor="green.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                        onClick={handleNotificationsClick}
                    >
                        <CardBody>
                            <HStack spacing={3}>
                                <Box p={2} bg="green.50" borderRadius="md">
                                    <FiBell color="#38A169" />
                                </Box>
                                <Stat>
                                    <StatLabel color="gray.600">Notifications</StatLabel>
                                    <StatNumber>{stats.totalNotifications || 0}</StatNumber>
                                    <StatHelpText>
                                        Sent: {stats.sentNotifications || 0} | Failed: {stats.failedNotifications || 0}
                                    </StatHelpText>
                                </Stat>
                            </HStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Charts Section */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Files by Region */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>Files by Region</Text>
                            <Box height="300px">
                                <Doughnut
                                    data={regionChartData}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>

                    {/* Notification Status */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>Notification Status</Text>
                            <Box height="300px">
                                <Doughnut
                                    data={notificationStatusChartData}
                                    options={chartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Additional Charts */}
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Monthly Uploads Trend */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>Monthly Uploads Trend</Text>
                            <Box height="300px">
                                <Line
                                    data={monthlyUploadsChartData}
                                    options={lineChartOptions}
                                />
                            </Box>
                        </CardBody>
                    </Card>

                    {/* File Status Distribution */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Text fontSize="lg" fontWeight="bold" mb={4}>File Status Distribution</Text>
                            <Box height="300px">
                                <Bar
                                    data={statusChartData}
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
                                <Text fontSize="lg" fontWeight="bold">Recent Files</Text>
                                <Badge colorScheme="blue">{recentFiles.length} files</Badge>
                            </Flex>
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>File Name</Th>
                                            <Th>Region</Th>
                                            <Th>Expiry Date</Th>
                                            <Th>Status</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {recentFiles.map((file) =>(
                                            <Tr key={file.id} _hover={{ bg: 'gray.50' }}>
                                                <Td>
                                                    <Text fontWeight="medium" isTruncated maxW="150px">
                                                        {file.fileName}
                                                    </Text>
                                                </Td>
                                                <Td>{file.region?.regionName || 'N/A'}</Td>
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

                    {/* Recent Notifications */}
                    <Card bg="white" shadow="md">
                        <CardBody>
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text fontSize="lg" fontWeight="bold">Recent Notifications</Text>
                                <Badge colorScheme="purple">{notifications.length} notifications</Badge>
                            </Flex>
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Type</Th>
                                            <Th>Status</Th>
                                            <Th>User</Th>
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
                                                    {notification.targetUser?.firstName} {notification.targetUser?.lastName}
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
                                {expiringFiles.length} files expiring within 30 days
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
                                            <Td colSpan={9} textAlign="center" color="gray.500" py={8}>
                                                No files found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="orange" onClick={onFilesModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Expired Files Modal with Download Options */}
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
                                <Thead bg="red.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>File Name</Th>
                                        <Th>File Type</Th>

                                        <Th>Upload Date</Th>
                                        <Th>Expiry Date</Th>
                                        <Th>Region</Th>
                                        <Th>Channel Partner</Th>
                                        <Th>Days Expired</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalFiles.map((file) => {
                                        const expiredDate = new Date(file.expiryDate);
                                        const today = new Date();
                                        const daysExpired = Math.floor((today - expiredDate) / (1000 * 60 * 60 * 24));

                                        return (
                                            <Tr key={file.id} _hover={{ bg: 'red.50' }}>
                                                <Td fontWeight="medium">{file.fileName}</Td>
                                                <Td>
                                                    <Badge colorScheme="blue">
                                                        {getFileTypeShort(file.fileType)}
                                                    </Badge>
                                                </Td>

                                                <Td>{formatDate(file.uploadDate)}</Td>
                                                <Td color="red.500" fontWeight="bold">
                                                    {formatDate(file.expiryDate)}
                                                </Td>
                                                <Td>{file.region?.regionName || 'N/A'}</Td>
                                                <Td>{file.channelPartnerType?.typeName || 'N/A'}</Td>
                                                <Td>
                                                    <Badge colorScheme="red">
                                                        {daysExpired} days
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
                                        );
                                    })}
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
                        <Button colorScheme="red" onClick={onExpiredModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Expiring Files Modal with Download Options */}
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
                                <Thead bg="orange.50" position="sticky" top={0}>
                                    <Tr>
                                        <Th>File Name</Th>
                                        <Th>File Type</Th>

                                        <Th>Upload Date</Th>
                                        <Th>Expiry Date</Th>
                                        <Th>Region</Th>
                                        <Th>Channel Partner</Th>
                                        <Th>Days Until Expiry</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalFiles.map((file) => {
                                        const expiryDate = new Date(file.expiryDate);
                                        const today = new Date();
                                        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

                                        return (
                                            <Tr key={file.id} _hover={{ bg: 'orange.50' }}>
                                                <Td fontWeight="medium">{file.fileName}</Td>
                                                <Td>
                                                    <Badge colorScheme="blue">
                                                        {getFileTypeShort(file.fileType)}
                                                    </Badge>
                                                </Td>

                                                <Td>{formatDate(file.uploadDate)}</Td>
                                                <Td color="orange.500" fontWeight="bold">
                                                    {formatDate(file.expiryDate)}
                                                </Td>
                                                <Td>{file.region?.regionName || 'N/A'}</Td>
                                                <Td>{file.channelPartnerType?.typeName || 'N/A'}</Td>
                                                <Td>
                                                    <Badge colorScheme={daysUntilExpiry <= 7 ? 'red' : 'orange'}>
                                                        {daysUntilExpiry} days
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
                                        );
                                    })}
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
                        <Button colorScheme="orange" onClick={onExpiringModalClose}>
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
                                        <Th>Target User</Th>
                                        <Th>Scheduled Time</Th>
                                        <Th>Sent Time</Th>
                                        <Th>File</Th>

                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {modalNotifications.map((notification) => (
                                        <Tr key={notification.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="medium">{notification.title}</Td>
                                            <Td>
                                                <Badge colorScheme="purple">
                                                    {notification.notificationType}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(notification.status)}>
                                                    {notification.status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                {notification.targetUser?.firstName} {notification.targetUser?.lastName}
                                            </Td>
                                            <Td>{formatDate(notification.scheduledTime)}</Td>
                                            <Td>{formatDate(notification.sentTime)}</Td>
                                            <Td>{notification.file?.fileName || 'N/A'}</Td>

                                        </Tr>
                                    ))}
                                    {modalNotifications.length === 0 && (
                                        <Tr>
                                            <Td colSpan={8} textAlign="center" color="gray.500" py={8}>
                                                No notifications found
                                            </Td>
                                        </Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="orange" onClick={onNotificationsModalClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Export Modal */}
            <Modal isOpen={isExportModalOpen} onClose={onExportModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Export Report</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <Select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value)}
                                bg="white"
                            >
                                <option value="excel">Files Report (Excel)</option>
                                <option value="notifications">Notifications Report (Excel)</option>
                                <option value="comprehensive">Comprehensive Report (Excel)</option>
                            </Select>
                            <Text fontSize="sm" color="gray.600">
                                {exportType === 'excel'
                                    ? 'Export files data to Excel format'
                                    : exportType === 'notifications'
                                        ? 'Export notifications data to Excel format'
                                        : 'Export comprehensive report with multiple sheets'
                                }
                            </Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onExportModalClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="orange"
                            onClick={() => {
                                if (exportType === 'excel') exportToExcel();
                                else if (exportType === 'notifications') exportNotificationsToExcel();
                                else exportComprehensiveReport();
                            }}
                        >
                            Export
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}