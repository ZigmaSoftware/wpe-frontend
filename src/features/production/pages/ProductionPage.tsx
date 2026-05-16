import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import {
  useProductionOrderDetail,
  useProductionMaterialMovements,
  useProductionTransactions,
  useProductionSummary,
  useUpdateProductionOrder,
} from '../hooks/useProduction';
import { GeneralTab } from '../components/GeneralTab';
import { MaterialMovementTab } from '../components/MaterialMovementTab';
import { ProductionTransactionTab } from '../components/ProductionTransactionTab';
import { SummaryTab } from '../components/SummaryTab';
import { ProductionOrderDetail } from '../types';

type TabType = 'general' | 'material-movement' | 'transactions' | 'summary';

export const ProductionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Fetch data
  const { data: productionOrder, isLoading: isLoadingOrder } = useProductionOrderDetail(id || '');
  const { data: materialMovements, isLoading: isLoadingMovements } =
    useProductionMaterialMovements(id || '');
  const { data: transactions, isLoading: isLoadingTransactions } = useProductionTransactions(id || '');
  const { data: summary, isLoading: isLoadingSummary } = useProductionSummary(id || '');
  const updateMutation = useUpdateProductionOrder();

  const isLoading = isLoadingOrder || isLoadingMovements || isLoadingTransactions || isLoadingSummary;

  const handleEditGeneral = async (data: Partial<ProductionOrderDetail>) => {
    if (id) {
      await updateMutation.mutateAsync({
        id,
        data,
      });
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'general', label: 'GENERAL', icon: '📋' },
    { id: 'material-movement', label: 'MATERIAL MOVEMENT', icon: '📦' },
    { id: 'transactions', label: 'PRDN TRANSACTIONS', icon: '📊' },
    { id: 'summary', label: 'SUMMARY', icon: '💹' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {productionOrder?.production_id || 'Production Order'}
                </h1>
                {productionOrder && (
                  <p className="text-sm text-gray-600 mt-1">
                    {productionOrder.production_type.replace(/_/g, ' ')} •{' '}
                    {new Date(productionOrder.production_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                <Plus size={20} />
                Add Material
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : productionOrder ? (
          <>
            {activeTab === 'general' && (
              <GeneralTab
                productionOrder={productionOrder}
                isLoading={isLoadingOrder}
                onEdit={handleEditGeneral}
              />
            )}

            {activeTab === 'material-movement' && (
              <MaterialMovementTab
                materialMovements={materialMovements || []}
                isLoading={isLoadingMovements}
              />
            )}

            {activeTab === 'transactions' && (
              <ProductionTransactionTab
                transactions={transactions || []}
                isLoading={isLoadingTransactions}
              />
            )}

            {activeTab === 'summary' && (
              <SummaryTab
                productionOrder={productionOrder}
                summary={summary || null}
                isLoading={isLoadingSummary}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600">Production order not found</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {productionOrder && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
            <div className="text-gray-600">
              Created by {productionOrder.created_by} on{' '}
              {new Date(productionOrder.created_at).toLocaleDateString()}
            </div>
            <div className="text-gray-600">
              Last updated {new Date(productionOrder.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPage;
