import InventoryStockItemPageContent from "@/features/items/components/InventoryStockItemPageContent";
import { STORE_STOCK_ROUTE } from "@/features/store/utils/routes";

const StoreStockItemPage = () => (
  <InventoryStockItemPageContent module="store" backHref={STORE_STOCK_ROUTE} backLabel="Back to Store Stock" />
);

export default StoreStockItemPage;
