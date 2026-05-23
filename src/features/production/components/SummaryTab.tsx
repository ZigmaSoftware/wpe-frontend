import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp, DollarSign, Package } from 'lucide-react';
import { ProductionOrderDetail, ProductionSummary } from '../types';

interface SummaryTabProps {
  productionOrder: ProductionOrderDetail | null;
  summary: ProductionSummary | null;
  isLoading?: boolean;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  productionOrder,
  summary,
  isLoading = false,
}) => {
  const costMetrics = useMemo(() => {
    if (!productionOrder) {
      return null;
    }

    return {
      totalQty: productionOrder.total_quantity,
      materialCost: productionOrder.material_cost,
      otherCost: productionOrder.other_cost,
      totalCost: productionOrder.total_cost,
      costPerUnit: productionOrder.cost_per_unit,
    };
  }, [productionOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading summary...</div>
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

  return (
    <div className="p-6 space-y-8">
      {/* Cost Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>

        <div className="grid grid-cols-4 gap-4">
          {/* Total Production Qty */}
          <div className="bg-white rounded p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Production Qty</span>
              <Package className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {costMetrics?.totalQty.toFixed(3) || '0.000'}
            </p>
            <p className="text-xs text-gray-600 mt-1">kgs</p>
          </div>

          {/* Material Cost */}
          <div className="bg-white rounded p-4 shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Material Cost</span>
              <DollarSign className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{costMetrics?.materialCost.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Direct costs</p>
          </div>

          {/* Other Cost */}
          <div className="bg-white rounded p-4 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Other Cost</span>
              <TrendingUp className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{costMetrics?.otherCost.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-600 mt-1">Overhead & utilities</p>
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">Total Cost</span>
              <DollarSign className="text-white" size={20} />
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{costMetrics?.totalCost.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-green-100 mt-1">All-inclusive</p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Pie Chart Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h4>

          <div className="space-y-3">
            {/* Material Cost Bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Material Cost</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{costMetrics?.materialCost.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      costMetrics?.totalCost ? (costMetrics.materialCost / costMetrics.totalCost) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {costMetrics?.totalCost
                  ? (
                      (costMetrics.materialCost / costMetrics.totalCost) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </span>
            </div>

            {/* Other Cost Bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Other Cost</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{costMetrics?.otherCost.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{
                    width: `${
                      costMetrics?.totalCost ? (costMetrics.otherCost / costMetrics.totalCost) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {costMetrics?.totalCost
                  ? (
                      (costMetrics.otherCost / costMetrics.totalCost) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total Cost</span>
              <span className="font-bold text-lg text-green-600">
                ₹{costMetrics?.totalCost.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Cost per Unit Metrics */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Unit Economics</h4>

          <div className="space-y-6">
            {/* Cost per Unit */}
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Cost per Unit (kg)</p>
              <p className="text-4xl font-bold text-blue-600">
                ₹{costMetrics?.costPerUnit.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Total cost divided by total quantity
              </p>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Material Cost per Unit</span>
                <span className="font-semibold text-gray-900">
                  ₹{costMetrics?.totalQty ? (costMetrics.materialCost / costMetrics.totalQty).toFixed(2) : '0.00'}/kg
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Other Cost per Unit</span>
                <span className="font-semibold text-gray-900">
                  ₹{costMetrics?.totalQty ? (costMetrics.otherCost / costMetrics.totalQty).toFixed(2) : '0.00'}/kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Details (if available) */}
      {summary && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Production Summary Details</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">Total Input Quantity</p>
              <p className="text-xl font-bold text-blue-600">
                {summary.total_input_quantity.toFixed(3)} kgs
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded border border-green-100">
              <p className="text-xs text-gray-600 mb-1">Total Output Quantity</p>
              <p className="text-xl font-bold text-green-600">
                {summary.total_output_quantity.toFixed(3)} kgs
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded border border-red-100">
              <p className="text-xs text-gray-600 mb-1">Total Waste/Scrap</p>
              <p className="text-xl font-bold text-red-600">
                {summary.total_waste_quantity.toFixed(3)} kgs
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded border border-purple-100 col-span-2">
              <p className="text-xs text-gray-600 mb-1">Yield %</p>
              <p className="text-xl font-bold text-purple-600">
                {summary.yield_percentage.toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded border border-indigo-100">
              <p className="text-xs text-gray-600 mb-1">Finalized</p>
              <p className="text-sm font-semibold">
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    summary.is_finalized ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                >
                  {summary.is_finalized ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryTab;
