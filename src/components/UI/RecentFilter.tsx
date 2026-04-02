import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

interface RecentFilterProps {
  isActive: boolean;
  onToggle: () => void;
  count: number;
}

export const RecentFilter: React.FC<RecentFilterProps> = ({
  isActive,
  onToggle,
  count,
}) => {
  return (
    <motion.button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-philly-blue text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isActive ? (
        <Zap className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span>Most Recent</span>
      {count > 0 && (
        <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
          {count}
        </span>
      )}
    </motion.button>
  );
};