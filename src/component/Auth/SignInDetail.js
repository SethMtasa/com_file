import {
    Flex,
    Box,
    FormControl,
    FormLabel,
    Input,
    Checkbox,
    Stack,
    Button,
    Heading,
    useToast,
    Text,
    Image,
    InputGroup,
    InputAddon,
    IconButton,
} from '@chakra-ui/react';
import AuthService from '../../services/AuthService';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import { RiLockPasswordFill } from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

export default function SignIn() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Load username from local storage
    useEffect(() => {
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const login = async () => {
        setEmailError('');
        setPasswordError('');
        const res = validation();
        if (!res) {
            toast({
                title: 'Failed',
                description: "Please enter details",
                status: 'error',
                duration: 6000,
            });
            return;
        }
        try {
            setLoading(true);
            const response = await AuthService.Login({ username, password });
            if (response.data.success) {
                const token = response.data.token;
                localStorage.setItem("token", token);
                const profileData = jwtDecode(token);
                localStorage.setItem("user", JSON.stringify(profileData));

                // Save username if Remember Me is checked
                if (rememberMe) {
                    localStorage.setItem('username', username);
                } else {
                    localStorage.removeItem('username');
                }

                const user = JSON.parse(localStorage.getItem('user'));
                const routes = {
                    USER: 'user/home',
                    ADMIN: 'admin/home',

                };

                navigate(routes[user.role]);
                toast({
                    title: 'Success',
                    description: `Logged in successfully as ${user.role}`,
                    status: 'success',
                    duration: 6000,
                });
            } else {
                toast({
                    title: "Failed To Log In",
                    description: "User Log In Failed: Incorrect email / Password",
                    status: "error",
                });
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error) => {
        if (error.response) {
            toast({
                title: "Error",
                description: `User Log In Failed: Incorrect email / Password`,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } else if (error.request) {
            toast({
                title: "Network Error",
                description: "No response from server",
                status: "error",
                duration: 8000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: `Error: ${error.message}`,
                status: "error",
                duration: 8000,
                isClosable: true,
            });
        }
    };

    const validation = () => {
        if (!username) {
            setEmailError('Username is required');
            return false;
        }
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        return true;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <Flex
            minH='100vh'
            align='center'
            justify='center'
            bgImage='url(lease.jpg)'
            bgSize='cover'
            bgPosition='center'
            filter='brightness(0.8)'
            w='100vw'
            h='100vh'
        >
            <Stack
                spacing={10}
                mx='auto'
                maxW='xl'  // Increased from 'lg' to 'xl' (20% larger)
                py={16}    // Increased from py={12} to py={16}
                px={8}     // Increased from px={6} to px={8}
                w='full'
                maxW='500px' // Added explicit max width
            >
                <Stack align='center' spacing={6}>
                    <Image
                        borderRadius='full'
                        boxSize='110px' // Increased from 90px to 110px (22% larger)
                        src='netone.png'
                        alt='logo'
                        opacity={1}
                    />
                    <Heading fontSize='4xl' color='white' textAlign='center'> {/* Increased from 3xl to 4xl */}
                        Commercial File Management System
                    </Heading>
                </Stack>
                <Box
                    rounded='lg'
                    bg='white'
                    boxShadow='2xl'
                    p={10} // Increased from p={8} to p={10}
                    transform='translateZ(0)'
                    border='1px solid rgba(0,0,0,0.1)'
                    backdropFilter='blur(10px)'
                    transition='all 0.3s'
                    w='full'
                    _hover={{
                        boxShadow: '4xl',
                        transform: 'scale(1.05)',
                    }}
                >
                    <Text color='orange' fontSize='lg' textAlign='center' mb={6}> {/* Increased from sm to lg */}
                        <b>Use your email credentials to log in!</b>
                    </Text>
                    <Stack spacing={6}> {/* Increased from spacing={4} to spacing={6} */}
                        <FormControl id='username'>
                            <FormLabel fontSize='lg'>Username</FormLabel> {/* Increased font size */}
                            <InputGroup size='lg'> {/* Increased input group size */}
                                <InputAddon
                                    children={<FiUser size={20} />}  // Increased icon size
                                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                    _hover={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)' }}
                                />
                                <Input
                                    type='text'
                                    placeholder='Enter username'
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => { setEmailError('') }}
                                    borderColor={emailError ? 'red.400' : 'gray.300'}
                                    transition='border-color 0.2s'
                                    _focus={{ borderColor: 'blue.400' }}
                                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                    _hover={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)' }}
                                    fontSize='lg' // Increased font size
                                    height='50px' // Increased input height
                                />
                            </InputGroup>
                            <Text color='red' fontSize='md' mt={2}>{emailError}</Text> {/* Increased font size */}
                        </FormControl>
                        <FormControl id='password'>
                            <FormLabel fontSize='lg'>Password</FormLabel> {/* Increased font size */}
                            <InputGroup size='lg'> {/* Increased input group size */}
                                <InputAddon
                                    children={<RiLockPasswordFill size={20} />}  // Increased icon size
                                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                    _hover={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)' }}
                                />
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Enter password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => { setPasswordError('') }}
                                    borderColor={passwordError ? 'red.400' : 'gray.300'}
                                    transition='border-color 0.2s'
                                    _focus={{ borderColor: 'blue.400' }}
                                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                    _hover={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)' }}
                                    fontSize='lg' // Increased font size
                                    height='50px' // Increased input height
                                />
                                <IconButton
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    icon={showPassword ? <AiFillEyeInvisible size={20} /> : <AiFillEye size={20} />} // Increased icon size
                                    onClick={togglePasswordVisibility}
                                    variant='outline'
                                    borderLeft='none'
                                    zIndex='1'
                                    size='lg' // Increased icon button size
                                    onMouseEnter={togglePasswordVisibility}
                                    onMouseLeave={() => setShowPassword(false)}
                                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                    _hover={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)' }}
                                    height='50px' // Match input height
                                />
                            </InputGroup>
                            <Text color='red' fontSize='md' mt={2}>{passwordError}</Text> {/* Increased font size */}
                        </FormControl>
                        <Stack spacing={8}> {/* Increased from spacing={10} to spacing={8} */}
                            <Button
                                isLoading={loading}
                                loadingText='Loading'
                                variant="ghost"
                                onClick={login}
                                bg="orange"
                                color='black'
                                _hover={{ bg: 'white', transform: 'scale(1.05)' }}
                                transition='transform 0.2s'
                                boxShadow="0 4px 8px rgba(0, 0, 0, 0.2)"
                                size='lg' // Increased button size
                                height='60px' // Increased button height
                                fontSize='xl' // Increased button font size
                                fontWeight='bold'
                            >
                                Sign In
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>
        </Flex>
    );
}