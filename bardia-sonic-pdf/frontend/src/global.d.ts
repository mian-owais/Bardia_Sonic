// Global type definitions
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LinkProps } from 'react-router-dom';

// Fix for react-bootstrap Button with react-router-dom Link
declare module 'react-bootstrap' {
  export interface ButtonProps {
    as?: any;
  }
} 