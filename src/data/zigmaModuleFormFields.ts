export type ZigmaModuleId = "contact" | "item" | "saledoc" | "ordersaledoc" | "indentsaledoc" | "purchasesaledoc" | "payment" | "production";

export interface ZigmaFormFieldRef {
  label: string;
  key: string;
  type: string;
  tab: string;
  section: string;
  options: string[];
}

export interface ZigmaModuleFormRef {
  moduleName: string;
  available: boolean;
  reason: string;
  fields: ZigmaFormFieldRef[];
}

export const zigmaModuleFormFields: Record<ZigmaModuleId, ZigmaModuleFormRef> = {
  "contact": {
    "moduleName": "Contacts",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "City",
        "key": "city",
        "type": "text",
        "tab": "Addresses",
        "section": "Address composer",
        "options": []
      },
      {
        "label": "Commas are automatically added at the end of each block",
        "key": "address1",
        "type": "textarea",
        "tab": "Addresses",
        "section": "Address composer",
        "options": []
      },
      {
        "label": "Commas are automatically added at the end of each block",
        "key": "landmark",
        "type": "text",
        "tab": "Addresses",
        "section": "Address composer",
        "options": []
      },
      {
        "label": "PostalCode",
        "key": "postalcode",
        "type": "text",
        "tab": "Addresses",
        "section": "Address composer",
        "options": []
      },
      {
        "label": "State",
        "key": "state",
        "type": "text",
        "tab": "Addresses",
        "section": "Address composer",
        "options": []
      },
      {
        "label": "address_type",
        "key": "address_type",
        "type": "select",
        "tab": "Addresses",
        "section": "General",
        "options": [
          "Shipping/Billing",
          "Shipping",
          "Billing",
          "Service Location"
        ]
      },
      {
        "label": "This is a read only field, please use the address composer to create a valid address and click on update!",
        "key": "address",
        "type": "textarea",
        "tab": "Addresses",
        "section": "General",
        "options": []
      },
      {
        "label": "banks_profile",
        "key": "banks_profile",
        "type": "textarea",
        "tab": "Banks",
        "section": "General",
        "options": []
      },
      {
        "label": "Accounting %",
        "key": "acc_per",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Code (Contact Identification)",
        "key": "code",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Contact Verified",
        "key": "approved_status",
        "type": "checkbox",
        "tab": "General",
        "section": "Account Info",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Labour Cost",
        "key": "labour_cost",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Location map link",
        "key": "locationmap_link",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Machine Cost (per hour)",
        "key": "machine_cost_perhour",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "MSME Registered",
        "key": "is_msme_registered",
        "type": "checkbox",
        "tab": "General",
        "section": "Account Info",
        "options": [
          "yes"
        ]
      },
      {
        "label": "MSME Registration No",
        "key": "msme_registration_no",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Other Machine Cost (per hour)",
        "key": "othermachine_cost_perhour",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "TDS %",
        "key": "tds_per",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "TDS Category",
        "key": "tds_category",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": [
          "194J"
        ]
      },
      {
        "label": "Website",
        "key": "website",
        "type": "text",
        "tab": "General",
        "section": "Account Info",
        "options": []
      },
      {
        "label": "Aadhar No",
        "key": "aadhar_no",
        "type": "text",
        "tab": "General",
        "section": "Accounting Info",
        "options": []
      },
      {
        "label": "Credit Limit",
        "key": "credit_limit",
        "type": "text",
        "tab": "General",
        "section": "Accounting Info",
        "options": []
      },
      {
        "label": "GSTIN",
        "key": "vat_tin_no",
        "type": "text",
        "tab": "General",
        "section": "Accounting Info",
        "options": []
      },
      {
        "label": "PAN No",
        "key": "pan_no",
        "type": "text",
        "tab": "General",
        "section": "Accounting Info",
        "options": []
      },
      {
        "label": "Payment Credit Terms",
        "key": "payment_terms",
        "type": "select",
        "tab": "General",
        "section": "Accounting Info",
        "options": [
          "100% Advance",
          "Net 30",
          "Net 45",
          "Net 60",
          "30% Adv, Net 30",
          "50% Adv, Net 30",
          "50% Adv, Net 45",
          "50% Adv, Net 60",
          "50% Adv, Net 90",
          "80% Adv, Net 20",
          "80% Adv, Net 30",
          "90% Adv, Net 30"
        ]
      },
      {
        "label": "Price Book",
        "key": "price_book",
        "type": "select",
        "tab": "General",
        "section": "Accounting Info",
        "options": [
          "CBE WHS"
        ]
      },
      {
        "label": "Special Tax Status",
        "key": "special_tax_status",
        "type": "select",
        "tab": "General",
        "section": "Accounting Info",
        "options": [
          "SEZ",
          "B2B",
          "B2C"
        ]
      },
      {
        "label": "State Code",
        "key": "state_code",
        "type": "select",
        "tab": "General",
        "section": "Accounting Info",
        "options": [
          "--State Names--",
          "Andaman and Nicobar Islands",
          "Andhra Pradesh",
          "Andhra Pradesh (Old)",
          "Arunachal Pradesh",
          "Assam",
          "Bihar",
          "Chandigarh",
          "Chhattisgarh",
          "Dadar and Nagar Haveli & Daman and Diu",
          "Daman and Diu",
          "Delhi"
        ]
      },
      {
        "label": "Contact Identifier",
        "key": "contact_identifier",
        "type": "input",
        "tab": "General",
        "section": "Custom Fields",
        "options": []
      },
      {
        "label": "Has Cust. Items",
        "key": "has_custitems",
        "type": "select",
        "tab": "General",
        "section": "Custom Fields",
        "options": [
          "no",
          "yes"
        ]
      },
      {
        "label": "Onetime Invoice",
        "key": "onetime_invoice",
        "type": "select",
        "tab": "General",
        "section": "Custom Fields",
        "options": [
          "enabled",
          "disabled"
        ]
      },
      {
        "label": "Zigma Contact Id",
        "key": "zigma_contact_id",
        "type": "input",
        "tab": "General",
        "section": "Custom Fields",
        "options": []
      },
      {
        "label": "Category",
        "key": "category",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "-Categories-"
        ]
      },
      {
        "label": "Commission %",
        "key": "commission_per",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "2%",
          "3%",
          "5%"
        ]
      },
      {
        "label": "Contact Type",
        "key": "contact_type",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "-Contact Types-",
          "Lead",
          "Prospect",
          "Unapproved",
          "Customer",
          "Supplier",
          "Serviceproviders",
          "Dealer",
          "Distributor",
          "Shipper",
          "Generalledger",
          "Companyunit"
        ]
      },
      {
        "label": "Currency",
        "key": "currency",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "INR",
          "USD",
          "EURO",
          "JPY",
          "POUND"
        ]
      },
      {
        "label": "Customer Loyalty",
        "key": "customer_loyalty",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "-Customer Loyalty-",
          "Silver",
          "Gold",
          "Platinum"
        ]
      },
      {
        "label": "Division",
        "key": "division",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "PROFILE",
          "BAFFLE",
          "SOFFIT",
          "FABRICATION",
          "SCRAP",
          "ALUMINIUM"
        ]
      },
      {
        "label": "Lead Source",
        "key": "lead_source",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Telephone",
          "Walk In",
          "Existing Clients",
          "Existing Suppliers",
          "Intec",
          "Indiamart",
          "Tradeindia",
          "Justdial",
          "Prominance",
          "Magazines",
          "Name",
          "Friends"
        ]
      },
      {
        "label": "Preferred Transport",
        "key": "ac-shipper",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "segment",
        "key": "segment",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Industrial",
          "Associates",
          "General",
          "Admin",
          "Capital Assets",
          "Construction",
          "Electrical",
          "Freight",
          "Machinary",
          "Others"
        ]
      },
      {
        "label": "Segment Keyword",
        "key": "segment_keyword",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "sub_segment",
        "key": "sub_segment",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Zigma's Contact Person",
        "key": "sales_contact_id",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "- Assign a contact -",
          "KARTHIK",
          "Manikandan",
          "Mr. Eniyan Shivam S",
          "MUKESH",
          "Venkateswaran",
          "VIJAY"
        ]
      },
      {
        "label": "marketplace",
        "key": "marketplace",
        "type": "select",
        "tab": "General",
        "section": "Market Place",
        "options": []
      },
      {
        "label": "A/c No.",
        "key": "account_number",
        "type": "text",
        "tab": "General",
        "section": "Online App Access / Status",
        "options": []
      },
      {
        "label": "Password",
        "key": "password",
        "type": "text",
        "tab": "General",
        "section": "Online App Access / Status",
        "options": []
      },
      {
        "label": "Pending",
        "key": "status",
        "type": "radio",
        "tab": "General",
        "section": "Online App Access / Status",
        "options": [
          "pending",
          "active",
          "blocked"
        ]
      },
      {
        "label": "Username",
        "key": "username",
        "type": "text",
        "tab": "General",
        "section": "Online App Access / Status",
        "options": []
      },
      {
        "label": "End Time",
        "key": "operation_end_time",
        "type": "select",
        "tab": "General",
        "section": "Online Details",
        "options": [
          "06:00 am",
          "06:15 am",
          "06:30 am",
          "06:45 am",
          "07:00 am",
          "07:15 am",
          "07:30 am",
          "07:45 am",
          "08:00 am",
          "08:15 am",
          "08:30 am",
          "08:45 am"
        ]
      },
      {
        "label": "Online Sale Type",
        "key": "online_sale_type",
        "type": "select",
        "tab": "General",
        "section": "Online Details",
        "options": [
          "RM Out Slip",
          "Delivery Challan",
          "MO",
          "RG Out Slip",
          "FG Out Slip",
          "Crumps Out",
          "Additive Out",
          "Sales Domestic",
          "Scrap Outslip"
        ]
      },
      {
        "label": "Start Time",
        "key": "operation_start_time",
        "type": "select",
        "tab": "General",
        "section": "Online Details",
        "options": [
          "06:00 am",
          "06:15 am",
          "06:30 am",
          "06:45 am",
          "07:00 am",
          "07:15 am",
          "07:30 am",
          "07:45 am",
          "08:00 am",
          "08:15 am",
          "08:30 am",
          "08:45 am"
        ]
      },
      {
        "label": "Warehouse (Online)",
        "key": "online_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Online Details",
        "options": [
          "Zigma(CBE)",
          "QC Pending Warehouse - CBE",
          "Rejected Warehouse - CBE",
          "Stores",
          "Line 1 Work Center WIP",
          "Line 2 Work Center WIP",
          "Line 3 Work Center WIP",
          "Line 4 Work Center WIP",
          "Sanding Work Center WIP",
          "Brushing Work Center WIP",
          "Planning Work Center WIP",
          "Sanding and Brushing Work Center WIP"
        ]
      },
      {
        "label": "Auto Inward",
        "key": "receiving_autoinward",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Default Binlot",
        "key": "default_bin_lot",
        "type": "text",
        "tab": "General",
        "section": "Warehouse Details",
        "options": []
      },
      {
        "label": "Inward Category",
        "key": "receiving_sale_category",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "Purchase",
          "Purchase Returns",
          "Store Request"
        ]
      },
      {
        "label": "Inward Stage",
        "key": "receiving_saledoc_stage",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "Goods in Transit",
          "Gate Entry",
          "GRN Process",
          "QCR",
          "GRN Scan",
          "GRN",
          "GRN (Manual)",
          "Material In",
          "Purchase Inward",
          "Cancelled Orders",
          "Cancelled GRN",
          "Purchase Returns"
        ]
      },
      {
        "label": "Inward Type",
        "key": "receiving_sale_type",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "Regular Purchases",
          "WHS Material In",
          "MI",
          "Import Purchases",
          "RM In Slip",
          "Cash Purchases",
          "FG In Slip",
          "Scrap Inslip",
          "Crumps In",
          "Additive In",
          "RG InSlip"
        ]
      },
      {
        "label": "Receiving Branch",
        "key": "receiving_branch_id",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "CBE"
        ]
      },
      {
        "label": "Receiving Warehosue",
        "key": "receiving_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Warehouse Details",
        "options": [
          "Zigma(CBE)",
          "QC Pending Warehouse - CBE",
          "Rejected Warehouse - CBE",
          "Stores",
          "Line 1 Work Center WIP",
          "Line 2 Work Center WIP",
          "Line 3 Work Center WIP",
          "Line 4 Work Center WIP",
          "Sanding Work Center WIP",
          "Brushing Work Center WIP",
          "Planning Work Center WIP",
          "Sanding and Brushing Work Center WIP"
        ]
      },
      {
        "label": "cell_phone",
        "key": "cell_phone",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "email",
        "key": "email",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "fax",
        "key": "fax",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "home_phone",
        "key": "home_phone",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "job_title",
        "key": "job_title",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "Set as Default contact",
        "key": "default",
        "type": "radio",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": [
          "default"
        ]
      },
      {
        "label": "work_phone",
        "key": "work_phone",
        "type": "text",
        "tab": "Personnel",
        "section": "Contact Information",
        "options": []
      },
      {
        "label": "Requested Datetime",
        "key": "requested_datetime",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Datetime",
        "key": "verified_datetime",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Email",
        "key": "verified_email",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Email Datetime",
        "key": "verified_email_datetime",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Phone No.",
        "key": "verified_phone_no",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Phone No. Datetime",
        "key": "verified_phone_no_datetime",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "Verified Status",
        "key": "verified_status",
        "type": "text",
        "tab": "Personnel",
        "section": "Verification",
        "options": []
      },
      {
        "label": "scanned_resources_UPLOADER",
        "key": "scanned_resources_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      }
    ]
  },
  "item": {
    "moduleName": "Items",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "bom_no_of_lines",
        "key": "bom_no_of_lines",
        "type": "text",
        "tab": "BOM",
        "section": "General",
        "options": []
      },
      {
        "label": "bom_total_amount",
        "key": "bom_total_amount",
        "type": "text",
        "tab": "BOM",
        "section": "General",
        "options": []
      },
      {
        "label": "bom-group",
        "key": "bom-group",
        "type": "select",
        "tab": "BOM",
        "section": "General",
        "options": []
      },
      {
        "label": "bom-group-checkbox-all",
        "key": "bom-group-checkbox-all",
        "type": "checkbox",
        "tab": "BOM",
        "section": "General",
        "options": []
      },
      {
        "label": "default_bom_variant",
        "key": "default_bom_variant",
        "type": "select",
        "tab": "BOM",
        "section": "General",
        "options": [
          "Bom Variant 1"
        ]
      },
      {
        "label": "filter-bom-group",
        "key": "filter-bom-group",
        "type": "select",
        "tab": "BOM",
        "section": "General",
        "options": [
          "Ungrouped"
        ]
      },
      {
        "label": "cost_no_of_lines",
        "key": "cost_no_of_lines",
        "type": "text",
        "tab": "Cost",
        "section": "General",
        "options": []
      },
      {
        "label": "cost_total_amount",
        "key": "cost_total_amount",
        "type": "text",
        "tab": "Cost",
        "section": "General",
        "options": []
      },
      {
        "label": "bom_variant",
        "key": "bom_variant",
        "type": "text",
        "tab": "General",
        "section": "Bom Variants",
        "options": []
      },
      {
        "label": "Access Customer Id",
        "key": "access_customer_id",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Alt Length",
        "key": "alt_length",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Item division",
        "key": "item_division",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "label with Picture",
        "key": "label_with_picture",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Latest Purchase Price",
        "key": "latest_purchase_price",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Latest Purchase Request Date",
        "key": "latest_purchase_request_date",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Length",
        "key": "length",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Line Speed",
        "key": "set_line_speed",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Loss",
        "key": "loss",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Max Weight",
        "key": "max_weight",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Min Weight",
        "key": "min_weight",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "No. of Pieces",
        "key": "no_of_pieces",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Property",
        "key": "property",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Property Type",
        "key": "property_type",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Running Weight",
        "key": "running_weight",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Section Weight",
        "key": "section_weight",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Tare Weight",
        "key": "tare_weight",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Tolerance",
        "key": "tolerance",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "Zigma Item Id",
        "key": "zigma_item_id",
        "type": "input",
        "tab": "General",
        "section": "Custom Specs",
        "options": []
      },
      {
        "label": "BOM Qty Multiplier",
        "key": "bom_qty_multiplier",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Issue Type",
        "key": "issue_type",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Full Unit",
          "Part Unit"
        ]
      },
      {
        "label": "Item Production Type",
        "key": "item_prdn_type",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "All",
          "WPE Additive Production",
          "Lumber Additive Production",
          "WPE Co-Ext. Production",
          "WPE Mono-Ext. Production",
          "Lumber Profile Production",
          "Crumps Production",
          "Filler Masterbatch Production",
          "Scanding Production",
          "Brushing Production",
          "Planning Production",
          "Scanding & Brushing Production"
        ]
      },
      {
        "label": "Item Scancode",
        "key": "scancode",
        "type": "number",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Item Type",
        "key": "item_type",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Profiles",
          "Accessories",
          "Consumables",
          "General Items",
          "HR Items",
          "IT",
          "Stationery Items",
          "Admin",
          "Scrap Item",
          "Blend Item",
          "Maintenance Items",
          "Raw Materials"
        ]
      },
      {
        "label": "Main Category",
        "key": "item_mainCat",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Blend",
          "Blending",
          "Chemicals",
          "Cleaning And Hygiene",
          "Computer Accessories",
          "Devices",
          "Electrical",
          "Fastener",
          "Furniture And Fixtures",
          "General",
          "Instrumentation",
          "Kitchen And Dining"
        ]
      },
      {
        "label": "No of children",
        "key": "no_of_children",
        "type": "number",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Parent",
        "key": "is_parent",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Parent Item ID (Item Groups)",
        "key": "parent_item_id",
        "type": "number",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Pick By",
        "key": "pick_by",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Serial",
          "Quantity"
        ]
      },
      {
        "label": "Pur. Tolerance Max%",
        "key": "pur_tolerance_maxper",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Pur. Tolerance Min%",
        "key": "pur_tolerance_minper",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Scannable",
        "key": "scannable",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "No",
          "Yes"
        ]
      },
      {
        "label": "Series Category",
        "key": "series_category",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L"
        ]
      },
      {
        "label": "Status",
        "key": "item_status",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Current",
          "Obsolete"
        ]
      },
      {
        "label": "Sub Category",
        "key": "item_subCat",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Tolerance By",
        "key": "tolerance_by",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "Value",
          "Percentage"
        ]
      },
      {
        "label": "UPC No.",
        "key": "upc",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Weighable",
        "key": "weighable",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "No",
          "Yes"
        ]
      },
      {
        "label": "Width",
        "key": "width",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Brand",
        "key": "brand",
        "type": "select",
        "tab": "General",
        "section": "Item Info",
        "options": [
          "General",
          "Zigma"
        ]
      },
      {
        "label": "Brand",
        "key": "brand_val",
        "type": "textarea",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Common Name",
        "key": "item_commonname",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "HSN / SAC Code",
        "key": "hsn_code",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Item Alias (Alt. Names)",
        "key": "item_alias",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Item Code",
        "key": "item_code",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Item ID",
        "key": "item_id",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Model",
        "key": "model",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Purchase Description (Optional)",
        "key": "item_purchase_description",
        "type": "textarea",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Sequence",
        "key": "sequence",
        "type": "text",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "Short Description",
        "key": "item_short_description",
        "type": "textarea",
        "tab": "General",
        "section": "Item Info",
        "options": []
      },
      {
        "label": "processes",
        "key": "processes",
        "type": "text",
        "tab": "General",
        "section": "Processes",
        "options": []
      },
      {
        "label": "allocated",
        "key": "allocated",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "available",
        "key": "available",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "Consumable",
        "key": "is_consumable",
        "type": "checkbox",
        "tab": "Inventory",
        "section": "General",
        "options": [
          "consumable"
        ]
      },
      {
        "label": "in_po",
        "key": "in_po",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "indelivery",
        "key": "indelivery",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "Inventory Category",
        "key": "inventory_category",
        "type": "select",
        "tab": "Inventory",
        "section": "General",
        "options": [
          "Direct",
          "Indirect",
          "Asset",
          "Job Work"
        ]
      },
      {
        "label": "invoiced",
        "key": "invoiced",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "max_order_qty",
        "key": "max_order_qty",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "min_order_qty",
        "key": "min_order_qty",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "opening_stock_date_display",
        "key": "opening_stock_date_display",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "opening_stock_qty",
        "key": "opening_stock_qty",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "reorder_level",
        "key": "reorder_level",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "safety_stock_level",
        "key": "safety_stock_level",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "Stock",
        "key": "inventory_type",
        "type": "radio",
        "tab": "Inventory",
        "section": "General",
        "options": [
          "stock",
          "non-stock"
        ]
      },
      {
        "label": "stock_location",
        "key": "stock_location",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "total_in_stock",
        "key": "total_in_stock",
        "type": "text",
        "tab": "Inventory",
        "section": "General",
        "options": []
      },
      {
        "label": "Manufactured",
        "key": "item_manufactured",
        "type": "checkbox",
        "tab": "Inventory",
        "section": "Item can be",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Purchased",
        "key": "item_purchased",
        "type": "checkbox",
        "tab": "Inventory",
        "section": "Item can be",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Service",
        "key": "item_serviced",
        "type": "checkbox",
        "tab": "Inventory",
        "section": "Item can be",
        "options": [
          "yes"
        ]
      },
      {
        "label": "notes",
        "key": "notes",
        "type": "textarea",
        "tab": "Notes",
        "section": "General",
        "options": []
      },
      {
        "label": "Alt Tax Rate",
        "key": "alt_tax_rate",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST"
        ]
      },
      {
        "label": "Alt Units",
        "key": "alt_units_conversion",
        "type": "text",
        "tab": "Prices",
        "section": "General",
        "options": []
      },
      {
        "label": "Alt Units",
        "key": "alt_units",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "Mtr",
          "Nos",
          "Hrs",
          "Set",
          "Kgs",
          "Sqm",
          "Kit",
          "Ltr",
          "Sqft",
          "Unit",
          "Cft",
          "Bags"
        ]
      },
      {
        "label": "List price: (no commas)",
        "key": "list_price",
        "type": "text",
        "tab": "Prices",
        "section": "General",
        "options": []
      },
      {
        "label": "List price: (no commas)",
        "key": "list_price_currency",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "INR",
          "USD",
          "EURO",
          "JPY",
          "POUND"
        ]
      },
      {
        "label": "Pack Size",
        "key": "pack_size",
        "type": "text",
        "tab": "Prices",
        "section": "General",
        "options": []
      },
      {
        "label": "Pack Size Unit",
        "key": "pack_size_unit",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "mtr",
          "nos",
          "hrs",
          "set",
          "kgs",
          "sqm",
          "kit",
          "ltr",
          "sqft",
          "unit",
          "cft",
          "bags"
        ]
      },
      {
        "label": "Tax Rate",
        "key": "tax_rate",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST"
        ]
      },
      {
        "label": "Units",
        "key": "unit",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "mtr",
          "nos",
          "hrs",
          "set",
          "kgs",
          "sqm",
          "kit",
          "ltr",
          "sqft",
          "unit",
          "cft",
          "bags"
        ]
      },
      {
        "label": "Warranty",
        "key": "warranty",
        "type": "select",
        "tab": "Prices",
        "section": "General",
        "options": [
          "- Choose -"
        ]
      },
      {
        "label": "Purchase Date",
        "key": "latest_purchase_date",
        "type": "text",
        "tab": "Prices",
        "section": "Latest Price Dtls",
        "options": []
      },
      {
        "label": "Purchase Ref ID",
        "key": "latest_purchase_ref_id",
        "type": "text",
        "tab": "Prices",
        "section": "Latest Price Dtls",
        "options": []
      },
      {
        "label": "Purchase Supp ID",
        "key": "latest_purchase_supplier_id",
        "type": "text",
        "tab": "Prices",
        "section": "Latest Price Dtls",
        "options": []
      },
      {
        "label": "catalog_UPLOADER",
        "key": "catalog_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "gallery_UPLOADER",
        "key": "gallery_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "picture_UPLOADER",
        "key": "picture_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "technical_drawing_UPLOADER",
        "key": "technical_drawing_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "scrap_no_of_lines",
        "key": "scrap_no_of_lines",
        "type": "text",
        "tab": "Scrap",
        "section": "General",
        "options": []
      },
      {
        "label": "scrap_total_amount",
        "key": "scrap_total_amount",
        "type": "text",
        "tab": "Scrap",
        "section": "General",
        "options": []
      },
      {
        "label": "Length",
        "key": "cmn_profile_length",
        "type": "text",
        "tab": "Specifications",
        "section": "Specifications",
        "options": []
      },
      {
        "label": "Mtrs.",
        "key": "cmn_plan_meters",
        "type": "text",
        "tab": "Specifications",
        "section": "Specifications",
        "options": []
      },
      {
        "label": "Pieces",
        "key": "cmn_packet_pieces",
        "type": "text",
        "tab": "Specifications",
        "section": "Specifications",
        "options": []
      },
      {
        "label": "waste_no_of_lines",
        "key": "waste_no_of_lines",
        "type": "text",
        "tab": "Waste",
        "section": "General",
        "options": []
      },
      {
        "label": "waste_total_amount",
        "key": "waste_total_amount",
        "type": "text",
        "tab": "Waste",
        "section": "General",
        "options": []
      },
      {
        "label": "item_long_description",
        "key": "item_long_description",
        "type": "textarea",
        "tab": "Website",
        "section": "General",
        "options": []
      }
    ]
  },
  "saledoc": {
    "moduleName": "Presales",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "Form Date",
        "key": "form_issue_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_issue_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Date",
        "key": "form_receive_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_receive_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Customer",
        "key": "ac-sales_commission_main_customer",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different bill from:",
        "key": "ac-diff_billfrom",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different Ship from:",
        "key": "ac-diff_shipfrom",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different Ship to:",
        "key": "ac-diff_shipto",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Lead Source",
        "key": "lead_source",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "Telephone",
          "Walk In",
          "Existing Clients",
          "Existing Suppliers",
          "Intec",
          "Indiamart",
          "Tradeindia",
          "Justdial",
          "Prominance",
          "Magazines",
          "Name",
          "Friends"
        ]
      },
      {
        "label": "Sale Contact",
        "key": "sales_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "- Sale Contacts -",
          "KARTHIK",
          "Manikandan",
          "Mr. Eniyan Shivam S",
          "MUKESH",
          "Venkateswaran",
          "VIJAY"
        ]
      },
      {
        "label": "Service Contact",
        "key": "service_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "- Service Contacts -"
        ]
      },
      {
        "label": "Activity ID.",
        "key": "activity_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Customer ID.",
        "key": "base_customer_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order Date.",
        "key": "base_order_date",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order ID.",
        "key": "base_order_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Capex",
        "key": "capex",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Capex Number",
        "key": "capex_purpose",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "000",
          "001",
          "002",
          "003",
          "004",
          "005",
          "006",
          "007",
          "008",
          "009",
          "010",
          "011"
        ]
      },
      {
        "label": "Capex Purpose",
        "key": "capex_number",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Capex",
          "Cab Booking Bill",
          "Canteen Bill",
          "Civil Works",
          "Consumables",
          "Contract Labour Bill",
          "Courier",
          "Duty Charges",
          "E-Devices",
          "Emp.Welfare",
          "Factory Upkeep",
          "Freight"
        ]
      },
      {
        "label": "Check Persons",
        "key": "despatch_checked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO",
        "key": "customer_po_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO Date",
        "key": "customer_po_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer Reference",
        "key": "customer_ref_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note Date",
        "key": "debit_note_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note No.",
        "key": "debit_note_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Declaration",
        "key": "declaration",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Default Disc%",
        "key": "default_discount_per",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Delivery Challan Type",
        "key": "dc_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Returnable",
          "Non-Returnable"
        ]
      },
      {
        "label": "Despatch pkts",
        "key": "despatch_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print By",
        "key": "desptach_print_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print Date & Time",
        "key": "desptach_print_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch qty",
        "key": "despatch_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Remarks",
        "key": "despatch_remarks",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Type",
        "key": "despatch_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Direct",
          "Courier"
        ]
      },
      {
        "label": "Despatch Vehicle Resource",
        "key": "despatch_vehicle_resource",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Destination",
        "key": "destination",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Document Contact: (Name, email)",
        "key": "invoice_contact",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book Date",
        "key": "gateentry_bookdate",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book No.",
        "key": "gateentry_bookno",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Number & Date",
        "key": "indent_number_date",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Receiving Date & Time",
        "key": "indent_receiving_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Interal Ref ID",
        "key": "internal_ref_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice pkts",
        "key": "despatch_invoice_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice qty",
        "key": "despatch_invoice_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice Ref ID",
        "key": "invoice_saledoc_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading End Date & Time",
        "key": "despatch_loading_end_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading Start Date & Time",
        "key": "despatch_loading_start_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Material Received Date & Time",
        "key": "material_received_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Movement Description",
        "key": "gdn_description",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "- Choose -",
          "Trade samples sent to customer for trial",
          "For internal office use",
          "Samples for test purposes",
          "Samples for supply against sales order",
          "Samples for display at exhibitions, fairs and in show-cases",
          "Samples for market inquiries",
          "Stock physical adjustments",
          "Replacement of Defective Items",
          "On Returnable Basis",
          "For Manufacturing",
          "Materials Returned from Production"
        ]
      },
      {
        "label": "Physical Audit pkts",
        "key": "despatch_physical_audit_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Physical Audit qty",
        "key": "despatch_physical_audit_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Pick Persons",
        "key": "despatch_picked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Plastic Component Verification",
        "key": "despatch_plastic_component_verification",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Verified",
          "N/A"
        ]
      },
      {
        "label": "Plastic Component Verified By",
        "key": "despatch_plastic_component_verified_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Print Tracker Status",
        "key": "despatch_print_tracker_status",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Profile Type",
        "key": "profile_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Trail",
          "Black",
          "Autumn Red",
          "Amber Grove",
          "Stomwood Shadow",
          "Copper Wood",
          "Maple Mist",
          "OTHERS"
        ]
      },
      {
        "label": "Quote validity",
        "key": "quote_validity",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Requisitioner Name",
        "key": "requisitioner_name_department",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Sales Order / Invoice Title",
        "key": "so_invoice_title",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "TL Code",
        "key": "capex_tally_code",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Tolerance",
        "key": "tolerance",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Total In Words (Custom Invoice)",
        "key": "totalinwords_custinv",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "branch_id",
        "key": "branch_id",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "CBE"
        ]
      },
      {
        "label": "Doc Date",
        "key": "saledocs_date",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "sales_spec_dtls",
        "key": "sales_spec_dtls",
        "type": "input",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Date",
        "key": "commercial_invoice_date_mod",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note Date",
        "key": "delivery_note_date",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note No",
        "key": "delivery_note_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Destination Warehouse",
        "key": "destination_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "QC Pending Warehouse - CBE",
          "Rejected Warehouse - CBE",
          "Stores",
          "Scrap Yard",
          "Recyclable Scrap",
          "Rejection Warehouse",
          "Trial Warehouse",
          "Crump Bag",
          "Recyclable Blend Scrap",
          "Recycled Chips",
          "Recycling WIP"
        ]
      },
      {
        "label": "Formatted No",
        "key": "sdid",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Invoice Amount",
        "key": "commercial_invoice_amount",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "No",
        "key": "commercial_invoice_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Order Conversion Days",
        "key": "order_conversion_days",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Return No",
        "key": "salesreturn_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Warehouse",
        "key": "warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "Describe the opportunity",
        "key": "opportunity_description",
        "type": "textarea",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "GP %",
        "key": "gross_profit_per",
        "type": "text",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "GP Value",
        "key": "gross_profit_val",
        "type": "text",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "Line of Business (LOB)",
        "key": "segment",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "Need",
        "key": "opportunity_need",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "Immediate",
          "1-3 months",
          "3-6 months",
          ">6 months"
        ]
      },
      {
        "label": "Priority",
        "key": "opportunity_priority",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "Cold",
          "Warm",
          "Hot"
        ]
      },
      {
        "label": "Priority Level",
        "key": "priority",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "0",
          "1",
          "2",
          "3"
        ]
      },
      {
        "label": "Sale Category",
        "key": "sale_category",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "Sales",
          "Sales Return",
          "Store Request",
          "General",
          "Sales Railing",
          "Sales Export",
          "Debit Note",
          "Sales Lumber",
          "Sales WPE",
          "Sales Cladding"
        ]
      },
      {
        "label": "Sale Type",
        "key": "sale_type",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "RM Out Slip",
          "Delivery Challan",
          "MO",
          "RG Out Slip",
          "FG Out Slip",
          "Sales Domestic",
          "Scrap Outslip",
          "Crumps Out",
          "Additive Out"
        ]
      },
      {
        "label": "Segment Keyword",
        "key": "segment_keyword",
        "type": "text",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "Stage",
        "key": "saledoc_type",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": [
          "Pending PI",
          "Confirmed PI",
          "Partially Reserved PI",
          "Fully Reserved PI",
          "Ready for Dispatch",
          "Sales Orders",
          "Dispatch In progress",
          "Store Requests",
          "Approved SR",
          "Purchase Requests",
          "Approved PR",
          "Closed Won"
        ]
      },
      {
        "label": "Sub Segment",
        "key": "sub_segment",
        "type": "select",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "Version No.",
        "key": "version_number",
        "type": "text",
        "tab": "General",
        "section": "Opportunity",
        "options": []
      },
      {
        "label": "Inward Id",
        "key": "inward_id",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Autoinward",
        "key": "destination_autoinward",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Receiving Binlot",
        "key": "destination_bin_lot",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Contact",
        "key": "destination_contact",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Stage",
        "key": "destination_saledoc_stage",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Goods in Transit",
          "Gate Entry",
          "GRN Process",
          "QCR",
          "GRN Scan",
          "GRN",
          "GRN (Manual)",
          "Material In",
          "Purchase Inward",
          "Cancelled Orders",
          "Cancelled GRN",
          "Purchase Returns"
        ]
      },
      {
        "label": "Receiving Type",
        "key": "destination_sale_type",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Regular Purchases",
          "WHS Material In",
          "MI",
          "Import Purchases",
          "RM In Slip",
          "Cash Purchases",
          "FG In Slip",
          "Scrap Inslip",
          "Crumps In",
          "Additive In",
          "RG InSlip"
        ]
      },
      {
        "label": "Restrict Item Transfer",
        "key": "destination_restrict_itemtransfer",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Yes"
        ]
      },
      {
        "label": "Request Department",
        "key": "req_department",
        "type": "select",
        "tab": "General",
        "section": "Requirement",
        "options": [
          "-- Chooose --",
          "Additive MO",
          "Accounts",
          "Warehouse",
          "Stores",
          "Consumables MO",
          "Tooling",
          "Maintenance",
          "ETP",
          "Quality",
          "Crumps MO",
          "HR"
        ]
      },
      {
        "label": "Request Person",
        "key": "req_person",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Date",
        "key": "req_date_display",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Reason",
        "key": "req_reason",
        "type": "textarea",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Time",
        "key": "req_start_time",
        "type": "select",
        "tab": "General",
        "section": "Requirement",
        "options": [
          "--Start--",
          "12:00 am",
          "12:30 am",
          "01:00 am",
          "01:30 am",
          "02:00 am",
          "02:30 am",
          "03:00 am",
          "03:30 am",
          "04:00 am",
          "04:30 am",
          "05:00 am"
        ]
      },
      {
        "label": "altcurrency_conversion_rate",
        "key": "altcurrency_conversion_rate",
        "type": "number",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "altcurrency_total_amount",
        "key": "altcurrency_total_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount",
        "key": "amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount_disp",
        "key": "amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "basic_amount",
        "key": "basic_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Binlot",
        "key": "binlot-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "brand",
        "key": "brand",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Brands"
        ]
      },
      {
        "label": "Disc",
        "key": "disc-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Disc %",
        "key": "saledoc_discount_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "discount",
        "key": "discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "freight",
        "key": "freight",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "insurance",
        "key": "insurance",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "item_type",
        "key": "item_type",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Item Type-",
          "Profiles",
          "Accessories",
          "Consumables",
          "General Items",
          "HR Items",
          "IT",
          "Stationery Items",
          "Admin",
          "Scrap Item",
          "Blend Item",
          "Maintenance Items"
        ]
      },
      {
        "label": "maincat",
        "key": "maincat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Maincat"
        ]
      },
      {
        "label": "price_book",
        "key": "price_book",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "CBE WHS"
        ]
      },
      {
        "label": "Round off",
        "key": "auto-rounded-off",
        "type": "checkbox",
        "tab": "Items",
        "section": "General",
        "options": [
          "1"
        ]
      },
      {
        "label": "rounded_off_price",
        "key": "rounded_off_price",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "saledoc_currency",
        "key": "saledoc_currency",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "INR",
          "USD",
          "EURO",
          "JPY",
          "POUND"
        ]
      },
      {
        "label": "saledoc_discount",
        "key": "saledoc_discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subcat",
        "key": "subcat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Subcat"
        ]
      },
      {
        "label": "subtotal",
        "key": "subtotal",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subtotal_disp",
        "key": "subtotal_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "tax_select_group_selector",
        "key": "tax_select_group_selector",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Tax-",
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST",
          "Clear Taxes"
        ]
      },
      {
        "label": "tcs",
        "key": "tcs",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "TCS %",
        "key": "tcs_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "total_amount_disp",
        "key": "total_amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat",
        "key": "vat",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat_disp",
        "key": "vat_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "notes",
        "key": "notes",
        "type": "textarea",
        "tab": "Notes",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Promise Date",
        "key": "payment_promise_date_display",
        "type": "text",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Remarks",
        "key": "payment_remarks",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Schedule",
        "key": "payment_schedule",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "saledoc_TEMPLATE",
        "key": "saledoc_TEMPLATE",
        "type": "textarea",
        "tab": "PDFs",
        "section": "General",
        "options": []
      },
      {
        "label": "scanned_invoice_UPLOADER",
        "key": "scanned_invoice_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "bom-group",
        "key": "bom-group",
        "type": "select",
        "tab": "Sales Bom",
        "section": "General",
        "options": []
      },
      {
        "label": "bom-group-checkbox-all",
        "key": "bom-group-checkbox-all",
        "type": "checkbox",
        "tab": "Sales Bom",
        "section": "General",
        "options": []
      },
      {
        "label": "filter-bom-group",
        "key": "filter-bom-group",
        "type": "select",
        "tab": "Sales Bom",
        "section": "General",
        "options": [
          "Ungrouped"
        ]
      },
      {
        "label": "sales_bom_no_of_lines",
        "key": "sales_bom_no_of_lines",
        "type": "text",
        "tab": "Sales Bom",
        "section": "General",
        "options": []
      },
      {
        "label": "sales-item",
        "key": "sales-item",
        "type": "select",
        "tab": "Sales Bom",
        "section": "General",
        "options": []
      },
      {
        "label": "packing_terms",
        "key": "packing_terms",
        "type": "textarea",
        "tab": "Terms",
        "section": "Packing Terms",
        "options": []
      },
      {
        "label": "Override Credit Lock",
        "key": "creditlock_override",
        "type": "checkbox",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "bank_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "- Options -"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "payment_details",
        "type": "textarea",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": []
      },
      {
        "label": "Payment Terms",
        "key": "payment_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "100% Advance",
          "Net 30",
          "Net 45",
          "Net 60",
          "30% Adv, Net 30",
          "50% Adv, Net 30",
          "50% Adv, Net 45",
          "50% Adv, Net 60",
          "50% Adv, Net 90",
          "80% Adv, Net 20",
          "80% Adv, Net 30",
          "90% Adv, Net 30"
        ]
      },
      {
        "label": "Delivery Details",
        "key": "estimated_delivery_date",
        "type": "textarea",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Est. Delivery Date",
        "key": "estimated_delivery_date_mod",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Est. Installation Date",
        "key": "estimated_installation_date",
        "type": "textarea",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Shipping Method",
        "key": "shipping_method",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Shipping Terms",
        "key": "shipping_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": [
          "Ex Works",
          "FOB",
          "CIF",
          "CFR",
          "CPT",
          "FCA",
          "DAT",
          "DDP",
          "FOR",
          "CIP",
          "DAP"
        ]
      },
      {
        "label": "Transporter Vehicle No.",
        "key": "transporter_vehicle_no",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "sd_canned_text_db_choices",
        "key": "sd_canned_text_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Terms of SALE",
        "options": [
          "- Options -",
          "Terms Of Purchase NA"
        ]
      },
      {
        "label": "terms_of_document",
        "key": "terms_of_document",
        "type": "textarea",
        "tab": "Terms",
        "section": "Terms of SALE",
        "options": []
      }
    ]
  },
  "ordersaledoc": {
    "moduleName": "Sales & Outwards",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "eWaybill Date",
        "key": "ewaybill_date",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill Number",
        "key": "ewaybill_no",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill PDF",
        "key": "ewaybillpdf",
        "type": "textarea",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill Supply Type",
        "key": "ewaybill_sub_supplytype",
        "type": "select",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": [
          "Supply",
          "Export",
          "Job Work",
          "Recipient not known",
          "For own Use",
          "Exhibition or fairs",
          "Line Sales",
          "SKD/CKD/Lots"
        ]
      },
      {
        "label": "Transport Mode",
        "key": "shipping_mode",
        "type": "select",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": [
          "Road",
          "Rail",
          "Air",
          "Ship"
        ]
      },
      {
        "label": "Transport Mode",
        "key": "shipping_distance",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "Transporter GSTIN",
        "key": "shipper_vat_tin_no",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "Form Date",
        "key": "form_issue_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_issue_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Date",
        "key": "form_receive_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_receive_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Customer",
        "key": "ac-sales_commission_main_customer",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different bill from:",
        "key": "ac-diff_billfrom",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different Ship from:",
        "key": "ac-diff_shipfrom",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Different Ship to:",
        "key": "ac-diff_shipto",
        "type": "text",
        "tab": "General",
        "section": "Customer Information",
        "options": []
      },
      {
        "label": "Lead Source",
        "key": "lead_source",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "Telephone",
          "Walk In",
          "Existing Clients",
          "Existing Suppliers",
          "Intec",
          "Indiamart",
          "Tradeindia",
          "Justdial",
          "Prominance",
          "Magazines",
          "Name",
          "Friends"
        ]
      },
      {
        "label": "Sale Contact",
        "key": "sales_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "- Sale Contacts -",
          "KARTHIK",
          "Manikandan",
          "Mr. Eniyan Shivam S",
          "MUKESH",
          "Venkateswaran",
          "VIJAY"
        ]
      },
      {
        "label": "Service Contact",
        "key": "service_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Customer Information",
        "options": [
          "- Service Contacts -"
        ]
      },
      {
        "label": "Activity ID.",
        "key": "activity_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Customer ID.",
        "key": "base_customer_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order Date.",
        "key": "base_order_date",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order ID.",
        "key": "base_order_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Capex",
        "key": "capex",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Capex Number",
        "key": "capex_purpose",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "000",
          "001",
          "002",
          "003",
          "004",
          "005",
          "006",
          "007",
          "008",
          "009",
          "010",
          "011"
        ]
      },
      {
        "label": "Capex Purpose",
        "key": "capex_number",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Capex",
          "Cab Booking Bill",
          "Canteen Bill",
          "Civil Works",
          "Consumables",
          "Contract Labour Bill",
          "Courier",
          "Duty Charges",
          "E-Devices",
          "Emp.Welfare",
          "Factory Upkeep",
          "Freight"
        ]
      },
      {
        "label": "Check Persons",
        "key": "despatch_checked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO",
        "key": "customer_po_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO Date",
        "key": "customer_po_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer Reference",
        "key": "customer_ref_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note Date",
        "key": "debit_note_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note No.",
        "key": "debit_note_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Declaration",
        "key": "declaration",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Default Disc%",
        "key": "default_discount_per",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Delivery Challan Type",
        "key": "dc_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Returnable",
          "Non-Returnable"
        ]
      },
      {
        "label": "Despatch pkts",
        "key": "despatch_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print By",
        "key": "desptach_print_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print Date & Time",
        "key": "desptach_print_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch qty",
        "key": "despatch_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Remarks",
        "key": "despatch_remarks",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Type",
        "key": "despatch_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Direct",
          "Courier"
        ]
      },
      {
        "label": "Despatch Vehicle Resource",
        "key": "despatch_vehicle_resource",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Destination",
        "key": "destination",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Document Contact: (Name, email)",
        "key": "invoice_contact",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book Date",
        "key": "gateentry_bookdate",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book No.",
        "key": "gateentry_bookno",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Number & Date",
        "key": "indent_number_date",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Receiving Date & Time",
        "key": "indent_receiving_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Interal Ref ID",
        "key": "internal_ref_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice pkts",
        "key": "despatch_invoice_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice qty",
        "key": "despatch_invoice_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice Ref ID",
        "key": "invoice_saledoc_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading End Date & Time",
        "key": "despatch_loading_end_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading Start Date & Time",
        "key": "despatch_loading_start_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Material Received Date & Time",
        "key": "material_received_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Movement Description",
        "key": "gdn_description",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "- Choose -",
          "Trade samples sent to customer for trial",
          "For internal office use",
          "Samples for test purposes",
          "Samples for supply against sales order",
          "Samples for display at exhibitions, fairs and in show-cases",
          "Samples for market inquiries",
          "Stock physical adjustments",
          "Replacement of Defective Items",
          "On Returnable Basis",
          "For Manufacturing",
          "Materials Returned from Production"
        ]
      },
      {
        "label": "Physical Audit pkts",
        "key": "despatch_physical_audit_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Physical Audit qty",
        "key": "despatch_physical_audit_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Pick Persons",
        "key": "despatch_picked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Plastic Component Verification",
        "key": "despatch_plastic_component_verification",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Verified",
          "N/A"
        ]
      },
      {
        "label": "Plastic Component Verified By",
        "key": "despatch_plastic_component_verified_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Print Tracker Status",
        "key": "despatch_print_tracker_status",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Profile Type",
        "key": "profile_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Trail",
          "Black",
          "Autumn Red",
          "Amber Grove",
          "Stomwood Shadow",
          "Copper Wood",
          "Maple Mist",
          "OTHERS"
        ]
      },
      {
        "label": "Quote validity",
        "key": "quote_validity",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Requisitioner Name",
        "key": "requisitioner_name_department",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Sales Order / Invoice Title",
        "key": "so_invoice_title",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "TL Code",
        "key": "capex_tally_code",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Tolerance",
        "key": "tolerance",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Total In Words (Custom Invoice)",
        "key": "totalinwords_custinv",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "branch_id",
        "key": "branch_id",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "CBE"
        ]
      },
      {
        "label": "Doc Date",
        "key": "saledocs_date",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "sales_spec_dtls",
        "key": "sales_spec_dtls",
        "type": "input",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "DC (Add multiple dc's separated by a comma)",
        "key": "merged_ids",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delivery Days Gap",
        "key": "delivery_days_gap",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note Date",
        "key": "delivery_note_date",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note No",
        "key": "delivery_note_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Destination Warehouse",
        "key": "destination_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "QC Pending Warehouse - CBE",
          "Rejected Warehouse - CBE",
          "Stores",
          "Scrap Yard",
          "Recyclable Scrap",
          "Rejection Warehouse",
          "Trial Warehouse",
          "Crump Bag",
          "Recyclable Blend Scrap",
          "Recycled Chips",
          "Recycling WIP"
        ]
      },
      {
        "label": "Formatted Sales Invoice No",
        "key": "sdid",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Invoice Amount",
        "key": "commercial_invoice_amount",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Return No",
        "key": "salesreturn_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Sales Invoice Date",
        "key": "commercial_invoice_date_mod",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Sales Invoice No",
        "key": "commercial_invoice_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Warehouse",
        "key": "warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "Inward Id",
        "key": "inward_id",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Autoinward",
        "key": "destination_autoinward",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Receiving Binlot",
        "key": "destination_bin_lot",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Contact",
        "key": "destination_contact",
        "type": "text",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": []
      },
      {
        "label": "Receiving Stage",
        "key": "destination_saledoc_stage",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Goods in Transit",
          "Gate Entry",
          "GRN Process",
          "QCR",
          "GRN Scan",
          "GRN",
          "GRN (Manual)",
          "Material In",
          "Purchase Inward",
          "Cancelled Orders",
          "Cancelled GRN",
          "Purchase Returns"
        ]
      },
      {
        "label": "Receiving Type",
        "key": "destination_sale_type",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Regular Purchases",
          "WHS Material In",
          "MI",
          "Import Purchases",
          "RM In Slip",
          "Cash Purchases",
          "FG In Slip",
          "Scrap Inslip",
          "Crumps In",
          "Additive In",
          "RG InSlip"
        ]
      },
      {
        "label": "Restrict Item Transfer",
        "key": "destination_restrict_itemtransfer",
        "type": "select",
        "tab": "General",
        "section": "Receiving Warehouse Details",
        "options": [
          "Yes"
        ]
      },
      {
        "label": "Request Department",
        "key": "req_department",
        "type": "select",
        "tab": "General",
        "section": "Requirement",
        "options": [
          "-- Chooose --",
          "Additive MO",
          "Accounts",
          "Warehouse",
          "Stores",
          "Consumables MO",
          "Tooling",
          "Maintenance",
          "ETP",
          "Quality",
          "Crumps MO",
          "HR"
        ]
      },
      {
        "label": "Request Person",
        "key": "req_person",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Date",
        "key": "req_date_display",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Reason",
        "key": "req_reason",
        "type": "textarea",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Time",
        "key": "req_start_time",
        "type": "select",
        "tab": "General",
        "section": "Requirement",
        "options": [
          "--Start--",
          "12:00 am",
          "12:30 am",
          "01:00 am",
          "01:30 am",
          "02:00 am",
          "02:30 am",
          "03:00 am",
          "03:30 am",
          "04:00 am",
          "04:30 am",
          "05:00 am"
        ]
      },
      {
        "label": "Line of Business (LOB)",
        "key": "segment",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": []
      },
      {
        "label": "Need",
        "key": "opportunity_need",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Immediate",
          "1-3 months",
          "3-6 months",
          ">6 months"
        ]
      },
      {
        "label": "Note Type",
        "key": "note_type",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Credit Note (Disc)",
          "Credit Note (Rate Diff)"
        ]
      },
      {
        "label": "Priority",
        "key": "opportunity_priority",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Cold",
          "Warm",
          "Hot"
        ]
      },
      {
        "label": "Priority Level",
        "key": "priority",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "0",
          "1",
          "2",
          "3"
        ]
      },
      {
        "label": "Return Type",
        "key": "return_type",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Credit Note",
          "Internal Return"
        ]
      },
      {
        "label": "Sale Category",
        "key": "sale_category",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Sales",
          "Sales Return",
          "Store Request",
          "General",
          "Sales Railing",
          "Sales Export",
          "Debit Note",
          "Sales Lumber",
          "Sales WPE",
          "Sales Cladding"
        ]
      },
      {
        "label": "Sale Type",
        "key": "sale_type",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "RM Out Slip",
          "Delivery Challan",
          "MO",
          "RG Out Slip",
          "FG Out Slip",
          "Sales Domestic",
          "Scrap Outslip",
          "Crumps Out",
          "Additive Out"
        ]
      },
      {
        "label": "Segment Keyword",
        "key": "segment_keyword",
        "type": "text",
        "tab": "General",
        "section": "Sales",
        "options": []
      },
      {
        "label": "Stage",
        "key": "saledoc_type",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": [
          "Open Orders",
          "Despatch Ready",
          "Shipped",
          "Delivered",
          "Material Out",
          "Cancelled Orders",
          "Cancelled Invoices",
          "Returns",
          "Debit Note",
          "IUT Open Orders",
          "IUT Shipped",
          "IUT Delivered"
        ]
      },
      {
        "label": "Sub Segment",
        "key": "sub_segment",
        "type": "select",
        "tab": "General",
        "section": "Sales",
        "options": []
      },
      {
        "label": "Version No.",
        "key": "version_number",
        "type": "text",
        "tab": "General",
        "section": "Sales",
        "options": []
      },
      {
        "label": "altcurrency_conversion_rate",
        "key": "altcurrency_conversion_rate",
        "type": "number",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "altcurrency_total_amount",
        "key": "altcurrency_total_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount",
        "key": "amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount_disp",
        "key": "amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "basic_amount",
        "key": "basic_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Binlot",
        "key": "binlot-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "brand",
        "key": "brand",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Brands"
        ]
      },
      {
        "label": "Disc",
        "key": "disc-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Disc %",
        "key": "saledoc_discount_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "discount",
        "key": "discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "freight",
        "key": "freight",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "insurance",
        "key": "insurance",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "item_type",
        "key": "item_type",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Item Type-",
          "Profiles",
          "Accessories",
          "Consumables",
          "General Items",
          "HR Items",
          "IT",
          "Stationery Items",
          "Admin",
          "Scrap Item",
          "Blend Item",
          "Maintenance Items"
        ]
      },
      {
        "label": "maincat",
        "key": "maincat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Maincat"
        ]
      },
      {
        "label": "price_book",
        "key": "price_book",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "CBE WHS"
        ]
      },
      {
        "label": "Round off",
        "key": "auto-rounded-off",
        "type": "checkbox",
        "tab": "Items",
        "section": "General",
        "options": [
          "1"
        ]
      },
      {
        "label": "rounded_off_price",
        "key": "rounded_off_price",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "saledoc_currency",
        "key": "saledoc_currency",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "INR",
          "USD",
          "EURO",
          "JPY",
          "POUND"
        ]
      },
      {
        "label": "saledoc_discount",
        "key": "saledoc_discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subcat",
        "key": "subcat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Subcat"
        ]
      },
      {
        "label": "subtotal",
        "key": "subtotal",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subtotal_disp",
        "key": "subtotal_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "tax_select_group_selector",
        "key": "tax_select_group_selector",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Tax-",
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST",
          "Clear Taxes"
        ]
      },
      {
        "label": "tcs",
        "key": "tcs",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "TCS %",
        "key": "tcs_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "total_amount_disp",
        "key": "total_amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat",
        "key": "vat",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat_disp",
        "key": "vat_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "notes",
        "key": "notes",
        "type": "textarea",
        "tab": "Notes",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Promise Date",
        "key": "payment_promise_date_display",
        "type": "text",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Remarks",
        "key": "payment_remarks",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Schedule",
        "key": "payment_schedule",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "ordersaledoc_TEMPLATE",
        "key": "ordersaledoc_TEMPLATE",
        "type": "textarea",
        "tab": "PDFs",
        "section": "General",
        "options": []
      },
      {
        "label": "scanned_invoice_UPLOADER",
        "key": "scanned_invoice_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "Pickup person* (Name, Email and phone number)",
        "key": "pickup_contact",
        "type": "text",
        "tab": "Shipping",
        "section": "Customer Details",
        "options": []
      },
      {
        "label": "Shipping Address",
        "key": "shipping_address_readonly",
        "type": "textarea",
        "tab": "Shipping",
        "section": "Customer Details",
        "options": []
      },
      {
        "label": "Country of Origin",
        "key": "country_of_origin",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Despatch Date",
        "key": "despatch_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Est. Delivery Date",
        "key": "est_delivery_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Freight",
        "key": "cust_shipping_instruction",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Freight Amount (in )",
        "key": "freight_amount",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Packing",
        "key": "ship_packing",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Partial Shipment",
        "key": "ship_partialshipment",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Count",
        "key": "shipping_count",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Dimensions",
        "key": "shipping_dimensions",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Weight",
        "key": "shipping_weight",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Transhipment",
        "key": "ship_transhipment",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Warranty",
        "key": "ship_warranty",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Waybill Date (LR Date)",
        "key": "waybill_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Waybill Number (LR No.)",
        "key": "waybill_number",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Transporter Driver Information (Name and phone number)",
        "key": "driver_info",
        "type": "text",
        "tab": "Shipping",
        "section": "Transporter Details",
        "options": []
      },
      {
        "label": "Vehicle info (not for ewaybill) (Make, Model and Vehicle number)",
        "key": "vehicle_info",
        "type": "text",
        "tab": "Shipping",
        "section": "Transporter Details",
        "options": []
      },
      {
        "label": "packing_terms",
        "key": "packing_terms",
        "type": "textarea",
        "tab": "Terms",
        "section": "Packing Terms",
        "options": []
      },
      {
        "label": "Override Credit Lock",
        "key": "creditlock_override",
        "type": "checkbox",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "bank_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "- Options -"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "payment_details",
        "type": "textarea",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": []
      },
      {
        "label": "Payment Terms",
        "key": "payment_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "100% Advance",
          "Net 30",
          "Net 45",
          "Net 60",
          "30% Adv, Net 30",
          "50% Adv, Net 30",
          "50% Adv, Net 45",
          "50% Adv, Net 60",
          "50% Adv, Net 90",
          "80% Adv, Net 20",
          "80% Adv, Net 30",
          "90% Adv, Net 30"
        ]
      },
      {
        "label": "Delivery Details",
        "key": "estimated_delivery_date",
        "type": "textarea",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Est. Delivery Date",
        "key": "estimated_delivery_date_mod",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Est. Installation Date",
        "key": "estimated_installation_date",
        "type": "textarea",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Shipping Method",
        "key": "shipping_method",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Shipping Terms",
        "key": "shipping_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": [
          "Ex Works",
          "FOB",
          "CIF",
          "CFR",
          "CPT",
          "FCA",
          "DAT",
          "DDP",
          "FOR",
          "CIP",
          "DAP"
        ]
      },
      {
        "label": "Transporter Vehicle No.",
        "key": "transporter_vehicle_no",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "sd_canned_text_db_choices",
        "key": "sd_canned_text_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Terms of SALE",
        "options": [
          "- Options -",
          "Terms Of Purchase NA"
        ]
      },
      {
        "label": "terms_of_document",
        "key": "terms_of_document",
        "type": "textarea",
        "tab": "Terms",
        "section": "Terms of SALE",
        "options": []
      }
    ]
  },
  "indentsaledoc": {
    "moduleName": "Indents",
    "available": false,
    "reason": "No add button found. Candidates: []",
    "fields": []
  },
  "purchasesaledoc": {
    "moduleName": "Purchases & Inwards",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "eWaybill Date",
        "key": "ewaybill_date",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill Number",
        "key": "ewaybill_no",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill PDF",
        "key": "ewaybillpdf",
        "type": "textarea",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "eWaybill Supply Type",
        "key": "ewaybill_sub_supplytype",
        "type": "select",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": [
          "Supply",
          "Export",
          "Job Work",
          "Recipient not known",
          "For own Use",
          "Exhibition or fairs",
          "Line Sales",
          "SKD/CKD/Lots"
        ]
      },
      {
        "label": "Transport Mode",
        "key": "shipping_mode",
        "type": "select",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": [
          "Road",
          "Rail",
          "Air",
          "Ship"
        ]
      },
      {
        "label": "Transport Mode",
        "key": "shipping_distance",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "Transporter GSTIN",
        "key": "shipper_vat_tin_no",
        "type": "text",
        "tab": "Forms",
        "section": "ewaybill Details",
        "options": []
      },
      {
        "label": "Form Date",
        "key": "form_issue_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_issue_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to issue",
        "options": []
      },
      {
        "label": "Form Date",
        "key": "form_receive_date",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Form Number",
        "key": "form_receive_number",
        "type": "text",
        "tab": "Forms",
        "section": "Forms to receive",
        "options": []
      },
      {
        "label": "Line of Business (LOB)",
        "key": "segment",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": []
      },
      {
        "label": "Need",
        "key": "opportunity_need",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Immediate",
          "1-3 months",
          "3-6 months",
          ">6 months"
        ]
      },
      {
        "label": "Note Type",
        "key": "note_type",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Debit Note (Disc)",
          "Debit Note (Rate Diff)"
        ]
      },
      {
        "label": "Priority",
        "key": "opportunity_priority",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Cold",
          "Warm",
          "Hot"
        ]
      },
      {
        "label": "Priority Level",
        "key": "priority",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "0",
          "1",
          "2",
          "3"
        ]
      },
      {
        "label": "Purchase Category",
        "key": "sale_category",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Purchase",
          "Purchase Returns",
          "Store Request"
        ]
      },
      {
        "label": "Purchase Type",
        "key": "sale_type",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Regular Purchases",
          "WHS Material In",
          "MI",
          "Import Purchases",
          "RM In Slip",
          "Cash Purchases",
          "FG In Slip",
          "Scrap Inslip",
          "Crumps In",
          "Additive In",
          "RG InSlip"
        ]
      },
      {
        "label": "Return Type",
        "key": "return_type",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Regular Purchases",
          "WHS Material In",
          "MI",
          "Import Purchases",
          "RM In Slip",
          "Cash Purchases"
        ]
      },
      {
        "label": "Segment Keyword",
        "key": "segment_keyword",
        "type": "text",
        "tab": "General",
        "section": "Bills",
        "options": []
      },
      {
        "label": "Stage",
        "key": "saledoc_type",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": [
          "Goods in Transit",
          "Gate Entry",
          "GRN Process",
          "QCR",
          "GRN Scan",
          "GRN",
          "GRN (Manual)",
          "Material In",
          "Purchase Inward",
          "Cancelled Orders",
          "Cancelled GRN",
          "Purchase Returns"
        ]
      },
      {
        "label": "Sub Segment",
        "key": "sub_segment",
        "type": "select",
        "tab": "General",
        "section": "Bills",
        "options": []
      },
      {
        "label": "Version No.",
        "key": "version_number",
        "type": "text",
        "tab": "General",
        "section": "Bills",
        "options": []
      },
      {
        "label": "Activity ID.",
        "key": "activity_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Customer ID.",
        "key": "base_customer_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order Date.",
        "key": "base_order_date",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Base Order ID.",
        "key": "base_order_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Capex",
        "key": "capex",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Capex Number",
        "key": "capex_purpose",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "000",
          "001",
          "002",
          "003",
          "004",
          "005",
          "006",
          "007",
          "008",
          "009",
          "010",
          "011"
        ]
      },
      {
        "label": "Capex Purpose",
        "key": "capex_number",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Capex",
          "Cab Booking Bill",
          "Canteen Bill",
          "Civil Works",
          "Consumables",
          "Contract Labour Bill",
          "Courier",
          "Duty Charges",
          "E-Devices",
          "Emp.Welfare",
          "Factory Upkeep",
          "Freight"
        ]
      },
      {
        "label": "Check Persons",
        "key": "despatch_checked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO",
        "key": "customer_po_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer PO Date",
        "key": "customer_po_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Customer Reference",
        "key": "customer_ref_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note Date",
        "key": "debit_note_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Debit Note No.",
        "key": "debit_note_no",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Declaration",
        "key": "declaration",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Default Disc%",
        "key": "default_discount_per",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Delivery Challan Type",
        "key": "dc_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Returnable",
          "Non-Returnable"
        ]
      },
      {
        "label": "Despatch pkts",
        "key": "despatch_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print By",
        "key": "desptach_print_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Print Date & Time",
        "key": "desptach_print_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch qty",
        "key": "despatch_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Remarks",
        "key": "despatch_remarks",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Despatch Type",
        "key": "despatch_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Direct",
          "Courier"
        ]
      },
      {
        "label": "Despatch Vehicle Resource",
        "key": "despatch_vehicle_resource",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Destination",
        "key": "destination",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Document Contact: (Name, email)",
        "key": "invoice_contact",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book Date",
        "key": "gateentry_bookdate",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Gate Entry Book No.",
        "key": "gateentry_bookno",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Number & Date",
        "key": "indent_number_date",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Indent Receiving Date & Time",
        "key": "indent_receiving_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Interal Ref ID",
        "key": "internal_ref_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice pkts",
        "key": "despatch_invoice_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice qty",
        "key": "despatch_invoice_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Invoice Ref ID",
        "key": "invoice_saledoc_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading End Date & Time",
        "key": "despatch_loading_end_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Loading Start Date & Time",
        "key": "despatch_loading_start_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Material Received Date & Time",
        "key": "material_received_datetime",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Movement Description",
        "key": "gdn_description",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "- Choose -",
          "Trade samples sent to customer for trial",
          "For internal office use",
          "Samples for test purposes",
          "Samples for supply against sales order",
          "Samples for display at exhibitions, fairs and in show-cases",
          "Samples for market inquiries",
          "Stock physical adjustments",
          "Replacement of Defective Items",
          "On Returnable Basis",
          "For Manufacturing",
          "Materials Returned from Production"
        ]
      },
      {
        "label": "Physical Audit pkts",
        "key": "despatch_physical_audit_packets",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Physical Audit qty",
        "key": "despatch_physical_audit_qty",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Pick Persons",
        "key": "despatch_picked_person",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Plastic Component Verification",
        "key": "despatch_plastic_component_verification",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Verified",
          "N/A"
        ]
      },
      {
        "label": "Plastic Component Verified By",
        "key": "despatch_plastic_component_verified_by",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "PO Ref#",
        "key": "opportunity_id",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Presales Ref#",
        "key": "term",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Print Tracker Status",
        "key": "despatch_print_tracker_status",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Profile Type",
        "key": "profile_type",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "Trail",
          "Black",
          "Autumn Red",
          "Amber Grove",
          "Stomwood Shadow",
          "Copper Wood",
          "Maple Mist",
          "OTHERS"
        ]
      },
      {
        "label": "Quote validity",
        "key": "quote_validity",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Requisitioner Name",
        "key": "requisitioner_name_department",
        "type": "textarea",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Sales Order / Invoice Title",
        "key": "so_invoice_title",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Scan Qty",
        "key": "scan_qty",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Supplier Doc. Date",
        "key": "reference_date_display",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Supplier Reference No. (eg. Quote no., DC, Proforma, email)",
        "key": "reference",
        "type": "text",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "TL Code",
        "key": "capex_tally_code",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Tolerance",
        "key": "tolerance",
        "type": "select",
        "tab": "General",
        "section": "Details",
        "options": [
          "yes",
          "no"
        ]
      },
      {
        "label": "Total In Words (Custom Invoice)",
        "key": "totalinwords_custinv",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Zigma Grn Date",
        "key": "zigma_grn_date",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "Zigma Grn No",
        "key": "zigma_grn_no",
        "type": "input",
        "tab": "General",
        "section": "Details",
        "options": []
      },
      {
        "label": "branch_id",
        "key": "branch_id",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "CBE"
        ]
      },
      {
        "label": "Doc Date",
        "key": "saledocs_date",
        "type": "text",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "sales_spec_dtls",
        "key": "sales_spec_dtls",
        "type": "input",
        "tab": "General",
        "section": "General",
        "options": []
      },
      {
        "label": "Accepted Warehouse",
        "key": "accepted_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "DC (Add multiple dc's separated by a comma)",
        "key": "merged_ids",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delivery Days Gap",
        "key": "delivery_days_gap",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note Date",
        "key": "delivery_note_date",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Delviery Note No",
        "key": "delivery_note_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Formatted Purchase Bill No",
        "key": "sdid",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Gate Entry Datetime",
        "key": "gateentry_datetime",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Gate Entry No",
        "key": "gateentry_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Invoice Amount",
        "key": "commercial_invoice_amount",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Order Rating",
        "key": "order_delivery_rating",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "- Choose -",
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10"
        ]
      },
      {
        "label": "Purchase Bill Date",
        "key": "commercial_invoice_date_mod",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Purchase Bill No",
        "key": "commercial_invoice_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Rejected Warehouse",
        "key": "rejected_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "Return No",
        "key": "salesreturn_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Source Warehouse",
        "key": "source_warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "Supplier Invoice Date",
        "key": "supplier_invoice_date",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Supplier Invoice No",
        "key": "supplier_invoice_no",
        "type": "text",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": []
      },
      {
        "label": "Warehouse",
        "key": "warehouse",
        "type": "select",
        "tab": "General",
        "section": "Invoice / Order details",
        "options": [
          "Zigma(CBE)",
          "Stores",
          "Recyclable Scrap",
          "Scrap Yard",
          "Trial Warehouse",
          "Blending RM WIP",
          "Granulation WIP",
          "Blend WIP",
          "Crump Bag",
          "Production WIP",
          "Recyclable Blend Scrap",
          "Recycled Chips"
        ]
      },
      {
        "label": "Request Department",
        "key": "req_department",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Request Person",
        "key": "req_person",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Date",
        "key": "req_date_display",
        "type": "text",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Reason",
        "key": "req_reason",
        "type": "textarea",
        "tab": "General",
        "section": "Requirement",
        "options": []
      },
      {
        "label": "Required Time",
        "key": "req_start_time",
        "type": "select",
        "tab": "General",
        "section": "Requirement",
        "options": [
          "--Start--",
          "12:00 am",
          "12:30 am",
          "01:00 am",
          "01:30 am",
          "02:00 am",
          "02:30 am",
          "03:00 am",
          "03:30 am",
          "04:00 am",
          "04:30 am",
          "05:00 am"
        ]
      },
      {
        "label": "Different bill from:",
        "key": "ac-diff_billfrom",
        "type": "text",
        "tab": "General",
        "section": "Supplier Information",
        "options": []
      },
      {
        "label": "Different Ship from:",
        "key": "ac-diff_shipfrom",
        "type": "text",
        "tab": "General",
        "section": "Supplier Information",
        "options": []
      },
      {
        "label": "Different Ship to:",
        "key": "ac-diff_shipto",
        "type": "text",
        "tab": "General",
        "section": "Supplier Information",
        "options": []
      },
      {
        "label": "Lead Source",
        "key": "lead_source",
        "type": "select",
        "tab": "General",
        "section": "Supplier Information",
        "options": [
          "Telephone",
          "Walk In",
          "Existing Clients",
          "Existing Suppliers",
          "Intec",
          "Indiamart",
          "Tradeindia",
          "Justdial",
          "Prominance",
          "Magazines",
          "Name",
          "Friends"
        ]
      },
      {
        "label": "Purchase Contact",
        "key": "sales_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Supplier Information",
        "options": [
          "- Sale Contacts -",
          "KARTHIK",
          "Manikandan",
          "Mr. Eniyan Shivam S",
          "MUKESH",
          "Venkateswaran",
          "VIJAY"
        ]
      },
      {
        "label": "Service Contact",
        "key": "service_contact_id",
        "type": "select",
        "tab": "General",
        "section": "Supplier Information",
        "options": [
          "- Service Contacts -"
        ]
      },
      {
        "label": "Supplier",
        "key": "ac-sales_commission_main_customer",
        "type": "text",
        "tab": "General",
        "section": "Supplier Information",
        "options": []
      },
      {
        "label": "altcurrency_conversion_rate",
        "key": "altcurrency_conversion_rate",
        "type": "number",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "altcurrency_total_amount",
        "key": "altcurrency_total_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount",
        "key": "amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "amount_disp",
        "key": "amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "basic_amount",
        "key": "basic_amount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Binlot",
        "key": "binlot-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "brand",
        "key": "brand",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Brands"
        ]
      },
      {
        "label": "Disc",
        "key": "disc-selector",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "Disc %",
        "key": "saledoc_discount_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "discount",
        "key": "discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "freight",
        "key": "freight",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "insurance",
        "key": "insurance",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "item_type",
        "key": "item_type",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Item Type-",
          "Profiles",
          "Accessories",
          "Consumables",
          "General Items",
          "HR Items",
          "IT",
          "Stationery Items",
          "Admin",
          "Scrap Item",
          "Blend Item",
          "Maintenance Items"
        ]
      },
      {
        "label": "maincat",
        "key": "maincat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Maincat"
        ]
      },
      {
        "label": "Round off",
        "key": "auto-rounded-off",
        "type": "checkbox",
        "tab": "Items",
        "section": "General",
        "options": [
          "1"
        ]
      },
      {
        "label": "rounded_off_price",
        "key": "rounded_off_price",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "saledoc_currency",
        "key": "saledoc_currency",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "INR",
          "USD",
          "EURO",
          "JPY",
          "POUND"
        ]
      },
      {
        "label": "saledoc_discount",
        "key": "saledoc_discount",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subcat",
        "key": "subcat",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Subcat"
        ]
      },
      {
        "label": "subtotal",
        "key": "subtotal",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "subtotal_disp",
        "key": "subtotal_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "tax_select_group_selector",
        "key": "tax_select_group_selector",
        "type": "select",
        "tab": "Items",
        "section": "General",
        "options": [
          "-Tax-",
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST",
          "Clear Taxes"
        ]
      },
      {
        "label": "tcs",
        "key": "tcs",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "TCS %",
        "key": "tcs_per",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "total_amount_disp",
        "key": "total_amount_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat",
        "key": "vat",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "vat_disp",
        "key": "vat_disp",
        "type": "text",
        "tab": "Items",
        "section": "General",
        "options": []
      },
      {
        "label": "notes",
        "key": "notes",
        "type": "textarea",
        "tab": "Notes",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Promise Date",
        "key": "payment_promise_date_display",
        "type": "text",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Remarks",
        "key": "payment_remarks",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "Payment Schedule",
        "key": "payment_schedule",
        "type": "textarea",
        "tab": "Payments",
        "section": "General",
        "options": []
      },
      {
        "label": "purchasesaledoc_TEMPLATE",
        "key": "purchasesaledoc_TEMPLATE",
        "type": "textarea",
        "tab": "PDFs",
        "section": "General",
        "options": []
      },
      {
        "label": "scanned_invoice_UPLOADER",
        "key": "scanned_invoice_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      },
      {
        "label": "Pickup person* (Name, Email and phone number)",
        "key": "pickup_contact",
        "type": "text",
        "tab": "Shipping",
        "section": "Customer Details",
        "options": []
      },
      {
        "label": "Shipping Address",
        "key": "shipping_address_readonly",
        "type": "textarea",
        "tab": "Shipping",
        "section": "Customer Details",
        "options": []
      },
      {
        "label": "Country of Origin",
        "key": "country_of_origin",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Despatch Date",
        "key": "despatch_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Est. Delivery Date",
        "key": "est_delivery_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Freight",
        "key": "cust_shipping_instruction",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Freight Amount (in )",
        "key": "freight_amount",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Packing",
        "key": "ship_packing",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Partial Shipment",
        "key": "ship_partialshipment",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Count",
        "key": "shipping_count",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Dimensions",
        "key": "shipping_dimensions",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Shipping Weight",
        "key": "shipping_weight",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Transhipment",
        "key": "ship_transhipment",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Warranty",
        "key": "ship_warranty",
        "type": "input",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Waybill Date (LR Date)",
        "key": "waybill_date_display",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Waybill Number (LR No.)",
        "key": "waybill_number",
        "type": "text",
        "tab": "Shipping",
        "section": "Shipment",
        "options": []
      },
      {
        "label": "Transporter Driver Information (Name and phone number)",
        "key": "driver_info",
        "type": "text",
        "tab": "Shipping",
        "section": "Transporter Details",
        "options": []
      },
      {
        "label": "Vehicle info (not for ewaybill) (Make, Model and Vehicle number)",
        "key": "vehicle_info",
        "type": "text",
        "tab": "Shipping",
        "section": "Transporter Details",
        "options": []
      },
      {
        "label": "packing_terms",
        "key": "packing_terms",
        "type": "textarea",
        "tab": "Terms",
        "section": "Packing Terms",
        "options": []
      },
      {
        "label": "Override Credit Lock",
        "key": "creditlock_override",
        "type": "checkbox",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "yes"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "bank_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "- Options -"
        ]
      },
      {
        "label": "Payment Details: (Please make sure each detail is in a separate line)",
        "key": "payment_details",
        "type": "textarea",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": []
      },
      {
        "label": "Payment Terms",
        "key": "payment_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Payment Terms",
        "options": [
          "100% Advance",
          "Net 30",
          "Net 45",
          "Net 60",
          "30% Adv, Net 30",
          "50% Adv, Net 30",
          "50% Adv, Net 45",
          "50% Adv, Net 60",
          "50% Adv, Net 90",
          "80% Adv, Net 20",
          "80% Adv, Net 30",
          "90% Adv, Net 30"
        ]
      },
      {
        "label": "Despatch Details",
        "key": "requested_delivery_date",
        "type": "textarea",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Preffered Shipper",
        "key": "preferred_shipper",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Requested Despatch Date",
        "key": "requested_delivery_date_mod",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "Shipping Terms",
        "key": "shipping_terms",
        "type": "select",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": [
          "Ex Works",
          "FOB",
          "CIF",
          "CFR",
          "CPT",
          "FCA",
          "DAT",
          "DDP",
          "FOR",
          "CIP",
          "DAP"
        ]
      },
      {
        "label": "Transporter Vehicle No.",
        "key": "transporter_vehicle_no",
        "type": "text",
        "tab": "Terms",
        "section": "Shipping Terms",
        "options": []
      },
      {
        "label": "sd_canned_text_db_choices",
        "key": "sd_canned_text_db_choices",
        "type": "select",
        "tab": "Terms",
        "section": "Terms of PURCHASE",
        "options": [
          "- Options -",
          "Terms Of Purchase NA"
        ]
      },
      {
        "label": "terms_of_document",
        "key": "terms_of_document",
        "type": "textarea",
        "tab": "Terms",
        "section": "Terms of PURCHASE",
        "options": []
      }
    ]
  },
  "payment": {
    "moduleName": "Payments",
    "available": true,
    "reason": "",
    "fields": [
      {
        "label": "Amount",
        "key": "payment_amount_beforetaxes",
        "type": "text",
        "tab": "General",
        "section": "Allocations",
        "options": []
      },
      {
        "label": "Has Taxes",
        "key": "has-taxes",
        "type": "checkbox",
        "tab": "General",
        "section": "Allocations",
        "options": [
          "1"
        ]
      },
      {
        "label": "Round Off",
        "key": "rounded_off_price",
        "type": "text",
        "tab": "General",
        "section": "Allocations",
        "options": []
      },
      {
        "label": "Search a contact or account as you type Close",
        "key": "c",
        "type": "text",
        "tab": "General",
        "section": "Allocations",
        "options": []
      },
      {
        "label": "Search a contact or account as you type Close",
        "key": "invoiceallocdtls",
        "type": "textarea",
        "tab": "General",
        "section": "Allocations",
        "options": []
      },
      {
        "label": "Tax",
        "key": "tax_rate",
        "type": "select",
        "tab": "General",
        "section": "Allocations",
        "options": [
          "5% GST",
          "12% GST",
          "18% GST",
          "28% GST",
          "3% GST"
        ]
      },
      {
        "label": "Tax",
        "key": "tax_amt",
        "type": "text",
        "tab": "General",
        "section": "Allocations",
        "options": []
      },
      {
        "label": "Expense",
        "key": "expense_type",
        "type": "select",
        "tab": "General",
        "section": "Expenses",
        "options": []
      },
      {
        "label": "Expense Category",
        "key": "expense_category",
        "type": "select",
        "tab": "General",
        "section": "Expenses",
        "options": []
      },
      {
        "label": "branch_id",
        "key": "branch_id",
        "type": "select",
        "tab": "General",
        "section": "General",
        "options": [
          "CBE"
        ]
      },
      {
        "label": "Search as you type (Hold account)",
        "key": "hc",
        "type": "text",
        "tab": "General",
        "section": "Payment Details",
        "options": []
      },
      {
        "label": "Account",
        "key": "contra_account",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": [
          "Cash on Hand",
          "Cheque Received",
          "Cheque Deposited",
          "Credit Note",
          "Debit Note",
          "Discount Allowed",
          "Discount Received",
          "Credits Available",
          "Debits Available",
          "Inward Cheque Return",
          "Outward Cheque Return",
          "Roundoff"
        ]
      },
      {
        "label": "Amount",
        "key": "payment_amount-disp",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Bank Name",
        "key": "cheque_bank",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Cheque #",
        "key": "cheque_no",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Cheque Dt",
        "key": "cheque_date_display",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "External Reference Number",
        "key": "ext_ref_no",
        "type": "input",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "is_expense",
        "key": "is_expense",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Mode of Payment",
        "key": "payment_mode",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": [
          "NEFT",
          "IMPS",
          "RTGS",
          "Wire Transfer",
          "Online Transfer",
          "UPI",
          "Branch Transfer",
          "ECS",
          "Cash",
          "Cheque",
          "Demand Draft",
          "Card"
        ]
      },
      {
        "label": "Pay Type",
        "key": "pay_type",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": [
          "Receipts"
        ]
      },
      {
        "label": "Payment Date",
        "key": "payment_date_display",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Payment Notes",
        "key": "payment_notes",
        "type": "input",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Payment Schedule",
        "key": "payment_schedule",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "Payment Type",
        "key": "payment_type-disp",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": [
          "Receipts",
          "Payments",
          "Credit Notes",
          "Debit Notes",
          "Journals",
          "Contra",
          "Expenses"
        ]
      },
      {
        "label": "Project ID",
        "key": "term",
        "type": "input",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "To Account",
        "key": "cc",
        "type": "text",
        "tab": "General",
        "section": "Payment Info",
        "options": []
      },
      {
        "label": "To Account",
        "key": "t-account",
        "type": "select",
        "tab": "General",
        "section": "Payment Info",
        "options": [
          "Cash on Hand",
          "Cheque Received",
          "Cheque Deposited",
          "Credit Note",
          "Debit Note",
          "Discount Allowed",
          "Discount Received",
          "Credits Available",
          "Debits Available",
          "Inward Cheque Return",
          "Outward Cheque Return",
          "Roundoff"
        ]
      },
      {
        "label": "scanned_payment_receipt_UPLOADER",
        "key": "scanned_payment_receipt_UPLOADER",
        "type": "file",
        "tab": "Resources",
        "section": "General",
        "options": []
      }
    ]
  },
  "production": {
    "moduleName": "Production",
    "available": false,
    "reason": "No add button found. Candidates: []",
    "fields": []
  }
};
