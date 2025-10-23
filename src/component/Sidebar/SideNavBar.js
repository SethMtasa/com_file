import React, { useState } from 'react';
import {
    IconButton,
    Box,
    CloseButton,
    Flex,
    HStack,
    VStack,
    Button,
    Icon,
    useColorModeValue,
    Drawer,
    DrawerContent,
    Text,
    useDisclosure,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
    Image,
    Avatar,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertIcon,
    Alert,
    Collapse,
    Badge,
    Divider
} from '@chakra-ui/react';
import {
    FiHome,
    FiMenu,
    FiBell,
    FiBarChart2,
    FiChevronDown,
    FiChevronRight,
    FiLogOut
} from 'react-icons/fi';
import {
    Outlet,
    useNavigate,
    useLocation
} from "react-router-dom";
import { BiSolidReport } from "react-icons/bi";
import { TbSettingsCog } from "react-icons/tb";
import { FaArchway } from "react-icons/fa6";
import { GiContract } from "react-icons/gi";
import { AiOutlineIssuesClose } from "react-icons/ai";
import { TbIndentDecrease } from "react-icons/tb";

const LinkItems = [
    { name: 'Home',
        icon: FaArchway,
        to: '/admin/home',
        role: [ "ADMIN"]
    },

    { name: 'Home',
        icon: FaArchway,
        to: '/user/home',
        role: ["USER"]
    },

    { name: 'Files',
        icon: TbIndentDecrease,
        submenu: [
            { name: 'New', to: '/admin/add-new-file' },

        ],
        role: ["USER", "ADMIN"]
    },
    {
        name: 'Regions & Partners',
        icon: GiContract,
        submenu: [
            { name: 'Region', to: '/admin/regions' },
            { name: 'Channel Partners', to: '/admin/channel-partners' },
        ],
        role: ["ADMIN"],
    },
    // {
    //     name: 'Files',
    //     icon: BiSolidReport,
    //     submenu: [
    //         { name: 'Manage', to: '/admin/files' },
    //     ],
    //     role: ["USER", "ADMIN"],
    // },
    //
    { name: 'Reports', icon: AiOutlineIssuesClose, to: '/admin/reports', role: [ "ADMIN"] },
    { name: 'Reports', icon: AiOutlineIssuesClose, to: '/user/user-reports', role: [ "USER"] },

    // {
    //     name: 'Reports',
    //     icon: FiBarChart2,
    //     submenu: [
    //         { name: 'Overview', to: '/admin/reports' },
    //         { name: 'Lease Reports', to: '/admin/reports/leases' },
    //         // { name: 'Generate Report', to: '/admin/reports/generate' },
    //     ],
    //     role: ["ADMIN"]
    // },
    {
        name: 'User Management',
        icon: TbSettingsCog,
        submenu: [
            { name: 'Users', to: '/admin/users' },
        ],
        role: "ADMIN"
    },
];

export default function SideNavBar({ children }) {
    const location = useLocation();
    const path = location.pathname;
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <SidebarContent
                path={path}
                onClose={onClose}
                display={{ base: 'none', md: 'block' }}
            />

            {/* Fixed Mobile Nav */}
            <Box
                position="fixed"
                top={0}
                left={{ base: 0, md: 60 }}
                right={0}
                zIndex={1000}
            >
                <MobileNav onOpen={onOpen} />
            </Box>

            {/* Main Content with padding to account for fixed navbar */}
            <Box
                ml={{ base: 0, md: 60 }}
                pt={{ base: "80px", md: "88px" }} // Padding to clear fixed navbar
                px={6}
                pb={6}
            >
                <Outlet />
                {children}
            </Box>

            {/* Mobile Drawer */}
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="xs"
            >
                <DrawerContent>
                    <SidebarContent path={path} onClose={onClose} />
                </DrawerContent>
            </Drawer>
        </Box>
    );
}

