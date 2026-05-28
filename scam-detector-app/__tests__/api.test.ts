import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('API Client Defined Test', () => {
  it('should be defined', () => {
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBeDefined();
  });
});
