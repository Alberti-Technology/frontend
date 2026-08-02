import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFileManagerMutations } from '../useFileManagerMutations';
import { useDataStore } from '../../store/useDataStore';

describe('useFileManagerMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDataStore.setState(useDataStore.getState(), true);
  });

  it('debe retornar ref al input file', () => {
    const pushToast = vi.fn();
    const { result } = renderHook(() => useFileManagerMutations('token', pushToast));
    
    expect(result.current.fileInputRef).toBeDefined();
    expect(result.current.fileInputRef.current).toBeNull();
  });
});
