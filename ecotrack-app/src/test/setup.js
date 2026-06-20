import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Make React available globally for components that rely on JSX transform
globalThis.React = React;

// jsdom doesn't implement scrollIntoView — polyfill it
window.HTMLElement.prototype.scrollIntoView = function () {};

expect.extend(toHaveNoViolations);
