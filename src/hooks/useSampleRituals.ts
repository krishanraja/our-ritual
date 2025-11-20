import { useState, useEffect } from 'react';
import { SAMPLE_RITUALS } from '@/data/sampleRituals';
import { useCouple } from '@/contexts/CoupleContext';

interface Ritual {
  id: string | number;
  title: string;
  description: string;
  time_estimate: string;
  budget_band: string;
  category?: string;
  is_sample?: boolean;
}

export function useSampleRituals() {
  const { couple, currentCycle } = useCouple();
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [isShowingSamples, setIsShowingSamples] = useState(false);

  useEffect(() => {
    // If we have real rituals, show those
    if (currentCycle?.synthesized_output) {
      const output = currentCycle.synthesized_output as any;
      setRituals(output.rituals || []);
      setIsShowingSamples(false);
    }
    // If couple exists but no partner yet, or no synthesized output, show samples
    else if (couple) {
      setRituals(SAMPLE_RITUALS);
      setIsShowingSamples(true);
    }
    // If no couple at all, show samples
    else {
      setRituals(SAMPLE_RITUALS);
      setIsShowingSamples(true);
    }
  }, [couple, currentCycle]);

  return {
    rituals,
    isShowingSamples,
    hasSamples: rituals.length > 0,
  };
}
