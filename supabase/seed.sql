-- Seed: one sample company (client) and one sample item/service

insert into companies (
  company_name, gstin, email, phone,
  address_line_1, address_line_2, city, state, pincode, country,
  is_client, is_supplier
) values (
  'Acme Pvt Ltd',
  '27AABCU9603R1ZX',
  'billing@acmepvt.in',
  '+91-9876543210',
  '101, Lotus Tower',
  'Linking Road, Bandra West',
  'Mumbai',
  'Maharashtra',
  '400050',
  'India',
  true,
  false
);

insert into items (
  item_name, description, hsn_sac, unit, default_rate, gst_percent, category
) values (
  'Screen Printing Service',
  'Full-colour screen printing on garments – per piece rate',
  '998912',
  'PCS',
  150.00,
  18,
  'Printing Services'
);
