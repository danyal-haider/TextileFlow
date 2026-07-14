import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // Replace with your actual local IP address if testing on device, or localhost if on emulator
    // e.g. http://192.168.1.5:5000/api/auth
    // Replace with your actual local IP address if testing on device, or localhost if on emulator
    // e.g. http://192.168.1.5:5000/api/auth
    const BASE_URL = `${API_URL}/auth`;

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/login`, {
                email,
                password
            });
            const userInfo = response.data;
            setUserInfo(userInfo);
            setUserToken(userInfo.token);
            AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
            AsyncStorage.setItem('userToken', userInfo.token);
        } catch (e) {
            console.log(`Login error ${e}`);
            Alert.alert('Login Failed', e.response?.data?.message || e.message);
        }
        setIsLoading(false);
    };

    const register = async (name, email, password, role) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/register`, {
                name,
                email,
                password,
                role
            });
            const userInfo = response.data;
            setUserInfo(userInfo);
            setUserToken(userInfo.token);
            AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
            AsyncStorage.setItem('userToken', userInfo.token);
        } catch (e) {
            console.log(`Register error ${e}`);
            Alert.alert('Registration Failed', e.response?.data?.message || e.message);
        }
        setIsLoading(false);
    };

    const logout = () => {
        setIsLoading(true);
        setUserToken(null);
        AsyncStorage.removeItem('userInfo');
        AsyncStorage.removeItem('userToken');
        setIsLoading(false);
    };

    const updateProfile = async (name, email, companyName, password, profilePic, phone, country, city, address, about) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const response = await axios.put(`${API_URL}/users/profile`, {
                name,
                email,
                companyName,
                password,
                profilePic,
                phone,
                country,
                city,
                address,
                about
            }, config);

            const updatedUser = response.data;
            setUserInfo(updatedUser);
            // Don't necessarily update token unless backend refreshes it, but our controller does return a new one
            if (updatedUser.token) {
                setUserToken(updatedUser.token);
                AsyncStorage.setItem('userToken', updatedUser.token);
            }
            AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
            Alert.alert('Success', 'Profile updated successfully');
            return true;
        } catch (e) {
            console.log(`Update Profile error ${e}`);
            Alert.alert('Update Failed', e.response?.data?.message || e.message);
            return false;
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.put(`${API_URL}/users/change-password`, {
                currentPassword,
                newPassword
            }, config);
            Alert.alert('Success', 'Password changed successfully');
            return true;
        } catch (e) {
            console.log(`Change password error ${e}`);
            Alert.alert('Password Change Failed', e.response?.data?.message || e.message);
            return false;
        }
    };

    const verifyPassword = async (currentPassword) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const response = await axios.post(`${API_URL}/users/verify-password`, {
                currentPassword
            }, config);
            return response.data.success;
        } catch (e) {
            console.log(`Verify password error ${e}`);
            Alert.alert('Verification Failed', e.response?.data?.message || e.message);
            return false;
        }
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let storedUserInfo = await AsyncStorage.getItem('userInfo');
            let storedUserToken = await AsyncStorage.getItem('userToken');
            storedUserInfo = JSON.parse(storedUserInfo);

            if (storedUserToken && storedUserInfo) {
                setUserToken(storedUserToken);
                setUserInfo(storedUserInfo);

                // Fetch latest profile details from backend to sync profilePic, phone, etc.
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${storedUserToken}`
                        }
                    };
                    const response = await axios.get(`${API_URL}/users/profile`, config);
                    const freshUser = response.data;
                    const mergedUser = { ...storedUserInfo, ...freshUser };
                    setUserInfo(mergedUser);
                    await AsyncStorage.setItem('userInfo', JSON.stringify(mergedUser));
                } catch (err) {
                    console.log('Error syncing profile details on boot:', err);
                }
            }

            setIsLoading(false);
        } catch (e) {
            console.log(`isLogged in error ${e}`);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, register, logout, updateProfile, changePassword, verifyPassword, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
