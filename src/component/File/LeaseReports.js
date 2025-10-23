import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    useToast,
    Progress,
    Card,
    CardBody,
    HStack,
    Button,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    Flex,
    IconButton,
    useColorModeValue,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText
} from '@chakra-ui/react';
import {
    FiSearch,
    FiDownload,
    FiFileText,
    FiCalendar,
    FiAlertTriangle,
    FiBarChart2,
    FiFilter,
    FiRefreshCw
} from 'react-icons/fi';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

export default function LeaseReports() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Data states for different report types
    const [consolidatedData, setConsolidatedData] = useState([]);
    const [expiredData, setExpiredData] = useState([]);
    const [upcomingData, setUpcomingData] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [statusData, setStatusData] = useState({});
    const [rentalTypeData, setRentalTypeData] = useState({});
    const [leaseTypeData, setLeaseTypeData] = useState({});

    const toast = useToast();
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Initialize from URL params
    useEffect(() => {
        const type = searchParams.get('type');
        switch (type) {
            case 'expired':
                setActiveTab(1);
                fetchExpiredLeases();
                break;
            case 'upcoming':
                setActiveTab(2);
                fetchUpcomingExpirations();
                break;
            case 'categories':
                setActiveTab(3);
                fetchCategorySummary();
                break;
            default:
                setActiveTab(0);
                fetchConsolidatedLeases();
                break;
        }
    }, [searchParams]);

    const fetchWithAuth = async (url, params = {}) => {
        const token = localStorage.getItem("token");
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchConsolidatedLeases = async (category = '') => {
        try {
            const url = 'http://10.95.10.92:8277/api/reports/consolidated-leases';
            const params = category ? { category } : {};
            const data = await fetchWithAuth(url, params);

            if (data.success) {
                setConsolidatedData(data.body);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to fetch consolidated leases',
                    status: 'error',
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load consolidated leases',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchExpiredLeases = async () => {
        try {
            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/expired-leases');
            if (data.success) {
                setExpiredData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load expired leases',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchUpcomingExpirations = async (startDate = '', endDate = '') => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/upcoming-expirations', params);
            if (data.success) {
                setUpcomingData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load upcoming expirations',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchCategorySummary = async () => {
        try {
            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/category-summary');
            if (data.success) {
                setCategoryData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load category summary',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchStatusSummary = async () => {
        try {
            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/status-summary');
            if (data.success) {
                setStatusData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load status summary',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchRentalTypeSummary = async () => {
        try {
            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/rental-type-summary');
            if (data.success) {
                setRentalTypeData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load rental type summary',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const fetchLeaseTypeSummary = async () => {
        try {
            const data = await fetchWithAuth('http://10.95.10.92:8277/api/reports/lease-type-summary');
            if (data.success) {
                setLeaseTypeData(data.body);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load lease type summary',
                status: 'error',
                duration: 3000,
            });
        }
    };

    const handleTabChange = (index) => {
        setActiveTab(index);
        setSearchQuery('');
        setCategoryFilter('');
        setDateRange({ startDate: '', endDate: '' });

        switch (index) {
            case 0:
                fetchConsolidatedLeases();
                break;
            case 1:
                fetchExpiredLeases();
                break;
            case 2:
                fetchUpcomingExpirations();
                break;
            case 3:
                fetchCategorySummary();
                break;
            case 4:
                fetchStatusSummary();
                break;
            case 5:
                fetchRentalTypeSummary();
                break;
            case 6:
                fetchLeaseTypeSummary();
                break;
        }
    };

    const handleExport = (data, filename) => {
        // Simple CSV export implementation
        const headers = Object.keys(data[0] || {}).join(',');
        const csvData = data.map(row =>
            Object.values(row).map(value =>
                typeof value === 'object' ? JSON.stringify(value) : value
            ).join(',')
        ).join('\n');

        const csv = `${headers}\n${csvData}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();

        toast({
            title: 'Export Started',
            description: `${filename} download started`,
            status: 'success',
            duration: 2000,
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'OPEN': return 'green';
            case 'UNDER_DEVELOPMENT': return 'blue';
            case 'EXPIRED': return 'red';
            default: return 'gray';
        }
    };

    const getRentalTypeColor = (type) => {
        switch (type) {
            case 'MONTHLY': return 'blue';
            case 'ANNUALY': return 'green';
            case 'SWAP': return 'orange';
            case 'NONE': return 'gray';
            default: return 'gray';
        }
    };

    // Filter data based on search query
    const filteredData = (data) => {
        if (!searchQuery) return data;
        return data.filter(item =>
            item.agreementNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.landlord?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.site?.siteName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.leaseCategory?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const ConsolidatedLeasesTable = () => (
        <VStack spacing={4} align="stretch">
            <Flex gap={4} wrap="wrap">
                <InputGroup maxW="300px">
                    <InputLeftElement>
                        <FiSearch color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search leases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </InputGroup>
                <Select
                    placeholder="Filter by category"
                    maxW="200px"
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        fetchConsolidatedLeases(e.target.value);
                    }}
                >
                    <option value="Office Building">Office Building</option>
                    <option value="Parking Space">Parking Space</option>
                    <option value="Base Station">Base Station</option>
                    <option value="Scaffolding">Scaffolding</option>
                </Select>
                <IconButton
                    icon={<FiRefreshCw />}
                    onClick={() => fetchConsolidatedLeases(categoryFilter)}
                    aria-label="Refresh"
                />
                <Button
                    leftIcon={<FiDownload />}
                    colorScheme="blue"
                    onClick={() => handleExport(filteredData(consolidatedData), 'consolidated-leases')}
                    ml="auto"
                >
                    Export CSV
                </Button>
            </Flex>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardBody>
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Agreement #</Th>
                                <Th>Landlord</Th>
                                <Th>Site</Th>
                                <Th>Category</Th>
                                <Th>Start Date</Th>
                                <Th>Expiry Date</Th>
                                <Th>Status</Th>
                                <Th>Rental Type</Th>
                                <Th>Rental Value</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredData(consolidatedData).map((lease) => (
                                <Tr key={lease.id} _hover={{ bg: 'gray.50' }}>
                                    <Td fontWeight="medium">{lease.agreementNumber}</Td>
                                    <Td>{lease.landlord?.fullName}</Td>
                                    <Td>{lease.site?.siteName}</Td>
                                    <Td>{lease.leaseCategory}</Td>
                                    <Td>{lease.commencementDate}</Td>
                                    <Td>{lease.expiryDate}</Td>
                                    <Td>
                                        <Badge colorScheme={getStatusColor(lease.status)}>
                                            {lease.status}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getRentalTypeColor(lease.rentalType)}>
                                            {lease.rentalType}
                                        </Badge>
                                    </Td>
                                    <Td>{lease.rentalValue}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                    {filteredData(consolidatedData).length === 0 && (
                        <Text textAlign="center" py={8} color="gray.500">
                            No leases found
                        </Text>
                    )}
                </CardBody>
            </Card>
        </VStack>
    );

    const ExpiredLeasesTable = () => (
        <VStack spacing={4} align="stretch">
            <Flex justify="space-between" align="center">
                <HStack>
                    <FiAlertTriangle color="red" />
                    <Text fontWeight="semibold">
                        Expired Leases ({expiredData.length})
                    </Text>
                </HStack>
                <Button
                    leftIcon={<FiDownload />}
                    colorScheme="red"
                    onClick={() => handleExport(expiredData, 'expired-leases')}
                >
                    Export CSV
                </Button>
            </Flex>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardBody>
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Agreement #</Th>
                                <Th>Landlord</Th>
                                <Th>Site</Th>
                                <Th>Expiry Date</Th>
                                <Th>Category</Th>
                                <Th>Days Expired</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {expiredData.map((lease) => {
                                const expiredDays = Math.floor(
                                    (new Date() - new Date(lease.expiryDate)) / (1000 * 60 * 60 * 24)
                                );
                                return (
                                    <Tr key={lease.id} _hover={{ bg: 'red.50' }}>
                                        <Td fontWeight="medium">{lease.agreementNumber}</Td>
                                        <Td>{lease.landlord?.fullName}</Td>
                                        <Td>{lease.site?.siteName}</Td>
                                        <Td color="red.600">{lease.expiryDate}</Td>
                                        <Td>{lease.leaseCategory}</Td>
                                        <Td color="red.600" fontWeight="bold">
                                            {expiredDays} days
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                    {expiredData.length === 0 && (
                        <Text textAlign="center" py={8} color="gray.500">
                            No expired leases found
                        </Text>
                    )}
                </CardBody>
            </Card>
        </VStack>
    );

    const UpcomingExpirationsTable = () => (
        <VStack spacing={4} align="stretch">
            <Flex gap={4} wrap="wrap">
                <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    maxW="200px"
                />
                <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    maxW="200px"
                />
                <Button
                    leftIcon={<FiFilter />}
                    onClick={() => fetchUpcomingExpirations(dateRange.startDate, dateRange.endDate)}
                >
                    Apply Filter
                </Button>
                <Button
                    leftIcon={<FiDownload />}
                    colorScheme="orange"
                    onClick={() => handleExport(upcomingData, 'upcoming-expirations')}
                    ml="auto"
                >
                    Export CSV
                </Button>
            </Flex>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardBody>
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Agreement #</Th>
                                <Th>Landlord</Th>
                                <Th>Site</Th>
                                <Th>Expiry Date</Th>
                                <Th>Days Remaining</Th>
                                <Th>Category</Th>
                                <Th>Status</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {upcomingData.map((lease) => {
                                const daysRemaining = Math.floor(
                                    (new Date(lease.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                                );
                                return (
                                    <Tr key={lease.id} _hover={{ bg: 'orange.50' }}>
                                        <Td fontWeight="medium">{lease.agreementNumber}</Td>
                                        <Td>{lease.landlord?.fullName}</Td>
                                        <Td>{lease.site?.siteName}</Td>
                                        <Td color="orange.600">{lease.expiryDate}</Td>
                                        <Td>
                                            <Badge colorScheme={daysRemaining < 30 ? 'red' : 'orange'}>
                                                {daysRemaining} days
                                            </Badge>
                                        </Td>
                                        <Td>{lease.leaseCategory}</Td>
                                        <Td>
                                            <Badge colorScheme={getStatusColor(lease.status)}>
                                                {lease.status}
                                            </Badge>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                    {upcomingData.length === 0 && (
                        <Text textAlign="center" py={8} color="gray.500">
                            No upcoming expirations found
                        </Text>
                    )}
                </CardBody>
            </Card>
        </VStack>
    );

    const SummaryCard = ({ title, data, color = 'blue' }) => (
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <Text fontWeight="semibold" fontSize="lg">{title}</Text>
                    {Object.entries(data).map(([key, value]) => (
                        <Flex key={key} justify="space-between" align="center" p={2} _hover={{ bg: 'gray.50' }}>
                            <Text fontSize="sm">{key || 'Uncategorized'}</Text>
                            <Badge colorScheme={color} fontSize="md">
                                {Array.isArray(value) ? value.length : value}
                            </Badge>
                        </Flex>
                    ))}
                    {Object.keys(data).length === 0 && (
                        <Text textAlign="center" color="gray.500" py={4}>
                            No data available
                        </Text>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );

    return (
        <Box p={6} bg="gray.50" minH="100vh">
            <VStack spacing={6} align="stretch">
                {/* Header */}
                <Flex direction="column" align="center" justify="center">
                    <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
                        Lease Reports
                    </Text>
                </Flex>

                {loading && <Progress size="xs" isIndeterminate borderRadius="full" />}

                <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                        <Tabs index={activeTab} onChange={handleTabChange} isLazy>
                            <TabList>
                                <Tab>Consolidated Register</Tab>
                                <Tab>Expired Leases</Tab>
                                <Tab>Upcoming Expirations</Tab>
                                <Tab>Category Summary</Tab>
                                <Tab>Status Summary</Tab>
                                <Tab>Rental Type Summary</Tab>
                                <Tab>Lease Type Summary</Tab>
                            </TabList>

                            <TabPanels>
                                <TabPanel>
                                    <ConsolidatedLeasesTable />
                                </TabPanel>
                                <TabPanel>
                                    <ExpiredLeasesTable />
                                </TabPanel>
                                <TabPanel>
                                    <UpcomingExpirationsTable />
                                </TabPanel>
                                <TabPanel>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                        <SummaryCard
                                            title="Lease Categories"
                                            data={categoryData}
                                            color="blue"
                                        />
                                    </SimpleGrid>
                                </TabPanel>
                                <TabPanel>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                        <SummaryCard
                                            title="Lease Status"
                                            data={statusData}
                                            color="green"
                                        />
                                    </SimpleGrid>
                                </TabPanel>
                                <TabPanel>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                        <SummaryCard
                                            title="Rental Types"
                                            data={rentalTypeData}
                                            color="purple"
                                        />
                                    </SimpleGrid>
                                </TabPanel>
                                <TabPanel>
                                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                        <SummaryCard
                                            title="Lease Types"
                                            data={leaseTypeData}
                                            color="orange"
                                        />
                                    </SimpleGrid>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </CardBody>
                </Card>
            </VStack>
        </Box>
    );
}