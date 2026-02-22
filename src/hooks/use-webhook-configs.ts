'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchWebhookConfigs,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  regenerateSecret,
  testWebhook,
} from '@/lib/api/webhook-config';
import type { WebhookConfig } from '@/types/signal-channel';
import { showError, showSuccess } from '@/lib/toast';

export function useWebhookConfigs() {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchWebhookConfigs();
      setConfigs(list);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (body: { name: string; url: string; headers?: Record<string, string> }) => {
      try {
        const { result, secret } = await createWebhookConfig(body);
        setConfigs((prev) => [result, ...prev]);
        showSuccess(`웹훅이 생성되었습니다. Secret: ${secret}`);
        return { result, secret };
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [],
  );

  const update = useCallback(
    async (no: number, body: { name?: string; url?: string; headers?: Record<string, string> }) => {
      try {
        const updated = await updateWebhookConfig(no, body);
        setConfigs((prev) => prev.map((c) => (c.webhookConfigNo === no ? updated : c)));
        showSuccess('웹훅이 수정되었습니다.');
      } catch (err) {
        showError(err);
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (no: number) => {
    try {
      await deleteWebhookConfig(no);
      setConfigs((prev) => prev.filter((c) => c.webhookConfigNo !== no));
      showSuccess('웹훅이 삭제되었습니다.');
    } catch (err) {
      showError(err);
      throw err;
    }
  }, []);

  const regenSecret = useCallback(async (no: number) => {
    try {
      const { secret } = await regenerateSecret(no);
      showSuccess(`시크릿이 재발급되었습니다: ${secret}`);
      return secret;
    } catch (err) {
      showError(err);
      throw err;
    }
  }, []);

  const test = useCallback(async (no: number) => {
    try {
      const { success } = await testWebhook(no);
      if (success) {
        showSuccess('테스트 웹훅이 전송되었습니다.');
      } else {
        showError('테스트 웹훅 전송에 실패했습니다.');
      }
      return success;
    } catch (err) {
      showError(err);
      throw err;
    }
  }, []);

  return {
    configs,
    isLoading,
    create,
    update,
    remove,
    regenerateSecret: regenSecret,
    test,
    reload: load,
  };
}
