import React, { useReducer, useEffect } from 'react';
import { adminApiService } from '../services/api';
import { AuthContext } from './authContextValue';

// Initial state
const initialState = {
  user: null,
  // true only while the stored session is being restored on first load
  initializing: true,
  loading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  INITIALIZED: 'INITIALIZED',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ActionTypes.INITIALIZED:
      return {
        ...state,
        initializing: false,
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        initializing: false,
        loading: false,
        error: null,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        initializing: false,
        loading: false,
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        initializing: false,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // You might want to validate the token here
      dispatch({ type: ActionTypes.SET_USER, payload: { token } });
    } else {
      dispatch({ type: ActionTypes.INITIALIZED });
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await adminApiService.auth.login({ username, password });
      
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      dispatch({ type: ActionTypes.SET_USER, payload: { username, token: access } });
    } catch (error) {
      dispatch({ 
        type: ActionTypes.SET_ERROR, 
        payload: error.response?.data?.detail || 'Login failed' 
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: ActionTypes.LOGOUT });
  };

  return (
    <AuthContext.Provider 
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
