import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { ProductionOrderDetail } from '../types';

interface GeneralTabProps {
  productionOrder: ProductionOrderDetail | null;
  isLoading?: boolean;
  onEdit?: (data: Partial<ProductionOrderDetail>) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  productionOrder,
  isLoading = false,
  onEdit,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<ProductionOrderDetail> | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading production details...</div>
      </div>
    );
  }

  if (!productionOrder) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No production order selected</div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditMode(true);
    setEditData({ ...productionOrder });
  };

  const handleSave = () => {
    if (editData && onEdit) {
      onEdit(editData);
      setIsEditMode(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditData(null);
  };

  const handleChange = (field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PLAN_COMPLETED: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      PLANNED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{productionOrder.production_id}</h2>
          <p className="text-sm text-gray-600">
            {productionOrder.production_type.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(productionOrder.status)}`}>
            {productionOrder.status.replace(/_/g, ' ')}
          </span>
          {!isEditMode && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              <Edit2 size={16} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Production Information */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Production Details</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Production Type</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.production_type || ''}
                onChange={(e) => handleChange('production_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.production_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Production Date</label>
            {isEditMode ? (
              <input
                type="date"
                value={editData?.production_date || ''}
                onChange={(e) => handleChange('production_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.production_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Shift</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.shift || ''}
                onChange={(e) => handleChange('shift', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.shift}</p>
            )}
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Batch Information</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Batch Number</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.batch_number || ''}
                onChange={(e) => handleChange('batch_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.batch_number || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Batch Date</label>
            {isEditMode ? (
              <input
                type="date"
                value={editData?.batch_date || ''}
                onChange={(e) => handleChange('batch_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.batch_date || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Plan ID</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.plan_id || ''}
                onChange={(e) => handleChange('plan_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.plan_id || '-'}</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Line & Location</h3>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Line Number</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.line_number || ''}
                onChange={(e) => handleChange('line_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.line_number || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Line Name</label>
            {isEditMode ? (
              <input
                type="text"
                value={editData?.line_name || ''}
                onChange={(e) => handleChange('line_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.line_name || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Planning Information */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Planning Information</h3>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Planned Qty (kgs)</label>
            {isEditMode ? (
              <input
                type="number"
                value={editData?.planned_quantity || 0}
                onChange={(e) => handleChange('planned_quantity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.planned_quantity.toFixed(3)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Planned Weight (kgs)</label>
            {isEditMode ? (
              <input
                type="number"
                value={editData?.planned_weight || 0}
                onChange={(e) => handleChange('planned_weight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.planned_weight.toFixed(3)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Total Qty (kgs)</label>
            {isEditMode ? (
              <input
                type="number"
                value={editData?.total_quantity || 0}
                onChange={(e) => handleChange('total_quantity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.total_quantity.toFixed(3)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            {isEditMode ? (
              <select
                value={editData?.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PLANNED">Planned</option>
                <option value="PLAN_COMPLETED">Plan Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{productionOrder.status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Production Timeline */}
      <div className="bg-gray-50 p-4 rounded border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Production Timeline</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date & Time</label>
            {isEditMode ? (
              <input
                type="datetime-local"
                value={editData?.start_date_time || ''}
                onChange={(e) => handleChange('start_date_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">
                {new Date(productionOrder.start_date_time).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date & Time</label>
            {isEditMode ? (
              <input
                type="datetime-local"
                value={editData?.end_date_time || ''}
                onChange={(e) => handleChange('end_date_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <p className="text-gray-900 font-medium">
                {productionOrder.end_date_time
                  ? new Date(productionOrder.end_date_time).toLocaleString()
                  : '-'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditMode && (
        <div className="flex gap-3 justify-end border-t pt-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneralTab;
