import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import {
  useProductionOrdersList,
  useCreateProductionOrder,
  useDeleteProductionOrder,
} from '../hooks/useProduction';
import { ProductionOrder, ProductionOrderFilters, ProductionStatus, ProductionType } from '../types';

interface SortConfig {
  key: keyof ProductionOrder;
  direction: 'asc' | 'desc';
}

export const ProductionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'production_date',
    direction: 'desc',
  });
  const [filters, setFilters] = useState<ProductionOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  const { data: listResponse, isLoading } = useProductionOrdersList(filters);
  const createMutation = useCreateProductionOrder();
  const deleteMutation = useDeleteProductionOrder();

  const orders = listResponse?.results || [];

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let result = [...orders];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.production_id.toLowerCase().includes(term) ||
          (order.batch_number?.toLowerCase().includes(term) ?? false)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        const comparison = (aVal || '').localeCompare(bVal as string || '');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = (aVal as number) - (bVal as number);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [orders, searchTerm, sortConfig]);

  const handleSort = (key: keyof ProductionOrder) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = async (id: number | string) => {
    if (confirm('Are you sure you want to delete this production order?')) {
      await deleteMutation.mutateAsync(id);
    }
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

  const SortHeader: React.FC<{
    label: string;
    sortKey: keyof ProductionOrder;
  }> = ({ label, sortKey }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Production Orders</h1>
              <p className="text-gray-600 mt-1">Manage and track production orders</p>
            </div>
            <button
              onClick={() => navigate('/production/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              New Production Order
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-2">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID or batch number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value ? (e.target.value as ProductionStatus) : undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value={ProductionStatus.IN_PROGRESS}>In Progress</option>
                <option value={ProductionStatus.PLANNED}>Planned</option>
                <option value={ProductionStatus.PLAN_COMPLETED}>Plan Completed</option>
                <option value={ProductionStatus.CLOSED}>Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.production_type || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    production_type: e.target.value ? (e.target.value as ProductionType) : undefined,
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value={ProductionType.RECYCLING_PRODUCTION}>Recycling Production</option>
                <option value={ProductionType.BLENDING_PRODUCTION}>Blending Production</option>
                <option value={ProductionType.COMPOUNDING}>Compounding</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading production orders...</p>
            </div>
          </div>
        ) : filteredAndSorted.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortHeader label="Production ID" sortKey="production_id" />
                  <SortHeader label="Status" sortKey="status" />
                  <SortHeader label="Type" sortKey="production_type" />
                  <SortHeader label="Date" sortKey="production_date" />
                  <SortHeader label="Batch" sortKey="batch_number" />
                  <SortHeader label="Total Qty (kgs)" sortKey="total_quantity" />
                  <SortHeader label="Total Cost (₹)" sortKey="total_cost" />
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } border-b border-gray-200 hover:bg-blue-50 transition cursor-pointer`}
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium text-blue-600"
                      onClick={() => navigate(`/production/${order.id}`)}
                    >
                      {order.production_id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.production_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.production_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.batch_number || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {order.total_quantity.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ₹{order.total_cost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/production/${order.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">No production orders found</p>
            <button
              onClick={() => navigate('/production/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={20} />
              Create First Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionListPage;