const SidebarContent = ({ onClose, path, ...rest }) => {
    const [openSubmenu, setOpenSubmenu] = useState({});
    const [hoveredItem, setHoveredItem] = useState(null);
    const navigate = useNavigate();

    let user = localStorage.getItem('user');
    user = JSON.parse(user);

    const userRoles = user?.role;

    const filteredSidebarItems = LinkItems.filter(item => {
        const itemRoles = Array.isArray(item.role) ? item.role : [item.role];
        return itemRoles.some(role => userRoles.includes(role));
    });

    const toggleSubmenu = (name) => {
        setOpenSubmenu((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const isItemActive = (link) => {
        if (path === link.to) return true;
        if (link.submenu && link.submenu.some(sub => path === sub.to)) return true;
        if (link.to && path.startsWith(link.to + '/')) return true;
        return false;
    };

    const bgColor = useColorModeValue('white', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('orange.50', 'gray.800');
    const activeBg = useColorModeValue('orange.500', 'orange.600');
    const activeColor = 'white';
    const textColor = useColorModeValue('gray.700', 'gray.200');
    const scrollbarThumb = useColorModeValue('#CBD5E0', '#4A5568');
    const scrollbarTrack = useColorModeValue('#F7FAFC', '#2D3748');
    const submenuBorder = useColorModeValue('orange.200', 'orange.700');
    const userBg = useColorModeValue('gray.50', 'gray.800');

    return (
        <Box
            transition="all 0.3s ease"
            bg={bgColor}
            borderRight="1px"
            borderRightColor={borderColor}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            overflowY="auto"
            sx={{
                '&::-webkit-scrollbar': {
                    width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                    width: '6px',
                    background: scrollbarTrack,
                },
                '&::-webkit-scrollbar-thumb': {
                    background: scrollbarThumb,
                    borderRadius: '24px',
                },
            }}
            {...rest}
        >
            {/* Logo Section */}
            <Flex
                h="20"
                alignItems="center"
                mx="4"
                justifyContent="space-between"
                borderBottom="1px"
                borderColor={borderColor}
                mb={4}
            >
                <HStack spacing={3}>
                    <Box
                        p={2}
                        bg="orange.500"
                        borderRadius="lg"
                        boxShadow="md"
                    >
                        <Image src="/netone.png" boxSize="24px" />
                    </Box>
                    <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">
                            Commercial
                        </Text>
                        <Text fontSize="xs" color={textColor} opacity={0.7}>
                           File Management
                        </Text>
                    </VStack>
                </HStack>
                <CloseButton
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onClose}
                    size="sm"
                />
            </Flex>

            {/* Navigation Items */}
            <VStack spacing={1} px={3} align="stretch">
                {filteredSidebarItems.map((link) => {
                    const isActive = isItemActive(link);
                    const isOpen = openSubmenu[link.name];

                    return (
                        <Box key={link.name}>
                            <Button
                                onClick={link.submenu ? () => toggleSubmenu(link.name) : () => navigate(link.to)}
                                w="full"
                                justifyContent="space-between"
                                variant="ghost"
                                bg={isActive && !link.submenu ? activeBg : 'transparent'}
                                color={isActive && !link.submenu ? activeColor : textColor}
                                fontWeight={isActive ? 'semibold' : 'medium'}
                                fontSize="sm"
                                h="44px"
                                px={4}
                                borderRadius="xl"
                                _hover={{
                                    bg: isActive && !link.submenu ? activeBg : hoverBg,
                                    transform: 'translateX(4px)',
                                    color: isActive && !link.submenu ? activeColor : 'orange.500',
                                }}
                                _active={{
                                    transform: 'scale(0.98)',
                                }}
                                transition="all 0.2s ease"
                                onMouseEnter={() => setHoveredItem(link.name)}
                                onMouseLeave={() => setHoveredItem(null)}
                                leftIcon={
                                    <Icon
                                        as={link.icon}
                                        boxSize={5}
                                        color={isActive && !link.submenu ? activeColor : 'orange.500'}
                                    />
                                }
                                rightIcon={
                                    link.submenu && (
                                        <Icon
                                            as={isOpen ? FiChevronDown : FiChevronRight}
                                            boxSize={4}
                                            transition="transform 0.2s"
                                        />
                                    )
                                }
                            >
                                <Text flex={1} textAlign="left">
                                    {link.name}
                                </Text>
                            </Button>

                            {/* Submenu */}
                            {link.submenu && (
                                <Collapse in={isOpen} animateOpacity>
                                    <VStack
                                        spacing={1}
                                        mt={1}
                                        mb={2}
                                        pl={8}
                                        align="stretch"
                                        borderLeft="2px"
                                        borderColor={submenuBorder}
                                        ml={4}
                                    >
                                        {link.submenu.map((subLink) => {
                                            const isSubActive = path === subLink.to;

                                            return (
                                                <Button
                                                    key={subLink.name}
                                                    onClick={() => navigate(subLink.to)}
                                                    variant="ghost"
                                                    size="sm"
                                                    h="36px"
                                                    justifyContent="flex-start"
                                                    bg={isSubActive ? activeBg : 'transparent'}
                                                    color={isSubActive ? activeColor : textColor}
                                                    fontWeight={isSubActive ? 'semibold' : 'normal'}
                                                    fontSize="sm"
                                                    borderRadius="lg"
                                                    _hover={{
                                                        bg: isSubActive ? activeBg : hoverBg,
                                                        color: isSubActive ? activeColor : 'orange.500',
                                                        pl: 6,
                                                    }}
                                                    _active={{
                                                        transform: 'scale(0.98)',
                                                    }}
                                                    transition="all 0.2s ease"
                                                    pl={4}
                                                >
                                                    <Box
                                                        w={2}
                                                        h={2}
                                                        borderRadius="full"
                                                        bg={isSubActive ? activeColor : 'orange.400'}
                                                        mr={3}
                                                    />
                                                    {subLink.name}
                                                </Button>
                                            );
                                        })}
                                    </VStack>
                                </Collapse>
                            )}
                        </Box>
                    );
                })}
            </VStack>


            <AlertDialog
                isOpen={false}
                closeOnOverlayClick={false}
                onClose={() => {}}
            >
                <AlertDialogOverlay bg={'blackAlpha.300'} backdropFilter={'blur(10px) hue-rotate(90deg)'}>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            <Alert status='warning'>
                                <AlertIcon />
                                Attention:
                            </Alert>
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            <Text>Your session has expired. Please log in again to continue.</Text>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button onClick={() => window.location.href = "/"} colorScheme='red' ml={3}>
                                Login
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

const MobileNav = ({ onOpen, ...rest }) => {
    const navigate = useNavigate();
    let user = localStorage.getItem('user');
    user = JSON.parse(user);

    const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Flex
            px={{ base: 4, md: 6 }}
            height="20"
            alignItems="center"
            bg={bgColor}
            backdropFilter="blur(10px)"
            borderBottomWidth="1px"
            borderBottomColor={borderColor}
            justifyContent={{ base: 'space-between', md: 'flex-end' }}
            boxShadow="sm"
            {...rest}
        >
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="ghost"
                aria-label="open menu"
                icon={<FiMenu />}
                colorScheme="orange"
                size="lg"
            />

            <HStack spacing={{ base: '2', md: '4' }}>


                <Flex alignItems={'center'}>
                    <Menu>
                        <MenuButton
                            py={2}
                            px={3}
                            transition="all 0.3s"
                            _focus={{ boxShadow: 'none' }}
                            _hover={{
                                bg: useColorModeValue('orange.50', 'gray.700'),
                                borderRadius: 'lg'
                            }}
                        >
                            <HStack spacing={3}>

                                <VStack
                                    display={{ base: 'none', md: 'flex' }}
                                    alignItems="flex-start"
                                    spacing="1px"
                                    ml="2"
                                >
                                    <Text fontSize="sm" fontWeight="semibold">
                                        {user?.sub}
                                    </Text>

                                </VStack>
                                <Box display={{ base: 'none', md: 'flex' }}>
                                    <FiChevronDown />
                                </Box>
                            </HStack>
                        </MenuButton>
                        <MenuList
                            bg={useColorModeValue('white', 'gray.900')}
                            borderColor={borderColor}
                            boxShadow="xl"
                        >
                            <MenuItem
                                icon={<Icon as={FiHome} />}
                                _hover={{
                                    bg: useColorModeValue('orange.50', 'gray.700'),
                                }}
                            >
                                Profile
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem
                                onClick={() => {
                                    localStorage.clear();
                                    navigate("/")
                                }}
                                icon={<Icon as={FiLogOut} />}
                                color="red.500"
                                _hover={{
                                    bg: useColorModeValue('red.50', 'red.900'),
                                }}
                            >
                                Sign out
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>
            </HStack>
        </Flex>
    );
}