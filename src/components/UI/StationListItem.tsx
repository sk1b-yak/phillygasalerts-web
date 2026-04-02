import { motion } from 'framer-motion';
import { useStationFreshness } from '../../hooks/useStationFreshness';
import { formatPrice } from '../../utils/formatters';

interface StationListItemProps {
  station: {
    station_name: string;
    address: string;
    price_regular: number;
    price_updated_at: string;
  };
  onClick: () => void;
}

export const StationListItem: React.FC<StationListItemProps> = ({
  station,
  onClick,
}) => {
  const freshness = useStationFreshness(station.price_updated_at);

  return (
    <motion.div
      onClick={onClick}
      className="p-3 border-b cursor-pointer hover:bg-slate-50 transition-colors"
      style={{
        opacity: freshness.opacity,
        filter: freshness.isGrayscale ? 'grayscale(100%)' : 'none',
      }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium truncate">{station.station_name}</h3>
        <span className="text-lg font-bold text-philly-blue">
          {formatPrice(station.price_regular)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-slate-500 truncate">{station.address}</p>

        <span className={`text-xs px-2 py-0.5 rounded-full ${
          freshness.level === 'fresh'
            ? 'bg-green-100 text-green-700'
            : freshness.level === 'recent'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-500'
        }`}>
          {freshness.label}
        </span>
      </div>
    </motion.div>
  );
};