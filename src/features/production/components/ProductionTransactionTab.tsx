import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { ProductionTransaction, TransactionType } from '../types';

interface ProductionTransactionTabProps {
  transactions: ProductionTransaction[] | null;
  isLoading?: boolean;
  onViewDetails?: (transaction: ProductionTransaction) => void;
}

interface SortConfig {
  key: keyof ProductionTransaction;
  direction: 'asc' | 'desc';
}

export const ProductionTransactionTab: React.FC<ProductionTransactionTabProps> = ({
  transactions = [],
  isLoading = false,
  onViewDetails,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'transaction_date',
    direction: 'desc',
  });
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort transactions
  const filteredAndSorted = useMemo(() => {
    let result = [...(transactions || [])];

    // Apply type filter
    if (filterType !== 'ALL') {
      result = result.filter((t) => t.transaction_type === filterType);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.transaction_id.toLowerCase().includes(term) ||
          t.item_name.toLowerCase().includes(term) ||
          t.item_code?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal as string);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = (aVal as number) - (bVal as number);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filterType, searchTerm, sortConfig]);

  const handleSort = (key: keyof ProductionTransaction) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortHeader: React.FC<{
    label: string;
    sortKey: keyof ProductionTransaction;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header with link */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Production Transactions</h3>
        <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View production transactions →
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Transaction ID, Item name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value={TransactionType.INWARD}>Inward</option>
          <option value={TransactionType.OUTWARD}>Outward</option>
        </select>
      </div>

      {/* Table */}
      {filteredAndSorted.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="TransID" sortKey="transaction_id" />
                <SortHeader label="Date" sortKey="transaction_date" />
                <SortHeader label="Item#" sortKey="item_number" />
                <SortHeader label="Item" sortKey="item_name" />
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Inwards
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Outwards
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Bin
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } border-b border-gray-200 hover:bg-gray-100 transition`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {transaction.transaction_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{transaction.item_number}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.item_name}</p>
                      {transaction.item_code && (
                        <p className="text-xs text-gray-600">{transaction.item_code}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.quantity_in > 0 ? (
                      <span className="font-semibold text-blue-600">
                        {transaction.quantity_in.toFixed(3)} {transaction.unit}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transaction.quantity_out > 0 ? (
                      <span className="font-semibold text-orange-600">
                        {transaction.quantity_out.toFixed(3)} {transaction.unit}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.warehouse || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.bin_location || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onViewDetails?.(transaction)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
          <p className="text-gray-600">No transactions found</p>
          {searchTerm && (
            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
          )}
        </div>
      )}

      {/* Summary */}
      {filteredAndSorted.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Inwards</p>
              <p className="text-lg font-bold text-blue-600">
                {filteredAndSorted
                  .reduce((sum, t) => sum + t.quantity_in, 0)
                  .toFixed(3)} kgs
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Outwards</p>
              <p className="text-lg font-bold text-orange-600">
                {filteredAndSorted
                  .reduce((sum, t) => sum + t.quantity_out, 0)
                  .toFixed(3)} kgs
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-600 mb-1">Total Transactions</p>
              <p className="text-lg font-bold text-gray-900">{filteredAndSorted.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionTransactionTab;
