import React, { createContext, useContext, useState, useEffect } from 'react';
import { communityService } from '../services/api';
import { useAuth } from './AuthContext';

interface Community {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface CommunityContextType {
  communities: Community[];
  selectedCommunityId: string | null;
  selectedCommunity: Community | null;
  setSelectedCommunityId: (id: string | null) => void;
  loading: boolean;
  refreshCommunities: () => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    localStorage.getItem('selected_community_id')
  );
  const [loading, setLoading] = useState(false);

  const fetchCommunities = async () => {
    if (!token) {
      setCommunities([]);
      return;
    }

    try {
      setLoading(true);
      const res = await communityService.getAll();
      const fetchedCommunities = res.data || [];
      setCommunities(fetchedCommunities);
    } catch (err) {
      console.error('Failed to fetch communities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [token, user?.id]);

  useEffect(() => {
    if (selectedCommunityId) {
      localStorage.setItem('selected_community_id', selectedCommunityId);
    } else {
      localStorage.removeItem('selected_community_id');
    }
  }, [selectedCommunityId]);

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || null;

  // Apply community theme
  useEffect(() => {
    if (selectedCommunity?.primaryColor) {
      document.documentElement.style.setProperty('--primary', selectedCommunity.primaryColor);
      // Generate a subtle hover/alpha variant if needed
      // document.documentElement.style.setProperty('--primary-hover', selectedCommunity.primaryColor + 'ee');
    } else {
      // Default Klyb Blue
      document.documentElement.style.setProperty('--primary', '#2A7B9B');
    }
  }, [selectedCommunity]);

  return (
    <CommunityContext.Provider value={{ 
      communities, 
      selectedCommunityId, 
      selectedCommunity,
      setSelectedCommunityId, 
      loading,
      refreshCommunities: fetchCommunities
    }}>
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
