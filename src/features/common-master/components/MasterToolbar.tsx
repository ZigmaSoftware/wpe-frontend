import Toolbar from "@/components/erp/Toolbar";

type MasterToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  createLabel: string;
  onCreate: () => void;
  filters?: React.ReactNode;
};

const MasterToolbar = ({ search, onSearchChange, createLabel, onCreate, filters }: MasterToolbarProps) => (
  <Toolbar
    search={search}
    onSearchChange={onSearchChange}
    createLabel={createLabel}
    onCreate={onCreate}
    filters={filters}
  />
);

export default MasterToolbar;
