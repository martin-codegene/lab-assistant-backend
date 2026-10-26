import {
    Analysis,
    AnalysisType,
    api,
    GelImageAnalysisRequest,
    ProtocolOptimizationRequest,
    TroubleshootingRequest,
} from "@/lib/api";
import { useCallback, useState } from "react";

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeGelImage = useCallback(
    async (data: GelImageAnalysisRequest): Promise<Analysis | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.analyzeGelImage(data);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to analyze gel image";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const troubleshoot = useCallback(
    async (data: TroubleshootingRequest): Promise<Analysis | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.troubleshoot(data);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to troubleshoot";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const optimizeProtocol = useCallback(
    async (data: ProtocolOptimizationRequest): Promise<Analysis | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.optimizeProtocol(data);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to optimize protocol";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getAnalysis = useCallback(async (analysisId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAnalysis(analysisId);
      return response.data || null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get analysis";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const listExperimentAnalyses = useCallback(
    async (
      experimentId: string,
      params?: { page?: number; limit?: number },
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.listExperimentAnalyses(experimentId, params);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to list analyses";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listMyAnalyses = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.listMyAnalyses(params);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to list analyses";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listAnalysesByType = useCallback(
    async (type: AnalysisType, params?: { page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.listAnalysesByType(type, params);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to list analyses";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listRecentAnalyses = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.listRecentAnalyses(params);
        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to list analyses";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    analyzeGelImage,
    troubleshoot,
    optimizeProtocol,
    getAnalysis,
    listExperimentAnalyses,
    listMyAnalyses,
    listAnalysesByType,
    listRecentAnalyses,
  };
};
