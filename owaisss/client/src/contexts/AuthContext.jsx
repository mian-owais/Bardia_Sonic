import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(undefined);  // Initialize as undefined to indicate loading
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');
                
                if (storedToken && storedUser) {
                    // Set up axios default headers
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } else {
                    setToken(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });
            
            const { token, user } = response.data;
            
            // Set up axios default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            console.log('AuthContext: Login successful, token and user set:', { token, user });
        } catch (error) {
            console.error('Login error:', error);
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw error;
        }
    };

    const register = async (username, email, password, name) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                username,
                email,
                password,
                name
            });
            
            const { token, user } = response.data;
            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        console.log('AuthContext: Logged out, token and user cleared');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            isAuthenticated: !!token && token !== undefined,
            isLoading
        }}>
            {isLoading ? null : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 