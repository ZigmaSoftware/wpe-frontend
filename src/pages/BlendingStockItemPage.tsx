import InventoryStockItemPageContent from "@/features/items/components/InventoryStockItemPageContent";
import { BLENDING_STOCK_ROUTE } from "@/features/blending/utils/routes";

const BlendingStockItemPage = () => (
  <InventoryStockItemPageContent module="blending" backHref={BLENDING_STOCK_ROUTE} backLabel="Back to Blending Stock" />
);

export default BlendingStockItemPage;
