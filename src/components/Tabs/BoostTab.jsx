import React, { useEffect } from 'react';
import { useBoostStore } from '../../store/boostStore';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { BoostEmpty } from '../Boost/BoostEmpty';
import { BoostStatus } from '../Boost/BoostStatus';

export function BoostTab() {
  const { post, isLoading, loadBoostedPost, error, clearError } = useBoostStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    loadBoostedPost();
  }, []);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800">🚀 Boost a LinkedIn Post</h2>
        <p className="text-sm text-gray-500 mt-1">
          Submit one LinkedIn post per day to be boosted by our network.
          <br className="hidden sm:inline" />
          Status will be updated by our backend process.
        </p>
      </div>

      {isLoading && !post ? (
        <LoadingSpinner />
      ) : (
        <>
          {post ? (
            <BoostStatus />
          ) : (
            <BoostEmpty />
          )}
        </>
      )}
    </div>
  );
}