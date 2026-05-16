import React, { useMemo } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { MaterialMovement, MaterialMovementType } from '../types';

interface MaterialMovementTabProps {
  materialMovements: MaterialMovement[] | null;
  isLoading?: boolean;
}

export const MaterialMovementTab: React.FC<MaterialMovementTabProps> = ({
  materialMovements = [],
  isLoading = false,
}) => {
  // Group movements by type
  const groupedMovements = useMemo(() => {
    const groups: Record<MaterialMovementType, MaterialMovement[]> = {
      [MaterialMovementType.RAW_MATERIAL_IN]: [],
      [MaterialMovementType.OUTPUT_IN_PRODUCTION]: [],
      [MaterialMovementType.RETURN_TO_MC]: [],
      [MaterialMovementType.OUTPUT_TO_WAREHOUSE]: [],
    };

    materialMovements?.forEach((movement) => {
      if (movement.movement_type in groups) {
        groups[movement.movement_type as MaterialMovementType].push(movement);
      }
    });

    return groups;
  }, [materialMovements]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading material movements...</div>
      </div>
    );
  }

  const MovementCard: React.FC<{ movement: MaterialMovement }> = ({ movement }) => (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Source */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">From</h4>
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-semibold text-gray-900">{movement.source_location}</p>
            {movement.warehouse && (
              <p className="text-sm text-gray-600">Warehouse: {movement.warehouse}</p>
            )}
          </div>
        </div>

        {/* Destination */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">To</h4>
          <div className="bg-blue-50 p-3 rounded">
            <p className="font-semibold text-gray-900">{movement.destination_location}</p>
            {movement.bin_number && (
              <p className="text-sm text-gray-600">Bin: {movement.bin_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Material Details */}
      <div className="bg-gray-50 p-3 rounded mb-3">
        <p className="text-sm font-semibold text-gray-900">{movement.item_name}</p>
        {movement.item_code && (
          <p className="text-xs text-gray-600">Code: {movement.item_code}</p>
        )}
        <p className="text-sm font-bold text-blue-600 mt-2">
          {movement.quantity} {movement.unit}
        </p>
      </div>

      {/* Status and Date */}
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded text-white font-medium ${
          movement.status === 'COMPLETED' ? 'bg-green-500' :
          movement.status === 'IN_TRANSIT' ? 'bg-yellow-500' :
          'bg-gray-400'
        }`}>
          {movement.status}
        </span>
        <span className="text-gray-600">
          {new Date(movement.movement_date).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  const MovementSection: React.FC<{
    title: string;
    movements: MaterialMovement[];
    icon: React.ReactNode;
  }> = ({ title, movements, icon }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-2 py-1 rounded">
          {movements.length}
        </span>
      </div>

      {movements.length > 0 ? (
        <div className="space-y-2">
          {movements.map((movement) => (
            <MovementCard key={movement.id} movement={movement} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-6 text-center">
          <Package className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-gray-600">No {title.toLowerCase()} recorded</p>
        </div>
      )}
    </div>
  );

  const isEmpty = !materialMovements || materialMovements.length === 0;

  return (
    <div className="p-6 space-y-8">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Package size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No material movements recorded</p>
        </div>
      ) : (
        <>
          {/* Raw Materials Section */}
          <MovementSection
            title="Raw Materials"
            movements={groupedMovements[MaterialMovementType.RAW_MATERIAL_IN]}
            icon={<Package size={24} className="text-blue-600" />}
          />

          {/* Output in Production */}
          <MovementSection
            title="Output in Production"
            movements={groupedMovements[MaterialMovementType.OUTPUT_IN_PRODUCTION]}
            icon={<Package size={24} className="text-purple-600" />}
          />

          {/* Returns to Material Center */}
          <MovementSection
            title="Send Returns to MC"
            movements={groupedMovements[MaterialMovementType.RETURN_TO_MC]}
            icon={<ArrowRight size={24} className="text-orange-600" />}
          />

          {/* Output to Warehouse */}
          <MovementSection
            title="Send Output to Warehouse"
            movements={groupedMovements[MaterialMovementType.OUTPUT_TO_WAREHOUSE]}
            icon={<ArrowRight size={24} className="text-green-600" />}
          />
        </>
      )}
    </div>
  );
};

export default MaterialMovementTab;
