'use client';

import { useCallback } from 'react';
import { useBacktestStore } from '@/stores/backtest-store';
import {
  fetchVersions,
  createVersion,
  deleteVersion,
  restoreVersion,
  promoteVersion,
} from '@/lib/api/strategy-version';
import { showError, showSuccess } from '@/lib/toast';
import type { CreateVersionRequest } from '@/types/strategy';

/**
 * 전략 버전 관리 훅
 * 항상 전략(템플릿) 레벨 버전을 관리
 */
export function useStrategyVersions() {
  const store = useBacktestStore();

  const loadVersions = useCallback(async (
    strategyNo: number,
    versionType?: string,
  ) => {
    try {
      const list = await fetchVersions(strategyNo, versionType);
      store.setVersions(list);
    } catch (err) {
      store.setVersions([]);
      showError(err);
    }
  }, []);

  const handleCreateVersion = useCallback(
    async (strategyNo: number, body: CreateVersionRequest) => {
      try {
        const created = await createVersion(strategyNo, body);
        store.addVersion(created);
        showSuccess('버전이 생성되었습니다.');
        return created;
      } catch (err) {
        showError(err, '버전 생성 실패');
        throw err;
      }
    },
    [],
  );

  const handleDeleteVersion = useCallback(
    async (strategyNo: number, versionNo: number) => {
      try {
        await deleteVersion(strategyNo, versionNo);
        store.removeVersion(versionNo);
        showSuccess('버전이 삭제되었습니다.');
      } catch (err) {
        showError(err, '버전 삭제 실패');
        throw err;
      }
    },
    [],
  );

  const handleRestoreVersion = useCallback(
    async (strategyNo: number, versionNo: number) => {
      try {
        await restoreVersion(strategyNo, versionNo);
        showSuccess('버전이 복원되었습니다. 전략 설정이 업데이트됩니다.');
      } catch (err) {
        showError(err, '버전 복원 실패');
        throw err;
      }
    },
    [],
  );

  const handlePromoteVersion = useCallback(
    async (versionNo: number, description?: string) => {
      try {
        const promoted = await promoteVersion(versionNo, description);
        store.addVersion(promoted);
        showSuccess('MAJOR 버전으로 승격되었습니다.');
        return promoted;
      } catch (err) {
        showError(err, '버전 승격 실패');
        throw err;
      }
    },
    [],
  );

  const handleCreateMajorFromLatest = useCallback(
    async (strategyNo: number, description?: string) => {
      try {
        const created = await createVersion(strategyNo, {
          versionType: 'MAJOR',
          description,
        });
        store.addVersion(created);
        showSuccess('MAJOR 버전이 생성되었습니다.');
        return created;
      } catch (err) {
        showError(err, 'MAJOR 버전 생성 실패');
        throw err;
      }
    },
    [],
  );

  return {
    versions: store.versions,
    selectedVersionNo: store.selectedVersionNo,
    setSelectedVersionNo: store.setSelectedVersionNo,
    loadVersions,
    handleCreateVersion,
    handleDeleteVersion,
    handleRestoreVersion,
    handlePromoteVersion,
    handleCreateMajorFromLatest,
  };
}
