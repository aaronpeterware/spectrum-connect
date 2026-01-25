import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface OnboardingData {
  profilePhotos: string[];
  name: string;
  age: number | null;
  location: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | null;
  seeking: ('male' | 'female' | 'non-binary')[];
  goals: ('relationship' | 'friendship' | 'practice')[];
  bio: string;
  interests: string[];
}

interface OnboardingContextType {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  isStepValid: (step: number) => boolean;
  canProceed: () => boolean;
}

const initialData: OnboardingData = {
  profilePhotos: [],
  name: '',
  age: null,
  location: '',
  gender: null,
  seeking: [],
  goals: [],
  bio: '',
  interests: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 8; // Welcome, Photo, Basics, Gender, Seeking, Goals, Interests, Complete

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const resetOnboarding = useCallback(() => {
    setData(initialData);
    setCurrentStep(0);
  }, []);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Welcome
        return true;
      case 1: // Photo
        return data.profilePhotos.length > 0;
      case 2: // Basics (name, age, location)
        return data.name.trim().length >= 2 &&
               data.age !== null &&
               data.age >= 18 &&
               data.age <= 100 &&
               data.location.trim().length > 0;
      case 3: // Gender
        return data.gender !== null;
      case 4: // Seeking
        return data.seeking.length > 0;
      case 5: // Goals
        return data.goals.length > 0;
      case 6: // Interests
        return data.interests.length >= 3;
      case 7: // Complete
        return true;
      default:
        return false;
    }
  }, [data]);

  const canProceed = useCallback((): boolean => {
    return isStepValid(currentStep);
  }, [currentStep, isStepValid]);

  const value: OnboardingContextType = {
    data,
    currentStep,
    totalSteps,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    resetOnboarding,
    isStepValid,
    canProceed,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext;
